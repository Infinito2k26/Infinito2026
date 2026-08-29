import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { SubmitPaymentDto, VerifyPaymentDto } from './dto/payments.dto';

const ALLOWED_LIST_STATUSES: PaymentStatus[] = [
  'INITIATED',
  'RECONCILIATION_PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
];

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    @InjectQueue('payment-confirmed')
    private readonly paymentConfirmedQueue: Queue,
  ) {}

  async submitPayment(
    userId: string,
    dto: SubmitPaymentDto,
    file: Express.Multer.File,
  ) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: dto.registrationId },
      include: { team: { select: { captainId: true } } },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const isOwner =
      registration.userId === userId || registration.team?.captainId === userId;

    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to pay for this registration',
      );
    }

    if (registration.status !== 'PENDING_PAYMENT') {
      throw new ConflictException(
        `Registration is not awaiting payment (current status: ${registration.status})`,
      );
    }

    const uploaded = await this.uploadsService.uploadProof(
      file.buffer,
      file.mimetype,
      'payment-proof',
    );

    return this.prisma.$transaction(async (tx) => {
      const replay = await tx.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (replay) {
        return replay;
      }

      const activePayment = await tx.payment.findFirst({
        where: {
          registrationId: dto.registrationId,
          status: { in: ['RECONCILIATION_PENDING', 'SUCCESS'] },
        },
      });
      if (activePayment) {
        throw new ConflictException(
          'A payment for this registration is already submitted or confirmed',
        );
      }

      // Registration creates this stub row (mode = MANUAL_SCREENSHOT, status =
      // INITIATED, amount computed from Event.feeStructure) at registration time.
      // Payments never computes the fee itself — that stays Registration's job.
      const stub = await tx.payment.findFirst({
        where: {
          registrationId: dto.registrationId,
          status: 'INITIATED',
          mode: 'MANUAL_SCREENSHOT',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!stub) {
        throw new NotFoundException(
          'No pending payment record found for this registration',
        );
      }

      const updated = await tx.payment.updateMany({
        where: { id: stub.id, status: 'INITIATED' },
        data: {
          status: 'RECONCILIATION_PENDING',
          screenshotUrl: uploaded.key,
          transactionId: dto.transactionId,
          idempotencyKey: dto.idempotencyKey,
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Payment record changed concurrently, please retry',
        );
      }

      return tx.payment.findUniqueOrThrow({ where: { id: stub.id } });
    });
  }

  async listPayments(page = 1, limit = 20, status?: string) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * limit;

    const resolvedStatus = status ?? 'RECONCILIATION_PENDING';
    if (!ALLOWED_LIST_STATUSES.includes(resolvedStatus as PaymentStatus)) {
      throw new BadRequestException(
        `Invalid payment status. Allowed values: ${ALLOWED_LIST_STATUSES.join(', ')}`,
      );
    }

    const where = { status: resolvedStatus as PaymentStatus };

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'asc' },
        select: {
          id: true,
          amount: true,
          mode: true,
          status: true,
          screenshotUrl: true,
          transactionId: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
          registration: {
            select: {
              id: true,
              status: true,
              event: { select: { id: true, name: true } },
              user: { select: { id: true, name: true, email: true } },
              team: {
                select: {
                  id: true,
                  name: true,
                  captain: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((payment) => ({
        ...payment,
        screenshotUrl: payment.screenshotUrl
          ? this.uploadsService.getSignedGetUrl(payment.screenshotUrl)
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyPayment(
    paymentId: string,
    dto: VerifyPaymentDto,
    adminId: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Compare-and-swap: only a payment still under manual review can be verified.
      const updated = await tx.payment.updateMany({
        where: { id: paymentId, status: 'RECONCILIATION_PENDING' },
        data: {
          status: dto.status,
          rejectionReason: dto.status === 'FAILED' ? dto.rejectionReason : null,
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Payment could not be verified. It may not exist or is no longer pending review.',
        );
      }

      if (dto.status === 'SUCCESS') {
        const registrationUpdate = await tx.registration.updateMany({
          where: { id: payment.registrationId, status: 'PENDING_PAYMENT' },
          data: { status: 'CONFIRMED' },
        });

        if (registrationUpdate.count === 0) {
          throw new ConflictException(
            'Registration is no longer awaiting payment; verification aborted.',
          );
        }
      }
      // FAILED: Registration stays PENDING_PAYMENT — the registrant resubmits.

      return tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    });

    if (result.status === 'SUCCESS') {
      await this.paymentConfirmedQueue.add('payment-confirmed', {
        paymentId: result.id,
        registrationId: result.registrationId,
        verifiedById: adminId,
      });
    }

    return result;
  }
}

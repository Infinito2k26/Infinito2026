import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { SubmitPaymentDto, VerifyPaymentDto } from './dto/payments.dto';

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

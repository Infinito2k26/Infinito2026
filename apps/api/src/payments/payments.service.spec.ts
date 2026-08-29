import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';

import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  let prisma: {
    registration: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    payment: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let uploadsService: { uploadProof: jest.Mock };
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    prisma = {
      registration: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    uploadsService = {
      uploadProof: jest.fn().mockResolvedValue({ key: 'payment-proof/abc' }),
    };

    queue = { add: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploadsService },
        { provide: getQueueToken('payment-confirmed'), useValue: queue },
      ],
    }).compile();

    service = moduleRef.get<PaymentsService>(PaymentsService);
  });

  const file = {
    buffer: Buffer.from('fake'),
    mimetype: 'image/png',
  } as Express.Multer.File;

  describe('submitPayment', () => {
    const dto = {
      registrationId: 'reg-1',
      transactionId: 'txn-1',
      idempotencyKey: 'key-1',
    };

    it('throws NotFoundException when registration does not exist', async () => {
      prisma.registration.findUnique.mockResolvedValue(null);

      await expect(service.submitPayment('user-1', dto, file)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when caller does not own the registration', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        userId: 'someone-else',
        team: null,
        status: 'PENDING_PAYMENT',
      });

      await expect(service.submitPayment('user-1', dto, file)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ConflictException when registration is not PENDING_PAYMENT', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        userId: 'user-1',
        team: null,
        status: 'CONFIRMED',
      });

      await expect(service.submitPayment('user-1', dto, file)).rejects.toThrow(
        ConflictException,
      );
    });

    it('fills in the stub payment row and moves it to RECONCILIATION_PENDING', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        userId: 'user-1',
        team: null,
        status: 'PENDING_PAYMENT',
      });

      const stub = { id: 'pay-1', status: 'INITIATED' };
      const finalPayment = { ...stub, status: 'RECONCILIATION_PENDING' };

      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          payment: {
            findUnique: jest.fn().mockResolvedValue(null),
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(null) // no existing active payment
              .mockResolvedValueOnce(stub), // the INITIATED stub
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: jest.fn().mockResolvedValue(finalPayment),
          },
        }),
      );

      const result = await service.submitPayment('user-1', dto, file);

      expect(uploadsService.uploadProof).toHaveBeenCalledWith(
        file.buffer,
        file.mimetype,
        'payment-proof',
      );
      expect(result).toEqual(finalPayment);
    });

    it('allows the team captain to pay on behalf of the team', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        userId: null,
        team: { captainId: 'user-1' },
        status: 'PENDING_PAYMENT',
      });

      const stub = { id: 'pay-1', status: 'INITIATED' };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          payment: {
            findUnique: jest.fn().mockResolvedValue(null),
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValueOnce(stub),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: jest
              .fn()
              .mockResolvedValue({ ...stub, status: 'RECONCILIATION_PENDING' }),
          },
        }),
      );

      await expect(
        service.submitPayment('user-1', dto, file),
      ).resolves.toBeDefined();
    });

    it('throws NotFoundException when no INITIATED stub exists for the registration', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        userId: 'user-1',
        team: null,
        status: 'PENDING_PAYMENT',
      });

      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          payment: {
            findUnique: jest.fn().mockResolvedValue(null),
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValueOnce(null),
          },
        }),
      );

      await expect(service.submitPayment('user-1', dto, file)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyPayment', () => {
    it('confirms the registration and enqueues a job on SUCCESS', async () => {
      const payment = {
        id: 'pay-1',
        registrationId: 'reg-1',
        status: 'SUCCESS',
      };

      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          payment: {
            findUnique: jest
              .fn()
              .mockResolvedValue({ id: 'pay-1', registrationId: 'reg-1' }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: jest.fn().mockResolvedValue(payment),
          },
          registration: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        }),
      );

      const result = await service.verifyPayment(
        'pay-1',
        { status: 'SUCCESS' },
        'admin-1',
      );

      expect(result).toEqual(payment);
      expect(queue.add).toHaveBeenCalledWith('payment-confirmed', {
        paymentId: 'pay-1',
        registrationId: 'reg-1',
        verifiedById: 'admin-1',
      });
    });

    it('does not touch the registration or enqueue a job on FAILED', async () => {
      const payment = {
        id: 'pay-1',
        registrationId: 'reg-1',
        status: 'FAILED',
      };
      const registrationUpdateMany = jest.fn();

      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          payment: {
            findUnique: jest
              .fn()
              .mockResolvedValue({ id: 'pay-1', registrationId: 'reg-1' }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: jest.fn().mockResolvedValue(payment),
          },
          registration: { updateMany: registrationUpdateMany },
        }),
      );

      const result = await service.verifyPayment(
        'pay-1',
        { status: 'FAILED', rejectionReason: 'Amount mismatch' },
        'admin-1',
      );

      expect(result).toEqual(payment);
      expect(registrationUpdateMany).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the payment is no longer under review', async () => {
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          payment: {
            findUnique: jest
              .fn()
              .mockResolvedValue({ id: 'pay-1', registrationId: 'reg-1' }),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        }),
      );

      await expect(
        service.verifyPayment('pay-1', { status: 'SUCCESS' }, 'admin-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when the payment does not exist', async () => {
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          payment: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        }),
      );

      await expect(
        service.verifyPayment('missing', { status: 'SUCCESS' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

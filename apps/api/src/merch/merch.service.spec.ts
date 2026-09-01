import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { MerchService } from './merch.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

describe('MerchService', () => {
  let service: MerchService;

  let prisma: {
    product: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    merchOrder: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let uploadsService: { uploadProof: jest.Mock; getSignedGetUrl: jest.Mock };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      merchOrder: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      $transaction: jest.fn((arg: unknown) =>
        Array.isArray(arg)
          ? Promise.all(arg)
          : (arg as (tx: unknown) => unknown)(prisma),
      ),
    };

    uploadsService = {
      uploadProof: jest
        .fn()
        .mockResolvedValue({ key: 'merch-payment-proof/abc.jpg' }),
      getSignedGetUrl: jest.fn(
        (key: string) => `https://signed.example/${key}`,
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MerchService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploadsService },
      ],
    }).compile();

    service = moduleRef.get<MerchService>(MerchService);
  });

  describe('createOrder', () => {
    it('computes totalAmount server-side from live product prices, ignoring any client-supplied amount', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Tee',
          price: 500,
          inStock: true,
          isPublished: true,
          deletedAt: null,
        },
        {
          id: 'p2',
          name: 'Cap',
          price: 300,
          inStock: true,
          isPublished: true,
          deletedAt: null,
        },
      ]);
      prisma.merchOrder.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'order-1', ...data }),
      );

      const result = await service.createOrder('user-1', {
        shippingName: 'A',
        shippingPhone: '1',
        shippingAddress: 'B',
        shippingPincode: '800001',
        items: [
          { productId: 'p1', quantity: 2 }, // 500*2 = 1000
          { productId: 'p2', quantity: 1 }, // 300*1 = 300
        ],
      });

      expect(result.totalAmount).toBe(1300);
    });

    it('rejects an order with no items', async () => {
      await expect(
        service.createOrder('user-1', {
          shippingName: 'A',
          shippingPhone: '1',
          shippingAddress: 'B',
          shippingPincode: '800001',
          items: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an out-of-stock product', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Tee',
          price: 500,
          inStock: false,
          isPublished: true,
          deletedAt: null,
        },
      ]);

      await expect(
        service.createOrder('user-1', {
          shippingName: 'A',
          shippingPhone: '1',
          shippingAddress: 'B',
          shippingPincode: '800001',
          items: [{ productId: 'p1', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a product that does not exist', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.createOrder('user-1', {
          shippingName: 'A',
          shippingPhone: '1',
          shippingAddress: 'B',
          shippingPincode: '800001',
          items: [{ productId: 'missing', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an unpublished product', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Tee',
          price: 500,
          inStock: true,
          isPublished: false,
          deletedAt: null,
        },
      ]);

      await expect(
        service.createOrder('user-1', {
          shippingName: 'A',
          shippingPhone: '1',
          shippingAddress: 'B',
          shippingPincode: '800001',
          items: [{ productId: 'p1', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listProducts', () => {
    it('filters to in-stock and published only for public callers', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.listProducts(false);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, inStock: true, isPublished: true },
        }),
      );
    });

    it('returns everything for admin callers, regardless of stock or publish state', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.listProducts(true);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
    });
  });

  describe('setProductPublished', () => {
    it('throws when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.setProductPublished('missing', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('publishes an existing product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        deletedAt: null,
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        isPublished: true,
        imageUrls: [],
      });

      const result = await service.setProductPublished('p1', true);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { isPublished: true },
      });
      expect(result.isPublished).toBe(true);
    });
  });

  describe('submitOrderPayment', () => {
    const file = {
      buffer: Buffer.from('x'),
      mimetype: 'image/png',
    } as Express.Multer.File;

    it('rejects when the caller does not own the order', async () => {
      prisma.merchOrder.findUnique.mockResolvedValue({
        id: 'o1',
        userId: 'someone-else',
      });

      await expect(
        service.submitOrderPayment(
          'user-1',
          'o1',
          { transactionId: 't1', idempotencyKey: 'k1' },
          file,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('replays an already-submitted payment for the same idempotencyKey', async () => {
      prisma.merchOrder.findUnique
        .mockResolvedValueOnce({ id: 'o1', userId: 'user-1' }) // ownership lookup
        .mockResolvedValueOnce({
          id: 'o1',
          paymentStatus: 'RECONCILIATION_PENDING',
        }); // replay row

      const result = await service.submitOrderPayment(
        'user-1',
        'o1',
        { transactionId: 't1', idempotencyKey: 'k1' },
        file,
      );

      expect(uploadsService.uploadProof).not.toHaveBeenCalled();
      expect(prisma.merchOrder.updateMany).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: 'o1',
        paymentStatus: 'RECONCILIATION_PENDING',
      });
    });

    it('rejects submitting payment for an order not awaiting payment', async () => {
      prisma.merchOrder.findUnique
        .mockResolvedValueOnce({
          id: 'o1',
          userId: 'user-1',
          paymentStatus: 'SUCCESS',
        })
        .mockResolvedValueOnce(null);

      await expect(
        service.submitOrderPayment(
          'user-1',
          'o1',
          { transactionId: 't1', idempotencyKey: 'k1' },
          file,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('uploads proof and moves the order to RECONCILIATION_PENDING', async () => {
      prisma.merchOrder.findUnique
        .mockResolvedValueOnce({
          id: 'o1',
          userId: 'user-1',
          paymentStatus: 'INITIATED',
        })
        .mockResolvedValueOnce(null);
      prisma.merchOrder.updateMany.mockResolvedValue({ count: 1 });
      prisma.merchOrder.findUniqueOrThrow.mockResolvedValue({
        id: 'o1',
        paymentStatus: 'RECONCILIATION_PENDING',
      });

      const result = await service.submitOrderPayment(
        'user-1',
        'o1',
        { transactionId: 't1', idempotencyKey: 'k1' },
        file,
      );

      expect(uploadsService.uploadProof).toHaveBeenCalledWith(
        file.buffer,
        file.mimetype,
        'merch-payment-proof',
      );
      expect(result).toEqual({
        id: 'o1',
        paymentStatus: 'RECONCILIATION_PENDING',
      });
    });
  });

  describe('verifyOrderPayment', () => {
    it('confirms the order on SUCCESS', async () => {
      prisma.merchOrder.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'PENDING_PAYMENT',
      });
      prisma.merchOrder.updateMany.mockResolvedValue({ count: 1 });
      prisma.merchOrder.findUniqueOrThrow.mockResolvedValue({
        id: 'o1',
        status: 'CONFIRMED',
      });

      const result = await service.verifyOrderPayment('o1', {
        status: 'SUCCESS',
      });

      expect(prisma.merchOrder.updateMany).toHaveBeenCalledWith({
        where: { id: 'o1', paymentStatus: 'RECONCILIATION_PENDING' },
        data: {
          paymentStatus: 'SUCCESS',
          rejectionReason: null,
          status: 'CONFIRMED',
        },
      });
      expect(result).toEqual({ id: 'o1', status: 'CONFIRMED' });
    });

    it('409s when a concurrent verify already resolved it (compare-and-swap loses)', async () => {
      prisma.merchOrder.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'PENDING_PAYMENT',
      });
      prisma.merchOrder.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.verifyOrderPayment('o1', { status: 'SUCCESS' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateOrderStatus', () => {
    it('allows CONFIRMED -> SHIPPED', async () => {
      prisma.merchOrder.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'CONFIRMED',
      });
      prisma.merchOrder.update.mockResolvedValue({
        id: 'o1',
        status: 'SHIPPED',
      });

      await expect(service.updateOrderStatus('o1', 'SHIPPED')).resolves.toEqual(
        {
          id: 'o1',
          status: 'SHIPPED',
        },
      );
    });

    it('rejects DELIVERED -> anything (terminal state)', async () => {
      prisma.merchOrder.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'DELIVERED',
      });

      await expect(
        service.updateOrderStatus('o1', 'CANCELLED'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects skipping straight from CONFIRMED to DELIVERED', async () => {
      prisma.merchOrder.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'CONFIRMED',
      });

      await expect(
        service.updateOrderStatus('o1', 'DELIVERED'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

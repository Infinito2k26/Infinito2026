import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MerchOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateMerchOrderDto,
  SubmitOrderPaymentDto,
  VerifyMerchOrderDto,
} from './dto/merch.dto';

// CONFIRMED -> SHIPPED -> DELIVERED, or CANCELLED from any pre-DELIVERED
// state. No going backward (e.g. DELIVERED -> PENDING_PAYMENT).
const ALLOWED_STATUS_TRANSITIONS: Record<MerchOrderStatus, MerchOrderStatus[]> =
  {
    PENDING_PAYMENT: ['CANCELLED'],
    CONFIRMED: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

@Injectable()
export class MerchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  private withSignedImages<T extends { imageUrls: string[] }>(product: T) {
    return {
      ...product,
      imageUrls: product.imageUrls.map((key) =>
        this.uploadsService.getSignedGetUrl(key),
      ),
    };
  }

  async listProducts(isAdmin: boolean) {
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(isAdmin ? {} : { inStock: true, isPublished: true }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return { products: products.map((p) => this.withSignedImages(p)) };
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.deletedAt || !product.isPublished) {
      throw new NotFoundException('Product not found');
    }
    return this.withSignedImages(product);
  }

  async setProductPublished(id: string, isPublished: boolean) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Product not found');
    }
    const product = await this.prisma.product.update({
      where: { id },
      data: { isPublished },
    });
    return this.withSignedImages(product);
  }

  async createProduct(dto: CreateProductDto) {
    const product = await this.prisma.product.create({ data: dto });
    return this.withSignedImages(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Product not found');
    }
    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
    });
    return this.withSignedImages(product);
  }

  async createOrder(userId: string, dto: CreateMerchOrderDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('An order must have at least one item');
    }

    return this.prisma.$transaction(async (tx) => {
      const productIds = [...new Set(dto.items.map((i) => i.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productById = new Map(products.map((p) => [p.id, p]));
      let totalAmount = 0;
      const itemsData = dto.items.map((item) => {
        const product = productById.get(item.productId);
        if (!product || product.deletedAt || !product.isPublished) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }
        if (!product.inStock) {
          throw new BadRequestException(
            `Product "${product.name}" is out of stock`,
          );
        }
        const priceAtPurchase = product.price;
        totalAmount += Number(priceAtPurchase) * item.quantity;
        return {
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
          priceAtPurchase,
        };
      });

      return tx.merchOrder.create({
        data: {
          userId,
          shippingName: dto.shippingName,
          shippingPhone: dto.shippingPhone,
          shippingAddress: dto.shippingAddress,
          shippingPincode: dto.shippingPincode,
          totalAmount,
          idempotencyKey: randomUUID(),
          items: { create: itemsData },
        },
        include: { items: true },
      });
    });
  }

  async listMyOrders(userId: string) {
    const orders = await this.prisma.merchOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });
    return { orders };
  }

  async submitOrderPayment(
    userId: string,
    orderId: string,
    dto: SubmitOrderPaymentDto,
    file: Express.Multer.File,
  ) {
    const order = await this.prisma.merchOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to pay for this order',
      );
    }

    // Idempotent replay: the same idempotencyKey returns the already-recorded
    // result instead of erroring or double-submitting, same contract as
    // PaymentsService.submitPayment.
    const replay = await this.prisma.merchOrder.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (replay) {
      return replay;
    }

    if (order.paymentStatus !== 'INITIATED') {
      throw new ConflictException(
        `Order payment is not awaiting submission (current status: ${order.paymentStatus})`,
      );
    }

    const uploaded = await this.uploadsService.uploadProof(
      file.buffer,
      file.mimetype,
      'merch-payment-proof',
    );

    const updated = await this.prisma.merchOrder.updateMany({
      where: { id: orderId, paymentStatus: 'INITIATED' },
      data: {
        paymentStatus: 'RECONCILIATION_PENDING',
        screenshotUrl: uploaded.key,
        transactionId: dto.transactionId,
        idempotencyKey: dto.idempotencyKey,
      },
    });

    if (updated.count === 0) {
      throw new ConflictException(
        'Order payment changed concurrently, please retry',
      );
    }

    return this.prisma.merchOrder.findUniqueOrThrow({ where: { id: orderId } });
  }

  async listOrders(page = 1, limit = 20, status?: string) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * limit;

    const where = status ? { status: status as MerchOrderStatus } : {};

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.merchOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.merchOrder.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
        ...order,
        screenshotUrl: order.screenshotUrl
          ? this.uploadsService.getSignedGetUrl(order.screenshotUrl)
          : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async verifyOrderPayment(orderId: string, dto: VerifyMerchOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.merchOrder.findUnique({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const updated = await tx.merchOrder.updateMany({
        where: { id: orderId, paymentStatus: 'RECONCILIATION_PENDING' },
        data: {
          paymentStatus: dto.status,
          rejectionReason: dto.status === 'FAILED' ? dto.rejectionReason : null,
          status: dto.status === 'SUCCESS' ? 'CONFIRMED' : order.status,
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Order payment could not be verified. It may not exist or is no longer pending review.',
        );
      }

      return tx.merchOrder.findUniqueOrThrow({ where: { id: orderId } });
    });
  }

  async updateOrderStatus(orderId: string, nextStatus: MerchOrderStatus) {
    const order = await this.prisma.merchOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!ALLOWED_STATUS_TRANSITIONS[order.status].includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot move order from ${order.status} to ${nextStatus}`,
      );
    }

    return this.prisma.merchOrder.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });
  }
}

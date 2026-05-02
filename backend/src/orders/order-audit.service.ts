import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type OrderAuditStatus =
  | 'ATTEMPT'
  | 'CREATED'
  | 'SESSION_EXPIRED'
  | 'ITEM_UNAVAILABLE'
  | 'REJECTED'
  | 'STATUS_UPDATED';

export interface OrderAuditEntry {
  id: string;
  at: string;
  branchId?: string;
  tableId?: string;
  sessionId?: string;
  customerRef?: string;
  orderId?: string;
  displayNumber?: string;
  status: OrderAuditStatus;
  source: 'customer' | 'staff' | 'system';
  reason?: string;
  itemCount?: number;
}

@Injectable()
export class OrderAuditService {
  private readonly logger = new Logger(OrderAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: Omit<OrderAuditEntry, 'id' | 'at'>) {
    try {
      await this.prisma.withRetry(() =>
        this.prisma.orderAudit.create({
          data: {
            branchId: entry.branchId,
            tableId: entry.tableId,
            sessionId: entry.sessionId,
            customerRef: entry.customerRef,
            orderId: entry.orderId,
            displayNumber: entry.displayNumber,
            status: entry.status,
            source: entry.source,
            reason: entry.reason,
            itemCount: entry.itemCount,
          },
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to persist order audit: ${(error as Error).message}`);
    }
  }

  async list(branchId?: string, limit = 50) {
    const take = Math.max(1, Math.min(limit, 100));
    const rows = await this.prisma.withRetry(() =>
      this.prisma.orderAudit.findMany({
        where: branchId ? { branchId } : {},
        orderBy: { createdAt: 'desc' },
        take,
      }),
    );

    return rows.map((row) => ({
      id: row.id,
      at: row.createdAt.toISOString(),
      branchId: row.branchId ?? undefined,
      tableId: row.tableId ?? undefined,
      sessionId: row.sessionId ?? undefined,
      customerRef: row.customerRef ?? undefined,
      orderId: row.orderId ?? undefined,
      displayNumber: row.displayNumber ?? undefined,
      status: row.status as OrderAuditStatus,
      source: row.source as 'customer' | 'staff' | 'system',
      reason: row.reason ?? undefined,
      itemCount: row.itemCount ?? undefined,
    }));
  }
}

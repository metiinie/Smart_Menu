import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TableSessionsService {
  constructor(private prisma: PrismaService) {}

  async getTableContext(branchId: string, tableId: string) {
    let effectiveBranchId = branchId;
    let branch = await this.prisma.withRetry(() =>
      this.prisma.branch.findUnique({
        where: { id: branchId },
      }),
    );
    if (!branch) {
      // Recovery fallback for stale branch IDs: if exactly one branch exists, use it.
      const candidates = await this.prisma.withRetry(() =>
        this.prisma.branch.findMany({
          orderBy: { createdAt: 'asc' },
          take: 2,
        }),
      );
      if (candidates.length === 1) {
        branch = candidates[0];
        effectiveBranchId = branch.id;
      } else {
        throw new NotFoundException('Branch not found');
      }
    }

    let table = null;

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(tableId);
    if (isUuid) {
      table = await this.prisma.withRetry(() =>
        this.prisma.diningTable.findUnique({
          where: { id: tableId },
        }),
      );
    }

    // If not found by UUID, try looking up by tableNumber (fallback)
    if (!table) {
      // Extract numeric part from strings like "table-01" or "1"
      const match = tableId.match(/\d+/);
      if (match) {
        const tableNumber = parseInt(match[0], 10);
        table = await this.prisma.withRetry(() =>
          this.prisma.diningTable.findUnique({
            where: { 
              branchId_tableNumber: { 
                branchId: effectiveBranchId,
                tableNumber 
              } 
            },
          }),
        );
      }
    }
    
    // Ensure table exists and belongs to the specified branch
    if (!table || table.branchId !== effectiveBranchId) {
      throw new NotFoundException('Table not found or mismatch with branch');
    }

    // Enforce "Only ONE active session per table" - get it or create it
    let activeSession = await this.prisma.withRetry(() =>
      this.prisma.tableSession.findFirst({
        where: { tableId: table.id, isActive: true },
      }),
    );

    if (!activeSession) {
      activeSession = await this.prisma.withRetry(() =>
        this.prisma.tableSession.create({
          data: { tableId: table.id, isActive: true },
        }),
      );
    }

    return {
      branch,
      table,
      activeSession,
    };
  }

  async closeSession(id: string) {
    const session = await this.prisma.withRetry(() =>
      this.prisma.tableSession.findUnique({
        where: { id },
      }),
    );
    if (!session) {
      throw new NotFoundException('Table session not found');
    }

    return await this.prisma.withRetry(() =>
      this.prisma.tableSession.update({
        where: { id },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      }),
    );
  }
}

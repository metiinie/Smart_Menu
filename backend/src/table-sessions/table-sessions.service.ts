import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TableSessionsService {
  constructor(private prisma: PrismaService) {}

  async getTableContext(branchId: string, tableId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    let table = await this.prisma.diningTable.findUnique({
      where: { id: tableId },
    });

    // If not found by UUID, try looking up by tableNumber (fallback)
    if (!table) {
      // Extract numeric part from strings like "table-01" or "1"
      const match = tableId.match(/\d+/);
      if (match) {
        const tableNumber = parseInt(match[0], 10);
        table = await this.prisma.diningTable.findUnique({
          where: { 
            branchId_tableNumber: { 
              branchId, 
              tableNumber 
            } 
          },
        });
      }
    }
    
    // Ensure table exists and belongs to the specified branch
    if (!table || table.branchId !== branchId) {
      throw new NotFoundException('Table not found or mismatch with branch');
    }

    // Enforce "Only ONE active session per table" - get it or create it
    let activeSession = await this.prisma.tableSession.findFirst({
      where: { tableId, isActive: true },
    });

    if (!activeSession) {
      activeSession = await this.prisma.tableSession.create({
        data: { tableId, isActive: true },
      });
    }

    return {
      branch,
      table,
      activeSession,
    };
  }

  async closeSession(id: string) {
    const session = await this.prisma.tableSession.findUnique({
      where: { id },
    });
    if (!session) {
      throw new NotFoundException('Table session not found');
    }

    return await this.prisma.tableSession.update({
      where: { id },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });
  }
}

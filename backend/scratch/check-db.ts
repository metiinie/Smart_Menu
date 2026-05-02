
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({
    include: {
      tables: true,
    }
  });

  console.log('Branches:', JSON.stringify(branches.map(b => ({ id: b.id, name: b.name })), null, 2));

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['CREATED', 'CONFIRMED', 'PREPARING'] }
    },
    include: {
      table: {
        select: {
          tableNumber: true,
          branchId: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('Active Orders:', JSON.stringify(orders, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

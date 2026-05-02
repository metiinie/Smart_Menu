
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branchCount = await prisma.branch.count();
  const tableCount = await prisma.diningTable.count();
  const menuItemCount = await prisma.menuItem.count();
  const orderCount = await prisma.order.count();

  console.log('Counts:', {
    branches: branchCount,
    tables: tableCount,
    menuItems: menuItemCount,
    orders: orderCount
  });

  if (menuItemCount > 0) {
    const items = await prisma.menuItem.findMany({ take: 5 });
    console.log('Sample Menu Items:', items.map(i => ({ id: i.id, name: i.name })));
  }

  if (branchCount > 0) {
    const branches = await prisma.branch.findMany({ take: 5 });
    console.log('Sample Branches:', branches.map(b => ({ id: b.id, name: b.name })));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

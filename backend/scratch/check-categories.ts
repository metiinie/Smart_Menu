
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branchId = '233aa58f-bfaa-4223-b6e3-0b033862a1ca';
  const categories = await prisma.category.findMany({
    where: { branchId },
    include: { items: true }
  });

  console.log('Categories for branch', branchId, ':', JSON.stringify(categories, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

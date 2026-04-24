const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const branchId = '5fb9c0d8-e950-40f2-91b2-64096f4a5916';
  try {
    console.log(`Querying categories for branch ${branchId} with items...`);
    const start = Date.now();
    const categories = await prisma.category.findMany({
      where: { branchId },
      include: {
        items: {
          where: { isAvailable: true },
        },
      },
    });
    console.log(`Found ${categories.length} categories in ${Date.now() - start}ms`);
    categories.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.items.length} items`);
    });
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

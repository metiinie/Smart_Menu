const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Querying categories...');
    const start = Date.now();
    const categories = await prisma.category.findMany();
    console.log(`Found ${categories.length} categories in ${Date.now() - start}ms`);
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

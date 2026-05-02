const { PrismaClient } = require('@prisma/client');

async function test() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('Connecting...');
    await prisma.$connect();
    console.log('Success!');
    const result = await prisma.branch.findMany();
    console.log('Result:', result);
  } catch (e) {
    console.error('Error detail:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();

const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_0yVGPe7MxtYs@ep-small-grass-ana26xxn.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30"
      }
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

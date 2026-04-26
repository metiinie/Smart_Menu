import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const staff = await prisma.staffUser.findMany({
    select: { name: true, role: true, pinHash: true }
  });
  console.log(JSON.stringify(staff, null, 2));
  await prisma.$disconnect();
}

main();

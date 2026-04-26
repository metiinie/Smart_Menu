import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Database for active branches...');
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (branches.length === 0) {
      console.log('❌ No branches found in DB. Please run pnpm db:seed');
      return;
    }

    console.log('✅ Found branches:');
    branches.forEach(b => console.log(`- ${b.name} (ID: ${b.id})`));

    const staff = await prisma.staffUser.findMany({
      where: { branchId: branches[0].id }
    });
    console.log(`✅ Latest branch has ${staff.length} staff members.`);
    
  } catch (err) {
    console.error('❌ Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

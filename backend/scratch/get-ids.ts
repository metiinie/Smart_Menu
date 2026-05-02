import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.findFirst({ select: { id: true } });
  const branch = await prisma.branch.findFirst({ select: { id: true } });
  
  console.log(JSON.stringify({ 
    restaurantId: restaurant?.id || null, 
    branchId: branch?.id || null 
  }));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

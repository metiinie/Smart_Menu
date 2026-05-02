import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting SaaS data backfill...');

  // 1. Create Default Subscription Plan
  let plan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'Legacy Plan' }
  });

  if (!plan) {
    plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Legacy Plan',
        maxBranches: 10,
        maxStaff: 50,
        priceMonthly: 0,
        features: { legacy: true }
      }
    });
    console.log(`Created Legacy Subscription Plan (ID: ${plan.id})`);
  } else {
    console.log(`Found existing Legacy Plan (ID: ${plan.id})`);
  }

  // 2. Create Default Restaurant (Tenant)
  let restaurant = await prisma.restaurant.findFirst({
    where: { slug: 'default' }
  });

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        slug: 'default',
        name: 'ArifSmart Original',
        planId: plan.id,
        isActive: true,
        subscriptionStatus: 'ACTIVE',
        themeConfig: {
          primaryColor: "#f97316"
        }
      }
    });
    console.log(`Created Default Restaurant Tenant (ID: ${restaurant.id})`);
  } else {
    console.log(`Found existing Default Restaurant Tenant (ID: ${restaurant.id})`);
  }

  const restaurantId = restaurant.id;

  // 3. Backfill Branches
  const { count: branchCount } = await prisma.branch.updateMany({
    where: { restaurantId: null },
    data: { restaurantId }
  });
  console.log(`Updated ${branchCount} branches with restaurantId.`);

  // 4. Backfill Users (Staff)
  const { count: userCount } = await prisma.user.updateMany({
    where: { restaurantId: null },
    data: { restaurantId }
  });
  console.log(`Updated ${userCount} users with restaurantId.`);

  // 5. Backfill Dining Tables
  const { count: tableCount } = await prisma.diningTable.updateMany({
    where: { restaurantId: null },
    data: { restaurantId }
  });
  console.log(`Updated ${tableCount} dining tables with restaurantId.`);

  // 6. Backfill Categories
  const { count: categoryCount } = await prisma.category.updateMany({
    where: { restaurantId: null },
    data: { restaurantId }
  });
  console.log(`Updated ${categoryCount} categories with restaurantId.`);

  // 7. Backfill Menu Items
  const { count: menuItemCount } = await prisma.menuItem.updateMany({
    where: { restaurantId: null },
    data: { restaurantId }
  });
  console.log(`Updated ${menuItemCount} menu items with restaurantId.`);

  // 8. Backfill Orders
  const { count: orderCount } = await prisma.order.updateMany({
    where: { restaurantId: null },
    data: { restaurantId }
  });
  console.log(`Updated ${orderCount} orders with restaurantId.`);

  // 9. Backfill Order Audits
  const { count: auditCount } = await prisma.orderAudit.updateMany({
    where: { restaurantId: null },
    data: { restaurantId }
  });
  console.log(`Updated ${auditCount} order audits with restaurantId.`);

  console.log('SaaS data backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = '12345678';
  const passwordHash = await bcrypt.hash(password, 12);
  const pinHash = await bcrypt.hash('1234', 12);

  // 1. Ensure Plan
  const plan = await prisma.subscriptionPlan.upsert({
    where: { id: 'default-plan' },
    update: {},
    create: {
      id: 'default-plan',
      name: 'Pro',
      maxBranches: 5,
      maxStaff: 20,
      priceMonthly: 49.99,
    },
  });

  // 2. Ensure Restaurant
  let restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'ArifSmart Demo Restaurant',
        slug: 'demo',
        planId: plan.id,
      },
    });
  }

  // 3. Ensure Branch
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        address: 'Addis Ababa, Ethiopia',
        restaurantId: restaurant.id,
      },
    });
  }

  const users = [
    { email: 'super@arifsmart.com', name: 'Super Admin', role: Role.SUPER_ADMIN },
    { email: 'restadmin@arifsmart.com', name: 'Restaurant Admin', role: Role.RESTAURANT_ADMIN },
    { email: 'kitchen@arifsmart.com', name: 'Kitchen Staff', role: Role.KITCHEN },
    { email: 'manager@arifsmart.com', name: 'Manager', role: Role.MANAGER },
    { email: 'staff@arifsmart.com', name: 'Staff Member', role: Role.STAFF },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { 
        passwordHash, 
        role: u.role, 
        isActive: true,
        restaurantId: u.role === Role.SUPER_ADMIN ? null : restaurant.id,
        branchId: u.role === Role.SUPER_ADMIN ? null : branch.id,
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        pinHash,
        isActive: true,
        restaurantId: u.role === Role.SUPER_ADMIN ? null : restaurant.id,
        branchId: u.role === Role.SUPER_ADMIN ? null : branch.id,
      },
    });
    console.log(`User ${u.email} (${u.role}) seeded.`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

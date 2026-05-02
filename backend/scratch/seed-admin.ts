import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@arifsmart.com';
  const password = 'password123';
  const name = 'Default Admin';
  const role = 'SUPER_ADMIN';

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role, isActive: true },
    create: {
      email,
      passwordHash,
      name,
      role,
      isActive: true,
      pinHash: await bcrypt.hash('1234', 12),
    },
  });

  console.log(`User ${user.email} created/updated successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

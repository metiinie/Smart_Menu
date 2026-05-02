import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Connection Retry Logic ──────────────────────────────────────
  let retries = 10;
  while (retries > 0) {
    try {
      await prisma.$connect();
      console.log('📡 Database connection established.');
      break;
    } catch (err) {
      retries--;
      console.warn(`⏳ Database not reachable, retrying... (${retries} attempts left)`);
      if (retries === 0) throw err;
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.diningTable.deleteMany();
  await prisma.branch.deleteMany();

  // ─── Branch ──────────────────────────────────────────────────────
  const branch = await prisma.branch.create({
    data: {
      name: 'ArifSmart Restaurant',
      address: 'Bole Road, Addis Ababa, Ethiopia',
      phone: '+251 91 234 5678',
    },
  });
  console.log('✅ Branch created:', branch.name);

  // ─── Tables ──────────────────────────────────────────────────────
  const tableData = Array.from({ length: 10 }, (_, i) => ({
    branchId: branch.id,
    tableNumber: i + 1,
    qrCode: `ARIF-${branch.id.slice(0, 8)}-T${i + 1}`,
  }));

  await prisma.diningTable.createMany({ data: tableData });
  const tables = await prisma.diningTable.findMany({ where: { branchId: branch.id } });
  console.log(`✅ ${tables.length} tables created`);

  // Create an active session for table 1
  await prisma.tableSession.create({
    data: { tableId: tables[0].id, isActive: true },
  });

  // ─── Categories ──────────────────────────────────────────────────
  const categoryData = [
    { name: 'Appetizers', sortOrder: 1, branchId: branch.id, imageUrl: '/images/categories/appetizers.jpg' },
    { name: 'Main Dishes', sortOrder: 2, branchId: branch.id, imageUrl: '/images/categories/main.jpg' },
    { name: 'Fasting Menu', sortOrder: 3, branchId: branch.id, imageUrl: '/images/categories/fasting.jpg' },
    { name: 'Drinks & Beverages', sortOrder: 4, branchId: branch.id, imageUrl: '/images/categories/drinks.jpg' },
    { name: 'Desserts', sortOrder: 5, branchId: branch.id, imageUrl: '/images/categories/desserts.jpg' },
  ];

  const categories = [];
  for (const data of categoryData) {
    const cat = await prisma.category.create({ data });
    categories.push(cat);
  }
  console.log(`✅ ${categories.length} categories created`);

  const [appetizers, mainDishes, fastingMenu, drinks, desserts] = categories;

  // ─── Menu Items ──────────────────────────────────────────────────
  await prisma.menuItem.createMany({
    data: [
      // Appetizers
      { name: 'Sambusa', description: 'Crispy fried pastry filled with spiced lentils or meat', price: 35, categoryId: appetizers.id, isFasting: false, imageUrl: '/images/menu/sambusa.png' },
      { name: 'Lentil Sambusa', description: 'Crispy pastry with herbed lentil filling (fasting-friendly)', price: 30, categoryId: appetizers.id, isFasting: true, imageUrl: '/images/menu/lentil-sambusa.png' },
      { name: 'Fatira', description: 'Ethiopian flatbread with egg and honey', price: 45, categoryId: appetizers.id, isFasting: false, imageUrl: '/images/menu/fatira.png' },

      // Main Dishes
      { name: 'Doro Wat', description: 'Spicy Ethiopian chicken stew with boiled eggs in berbere sauce', price: 280, categoryId: mainDishes.id, isFasting: false, imageUrl: '/images/menu/doro-wat.png' },
      { name: 'Tibs (Beef)', description: 'Sautéed tender beef with onions, rosemary and spiced butter', price: 320, categoryId: mainDishes.id, isFasting: false, imageUrl: '/images/menu/beef-tibs.png' },
      { name: 'Kitfo', description: 'Ethiopian steak tartare marinated with mitmita and spiced butter', price: 350, categoryId: mainDishes.id, isFasting: false, imageUrl: '/images/menu/kitfo.png' },
      { name: 'Shiro Fitfit', description: 'Chickpea flour sauce with torn injera', price: 180, categoryId: mainDishes.id, isFasting: true, imageUrl: '/images/menu/shiro-fitfit.png' },
      { name: 'Lamb Tibs', description: 'Tender lamb sautéed with herbs and berbere', price: 380, categoryId: mainDishes.id, isFasting: false, imageUrl: '/images/menu/lamb-tibs.png' },
      { name: 'Firfir (Beef)', description: 'Torn injera mixed with beef and berbere sauce', price: 220, categoryId: mainDishes.id, isFasting: false, imageUrl: null },

      // Fasting Menu
      { name: 'Misir Wat', description: 'Spiced red lentil stew — hearty and nutritious', price: 160, categoryId: fastingMenu.id, isFasting: true, imageUrl: null },
      { name: 'Gomen', description: 'Ethiopian collard greens sautéed with garlic and ginger', price: 140, categoryId: fastingMenu.id, isFasting: true, imageUrl: null },
      { name: 'Beyaynetu (Fasting)', description: 'Assorted fasting platter: misir, gomen, shiro, tikel gomen', price: 220, categoryId: fastingMenu.id, isFasting: true, imageUrl: '/images/menu/beyaynetu-fasting.png' },
      { name: 'Shiro Wat', description: 'Smooth chickpea flour stew with Ethiopian spices', price: 150, categoryId: fastingMenu.id, isFasting: true, imageUrl: null },
      { name: 'Tikel Gomen', description: 'Mild curried cabbage and carrots', price: 120, categoryId: fastingMenu.id, isFasting: true, imageUrl: null },

      // Drinks
      { name: 'Ethiopian Coffee', description: 'Traditional coffee ceremony brew — bold and aromatic', price: 60, categoryId: drinks.id, isFasting: true, imageUrl: '/images/menu/coffee.png' },
      { name: 'Fresh Avocado Juice', description: 'Creamy blended avocado with optional honey', price: 80, categoryId: drinks.id, isFasting: true, imageUrl: '/images/menu/avocado-juice.png' },
      { name: 'Fresh Mango Juice', description: 'Cold-pressed fresh mango juice', price: 70, categoryId: drinks.id, isFasting: true, imageUrl: null },
      { name: 'Sprite / Fanta / Coca-Cola', description: 'Chilled soda — 330ml', price: 40, categoryId: drinks.id, isFasting: true, imageUrl: null },
      { name: 'Water (500ml)', description: 'Still bottled water', price: 20, categoryId: drinks.id, isFasting: true, isAvailable: true, imageUrl: null },

      // Desserts
      { name: 'Baklava', description: 'Honey-soaked pastry with mixed nuts', price: 90, categoryId: desserts.id, isFasting: false, imageUrl: null },
      { name: 'Fruit Salad', description: 'Seasonal fresh fruit mix', price: 75, categoryId: desserts.id, isFasting: true, imageUrl: null },
    ],
  });

  const itemCount = await prisma.menuItem.count();
  console.log(`✅ ${itemCount} menu items created`);

  // ─── Staff Users ─────────────────────────────────────────────────
  const adminPin = await bcrypt.hash('1234', 12);
  const kitchenPin = await bcrypt.hash('5678', 12);

  await prisma.user.createMany({
    data: [
      { name: 'Arif Manager', role: Role.RESTAURANT_ADMIN, pinHash: adminPin, branchId: branch.id },
      { name: 'Kitchen Staff', role: Role.KITCHEN, pinHash: kitchenPin, branchId: branch.id },
    ],
  });
  console.log('✅ Staff users created (Admin PIN: 1234 | Kitchen PIN: 5678)');

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Branch ID : ${branch.id}`);
  console.log(`Table 1 ID: ${tables[0].id}`);
  console.log(`Menu URL  : /menu/${branch.id}/${tables[0].id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "serviceChargeRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
ADD COLUMN     "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 15.0;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "nameTranslations" JSONB;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "descriptionTranslations" JSONB,
ADD COLUMN     "model3dUrl" TEXT,
ADD COLUMN     "nameTranslations" JSONB;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "serviceChargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "branch_order_counters" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "counterDate" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_order_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT,
    "menuItemId" TEXT NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergens" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "menuItemId" TEXT NOT NULL,

    CONSTRAINT "allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dietary_tags" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,

    CONSTRAINT "dietary_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,

    CONSTRAINT "nutrition_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_rows" (
    "id" TEXT NOT NULL,
    "nutrient" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "dailyValue" TEXT,
    "sub" BOOLEAN NOT NULL DEFAULT false,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "nutrition_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "minSelections" INTEGER NOT NULL DEFAULT 0,
    "maxSelections" INTEGER,
    "menuItemId" TEXT NOT NULL,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_options" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "optionName" TEXT NOT NULL,
    "optionPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_item_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "customerRef" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "customerRef" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "customerRef" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branch_order_counters_branchId_counterDate_key" ON "branch_order_counters"("branchId", "counterDate");

-- CreateIndex
CREATE INDEX "ratings_orderId_idx" ON "ratings"("orderId");

-- CreateIndex
CREATE INDEX "ratings_customerRef_idx" ON "ratings"("customerRef");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_customerRef_key" ON "push_subscriptions"("customerRef");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "favorites_customerRef_idx" ON "favorites"("customerRef");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_customerRef_menuItemId_key" ON "favorites"("customerRef", "menuItemId");

-- AddForeignKey
ALTER TABLE "branch_order_counters" ADD CONSTRAINT "branch_order_counters_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergens" ADD CONSTRAINT "allergens_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dietary_tags" ADD CONSTRAINT "dietary_tags_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_sections" ADD CONSTRAINT "nutrition_sections_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_rows" ADD CONSTRAINT "nutrition_rows_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "nutrition_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;


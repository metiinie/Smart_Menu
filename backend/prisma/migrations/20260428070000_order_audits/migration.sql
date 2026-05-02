-- CreateTable
CREATE TABLE "order_audits" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "tableId" TEXT,
    "sessionId" TEXT,
    "orderId" TEXT,
    "customerRef" TEXT,
    "displayNumber" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reason" TEXT,
    "itemCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_audits_branchId_createdAt_idx" ON "order_audits"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "order_audits_tableId_createdAt_idx" ON "order_audits"("tableId", "createdAt");

-- CreateIndex
CREATE INDEX "order_audits_sessionId_createdAt_idx" ON "order_audits"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "order_audits_orderId_createdAt_idx" ON "order_audits"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "order_audits" ADD CONSTRAINT "order_audits_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_audits" ADD CONSTRAINT "order_audits_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "dining_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_audits" ADD CONSTRAINT "order_audits_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "table_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_audits" ADD CONSTRAINT "order_audits_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

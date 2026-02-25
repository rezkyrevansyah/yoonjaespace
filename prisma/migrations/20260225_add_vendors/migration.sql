-- SESI 12: Add Vendors and update Expenses with vendor tracking

-- Create vendors table
CREATE TABLE "vendors" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vendors_category_idx" ON "vendors"("category");
CREATE INDEX "vendors_is_active_idx" ON "vendors"("isActive");

-- Add vendor fields to expenses
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "vendorPaid" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_vendor_id_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "expenses_vendor_id_idx" ON "expenses"("vendorId");

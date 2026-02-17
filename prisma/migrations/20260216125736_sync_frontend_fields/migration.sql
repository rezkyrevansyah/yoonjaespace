-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExpenseCategory" ADD VALUE 'EQUIPMENT';
ALTER TYPE "ExpenseCategory" ADD VALUE 'STUDIO_RENT';
ALTER TYPE "ExpenseCategory" ADD VALUE 'PROPS';
ALTER TYPE "ExpenseCategory" ADD VALUE 'UTILITIES';
ALTER TYPE "ExpenseCategory" ADD VALUE 'MARKETING';
ALTER TYPE "ExpenseCategory" ADD VALUE 'SALARY';

-- AlterTable
ALTER TABLE "backgrounds" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "instagram" TEXT;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "allPhotos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "editedPhotos" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;

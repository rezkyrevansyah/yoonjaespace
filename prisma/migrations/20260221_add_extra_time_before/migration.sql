-- Add extraTimeBefore field to packages table (in minutes, default 0)
ALTER TABLE "packages" ADD COLUMN "extraTimeBefore" INTEGER NOT NULL DEFAULT 0;

-- Add extraTimeBefore field to addon_templates table (in minutes, default 0)
ALTER TABLE "addon_templates" ADD COLUMN "extraTimeBefore" INTEGER NOT NULL DEFAULT 0;

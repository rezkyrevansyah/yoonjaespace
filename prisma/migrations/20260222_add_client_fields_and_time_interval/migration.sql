-- ============================================================
-- SESI 10: Add Client Fields and Time Interval Setting
-- ============================================================

-- Add new fields to clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "domisili" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "leads" TEXT;

-- Add time interval setting (default 30 minutes)
INSERT INTO "studio_settings" (id, key, value, "updatedAt")
VALUES (
  gen_random_uuid(),
  'timeIntervalMinutes',
  '30',
  NOW()
)
ON CONFLICT (key) DO NOTHING;

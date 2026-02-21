-- CreateTable: Custom Roles, Menus, and Permissions
CREATE TABLE "custom_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- Add customRoleId to users table
ALTER TABLE "users" ADD COLUMN "customRoleId" TEXT;

-- Create unique constraints
CREATE UNIQUE INDEX "custom_roles_name_key" ON "custom_roles"("name");
CREATE UNIQUE INDEX "menus_name_key" ON "menus"("name");
CREATE UNIQUE INDEX "role_permissions_roleId_menuId_key" ON "role_permissions"("roleId", "menuId");

-- Add foreign keys
ALTER TABLE "users" ADD CONSTRAINT "users_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "custom_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "custom_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default menus
INSERT INTO "menus" ("id", "name", "label", "sortOrder") VALUES
('menu-dashboard', 'dashboard', 'Dashboard', 0),
('menu-bookings', 'bookings', 'Bookings', 1),
('menu-clients', 'clients', 'Clients', 2),
('menu-calendar', 'calendar', 'Calendar', 3),
('menu-reminders', 'reminders', 'Reminders', 4),
('menu-finance', 'finance', 'Finance', 5),
('menu-commissions', 'commissions', 'Commissions', 6),
('menu-users', 'users', 'Users', 7),
('menu-roles', 'roles', 'Roles', 8),
('menu-activities', 'activities', 'Activities', 9),
('menu-settings', 'settings', 'Settings', 10);

-- Insert default system roles (mapped from enum)
INSERT INTO "custom_roles" ("id", "name", "description", "isSystem") VALUES
('role-owner', 'Owner', 'Full system access', true),
('role-admin', 'Admin', 'Administrative access', true),
('role-photographer', 'Photographer', 'Photographer role', true),
('role-packaging', 'Packaging Staff', 'Packaging and shipping', true);

-- Owner has full access to all menus
INSERT INTO "role_permissions" ("id", "roleId", "menuId", "canView", "canEdit", "canDelete")
SELECT
  'perm-owner-' || "menus"."name",
  'role-owner',
  "menus"."id",
  true,
  true,
  true
FROM "menus";

-- Admin has access to most menus except users and settings (edit only)
INSERT INTO "role_permissions" ("id", "roleId", "menuId", "canView", "canEdit", "canDelete")
SELECT
  'perm-admin-' || "menus"."name",
  'role-admin',
  "menus"."id",
  true,
  CASE WHEN "menus"."name" IN ('users', 'settings') THEN false ELSE true END,
  CASE WHEN "menus"."name" IN ('users', 'settings', 'finance', 'commissions') THEN false ELSE true END
FROM "menus"
WHERE "menus"."name" NOT IN ('commissions');

-- Photographer has limited access
INSERT INTO "role_permissions" ("id", "roleId", "menuId", "canView", "canEdit", "canDelete")
SELECT
  'perm-photographer-' || "menus"."name",
  'role-photographer',
  "menus"."id",
  true,
  CASE WHEN "menus"."name" IN ('bookings', 'calendar') THEN true ELSE false END,
  false
FROM "menus"
WHERE "menus"."name" IN ('dashboard', 'bookings', 'clients', 'calendar', 'reminders');

-- Packaging Staff has minimal access
INSERT INTO "role_permissions" ("id", "roleId", "menuId", "canView", "canEdit", "canDelete")
SELECT
  'perm-packaging-' || "menus"."name",
  'role-packaging',
  "menus"."id",
  true,
  CASE WHEN "menus"."name" = 'bookings' THEN true ELSE false END,
  false
FROM "menus"
WHERE "menus"."name" IN ('dashboard', 'bookings', 'clients');

-- Migrate existing users to custom roles based on their enum role
UPDATE "users" SET "customRoleId" = 'role-owner' WHERE "role" = 'OWNER';
UPDATE "users" SET "customRoleId" = 'role-admin' WHERE "role" = 'ADMIN';
UPDATE "users" SET "customRoleId" = 'role-photographer' WHERE "role" = 'PHOTOGRAPHER';
UPDATE "users" SET "customRoleId" = 'role-packaging' WHERE "role" = 'PACKAGING_STAFF';

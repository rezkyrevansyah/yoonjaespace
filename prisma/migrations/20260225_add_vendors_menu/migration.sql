-- Add vendors menu to menus table (missed in 20260225_add_vendors migration)

INSERT INTO "menus" ("id", "name", "label", "sortOrder")
VALUES ('menu-vendors', 'vendors', 'Vendors', 11)
ON CONFLICT ("id") DO NOTHING;

-- Grant full access to Owner role
INSERT INTO "role_permissions" ("id", "roleId", "menuId", "canView", "canEdit", "canDelete")
VALUES ('perm-owner-vendors', 'role-owner', 'menu-vendors', true, true, true)
ON CONFLICT ("id") DO NOTHING;

-- Grant view+edit access to Admin role
INSERT INTO "role_permissions" ("id", "roleId", "menuId", "canView", "canEdit", "canDelete")
VALUES ('perm-admin-vendors', 'role-admin', 'menu-vendors', true, true, false)
ON CONFLICT ("id") DO NOTHING;

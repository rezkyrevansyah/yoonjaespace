-- ============================================================
-- Performance Optimization Migration
-- Add indexes for frequently queried columns
-- ============================================================

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_date_idx" ON "bookings"("date");
CREATE INDEX IF NOT EXISTS "bookings_booking_code_idx" ON "bookings"("bookingCode");
CREATE INDEX IF NOT EXISTS "bookings_client_id_idx" ON "bookings"("clientId");
CREATE INDEX IF NOT EXISTS "bookings_handled_by_id_idx" ON "bookings"("handledById");
CREATE INDEX IF NOT EXISTS "bookings_date_status_idx" ON "bookings"("date", "status");

-- Clients table indexes
CREATE INDEX IF NOT EXISTS "clients_name_idx" ON "clients"("name");
CREATE INDEX IF NOT EXISTS "clients_phone_idx" ON "clients"("phone");
CREATE INDEX IF NOT EXISTS "clients_email_idx" ON "clients"("email");

-- Users table indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_custom_role_id_idx" ON "users"("customRoleId");
CREATE INDEX IF NOT EXISTS "users_is_active_idx" ON "users"("isActive");

-- Commissions table indexes
CREATE INDEX IF NOT EXISTS "commissions_user_id_idx" ON "commissions"("userId");
CREATE INDEX IF NOT EXISTS "commissions_month_year_idx" ON "commissions"("month", "year");
CREATE INDEX IF NOT EXISTS "commissions_user_month_year_idx" ON "commissions"("userId", "month", "year");

-- Payments table indexes
CREATE INDEX IF NOT EXISTS "payments_booking_id_idx" ON "payments"("bookingId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "payments_payment_date_idx" ON "payments"("paymentDate");

-- Print Orders table indexes
CREATE INDEX IF NOT EXISTS "print_orders_booking_id_idx" ON "print_orders"("bookingId");
CREATE INDEX IF NOT EXISTS "print_orders_status_idx" ON "print_orders"("status");

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category");
CREATE INDEX IF NOT EXISTS "expenses_expense_date_idx" ON "expenses"("expenseDate");

-- Activities table indexes
CREATE INDEX IF NOT EXISTS "activities_user_id_idx" ON "activities"("userId");
CREATE INDEX IF NOT EXISTS "activities_created_at_idx" ON "activities"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "activities_action_idx" ON "activities"("action");

-- Role Permissions indexes
CREATE INDEX IF NOT EXISTS "role_permissions_role_id_idx" ON "role_permissions"("roleId");
CREATE INDEX IF NOT EXISTS "role_permissions_menu_id_idx" ON "role_permissions"("menuId");

-- Reminders table indexes
CREATE INDEX IF NOT EXISTS "reminders_booking_id_idx" ON "reminders"("bookingId");
CREATE INDEX IF NOT EXISTS "reminders_scheduled_at_idx" ON "reminders"("scheduledAt");
CREATE INDEX IF NOT EXISTS "reminders_is_sent_idx" ON "reminders"("isSent");
CREATE INDEX IF NOT EXISTS "reminders_scheduled_sent_idx" ON "reminders"("scheduledAt", "isSent");

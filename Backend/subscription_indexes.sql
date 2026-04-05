-- Performance indexes for subscription_management schema.
-- Applied idempotently on app boot via ensurePerformanceIndexes() in src/db/ensurePatches.ts.
-- You can also run this file manually once against an existing database (skip if indexes already exist).

CREATE INDEX idx_carts_user_status_updated ON carts (user_id, status, updated_at);

CREATE INDEX idx_cart_items_cart_product_plan ON cart_items (cart_id, product_id, plan_id);

CREATE INDEX idx_subscriptions_status_subscription ON subscriptions (status, subscription_id);

CREATE INDEX idx_invoices_status_due ON invoices (status, due_date);

CREATE INDEX idx_payments_status_paydate ON payments (payment_status, payment_date);

CREATE INDEX idx_products_status_created ON products (status, created_at);

CREATE INDEX idx_customers_email ON customers (email);

CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);

CREATE INDEX idx_audit_logs_user_created ON audit_logs (user_id, created_at);

CREATE TABLE
  IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO roles (role_id, role_name, description)
VALUES
  (
    1,
    'Admin',
    'Full system control and configuration'
  ),
  (2, 'Internal User', 'Limited operational access'),
  (3, 'External User', 'Customer/subscriber access');

CREATE TABLE
  IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL DEFAULT 3,
    phone VARCHAR(20),
    status ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id),
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
  );

CREATE TABLE
  IF NOT EXISTS password_resets (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reset_token VARCHAR(255) NOT NULL UNIQUE,
    expiry_time DATETIME NOT NULL,
    used_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users (user_id)
  );

CREATE TABLE
  IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    company_name VARCHAR(150),
    billing_address TEXT,
    shipping_address TEXT,
    tax_number VARCHAR(50),
    portal_user_id INT NULL,
    status ENUM ('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_customers_portal_user FOREIGN KEY (portal_user_id) REFERENCES users (user_id) ON DELETE SET NULL,
    UNIQUE KEY uq_customers_portal_user (portal_user_id)
  );

CREATE TABLE
  IF NOT EXISTS contacts (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    contact_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    designation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contacts_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    sales_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    image_url VARCHAR(500) NULL,
    short_description VARCHAR(255) NULL,
    terms_and_conditions TEXT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    status ENUM ('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
  );

CREATE TABLE
  IF NOT EXISTS product_variants (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(100) NOT NULL,
    extra_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM ('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS recurring_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(150) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    billing_period ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    minimum_quantity INT NOT NULL DEFAULT 1,
    start_date DATE,
    end_date DATE,
    auto_close BOOLEAN DEFAULT FALSE,
    closable BOOLEAN DEFAULT TRUE,
    pausable BOOLEAN DEFAULT TRUE,
    renewable BOOLEAN DEFAULT TRUE,
    status ENUM ('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );

CREATE TABLE
  IF NOT EXISTS product_plans (
    product_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    plan_id INT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    status ENUM ('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_plans_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_product_plans_plan FOREIGN KEY (plan_id) REFERENCES recurring_plans (plan_id) ON DELETE CASCADE,
    CONSTRAINT uq_product_plan UNIQUE (product_id, plan_id)
  );

CREATE TABLE
  IF NOT EXISTS quotation_templates (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(150) NOT NULL,
    validity_days INT NOT NULL DEFAULT 30,
    plan_id INT NULL,
    description TEXT,
    status ENUM ('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_template_plan FOREIGN KEY (plan_id) REFERENCES recurring_plans (plan_id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS taxes (
    tax_id INT AUTO_INCREMENT PRIMARY KEY,
    tax_name VARCHAR(100) NOT NULL,
    tax_type VARCHAR(50) NOT NULL,
    tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    status ENUM ('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );

CREATE TABLE
  IF NOT EXISTS discounts (
    discount_id INT AUTO_INCREMENT PRIMARY KEY,
    discount_name VARCHAR(150) NOT NULL,
    coupon_code VARCHAR(100) NULL,
    discount_type ENUM ('FIXED', 'PERCENTAGE') NOT NULL,
    discount_value DECIMAL(12, 2) NOT NULL,
    minimum_purchase DECIMAL(12, 2) DEFAULT 0.00,
    minimum_quantity INT DEFAULT 1,
    start_date DATE,
    end_date DATE,
    limit_usage INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    created_by INT NULL,
    status ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_discounts_created_by FOREIGN KEY (created_by) REFERENCES users (user_id),
    UNIQUE KEY uq_discounts_coupon_code (coupon_code)
  );

CREATE TABLE
  IF NOT EXISTS user_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS carts (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED') DEFAULT 'ACTIVE',
    applied_discount_id INT NULL,
    payment_method VARCHAR(100) NULL,
    selected_address_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_carts_discount FOREIGN KEY (applied_discount_id) REFERENCES discounts (discount_id) ON DELETE SET NULL,
    CONSTRAINT fk_carts_selected_address FOREIGN KEY (selected_address_id) REFERENCES user_addresses (address_id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    plan_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    extra_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts (cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (product_id),
    CONSTRAINT fk_cart_items_plan FOREIGN KEY (plan_id) REFERENCES recurring_plans (plan_id),
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants (variant_id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS quotation_template_items (
    template_item_id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_id INT NULL,
    line_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_template_items_template FOREIGN KEY (template_id) REFERENCES quotation_templates (template_id) ON DELETE CASCADE,
    CONSTRAINT fk_template_items_product FOREIGN KEY (product_id) REFERENCES products (product_id),
    CONSTRAINT fk_template_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants (variant_id) ON DELETE SET NULL,
    CONSTRAINT fk_template_items_tax FOREIGN KEY (tax_id) REFERENCES taxes (tax_id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_number VARCHAR(50) NULL UNIQUE COMMENT 'Auto-generated on insert as SO + padded next id (wireframe: SOxxx / Subxxx style)',
    customer_id INT NOT NULL,
    plan_id INT NOT NULL,
    template_id INT NULL,
    start_date DATE NOT NULL,
    expiration_date DATE,
    payment_terms VARCHAR(100),
    status ENUM (
      'DRAFT',
      'QUOTATION',
      'CONFIRMED',
      'ACTIVE',
      'CLOSED'
    ) DEFAULT 'DRAFT',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscriptions_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES recurring_plans (plan_id),
    CONSTRAINT fk_subscriptions_template FOREIGN KEY (template_id) REFERENCES quotation_templates (template_id) ON DELETE SET NULL,
    CONSTRAINT fk_subscriptions_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
  );

-- Existing DBs created before nullable subscription_number: relax so INSERT can omit it (trigger fills SOxxx).
ALTER TABLE subscriptions MODIFY COLUMN subscription_number VARCHAR(50) NULL;

CREATE TABLE
  IF NOT EXISTS subscription_items (
    subscription_item_id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_id INT NULL,
    discount_id INT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscription_items_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_items_product FOREIGN KEY (product_id) REFERENCES products (product_id),
    CONSTRAINT fk_subscription_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants (variant_id) ON DELETE SET NULL,
    CONSTRAINT fk_subscription_items_tax FOREIGN KEY (tax_id) REFERENCES taxes (tax_id) ON DELETE SET NULL,
    CONSTRAINT fk_subscription_items_discount FOREIGN KEY (discount_id) REFERENCES discounts (discount_id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS discount_applications (
    discount_application_id INT AUTO_INCREMENT PRIMARY KEY,
    discount_id INT NOT NULL,
    apply_to_type ENUM ('PRODUCT', 'SUBSCRIPTION') NOT NULL,
    product_id INT NULL,
    subscription_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discount_applications_discount FOREIGN KEY (discount_id) REFERENCES discounts (discount_id) ON DELETE CASCADE,
    CONSTRAINT fk_discount_applications_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_discount_applications_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    subscription_id INT NOT NULL,
    customer_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status ENUM ('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED') DEFAULT 'DRAFT',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id),
    CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
  );

CREATE TABLE
  IF NOT EXISTS invoice_items (
    invoice_item_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    description TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_id INT NULL,
    discount_id INT NULL,
    line_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (invoice_id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_items_product FOREIGN KEY (product_id) REFERENCES products (product_id),
    CONSTRAINT fk_invoice_items_tax FOREIGN KEY (tax_id) REFERENCES taxes (tax_id) ON DELETE SET NULL,
    CONSTRAINT fk_invoice_items_discount FOREIGN KEY (discount_id) REFERENCES discounts (discount_id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS invoice_taxes (
    invoice_tax_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    tax_id INT NOT NULL,
    taxable_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_taxes_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (invoice_id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_taxes_tax FOREIGN KEY (tax_id) REFERENCES taxes (tax_id) ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    customer_id INT NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    transaction_reference VARCHAR(100),
    payment_status ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'SUCCESS',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (invoice_id),
    CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
  );

CREATE TABLE
  IF NOT EXISTS subscription_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    CONSTRAINT fk_subscription_history_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_history_changed_by FOREIGN KEY (changed_by) REFERENCES users (user_id) ON DELETE SET NULL
  );

CREATE TABLE
  IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    module_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    record_id INT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
  );

INSERT INTO
  discounts (
    discount_name,
    coupon_code,
    discount_type,
    discount_value,
    minimum_purchase,
    minimum_quantity,
    status
  )
SELECT
  'Welcome 10',
  'SAVE10',
  'PERCENTAGE',
  10,
  0,
  1,
  'ACTIVE'
FROM
  DUAL
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      discounts
    WHERE
      coupon_code = 'SAVE10'
    LIMIT
      1
  );

-- Insert admin user
INSERT IGNORE INTO users (
  user_id,
  full_name,
  email,
  password_hash,
  role_id,
  phone,
  status
)
VALUES
  (
    1,
    'Admin User',
    'admin@system.com',
    '$2b$10$o3wSafZ.S2Vq3mzFnXfKpuuby..aF9lsu7nzjeqvhIJdOdoSR874O',
    1,
    '+1-800-000-0000',
    'ACTIVE'
  );
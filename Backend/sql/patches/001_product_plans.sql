-- Idempotent: safe if table already exists (e.g. after full subscription_management.sql).
-- Use when an older database was created before product_plans was added.

CREATE TABLE IF NOT EXISTS product_plans (
  product_plan_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  plan_id INT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_plans_product FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_product_plans_plan FOREIGN KEY (plan_id) REFERENCES recurring_plans(plan_id)
    ON DELETE CASCADE,
  CONSTRAINT uq_product_plan UNIQUE (product_id, plan_id)
);

-- Payment term master data (Configuration module)
CREATE TABLE IF NOT EXISTS payment_terms (
  payment_term_id INT AUTO_INCREMENT PRIMARY KEY,
  term_name VARCHAR(100) NOT NULL,
  description TEXT,
  due_type ENUM ('IMMEDIATE', 'FIXED_DAYS', 'END_OF_MONTH', 'SPLIT_PAYMENT') NOT NULL,
  days INT NULL,
  grace_days INT NOT NULL DEFAULT 0,
  start_from ENUM ('INVOICE_DATE', 'SUBSCRIPTION_START_DATE') NOT NULL DEFAULT 'INVOICE_DATE',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM ('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  enable_late_fee BOOLEAN NOT NULL DEFAULT FALSE,
  late_fee_type ENUM ('FIXED', 'PERCENTAGE') NULL,
  late_fee_value DECIMAL(10, 2) NULL,
  late_fee_after_days INT NULL,
  enable_early_discount BOOLEAN NOT NULL DEFAULT FALSE,
  early_discount_type ENUM ('FIXED', 'PERCENTAGE') NULL,
  early_discount_value DECIMAL(10, 2) NULL,
  early_discount_within_days INT NULL,
  notes TEXT,
  internal_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_term_installments (
  installment_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_term_id INT NOT NULL,
  installment_number INT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  due_after_days INT NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL,
  CONSTRAINT fk_pt_installments_term FOREIGN KEY (payment_term_id) REFERENCES payment_terms (payment_term_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_term_methods (
  payment_term_method_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_term_id INT NOT NULL,
  payment_method ENUM ('CARD', 'BANK_TRANSFER', 'UPI', 'CASH') NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_pt_methods_term FOREIGN KEY (payment_term_id) REFERENCES payment_terms (payment_term_id)
    ON DELETE CASCADE
);

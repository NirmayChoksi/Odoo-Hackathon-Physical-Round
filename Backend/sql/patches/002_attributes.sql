CREATE TABLE IF NOT EXISTS product_attributes (
  attribute_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_attribute_values (
  value_id INT AUTO_INCREMENT PRIMARY KEY,
  attribute_id INT NOT NULL,
  value VARCHAR(100) NOT NULL,
  extra_price DECIMAL(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attr_val_attr FOREIGN KEY (attribute_id) REFERENCES product_attributes (attribute_id) ON DELETE CASCADE
);

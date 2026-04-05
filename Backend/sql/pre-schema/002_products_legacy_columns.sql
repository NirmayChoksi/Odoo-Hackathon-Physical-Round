-- Legacy `products` may lack columns added after the initial schema. CREATE TABLE IF NOT EXISTS does not evolve tables.

SET @dbname = DATABASE();
SET @t := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = @dbname AND table_name = 'products'
);

SET @c := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'products' AND column_name = 'image_urls'
);
SET @s := IF(@t > 0 AND @c = 0, 'ALTER TABLE products ADD COLUMN image_urls VARCHAR(500) NULL', 'SELECT 1');
PREPARE p FROM @s;
EXECUTE p;
DEALLOCATE PREPARE p;

SET @c := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'products' AND column_name = 'short_description'
);
SET @s := IF(@t > 0 AND @c = 0, 'ALTER TABLE products ADD COLUMN short_description VARCHAR(255) NULL', 'SELECT 1');
PREPARE p FROM @s;
EXECUTE p;
DEALLOCATE PREPARE p;

SET @c := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'products' AND column_name = 'terms_and_conditions'
);
SET @s := IF(@t > 0 AND @c = 0, 'ALTER TABLE products ADD COLUMN terms_and_conditions TEXT NULL', 'SELECT 1');
PREPARE p FROM @s;
EXECUTE p;
DEALLOCATE PREPARE p;

SET @c := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'products' AND column_name = 'is_recurring'
);
SET @s := IF(@t > 0 AND @c = 0, 'ALTER TABLE products ADD COLUMN is_recurring BOOLEAN DEFAULT TRUE', 'SELECT 1');
PREPARE p FROM @s;
EXECUTE p;
DEALLOCATE PREPARE p;

SET @c := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'products' AND column_name = 'created_by'
);
SET @s := IF(@t > 0 AND @c = 0, 'ALTER TABLE products ADD COLUMN created_by INT NULL', 'SELECT 1');
PREPARE p FROM @s;
EXECUTE p;
DEALLOCATE PREPARE p;

SET @fk := (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = @dbname AND table_name = 'products' AND constraint_name = 'fk_products_created_by'
);
SET @u := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = @dbname AND table_name = 'users'
);
SET @cb := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'products' AND column_name = 'created_by'
);
SET @s := IF(
  @t > 0 AND @u > 0 AND @cb > 0 AND @fk = 0,
  'ALTER TABLE products ADD CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users(user_id)',
  'SELECT 1'
);
PREPARE p FROM @s;
EXECUTE p;
DEALLOCATE PREPARE p;

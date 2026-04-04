-- Legacy `customers` may lack `portal_user_id`. CREATE TABLE IF NOT EXISTS does not add columns.

SET @dbname = DATABASE();

SET @t := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = @dbname AND table_name = 'customers'
);
SET @c := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'customers' AND column_name = 'portal_user_id'
);
SET @s := IF(
  @t > 0 AND @c = 0,
  'ALTER TABLE customers ADD COLUMN portal_user_id INT NULL',
  'SELECT 1'
);
PREPARE p FROM @s;
EXECUTE p;
DEALLOCATE PREPARE p;

SET @c2 := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'customers' AND column_name = 'portal_user_id'
);
SET @i := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = @dbname AND table_name = 'customers' AND index_name = 'uq_customers_portal_user'
);
SET @s2 := IF(
  @t > 0 AND @c2 > 0 AND @i = 0,
  'ALTER TABLE customers ADD UNIQUE KEY uq_customers_portal_user (portal_user_id)',
  'SELECT 1'
);
PREPARE p2 FROM @s2;
EXECUTE p2;
DEALLOCATE PREPARE p2;

SET @fk := (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = @dbname AND table_name = 'customers' AND constraint_name = 'fk_customers_portal_user'
);
SET @u := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = @dbname AND table_name = 'users'
);
SET @s3 := IF(
  @t > 0 AND @c2 > 0 AND @u > 0 AND @fk = 0,
  'ALTER TABLE customers ADD CONSTRAINT fk_customers_portal_user FOREIGN KEY (portal_user_id) REFERENCES users(user_id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE p3 FROM @s3;
EXECUTE p3;
DEALLOCATE PREPARE p3;

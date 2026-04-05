-- Legacy DBs may have `discounts` without `coupon_code`. CREATE TABLE IF NOT EXISTS does not add columns.
-- Run before subscription_management.sql so the seed INSERT can use coupon_code.

SET @dbname = DATABASE();

SET @t := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = @dbname AND table_name = 'discounts'
);
SET @c := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'discounts' AND column_name = 'coupon_code'
);
SET @s := IF(
  @t > 0 AND @c = 0,
  'ALTER TABLE discounts ADD COLUMN coupon_code VARCHAR(100) NULL AFTER discount_name',
  'SELECT 1'
);
PREPARE p FROM @s;
EXECUTE p;
DEALLOCATE PREPARE p;

SET @i := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = @dbname AND table_name = 'discounts' AND index_name = 'uq_discounts_coupon_code'
);
SET @c2 := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @dbname AND table_name = 'discounts' AND column_name = 'coupon_code'
);
SET @s2 := IF(
  @t > 0 AND @c2 > 0 AND @i = 0,
  'ALTER TABLE discounts ADD UNIQUE KEY uq_discounts_coupon_code (coupon_code)',
  'SELECT 1'
);
PREPARE p2 FROM @s2;
EXECUTE p2;
DEALLOCATE PREPARE p2;

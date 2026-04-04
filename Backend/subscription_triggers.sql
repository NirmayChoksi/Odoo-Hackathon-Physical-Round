-- Run as a single statement (see setupDatabase.ts). No DELIMITER — not valid via mysql2 / Node.
-- Subscription number: SO001, SO002, … from next AUTO_INCREMENT (wireframe SOxxx). Use 'Sub' instead of 'SO' if preferred.

CREATE TRIGGER before_insert_subscription
BEFORE INSERT ON subscriptions
FOR EACH ROW
BEGIN
    DECLARE next_ai BIGINT UNSIGNED DEFAULT NULL;

    SELECT t.AUTO_INCREMENT INTO next_ai
    FROM information_schema.TABLES t
    WHERE t.TABLE_SCHEMA = DATABASE()
      AND t.TABLE_NAME = 'subscriptions'
    LIMIT 1;

    SET NEW.subscription_number = CONCAT('SO', LPAD(COALESCE(next_ai, 1), 3, '0'));
END;

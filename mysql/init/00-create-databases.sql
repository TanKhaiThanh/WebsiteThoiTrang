-- ============================================
-- ASMAW - Initialize Databases
-- ============================================

CREATE DATABASE IF NOT EXISTS `user_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `product_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `order_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `promo_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions
GRANT ALL PRIVILEGES ON `user_db`.* TO 'asmaw_user'@'%';
GRANT ALL PRIVILEGES ON `product_db`.* TO 'asmaw_user'@'%';
GRANT ALL PRIVILEGES ON `order_db`.* TO 'asmaw_user'@'%';
GRANT ALL PRIVILEGES ON `promo_db`.* TO 'asmaw_user'@'%';
FLUSH PRIVILEGES;

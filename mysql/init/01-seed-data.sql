-- ============================================
-- ASMAW - Seed Data for Microservices
-- ============================================

-- --------------------------------------------
-- 1. User Service (Auth + Profile + Notification)
-- --------------------------------------------
USE `user_db`;

-- Passwords are hashed 'password' (bcrypt cost 12): $2y$12$IVN/GrCF3puGc9zUtcT3GOiyN5QB5TWLIbhUSTySCNDe9xH2xLpEG
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_banned`, `created_at`, `updated_at`) VALUES
(1, 'Admin ASMAW', 'admin@asmaw.com', '$2y$12$IVN/GrCF3puGc9zUtcT3GOiyN5QB5TWLIbhUSTySCNDe9xH2xLpEG', 'admin', 0, NOW(), NOW()),
(2, 'Staff One', 'staff@asmaw.com', '$2y$12$IVN/GrCF3puGc9zUtcT3GOiyN5QB5TWLIbhUSTySCNDe9xH2xLpEG', 'staff', 0, NOW(), NOW()),
(3, 'Shipper Express', 'shipper@asmaw.com', '$2y$12$IVN/GrCF3puGc9zUtcT3GOiyN5QB5TWLIbhUSTySCNDe9xH2xLpEG', 'shipper', 0, NOW(), NOW()),
(4, 'Tuan Khach Hang', 'customer@gmail.com', '$2y$12$IVN/GrCF3puGc9zUtcT3GOiyN5QB5TWLIbhUSTySCNDe9xH2xLpEG', 'customer', 0, NOW(), NOW());

-- --------------------------------------------
-- 2. Product Service (Catalog + Inventory)
-- --------------------------------------------
USE `product_db`;

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `parent_id`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Nam', 'nam', 'Thời trang nam', NULL, 1, 1, NOW(), NOW()),
(2, 'Áo Thun', 'ao-thun', 'Áo thun nam', 1, 1, 1, NOW(), NOW()),
(3, 'Áo Sơ Mi', 'ao-so-mi', 'Áo sơ mi nam', 1, 1, 2, NOW(), NOW()),
(4, 'Nữ', 'nu', 'Thời trang nữ', NULL, 1, 2, NOW(), NOW()),
(5, 'Đầm / Váy', 'dam-vay', 'Đầm váy dự tiệc', 4, 1, 1, NOW(), NOW());

INSERT INTO `products` (`id`, `name`, `slug`, `description`, `price`, `sale_price`, `category_id`, `brand`, `is_active`, `is_featured`, `created_at`, `updated_at`) VALUES
(1, 'Áo Thun Cổ Tròn Basic', 'ao-thun-co-tron-basic', 'Áo thun 100% cotton thoáng mát.', 250000, 199000, 2, 'ASMAW', 1, 1, NOW(), NOW()),
(2, 'Áo Sơ Mi Lụa Tay Ngắn', 'ao-so-mi-lua-tay-ngan', 'Sơ mi lụa mềm mịn, form vừa vặn.', 450000, NULL, 3, 'ASMAW', 1, 1, NOW(), NOW()),
(3, 'Đầm Maxi Hoa Phố', 'dam-maxi-hoa-pho', 'Đầm đi tiệc sang trọng.', 650000, 599000, 5, 'ASMAW', 1, 1, NOW(), NOW());

-- Variants (Product 1)
INSERT INTO `product_variants` (`id`, `product_id`, `color`, `size`, `sku`, `created_at`, `updated_at`) VALUES
(1, 1, 'Trắng', 'M', 'AT-BASIC-TR-M', NOW(), NOW()),
(2, 1, 'Trắng', 'L', 'AT-BASIC-TR-L', NOW(), NOW()),
(3, 1, 'Đen', 'M', 'AT-BASIC-DE-M', NOW(), NOW());

-- Variants (Product 2)
INSERT INTO `product_variants` (`id`, `product_id`, `color`, `size`, `sku`, `created_at`, `updated_at`) VALUES
(4, 2, 'Xanh', 'M', 'SM-LUA-XA-M', NOW(), NOW());

-- Inventory
INSERT INTO `inventory` (`id`, `variant_id`, `available_qty`, `reserved_qty`, `created_at`, `updated_at`) VALUES
(1, 1, 50, 0, NOW(), NOW()),
(2, 2, 30, 0, NOW(), NOW()),
(3, 3, 40, 0, NOW(), NOW()),
(4, 4, 20, 0, NOW(), NOW());

-- --------------------------------------------
-- 3. Promotion Service
-- --------------------------------------------
USE `promo_db`;

INSERT INTO `coupons` (`id`, `code`, `name`, `type`, `value`, `min_order_amount`, `max_discount`, `usage_limit`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'WELCOME20', 'Giảm 20% Cho Bạn Mới', 'percentage', 20.00, 300000.00, 100000.00, 1000, 1, NOW(), NOW()),
(2, 'FREESHIP50K', 'Miễn phí vận chuyển 50k', 'free_shipping', 50000.00, 200000.00, NULL, 500, 1, NOW(), NOW()),
(3, 'HOTDEAL100', 'Giảm 100K Mọi Đơn', 'fixed', 100000.00, 500000.00, NULL, 100, 1, NOW(), NOW());

-- Initial Points for Customer ID 4
INSERT INTO `user_points` (`id`, `user_id`, `balance`, `total_earned`, `total_spent`, `created_at`, `updated_at`) VALUES
(1, 4, 100, 100, 0, NOW(), NOW());

-- Transaction History for Customer ID 4
INSERT INTO `point_transactions` (`id`, `user_id`, `amount`, `type`, `description`, `created_at`, `updated_at`) VALUES
(1, 4, 100, 'earn', 'Welcome Bonus Points', NOW(), NOW());

-- --------------------------------------------
-- 4. Order Service (Empty Data but schema is ready)
-- --------------------------------------------
USE `order_db`;

-- Ready to receive orders.


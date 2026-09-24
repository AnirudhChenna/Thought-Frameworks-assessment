-- =====================================================================
-- Support Ticket Management System - Seed Data
-- Default password for all seed accounts: Password123!
-- Bcrypt Hash: $2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu
-- =====================================================================

USE `support_ticket_db`;

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `ticket_comments`;
TRUNCATE TABLE `tickets`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. Insert Users (Customers & Support Agents)
-- ---------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'Alice Johnson', 'alice@example.com', '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu', 'customer', '2026-09-01 09:00:00'),
(2, 'Bob Smith', 'bob@example.com', '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu', 'customer', '2026-09-02 10:15:00'),
(3, 'Carol White', 'carol@example.com', '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu', 'customer', '2026-09-03 11:30:00'),
(4, 'David Miller', 'david.agent@example.com', '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu', 'agent', '2026-08-15 08:00:00'),
(5, 'Emma Davis', 'emma.agent@example.com', '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu', 'agent', '2026-08-15 08:30:00');

-- ---------------------------------------------------------------------
-- 2. Insert Support Tickets
-- ---------------------------------------------------------------------
INSERT INTO `tickets` (`id`, `user_id`, `subject`, `description`, `priority`, `status`, `assigned_to`, `created_at`, `updated_at`) VALUES
(1, 1, 'Cannot process payment on checkout page', 'Whenever I click the Pay Now button using my Visa card, an error 500 displays on screen. Transaction fails but card was pre-authorized.', 'urgent', 'open', 4, '2026-09-10 14:20:00', '2026-09-10 14:20:00'),
(2, 1, 'Need invoice for August 2026 subscription', 'Hi, I need an official tax invoice containing our company GSTIN for accounting purposes.', 'low', 'resolved', 5, '2026-09-12 11:00:00', '2026-09-13 16:45:00'),
(3, 2, 'API rate limit threshold exceeded unexpectedly', 'Our staging integration received HTTP 429 Too Many Requests even though we are within the 100 req/min quota limit.', 'high', 'in_progress', 4, '2026-09-15 16:10:00', '2026-09-16 09:30:00'),
(4, 2, 'Feature Request: Webhook notifications on ticket update', 'It would be fantastic if we could configure a custom webhook URL to trigger when ticket statuses change.', 'medium', 'open', NULL, '2026-09-18 10:00:00', '2026-09-18 10:00:00'),
(5, 3, 'Mobile responsive layout issue on dashboard', 'When viewing the customer dashboard on iPhone 15 Pro Safari, the action buttons overlap with the navigation header.', 'medium', 'in_progress', 5, '2026-09-19 13:40:00', '2026-09-20 11:15:00'),
(6, 3, 'Account email verification link expired', 'I registered yesterday but the verification email link says token expired after only 30 minutes.', 'low', 'closed', 4, '2026-09-05 08:20:00', '2026-09-06 12:00:00');

-- ---------------------------------------------------------------------
-- 3. Insert Ticket Comments / Activity Thread
-- ---------------------------------------------------------------------
INSERT INTO `ticket_comments` (`id`, `ticket_id`, `user_id`, `comment`, `created_at`) VALUES
-- Comments on Ticket 1 (Payment issue)
(1, 1, 1, 'Here is the gateway error code: ERR_PAYMENT_GATEWAY_TIMEOUT_504.', '2026-09-10 14:25:00'),
(2, 1, 4, 'Hello Alice, thank you for reaching out. We are investigating the payment gateway logs with our provider Stripe. Will update you shortly.', '2026-09-10 14:45:00'),
(3, 1, 4, 'We have identified an upstream timeout issue. Our engineering team is currently pushing a retry handler patch.', '2026-09-10 15:30:00'),

-- Comments on Ticket 2 (Invoice request)
(4, 2, 5, 'Hello Alice, please find attached the revised invoice with GSTIN. Let us know if you need anything else!', '2026-09-13 16:30:00'),
(5, 2, 1, 'Received and verified with our finance team. Thank you Emma!', '2026-09-13 16:44:00'),

-- Comments on Ticket 3 (API rate limit)
(6, 3, 2, 'Attaching our request log timestamp: bursts occur around 14:00 UTC.', '2026-09-15 16:25:00'),
(7, 3, 4, 'Hi Bob, checked our Redis rate limiter cluster. A token bucket synchronization bug was causing premature resets. Patch is deployed to staging.', '2026-09-16 09:30:00'),

-- Comments on Ticket 5 (Mobile layout)
(8, 5, 5, 'Hi Carol, we reproduced the issue on iOS Safari. A CSS flex-wrap fix is in QA review now.', '2026-09-20 11:15:00');

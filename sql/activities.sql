-- Create activities table for tracking system actions
CREATE TABLE IF NOT EXISTS `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `activity_type` varchar(255) NOT NULL,
  `details` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `activities_user_id_index` (`user_id`),
  CONSTRAINT `activities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample activities for testing
INSERT INTO `activities` (`user_id`, `activity_type`, `details`, `ip_address`)
SELECT id, 'User Login', 'User logged in successfully', '192.168.1.1'
FROM users
ORDER BY id
LIMIT 1;

INSERT INTO `activities` (`user_id`, `activity_type`, `details`, `ip_address`)
SELECT id, 'Password Reset', 'Password reset requested', '192.168.1.2'
FROM users
ORDER BY id
LIMIT 1;

INSERT INTO `activities` (`user_id`, `activity_type`, `details`, `ip_address`)
SELECT id, 'Profile Updated', 'User profile information updated', '192.168.1.3'
FROM users
ORDER BY id
LIMIT 1;

INSERT INTO `activities` (`user_id`, `activity_type`, `details`, `ip_address`)
SELECT id, 'New Client Added', 'Created a new client account', '192.168.1.4'
FROM users
WHERE role = 'admin'
LIMIT 1;

INSERT INTO `activities` (`user_id`, `activity_type`, `details`, `ip_address`)
SELECT id, 'Report Submitted', 'Submitted new mystery shopping report', '192.168.1.5'
FROM users
LIMIT 1; 
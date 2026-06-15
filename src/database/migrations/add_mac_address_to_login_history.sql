-- Add MAC address column to login_history table
ALTER TABLE `login_history` 
ADD COLUMN `mac_address` VARCHAR(17) NULL COMMENT 'MAC address of the device used for login' 
AFTER `ip_address`; 
-- Add system_role column to users table
ALTER TABLE users ADD COLUMN system_role VARCHAR(50) DEFAULT 'admin' AFTER role;

-- Update existing users to have admin system_role by default
UPDATE users SET system_role = 'admin' WHERE system_role IS NULL; 
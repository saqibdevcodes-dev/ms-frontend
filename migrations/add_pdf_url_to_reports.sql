-- Add pdf_url column to reports tables
-- This migration adds pdf_url support to all client-specific reports tables

-- Note: Since we use dynamic client-specific tables (e.g., clientname_reports),
-- this migration will need to be run for each client's reports table.
-- The backend controller will handle creating this column when needed.

-- Example for a generic reports table (if it exists):
-- ALTER TABLE reports ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- For client-specific tables, this will be handled in the backend
-- when reports are saved/updated, similar to how other media URLs are handled.






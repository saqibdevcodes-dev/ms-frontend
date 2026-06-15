-- Add timestamp_url column to reports table
ALTER TABLE reports ADD COLUMN timestamp_url TEXT;
CREATE INDEX reports_timestamp_url_idx ON reports(timestamp_url);

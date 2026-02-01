-- Add missing fields to vendor_applications table
-- These fields were being collected by the form but not saved to the database

ALTER TABLE vendor_applications
ADD COLUMN IF NOT EXISTS pricing_range VARCHAR(100),
ADD COLUMN IF NOT EXISTS team_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS why_join TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT,
ADD COLUMN IF NOT EXISTS testimonials TEXT;

-- Add comments for documentation
COMMENT ON COLUMN vendor_applications.pricing_range IS 'General pricing range description (e.g., "Hourly", "Flat Fee")';
COMMENT ON COLUMN vendor_applications.team_size IS 'Number of team members';
COMMENT ON COLUMN vendor_applications.why_join IS 'Vendor motivation for joining the directory';
COMMENT ON COLUMN vendor_applications.certifications IS 'Professional certifications and credentials';
COMMENT ON COLUMN vendor_applications.testimonials IS 'Client testimonials and reviews';

-- Add pricing_tiers JSONB field to workshops table for duration-based pricing

ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN workshops.pricing_tiers IS 'Array of pricing tiers based on format/duration. Each tier has: name (e.g., "1-Hour Session"), duration (e.g., "60 min"), price (e.g., "$5,000"), and optional description.';

-- Example structure:
-- [
--   {"name": "Keynote", "duration": "45-60 min", "price": "$10,000 - $15,000"},
--   {"name": "Half-Day Workshop", "duration": "4 hours", "price": "$15,000 - $20,000"},
--   {"name": "Full-Day Workshop", "duration": "8 hours", "price": "$25,000 - $35,000"}
-- ]

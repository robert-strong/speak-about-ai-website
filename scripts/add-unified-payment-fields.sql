-- Unified Payment System Migration
-- Adds fields to projects table for unified payment tracking
-- Run this script on your Neon database

-- Step 1: Add deal_id FK to projects table (reverse link from projects to deals)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deal_id INTEGER REFERENCES deals(id);
CREATE INDEX IF NOT EXISTS idx_projects_deal_id ON projects(deal_id);

-- Step 2: Add travel buyout field
ALTER TABLE projects ADD COLUMN IF NOT EXISTS travel_buyout DECIMAL(10,2) DEFAULT 0;

-- Step 3: Add speaker payment tracking fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_payment_date DATE;

-- Step 4: Ensure payment_status field exists with correct values
-- (It may already exist from previous migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE projects ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
  END IF;
END $$;

-- Step 5: Ensure payment_date field exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN payment_date DATE;
  END IF;
END $$;

-- Step 6: Link existing projects to deals
-- Match by company + client_name + event_date (within 7 days)
UPDATE projects p
SET deal_id = d.id
FROM deals d
WHERE p.deal_id IS NULL
  AND d.status = 'won'
  AND LOWER(TRIM(p.company)) = LOWER(TRIM(d.company))
  AND LOWER(TRIM(p.client_name)) = LOWER(TRIM(d.client_name))
  AND ABS(EXTRACT(EPOCH FROM (p.event_date - d.event_date))) < 604800; -- 7 days in seconds

-- Step 7: Update projects with deal data where linked
UPDATE projects p
SET
  budget = COALESCE(d.deal_value, p.budget),
  payment_status = COALESCE(d.payment_status, p.payment_status)
FROM deals d
WHERE p.deal_id = d.id
  AND (p.budget IS NULL OR p.budget = 0);

-- Step 8: Verify migration
SELECT
  'Migration Summary' as report,
  COUNT(*) as total_projects,
  COUNT(deal_id) as linked_to_deals,
  COUNT(*) - COUNT(deal_id) as unlinked_projects,
  COUNT(NULLIF(travel_buyout, 0)) as projects_with_travel_buyout,
  COUNT(CASE WHEN speaker_payment_status = 'paid' THEN 1 END) as speakers_paid,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as clients_paid
FROM projects;

-- Show project financials summary
SELECT
  id,
  project_name,
  client_name,
  budget as deal_value,
  speaker_fee,
  travel_buyout,
  (COALESCE(budget, 0) - COALESCE(speaker_fee, 0) - COALESCE(travel_buyout, 0)) as net_commission,
  payment_status as client_payment,
  speaker_payment_status as speaker_payment,
  deal_id
FROM projects
WHERE status NOT IN ('cancelled', 'completed')
ORDER BY event_date;

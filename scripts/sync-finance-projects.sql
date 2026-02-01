-- Sync Financial Data Between Deals and Projects
-- This script ensures proper synchronization between the deals and projects tables

-- Step 1: Add project_id to deals table if it doesn't exist
ALTER TABLE deals ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);

-- Step 2: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_deals_project_id ON deals(project_id);

-- Step 3: Link existing deals to projects based on client_email and closest event date
-- For Ariel Renous's deals specifically
UPDATE deals d
SET project_id = p.id
FROM projects p
WHERE d.client_email = p.client_email
  AND d.status = 'won'
  AND p.id = (
    SELECT id FROM projects p2 
    WHERE p2.client_email = d.client_email 
    ORDER BY ABS(EXTRACT(EPOCH FROM (p2.event_date - d.event_date))) ASC 
    LIMIT 1
  );

-- Step 4: Sync financial data from deals to projects
UPDATE projects p
SET 
  actual_revenue = COALESCE((
    SELECT SUM(d.deal_value) 
    FROM deals d 
    WHERE d.project_id = p.id 
    AND d.status = 'won'
  ), p.budget),
  commission_percentage = COALESCE((
    SELECT AVG(d.commission_percentage) 
    FROM deals d 
    WHERE d.project_id = p.id 
    AND d.status = 'won'
  ), 20),
  commission_amount = COALESCE((
    SELECT SUM(d.commission_amount) 
    FROM deals d 
    WHERE d.project_id = p.id 
    AND d.status = 'won'
  ), p.budget * 0.2),
  payment_status = CASE 
    WHEN EXISTS (
      SELECT 1 FROM deals d 
      WHERE d.project_id = p.id 
      AND d.payment_status = 'paid'
    ) THEN 'paid'
    WHEN EXISTS (
      SELECT 1 FROM deals d 
      WHERE d.project_id = p.id 
      AND d.payment_status = 'partial'
    ) THEN 'partial'
    ELSE 'pending'
  END,
  payment_date = (
    SELECT MAX(d.payment_date) 
    FROM deals d 
    WHERE d.project_id = p.id 
    AND d.payment_status = 'paid'
  )
WHERE EXISTS (
  SELECT 1 FROM deals d 
  WHERE d.project_id = p.id 
  AND d.status = 'won'
);

-- Step 5: For projects without linked deals, ensure commission is calculated
UPDATE projects
SET 
  commission_amount = COALESCE(commission_amount, budget * (commission_percentage / 100))
WHERE commission_amount IS NULL OR commission_amount = 0;

-- Step 6: Create or update Ariel's second project for the second deal
-- Check if we need to create a second project for Ariel's October event
DO $$
DECLARE
  october_deal_id INTEGER;
  existing_project_id INTEGER;
BEGIN
  -- Find Ariel's October deal
  SELECT id INTO october_deal_id
  FROM deals
  WHERE client_email = 'ariel@augment.school'
    AND event_date = '2025-10-22'
    AND status = 'won';
    
  -- Check if there's already a project for this deal
  SELECT project_id INTO existing_project_id
  FROM deals
  WHERE id = october_deal_id;
  
  -- If no project is linked, create one
  IF existing_project_id IS NULL THEN
    INSERT INTO projects (
      project_name,
      client_name,
      client_email,
      company,
      event_date,
      budget,
      speaker_fee,
      project_type,
      status,
      priority,
      start_date,
      commission_percentage,
      commission_amount,
      payment_status,
      project_details
    ) VALUES (
      'Augment.org Additional Module',
      'Ariel Renous',
      'ariel@augment.school',
      'Augment.org',
      '2025-10-22',
      15000,
      15000,
      'speaking_engagement',
      'invoicing',
      'medium',
      NOW(),
      20,
      3000,
      'pending',
      '{}'::jsonb
    ) RETURNING id INTO existing_project_id;
    
    -- Link the deal to the new project
    UPDATE deals 
    SET project_id = existing_project_id 
    WHERE id = october_deal_id;
  END IF;
END $$;

-- Step 7: Verify the sync
SELECT 
  'Deals-Projects Sync Summary' as report,
  COUNT(DISTINCT d.id) as total_won_deals,
  COUNT(DISTINCT d.project_id) as linked_to_projects,
  COUNT(DISTINCT CASE WHEN d.project_id IS NULL THEN d.id END) as unlinked_deals,
  SUM(d.deal_value) as total_deal_value,
  SUM(d.commission_amount) as total_commission
FROM deals d
WHERE d.status = 'won';

-- Step 8: Show the current state
SELECT 
  d.id as deal_id,
  d.client_name,
  d.event_date as deal_event_date,
  d.deal_value,
  d.payment_status as deal_payment_status,
  p.id as project_id,
  p.project_name,
  p.event_date as project_event_date,
  p.budget,
  p.commission_amount,
  p.payment_status as project_payment_status
FROM deals d
LEFT JOIN projects p ON d.project_id = p.id
WHERE d.status = 'won'
ORDER BY d.client_name, d.event_date;
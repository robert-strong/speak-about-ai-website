-- Add is_demo flag to support demo/test account with sample data
-- When is_demo = true, data belongs to the demo account
-- When is_demo = false (default), data belongs to production

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_projects_is_demo ON projects(is_demo);
CREATE INDEX IF NOT EXISTS idx_deals_is_demo ON deals(is_demo);
CREATE INDEX IF NOT EXISTS idx_invoices_is_demo ON invoices(is_demo);
CREATE INDEX IF NOT EXISTS idx_contracts_is_demo ON contracts(is_demo);
CREATE INDEX IF NOT EXISTS idx_contacts_is_demo ON contacts(is_demo);
CREATE INDEX IF NOT EXISTS idx_email_threads_is_demo ON email_threads(is_demo);

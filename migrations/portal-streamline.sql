-- Portal Streamline Migration (Option B)
-- Goal: Clean up database structure for client/speaker portals
-- Maintains backward compatibility while adding proper relationships

-- ============================================
-- PART 1: UNIFIED CLIENTS TABLE
-- ============================================

-- Create the unified clients table (replaces scattered client data)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  title VARCHAR(255),

  -- Location
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  timezone VARCHAR(50),

  -- Authentication (for client portal)
  password_hash VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),

  -- Portal Access
  portal_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,

  -- Contact Preferences
  preferred_contact_method VARCHAR(50) CHECK (preferred_contact_method IN ('email', 'phone', 'mobile')),

  -- Internal Info (JSONB for flexibility)
  internal_info JSONB DEFAULT '{}'::jsonb,
  -- Can include: billing_contact, logistics_contact, notes, tags, etc.

  -- Metadata
  source VARCHAR(100), -- How they found us
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

-- ============================================
-- PART 2: ENGAGEMENT LIFECYCLE LINKAGES
-- ============================================

-- Add missing foreign keys to create the flow:
-- deal → project → contract → invoice

-- Add project_id to deals (a deal can become a project)
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;

-- Add deal_id to projects (project originated from a deal)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS speaker_id INTEGER REFERENCES speakers(id) ON DELETE SET NULL;

-- Ensure contracts link to both deals AND projects
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS speaker_id INTEGER REFERENCES speakers(id) ON DELETE SET NULL;

-- Add project_id to invoices if not exists, and client_id
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS speaker_id INTEGER REFERENCES speakers(id) ON DELETE SET NULL;

-- Create indexes for the new relationships
CREATE INDEX IF NOT EXISTS idx_deals_project_id ON deals(project_id);
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_deal_id ON projects(deal_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_speaker_id ON projects(speaker_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_speaker_id ON contracts(speaker_id);
CREATE INDEX IF NOT EXISTS idx_invoices_deal_id ON invoices(deal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);

-- ============================================
-- PART 3: SPEAKER AUTH CONSOLIDATION
-- ============================================

-- Ensure speaker_accounts has all needed fields
ALTER TABLE speaker_accounts
ADD COLUMN IF NOT EXISTS internal_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT true;

-- The internal_info JSONB will store:
-- {
--   "phone": "...",
--   "emergency_contact": "...",
--   "assistant_contact": "...",
--   "preferred_airport": "...",
--   "alternate_airports": "...",
--   "hotel_preferences": "...",
--   "ground_transport": "...",
--   "av_requirements": "...",
--   "stage_requirements": "...",
--   "fee_keynote": "...",
--   "fee_workshop": "...",
--   "fee_panel": "...",
--   "fee_virtual": "...",
--   "fee_local": "...",
--   "fee_domestic": "...",
--   "fee_international": "...",
--   "fee_nonprofit": "...",
--   "booking_requirements": "...",
--   "payment_details": "...",
--   "w9_status": "...",
--   "medical_notes": "...",
--   "accessibility_needs": "..."
-- }

-- ============================================
-- PART 4: ENGAGEMENT/PROJECT SPEAKERS JUNCTION
-- ============================================

-- Allow multiple speakers per project (for panels, etc.)
CREATE TABLE IF NOT EXISTS project_speakers (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'speaker', -- keynote, panelist, moderator, etc.
  fee DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'confirmed', -- invited, confirmed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, speaker_id)
);

CREATE INDEX IF NOT EXISTS idx_project_speakers_project ON project_speakers(project_id);
CREATE INDEX IF NOT EXISTS idx_project_speakers_speaker ON project_speakers(speaker_id);

-- ============================================
-- PART 5: MIGRATE EXISTING DATA
-- ============================================

-- Migrate existing client_accounts to clients table
INSERT INTO clients (name, email, phone, company, is_active, created_at, last_login)
SELECT
  client_name,
  client_email,
  client_phone,
  company,
  is_active,
  created_at,
  last_login
FROM client_accounts
ON CONFLICT (email) DO NOTHING;

-- Update projects to link to clients
UPDATE projects p
SET client_id = c.id
FROM clients c
WHERE LOWER(p.client_email) = LOWER(c.email)
AND p.client_id IS NULL;

-- Update deals to link to clients
UPDATE deals d
SET client_id = c.id
FROM clients c
WHERE LOWER(d.client_email) = LOWER(c.email)
AND d.client_id IS NULL;

-- Update contracts to link to clients
UPDATE contracts ct
SET client_id = c.id
FROM clients c
WHERE LOWER(ct.client_email) = LOWER(c.email)
AND ct.client_id IS NULL;

-- ============================================
-- PART 6: TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- ============================================
-- PART 7: VIEWS FOR EASY QUERYING
-- ============================================

-- Create a view for the full engagement lifecycle
CREATE OR REPLACE VIEW engagement_lifecycle AS
SELECT
  d.id as deal_id,
  d.status as deal_status,
  d.deal_value,
  p.id as project_id,
  p.project_name,
  p.status as project_status,
  ct.id as contract_id,
  ct.status as contract_status,
  ct.fee_amount as contract_amount,
  i.id as invoice_id,
  i.status as invoice_status,
  i.amount as invoice_amount,
  c.id as client_id,
  c.name as client_name,
  c.company as client_company,
  s.id as speaker_id,
  s.name as speaker_name
FROM deals d
LEFT JOIN projects p ON d.project_id = p.id OR p.deal_id = d.id
LEFT JOIN contracts ct ON ct.deal_id = d.id OR ct.project_id = p.id
LEFT JOIN invoices i ON i.project_id = p.id OR i.contract_id = ct.id
LEFT JOIN clients c ON c.id = COALESCE(d.client_id, p.client_id, ct.client_id)
LEFT JOIN speakers s ON s.id = COALESCE(p.speaker_id, ct.speaker_id);

-- Create a view for speaker portal data
CREATE OR REPLACE VIEW speaker_portal_data AS
SELECT
  s.id,
  s.name,
  s.email,
  s.bio,
  s.short_bio,
  s.one_liner,
  s.headshot_url,
  s.website,
  s.social_media,
  s.topics,
  s.industries,
  s.programs,
  s.videos,
  s.testimonials,
  s.speaking_fee_range,
  s.travel_preferences,
  s.technical_requirements,
  s.dietary_restrictions,
  s.location,
  s.featured,
  s.active,
  s.listed,
  sa.internal_info,
  sa.last_login,
  sa.email_verified,
  sa.profile_status
FROM speakers s
LEFT JOIN speaker_accounts sa ON sa.speaker_id = s.id;

-- Create a view for client portal data
CREATE OR REPLACE VIEW client_portal_data AS
SELECT
  c.id,
  c.name,
  c.email,
  c.company,
  c.phone,
  c.portal_enabled,
  c.last_login,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) as active_projects,
  COUNT(DISTINCT ct.id) as total_contracts,
  COUNT(DISTINCT i.id) as total_invoices,
  SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN i.status IN ('sent', 'overdue') THEN i.amount ELSE 0 END) as total_outstanding
FROM clients c
LEFT JOIN projects p ON p.client_id = c.id
LEFT JOIN contracts ct ON ct.client_id = c.id
LEFT JOIN invoices i ON i.client_id = c.id
GROUP BY c.id;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE clients IS 'Unified client records for portal access and relationship management';
COMMENT ON TABLE project_speakers IS 'Junction table allowing multiple speakers per project';
COMMENT ON VIEW engagement_lifecycle IS 'Shows the full deal → project → contract → invoice flow';
COMMENT ON VIEW speaker_portal_data IS 'Combines speaker profile with account/portal data';
COMMENT ON VIEW client_portal_data IS 'Client summary with project/invoice statistics';

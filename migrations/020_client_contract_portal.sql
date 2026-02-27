-- Migration: Client Contract Portal
-- Adds tables for per-section initials, signed PDFs, and audit trail
-- Alters contracts table with client portal fields

-- 1. Contract initials - per-section initial capture
CREATE TABLE IF NOT EXISTS contract_initials (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_type VARCHAR(20) NOT NULL CHECK (signer_type IN ('client', 'speaker', 'admin')),
  signer_email VARCHAR(255) NOT NULL,
  section_id VARCHAR(50) NOT NULL,
  section_label VARCHAR(255) NOT NULL,
  initial_data TEXT NOT NULL,
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contract_id, signer_type, section_id)
);

-- 2. Signed contract PDFs - stores signed HTML for PDF generation
CREATE TABLE IF NOT EXISTS signed_contract_pdfs (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  signed_html TEXT NOT NULL,
  document_hash VARCHAR(128),
  file_size INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Contract signing audit - comprehensive audit trail
CREATE TABLE IF NOT EXISTS contract_signing_audit (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  signer_type VARCHAR(20),
  signer_email VARCHAR(255),
  section_id VARCHAR(50),
  ip_address VARCHAR(100),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Alter contracts table - add portal fields
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS document_hash VARCHAR(128);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS portal_accessible BOOLEAN DEFAULT true;

-- 5. Add indexes
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_email ON contracts(client_email);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_initials_contract_id ON contract_initials(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signing_audit_contract_id ON contract_signing_audit(contract_id);
CREATE INDEX IF NOT EXISTS idx_signed_contract_pdfs_contract_id ON signed_contract_pdfs(contract_id);

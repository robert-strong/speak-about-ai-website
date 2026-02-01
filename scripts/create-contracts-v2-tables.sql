-- Enhanced Contracts System with Multiple Contract Types
-- Drop existing tables if needed (be careful in production!)
-- DROP TABLE IF EXISTS contract_signatures CASCADE;
-- DROP TABLE IF EXISTS contract_templates CASCADE;
-- DROP TABLE IF EXISTS contracts CASCADE;

-- Contract Templates Table
CREATE TABLE IF NOT EXISTS contract_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('speaker_agreement', 'client_speaker', 'workshop', 'consulting', 'custom')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('internal', 'external')),
    description TEXT,
    template_content TEXT NOT NULL, -- The actual contract template with variables
    variables JSONB, -- List of variables used in template like {{speaker_name}}, {{fee}}, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('speaker_agreement', 'client_speaker', 'workshop', 'consulting', 'custom')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('internal', 'external')),
    template_id INTEGER REFERENCES contract_templates(id),
    
    -- Related entities
    deal_id INTEGER REFERENCES deals(id),
    project_id INTEGER REFERENCES projects(id),
    
    -- Contract parties
    -- For internal: agency and speaker
    -- For external: client, agency, and optionally speaker
    agency_party JSONB NOT NULL, -- {name, email, role, company}
    speaker_party JSONB, -- {name, email, role, company}
    client_party JSONB, -- {name, email, role, company}
    
    -- Contract details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    event_details JSONB, -- {title, date, location, type, attendees}
    financial_terms JSONB, -- {fee, payment_terms, currency, deposit, etc.}
    deliverables JSONB, -- Array of deliverables
    terms_and_conditions TEXT,
    special_clauses TEXT,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 
        'pending_review', 
        'sent_for_signature',
        'partially_signed',
        'fully_executed',
        'active',
        'completed',
        'cancelled',
        'expired'
    )),
    
    -- Important dates
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_date TIMESTAMP WITH TIME ZONE,
    execution_date TIMESTAMP WITH TIME ZONE,
    start_date DATE,
    end_date DATE,
    expiry_date DATE,
    
    -- Tracking
    created_by VARCHAR(255),
    last_modified_by VARCHAR(255),
    notes TEXT,
    internal_notes TEXT, -- Not visible to external parties
    
    -- File storage
    pdf_url TEXT,
    signed_pdf_url TEXT,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contract Signatures Table (supports multiple signers)
CREATE TABLE IF NOT EXISTS contract_signatures (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    signer_type VARCHAR(50) NOT NULL CHECK (signer_type IN ('agency', 'speaker', 'client', 'witness')),
    signer_name VARCHAR(255) NOT NULL,
    signer_email VARCHAR(255) NOT NULL,
    signer_role VARCHAR(255),
    
    -- Signature tracking
    signature_token VARCHAR(255) UNIQUE,
    signature_status VARCHAR(50) DEFAULT 'pending' CHECK (signature_status IN ('pending', 'viewed', 'signed', 'declined')),
    
    -- Signature details
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_data TEXT, -- Base64 encoded signature image or typed name
    signature_method VARCHAR(50) CHECK (signature_method IN ('drawn', 'typed', 'uploaded')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Reminders
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contract Activity Log
CREATE TABLE IF NOT EXISTS contract_activity (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    performed_by VARCHAR(255),
    ip_address VARCHAR(45),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON contracts(category);
CREATE INDEX IF NOT EXISTS idx_contracts_deal_id ON contracts(deal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_signatures_token ON contract_signatures(signature_token);
CREATE INDEX IF NOT EXISTS idx_activity_contract_id ON contract_activity(contract_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contracts_updated_at 
    BEFORE UPDATE ON contracts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON contract_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default contract templates
INSERT INTO contract_templates (name, type, category, description, template_content, variables) VALUES
(
    'Standard Speaker Agreement',
    'speaker_agreement',
    'internal',
    'Agreement between Speak About AI and speakers for representation',
    'This Speaker Representation Agreement is entered into between Speak About AI ("Agency") and {{speaker_name}} ("Speaker")...',
    '{"required": ["speaker_name", "speaker_email", "commission_rate"], "optional": ["exclusivity_terms", "territory"]}'::jsonb
),
(
    'Client Speaking Engagement Contract',
    'client_speaker',
    'external',
    'Contract for speaking engagements between client and speaker/agency',
    'This Speaking Engagement Agreement is between {{client_company}} ("Client") and {{speaker_name}} represented by Speak About AI...',
    '{"required": ["client_company", "speaker_name", "event_date", "fee", "location"], "optional": ["travel_requirements", "recording_rights"]}'::jsonb
)
ON CONFLICT DO NOTHING;
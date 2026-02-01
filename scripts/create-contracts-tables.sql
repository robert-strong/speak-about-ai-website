-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_signed', 'fully_executed', 'cancelled')),
    
    -- Contract content
    template_version VARCHAR(10) DEFAULT 'v1.0',
    terms TEXT NOT NULL,
    
    -- Financial terms
    total_amount DECIMAL(10,2) NOT NULL,
    payment_terms TEXT,
    
    -- Event details (duplicated for contract immutability)
    event_title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_location VARCHAR(255) NOT NULL,
    event_type VARCHAR(100),
    attendee_count INTEGER,
    
    -- Client information (duplicated for contract immutability)  
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_company VARCHAR(255),
    
    -- Speaker information
    speaker_name VARCHAR(255),
    speaker_email VARCHAR(255),
    speaker_fee DECIMAL(10,2),
    
    -- Contract lifecycle tracking
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    expires_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Security
    access_token VARCHAR(255) UNIQUE NOT NULL,
    client_signing_token VARCHAR(255) UNIQUE,
    speaker_signing_token VARCHAR(255) UNIQUE,
    
    -- Audit trail
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contract signatures table
CREATE TABLE IF NOT EXISTS contract_signatures (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    
    -- Signer information
    signer_type VARCHAR(20) NOT NULL CHECK (signer_type IN ('client', 'speaker', 'admin')),
    signer_name VARCHAR(255) NOT NULL,
    signer_email VARCHAR(255) NOT NULL,
    signer_title VARCHAR(100),
    
    -- Signature data
    signature_data TEXT, -- Base64 encoded signature image
    signature_method VARCHAR(20) DEFAULT 'digital_pad' CHECK (signature_method IN ('digital_pad', 'electronic', 'wet_signature')),
    
    -- Signature metadata
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(100),
    
    UNIQUE(contract_id, signer_type)
);

-- Create contract versions table for audit trail
CREATE TABLE IF NOT EXISTS contract_versions (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Version content
    terms TEXT NOT NULL,
    changes_summary TEXT,
    
    -- Version metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    UNIQUE(contract_id, version_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_deal_id ON contracts(deal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_access_token ON contracts(access_token);
CREATE INDEX IF NOT EXISTS idx_contracts_client_token ON contracts(client_signing_token);
CREATE INDEX IF NOT EXISTS idx_contracts_speaker_token ON contracts(speaker_signing_token);

CREATE INDEX IF NOT EXISTS idx_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_signatures_signer_type ON contract_signatures(signer_type);

CREATE INDEX IF NOT EXISTS idx_versions_contract_id ON contract_versions(contract_id);

-- Add triggers for updated_at timestamp
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

-- Add contract number generation function
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
        NEW.contract_number := 'CTR-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEW.id::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_contract_number_trigger
    BEFORE INSERT ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION generate_contract_number();

-- Insert sample contract template if needed (for testing)
-- This will be replaced by the actual contract generation system
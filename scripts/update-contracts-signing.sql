-- Add signing fields to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS client_signer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_signer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS speaker_signing_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS client_signing_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS speaker_signed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS speaker_ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS client_ip_address VARCHAR(45);

-- Create indexes for token lookups
CREATE INDEX IF NOT EXISTS idx_contracts_speaker_token ON contracts(speaker_signing_token);
CREATE INDEX IF NOT EXISTS idx_contracts_client_token ON contracts(client_signing_token);

-- Update contract status to support new states
ALTER TABLE contracts 
ALTER COLUMN status TYPE VARCHAR(50);

-- Add token expiry tracking
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS tokens_expire_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- Add verification fields
ALTER TABLE contract_signatures
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_attempts INT DEFAULT 0;
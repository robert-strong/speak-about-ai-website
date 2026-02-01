-- Create speaker_accounts table for speaker authentication
CREATE TABLE IF NOT EXISTS speaker_accounts (
  id SERIAL PRIMARY KEY,
  speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_speaker_accounts_email ON speaker_accounts(email);
CREATE INDEX IF NOT EXISTS idx_speaker_accounts_speaker_id ON speaker_accounts(speaker_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_speaker_accounts_updated_at 
  BEFORE UPDATE ON speaker_accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
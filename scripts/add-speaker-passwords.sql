-- Add password authentication to speakers table
-- Run this in your Neon database console

-- Add password_hash column to speakers table
ALTER TABLE speakers 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add password reset token fields
ALTER TABLE speakers 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Create index for reset token lookup
CREATE INDEX IF NOT EXISTS idx_speakers_reset_token ON speakers(reset_token) WHERE reset_token IS NOT NULL;

-- Add email verification fields for new registrations
ALTER TABLE speakers 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

-- Create index for verification token lookup
CREATE INDEX IF NOT EXISTS idx_speakers_verification_token ON speakers(verification_token) WHERE verification_token IS NOT NULL;

-- Update existing speakers to be email verified (since they were manually added)
UPDATE speakers SET email_verified = true WHERE email_verified IS NULL OR email_verified = false;
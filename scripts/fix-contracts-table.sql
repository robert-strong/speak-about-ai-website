-- This script adds missing columns to the contracts table if they don't exist
-- Run this in your Neon database console to ensure all required columns are present

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contracts'
ORDER BY ordinal_position;

-- Add missing columns one by one (these won't error if column already exists)

-- Add title column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'title') THEN
    ALTER TABLE contracts ADD COLUMN title VARCHAR(255);
  END IF;
END $$;

-- Add event_title column if missing  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'event_title') THEN
    ALTER TABLE contracts ADD COLUMN event_title VARCHAR(255);
  END IF;
END $$;

-- Add event_date column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'event_date') THEN
    ALTER TABLE contracts ADD COLUMN event_date DATE;
  END IF;
END $$;

-- Add event_location column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'event_location') THEN
    ALTER TABLE contracts ADD COLUMN event_location VARCHAR(255);
  END IF;
END $$;

-- Add client_name column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'client_name') THEN
    ALTER TABLE contracts ADD COLUMN client_name VARCHAR(255);
  END IF;
END $$;

-- Add client_email column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'client_email') THEN
    ALTER TABLE contracts ADD COLUMN client_email VARCHAR(255);
  END IF;
END $$;

-- Add client_company column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'client_company') THEN
    ALTER TABLE contracts ADD COLUMN client_company VARCHAR(255);
  END IF;
END $$;

-- Add speaker_name column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'speaker_name') THEN
    ALTER TABLE contracts ADD COLUMN speaker_name VARCHAR(255);
  END IF;
END $$;

-- Add speaker_email column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'speaker_email') THEN
    ALTER TABLE contracts ADD COLUMN speaker_email VARCHAR(255);
  END IF;
END $$;

-- Add speaker_fee column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'speaker_fee') THEN
    ALTER TABLE contracts ADD COLUMN speaker_fee DECIMAL(10,2);
  END IF;
END $$;

-- Add generated_at column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'generated_at') THEN
    ALTER TABLE contracts ADD COLUMN generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add contract_data column to store all form data as JSON
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contracts' AND column_name = 'contract_data') THEN
    ALTER TABLE contracts ADD COLUMN contract_data JSONB;
  END IF;
END $$;

-- Show the final structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contracts'
ORDER BY ordinal_position;
-- Add speaker ID linking to projects and deals tables
-- Run this in your Neon database console

-- Add speaker_id to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS speaker_id INTEGER REFERENCES speakers(id);

-- Add speaker_id to deals table  
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS speaker_id INTEGER REFERENCES speakers(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_speaker_id ON projects(speaker_id) WHERE speaker_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_speaker_id ON deals(speaker_id) WHERE speaker_id IS NOT NULL;

-- Add a helper function to find speaker by name (for migrating existing data)
-- This can help match existing speaker_requested/requested_speaker_name fields to actual speaker IDs
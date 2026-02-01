-- Wishlist and enhanced deals system for Speak About AI Website
-- Run this in your Neon database after the main tables

-- Wishlist table to store user wishlist items
CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL, -- Track by session since users aren't logged in
  visitor_id VARCHAR(100), -- Optional visitor tracking
  speaker_id INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE,
  UNIQUE(session_id, speaker_id) -- Prevent duplicate speakers in same session
);

-- Update deals table to include all form fields
-- First check if deals table exists and add missing columns
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'phone') THEN
        ALTER TABLE deals ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'organization_name') THEN
        ALTER TABLE deals ADD COLUMN organization_name VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'specific_speaker') THEN
        ALTER TABLE deals ADD COLUMN specific_speaker VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'event_budget') THEN
        ALTER TABLE deals ADD COLUMN event_budget VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'additional_info') THEN
        ALTER TABLE deals ADD COLUMN additional_info TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'wishlist_speakers') THEN
        ALTER TABLE deals ADD COLUMN wishlist_speakers JSONB; -- Store wishlist speaker IDs and names
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'source') THEN
        ALTER TABLE deals ADD COLUMN source VARCHAR(50) DEFAULT 'website_form';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'notes') THEN
        ALTER TABLE deals ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Create deal_speaker_interests junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS deal_speaker_interests (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL,
  speaker_id INTEGER NOT NULL,
  interest_type VARCHAR(50) DEFAULT 'wishlist', -- wishlist, specific_request, alternative
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
  FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE,
  UNIQUE(deal_id, speaker_id, interest_type)
);

-- Email notification log table
CREATE TABLE IF NOT EXISTS email_notifications (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER,
  recipient_email VARCHAR(255) NOT NULL,
  email_type VARCHAR(50) NOT NULL, -- 'new_deal', 'deal_update', etc.
  subject VARCHAR(500),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent', -- sent, failed, pending
  error_message TEXT,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlists_session_id ON wishlists(session_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_speaker_id ON wishlists(speaker_id);
CREATE INDEX IF NOT EXISTS idx_deal_speaker_interests_deal_id ON deal_speaker_interests(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_speaker_interests_speaker_id ON deal_speaker_interests(speaker_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_deal_id ON email_notifications(deal_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);

-- Function to clean up old wishlist items (optional)
CREATE OR REPLACE FUNCTION cleanup_old_wishlists(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM wishlists WHERE added_at < NOW() - INTERVAL '1 day' * days_to_keep;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
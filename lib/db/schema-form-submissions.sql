-- Create form_submissions table for landing page and blog form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  submission_type VARCHAR(50) NOT NULL DEFAULT 'landing_page', -- 'landing_page', 'blog_contact', etc.
  source_url TEXT, -- Which page the submission came from
  
  -- Contact Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  organization_name VARCHAR(255),
  
  -- Event Details (optional)
  specific_speaker TEXT,
  event_date DATE,
  event_location TEXT,
  event_budget VARCHAR(100),
  
  -- Message/Additional Info
  message TEXT,
  additional_info TEXT,
  
  -- Form metadata
  form_data JSONB, -- Store complete form data as JSON for flexibility
  
  -- Email preferences
  newsletter_opt_in BOOLEAN DEFAULT true,
  
  -- Tracking
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'converted', 'archived'
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_form_submissions_email ON form_submissions(email);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at DESC);
CREATE INDEX idx_form_submissions_submission_type ON form_submissions(submission_type);

-- Add to newsletter_signups table if it doesn't exist
CREATE TABLE IF NOT EXISTS newsletter_signups (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'unsubscribed'
  source VARCHAR(100),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_form_submissions_updated_at BEFORE UPDATE
  ON form_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_signups_updated_at BEFORE UPDATE
  ON newsletter_signups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
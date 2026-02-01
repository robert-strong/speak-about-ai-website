-- Vendor Activity Tracking
CREATE TABLE IF NOT EXISTS vendor_activity (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

CREATE INDEX idx_vendor_activity_vendor ON vendor_activity(vendor_id);
CREATE INDEX idx_vendor_activity_type ON vendor_activity(activity_type);
CREATE INDEX idx_vendor_activity_created ON vendor_activity(created_at);

-- Vendor Documents Management
CREATE TABLE IF NOT EXISTS vendor_documents (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),
  notes TEXT
);

CREATE INDEX idx_vendor_documents_vendor ON vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_status ON vendor_documents(status);

-- Vendor Compliance
CREATE TABLE IF NOT EXISTS vendor_compliance (
  vendor_id INTEGER PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  insurance_expiry DATE,
  license_verified BOOLEAN DEFAULT FALSE,
  license_number VARCHAR(255),
  license_expiry DATE,
  certifications TEXT[],
  background_check BOOLEAN DEFAULT FALSE,
  background_check_date DATE,
  tax_id_verified BOOLEAN DEFAULT FALSE,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_date DATE,
  compliance_score INTEGER DEFAULT 0,
  last_review_date DATE,
  next_review_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_compliance_score ON vendor_compliance(compliance_score);
CREATE INDEX idx_vendor_compliance_next_review ON vendor_compliance(next_review_date);

-- Vendor Performance Metrics
CREATE TABLE IF NOT EXISTS vendor_performance (
  vendor_id INTEGER PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  total_events INTEGER DEFAULT 0,
  successful_events INTEGER DEFAULT 0,
  cancelled_events INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  response_time_hours DECIMAL(10,2) DEFAULT 0,
  on_time_delivery_rate DECIMAL(5,2) DEFAULT 0,
  client_satisfaction_score DECIMAL(5,2) DEFAULT 0,
  revenue_generated DECIMAL(12,2),
  last_event_date DATE,
  performance_tier VARCHAR(20) DEFAULT 'bronze',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_performance_rating ON vendor_performance(average_rating);
CREATE INDEX idx_vendor_performance_tier ON vendor_performance(performance_tier);

-- Vendor Onboarding Workflow
CREATE TABLE IF NOT EXISTS vendor_onboarding (
  vendor_id INTEGER PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 8,
  current_status VARCHAR(100),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  steps_completed JSONB DEFAULT '[]',
  pending_actions JSONB DEFAULT '[]',
  assigned_to VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_onboarding_status ON vendor_onboarding(current_status);
CREATE INDEX idx_vendor_onboarding_completion ON vendor_onboarding(completion_percentage);

-- Vendor Communication Templates
CREATE TABLE IF NOT EXISTS vendor_communication_templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body_html TEXT,
  body_text TEXT,
  variables JSONB DEFAULT '[]',
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_comm_templates_id ON vendor_communication_templates(template_id);
CREATE INDEX idx_vendor_comm_templates_category ON vendor_communication_templates(category);

-- Vendor Communication Log
CREATE TABLE IF NOT EXISTS vendor_communications (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  communication_type VARCHAR(50),
  template_id VARCHAR(100),
  subject VARCHAR(500),
  content TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  response_received_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_vendor_communications_vendor ON vendor_communications(vendor_id);
CREATE INDEX idx_vendor_communications_status ON vendor_communications(status);
CREATE INDEX idx_vendor_communications_sent ON vendor_communications(sent_at);

-- Add missing columns to vendors table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'vendors' AND column_name = 'onboarding_status') THEN
    ALTER TABLE vendors ADD COLUMN onboarding_status VARCHAR(50) DEFAULT 'not_started';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'vendors' AND column_name = 'compliance_status') THEN
    ALTER TABLE vendors ADD COLUMN compliance_status VARCHAR(50) DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'vendors' AND column_name = 'performance_score') THEN
    ALTER TABLE vendors ADD COLUMN performance_score DECIMAL(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'vendors' AND column_name = 'last_activity_at') THEN
    ALTER TABLE vendors ADD COLUMN last_activity_at TIMESTAMP;
  END IF;
END $$;

-- Sample communication templates
INSERT INTO vendor_communication_templates (template_id, template_name, subject, body_text, category) VALUES
('welcome', 'Welcome Email', 'Welcome to Our Vendor Network!', 'Thank you for joining our vendor network...', 'onboarding'),
('approval', 'Application Approved', 'Your Vendor Application Has Been Approved!', 'Congratulations! Your application has been approved...', 'status'),
('rejection', 'Application Status', 'Update on Your Vendor Application', 'Thank you for your interest in joining our network...', 'status'),
('document_request', 'Document Request', 'Additional Documents Required', 'To complete your application, we need the following documents...', 'compliance'),
('compliance_reminder', 'Compliance Update Required', 'Action Required: Update Your Compliance Information', 'Your compliance information needs to be updated...', 'compliance')
ON CONFLICT (template_id) DO NOTHING;
-- Create WhatsApp applications table for event professionals AI networking group
CREATE TABLE IF NOT EXISTS whatsapp_applications (
  id SERIAL PRIMARY KEY,

  -- Applicant Information
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  linkedin_url VARCHAR(500) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,

  -- Event Industry Details
  primary_role VARCHAR(100) NOT NULL,
  other_role VARCHAR(255), -- If they selected "Other"
  value_expectations TEXT[], -- Array of expected values

  -- Consent
  agree_to_rules BOOLEAN NOT NULL DEFAULT false,

  -- Application Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'invited')),
  admin_notes TEXT,
  rejection_reason TEXT,

  -- WhatsApp Invitation
  whatsapp_invite_sent_at TIMESTAMP WITH TIME ZONE,
  whatsapp_joined_at TIMESTAMP WITH TIME ZONE,
  whatsapp_invite_link VARCHAR(500),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by VARCHAR(255),
  submission_ip INET,
  user_agent TEXT
);

-- Indexes for better performance
CREATE INDEX idx_whatsapp_applications_status ON whatsapp_applications(status);
CREATE INDEX idx_whatsapp_applications_email ON whatsapp_applications(email);
CREATE INDEX idx_whatsapp_applications_created ON whatsapp_applications(created_at DESC);
CREATE INDEX idx_whatsapp_applications_primary_role ON whatsapp_applications(primary_role);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_applications_updated_at
  BEFORE UPDATE ON whatsapp_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_applications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE whatsapp_applications IS 'Applications for event professionals AI WhatsApp networking group';
COMMENT ON COLUMN whatsapp_applications.primary_role IS 'Event Planner/Organizer, Venue Manager, Caterer, etc.';
COMMENT ON COLUMN whatsapp_applications.value_expectations IS 'Array of expected values from joining the group';
COMMENT ON COLUMN whatsapp_applications.status IS 'pending, approved, rejected, or invited';

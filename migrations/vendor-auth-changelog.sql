-- Vendor Authentication Tokens
CREATE TABLE IF NOT EXISTS vendor_auth_tokens (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  token_type VARCHAR(50) NOT NULL, -- 'login', 'reset', 'verify'
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_auth_tokens_token ON vendor_auth_tokens(token);
CREATE INDEX idx_vendor_auth_tokens_vendor ON vendor_auth_tokens(vendor_id);
CREATE INDEX idx_vendor_auth_tokens_expires ON vendor_auth_tokens(expires_at);

-- Vendor Changelog for tracking all changes
CREATE TABLE IF NOT EXISTS vendor_changelog (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_type VARCHAR(50) DEFAULT 'update', -- 'create', 'update', 'delete'
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_vendor_changelog_vendor ON vendor_changelog(vendor_id);
CREATE INDEX idx_vendor_changelog_field ON vendor_changelog(field_name);
CREATE INDEX idx_vendor_changelog_changed_at ON vendor_changelog(changed_at);
CREATE INDEX idx_vendor_changelog_changed_by ON vendor_changelog(changed_by);

-- Vendor Sessions for tracking active sessions
CREATE TABLE IF NOT EXISTS vendor_sessions (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_sessions_vendor ON vendor_sessions(vendor_id);
CREATE INDEX idx_vendor_sessions_token ON vendor_sessions(session_token);
CREATE INDEX idx_vendor_sessions_expires ON vendor_sessions(expires_at);

-- Function to automatically track changes
CREATE OR REPLACE FUNCTION track_vendor_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields JSONB = '[]'::JSONB;
  field TEXT;
  old_val JSONB;
  new_val JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_data = to_jsonb(OLD);
    new_data = to_jsonb(NEW);
    
    -- Check each field for changes
    FOR field IN SELECT jsonb_object_keys(new_data)
    LOOP
      old_val = old_data->field;
      new_val = new_data->field;
      
      -- Skip system fields
      IF field NOT IN ('id', 'created_at', 'updated_at') AND old_val IS DISTINCT FROM new_val THEN
        INSERT INTO vendor_changelog (
          vendor_id,
          field_name,
          old_value,
          new_value,
          changed_by,
          change_type,
          metadata
        ) VALUES (
          NEW.id,
          field,
          old_val,
          new_val,
          COALESCE(current_setting('app.current_user', true), 'system'),
          'update',
          jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
        );
      END IF;
    END LOOP;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO vendor_changelog (
      vendor_id,
      field_name,
      old_value,
      new_value,
      changed_by,
      change_type,
      metadata
    ) VALUES (
      NEW.id,
      'record',
      NULL,
      to_jsonb(NEW),
      COALESCE(current_setting('app.current_user', true), 'system'),
      'create',
      jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vendors table
DROP TRIGGER IF EXISTS vendors_changelog_trigger ON vendors;
CREATE TRIGGER vendors_changelog_trigger
AFTER INSERT OR UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION track_vendor_changes();

-- Create trigger for vendor_compliance table
DROP TRIGGER IF EXISTS vendor_compliance_changelog_trigger ON vendor_compliance;
CREATE TRIGGER vendor_compliance_changelog_trigger
AFTER INSERT OR UPDATE ON vendor_compliance
FOR EACH ROW
EXECUTE FUNCTION track_vendor_changes();

-- Email verification status
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Add vendor portal preferences
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS portal_preferences JSONB DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false}';

-- Create view for vendor portal access
CREATE OR REPLACE VIEW vendor_portal_access AS
SELECT 
  v.id,
  v.company_name,
  v.slug,
  v.contact_name,
  v.contact_email,
  v.email_verified,
  v.status,
  v.last_activity_at,
  vc.compliance_score,
  vp.performance_tier,
  vo.completion_percentage as onboarding_progress,
  CASE 
    WHEN v.status != 'approved' THEN 'inactive'
    WHEN v.email_verified = FALSE THEN 'unverified'
    WHEN vc.compliance_score < 50 THEN 'compliance_required'
    WHEN vo.completion_percentage < 100 THEN 'onboarding_incomplete'
    ELSE 'active'
  END as portal_status
FROM vendors v
LEFT JOIN vendor_compliance vc ON vc.vendor_id = v.id
LEFT JOIN vendor_performance vp ON vp.vendor_id = v.id
LEFT JOIN vendor_onboarding vo ON vo.vendor_id = v.id;
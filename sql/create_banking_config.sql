-- Create secure banking configuration table
CREATE TABLE IF NOT EXISTS banking_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  display_value TEXT, -- Masked version for display (e.g., ****1234)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- Create audit log for banking config changes
CREATE TABLE IF NOT EXISTS banking_config_audit (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Insert default configuration (with masked values)
INSERT INTO banking_config (config_key, config_value, is_sensitive, display_value) VALUES
  ('bank_name', '', false, null),
  ('account_name', '', false, null),
  ('account_number', '', true, '****0000'),
  ('routing_number', '', true, '****0000'),
  ('swift_code', '', false, null),
  ('bank_address', '', false, null),
  ('wire_instructions', '', false, null),
  ('ach_instructions', '', false, null),
  ('payment_terms_deposit', 'Net 30 days from issue date', false, null),
  ('payment_terms_final', 'Due on event date', false, null),
  ('show_on_invoice', 'true', false, null)
ON CONFLICT (config_key) DO NOTHING;

-- Create function to mask sensitive values
CREATE OR REPLACE FUNCTION mask_sensitive_value(value TEXT, mask_type VARCHAR DEFAULT 'partial')
RETURNS TEXT AS $$
BEGIN
  IF value IS NULL OR value = '' THEN
    RETURN '****';
  END IF;
  
  IF mask_type = 'full' THEN
    RETURN '****';
  ELSIF mask_type = 'partial' THEN
    -- Show last 4 characters only
    IF LENGTH(value) > 4 THEN
      RETURN '****' || SUBSTRING(value FROM LENGTH(value) - 3);
    ELSE
      RETURN '****';
    END IF;
  ELSE
    RETURN value;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for safe banking info display
CREATE OR REPLACE VIEW banking_info_safe AS
SELECT 
  config_key,
  CASE 
    WHEN is_sensitive THEN COALESCE(display_value, mask_sensitive_value(config_value, 'partial'))
    ELSE config_value
  END as value,
  is_sensitive,
  updated_at
FROM banking_config;

-- Grant appropriate permissions
GRANT SELECT ON banking_info_safe TO authenticated;
GRANT ALL ON banking_config TO authenticated;
GRANT INSERT ON banking_config_audit TO authenticated;
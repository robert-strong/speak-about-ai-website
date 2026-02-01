-- Vendor Applications Table
CREATE TABLE IF NOT EXISTS vendor_applications (
  id SERIAL PRIMARY KEY,
  -- Basic Information
  email VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  primary_contact_name VARCHAR(255) NOT NULL,
  primary_contact_role VARCHAR(255) NOT NULL,
  primary_contact_linkedin VARCHAR(500),
  business_email VARCHAR(255) NOT NULL,
  business_phone VARCHAR(50) NOT NULL,
  company_website VARCHAR(500) NOT NULL,
  years_in_business INTEGER NOT NULL,
  business_description TEXT NOT NULL,
  
  -- Category & Services
  primary_category VARCHAR(100) NOT NULL,
  secondary_services TEXT[], -- Array of services
  specialty_capabilities TEXT,
  
  -- Event Details
  event_types TEXT[], -- Array of event types
  average_event_size VARCHAR(100),
  
  -- Location & Coverage
  headquarters_location VARCHAR(255) NOT NULL,
  service_areas TEXT[], -- Local, Regional, National, International
  specific_regions TEXT NOT NULL,
  travel_fees_applicable BOOLEAN NOT NULL DEFAULT false,
  travel_fee_policy TEXT,
  
  -- Pricing
  budget_minimum DECIMAL(12,2) NOT NULL,
  budget_maximum DECIMAL(12,2) NOT NULL,
  pricing_structure TEXT[], -- Array of pricing models
  payment_terms TEXT,
  
  -- Portfolio & Reviews
  portfolio_link VARCHAR(500),
  awards_recognition TEXT,
  review_links TEXT,
  
  -- Operations
  typical_lead_time VARCHAR(100),
  works_with_vendors BOOLEAN NOT NULL DEFAULT false,
  preferred_partners TEXT,
  languages TEXT[], -- Array of languages
  accessibility_accommodations TEXT,
  
  -- Files
  logo_url VARCHAR(500),
  
  -- Application Status
  application_status VARCHAR(50) DEFAULT 'pending', -- pending, under_review, approved, rejected, needs_info
  review_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  application_metadata JSONB DEFAULT '{}',
  submission_ip INET,
  user_agent TEXT
);

-- Indexes for better performance
CREATE INDEX idx_vendor_applications_status ON vendor_applications(application_status);
CREATE INDEX idx_vendor_applications_email ON vendor_applications(email);
CREATE INDEX idx_vendor_applications_company ON vendor_applications(company_name);
CREATE INDEX idx_vendor_applications_created ON vendor_applications(created_at);
CREATE INDEX idx_vendor_applications_category ON vendor_applications(primary_category);

-- Vendor Application Notes (for internal review process)
CREATE TABLE IF NOT EXISTS vendor_application_notes (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES vendor_applications(id) ON DELETE CASCADE,
  note_type VARCHAR(50), -- review, follow_up, internal
  note_text TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_application_notes_app ON vendor_application_notes(application_id);

-- Vendor Application Documents
CREATE TABLE IF NOT EXISTS vendor_application_documents (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES vendor_applications(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- logo, insurance, license, portfolio, other
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_application_docs_app ON vendor_application_documents(application_id);

-- Function to convert approved application to vendor
CREATE OR REPLACE FUNCTION convert_application_to_vendor(app_id INTEGER, approver_email VARCHAR)
RETURNS INTEGER AS $BODY$
DECLARE
  new_vendor_id INTEGER;
  app_record RECORD;
BEGIN
  -- Get application details
  SELECT * INTO app_record FROM vendor_applications WHERE id = app_id;
  
  IF app_record IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  IF app_record.application_status != 'approved' THEN
    RAISE EXCEPTION 'Application must be approved before conversion';
  END IF;
  
  -- Insert into vendors table
  INSERT INTO vendors (
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    website,
    description,
    location,
    services,
    pricing_range,
    minimum_budget,
    years_in_business,
    tags,
    logo_url,
    status,
    approved_at,
    approved_by,
    created_at,
    slug
  ) VALUES (
    app_record.company_name,
    app_record.primary_contact_name,
    app_record.business_email,
    app_record.business_phone,
    app_record.company_website,
    app_record.business_description,
    app_record.headquarters_location,
    app_record.secondary_services,
    CASE 
      WHEN app_record.budget_minimum < 5000 THEN '$'
      WHEN app_record.budget_minimum < 25000 THEN '$$'
      WHEN app_record.budget_minimum < 75000 THEN '$$$'
      ELSE '$$$$'
    END::text,
    app_record.budget_minimum,
    app_record.years_in_business,
    app_record.languages,
    app_record.logo_url,
    'approved',
    CURRENT_TIMESTAMP,
    approver_email,
    app_record.created_at,
    LOWER(REGEXP_REPLACE(app_record.company_name, '[^a-zA-Z0-9]+', '-', 'g'))
  )
  RETURNING id INTO new_vendor_id;
  
  -- Update application to mark as converted
  UPDATE vendor_applications 
  SET 
    application_metadata = jsonb_set(
      COALESCE(application_metadata, '{}'),
      '{vendor_id}',
      to_jsonb(new_vendor_id)
    ),
    application_metadata = jsonb_set(
      application_metadata,
      '{converted_at}',
      to_jsonb(CURRENT_TIMESTAMP)
    )
  WHERE id = app_id;
  
  RETURN new_vendor_id;
END;
$BODY$ LANGUAGE plpgsql;
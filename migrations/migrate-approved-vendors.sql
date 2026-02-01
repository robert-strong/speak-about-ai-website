-- Migration script to convert approved vendor applications to vendors

-- Insert approved applications into vendors table
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
  slug
)
SELECT
  company_name,
  primary_contact_name,
  business_email,
  business_phone,
  company_website,
  business_description,
  headquarters_location,
  COALESCE(secondary_services, ARRAY[]::text[]),
  CASE
    WHEN budget_minimum < 5000 THEN '$'
    WHEN budget_minimum < 25000 THEN '$$'
    WHEN budget_minimum < 75000 THEN '$$$'
    ELSE '$$$$'
  END,
  budget_minimum,
  years_in_business,
  COALESCE(languages, ARRAY[]::text[]),
  logo_url,
  'approved',
  NOW(),
  COALESCE(reviewed_by, 'admin'),
  -- Generate slug, handle duplicates by appending ID
  CASE
    WHEN EXISTS (
      SELECT 1 FROM vendors v2
      WHERE v2.slug = LOWER(REGEXP_REPLACE(va.company_name, '[^a-zA-Z0-9]+', '-', 'g'))
    )
    THEN LOWER(REGEXP_REPLACE(va.company_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || va.id::text
    ELSE LOWER(REGEXP_REPLACE(va.company_name, '[^a-zA-Z0-9]+', '-', 'g'))
  END
FROM vendor_applications va
WHERE application_status = 'approved'
  AND (
    application_metadata->>'vendor_id' IS NULL
    OR application_metadata = '{}'::jsonb
    OR application_metadata IS NULL
  )
RETURNING id, company_name;

-- Update vendor_applications to mark them as converted
UPDATE vendor_applications va
SET application_metadata = COALESCE(application_metadata, '{}'::jsonb) ||
  jsonb_build_object(
    'vendor_id', v.id,
    'converted_at', NOW(),
    'migrated', true
  )
FROM vendors v
WHERE va.application_status = 'approved'
  AND va.company_name = v.company_name
  AND va.business_email = v.contact_email
  AND (
    va.application_metadata->>'vendor_id' IS NULL
    OR va.application_metadata = '{}'::jsonb
    OR va.application_metadata IS NULL
  );

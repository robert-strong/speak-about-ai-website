-- Add contract and invoice link fields to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS contract_link VARCHAR(500),
ADD COLUMN IF NOT EXISTS invoice_link_1 VARCHAR(500),
ADD COLUMN IF NOT EXISTS invoice_link_2 VARCHAR(500),
ADD COLUMN IF NOT EXISTS contract_signed_date DATE,
ADD COLUMN IF NOT EXISTS invoice_1_sent_date DATE,
ADD COLUMN IF NOT EXISTS invoice_2_sent_date DATE;

-- Add similar fields to projects table for consistency
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS contract_link VARCHAR(500),
ADD COLUMN IF NOT EXISTS invoice_link_1 VARCHAR(500),
ADD COLUMN IF NOT EXISTS invoice_link_2 VARCHAR(500);

-- Add comments for documentation
COMMENT ON COLUMN deals.contract_link IS 'Google Drive or other link to signed contract';
COMMENT ON COLUMN deals.invoice_link_1 IS 'Link to first invoice (usually 50% upfront)';
COMMENT ON COLUMN deals.invoice_link_2 IS 'Link to second invoice (usually 50% on completion)';

COMMENT ON COLUMN projects.contract_link IS 'Google Drive or other link to signed contract';
COMMENT ON COLUMN projects.invoice_link_1 IS 'Link to first invoice (usually 50% upfront)';
COMMENT ON COLUMN projects.invoice_link_2 IS 'Link to second invoice (usually 50% on completion)';
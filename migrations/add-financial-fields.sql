-- Add financial tracking fields to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS financial_notes TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deals_payment_status ON deals(payment_status);
CREATE INDEX IF NOT EXISTS idx_deals_commission_amount ON deals(commission_amount);
CREATE INDEX IF NOT EXISTS idx_deals_invoice_number ON deals(invoice_number);

-- Update existing won deals with default commission
UPDATE deals 
SET commission_percentage = 20.00,
    commission_amount = deal_value * 0.20
WHERE status = 'won' 
  AND commission_percentage IS NULL;

-- Add financial fields to projects table for tracking
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS actual_revenue NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS financial_notes TEXT;

-- Create a view for financial reporting
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    d.id as deal_id,
    d.client_name,
    d.client_email,
    d.company,
    d.event_title,
    d.event_date,
    d.deal_value,
    d.commission_percentage,
    COALESCE(d.commission_amount, d.deal_value * d.commission_percentage / 100) as commission_amount,
    d.payment_status,
    d.payment_date,
    d.invoice_number,
    d.won_date,
    p.id as project_id,
    p.project_name,
    p.budget as project_budget,
    p.speaker_fee,
    p.status as project_status,
    EXTRACT(YEAR FROM d.won_date) as year,
    EXTRACT(MONTH FROM d.won_date) as month,
    EXTRACT(QUARTER FROM d.won_date) as quarter
FROM deals d
LEFT JOIN projects p ON p.client_email = d.client_email 
    AND p.event_date = d.event_date
WHERE d.status = 'won';

-- Add comment for documentation
COMMENT ON VIEW financial_summary IS 'Consolidated view of financial data from won deals and associated projects';
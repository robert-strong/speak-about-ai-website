-- Add columns for tracking lost deal information
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS lost_reason TEXT,
ADD COLUMN IF NOT EXISTS lost_details TEXT,
ADD COLUMN IF NOT EXISTS worth_follow_up BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS lost_competitor TEXT,
ADD COLUMN IF NOT EXISTS lost_next_steps TEXT,
ADD COLUMN IF NOT EXISTS lost_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS won_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS closed_notes TEXT;

-- Add index for faster queries on deal status and dates
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_lost_date ON deals(lost_date);
CREATE INDEX IF NOT EXISTS idx_deals_won_date ON deals(won_date);
CREATE INDEX IF NOT EXISTS idx_deals_follow_up ON deals(follow_up_date) WHERE worth_follow_up = true;

-- Add a computed column or view for "past deals" (won or lost)
CREATE OR REPLACE VIEW past_deals AS
SELECT * FROM deals 
WHERE status IN ('won', 'lost')
ORDER BY COALESCE(won_date, lost_date) DESC;
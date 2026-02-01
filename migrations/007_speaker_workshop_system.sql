-- Add workshop categories and grouping system
-- This allows speakers to have organized workshop offerings

-- Add category field to workshops table
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge_text VARCHAR(50); -- e.g., "Most Popular", "Half Day", "2 Hours"

-- Update Joan's workshops with categories and badges
UPDATE workshops SET category = 'AI for Enterprise', badge_text = 'Most Popular', display_order = 1 WHERE slug = '3-ai-tools-workshop';
UPDATE workshops SET category = 'AI for Enterprise', badge_text = 'Popular 3 Series Suite', display_order = 2 WHERE slug = 'ai-tools-to-workflows';
UPDATE workshops SET category = 'AI for Enterprise', badge_text = 'Popular 3 Series Suite', display_order = 3 WHERE slug = 'future-proof-business-ai-roi';
UPDATE workshops SET category = 'Executive Offerings', badge_text = '2 Hours', display_order = 4 WHERE slug = 'executive-strategy-session';
UPDATE workshops SET category = 'Speaking & Keynotes', badge_text = '60 Minutes', display_order = 5 WHERE slug = 'ai-innovation-keynote';
UPDATE workshops SET category = 'Custom Programs', badge_text = 'Fully Customizable', display_order = 6 WHERE slug = 'custom-internal-ai-course';
UPDATE workshops SET category = 'AI Implementation', display_order = 7 WHERE slug = 'ai-strategy-implementation-joan-bajorek';

-- Add ROI stats field for displaying workshop impact
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS roi_stats JSONB;

-- Update Joan's workshops with ROI stats
UPDATE workshops
SET roi_stats = '{"stat1": "20%-200% efficiency gains", "stat2": "14% productivity boost (Stanford/MIT)", "stat3": "Seven-figure ROI possible"}'::jsonb
WHERE slug IN ('3-ai-tools-workshop', 'ai-tools-to-workflows', 'future-proof-business-ai-roi');

UPDATE workshops
SET roi_stats = '{"stat1": "60% higher revenue growth by 2027", "stat2": "50% greater cost reductions (BCG 2024)", "stat3": "5-year P&L optimization"}'::jsonb
WHERE slug = 'future-proof-business-ai-roi';

-- Add index on category for filtering
CREATE INDEX IF NOT EXISTS idx_workshops_category ON workshops(category) WHERE category IS NOT NULL;

-- Add index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_workshops_display_order ON workshops(display_order);

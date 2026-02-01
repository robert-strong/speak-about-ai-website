-- Add testimonials and client logos fields to workshops table

-- Add testimonials as JSONB array
-- Each testimonial will have: name, role, company, quote, photo_url
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;

-- Add client logos as text array
ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS client_logos TEXT[] DEFAULT '{}';

-- Add index for JSONB testimonials
CREATE INDEX IF NOT EXISTS idx_workshops_testimonials ON workshops USING GIN(testimonials);

-- Add sample testimonial structure comment
COMMENT ON COLUMN workshops.testimonials IS 'Array of testimonials in format: [{"name": "John Doe", "role": "CEO", "company": "Acme Inc", "quote": "Great workshop!", "photo_url": "https://..."}]';
COMMENT ON COLUMN workshops.client_logos IS 'Array of company logo URLs for clients who have taken the workshop';

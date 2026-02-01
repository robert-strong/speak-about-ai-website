-- Update Chris Barton to include Voice Technology in expertise for better similarity with Adam Cheyer
UPDATE speakers
SET expertise = '["Innovation", "Friction Elimination", "Creative Persistence", "AI Applications", "Startup Strategy", "Voice Technology"]'::jsonb
WHERE slug = 'chris-barton';

-- Verify the update
SELECT slug, name, expertise, industries
FROM speakers
WHERE slug = 'chris-barton';

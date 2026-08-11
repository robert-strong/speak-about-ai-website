-- Adds hand-authored answer-page fields to speaker profiles.
-- best_for: JSONB array of audience/event fit strings, e.g.
--   ["Fortune 500 leadership offsites", "Non-technical executive audiences"]
-- custom_faqs: JSONB array of {"question": "...", "answer": "..."} objects;
--   rendered ahead of the auto-generated FAQs on the public profile.
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS best_for JSONB DEFAULT '[]'::jsonb;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS custom_faqs JSONB DEFAULT '[]'::jsonb;

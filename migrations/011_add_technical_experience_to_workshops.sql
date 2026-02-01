-- Add technical_experience_needed field to workshops table

ALTER TABLE workshops
ADD COLUMN IF NOT EXISTS technical_experience_needed TEXT;

COMMENT ON COLUMN workshops.technical_experience_needed IS 'Technical experience level required for the workshop (e.g., Beginner, Intermediate, Advanced, or custom description)';

-- Add missing columns to speaker_applications table
-- This migration adds all the fields that the application form collects but weren't being saved

-- Step 1 Qualification fields
ALTER TABLE speaker_applications
ADD COLUMN IF NOT EXISTS speaking_experience VARCHAR(50),
ADD COLUMN IF NOT EXISTS notable_organizations TEXT,
ADD COLUMN IF NOT EXISTS ai_expertise TEXT,
ADD COLUMN IF NOT EXISTS unique_perspective TEXT,
ADD COLUMN IF NOT EXISTS audience_size_preference VARCHAR(100);

-- Step 2: Personal Information fields
ALTER TABLE speaker_applications
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS headshot_url VARCHAR(500);

-- Step 3: Professional Background fields
ALTER TABLE speaker_applications
ADD COLUMN IF NOT EXISTS short_bio TEXT,
ADD COLUMN IF NOT EXISTS achievements TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT;

-- Step 4: Speaking Expertise fields
ALTER TABLE speaker_applications
ADD COLUMN IF NOT EXISTS signature_talks TEXT,
ADD COLUMN IF NOT EXISTS industries_experience TEXT[],
ADD COLUMN IF NOT EXISTS case_studies TEXT;

-- Step 5: Speaking Experience fields
ALTER TABLE speaker_applications
ADD COLUMN IF NOT EXISTS total_engagements VARCHAR(50),
ADD COLUMN IF NOT EXISTS client_testimonials TEXT,
ADD COLUMN IF NOT EXISTS media_coverage TEXT;

-- Step 6: Digital Presence fields
ALTER TABLE speaker_applications
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS blog_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS published_content TEXT,
ADD COLUMN IF NOT EXISTS podcast_appearances TEXT;

-- Step 7: Logistics & Availability fields
ALTER TABLE speaker_applications
ADD COLUMN IF NOT EXISTS booking_lead_time VARCHAR(100),
ADD COLUMN IF NOT EXISTS availability_constraints TEXT,
ADD COLUMN IF NOT EXISTS technical_requirements TEXT;

-- Step 8: References & Final fields
ALTER TABLE speaker_applications
ADD COLUMN IF NOT EXISTS past_client_references TEXT,
ADD COLUMN IF NOT EXISTS speaker_bureau_experience TEXT,
ADD COLUMN IF NOT EXISTS why_speak_about_ai TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT,
ADD COLUMN IF NOT EXISTS agree_to_terms BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN speaker_applications.speaking_experience IS 'Experience level: beginner, intermediate, advanced, expert';
COMMENT ON COLUMN speaker_applications.notable_organizations IS 'List of notable organizations spoken for';
COMMENT ON COLUMN speaker_applications.ai_expertise IS 'Specific expertise in AI/technology';
COMMENT ON COLUMN speaker_applications.unique_perspective IS 'What unique perspective they bring';
COMMENT ON COLUMN speaker_applications.headshot_url IS 'URL to professional headshot image';
COMMENT ON COLUMN speaker_applications.industries_experience IS 'Array of industries they have spoken to';
COMMENT ON COLUMN speaker_applications.agree_to_terms IS 'Whether applicant agreed to terms and conditions';

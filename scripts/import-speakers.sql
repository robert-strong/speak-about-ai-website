-- Import speakers data with proper JSON formatting
-- First, let's create a temporary table to import the raw CSV data

CREATE TEMP TABLE temp_speakers (
    name VARCHAR(255),
    email VARCHAR(255),
    slug VARCHAR(255),
    title VARCHAR(255),
    bio TEXT,
    short_bio VARCHAR(500),
    headshot_url VARCHAR(500),
    speaking_fee_range VARCHAR(100),
    featured BOOLEAN,
    active BOOLEAN,
    listed BOOLEAN,
    ranking INTEGER,
    location VARCHAR(255),
    programs TEXT,
    topics_raw TEXT,
    industries_raw TEXT,
    image_position VARCHAR(50),
    image_offset VARCHAR(50),
    videos_raw TEXT,
    testimonials_raw TEXT
);

-- Import the CSV data into the temp table (we'll run the \copy command separately)

-- Now insert into the main speakers table with proper JSON conversion
INSERT INTO speakers (
    name, email, slug, title, bio, short_bio, headshot_url, speaking_fee_range,
    featured, active, listed, ranking, location, programs, topics, industries,
    image_position, image_offset, videos, testimonials
)
SELECT 
    name,
    email,
    slug,
    title,
    bio,
    short_bio,
    headshot_url,
    NULLIF(speaking_fee_range, ''),
    featured,
    active,
    listed,
    ranking,
    location,
    programs,
    -- Convert comma-separated topics to JSON array
    CASE 
        WHEN topics_raw = '' OR topics_raw IS NULL THEN '[]'::jsonb
        ELSE json_build_array(string_to_array(topics_raw, ', '))::jsonb
    END as topics,
    -- Convert comma-separated industries to JSON array  
    CASE
        WHEN industries_raw = '' OR industries_raw IS NULL THEN '[]'::jsonb
        ELSE json_build_array(string_to_array(industries_raw, ', '))::jsonb
    END as industries,
    NULLIF(image_position, ''),
    NULLIF(image_offset, ''),
    -- Convert videos - handle empty arrays
    CASE
        WHEN videos_raw = '[]' OR videos_raw = '' OR videos_raw IS NULL THEN '[]'::jsonb
        ELSE videos_raw::jsonb
    END as videos,
    -- Convert testimonials - handle empty arrays
    CASE
        WHEN testimonials_raw = '[]' OR testimonials_raw = '' OR testimonials_raw IS NULL THEN '[]'::jsonb
        ELSE testimonials_raw::jsonb
    END as testimonials
FROM temp_speakers
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    title = EXCLUDED.title,
    bio = EXCLUDED.bio,
    short_bio = EXCLUDED.short_bio,
    headshot_url = EXCLUDED.headshot_url,
    speaking_fee_range = EXCLUDED.speaking_fee_range,
    featured = EXCLUDED.featured,
    active = EXCLUDED.active,
    listed = EXCLUDED.listed,
    ranking = EXCLUDED.ranking,
    location = EXCLUDED.location,
    programs = EXCLUDED.programs,
    topics = EXCLUDED.topics,
    industries = EXCLUDED.industries,
    image_position = EXCLUDED.image_position,
    image_offset = EXCLUDED.image_offset,
    videos = EXCLUDED.videos,
    testimonials = EXCLUDED.testimonials,
    updated_at = CURRENT_TIMESTAMP;
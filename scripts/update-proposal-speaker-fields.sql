-- Update proposal speaker structure to include availability and video URL
-- This updates the JSONB structure stored in the speakers column

-- First, let's check if any proposals exist
DO $$
BEGIN
    -- Update any existing proposals to include the new fields
    UPDATE proposals
    SET speakers = (
        SELECT jsonb_agg(
            speaker || 
            jsonb_build_object(
                'availability_confirmed', COALESCE((speaker->>'availability_confirmed')::boolean, false),
                'video_url', COALESCE(speaker->>'video_url', ''),
                'image_url', COALESCE(speaker->>'image_url', '')
            )
        )
        FROM jsonb_array_elements(speakers) AS speaker
    )
    WHERE speakers IS NOT NULL AND speakers != '[]'::jsonb;
    
    RAISE NOTICE 'Updated existing proposals with new speaker fields';
END $$;

-- Add a comment to document the expected speaker structure
COMMENT ON COLUMN proposals.speakers IS 'JSON array of speaker objects with structure: {name, title, bio, topics[], fee, availability_confirmed, video_url, image_url, relevance_text}';
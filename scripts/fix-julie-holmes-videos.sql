-- Fix Julie Holmes' video data specifically

-- 1. First, check current state
SELECT 
    id,
    name,
    slug,
    jsonb_array_length(videos) as video_count,
    videos
FROM speakers
WHERE slug = 'julie-holmes';

-- 2. Update Julie Holmes with proper video data
UPDATE speakers
SET videos = '[
    {
        "id": "julieholmesvideo1",
        "title": "National Sales Conference 2023 Sales in the Age of AI Julie Holmes",
        "url": "https://www.youtube.com/watch?v=BrRzPsUPwvs",
        "thumbnail": "https://i.ytimg.com/vi/BrRzPsUPwvs/hqdefault.jpg",
        "source": "YouTube",
        "duration": "20:31"
    }
]'::jsonb
WHERE slug = 'julie-holmes';

-- 3. Verify the update
SELECT 
    id,
    name,
    slug,
    jsonb_array_length(videos) as video_count,
    jsonb_pretty(videos) as videos_pretty
FROM speakers
WHERE slug = 'julie-holmes';

-- 4. Check for any proposals that need updating
-- This finds proposals with Julie Holmes but no video data
SELECT 
    p.id,
    p.proposal_number,
    p.created_at,
    s->>'name' as speaker_name,
    s->>'video_url' as current_video_url,
    s->'videos' as current_videos
FROM proposals p,
     jsonb_array_elements(p.speakers) s
WHERE s->>'name' LIKE '%Julie Holmes%'
  AND (s->>'video_url' IS NULL OR s->>'video_url' = '')
ORDER BY p.created_at DESC;

-- 5. Update proposals with Julie Holmes to include video URL
-- This updates ALL proposals containing Julie Holmes to have the correct video URL
UPDATE proposals
SET speakers = (
    SELECT jsonb_agg(
        CASE 
            WHEN speaker->>'name' = 'Julie Holmes' THEN
                speaker || jsonb_build_object(
                    'video_url', 'https://www.youtube.com/watch?v=BrRzPsUPwvs',
                    'videos', '[{"id": "julieholmesvideo1", "title": "National Sales Conference 2023 Sales in the Age of AI Julie Holmes", "url": "https://www.youtube.com/watch?v=BrRzPsUPwvs", "thumbnail": "https://i.ytimg.com/vi/BrRzPsUPwvs/hqdefault.jpg", "source": "YouTube", "duration": "20:31"}]'::jsonb
                )
            ELSE
                speaker
        END
    )
    FROM jsonb_array_elements(speakers) AS speaker
)
WHERE speakers::text LIKE '%Julie Holmes%';

-- 6. Verify the updates in proposals
SELECT 
    p.id,
    p.proposal_number,
    p.created_at,
    jsonb_pretty(
        (SELECT s 
         FROM jsonb_array_elements(p.speakers) s 
         WHERE s->>'name' = 'Julie Holmes'
         LIMIT 1)
    ) as julie_data_after_update
FROM proposals p
WHERE p.speakers::text LIKE '%Julie Holmes%'
ORDER BY p.created_at DESC
LIMIT 5;
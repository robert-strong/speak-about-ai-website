-- 1. First check Julie's data in the speakers table
SELECT 
    id,
    name, 
    slug, 
    jsonb_array_length(videos) as video_count,
    videos->0->>'url' as first_video_url,
    jsonb_pretty(videos) as videos_formatted
FROM speakers
WHERE slug = 'julie-holmes' OR name LIKE '%Julie%';

-- 2. Check a recent proposal to see how speaker data is stored
SELECT 
    id,
    proposal_number,
    title,
    jsonb_array_length(speakers) as speaker_count,
    speakers->0->>'name' as first_speaker_name,
    speakers->0->>'video_url' as first_speaker_video_url,
    jsonb_pretty(speakers) as speakers_formatted
FROM proposals
WHERE speakers::text LIKE '%Julie%'
ORDER BY created_at DESC
LIMIT 1;

-- 3. If you need to manually update a proposal's speaker video URLs
-- Replace PROPOSAL_ID with actual proposal ID
/*
UPDATE proposals
SET speakers = (
    SELECT jsonb_agg(
        CASE 
            WHEN speaker->>'name' = 'Julie Holmes' THEN
                speaker || jsonb_build_object('video_url', 'https://www.youtube.com/watch?v=BrRzPsUPwvs')
            ELSE
                speaker
        END
    )
    FROM jsonb_array_elements(speakers) AS speaker
)
WHERE id = PROPOSAL_ID;
*/
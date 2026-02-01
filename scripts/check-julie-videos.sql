-- Check Julie Holmes' video data in the database
SELECT 
    id,
    name,
    slug,
    jsonb_array_length(videos) as video_count,
    jsonb_pretty(videos) as videos_formatted
FROM speakers
WHERE slug = 'julie-holmes' OR name LIKE '%Julie Holmes%';

-- Check if any proposals contain Julie Holmes with video data
SELECT 
    p.id,
    p.proposal_number,
    p.created_at,
    s->>'name' as speaker_name,
    s->>'video_url' as speaker_video_url,
    s->'videos' as speaker_videos
FROM proposals p,
     jsonb_array_elements(p.speakers) s
WHERE s->>'name' LIKE '%Julie Holmes%'
ORDER BY p.created_at DESC
LIMIT 5;

-- Show the exact structure of Julie's speaker data in a recent proposal
SELECT 
    p.id,
    p.proposal_number,
    jsonb_pretty(
        (SELECT s 
         FROM jsonb_array_elements(p.speakers) s 
         WHERE s->>'name' LIKE '%Julie Holmes%'
         LIMIT 1)
    ) as julie_speaker_data
FROM proposals p
WHERE p.speakers::text LIKE '%Julie Holmes%'
ORDER BY p.created_at DESC
LIMIT 1;
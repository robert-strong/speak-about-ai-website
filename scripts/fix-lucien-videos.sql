-- Fix Lucien Engelen's missing video data
UPDATE speakers
SET videos = '[
  {
    "id": "lucienengelenvideo1",
    "title": "Healthcare Has a Plumber''s Problem: Lucien Engelen at NextMed Health",
    "url": "https://www.youtube.com/watch?v=NoMW-3PFToI",
    "thumbnail": "https://i.ytimg.com/vi/NoMW-3PFToI/hqdefault.jpg",
    "source": "YouTube",
    "duration": "15:59"
  },
  {
    "id": "lucienengelenvideo2",
    "title": "Lucien Engelen: Crowdsource your health",
    "url": "https://www.youtube.com/watch?v=dWZP8cUEB7Y",
    "thumbnail": "https://i.ytimg.com/vi/dWZP8cUEB7Y/hqdefault.jpg",
    "source": "YouTube",
    "duration": "06:13"
  }
]'::jsonb
WHERE slug = 'lucien-engelen';

-- Verify the update
SELECT name, slug, jsonb_array_length(videos) as video_count, videos
FROM speakers
WHERE slug = 'lucien-engelen';
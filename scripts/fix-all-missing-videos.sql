-- Fix missing video data for all affected speakers
-- Based on the original CSV data

-- Aviv Ovadya
UPDATE speakers
SET videos = '[
  {
    "id": "avivovadyavideo1",
    "title": "Fake news is about to get much worse. Here''s a solution. | Aviv Ovadya | TEDxMileHigh",
    "url": "https://www.youtube.com/watch?v=eeO2aI0qMyA",
    "thumbnail": "https://i.ytimg.com/vi/eeO2aI0qMyA/hqdefault.jpg",
    "source": "YouTube",
    "duration": "14:12"
  },
  {
    "id": "avivovadyavideo2",
    "title": "Aviv Ovadya: Can We Trust Anything? | Digitas \"Trust Me*\" NewFront 2019",
    "url": "https://www.youtube.com/watch?v=X8LRr_XP7r8",
    "thumbnail": "https://i.ytimg.com/vi/X8LRr_XP7r8/hqdefault.jpg",
    "source": "YouTube",
    "duration": "20:45"
  }
]'::jsonb
WHERE slug = 'aviv-ovadya';

-- Tatyana Mamut
UPDATE speakers
SET videos = '[
  {
    "id": "tatyanamamutvideo1",
    "title": "Culture First: Tatyana Mamut on 5 hidden risks threatening your company culture",
    "url": "https://www.youtube.com/watch?v=o2aWr7gNTl8",
    "thumbnail": "https://i.ytimg.com/vi/o2aWr7gNTl8/hqdefault.jpg",
    "source": "YouTube",
    "duration": "58:21"
  },
  {
    "id": "tatyanamamutvideo2",
    "title": "AI and The Human Touch with Tatyana Mamut, PhD | The Silicon Valley Podcast",
    "url": "https://www.youtube.com/watch?v=YCg7LW7TzpQ",
    "thumbnail": "https://i.ytimg.com/vi/YCg7LW7TzpQ/hqdefault.jpg",
    "source": "YouTube",
    "duration": "42:38"
  }
]'::jsonb
WHERE slug = 'tatyana-mamut';

-- Stefano Bini
UPDATE speakers
SET videos = '[
  {
    "id": "stefanobinivideo1",
    "title": "The Impact of Generative AI on Healthcare with Dr. Stefano Bini",
    "url": "https://www.youtube.com/watch?v=lrMU94U4Plg",
    "thumbnail": "https://i.ytimg.com/vi/lrMU94U4Plg/hqdefault.jpg",
    "source": "YouTube",
    "duration": "01:00:45"
  },
  {
    "id": "stefanobinivideo2",
    "title": "Meet the Doctor, Dr. Stefano Bini, MD",
    "url": "https://www.youtube.com/watch?v=rjihgvJLn5A",
    "thumbnail": "https://i.ytimg.com/vi/rjihgvJLn5A/hqdefault.jpg",
    "source": "YouTube",
    "duration": "03:52"
  }
]'::jsonb
WHERE slug = 'stefano-bini';

-- Lucien Engelen
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

-- Divya Chander
UPDATE speakers
SET videos = '[
  {
    "id": "divyachandervideo1",
    "title": "Asking where consciousness comes from | Divya Chander",
    "url": "https://www.youtube.com/watch?v=SuKP-o9MHKI",
    "thumbnail": "https://i.ytimg.com/vi/SuKP-o9MHKI/hqdefault.jpg",
    "source": "YouTube",
    "duration": "12:48"
  }
]'::jsonb
WHERE slug = 'divya-chander';

-- Julie Holmes
UPDATE speakers
SET videos = '[
  {
    "id": "julieholmesvideo1",
    "title": "National Sales Conference 2023 Sales in the Age of AI Julie Holmes",
    "url": "https://www.youtube.com/watch?v=BrRzPsUPwvs",
    "thumbnail": "https://i.ytimg.com/vi/BrRzPsUPwvs/hqdefault.jpg",
    "source": "YouTube",
    "duration": "20:31"
  },
  {
    "id": "julieholmesvideo2",
    "title": "Julie Holmes | Innovation, Tech and AI Keynote Speaker | Demo Video | Showreel",
    "url": "https://www.youtube.com/watch?v=bLQzJGOdIZw",
    "thumbnail": "https://i.ytimg.com/vi/bLQzJGOdIZw/hqdefault.jpg",
    "source": "YouTube",
    "duration": "02:59"
  }
]'::jsonb
WHERE slug = 'julie-holmes';

-- Lital Marom
UPDATE speakers
SET videos = '[
  {
    "id": "litalmaromvideo1",
    "title": "Keynote Speaker Lital Marom | RBC Sales Training Roadshow",
    "url": "https://www.youtube.com/watch?v=x0SH8L4rDGg",
    "thumbnail": "https://i.ytimg.com/vi/x0SH8L4rDGg/hqdefault.jpg",
    "source": "YouTube",
    "duration": "04:28"
  },
  {
    "id": "litalmaromvideo2",
    "title": "Lital Marom Reel",
    "url": "https://www.youtube.com/watch?v=UQ_sQxcQITA",
    "thumbnail": "https://i.ytimg.com/vi/UQ_sQxcQITA/hqdefault.jpg",
    "source": "YouTube",
    "duration": "02:15"
  }
]'::jsonb
WHERE slug = 'lital-marom';

-- Add testimonials for speakers who have them
-- Julie Holmes
UPDATE speakers
SET testimonials = '[
  {
    "quote": "Julie Holmes was incredible! Every association should be including AI strategy and execution programs for their members – they need it, want it, and love it!",
    "author": "",
    "author_title": "",
    "company": ""
  },
  {
    "quote": "Julie Holmes is an engaging and inspiring speaker. As the Opening Keynote Speaker for our group of meeting and event professionals, she brought such awesome energy and enthusiasm to the stage first thing in the morning. Julie was dynamite! I enjoyed her energy, storytelling, creativity, and the personal connection she made with the audience during her presentation – which kept our attention.",
    "author": "",
    "author_title": "",
    "company": ""
  }
]'::jsonb
WHERE slug = 'julie-holmes';

-- Lital Marom
UPDATE speakers
SET testimonials = '[
  {
    "quote": "Ms Lital Marom is a well established thought leader in AI centric business organisations.",
    "author": "",
    "author_title": "",
    "company": ""
  },
  {
    "quote": "CPHR BC & Yukon recently engaged Lital Marom as a keynote speaker for our annual HR Conference & Expo. Many conference attendees shared that Lital''s was one of the most impactful presentations they have ever experienced. Her expertise in business transformation and future-focused strategies really resonated, but what stood out for many was Lital''s talent for storytelling and her ability to make complex concepts accessible. The content was relevant for our audience of HR professionals as it delivered cutting-edge insights on organizational growth while also providing practical tools for transformation. Her session was a highlight of our conference, leaving attendees motivated, inspired, and equipped to drive change.",
    "author": "",
    "author_title": "",
    "company": "CPHR BC & Yukon"
  }
]'::jsonb
WHERE slug = 'lital-marom';

-- Verify all updates
SELECT 
    name, 
    slug, 
    jsonb_array_length(videos) as video_count,
    jsonb_array_length(testimonials) as testimonial_count
FROM speakers
WHERE slug IN (
    'aviv-ovadya', 
    'tatyana-mamut', 
    'stefano-bini', 
    'lucien-engelen', 
    'divya-chander', 
    'julie-holmes', 
    'lital-marom',
    'andrew-mayne',
    'chris-jones',
    'noah-cheyer',
    'reed-dickson',
    'rene-caissie',
    'sagar-savla',
    'sonal-gupta'
)
ORDER BY name;

-- Note: The following speakers don't have videos in the CSV data:
-- - Andrew Mayne (no videos listed)
-- - Chris Jones (no videos listed)
-- - Noah Cheyer (no videos listed)
-- - Reed Dickson (no videos listed)
-- - Rene Caissie (no videos listed)
-- - Sagar Savla (no videos listed)
-- - Sonal Gupta (no videos listed)
-- Generated Speaker Migration SQL
-- Run this in your Neon database console
-- Total speakers to import: 2
-- NOTE: Email addresses will need to be added manually or from another source

-- Speaker 1: Peter Norvig
INSERT INTO speakers (
    name, 
    email, 
    bio, 
    short_bio, 
    one_liner, 
    headshot_url, 
    topics,
    speaking_fee_range,
    slug,
    title,
    featured,
    location,
    programs,
    listed,
    industries,
    ranking,
    image_position,
    image_offset,
    videos,
    testimonials,
    active,
    email_verified
) VALUES (
    'Peter Norvig',
    'peter-norvig@speakaboutai.com', -- PLACEHOLDER - UPDATE WITH REAL EMAIL
    'Past Present & Future of AI', -- Full biography
    'Past Present & Future of AI.', -- Short bio from full bio
    'Co-Author of "Artificial Intelligence: A Modern Approach," Stanford Researcher, and Director of Research and Search Quality at Google,TRUE,https://oo7gkn3bwcev8cb0.public.blob.vercel-storage.com/peter-norvig-headshot-1749608907310.jpg,"Peter Norvig, a ...', -- One-liner from title
    'San Francisco CA', -- Image URL
    '[]', -- Topics as JSON array
    'TRUE', -- Speaking fee range
    'peter-norvig', -- URL slug
    'Co-Author of "Artificial Intelligence: A Modern Approach," Stanford Researcher, and Director of Research and Search Quality at Google,TRUE,https://oo7gkn3bwcev8cb0.public.blob.vercel-storage.com/peter-norvig-headshot-1749608907310.jpg,"Peter Norvig, a ...', -- Professional title
    false, -- Featured boolean
    'AI Research, Machine Learning, Natural Language Processing, Computer Science Education, Search Algorithms, Academic Leadership', -- Location
    'Technology, Academia, Aerospace, Education Technology', -- Programs
    true, -- Listed boolean
    '["[{\"id\": \"peternorvigvideo1\"","\"title\": \"The Future of AI: A Fireside Chat Between Peter Norvig & Adam Cheyer\"","\"url\": \"https://www.youtube.com/watch?v=mSmJkzKwVCw\"","\"thumbnail\": \"https://i.ytimg.com/vi/mSmJkzKwVCw/hqdefault.jpg\"","\"source\": \"YouTube\"","\"duration\": \"18:14\"}","{\"id\": \"peternorvigvideo2\"","\"title\": \"Peter Norvig: The 100","000-student classroom\"","\"url\": \"https://www.youtube.com/watch?v=tYclUdcsdeo\"","\"thumbnail\": \"https://i.ytimg.com/vi/tYclUdcsdeo/hqdefault.jpg\"","\"source\": \"YouTube\"","\"duration\": \"6:11\"}]"]', -- Industries as JSON array
    NULL, -- Ranking number
    NULL, -- Image position
    NULL, -- Image offset
    '[]', -- Videos JSON
    '[]', -- Testimonials JSON
    true, -- Active
    false  -- They'll need to register and verify email
);

-- Speaker 2: Adam Cheyer
INSERT INTO speakers (
    name, 
    email, 
    bio, 
    short_bio, 
    one_liner, 
    headshot_url, 
    topics,
    speaking_fee_range,
    slug,
    title,
    featured,
    location,
    programs,
    listed,
    industries,
    ranking,
    image_position,
    image_offset,
    videos,
    testimonials,
    active,
    email_verified
) VALUES (
    'Adam Cheyer',
    'adam-cheyer@speakaboutai.com', -- PLACEHOLDER - UPDATE WITH REAL EMAIL
    'Adam is an expert in entrepreneurship, artificial intelligence, and scaling startups. With over ten years of experience founding and exiting companies, he was a co-founder of Siri, which Apple acquired, co-founded Viv Labs, which was acquired by Samsung, and Gameplanner.AI, which was Airbnb‚Äôs first acquisition since going public. 

Through Siri and Bixby (Apple & Samsung‚Äôs voice assistants), Adam has created key technology in over 1.5 billion devices. A founding developer of Change.org, he‚Äôs helped unite 500M+ members to create social change across the globe. After his most recent acquisition, he leads all AI efforts at Airbnb as the VP of AI Experience. Adam is a 30+ year veteran in Artificial Intelligence, initially starting as a researcher at SRI International. With 39 patents and 60+ publications, his technical expertise and visionary approach to entrepreneurship are widely recognized across the globe. Before Siri, he co-founded Sentient Technologies, which applies distributed machine learning algorithms to discover novel solutions to complex problems.
 
Beyond his success in technology, Adam is also an award-winning magician. He‚Äôs performed on some of the most prestigious stages in magic, including the Magic Castle in Los Angeles and the hit TV show ‚ÄúPenn and Teller Fool Us.‚Äù As a bonus, Adam usually includes a magic trick as a way to entertain and delight during his keynotes.', -- Full biography
    'Adam is an expert in entrepreneurship, artificial intelligence, and scaling startups.', -- Short bio from full bio
    'VP of AI Experience at Airbnb Co-Founder of Siri', -- One-liner from title
    'https://oo7gkn3bwcev8cb0.public.blob.vercel-storage.com/adam-cheyer-headshot-1749607372221.jpg', -- Image URL
    '["Conversational AI","Voice Assistants","Entrepreneurship","Product Development","AI Product Strategy","Technology Innovation","Entrepreneurship"]', -- Topics as JSON array
    'Please Inquire', -- Speaking fee range
    'adam-cheyer', -- URL slug
    'VP of AI Experience at Airbnb Co-Founder of Siri', -- Professional title
    true, -- Featured boolean
    NULL, -- Location
    'ChatGPT and The Rise of Conversational AI, The Future of AI and Businesses, ‚ÄúHey SIRI‚Äù: A Founding Story', -- Programs
    true, -- Listed boolean
    '["Technology","Startups","Social Impact Organizations","Entertainment","Real Estate"]', -- Industries as JSON array
    98, -- Ranking number
    'top', -- Image position
    '100', -- Image offset
    '[{"id":"adamcheyervideo1","title":"The Future of AI: A Fireside Chat Between Peter Norvig & Adam Cheyer","url":"https://www.youtube.com/watch?v=mSmJkzKwVCw","thumbnail":"https://i.ytimg.com/vi/mSmJkzKwVCw/hqdefault.jpg","source":"YouTube","duration":"18:14"},{"id":"adamcheyervideo2","title":"Artificial Intelligence | Adam Cheyer of Viv Labs & Siri | SCALE 2017","url":"https://www.youtube.com/watch?v=016w517R1Hw","thumbnail":"https://i.ytimg.com/vi/016w517R1Hw/hqdefault.jpg","source":"YouTube","duration":"31:57"}]', -- Videos JSON
    '[]', -- Testimonials JSON
    true, -- Active
    false  -- They'll need to register and verify email
);


-- After importing speakers, link them to existing projects/deals:
UPDATE projects 
SET speaker_id = (
    SELECT id FROM speakers 
    WHERE LOWER(name) = LOWER(requested_speaker_name)
) 
WHERE requested_speaker_name IS NOT NULL 
AND speaker_id IS NULL;

UPDATE deals 
SET speaker_id = (
    SELECT id FROM speakers 
    WHERE LOWER(name) = LOWER(speaker_requested)
) 
WHERE speaker_requested IS NOT NULL 
AND speaker_id IS NULL;

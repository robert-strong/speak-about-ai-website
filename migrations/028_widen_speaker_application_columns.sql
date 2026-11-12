-- Speaker application form: free-text inputs were landing in narrow VARCHAR
-- columns. Applicants write sentences in "timezone" and "booking lead time"
-- (saved values already sit at 49/50 and 98/100 chars), and anyone one
-- character over got "value too long for type character varying" -> 500.
-- Widen every free-text column that the public form writes to TEXT.
-- Select-driven columns (speaking_fee_range, speaking_experience,
-- audience_size_preference, status) keep their limits.

ALTER TABLE speaker_applications
  ALTER COLUMN phone TYPE TEXT,
  ALTER COLUMN timezone TYPE TEXT,
  ALTER COLUMN total_engagements TYPE TEXT,
  ALTER COLUMN booking_lead_time TYPE TEXT,
  ALTER COLUMN first_name TYPE TEXT,
  ALTER COLUMN last_name TYPE TEXT,
  ALTER COLUMN location TYPE TEXT,
  ALTER COLUMN title TYPE TEXT,
  ALTER COLUMN company TYPE TEXT,
  ALTER COLUMN website TYPE TEXT,
  ALTER COLUMN linkedin_url TYPE TEXT,
  ALTER COLUMN headshot_url TYPE TEXT,
  ALTER COLUMN twitter_url TYPE TEXT,
  ALTER COLUMN youtube_url TYPE TEXT,
  ALTER COLUMN instagram_url TYPE TEXT,
  ALTER COLUMN blog_url TYPE TEXT;

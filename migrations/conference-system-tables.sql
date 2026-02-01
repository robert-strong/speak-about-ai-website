-- Conference Categories Table
CREATE TABLE IF NOT EXISTS conference_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- Emoji or icon class
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_conference_categories_slug ON conference_categories(slug);
CREATE INDEX idx_conference_categories_active ON conference_categories(is_active);
CREATE INDEX idx_conference_categories_order ON conference_categories(display_order);

-- Conferences Table
CREATE TABLE IF NOT EXISTS conferences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category_id INTEGER REFERENCES conference_categories(id),

  -- Basic Info
  organization VARCHAR(255),
  website_url TEXT,
  description TEXT,

  -- Date & Location
  start_date DATE,
  end_date DATE,
  date_display VARCHAR(255), -- For flexible date display like "25-28 April, 2026"
  location VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  venue VARCHAR(255),

  -- Recurring Info
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(50), -- 'Annually', 'Biannually', 'Quarterly'

  -- Speaking Opportunities
  cfp_open BOOLEAN DEFAULT false,
  cfp_link TEXT,
  cfp_deadline DATE,
  cfp_deadline_display VARCHAR(255),
  speaker_benefits TEXT, -- What speakers get (fees, travel, exposure, etc.)
  cfp_notes TEXT, -- Additional CFP information

  -- Contact Information
  contact_name VARCHAR(255),
  contact_role VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_linkedin TEXT,

  -- Status & Tracking
  status VARCHAR(50) DEFAULT 'to_do', -- 'to_do', 'passed_watch', 'blocked', 'attending', 'speaking'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'

  -- Stats
  estimated_attendees INTEGER,
  typical_speaker_count INTEGER,

  -- Media
  logo_url TEXT,
  banner_url TEXT,
  images JSONB DEFAULT '[]',

  -- Additional Info
  tags TEXT[],
  topics TEXT[], -- AI, Event Tech, MICE, Marketing, etc.
  target_audience TEXT, -- Event planners, marketers, executives, etc.
  event_format VARCHAR(100), -- 'In-person', 'Virtual', 'Hybrid'

  -- Internal tracking
  notes TEXT,
  internal_notes TEXT,

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,

  -- Flags
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,

  -- Admin
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

-- Add indexes
CREATE INDEX idx_conferences_slug ON conferences(slug);
CREATE INDEX idx_conferences_category ON conferences(category_id);
CREATE INDEX idx_conferences_status ON conferences(status);
CREATE INDEX idx_conferences_cfp_open ON conferences(cfp_open);
CREATE INDEX idx_conferences_start_date ON conferences(start_date);
CREATE INDEX idx_conferences_location ON conferences(city, country);
CREATE INDEX idx_conferences_featured ON conferences(featured);
CREATE INDEX idx_conferences_published ON conferences(published);
CREATE INDEX idx_conferences_tags ON conferences USING GIN(tags);
CREATE INDEX idx_conferences_topics ON conferences USING GIN(topics);

-- Conference Applications/Submissions Table (for tracking speaker applications)
CREATE TABLE IF NOT EXISTS conference_applications (
  id SERIAL PRIMARY KEY,
  conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
  speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,

  -- Application details
  application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_title VARCHAR(500),
  session_description TEXT,
  session_format VARCHAR(100), -- 'Keynote', 'Panel', 'Workshop', 'Breakout'
  session_duration INTEGER, -- in minutes

  -- Status tracking
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn'
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  decision_date TIMESTAMP,
  decision_notes TEXT,

  -- Follow-up
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,

  -- Outcome (if accepted)
  confirmed BOOLEAN DEFAULT false,
  speaking_date DATE,
  speaking_time TIME,
  room_assignment VARCHAR(255),
  compensation_amount DECIMAL(10,2),
  travel_covered BOOLEAN DEFAULT false,
  accommodation_covered BOOLEAN DEFAULT false,

  -- Internal
  internal_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conference_applications_conference ON conference_applications(conference_id);
CREATE INDEX idx_conference_applications_speaker ON conference_applications(speaker_id);
CREATE INDEX idx_conference_applications_status ON conference_applications(status);
CREATE INDEX idx_conference_applications_date ON conference_applications(application_date);

-- Conference Reviews/Ratings (post-event feedback)
CREATE TABLE IF NOT EXISTS conference_reviews (
  id SERIAL PRIMARY KEY,
  conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
  speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,

  -- Ratings (1-5)
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
  audience_quality_rating INTEGER CHECK (audience_quality_rating >= 1 AND audience_quality_rating <= 5),
  networking_rating INTEGER CHECK (networking_rating >= 1 AND networking_rating <= 5),

  -- Review
  review_title VARCHAR(255),
  review_text TEXT,
  pros TEXT,
  cons TEXT,

  -- Experience details
  attended_as VARCHAR(50), -- 'speaker', 'attendee', 'exhibitor'
  would_return BOOLEAN,
  would_recommend BOOLEAN,

  -- Metadata
  year_attended INTEGER,
  verified_attendance BOOLEAN DEFAULT false,

  -- Moderation
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  moderation_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conference_reviews_conference ON conference_reviews(conference_id);
CREATE INDEX idx_conference_reviews_speaker ON conference_reviews(speaker_id);
CREATE INDEX idx_conference_reviews_status ON conference_reviews(status);
CREATE INDEX idx_conference_reviews_rating ON conference_reviews(overall_rating);

-- Conference Subscribers (for updates and notifications)
CREATE TABLE IF NOT EXISTS conference_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(100),

  -- Preferences
  interested_topics TEXT[],
  preferred_locations TEXT[],
  cfp_alerts BOOLEAN DEFAULT true,
  newsletter BOOLEAN DEFAULT true,

  -- Status
  subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'unsubscribed'
  verified BOOLEAN DEFAULT false,

  -- Tracking
  last_email_sent TIMESTAMP,
  email_count INTEGER DEFAULT 0,
  last_login TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conference_subscribers_email ON conference_subscribers(email);
CREATE INDEX idx_conference_subscribers_status ON conference_subscribers(subscription_status);

-- Conference Saved/Favorites (for logged-in users)
CREATE TABLE IF NOT EXISTS conference_favorites (
  id SERIAL PRIMARY KEY,
  conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
  speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,

  -- Tracking
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,

  UNIQUE(conference_id, speaker_id)
);

CREATE INDEX idx_conference_favorites_conference ON conference_favorites(conference_id);
CREATE INDEX idx_conference_favorites_speaker ON conference_favorites(speaker_id);

-- Insert default categories
INSERT INTO conference_categories (name, slug, description, icon, display_order) VALUES
  ('MICE & Meetings', 'mice-meetings', 'Meetings, Incentives, Conferences, and Exhibitions industry events', '🏢', 1),
  ('Event Technology', 'event-technology', 'Technology and innovation for events', '💻', 2),
  ('Event Planning & Production', 'event-planning-production', 'Event planning, design, and production conferences', '📋', 3),
  ('Travel & Tourism', 'travel-tourism', 'Travel industry and destination marketing events', '✈️', 4),
  ('Marketing & Experience', 'marketing-experience', 'Experiential marketing and brand activation events', '🎯', 5),
  ('Association & Education', 'association-education', 'Association management and educational conferences', '🎓', 6),
  ('Sports & Entertainment', 'sports-entertainment', 'Sports events and entertainment industry conferences', '🎭', 7),
  ('Catering & Hospitality', 'catering-hospitality', 'Food service and hospitality industry events', '🍽️', 8),
  ('Audio Visual & Production', 'av-production', 'AV, lighting, and production technology conferences', '🎤', 9),
  ('Venue & Destination', 'venue-destination', 'Venue management and destination conferences', '🏛️', 10)
ON CONFLICT (slug) DO NOTHING;

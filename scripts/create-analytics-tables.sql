-- Analytics Database Schema for Speak About AI Website
-- Run this in your Neon database

-- Main page views table
CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  visitor_id VARCHAR(100) NOT NULL,
  page_path VARCHAR(500) NOT NULL,
  page_title VARCHAR(200),
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  user_agent TEXT,
  ip_address INET,
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50), -- mobile, desktop, tablet
  browser VARCHAR(100),
  os VARCHAR(100),
  screen_resolution VARCHAR(20),
  viewport_size VARCHAR(20),
  is_bot BOOLEAN DEFAULT FALSE,
  duration_seconds INTEGER, -- time spent on page
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events table for tracking specific actions
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  visitor_id VARCHAR(100) NOT NULL,
  event_name VARCHAR(100) NOT NULL, -- contact_form_submit, speaker_view, download, etc.
  event_category VARCHAR(50), -- engagement, conversion, navigation
  event_value DECIMAL(10,2), -- monetary value if applicable
  page_path VARCHAR(500),
  metadata JSONB, -- flexible storage for event-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily aggregated statistics
CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  new_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2), -- percentage
  avg_session_duration DECIMAL(10,2), -- seconds
  top_pages JSONB, -- {"/page": count, ...}
  top_referrers JSONB,
  top_countries JSONB,
  conversion_events INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visitor sessions
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL UNIQUE,
  visitor_id VARCHAR(100) NOT NULL,
  first_page VARCHAR(500),
  last_page VARCHAR(500),
  page_count INTEGER DEFAULT 1,
  duration_seconds INTEGER DEFAULT 0,
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  country VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  is_conversion BOOLEAN DEFAULT FALSE, -- did they complete a goal?
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- Sample data cleanup function (optional)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM events WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  DELETE FROM sessions WHERE started_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
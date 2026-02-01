-- Create landing_page_resources table for managing email resources
CREATE TABLE IF NOT EXISTS landing_page_resources (
  id SERIAL PRIMARY KEY,
  
  -- Matching patterns
  url_patterns TEXT[], -- Array of URL patterns to match
  title_patterns TEXT[], -- Array of title patterns to match
  
  -- Email content
  subject VARCHAR(255) NOT NULL,
  resource_content TEXT NOT NULL, -- HTML content for resources
  
  -- Metadata
  priority INTEGER DEFAULT 0, -- Higher priority resources are checked first
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  -- Usage stats
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_landing_resources_active ON landing_page_resources(is_active);
CREATE INDEX idx_landing_resources_priority ON landing_page_resources(priority DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_landing_resources_updated_at_trigger
BEFORE UPDATE ON landing_page_resources
FOR EACH ROW EXECUTE FUNCTION update_landing_resources_updated_at();
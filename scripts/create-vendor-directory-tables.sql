-- Create vendor directory tables
-- This script creates the necessary tables for the vendor directory feature

-- Vendor categories table
CREATE TABLE IF NOT EXISTS vendor_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category_id INTEGER REFERENCES vendor_categories(id),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  website VARCHAR(255),
  logo_url VARCHAR(500),
  description TEXT,
  services TEXT[], -- Array of services offered
  specialties TEXT[], -- Array of specialties
  pricing_range VARCHAR(50), -- e.g., "$", "$$", "$$$", "$$$$"
  minimum_budget DECIMAL(10, 2),
  location VARCHAR(255),
  years_in_business INTEGER,
  team_size VARCHAR(50), -- e.g., "1-10", "11-50", "51-200", "200+"
  certifications TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended
  tags TEXT[],
  social_media JSONB, -- { twitter: "", linkedin: "", instagram: "", etc. }
  portfolio_items JSONB, -- Array of portfolio items with title, description, image_url, link
  client_references JSONB, -- Array of client references
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by VARCHAR(255)
);

-- Vendor reviews/ratings table
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  reviewer_name VARCHAR(255) NOT NULL,
  reviewer_email VARCHAR(255) NOT NULL,
  reviewer_company VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  response_text TEXT, -- Vendor's response to the review
  response_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Directory access/subscribers table
CREATE TABLE IF NOT EXISTS directory_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  company VARCHAR(255),
  phone VARCHAR(50),
  access_level VARCHAR(50) DEFAULT 'basic', -- basic, premium, vendor
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  last_login TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  preferences JSONB, -- User preferences for notifications, categories of interest, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor inquiry/lead tracking table
CREATE TABLE IF NOT EXISTS vendor_inquiries (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  subscriber_id INTEGER REFERENCES directory_subscribers(id),
  inquiry_type VARCHAR(50), -- quote_request, info_request, demo_request
  message TEXT,
  budget_range VARCHAR(50),
  timeline VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, in_progress, closed_won, closed_lost
  response_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_featured ON vendors(featured);
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor ON vendor_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_status ON vendor_reviews(status);
CREATE INDEX IF NOT EXISTS idx_directory_subscribers_email ON directory_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_vendor ON vendor_inquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_subscriber ON vendor_inquiries(subscriber_id);

-- Insert default vendor categories
INSERT INTO vendor_categories (name, slug, description, icon, display_order) VALUES
  ('Event Technology', 'event-technology', 'AV, streaming, and event tech solutions', 'Monitor', 1),
  ('Event Production', 'event-production', 'Full-service event production companies', 'Calendar', 2),
  ('Venues & Spaces', 'venues-spaces', 'Event venues and meeting spaces', 'Building', 3),
  ('Catering & F&B', 'catering-fb', 'Catering and food & beverage services', 'UtensilsCrossed', 4),
  ('Marketing & PR', 'marketing-pr', 'Event marketing and PR agencies', 'Megaphone', 5),
  ('Staffing & Talent', 'staffing-talent', 'Event staffing and talent agencies', 'Users', 6),
  ('Design & Creative', 'design-creative', 'Event design and creative services', 'Palette', 7),
  ('Transportation', 'transportation', 'Transportation and logistics services', 'Car', 8),
  ('Photography & Video', 'photography-video', 'Photography and videography services', 'Camera', 9),
  ('Swag & Printing', 'swag-printing', 'Promotional products and printing', 'Gift', 10)
ON CONFLICT (slug) DO NOTHING;

-- Insert some sample vendors for testing
INSERT INTO vendors (
  company_name, slug, category_id, contact_name, contact_email, 
  website, description, services, pricing_range, location, 
  years_in_business, team_size, featured, verified, status
) VALUES
  (
    'TechEvent Solutions', 'techevent-solutions', 1,
    'John Smith', 'john@techeventsolutions.com',
    'https://techeventsolutions.com',
    'Leading provider of event technology and AV solutions',
    ARRAY['Live Streaming', 'AV Equipment Rental', 'Virtual Events', 'Hybrid Events'],
    '$$$', 'San Francisco, CA', 8, '11-50', true, true, 'approved'
  ),
  (
    'Premier Productions', 'premier-productions', 2,
    'Sarah Johnson', 'sarah@premierproductions.com',
    'https://premierproductions.com',
    'Full-service event production company specializing in corporate events',
    ARRAY['Event Planning', 'Stage Design', 'Production Management', 'Logistics'],
    '$$$$', 'New York, NY', 15, '51-200', true, true, 'approved'
  ),
  (
    'Creative Spaces Co', 'creative-spaces-co', 3,
    'Mike Chen', 'mike@creativespaces.co',
    'https://creativespaces.co',
    'Unique event venues for memorable experiences',
    ARRAY['Venue Rental', 'Event Spaces', 'Meeting Rooms', 'Outdoor Venues'],
    '$$', 'Los Angeles, CA', 5, '1-10', false, true, 'approved'
  )
ON CONFLICT (slug) DO NOTHING;
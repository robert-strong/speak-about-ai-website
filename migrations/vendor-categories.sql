-- Vendor Categories Table
CREATE TABLE IF NOT EXISTS vendor_categories (
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
CREATE INDEX idx_vendor_categories_slug ON vendor_categories(slug);
CREATE INDEX idx_vendor_categories_active ON vendor_categories(is_active);
CREATE INDEX idx_vendor_categories_order ON vendor_categories(display_order);

-- Add category_id to vendors table if not exists
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES vendor_categories(id);

-- Create index on vendors.category_id
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category_id);

-- Insert default categories
INSERT INTO vendor_categories (name, slug, description, icon, display_order) VALUES
  ('Event Planning', 'event-planning', 'Full-service event planning and coordination', '📅', 1),
  ('Catering', 'catering', 'Food and beverage services', '🍽️', 2),
  ('Photography & Video', 'photography-video', 'Professional photography and videography', '📸', 3),
  ('Audio/Visual', 'audio-visual', 'Sound, lighting, and AV equipment', '🎤', 4),
  ('Entertainment', 'entertainment', 'DJs, bands, and performers', '🎵', 5),
  ('Venues', 'venues', 'Event spaces and locations', '🏛️', 6),
  ('Decor & Design', 'decor-design', 'Event decoration and design services', '🎨', 7),
  ('Transportation', 'transportation', 'Guest transportation and logistics', '🚗', 8),
  ('Staffing', 'staffing', 'Event staff and personnel', '👥', 9),
  ('Technology', 'technology', 'Event tech and digital solutions', '💻', 10)
ON CONFLICT (slug) DO NOTHING;
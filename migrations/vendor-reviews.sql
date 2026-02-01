-- Vendor Reviews Table
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
  reviewer_name VARCHAR(255) NOT NULL,
  reviewer_email VARCHAR(255) NOT NULL,
  reviewer_company VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  event_type VARCHAR(100),
  event_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_vendor_reviews_vendor ON vendor_reviews(vendor_id);
CREATE INDEX idx_vendor_reviews_status ON vendor_reviews(status);
CREATE INDEX idx_vendor_reviews_rating ON vendor_reviews(rating);

-- Function to update vendor average rating
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $BODY$
BEGIN
  UPDATE vendors
  SET 
    average_rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM vendor_reviews
      WHERE vendor_id = NEW.vendor_id
      AND status = 'approved'
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM vendor_reviews
      WHERE vendor_id = NEW.vendor_id
      AND status = 'approved'
    )
  WHERE id = NEW.vendor_id;
  
  RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql;

-- Trigger to update vendor rating on review changes
CREATE TRIGGER trigger_update_vendor_rating
AFTER INSERT OR UPDATE OR DELETE ON vendor_reviews
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating();
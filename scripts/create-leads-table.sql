-- Leads table for SQL contacts from Kondo
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  title VARCHAR(255),
  linkedin_url TEXT,
  phone VARCHAR(50),
  source VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'medium',
  notes TEXT,
  last_contact_date TIMESTAMP,
  next_follow_up_date TIMESTAMP,
  kondo_contact_id INTEGER REFERENCES kondo_contacts(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_date);

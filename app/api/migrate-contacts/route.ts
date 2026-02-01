import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Create contacts table
    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL CHECK (type IN ('internal', 'external')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        mobile VARCHAR(50),
        company VARCHAR(255),
        job_title VARCHAR(255),
        department VARCHAR(100),
        linkedin_url VARCHAR(500),
        twitter_handle VARCHAR(100),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100),
        timezone VARCHAR(50),
        preferred_contact_method VARCHAR(50) CHECK (preferred_contact_method IN ('email', 'phone', 'mobile', 'linkedin')),
        tags TEXT[],
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags)`;
    
    // Create junction table
    await sql`
      CREATE TABLE IF NOT EXISTS deal_contacts (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
        contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        role VARCHAR(100) NOT NULL DEFAULT 'contact',
        is_primary BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(deal_id, contact_id)
      )
    `;
    
    // Create indexes for junction table
    await sql`CREATE INDEX IF NOT EXISTS idx_deal_contacts_deal_id ON deal_contacts(deal_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_deal_contacts_contact_id ON deal_contacts(contact_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_deal_contacts_role ON deal_contacts(role)`;
    
    // Create trigger
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    
    await sql`
      DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts
    `;
    
    await sql`
      CREATE TRIGGER update_contacts_updated_at 
      BEFORE UPDATE ON contacts 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column()
    `;
    
    // Add default internal contacts
    await sql`
      INSERT INTO contacts (type, first_name, last_name, email, job_title, company)
      VALUES 
        ('internal', 'Noah', 'Cheyer', 'noah@speakabout.ai', 'Founder', 'Speak About AI'),
        ('internal', 'Sales', 'Team', 'sales@speakabout.ai', 'Sales Department', 'Speak About AI')
      ON CONFLICT (email) DO NOTHING
    `;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Contacts tables created successfully' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
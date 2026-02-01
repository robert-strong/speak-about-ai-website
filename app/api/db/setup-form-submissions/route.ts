import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'DATABASE_URL environment variable is not configured' 
      }, { status: 500 })
    }
    const sql = neon(databaseUrl)

    // Create form_submissions table
    await sql`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id SERIAL PRIMARY KEY,
        submission_type VARCHAR(50) NOT NULL DEFAULT 'landing_page',
        source_url TEXT,
        
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        organization_name VARCHAR(255),
        
        specific_speaker TEXT,
        event_date DATE,
        event_location TEXT,
        event_budget VARCHAR(100),
        
        message TEXT,
        additional_info TEXT,
        
        form_data JSONB,
        
        newsletter_opt_in BOOLEAN DEFAULT true,
        
        ip_address INET,
        user_agent TEXT,
        referrer TEXT,
        
        status VARCHAR(50) DEFAULT 'new',
        admin_notes TEXT,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_form_submissions_submission_type ON form_submissions(submission_type)`

    // Create newsletter_signups table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_signups (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        company VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        source VARCHAR(100),
        subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create update trigger function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `

    // Create triggers
    await sql`
      DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions
    `
    await sql`
      CREATE TRIGGER update_form_submissions_updated_at 
      BEFORE UPDATE ON form_submissions 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `

    await sql`
      DROP TRIGGER IF EXISTS update_newsletter_signups_updated_at ON newsletter_signups
    `
    await sql`
      CREATE TRIGGER update_newsletter_signups_updated_at 
      BEFORE UPDATE ON newsletter_signups 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Database tables created successfully' 
    })
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
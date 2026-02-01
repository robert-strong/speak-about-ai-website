import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    
    // Ensure form_submissions table exists
    await sql`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id SERIAL PRIMARY KEY,
        submission_type VARCHAR(50) NOT NULL DEFAULT 'landing_page',
        source_url TEXT,
        name VARCHAR(255),
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
    
    // Ensure newsletter_signups table exists with all required columns
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_signups (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        company VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        source VARCHAR(100),
        ip_address INET,
        subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Add ip_address column if it doesn't exist
    await sql`
      ALTER TABLE newsletter_signups 
      ADD COLUMN IF NOT EXISTS ip_address INET
    `
    
    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(email)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_signups_email ON newsletter_signups(email)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_signups_status ON newsletter_signups(status)
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tables and indexes ensured successfully' 
    })
  } catch (error) {
    console.error('Error ensuring tables:', error)
    return NextResponse.json({ 
      error: 'Failed to ensure tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
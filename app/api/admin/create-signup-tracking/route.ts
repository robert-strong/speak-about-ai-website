import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    
    // Create landing_page_signups table for tracking ALL signups from landing pages
    await sql`
      CREATE TABLE IF NOT EXISTS landing_page_signups (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        company VARCHAR(255),
        landing_page_url TEXT,
        landing_page_title TEXT,
        page_slug VARCHAR(255),
        newsletter_opted_in BOOLEAN DEFAULT true,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Create index for analytics
        CONSTRAINT landing_page_signups_email_page_unique UNIQUE (email, landing_page_url, created_at)
      )
    `
    
    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_landing_signups_email ON landing_page_signups(email)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_landing_signups_created ON landing_page_signups(created_at DESC)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_landing_signups_page ON landing_page_signups(landing_page_url)
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Landing page signup tracking table created successfully' 
    })
  } catch (error) {
    console.error('Error creating tracking table:', error)
    return NextResponse.json({ 
      error: 'Failed to create tracking table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
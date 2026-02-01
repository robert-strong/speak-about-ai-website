import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Add social media columns to speakers table
    await sql`
      ALTER TABLE speakers 
      ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
      ADD COLUMN IF NOT EXISTS twitter_url TEXT,
      ADD COLUMN IF NOT EXISTS youtube_url TEXT,
      ADD COLUMN IF NOT EXISTS instagram_url TEXT,
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS company VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS publications JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS signature_talks JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS available_formats JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS booking_requirements TEXT
    `
    
    // Verify columns were added
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'speakers' 
      AND column_name IN ('linkedin_url', 'twitter_url', 'youtube_url', 'instagram_url', 'title', 'company', 'videos')
      ORDER BY column_name
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Social media and profile columns added successfully',
      columns_added: result.map(r => r.column_name)
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add columns', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
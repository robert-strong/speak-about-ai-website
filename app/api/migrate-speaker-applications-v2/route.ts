import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Adding missing columns to speaker_applications table...")

    // Add all missing columns
    await sql`
      ALTER TABLE speaker_applications
      ADD COLUMN IF NOT EXISTS speaking_experience VARCHAR(50),
      ADD COLUMN IF NOT EXISTS notable_organizations TEXT,
      ADD COLUMN IF NOT EXISTS ai_expertise TEXT,
      ADD COLUMN IF NOT EXISTS unique_perspective TEXT,
      ADD COLUMN IF NOT EXISTS audience_size_preference VARCHAR(100),
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS headshot_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS short_bio TEXT,
      ADD COLUMN IF NOT EXISTS achievements TEXT,
      ADD COLUMN IF NOT EXISTS education TEXT,
      ADD COLUMN IF NOT EXISTS certifications TEXT,
      ADD COLUMN IF NOT EXISTS signature_talks TEXT,
      ADD COLUMN IF NOT EXISTS industries_experience TEXT[],
      ADD COLUMN IF NOT EXISTS case_studies TEXT,
      ADD COLUMN IF NOT EXISTS total_engagements VARCHAR(50),
      ADD COLUMN IF NOT EXISTS client_testimonials TEXT,
      ADD COLUMN IF NOT EXISTS media_coverage TEXT,
      ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS blog_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS published_content TEXT,
      ADD COLUMN IF NOT EXISTS podcast_appearances TEXT,
      ADD COLUMN IF NOT EXISTS booking_lead_time VARCHAR(100),
      ADD COLUMN IF NOT EXISTS availability_constraints TEXT,
      ADD COLUMN IF NOT EXISTS technical_requirements TEXT,
      ADD COLUMN IF NOT EXISTS past_client_references TEXT,
      ADD COLUMN IF NOT EXISTS speaker_bureau_experience TEXT,
      ADD COLUMN IF NOT EXISTS why_speak_about_ai TEXT,
      ADD COLUMN IF NOT EXISTS additional_info TEXT,
      ADD COLUMN IF NOT EXISTS agree_to_terms BOOLEAN DEFAULT false
    `

    console.log("Migration completed successfully!")

    return NextResponse.json({
      message: "Speaker applications table updated successfully with all missing fields",
      columns_added: 31
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

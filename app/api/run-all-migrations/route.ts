import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Running all pending migrations...")

    const results = []

    // Migration 1: Add speaker application fields
    try {
      console.log("Running migration 006: Add speaker application fields...")
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
      results.push({ migration: "006_speaker_fields", status: "success" })
    } catch (error) {
      results.push({ migration: "006_speaker_fields", status: "error", error: error instanceof Error ? error.message : "Unknown error" })
    }

    // Migration 2: Add vendor missing fields
    try {
      console.log("Running migration 007: Add vendor missing fields...")
      await sql`
        ALTER TABLE vendor_applications
        ADD COLUMN IF NOT EXISTS pricing_range VARCHAR(100),
        ADD COLUMN IF NOT EXISTS team_size VARCHAR(50),
        ADD COLUMN IF NOT EXISTS why_join TEXT,
        ADD COLUMN IF NOT EXISTS certifications TEXT,
        ADD COLUMN IF NOT EXISTS testimonials TEXT
      `
      results.push({ migration: "007_vendor_fields", status: "success" })
    } catch (error) {
      results.push({ migration: "007_vendor_fields", status: "error", error: error instanceof Error ? error.message : "Unknown error" })
    }

    // Migration 3: Create WhatsApp applications table
    try {
      console.log("Running migration 008: Create WhatsApp applications table...")
      await sql`
        CREATE TABLE IF NOT EXISTS whatsapp_applications (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          linkedin_url VARCHAR(500) NOT NULL,
          phone_number VARCHAR(50) NOT NULL,
          primary_role VARCHAR(100) NOT NULL,
          other_role VARCHAR(255),
          value_expectations TEXT[],
          agree_to_rules BOOLEAN NOT NULL DEFAULT false,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'invited')),
          admin_notes TEXT,
          rejection_reason TEXT,
          whatsapp_invite_sent_at TIMESTAMP WITH TIME ZONE,
          whatsapp_joined_at TIMESTAMP WITH TIME ZONE,
          whatsapp_invite_link VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP WITH TIME ZONE,
          reviewed_by VARCHAR(255),
          submission_ip INET,
          user_agent TEXT
        )
      `

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_applications_status ON whatsapp_applications(status)`
      await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_applications_email ON whatsapp_applications(email)`
      await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_applications_created ON whatsapp_applications(created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_applications_primary_role ON whatsapp_applications(primary_role)`

      // Create trigger function
      await sql`
        CREATE OR REPLACE FUNCTION update_whatsapp_applications_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `

      await sql`DROP TRIGGER IF EXISTS update_whatsapp_applications_updated_at ON whatsapp_applications`

      await sql`
        CREATE TRIGGER update_whatsapp_applications_updated_at
          BEFORE UPDATE ON whatsapp_applications
          FOR EACH ROW
          EXECUTE FUNCTION update_whatsapp_applications_updated_at()
      `

      results.push({ migration: "008_whatsapp_table", status: "success" })
    } catch (error) {
      results.push({ migration: "008_whatsapp_table", status: "error", error: error instanceof Error ? error.message : "Unknown error" })
    }

    console.log("All migrations completed!")

    return NextResponse.json({
      message: "Migrations completed",
      results
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

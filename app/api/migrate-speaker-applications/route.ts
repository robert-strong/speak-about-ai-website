import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Creating speaker applications table...")

    // Create speaker_applications table
    await sql`
      CREATE TABLE IF NOT EXISTS speaker_applications (
        id SERIAL PRIMARY KEY,
        
        -- Personal Information
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        website VARCHAR(500),
        linkedin_url VARCHAR(500),
        location VARCHAR(255),
        
        -- Professional Information
        title VARCHAR(255),
        company VARCHAR(255),
        bio TEXT NOT NULL,
        expertise_areas TEXT[], -- Array of expertise areas
        speaking_topics TEXT NOT NULL,
        
        -- Experience
        years_speaking INTEGER,
        previous_engagements TEXT, -- Description of previous speaking engagements
        video_links TEXT[], -- Array of video URLs
        reference_contacts TEXT, -- Reference contacts
        
        -- Logistics
        speaking_fee_range VARCHAR(100), -- e.g., "$5,000 - $10,000"
        travel_requirements TEXT,
        available_formats TEXT[], -- e.g., ["keynote", "workshop", "panel", "virtual"]
        
        -- Application Status
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'invited')),
        admin_notes TEXT,
        rejection_reason TEXT,
        
        -- Invitation Details
        invitation_token VARCHAR(255) UNIQUE,
        invitation_sent_at TIMESTAMP WITH TIME ZONE,
        invitation_expires_at TIMESTAMP WITH TIME ZONE,
        account_created_at TIMESTAMP WITH TIME ZONE,
        
        -- Metadata
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by VARCHAR(255)
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_speaker_applications_email ON speaker_applications(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_speaker_applications_status ON speaker_applications(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_speaker_applications_created_at ON speaker_applications(created_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_speaker_applications_invitation_token ON speaker_applications(invitation_token)`

    // Create trigger to update updated_at
    await sql`
      CREATE OR REPLACE FUNCTION update_speaker_applications_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `

    await sql`
      DROP TRIGGER IF EXISTS update_speaker_applications_updated_at ON speaker_applications
    `

    await sql`
      CREATE TRIGGER update_speaker_applications_updated_at
        BEFORE UPDATE ON speaker_applications
        FOR EACH ROW
        EXECUTE FUNCTION update_speaker_applications_updated_at()
    `

    console.log("Speaker applications table created successfully!")

    return NextResponse.json({ 
      message: "Speaker applications table created successfully",
      tables_created: ["speaker_applications"]
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
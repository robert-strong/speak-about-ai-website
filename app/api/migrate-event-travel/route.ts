import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Add event type and travel fields to deals table
    await sql`
      ALTER TABLE deals 
      ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'in-person',
      ADD COLUMN IF NOT EXISTS travel_required BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS travel_stipend DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS flight_required BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS hotel_required BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS travel_notes TEXT
    `

    // Add event type and travel fields to projects table
    await sql`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'in-person',
      ADD COLUMN IF NOT EXISTS travel_required BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS travel_stipend DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS flight_required BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS hotel_required BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS travel_notes TEXT
    `

    // Update existing deals to set event_type based on any existing data patterns
    await sql`
      UPDATE deals 
      SET event_type = CASE 
        WHEN LOWER(event_title) LIKE '%virtual%' OR LOWER(event_title) LIKE '%online%' OR LOWER(event_title) LIKE '%webinar%' 
        THEN 'virtual'
        ELSE 'in-person'
      END
      WHERE event_type IS NULL
    `

    // Update existing projects similarly
    await sql`
      UPDATE projects 
      SET event_type = CASE 
        WHEN LOWER(project_name) LIKE '%virtual%' OR LOWER(project_name) LIKE '%online%' OR LOWER(project_name) LIKE '%webinar%' 
        THEN 'virtual'
        ELSE 'in-person'
      END
      WHERE event_type IS NULL
    `

    return NextResponse.json({ 
      success: true, 
      message: "Event type and travel fields added successfully to deals and projects tables" 
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { 
        error: "Failed to add event type and travel fields", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
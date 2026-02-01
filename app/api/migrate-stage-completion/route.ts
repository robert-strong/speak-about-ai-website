import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Running stage completion schema migration...")

    // Add stage_completion column to projects table if it doesn't exist
    await sql`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS stage_completion JSONB DEFAULT '{}'::jsonb
    `

    // Create index for better performance on stage completion queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_projects_stage_completion 
      ON projects USING GIN (stage_completion)
    `

    // Update existing projects to have empty stage completion if null
    await sql`
      UPDATE projects 
      SET stage_completion = '{}'::jsonb 
      WHERE stage_completion IS NULL
    `

    console.log("Stage completion migration completed successfully!")

    return NextResponse.json({ 
      message: "Stage completion migration completed successfully",
      changes: [
        "Added stage_completion JSONB column to projects table",
        "Created GIN index on stage_completion for performance",
        "Initialized empty stage_completion for existing projects"
      ]
    })
  } catch (error) {
    console.error("Stage completion migration error:", error)
    return NextResponse.json(
      { 
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
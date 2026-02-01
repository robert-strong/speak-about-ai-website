import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Migrating project stages to new workflow...")

    // Get all projects with old status values
    const projects = await sql`
      SELECT id, status, event_date, stage_completion
      FROM projects
      WHERE status IN ('2plus_months', '1to2_months', 'less_than_month', 'final_week', 'planning', 'contracts_signed')
    `

    let migratedCount = 0
    
    for (const project of projects) {
      let newStatus = 'invoicing' // Default to invoicing
      
      // Map old statuses to new workflow
      if (project.status === 'completed' || project.status === 'cancelled') {
        continue // Keep these as-is
      } else if (project.status === 'final_week') {
        newStatus = 'event_week'
      } else if (project.status === 'less_than_month') {
        // Check days until event
        const now = new Date()
        const eventDate = new Date(project.event_date)
        const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntil <= 7) {
          newStatus = 'event_week'
        } else if (daysUntil <= 14) {
          newStatus = 'pre_event'
        } else {
          newStatus = 'logistics_planning'
        }
      } else if (project.status === '1to2_months') {
        newStatus = 'logistics_planning'
      } else if (project.status === '2plus_months' || project.status === 'planning') {
        newStatus = 'invoicing'
      } else if (project.status === 'contracts_signed') {
        newStatus = 'invoicing'
      }
      
      // Update the project status
      await sql`
        UPDATE projects 
        SET 
          status = ${newStatus},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${project.id}
      `
      
      migratedCount++
    }

    // Also ensure stage_completion column exists with proper JSONB type
    await sql`
      ALTER TABLE projects 
      ALTER COLUMN stage_completion 
      SET DATA TYPE JSONB 
      USING COALESCE(stage_completion::jsonb, '{}'::jsonb)
    `

    console.log(`Migration completed. Migrated ${migratedCount} projects`)

    return NextResponse.json({ 
      message: "Project stages migration completed successfully",
      migrated_count: migratedCount,
      total_projects_checked: projects.length
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

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    // Get count of projects needing migration
    const result = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('2plus_months', '1to2_months', 'less_than_month', 'final_week', 'planning', 'contracts_signed') THEN 1 END) as needs_migration
      FROM projects
    `

    return NextResponse.json({
      total_projects: result[0].total,
      needs_migration: result[0].needs_migration,
      migration_required: result[0].needs_migration > 0
    })
  } catch (error) {
    console.error("Check migration error:", error)
    return NextResponse.json(
      { 
        error: "Failed to check migration status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
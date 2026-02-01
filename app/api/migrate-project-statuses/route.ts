import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Running project status migration...")

    // Get all projects with legacy statuses
    const projects = await sql`
      SELECT id, status, stage_completion, event_date, invoice_sent, payment_received
      FROM projects
      WHERE status IN ('2plus_months', '1to2_months', 'less_than_month', 'final_week', 'planning', 'contracts_signed')
    `

    console.log(`Found ${projects.length} projects with legacy statuses`)

    // Update each project
    for (const project of projects) {
      let newStatus = 'invoicing' // Default to invoicing stage
      
      // Determine appropriate status based on existing data
      if (project.status === 'completed') {
        newStatus = 'completed'
      } else if (project.status === 'cancelled') {
        newStatus = 'cancelled'
      } else {
        // For active projects, check stage completion to determine current stage
        const stageCompletion = project.stage_completion || {}
        
        // If invoicing tasks are complete, move to next stage
        if (stageCompletion.invoicing?.initial_invoice_sent && 
            stageCompletion.invoicing?.final_invoice_sent && 
            stageCompletion.invoicing?.kickoff_meeting_planned && 
            stageCompletion.invoicing?.project_setup_complete) {
          newStatus = 'logistics_planning'
          
          // Check if logistics planning is complete
          if (stageCompletion.logistics_planning?.details_confirmed &&
              stageCompletion.logistics_planning?.av_requirements_gathered &&
              stageCompletion.logistics_planning?.calendar_confirmed) {
            newStatus = 'pre_event'
            
            // Check event date to determine if it's event week
            if (project.event_date) {
              const daysUntilEvent = Math.ceil((new Date(project.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              if (daysUntilEvent <= 7 && daysUntilEvent >= 0) {
                newStatus = 'event_week'
              } else if (daysUntilEvent < 0) {
                newStatus = 'follow_up'
              }
            }
          }
        }
      }

      // Initialize stage_completion if empty
      let updatedStageCompletion = project.stage_completion || {}
      if (Object.keys(updatedStageCompletion).length === 0) {
        updatedStageCompletion = {
          invoicing: {
            initial_invoice_sent: project.invoice_sent || false,
            final_invoice_sent: false,
            kickoff_meeting_planned: false,
            project_setup_complete: false
          }
        }
      }

      // Update the project
      await sql`
        UPDATE projects 
        SET 
          status = ${newStatus},
          stage_completion = ${JSON.stringify(updatedStageCompletion)},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${project.id}
      `
      
      console.log(`Updated project ${project.id} from ${project.status} to ${newStatus}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${projects.length} projects to new status system`,
      migratedCount: projects.length
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
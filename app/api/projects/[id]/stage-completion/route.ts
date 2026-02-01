import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const projectId = parseInt(id)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const { stage, task, completed } = await request.json()

    if (!stage || !task || typeof completed !== "boolean") {
      return NextResponse.json({ 
        error: "Missing required fields: stage, task, completed" 
      }, { status: 400 })
    }

    // Get current project data
    const [project] = await sql`
      SELECT stage_completion 
      FROM projects 
      WHERE id = ${projectId}
    `

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Parse existing stage completion data
    let stageCompletion = project.stage_completion || {}
    
    // Ensure the stage object exists
    if (!stageCompletion[stage]) {
      stageCompletion[stage] = {}
    }
    
    // Update the specific task
    stageCompletion[stage][task] = completed

    // Update the database
    await sql`
      UPDATE projects 
      SET 
        stage_completion = ${JSON.stringify(stageCompletion)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
    `

    // Check if we should auto-advance the project status
    const shouldAdvanceStage = await checkStageCompletion(projectId, stage, stageCompletion[stage])
    
    if (shouldAdvanceStage) {
      const nextStage = getNextStage(stage)
      if (nextStage) {
        await sql`
          UPDATE projects 
          SET 
            status = ${nextStage},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${projectId}
        `
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Task ${completed ? "completed" : "unmarked"}`,
      stage_completion: stageCompletion,
      advanced_to: shouldAdvanceStage ? getNextStage(stage) : null
    })

  } catch (error) {
    console.error("Error updating stage completion:", error)
    return NextResponse.json(
      { error: "Failed to update stage completion" },
      { status: 500 }
    )
  }
}

// Helper function to check if all required tasks in a stage are complete
async function checkStageCompletion(projectId: number, stage: string, stageData: any): Promise<boolean> {
  const requiredTasks = {
    invoicing: ["initial_invoice_sent", "final_invoice_sent", "kickoff_meeting_planned", "project_setup_complete"],
    logistics_planning: ["details_confirmed", "av_requirements_gathered", "press_pack_sent", "calendar_confirmed", "client_contact_obtained", "speaker_materials_ready"],
    pre_event: ["logistics_confirmed", "speaker_prepared", "client_materials_sent", "ready_for_execution"],
    event_week: ["final_preparations_complete", "event_executed", "support_provided"],
    follow_up: ["follow_up_sent", "client_feedback_requested", "speaker_feedback_requested", "lessons_documented"]
  }

  const required = requiredTasks[stage as keyof typeof requiredTasks]
  if (!required) return false

  // Check if all required tasks are completed
  return required.every(taskKey => stageData[taskKey] === true)
}

// Helper function to get the next stage in the workflow
function getNextStage(currentStage: string): string | null {
  const stageOrder = ["invoicing", "logistics_planning", "pre_event", "event_week", "follow_up", "completed"]
  const currentIndex = stageOrder.indexOf(currentStage)
  
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return null
  }
  
  return stageOrder[currentIndex + 1]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const projectId = parseInt(id)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const [project] = await sql`
      SELECT 
        id,
        project_name,
        client_name,
        status,
        stage_completion
      FROM projects 
      WHERE id = ${projectId}
    `

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      project: {
        ...project,
        stage_completion: project.stage_completion || {}
      }
    })

  } catch (error) {
    console.error("Error fetching project stage completion:", error)
    return NextResponse.json(
      { error: "Failed to fetch project data" },
      { status: 500 }
    )
  }
}
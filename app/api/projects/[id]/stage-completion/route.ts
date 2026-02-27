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

    // Check if all tasks in this stage are now complete
    // NOTE: Auto-advance is handled client-side via PUT /api/projects/[id]
    // which triggers proposal auto-creation, deal sync, and Slack notifications.
    // We only report whether advancement is needed here.
    const allComplete = await checkStageCompletion(projectId, stage, stageCompletion[stage])

    return NextResponse.json({
      success: true,
      message: `Task ${completed ? "completed" : "unmarked"}`,
      stage_completion: stageCompletion,
      all_tasks_complete: allComplete
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
    qualified: ["prioritized_reach_outs", "correspondence_follow_ups"],
    proposal: ["proposal_discussed", "proposal_created", "proposal_finished", "proposal_sent", "proposal_agreed"],
    contracts_signed: ["prepare_client_contract", "send_contract_to_client", "client_contract_signed", "prepare_speaker_agreement", "obtain_speaker_signature", "file_signed_contracts"],
    logistics_planning: ["details_confirmed", "av_requirements_gathered", "press_pack_sent", "calendar_confirmed", "client_contact_obtained", "speaker_materials_ready"],
    pre_event: ["logistics_confirmed", "speaker_prepared", "client_materials_sent", "ready_for_execution"],
    event_week: ["final_preparations_complete", "event_executed", "support_provided"],
    follow_up: ["follow_up_sent", "client_feedback_requested", "speaker_feedback_requested", "lessons_documented"]
    // invoicing_track deliberately omitted — never blocks progression
  }

  const required = requiredTasks[stage as keyof typeof requiredTasks]
  if (!required) return false

  // Check if all required tasks are completed
  return required.every(taskKey => stageData[taskKey] === true)
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
import { type NextRequest, NextResponse } from "next/server"
import { deleteProject, updateProject, getProjectById } from "@/lib/projects-db"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { sendSlackWebhook, buildProjectStatusUpdateMessage, buildProjectCompletedMessage } from "@/lib/slack"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id: idString } = await params
    console.log('GET /api/projects/[id] - Raw ID string:', idString, 'Type:', typeof idString)

    const id = parseInt(idString)
    console.log('GET /api/projects/[id] - Parsed ID:', id, 'isNaN:', isNaN(id))

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid project ID", receivedId: idString }, { status: 400 })
    }

    const project = await getProjectById(id)
    console.log('GET /api/projects/[id] - Project found:', project ? `Yes (ID: ${project.id})` : 'No')

    if (!project) {
      return NextResponse.json({ error: "Project not found", requestedId: id }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Failed to fetch project", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id: idString } = await params
    const id = parseInt(idString)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    // Get original project to check if status is changing
    const originalProject = await getProjectById(id)

    const body = await request.json()
    const project = await updateProject(id, body)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Send Slack notification for status changes
    if (originalProject && originalProject.status !== project.status) {
      try {
        if (project.status === 'completed') {
          await sendSlackWebhook(buildProjectCompletedMessage({
            id: project.id,
            project_name: project.project_name,
            client_name: project.client_name,
            company: project.company,
            speaker_fee: project.speaker_fee,
            speaker_name: project.requested_speaker_name,
            event_date: project.event_date
          }))
        } else {
          await sendSlackWebhook(buildProjectStatusUpdateMessage({
            id: project.id,
            project_name: project.project_name,
            client_name: project.client_name,
            old_status: originalProject.status,
            new_status: project.status,
            speaker_fee: project.speaker_fee,
            event_date: project.event_date
          }))
        }
      } catch (slackError) {
        console.error('Slack notification failed:', slackError)
      }
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Failed to update project", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const resolvedParams = await params
    const idString = resolvedParams.id

    const id = parseInt(idString)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const success = await deleteProject(id)

    if (!success) {
      return NextResponse.json({ error: "Project not found or could not be deleted" }, { status: 404 })
    }

    return NextResponse.json({ message: "Project deleted successfully", id })
  } catch (error) {
    console.error("Error in DELETE /api/projects/[id]:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      params: await params
    })
    return NextResponse.json(
      { 
        error: "Failed to delete project", 
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    )
  }
}

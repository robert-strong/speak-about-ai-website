import { type NextRequest, NextResponse } from "next/server"
import { 
  validateClientPortalAccess, 
  filterProjectForClient, 
  validateClientUpdate,
  logClientPortalAction 
} from "@/lib/client-portal-auth"
import { updateProject } from "@/lib/projects-db"

// Get project details for client portal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = parseInt(id)
    
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    // Get token from cookie or header
    const token = request.cookies.get(`project_${projectId}_token`)?.value ||
                  request.headers.get('X-Project-Token')

    if (!token) {
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 })
    }

    // Validate access
    const { valid, project } = await validateClientPortalAccess(token, projectId)
    
    if (!valid || !project) {
      return NextResponse.json({ 
        error: "Access denied" 
      }, { status: 403 })
    }

    // Get client IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log the access
    await logClientPortalAction(
      projectId,
      project.client_email || 'unknown',
      'view',
      null, null, null,
      ipAddress,
      userAgent
    )

    // Filter project data for client view
    const filteredProject = filterProjectForClient(project, true)

    return NextResponse.json(filteredProject)

  } catch (error) {
    console.error("Error fetching project for client:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Update project details from client portal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = parseInt(id)
    
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    // Get token from cookie or header
    const token = request.cookies.get(`project_${projectId}_token`)?.value ||
                  request.headers.get('X-Project-Token')

    if (!token) {
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 })
    }

    // Validate access
    const { valid, project } = await validateClientPortalAccess(token, projectId)
    
    if (!valid || !project) {
      return NextResponse.json({ 
        error: "Access denied" 
      }, { status: 403 })
    }

    const body = await request.json()
    
    // Get editable fields for this project
    const editableFields = project.client_editable_fields || [
      'venue_name', 'venue_address', 'venue_contact_name', 'venue_contact_email', 
      'venue_contact_phone', 'event_start_time', 'event_end_time', 'program_start_time', 
      'program_length', 'qa_length', 'audience_demographics', 'av_requirements', 
      'recording_purpose', 'tech_rehearsal_date', 'tech_rehearsal_time',
      'airport_transport_details', 'venue_transport_details', 'hotel_dates_needed', 
      'guest_list_details', 'meet_greet_opportunities', 'media_interview_requests', 
      'special_requests', 'prep_call_requested', 'prep_call_date', 'prep_call_time', 
      'additional_notes', 'billing_contact_name', 'billing_contact_email',
      'billing_contact_phone', 'billing_address', 'logistics_contact_name', 
      'logistics_contact_email', 'logistics_contact_phone'
    ]
    
    // Validate and filter updates to only allowed fields
    const validatedUpdates = validateClientUpdate(body, editableFields)
    
    if (Object.keys(validatedUpdates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update" 
      }, { status: 400 })
    }

    // Get client IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log each field change
    for (const [field, newValue] of Object.entries(validatedUpdates)) {
      const oldValue = project[field]
      if (oldValue !== newValue) {
        await logClientPortalAction(
          projectId,
          project.client_email || 'unknown',
          'edit',
          field,
          String(oldValue || ''),
          String(newValue || ''),
          ipAddress,
          userAgent
        )
      }
    }

    // Update the project
    const updatedProject = await updateProject(projectId, validatedUpdates)
    
    if (!updatedProject) {
      return NextResponse.json({ 
        error: "Failed to update project" 
      }, { status: 500 })
    }

    // Return filtered project data
    const filteredProject = filterProjectForClient(updatedProject, true)

    return NextResponse.json({
      success: true,
      project: filteredProject,
      updatedFields: Object.keys(validatedUpdates)
    })

  } catch (error) {
    console.error("Error updating project from client portal:", error)
    return NextResponse.json(
      {
        error: "Failed to update project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
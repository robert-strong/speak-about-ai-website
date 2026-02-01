import { NextRequest, NextResponse } from "next/server"
import { getAllProjects } from "@/lib/projects-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Verify authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Invalid authorization" },
        { status: 401 }
      )
    }

    // Get fresh project data
    const projects = await getAllProjects()
    const clientProjects = projects.filter(project => 
      project.client_email?.toLowerCase() === email.toLowerCase() ||
      project.contact_person?.toLowerCase().includes(email.toLowerCase())
    )

    if (clientProjects.length === 0) {
      return NextResponse.json(
        { error: "No projects found for this email address" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      projects: clientProjects.map(p => ({
        id: p.id,
        project_name: p.project_name,
        client_name: p.client_name,
        client_email: p.client_email,
        client_phone: p.client_phone,
        company: p.company,
        project_type: p.project_type,
        description: p.description,
        status: p.status,
        priority: p.priority,
        start_date: p.start_date,
        deadline: p.deadline,
        event_date: p.event_date,
        event_location: p.event_location,
        event_type: p.event_type,
        attendee_count: p.attendee_count,
        speaker_fee: p.speaker_fee,
        travel_required: p.travel_required,
        accommodation_required: p.accommodation_required,
        av_requirements: p.av_requirements,
        catering_requirements: p.catering_requirements,
        special_requirements: p.special_requirements,
        contact_person: p.contact_person,
        venue_contact: p.venue_contact,
        contract_signed: p.contract_signed,
        invoice_sent: p.invoice_sent,
        payment_received: p.payment_received,
        presentation_ready: p.presentation_ready,
        materials_sent: p.materials_sent,
        notes: p.notes,
        created_at: p.created_at,
        updated_at: p.updated_at
      }))
    })

  } catch (error) {
    console.error("Client refresh error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
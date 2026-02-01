import { type NextRequest, NextResponse } from "next/server"
import { getAllDeals, createDeal, searchDeals, getDealsByStatus } from "@/lib/deals-db"
import { createProject } from "@/lib/projects-db"
import { getAutomaticProjectStatus } from "@/lib/project-status-utils"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { sendSlackWebhook, buildNewDealMessage, buildDealWonMessage } from "@/lib/slack"

export async function GET(request: NextRequest) {
  try {
    // Skip auth for now to match the simple localStorage pattern used elsewhere
    // TODO: Implement proper JWT auth across all admin APIs
    // const authError = requireAdminAuth(request)
    // if (authError) return authError
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    let deals
    if (search) {
      deals = await searchDeals(search)
    } else if (status) {
      deals = await getDealsByStatus(status)
    } else {
      deals = await getAllDeals()
    }

    return NextResponse.json(deals)
  } catch (error) {
    console.error("Error in GET /api/deals:", error)

    let errorMessage = "Failed to fetch deals"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("does not exist")) {
        errorMessage = "Database table not found. Please run the setup script."
        statusCode = 503
      } else if (error.message.includes("DATABASE_URL")) {
        errorMessage = "Database configuration error"
        statusCode = 503
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        tableExists: false,
      },
      { status: statusCode },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip auth for now to match the simple localStorage pattern used elsewhere
    // TODO: Implement proper JWT auth across all admin APIs
    // const authError = requireAdminAuth(request)
    // if (authError) return authError
    
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      "client_name",
      "client_email",
      "company",
      "event_title",
      "event_date",
      "event_location",
      "event_type",
      "attendee_count",
      "budget_range",
      "deal_value",
      "status",
      "priority",
      "source",
      "notes",
      "last_contact",
    ]

    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const deal = await createDeal(body)

    if (!deal) {
      return NextResponse.json({ error: "Failed to create deal" }, { status: 500 })
    }

    // Send Slack notification for new deal
    try {
      await sendSlackWebhook(buildNewDealMessage({
        id: deal.id,
        event_title: deal.event_title,
        client_name: deal.client_name,
        company: deal.company,
        deal_value: deal.deal_value,
        event_date: deal.event_date,
        speaker_name: deal.speaker_requested,
        status: deal.status
      }))
    } catch (slackError) {
      console.error('Slack notification failed:', slackError)
      // Don't fail the request if Slack fails
    }

    // If deal is created with status "won", automatically create a project
    if (deal.status === "won") {
      try {
        const projectData = {
          // Basic project fields
          project_name: deal.event_title,
          client_name: deal.client_name,
          client_email: deal.client_email,
          client_phone: deal.client_phone,
          company: deal.company,
          project_type: deal.event_type === "Workshop" ? "Workshop" : 
                       deal.event_type === "Keynote" ? "Speaking" :
                       deal.event_type === "Consulting" ? "Consulting" : "Other",
          description: `Event: ${deal.event_title}\nLocation: ${deal.event_location}\nAttendees: ${deal.attendee_count}\n\n${deal.notes}`,
          // Set status to invoicing for new projects (deals just won need invoicing first)
          status: "invoicing" as const,
          priority: deal.priority,
          start_date: new Date().toISOString().split('T')[0],
          deadline: deal.event_date,
          budget: deal.deal_value,
          spent: 0,
          completion_percentage: 0,
          
          // Event Overview - Billing Contact (from deal client info)
          billing_contact_name: deal.client_name,
          billing_contact_email: deal.client_email,
          billing_contact_phone: deal.client_phone,
          
          // Event Overview - Logistics Contact (same as billing for now)
          logistics_contact_name: deal.client_name,
          logistics_contact_email: deal.client_email,
          logistics_contact_phone: deal.client_phone,
          
          // Event Overview - Additional Fields
          end_client_name: deal.company,
          event_name: deal.event_title,
          event_date: deal.event_date,
          event_location: deal.event_location,
          event_type: deal.event_type,
          
          // Speaker Program Details
          requested_speaker_name: deal.speaker_requested,
          program_topic: `${deal.event_title} - ${deal.event_type}`,
          program_type: deal.event_type,
          audience_size: deal.attendee_count,
          audience_demographics: "To be determined during planning",
          
          // Financial Details
          speaker_fee: deal.deal_value,
          
          // Basic event fields (existing)
          attendee_count: deal.attendee_count,
          contact_person: deal.client_name,
          notes: `Deal ID: ${deal.id}\nSource: ${deal.source}\nBudget Range: ${deal.budget_range}\nOriginal notes: ${deal.notes}`,
          tags: [deal.event_type, deal.source],
          
          // Status tracking (initialized for new project)
          contract_signed: false,
          invoice_sent: false,
          payment_received: false,
          presentation_ready: false,
          materials_sent: false,
          
          // Event classification based on type
          event_classification: deal.event_type?.toLowerCase().includes('virtual') || deal.event_type?.toLowerCase().includes('webinar') ? 'virtual' :
                              deal.event_location?.toLowerCase().includes('remote') ? 'virtual' : 'local'
        }
        
        const project = await createProject(projectData)
        if (project) {
          console.log(`Successfully created project "${project.project_name}" from won deal #${deal.id}`)
          // Return the deal with additional info about the project creation
          return NextResponse.json({
            ...deal,
            projectCreated: true,
            projectId: project.id,
            message: `Deal created successfully and project "${project.project_name}" was automatically created`
          }, { status: 201 })
        }
      } catch (error) {
        console.error("Error creating project from won deal:", error)
        // Don't fail the deal creation if project creation fails
        // The user can still manually create the project later
      }
    }

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/deals:", error)
    return NextResponse.json(
      {
        error: "Failed to create deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

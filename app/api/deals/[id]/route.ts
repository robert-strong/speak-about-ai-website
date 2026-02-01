import { type NextRequest, NextResponse } from "next/server"
import { updateDeal, deleteDeal, getAllDeals } from "@/lib/deals-db"
import { createProject } from "@/lib/projects-db"
import { getAutomaticProjectStatus } from "@/lib/project-status-utils"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { sendSlackWebhook, buildDealStatusUpdateMessage, buildDealWonMessage } from "@/lib/slack"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params
    const id = Number.parseInt(idString)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 })
    }

    const deals = await getAllDeals()
    const deal = deals.find(d => d.id === id)

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error("Error fetching deal:", error)
    return NextResponse.json({ error: "Failed to fetch deal" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Skip auth for now to match the simple localStorage pattern used in GET/POST
    // TODO: Implement proper JWT auth across all admin APIs
    // const devBypass = request.headers.get('x-dev-admin-bypass')
    // if (devBypass !== 'dev-admin-access') {
    //   const authError = requireAdminAuth(request)
    //   if (authError) return authError
    // }

    const { id: idString } = await params
    const id = Number.parseInt(idString)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 })
    }

    const body = await request.json()
    
    // Get the original deal to check if status is changing
    const { getAllDeals } = await import("@/lib/deals-db")
    const deals = await getAllDeals()
    const originalDeal = deals.find(d => d.id === id)

    const deal = await updateDeal(id, body)

    if (!deal) {
      return NextResponse.json({ error: "Deal not found or failed to update" }, { status: 404 })
    }

    // Send Slack notification for status changes
    if (originalDeal && originalDeal.status !== deal.status) {
      try {
        if (deal.status === 'won') {
          await sendSlackWebhook(buildDealWonMessage({
            id: deal.id,
            event_title: deal.event_title,
            client_name: deal.client_name,
            company: deal.company,
            deal_value: deal.deal_value,
            speaker_name: deal.speaker_requested,
            event_date: deal.event_date
          }))
        } else {
          await sendSlackWebhook(buildDealStatusUpdateMessage({
            id: deal.id,
            event_title: deal.event_title,
            client_name: deal.client_name,
            old_status: originalDeal.status,
            new_status: deal.status,
            deal_value: deal.deal_value
          }))
        }
      } catch (slackError) {
        console.error('Slack notification failed:', slackError)
      }
    }

    // If deal status changed to "won", create a project
    if (originalDeal && originalDeal.status !== "won" && deal.status === "won") {
      try {
        // Extract financial data from WonDealModal (passed in request body)
        // If not provided, calculate defaults: commission = 20% of deal_value, speaker_fee = deal_value - commission
        const dealValue = body.deal_value || deal.deal_value || 0
        const commissionPercentage = body.commission_percentage ?? 20
        const commissionAmount = body.commission_amount ?? (dealValue * commissionPercentage / 100)
        const speakerFee = body.speaker_fee ?? (dealValue - commissionAmount)

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
          budget: dealValue,
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
          requested_speaker_name: body.speaker_name || deal.speaker_requested,
          program_topic: `${deal.event_title} - ${deal.event_type}`,
          program_type: deal.event_type,
          audience_size: deal.attendee_count,
          audience_demographics: "To be determined during planning",

          // Financial Details (from WonDealModal)
          speaker_fee: speakerFee,
          commission_percentage: commissionPercentage,
          commission_amount: commissionAmount,

          // Basic event fields (existing)
          attendee_count: deal.attendee_count,
          contact_person: deal.client_name,
          notes: `Deal ID: ${deal.id}\nSource: ${deal.source}\nBudget Range: ${deal.budget_range}\nOriginal notes: ${deal.notes}`,
          tags: [deal.event_type, deal.source],

          // Status tracking (initialized for new project)
          contract_signed: body.contract_signed || false,
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
            message: `Deal updated to Won and project "${project.project_name}" was automatically created`
          })
        }
      } catch (error) {
        console.error("Error creating project from won deal:", error)
        // Don't fail the deal update if project creation fails
      }
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error("Error in PUT /api/deals/[id]:", error)
    return NextResponse.json(
      {
        error: "Failed to update deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Skip auth for now to match the simple localStorage pattern used in GET/POST
    // TODO: Implement proper JWT auth across all admin APIs
    // const devBypass = request.headers.get('x-dev-admin-bypass')
    // if (devBypass !== 'dev-admin-access') {
    //   const authError = requireAdminAuth(request)
    //   if (authError) return authError
    // }

    const { id: idString } = await params
    const id = Number.parseInt(idString)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 })
    }

    const body = await request.json()
    
    // Get the original deal to check if status is changing
    const { getAllDeals } = await import("@/lib/deals-db")
    const deals = await getAllDeals()
    const originalDeal = deals.find(d => d.id === id)
    
    const deal = await updateDeal(id, body)

    if (!deal) {
      return NextResponse.json({ error: "Deal not found or failed to update" }, { status: 404 })
    }

    // If deal status changed to "won", create a project
    if (originalDeal && originalDeal.status !== "won" && deal.status === "won") {
      try {
        // Extract financial data from WonDealModal (passed in request body)
        // If not provided, calculate defaults: commission = 20% of deal_value, speaker_fee = deal_value - commission
        const dealValue = body.deal_value || deal.deal_value || 0
        const commissionPercentage = body.commission_percentage ?? 20
        const commissionAmount = body.commission_amount ?? (dealValue * commissionPercentage / 100)
        const speakerFee = body.speaker_fee ?? (dealValue - commissionAmount)

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
          budget: dealValue,
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
          requested_speaker_name: body.speaker_name || deal.speaker_requested,
          program_topic: `${deal.event_title} - ${deal.event_type}`,
          program_type: deal.event_type,
          audience_size: deal.attendee_count,
          audience_demographics: "To be determined during planning",

          // Financial Details (from WonDealModal)
          speaker_fee: speakerFee,
          commission_percentage: commissionPercentage,
          commission_amount: commissionAmount,

          // Basic event fields (existing)
          attendee_count: deal.attendee_count,
          contact_person: deal.client_name,
          notes: `Deal ID: ${deal.id}\nSource: ${deal.source}\nBudget Range: ${deal.budget_range}\nOriginal notes: ${deal.notes}`,
          tags: [deal.event_type, deal.source],

          // Status tracking (initialized for new project)
          contract_signed: body.contract_signed || false,
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
            message: `Deal updated to Won and project "${project.project_name}" was automatically created`
          })
        }
      } catch (error) {
        console.error("Error creating project from won deal:", error)
        // Don't fail the deal update if project creation fails
      }
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error("Error in PATCH /api/deals/[id]:", error)
    return NextResponse.json(
      {
        error: "Failed to update deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Skip auth for now to match the simple localStorage pattern used in GET/POST
    // TODO: Implement proper JWT auth across all admin APIs
    // const devBypass = request.headers.get('x-dev-admin-bypass')
    // if (devBypass !== 'dev-admin-access') {
    //   const authError = requireAdminAuth(request)
    //   if (authError) return authError
    // }

    const { id: idString } = await params
    const id = Number.parseInt(idString)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 })
    }

    const success = await deleteDeal(id)

    if (!success) {
      return NextResponse.json({ error: "Deal not found or failed to delete" }, { status: 404 })
    }

    return NextResponse.json({ message: "Deal deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/deals/[id]:", error)
    return NextResponse.json(
      {
        error: "Failed to delete deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

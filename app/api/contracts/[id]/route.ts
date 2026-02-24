import { type NextRequest, NextResponse } from "next/server"
import { getContractById, updateContractStatus, deleteContract, generateContractHTML, updateContract } from "@/lib/contracts-db"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { neon } from "@neondatabase/serverless"

interface RouteParams {
  params: {
    id: string
  }
}

// Build contract_data from individual columns + linked deal
function buildContractDataFromColumns(contract: any, deal: any | null): Record<string, any> {
  const data: Record<string, any> = {}

  // Basic info from contract columns
  if (contract.client_company) data.client_company = contract.client_company
  if (contract.client_name) data.client_contact_name = contract.client_name
  if (contract.client_email) data.client_email = contract.client_email
  if (contract.created_at || contract.generated_at) {
    const d = contract.generated_at || contract.created_at
    data.agreement_date = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]
  }

  // Speaker info
  if (contract.speaker_name) data.speaker_name = contract.speaker_name
  if (contract.speaker_email) data.speaker_email = contract.speaker_email

  // Event info
  if (contract.event_title) data.event_title = contract.event_title
  if (contract.event_date) {
    const d = contract.event_date
    data.event_date = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]
  }
  if (contract.event_location) data.event_location = contract.event_location
  if (contract.event_type) data.event_type = contract.event_type

  // Financial
  if (contract.speaker_fee || contract.fee_amount) {
    data.speaker_fee = contract.speaker_fee || contract.fee_amount
  }
  if (contract.payment_terms) data.payment_terms = contract.payment_terms

  // Enrich from linked deal
  if (deal) {
    if (!data.client_company && deal.company) data.client_company = deal.company
    if (deal.client_phone) data.client_phone = deal.client_phone
    if (deal.phone && !data.client_phone) data.client_phone = deal.phone
    if (deal.attendee_count) data.attendee_count = deal.attendee_count
    if (!data.speaker_name && deal.speaker_requested) data.speaker_name = deal.speaker_requested
    if (!data.event_location && deal.event_location) data.event_location = deal.event_location
    if (!data.event_type && deal.event_type) data.event_type = deal.event_type
    if (deal.travel_required) data.travel_arrangements = 'required'
    if (deal.travel_stipend) data.travel_buyout_amount = deal.travel_stipend
  }

  return data
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const contractId = parseInt(params.id)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const contract = await getContractById(contractId)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // If contract_data is empty/null, build it from columns + deal
    let contractData = contract.contract_data
    if (!contractData || Object.keys(contractData).length === 0 ||
        (contractData.tokens && Object.keys(contractData).length <= 3)) {
      // contract_data is either null or only has tokens/metadata — build from columns
      let deal = null
      if (contract.deal_id) {
        try {
          const sql = neon(process.env.DATABASE_URL!)
          const deals = await sql`SELECT * FROM deals WHERE id = ${contract.deal_id}`
          deal = deals[0] || null
        } catch (e) {
          console.error("Error fetching linked deal:", e)
        }
      }
      contractData = buildContractDataFromColumns(contract, deal)
    }

    const enhancedContract = {
      ...contract,
      contract_data: contractData,
      template_id: contract.template_id || contract.template_settings?.template_id || 'standard-speaker-agreement',
      signatures: {
        client: contract.client_signature_status ? {
          signed: contract.client_signature_status === 'signed',
          signed_at: contract.client_signed_at,
          signer_name: contract.client_signer_name
        } : null,
        speaker: contract.speaker_signature_status ? {
          signed: contract.speaker_signature_status === 'signed',
          signed_at: contract.speaker_signed_at,
          signer_name: contract.speaker_signer_name
        } : null
      }
    }

    return NextResponse.json(enhancedContract)
  } catch (error) {
    console.error("Error in GET /api/contracts/[id]:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Skip auth for now to match the simple localStorage pattern
    // const authError = requireAdminAuth(request)
    // if (authError) return authError

    const contractId = parseInt(params.id)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const body = await request.json()

    // Handle full contract updates for the hub
    if (body.values || body.contract_data || body.template_id) {
      const updateData = {
        template_id: body.template_id,
        title: body.title,
        type: body.type,
        category: body.category,
        contract_data: body.values || body.contract_data,  // Use contract_data column
        financial_terms: body.financial_terms,
        status: body.status,
        updated_by: body.updated_by || 'admin'
      }

      const contract = await updateContract(contractId, updateData)
      if (!contract) {
        return NextResponse.json({ error: "Failed to update contract" }, { status: 500 })
      }

      // If send_for_signature flag is set, update status
      if (body.send_for_signature) {
        await updateContractStatus(contractId, 'sent_for_signature', updateData.updated_by)
      }

      return NextResponse.json(contract)
    }

    // Support status-only updates
    if (body.status) {
      const validStatuses = ['draft', 'pending_review', 'sent_for_signature', 'partially_signed', 'fully_executed', 'active', 'completed', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }

      const contract = await updateContractStatus(contractId, body.status, body.updated_by)
      if (!contract) {
        return NextResponse.json({ error: "Failed to update contract" }, { status: 500 })
      }

      return NextResponse.json(contract)
    }

    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
  } catch (error) {
    console.error("Error in PUT /api/contracts/[id]:", error)
    return NextResponse.json(
      {
        error: "Failed to update contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Skip auth for now to match the simple localStorage pattern used elsewhere
    // TODO: Implement proper JWT auth across all admin APIs
    // const authError = requireAdminAuth(request)
    // if (authError) return authError

    const contractId = parseInt(params.id)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const success = await deleteContract(contractId)
    if (!success) {
      return NextResponse.json({ error: "Failed to delete contract" }, { status: 500 })
    }

    return NextResponse.json({ message: "Contract deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/contracts/[id]:", error)
    return NextResponse.json(
      {
        error: "Failed to delete contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
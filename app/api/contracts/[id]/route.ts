import { type NextRequest, NextResponse } from "next/server"
import { getContractById, updateContractStatus, deleteContract, generateContractHTML, updateContract } from "@/lib/contracts-db"
import { requireAdminAuth } from "@/lib/auth-middleware"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Skip auth for now to match the simple localStorage pattern
    // const authError = requireAdminAuth(request)
    // if (authError) return authError

    const contractId = parseInt(params.id)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const contract = await getContractById(contractId)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    console.log("Raw contract from database:", contract)
    console.log("contract.contract_data:", contract.contract_data)
    
    // Add additional fields for the hub
    // The contract_data column already exists in the database
    const enhancedContract = {
      ...contract,
      contract_data: contract.contract_data || contract.metadata || {},
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
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

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
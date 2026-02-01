import { type NextRequest, NextResponse } from "next/server"
import { getContractById, updateContractStatus } from "@/lib/contracts-db"
import { sendContractEmail } from "@/lib/email-service-unified"
import { requireAdminAuth } from "@/lib/auth-middleware"

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const contractId = parseInt(params.id)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const contract = await getContractById(contractId)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Check if contract is in draft status
    if (contract.status !== 'draft') {
      return NextResponse.json({ 
        error: "Contract must be in draft status to send" 
      }, { status: 400 })
    }

    // Prepare contract data with token for signing URL
    const contractData = {
      ...contract,
      token: contract.client_signing_token,
      speakerToken: contract.speaker_signing_token || undefined
    }

    // Send emails
    const emailResults = []
    
    // Send to client
    const clientEmailSent = await sendContractEmail(contractData, 'client')
    emailResults.push({ recipient: 'client', sent: clientEmailSent })

    // Send to speaker if speaker info exists
    if (contract.speaker_email && contract.speaker_signing_token) {
      // Update token for speaker email
      contractData.token = contract.speaker_signing_token
      const speakerEmailSent = await sendContractEmail(contractData, 'speaker')
      emailResults.push({ recipient: 'speaker', sent: speakerEmailSent })
    }

    // Update contract status to 'sent'
    const updatedContract = await updateContractStatus(contractId, 'sent', 'admin')
    if (!updatedContract) {
      return NextResponse.json({ 
        error: "Failed to update contract status" 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: "Contract sent successfully",
      emailResults,
      contract: updatedContract
    })
  } catch (error) {
    console.error("Error in POST /api/contracts/[id]/send:", error)
    return NextResponse.json(
      {
        error: "Failed to send contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
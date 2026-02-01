import { type NextRequest, NextResponse } from "next/server"
import { getContractByIdAndToken } from "@/lib/contracts-db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    
    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      )
    }

    const contractId = parseInt(params.id)
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: "Invalid contract ID" },
        { status: 400 }
      )
    }

    // Get contract by ID and validate token
    const contract = await getContractByIdAndToken(contractId, token)
    
    if (!contract) {
      return NextResponse.json(
        { error: "Invalid contract or token" },
        { status: 404 }
      )
    }

    // Check if token has expired
    if (contract.tokens_expire_at && new Date(contract.tokens_expire_at) < new Date()) {
      return NextResponse.json(
        { error: "This signing link has expired" },
        { status: 400 }
      )
    }

    // Return contract data for signing
    return NextResponse.json({
      id: contract.id,
      contract_number: contract.contract_number,
      event_title: contract.event_title,
      event_date: contract.event_date,
      event_location: contract.event_location,
      client_company: contract.client_company,
      client_signer_email: contract.client_signer_email,
      client_signer_name: contract.client_signer_name,
      speaker_name: contract.speaker_name,
      total_amount: contract.total_amount,
      content: contract.terms, // This should be HTML formatted
      status: contract.status,
      speaker_signed: !!contract.speaker_signed_at,
      client_signed: !!contract.client_signed_at
    })
  } catch (error) {
    console.error("Error in GET /api/contracts/[id]/signing:", error)
    return NextResponse.json(
      { error: "Failed to fetch contract" },
      { status: 500 }
    )
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { getContractByIdAndToken } from "@/lib/contracts-db"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { email, token } = body

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and token are required" },
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

    // Get contract and validate
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

    // Verify email matches the signer email
    const expectedEmail = token === contract.client_signing_token 
      ? contract.client_signer_email 
      : contract.speaker_email

    if (!expectedEmail || email.toLowerCase() !== expectedEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match the authorized signer" },
        { status: 403 }
      )
    }

    // Email verified successfully
    return NextResponse.json({ 
      success: true,
      message: "Email verified successfully" 
    })
  } catch (error) {
    console.error("Error in POST /api/contracts/[id]/verify-email:", error)
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    )
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { getContractByToken, addContractSignature } from "@/lib/contracts-db"
import { sendContractSignedNotification } from "@/lib/email-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const contract = await getContractByToken(token)
    
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Check if this is a valid signing token
    const isClientToken = contract.client_signing_token === token
    const isSpeakerToken = contract.speaker_signing_token === token
    
    if (!isClientToken && !isSpeakerToken) {
      return NextResponse.json({ error: "Invalid signing token" }, { status: 403 })
    }

    // Return contract data for signing (remove other party's tokens)
    const publicContract = {
      ...contract,
      client_signing_token: isClientToken ? token : undefined,
      speaker_signing_token: isSpeakerToken ? token : undefined,
      access_token: undefined
    }

    return NextResponse.json(publicContract)
  } catch (error) {
    console.error("Error in GET /api/contracts/public/sign/[token]:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const contract = await getContractByToken(token)
    
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Check if this is a valid signing token
    const isClientToken = contract.client_signing_token === token
    const isSpeakerToken = contract.speaker_signing_token === token
    
    if (!isClientToken && !isSpeakerToken) {
      return NextResponse.json({ error: "Invalid signing token" }, { status: 403 })
    }

    // Check if contract is signable
    if (contract.status === 'cancelled' || contract.status === 'fully_executed') {
      return NextResponse.json(
        { error: "Contract cannot be signed in its current state" }, 
        { status: 400 }
      )
    }

    // Check if expired
    if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Contract has expired and can no longer be signed" }, 
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.signer_name) {
      return NextResponse.json({ error: "Signer name is required" }, { status: 400 })
    }

    // Determine signer type
    const signerType = isClientToken ? 'client' : 'speaker'
    const signerEmail = isClientToken ? contract.client_email : contract.speaker_email || ""

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Add signature
    const signature = await addContractSignature(
      contract.id,
      signerType,
      body.signer_name,
      signerEmail,
      body.signature_data,
      body.signer_title,
      ip,
      userAgent
    )

    if (!signature) {
      return NextResponse.json({ error: "Failed to save signature" }, { status: 500 })
    }

    // Send notification
    await sendContractSignedNotification(contract, signerType)

    return NextResponse.json({
      success: true,
      message: "Contract signed successfully",
      signature_id: signature.id,
      contract_status: signature.verified ? 'fully_executed' : 'partially_signed'
    })
  } catch (error) {
    console.error("Error in POST /api/contracts/public/sign/[token]:", error)
    return NextResponse.json(
      {
        error: "Failed to sign contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { signContract, getContractByIdAndToken } from "@/lib/contracts-db"
import { sendContractConfirmationEmail } from "@/lib/email-service"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { token, signerName, signerTitle, signerType } = body

    if (!token || !signerName || !signerType) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Get contract and validate token
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

    // Validate signer type matches token
    const isClientToken = token === contract.client_signing_token
    const isSpeakerToken = token === contract.speaker_signing_token

    if ((signerType === "client" && !isClientToken) || 
        (signerType === "speaker" && !isSpeakerToken)) {
      return NextResponse.json(
        { error: "Invalid token for signer type" },
        { status: 403 }
      )
    }

    // Check if already signed
    if (signerType === "client" && contract.client_signed_at) {
      return NextResponse.json(
        { error: "Contract already signed by client" },
        { status: 400 }
      )
    }

    if (signerType === "speaker" && contract.speaker_signed_at) {
      return NextResponse.json(
        { error: "Contract already signed by speaker" },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "Unknown"
    const userAgent = request.headers.get("user-agent") || "Unknown"

    // Sign the contract
    const signature = await signContract({
      contractId,
      signerType,
      signerName,
      signerEmail: signerType === "client" ? contract.client_signer_email : contract.speaker_email,
      signerTitle: signerTitle || undefined,
      ipAddress: ip,
      userAgent
    })

    if (!signature) {
      throw new Error("Failed to create signature")
    }

    // Send confirmation email
    try {
      await sendContractConfirmationEmail({
        recipientEmail: signerType === "client" ? contract.client_signer_email : contract.speaker_email,
        recipientName: signerName,
        contractNumber: contract.contract_number,
        eventTitle: contract.event_title,
        eventDate: contract.event_date,
        isFullyExecuted: signature.contractFullyExecuted
      })
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError)
      // Don't fail the signing process due to email errors
    }

    return NextResponse.json({
      success: true,
      message: "Contract signed successfully",
      isFullyExecuted: signature.contractFullyExecuted,
      signatureId: signature.id
    })
  } catch (error) {
    console.error("Error in POST /api/contracts/[id]/sign:", error)
    return NextResponse.json(
      { error: "Failed to sign contract" },
      { status: 500 }
    )
  }
}
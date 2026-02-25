import { type NextRequest, NextResponse } from "next/server"
import { getContractByToken, addContractSignature, getContractSignatures } from "@/lib/contracts-db"
import { sendContractCompletedEmail } from "@/lib/email-service-unified"
import { neon } from "@neondatabase/serverless"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const contract = await getContractByToken(token)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found or invalid token" }, { status: 404 })
    }

    if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
      return NextResponse.json({ error: "This contract link has expired" }, { status: 410 })
    }

    if (contract.status === "cancelled") {
      return NextResponse.json({ error: "This contract has been cancelled" }, { status: 410 })
    }

    // Determine signer type from token
    let signerType: "client" | "speaker" | "admin" = "client"
    if (token === contract.speaker_signing_token) {
      signerType = "speaker"
    } else if (token === contract.access_token) {
      signerType = "admin"
    }

    // Get existing signatures
    const signatures = await getContractSignatures(contract.id)

    // Parse contract_data
    let contractData: Record<string, any> = {}
    if (contract.contract_data) {
      try {
        contractData = typeof contract.contract_data === "string"
          ? JSON.parse(contract.contract_data)
          : contract.contract_data
      } catch (e) {
        console.warn("Failed to parse contract_data:", e)
      }
    }

    // Get deal_value from linked deal if not in contract_data
    let dealValue = contractData.deal_value || contract.fee_amount || 0
    if (contract.deal_id && !contractData.deal_value) {
      try {
        const sql = neon(process.env.DATABASE_URL!)
        const deals = await sql`SELECT deal_value FROM deals WHERE id = ${contract.deal_id}`
        if (deals[0]?.deal_value) dealValue = deals[0].deal_value
      } catch (e) {
        // Fall back to fee_amount
      }
    }

    return NextResponse.json({
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        title: contract.title,
        status: contract.status,
        event_title: contract.event_title,
        event_date: contract.event_date,
        event_location: contract.event_location,
        client_name: contract.client_name,
        client_company: contract.client_company,
        speaker_name: contract.speaker_name,
        fee_amount: contract.fee_amount,
        deal_value: dealValue,
        contract_data: contractData
      },
      signer_type: signerType,
      signatures: signatures.map(s => ({
        id: s.id,
        signer_type: s.signer_type,
        signer_name: s.signer_name,
        signer_email: s.signer_email,
        signer_title: s.signer_title,
        signature_data: s.signature_data,
        signed_at: s.signed_at
      })),
      can_sign: !signatures.some(s => s.signer_type === signerType)
    })
  } catch (error) {
    console.error("Error in GET /api/contracts/sign/[token]:", error)
    return NextResponse.json(
      { error: "Failed to fetch contract", details: error instanceof Error ? error.message : "Unknown error" },
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

    const contract = await getContractByToken(token)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found or invalid token" }, { status: 404 })
    }

    if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
      return NextResponse.json({ error: "This contract link has expired" }, { status: 410 })
    }

    if (contract.status === "cancelled") {
      return NextResponse.json({ error: "This contract has been cancelled" }, { status: 410 })
    }

    if (!body.signer_name || !body.signer_email || !body.signature_data) {
      return NextResponse.json(
        { error: "Missing required fields: signer_name, signer_email, signature_data" },
        { status: 400 }
      )
    }

    // Determine signer type from token
    let signerType: "client" | "speaker" | "admin" = "client"
    if (token === contract.speaker_signing_token) {
      signerType = "speaker"
    } else if (token === contract.access_token) {
      signerType = "admin"
    }

    // Check if already signed
    const existingSignatures = await getContractSignatures(contract.id)
    if (existingSignatures.some(s => s.signer_type === signerType)) {
      return NextResponse.json({ error: "You have already signed this contract" }, { status: 400 })
    }

    // Get IP and user agent for audit trail
    const clientIP = request.headers.get("x-forwarded-for") ||
                     request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const signature = await addContractSignature(
      contract.id,
      signerType,
      body.signer_name,
      body.signer_email,
      body.signature_data,
      body.signer_title,
      clientIP,
      userAgent
    )

    if (!signature) {
      return NextResponse.json({ error: "Failed to record signature" }, { status: 500 })
    }

    // Check if contract is now fully executed and send emails
    const allSignatures = await getContractSignatures(contract.id)
    const hasClient = allSignatures.some(s => s.signer_type === "client")
    const hasSpeaker = allSignatures.some(s => s.signer_type === "speaker")
    const isFullyExecuted = hasClient && hasSpeaker

    if (isFullyExecuted) {
      // Send fully executed notification to all parties
      try {
        await sendContractCompletedEmail({
          clientName: contract.client_name,
          clientEmail: contract.client_email,
          speakerName: contract.speaker_name,
          speakerEmail: contract.speaker_email,
          eventTitle: contract.event_title,
          eventDate: contract.event_date,
          eventLocation: contract.event_location,
          speakerFee: contract.fee_amount,
          contractNumber: contract.contract_number
        })
      } catch (emailError) {
        console.error("Failed to send completion emails:", emailError)
        // Don't fail the signing just because email failed
      }
    }

    return NextResponse.json({
      message: "Contract signed successfully",
      fully_executed: isFullyExecuted,
      signature: {
        id: signature.id,
        signer_type: signature.signer_type,
        signer_name: signature.signer_name,
        signed_at: signature.signed_at
      }
    })
  } catch (error) {
    console.error("Error in POST /api/contracts/sign/[token]:", error)
    return NextResponse.json(
      { error: "Failed to sign contract", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

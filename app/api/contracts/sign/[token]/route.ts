import { type NextRequest, NextResponse } from "next/server"
import { getContractByToken, addContractSignature, getContractSignatures } from "@/lib/contracts-db"

interface RouteParams {
  params: {
    token: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const contract = await getContractByToken(params.token)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found or invalid token" }, { status: 404 })
    }

    // Check if contract is expired
    if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
      return NextResponse.json({ error: "Contract has expired" }, { status: 410 })
    }

    // Check if contract is cancelled
    if (contract.status === 'cancelled') {
      return NextResponse.json({ error: "Contract has been cancelled" }, { status: 410 })
    }

    // Determine signer type based on token
    let signerType: 'client' | 'speaker' | 'admin' = 'client'
    if (params.token === contract.speaker_signing_token) {
      signerType = 'speaker'
    } else if (params.token === contract.client_signing_token) {
      signerType = 'client'
    } else if (params.token === contract.access_token) {
      signerType = 'admin'
    }

    // Get existing signatures
    const signatures = await getContractSignatures(contract.id)

    // Return contract data for signing interface
    return NextResponse.json({
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        title: contract.title,
        status: contract.status,
        terms: contract.terms,
        event_title: contract.event_title,
        event_date: contract.event_date,
        client_name: contract.client_name,
        speaker_name: contract.speaker_name,
        total_amount: contract.total_amount
      },
      signer_type: signerType,
      signatures,
      can_sign: !signatures.some(s => s.signer_type === signerType)
    })
  } catch (error) {
    console.error("Error in GET /api/contracts/sign/[token]:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch contract for signing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    const contract = await getContractByToken(params.token)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found or invalid token" }, { status: 404 })
    }

    // Check if contract is expired
    if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
      return NextResponse.json({ error: "Contract has expired" }, { status: 410 })
    }

    // Check if contract is cancelled
    if (contract.status === 'cancelled') {
      return NextResponse.json({ error: "Contract has been cancelled" }, { status: 410 })
    }

    // Validate required fields
    if (!body.signer_name || !body.signer_email || !body.signature_data) {
      return NextResponse.json({ 
        error: "Missing required fields: signer_name, signer_email, signature_data" 
      }, { status: 400 })
    }

    // Determine signer type based on token
    let signerType: 'client' | 'speaker' | 'admin' = 'client'
    if (params.token === contract.speaker_signing_token) {
      signerType = 'speaker'
    } else if (params.token === contract.client_signing_token) {
      signerType = 'client'
    } else if (params.token === contract.access_token) {
      signerType = 'admin'
    }

    // Get client IP and user agent for audit trail
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

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
      return NextResponse.json({ error: "Failed to add signature" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Signature added successfully",
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
      {
        error: "Failed to add signature",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
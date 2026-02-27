import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getContractByToken } from "@/lib/contracts-db"
import { logSigningAudit } from "@/lib/contract-signing-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()

    const contract = await getContractByToken(token)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    if (contract.status === "cancelled") {
      return NextResponse.json({ error: "Contract has been cancelled" }, { status: 410 })
    }

    if (contract.status === "fully_executed") {
      return NextResponse.json({ error: "Contract is already fully executed" }, { status: 400 })
    }

    // Determine signer type
    let signerType: "client" | "speaker" | "admin" = "client"
    if (token === (contract as any).speaker_signing_token) {
      signerType = "speaker"
    } else if (token === (contract as any).access_token) {
      signerType = "admin"
    }

    const { section_id, section_label, initial_data } = body
    if (!section_id || !initial_data) {
      return NextResponse.json(
        { error: "Missing required fields: section_id, initial_data" },
        { status: 400 }
      )
    }

    // Determine signer email from contract
    const signerEmail = signerType === "client"
      ? contract.client_email
      : contract.speaker_email

    const ipAddress = request.headers.get("x-forwarded-for") ||
                      request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Upsert the initial
    await sql`
      INSERT INTO contract_initials (
        contract_id, signer_type, signer_email, section_id, section_label,
        initial_data, ip_address, user_agent
      ) VALUES (
        ${contract.id}, ${signerType}, ${signerEmail || ""}, ${section_id}, ${section_label || section_id},
        ${initial_data}, ${ipAddress}, ${userAgent}
      )
      ON CONFLICT (contract_id, signer_type, section_id)
      DO UPDATE SET
        initial_data = EXCLUDED.initial_data,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        created_at = CURRENT_TIMESTAMP
    `

    // Log to audit trail
    await logSigningAudit(
      contract.id,
      "initial_captured",
      signerType,
      signerEmail || null,
      ipAddress,
      userAgent,
      { section_id, section_label }
    )

    // Return updated initials list
    const initials = await sql`
      SELECT section_id, section_label, initial_data, created_at
      FROM contract_initials
      WHERE contract_id = ${contract.id} AND signer_type = ${signerType}
      ORDER BY created_at ASC
    `

    return NextResponse.json({
      message: "Initial saved",
      initials: initials.map((i: any) => ({
        section_id: i.section_id,
        section_label: i.section_label,
        initial_data: i.initial_data,
        created_at: i.created_at,
      })),
    })
  } catch (error) {
    console.error("Error saving initial:", error)
    return NextResponse.json(
      { error: "Failed to save initial" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const contract = await getContractByToken(token)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Determine signer type
    let signerType: "client" | "speaker" | "admin" = "client"
    if (token === (contract as any).speaker_signing_token) {
      signerType = "speaker"
    } else if (token === (contract as any).access_token) {
      signerType = "admin"
    }

    const initials = await sql`
      SELECT section_id, section_label, initial_data, created_at
      FROM contract_initials
      WHERE contract_id = ${contract.id} AND signer_type = ${signerType}
      ORDER BY created_at ASC
    `

    return NextResponse.json({
      initials: initials.map((i: any) => ({
        section_id: i.section_id,
        section_label: i.section_label,
        initial_data: i.initial_data,
        created_at: i.created_at,
      })),
    })
  } catch (error) {
    console.error("Error fetching initials:", error)
    return NextResponse.json(
      { error: "Failed to fetch initials" },
      { status: 500 }
    )
  }
}

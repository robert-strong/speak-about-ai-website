import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyClientToken } from "@/lib/client-auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const auth = verifyClientToken(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client email
    const clientInfo = await sql`
      SELECT id, email FROM clients WHERE id = ${auth.clientId}
    `
    if (clientInfo.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    const clientEmail = clientInfo[0].email

    // Fetch all contracts for this client
    const contracts = await sql`
      SELECT
        c.id,
        c.contract_number,
        c.title,
        c.status,
        c.event_title,
        c.event_date,
        c.event_location,
        c.fee_amount,
        c.speaker_name,
        c.client_signing_token,
        c.created_at,
        c.sent_at,
        c.signed_at
      FROM contracts c
      WHERE c.client_id = ${auth.clientId}
         OR LOWER(c.client_email) = ${clientEmail.toLowerCase()}
      ORDER BY c.created_at DESC
    `

    // Get signatures and signed PDFs for each contract
    const enrichedContracts = await Promise.all(
      contracts.map(async (contract: any) => {
        const signatures = await sql`
          SELECT signer_type, signed_at
          FROM contract_signatures
          WHERE contract_id = ${contract.id}
        `

        const signedPdf = await sql`
          SELECT id FROM signed_contract_pdfs
          WHERE contract_id = ${contract.id}
          LIMIT 1
        `

        const clientHasSigned = signatures.some((s: any) => s.signer_type === "client")
        const speakerHasSigned = signatures.some((s: any) => s.signer_type === "speaker")

        return {
          id: contract.id,
          contract_number: contract.contract_number,
          title: contract.title,
          status: contract.status,
          event_title: contract.event_title,
          event_date: contract.event_date,
          event_location: contract.event_location,
          fee_amount: contract.fee_amount,
          speaker_name: contract.speaker_name,
          created_at: contract.created_at,
          sent_at: contract.sent_at,
          signed_at: contract.signed_at,
          client_has_signed: clientHasSigned,
          speaker_has_signed: speakerHasSigned,
          has_signed_pdf: signedPdf.length > 0,
          // Only include signing token if contract needs client signature
          client_signing_token:
            contract.status !== "fully_executed" && !clientHasSigned
              ? contract.client_signing_token
              : null,
        }
      })
    )

    // Partition contracts
    const todo = enrichedContracts.filter(
      (c) =>
        ["sent", "partially_signed"].includes(c.status) && !c.client_has_signed
    )

    const library = enrichedContracts.filter(
      (c) => c.status === "fully_executed"
    )

    const stats = {
      pending: todo.length,
      completed: library.length,
      total: enrichedContracts.length,
    }

    return NextResponse.json({ todo, library, stats })
  } catch (error) {
    console.error("Error fetching portal contracts:", error)
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyClientToken } from "@/lib/client-auth-utils"
import { logSigningAudit } from "@/lib/contract-signing-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyClientToken(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const contractId = parseInt(id, 10)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    // Verify contract belongs to this client
    const contracts = await sql`
      SELECT c.id, c.client_email, c.client_id
      FROM contracts c
      WHERE c.id = ${contractId}
        AND (c.client_id = ${auth.clientId} OR LOWER(c.client_email) = ${auth.email.toLowerCase()})
    `

    if (contracts.length === 0) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Fetch signed HTML
    const pdfs = await sql`
      SELECT signed_html FROM signed_contract_pdfs
      WHERE contract_id = ${contractId}
    `

    if (pdfs.length === 0) {
      return NextResponse.json({ error: "Signed PDF not available" }, { status: 404 })
    }

    // Log the download
    const ipAddress = request.headers.get("x-forwarded-for") ||
                      request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    await logSigningAudit(
      contractId,
      "pdf_downloaded",
      "client",
      auth.email,
      ipAddress,
      userAgent
    )

    return new NextResponse(pdfs[0].signed_html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Error serving signed PDF:", error)
    return NextResponse.json(
      { error: "Failed to fetch signed contract" },
      { status: 500 }
    )
  }
}

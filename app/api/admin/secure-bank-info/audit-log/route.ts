import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

// GET - Retrieve audit log
export async function GET(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const linkId = searchParams.get('linkId')

    let logs
    if (linkId) {
      logs = await sql`
        SELECT
          al.*,
          bl.client_email as link_client_email,
          bl.client_name as link_client_name
        FROM bank_info_audit_log al
        LEFT JOIN bank_info_links bl ON al.link_id = bl.id
        WHERE al.link_id = ${parseInt(linkId)}
        ORDER BY al.created_at DESC
        LIMIT ${limit}
      `
    } else {
      logs = await sql`
        SELECT
          al.*,
          bl.client_email as link_client_email,
          bl.client_name as link_client_name
        FROM bank_info_audit_log al
        LEFT JOIN bank_info_links bl ON al.link_id = bl.id
        ORDER BY al.created_at DESC
        LIMIT ${limit}
      `
    }

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching audit log:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 }
    )
  }
}

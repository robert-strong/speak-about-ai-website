import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const invoices = await sql`
      SELECT 
        i.*,
        p.project_name as project_title,
        p.client_name
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      ORDER BY i.created_at DESC
    `

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Invoices API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()

    // If project_id is provided, fetch project details and use as defaults
    let clientName = body.client_name
    let clientEmail = body.client_email
    let company = body.company
    let amount = body.amount
    let description = body.description

    if (body.project_id) {
      const [project] = await sql`
        SELECT client_name, client_email, company, speaker_fee, budget, event_name, event_title, project_name
        FROM projects
        WHERE id = ${body.project_id}
      `
      if (project) {
        clientName = clientName || project.client_name
        clientEmail = clientEmail || project.client_email
        company = company || project.company
        // Auto-populate amount from project speaker_fee or budget if not provided
        if (!amount) {
          amount = parseFloat(project.speaker_fee || project.budget || '0')
        }
        // Auto-generate description from project
        if (!description) {
          description = `Speaker engagement for ${project.event_name || project.event_title || project.project_name}`
        }
      }
    }

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "amount is required" },
        { status: 400 }
      )
    }

    // Validate that we have client info
    if (!clientName || !clientEmail) {
      return NextResponse.json(
        { error: "client_name and client_email are required" },
        { status: 400 }
      )
    }

    // Generate invoice number
    const invoiceCount = await sql`SELECT COUNT(*) as count FROM invoices`
    const invoiceNumber = `INV-${String(Date.now()).slice(-6)}-${String(invoiceCount[0].count + 1).padStart(3, '0')}`

    const result = await sql`
      INSERT INTO invoices (
        project_id,
        invoice_number,
        invoice_type,
        client_name,
        client_email,
        client_company,
        amount,
        status,
        issue_date,
        due_date,
        description,
        notes
      ) VALUES (
        ${body.project_id || null},
        ${invoiceNumber},
        ${body.invoice_type || 'standard'},
        ${clientName},
        ${clientEmail},
        ${company || null},
        ${amount},
        ${body.status || 'draft'},
        ${new Date().toISOString().split('T')[0]},
        ${body.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},
        ${description || ''},
        ${body.notes || ''}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Create invoice error:", error)
    return NextResponse.json(
      { 
        error: "Failed to create invoice",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
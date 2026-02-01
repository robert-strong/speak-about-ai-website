import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required in Next.js 15
    const params = await context.params
    
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const invoiceId = parseInt(params.id)

    // Fetch invoice with project details
    const [invoice] = await sql`
      SELECT 
        i.*,
        p.event_name,
        p.event_date,
        p.venue_address as event_location,
        p.requested_speaker_name as speaker_name,
        p.program_topic,
        p.program_type,
        p.program_length,
        p.qa_length,
        p.audience_size,
        p.client_name,
        p.client_email,
        p.company,
        p.deliverables as project_deliverables,
        p.notes as project_notes
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ${invoiceId}
    `

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    // Check for overrides stored in invoice notes (as JSON)
    let overrides = {}
    let notesText = invoice.notes
    
    if (invoice.notes) {
      try {
        const notesData = JSON.parse(invoice.notes)
        if (typeof notesData === 'object' && notesData.overrides) {
          overrides = notesData.overrides
          notesText = notesData.text || ''
        }
      } catch (e) {
        // Notes might not be JSON, that's okay - use as plain text
        notesText = invoice.notes
      }
    }

    // Merge overrides with project data
    const fullInvoice = {
      ...invoice,
      // Use plain text notes
      notes: notesText,
      // Use overrides if available, otherwise use project data
      event_name: overrides.event_name || invoice.event_name,
      speaker_name: overrides.speaker_name || invoice.speaker_name,
      program_topic: overrides.program_topic || invoice.program_topic,
      program_type: overrides.program_type || invoice.program_type,
      program_length: overrides.program_length || invoice.program_length,
      qa_length: overrides.qa_length || invoice.qa_length,
      audience_size: overrides.audience_size || invoice.audience_size,
      deliverables: overrides.deliverables || invoice.project_deliverables
    }

    return NextResponse.json(fullInvoice)

  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch invoice",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
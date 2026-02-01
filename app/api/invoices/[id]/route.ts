import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const invoiceId = parseInt(id)
    
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    const [invoice] = await sql`
      SELECT 
        i.*,
        p.project_name as project_title,
        p.client_name as project_client_name,
        p.event_date,
        p.event_location
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ${invoiceId}
    `

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const invoiceId = parseInt(id)
    
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status, payment_date, amount, due_date, notes, client_name, client_email, company } = body

    // Validate status if provided
    const validStatuses = ["draft", "sent", "paid", "overdue", "cancelled"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be one of: draft, sent, paid, overdue, cancelled" 
      }, { status: 400 })
    }

    // Check if invoice exists and get project_id
    const [invoice] = await sql`
      SELECT * FROM invoices WHERE id = ${invoiceId}
    `

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Update invoice with provided fields
    const [updatedInvoice] = await sql`
      UPDATE invoices 
      SET 
        status = ${status !== undefined ? status : invoice.status},
        payment_date = ${payment_date !== undefined ? payment_date : invoice.payment_date},
        amount = ${amount !== undefined ? amount : invoice.amount},
        due_date = ${due_date !== undefined ? due_date : invoice.due_date},
        notes = ${notes !== undefined ? notes : invoice.notes},
        client_name = ${client_name !== undefined ? client_name : invoice.client_name},
        client_email = ${client_email !== undefined ? client_email : invoice.client_email},
        company = ${company !== undefined ? company : invoice.company},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${invoiceId}
      RETURNING *
    `

    // If invoice is marked as paid and has a project_id, update the project status
    if (status === "paid" && updatedInvoice.project_id) {
      console.log(`Invoice ${invoiceId} marked as paid. Updating project ${updatedInvoice.project_id} to completed status.`)
      
      try {
        await sql`
          UPDATE projects 
          SET 
            status = 'completed',
            completion_percentage = 100,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${updatedInvoice.project_id}
        `
        console.log(`Successfully updated project ${updatedInvoice.project_id} to completed status`)
      } catch (projectError) {
        console.error(`Failed to update project ${updatedInvoice.project_id} status:`, projectError)
        // Don't fail the invoice update if project update fails
      }
    }

    return NextResponse.json(updatedInvoice)

  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      { 
        error: "Failed to update invoice",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const invoiceId = parseInt(id)
    
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    // Check if invoice exists
    const [invoice] = await sql`
      SELECT id FROM invoices WHERE id = ${invoiceId}
    `

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Delete the invoice
    await sql`DELETE FROM invoices WHERE id = ${invoiceId}`

    return NextResponse.json({ 
      success: true, 
      message: "Invoice deleted successfully" 
    })

  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json(
      { 
        error: "Failed to delete invoice",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
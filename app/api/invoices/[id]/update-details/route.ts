import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(
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
    const body = await request.json()
    const { description, notes, overrides } = body

    // Prepare notes with overrides
    let finalNotes = notes || ""
    if (overrides && Object.keys(overrides).some(key => overrides[key])) {
      // Only store as JSON if there are actual overrides
      const hasOverrides = Object.values(overrides).some(v => v !== null && v !== undefined && v !== '')
      if (hasOverrides) {
        // Clean up deliverables in overrides if present
        if (overrides.deliverables) {
          overrides.deliverables = overrides.deliverables
            .split('\n')
            .filter((item: string) => item.trim())
            .map((item: string) => item.replace(/^[•\-\*]\s*/, '').trim())
            .filter((item: string) => item)
            .join('\n')
        }
        
        const notesData = {
          text: notes || "",
          overrides: overrides
        }
        finalNotes = JSON.stringify(notesData)
      }
    }

    // Update invoice
    const [updatedInvoice] = await sql`
      UPDATE invoices 
      SET 
        description = ${description || null},
        notes = ${finalNotes},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${invoiceId}
      RETURNING *
    `

    if (!updatedInvoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    // If deliverables were overridden, update the project's deliverables field too
    if (overrides?.deliverables && updatedInvoice.project_id) {
      // Clean up deliverables before storing
      const cleanDeliverables = overrides.deliverables
        .split('\n')
        .filter((item: string) => item.trim())
        .map((item: string) => item.replace(/^[•\-\*]\s*/, '').trim())
        .filter((item: string) => item)
        .join('\n')
      
      await sql`
        UPDATE projects
        SET 
          deliverables = ${cleanDeliverables},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${updatedInvoice.project_id}
      `
    }

    return NextResponse.json({
      success: true,
      message: "Invoice details updated successfully",
      invoice: updatedInvoice
    })

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
import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

function generateInvoiceNumber(type: 'deposit' | 'final', projectId: number): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const typePrefix = type === 'deposit' ? 'DEP' : 'FIN'
  return `INV-${typePrefix}-${year}${month}-${projectId}`
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Fetch project details
    const [project] = await sql`
      SELECT 
        p.*,
        s.name as speaker_name,
        s.email as speaker_email
      FROM projects p
      LEFT JOIN speakers s ON p.speaker_id = s.id
      WHERE p.id = ${projectId}
    `

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Calculate deposit and final amounts
    const depositPercentage = parseInt(process.env.INVOICE_DEPOSIT_PERCENTAGE || '50') / 100
    const totalAmount = parseFloat(project.speaker_fee || project.budget || '0')
    const depositAmount = totalAmount * depositPercentage
    const finalAmount = totalAmount - depositAmount

    // Create deposit invoice
    const depositInvoiceNumber = generateInvoiceNumber('deposit', projectId)
    const [depositInvoice] = await sql`
      INSERT INTO invoices (
        project_id,
        invoice_number,
        invoice_type,
        amount,
        status,
        issue_date,
        due_date,
        description,
        client_name,
        client_email,
        client_company
      ) VALUES (
        ${projectId},
        ${depositInvoiceNumber},
        'deposit',
        ${depositAmount},
        'draft',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        ${'Initial deposit (50% of total fee) for keynote presentation'},
        ${project.client_name},
        ${project.client_email},
        ${project.company}
      )
      RETURNING *
    `

    // Create final payment invoice
    const finalInvoiceNumber = generateInvoiceNumber('final', projectId)
    const eventDate = project.event_date || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // Default to 60 days from now
    const [finalInvoice] = await sql`
      INSERT INTO invoices (
        project_id,
        invoice_number,
        invoice_type,
        amount,
        status,
        issue_date,
        due_date,
        description,
        client_name,
        client_email,
        client_company,
        parent_invoice_id
      ) VALUES (
        ${projectId},
        ${finalInvoiceNumber},
        'final',
        ${finalAmount},
        'draft',
        CURRENT_TIMESTAMP,
        ${eventDate},
        ${'Final payment (50% of total fee) due on event date'},
        ${project.client_name},
        ${project.client_email},
        ${project.company},
        ${depositInvoice.id}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Invoices created successfully",
      invoices: {
        deposit: depositInvoice,
        final: finalInvoice
      },
      totals: {
        total: totalAmount,
        deposit: depositAmount,
        final: finalAmount
      }
    })

  } catch (error) {
    console.error("Error generating invoice pair:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate invoices",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
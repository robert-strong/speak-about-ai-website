import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Checking and fixing invoices table schema...")

    // Check if invoices table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'invoices'
      ) as exists
    `

    if (!tableExists[0].exists) {
      // Create the table if it doesn't exist
      await sql`
        CREATE TABLE invoices (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
          issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          due_date TIMESTAMP WITH TIME ZONE NOT NULL,
          payment_date TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`
      await sql`CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)`
      
      return NextResponse.json({ 
        message: "Invoices table created successfully",
        action: "created"
      })
    }

    // Check existing columns
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'invoices'
      ORDER BY ordinal_position
    `

    const columnNames = columns.map((col: any) => col.column_name)
    const missingColumns = []

    // Check for missing columns and add them
    if (!columnNames.includes('notes')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT`
      missingColumns.push('notes')
    }

    if (!columnNames.includes('created_at')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
      missingColumns.push('created_at')
    }

    if (!columnNames.includes('updated_at')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
      missingColumns.push('updated_at')
    }

    if (!columnNames.includes('payment_date')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE`
      missingColumns.push('payment_date')
    }

    // Add invoice_type column for deposit/final/standard invoices
    if (!columnNames.includes('invoice_type')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(20) DEFAULT 'standard'`
      missingColumns.push('invoice_type')
    }

    // Add description column
    if (!columnNames.includes('description')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description TEXT`
      missingColumns.push('description')
    }

    // Add client info columns
    if (!columnNames.includes('client_name')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_name VARCHAR(255)`
      missingColumns.push('client_name')
    }

    if (!columnNames.includes('client_email')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_email VARCHAR(255)`
      missingColumns.push('client_email')
    }

    if (!columnNames.includes('client_company')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_company VARCHAR(255)`
      missingColumns.push('client_company')
    }

    // Add parent_invoice_id for linking deposit to final invoices
    if (!columnNames.includes('parent_invoice_id')) {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS parent_invoice_id INTEGER REFERENCES invoices(id)`
      missingColumns.push('parent_invoice_id')
    }

    // Backfill client info from projects for existing invoices
    await sql`
      UPDATE invoices i
      SET
        client_name = COALESCE(i.client_name, p.client_name),
        client_email = COALESCE(i.client_email, p.client_email),
        client_company = COALESCE(i.client_company, p.company)
      FROM projects p
      WHERE i.project_id = p.id
        AND (i.client_name IS NULL OR i.client_email IS NULL)
    `

    console.log(`Fixed invoices table. Added columns: ${missingColumns.join(', ')}`)

    return NextResponse.json({ 
      message: "Invoices table schema fixed successfully",
      action: "updated",
      columns_added: missingColumns,
      total_columns: columnNames.length + missingColumns.length
    })
  } catch (error) {
    console.error("Fix invoices table error:", error)
    return NextResponse.json(
      { 
        error: "Failed to fix invoices table",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
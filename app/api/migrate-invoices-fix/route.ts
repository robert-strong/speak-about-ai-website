import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Running invoices table fix migration...")

    // Check if invoices table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'invoices'
      )
    `

    if (tableExists[0].exists) {
      // Check if project_id column already exists
      const columnExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'invoices'
          AND column_name = 'project_id'
        )
      `

      if (!columnExists[0].exists) {
        // Add project_id column
        await sql`ALTER TABLE invoices ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE`
        console.log("Added project_id column to invoices table")

        // Create index for performance
        await sql`CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id)`
        console.log("Created index on project_id")
      } else {
        console.log("project_id column already exists")
      }
    } else {
      // Create the entire invoices table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(50) DEFAULT 'draft',
          issue_date DATE NOT NULL,
          due_date DATE NOT NULL,
          paid_date DATE,
          description TEXT,
          payment_method VARCHAR(50),
          payment_reference VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log("Created invoices table with project_id column")

      // Create indexes for performance
      await sql`CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`
      await sql`CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)`
      await sql`CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date)`
      console.log("Created indexes on invoices table")
    }

    return NextResponse.json({ 
      success: true, 
      message: "Invoices table migration completed successfully!" 
    })

  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { 
        error: "Migration failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
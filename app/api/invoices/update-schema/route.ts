import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Add invoice_type column to distinguish between deposit and final payment
    await sql`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(20) DEFAULT 'standard' 
      CHECK (invoice_type IN ('deposit', 'final', 'standard'))
    `

    // Add parent_invoice_id to link deposit and final invoices
    await sql`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS parent_invoice_id INTEGER REFERENCES invoices(id)
    `

    // Add description column for detailed invoice descriptions
    await sql`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS description TEXT
    `

    // Add client details columns
    await sql`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS client_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS client_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS client_company VARCHAR(255),
      ADD COLUMN IF NOT EXISTS company VARCHAR(255)
    `

    // Create index for invoice type and parent invoice
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invoices_parent ON invoices(parent_invoice_id)
    `

    return NextResponse.json({ 
      success: true,
      message: "Invoice schema updated successfully" 
    })
  } catch (error) {
    console.error("Error updating invoice schema:", error)
    return NextResponse.json(
      { 
        error: "Failed to update invoice schema",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
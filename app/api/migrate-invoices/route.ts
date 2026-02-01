import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Running invoices and portal tables migration...")

    // Enable pgcrypto extension for gen_random_bytes
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`

    // Create invoices table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
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

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date)`

    // Create client_accounts table for portal access
    await sql`
      CREATE TABLE IF NOT EXISTS client_accounts (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255) UNIQUE NOT NULL,
        client_phone VARCHAR(20),
        company VARCHAR(255),
        access_token VARCHAR(100) UNIQUE NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 64),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      )
    `

    // Create speaker_accounts table for portal access
    await sql`
      CREATE TABLE IF NOT EXISTS speaker_accounts (
        id SERIAL PRIMARY KEY,
        speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,
        speaker_name VARCHAR(255) NOT NULL,
        speaker_email VARCHAR(255) UNIQUE NOT NULL,
        access_token VARCHAR(100) UNIQUE NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 64),
        is_active BOOLEAN DEFAULT true,
        profile_status VARCHAR(20) DEFAULT 'approved' CHECK (profile_status IN ('pending', 'approved', 'needs_review')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      )
    `

    // Create junction tables
    await sql`
      CREATE TABLE IF NOT EXISTS project_client_accounts (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        client_account_id INTEGER REFERENCES client_accounts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, client_account_id)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS project_speaker_accounts (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        speaker_account_id INTEGER REFERENCES speaker_accounts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, speaker_account_id)
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_client_accounts_email ON client_accounts(client_email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_client_accounts_token ON client_accounts(access_token)`
    await sql`CREATE INDEX IF NOT EXISTS idx_speaker_accounts_email ON speaker_accounts(speaker_email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_speaker_accounts_token ON speaker_accounts(access_token)`
    await sql`CREATE INDEX IF NOT EXISTS idx_speaker_accounts_speaker_id ON speaker_accounts(speaker_id)`

    console.log("Migration completed successfully!")

    return NextResponse.json({ 
      message: "Migration completed successfully",
      tables_created: [
        "invoices",
        "client_accounts", 
        "speaker_accounts",
        "project_client_accounts",
        "project_speaker_accounts"
      ]
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
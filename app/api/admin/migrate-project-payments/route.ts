import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Create project_payments table for tracking multiple payments per project
    await sql`
      CREATE TABLE IF NOT EXISTS project_payments (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('client', 'speaker')),
        amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        payment_date DATE,
        payment_method VARCHAR(100),
        label VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create index for quick lookups by project
    await sql`
      CREATE INDEX IF NOT EXISTS idx_project_payments_project_id ON project_payments(project_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_project_payments_type ON project_payments(project_id, payment_type)
    `

    return NextResponse.json({
      success: true,
      message: 'project_payments table created successfully'
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

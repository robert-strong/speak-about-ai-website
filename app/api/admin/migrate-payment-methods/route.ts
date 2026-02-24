import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const DEFAULT_PAYMENT_METHODS = [
  'Bank Transfer (ACH)',
  'Wire Transfer',
  'Check',
  'Credit Card',
  'PayPal',
  'Other'
]

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const steps: string[] = []

    // Step 1: Create payment_methods table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `
    steps.push('Created payment_methods table (if not existed)')

    // Step 2: Seed default payment methods
    for (let i = 0; i < DEFAULT_PAYMENT_METHODS.length; i++) {
      await sql`
        INSERT INTO payment_methods (name, sort_order)
        VALUES (${DEFAULT_PAYMENT_METHODS[i]}, ${i})
        ON CONFLICT (name) DO NOTHING
      `
    }
    steps.push(`Seeded ${DEFAULT_PAYMENT_METHODS.length} default payment methods`)

    // Step 3: Add client_payment_method column to projects
    try {
      await sql`ALTER TABLE projects ADD COLUMN client_payment_method VARCHAR(100)`
      steps.push('Added client_payment_method column to projects')
    } catch (error: any) {
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate column')) {
        steps.push('client_payment_method column already exists on projects (skipped)')
      } else {
        throw error
      }
    }

    // Step 4: Add speaker_payment_method column to projects
    try {
      await sql`ALTER TABLE projects ADD COLUMN speaker_payment_method VARCHAR(100)`
      steps.push('Added speaker_payment_method column to projects')
    } catch (error: any) {
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate column')) {
        steps.push('speaker_payment_method column already exists on projects (skipped)')
      } else {
        throw error
      }
    }

    // Verify the final state
    const methods = await sql`SELECT id, name, sort_order FROM payment_methods ORDER BY sort_order ASC, name ASC`

    return NextResponse.json({
      success: true,
      message: 'Payment methods migration completed successfully',
      steps,
      payment_methods: methods
    })
  } catch (error) {
    console.error('Payment methods migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also allow GET for easy browser access
export async function GET() {
  return POST()
}

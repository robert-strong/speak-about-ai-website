import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

const DEFAULT_PAYMENT_METHODS = [
  'Bank Transfer (ACH)',
  'Wire Transfer',
  'Check',
  'Credit Card',
  'PayPal',
  'Other'
]

async function ensureTableExists() {
  await sql`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Seed default values if table is empty
  const existing = await sql`SELECT COUNT(*) as count FROM payment_methods`
  if (Number(existing[0].count) === 0) {
    for (let i = 0; i < DEFAULT_PAYMENT_METHODS.length; i++) {
      await sql`
        INSERT INTO payment_methods (name, sort_order)
        VALUES (${DEFAULT_PAYMENT_METHODS[i]}, ${i})
        ON CONFLICT (name) DO NOTHING
      `
    }
  }
}

// GET: Fetch all payment methods
export async function GET(request: NextRequest) {
  try {
    await ensureTableExists()

    const methods = await sql`
      SELECT id, name, sort_order, created_at
      FROM payment_methods
      ORDER BY sort_order ASC, name ASC
    `

    return NextResponse.json({ methods })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Create a new payment method
export async function POST(request: NextRequest) {
  try {
    await ensureTableExists()

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Get the next sort_order
    const maxOrder = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM payment_methods`
    const nextOrder = Number(maxOrder[0].next_order)

    const result = await sql`
      INSERT INTO payment_methods (name, sort_order)
      VALUES (${name.trim()}, ${nextOrder})
      RETURNING id, name, sort_order, created_at
    `

    return NextResponse.json({ method: result[0] })
  } catch (error: any) {
    console.error('Error creating payment method:', error)
    if (error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'A payment method with that name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create payment method', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Remove a payment method
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'Valid id is required' },
        { status: 400 }
      )
    }

    const result = await sql`
      DELETE FROM payment_methods
      WHERE id = ${id}
      RETURNING id, name
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, deleted: result[0] })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

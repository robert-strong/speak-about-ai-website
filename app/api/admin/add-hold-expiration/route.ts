import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Add hold_expires_at column if it doesn't exist
    await sql`
      ALTER TABLE firm_offers
      ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMP WITH TIME ZONE
    `

    return NextResponse.json({
      success: true,
      message: 'hold_expires_at column added successfully'
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

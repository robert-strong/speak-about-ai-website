import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { migration } = body

    if (migration === 'firm_offers') {
      // Create firm_offers table
      await sql`
        CREATE TABLE IF NOT EXISTS firm_offers (
          id SERIAL PRIMARY KEY,
          proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'draft',
          event_overview JSONB DEFAULT '{}',
          speaker_program JSONB DEFAULT '{}',
          event_schedule JSONB DEFAULT '{}',
          technical_requirements JSONB DEFAULT '{}',
          travel_accommodation JSONB DEFAULT '{}',
          additional_info JSONB DEFAULT '{}',
          financial_details JSONB DEFAULT '{}',
          confirmation JSONB DEFAULT '{}',
          speaker_access_token VARCHAR(64) UNIQUE,
          speaker_viewed_at TIMESTAMP WITH TIME ZONE,
          speaker_response_at TIMESTAMP WITH TIME ZONE,
          speaker_notes TEXT,
          speaker_confirmed BOOLEAN,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          submitted_at TIMESTAMP WITH TIME ZONE,
          sent_to_speaker_at TIMESTAMP WITH TIME ZONE
        )
      `

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_firm_offers_proposal_id ON firm_offers(proposal_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_firm_offers_speaker_token ON firm_offers(speaker_access_token)`
      await sql`CREATE INDEX IF NOT EXISTS idx_firm_offers_status ON firm_offers(status)`

      return NextResponse.json({
        success: true,
        message: 'firm_offers table created successfully'
      })
    }

    return NextResponse.json(
      { error: 'Unknown migration' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Get speaker columns
    const speakerCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'speakers'
      ORDER BY ordinal_position
    `

    // Get project columns
    const projectCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position
    `

    // Get deal columns
    const dealCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'deals'
      ORDER BY ordinal_position
    `

    // Check for any commission-related data in deals
    let dealsWithCommission: any[] = []
    try {
      dealsWithCommission = await sql`
        SELECT *
        FROM deals
        LIMIT 5
      `
    } catch (e) {
      // ignore if deals table doesn't exist
    }

    return NextResponse.json({
      speaker_columns: speakerCols.map(c => `${c.column_name} (${c.data_type})`),
      project_columns: projectCols.map(c => `${c.column_name} (${c.data_type})`),
      deal_columns: dealCols.map(c => `${c.column_name} (${c.data_type})`),
      deals_with_commission: dealsWithCommission
    })

  } catch (error) {
    console.error('Error checking schema:', error)
    return NextResponse.json({
      error: 'Failed to check schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

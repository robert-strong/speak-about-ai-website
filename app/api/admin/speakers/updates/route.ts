import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const speakerId = searchParams.get('speakerId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let updates
    
    if (speakerId) {
      // Get updates for specific speaker
      updates = await sql`
        SELECT 
          su.*,
          s.name as current_speaker_name
        FROM speaker_updates su
        LEFT JOIN speakers s ON su.speaker_id = s.id
        WHERE su.speaker_id = ${speakerId}
        ORDER BY su.created_at DESC
        LIMIT ${limit}
      `
    } else {
      // Get all recent updates
      updates = await sql`
        SELECT 
          su.*,
          s.name as current_speaker_name
        FROM speaker_updates su
        LEFT JOIN speakers s ON su.speaker_id = s.id
        ORDER BY su.created_at DESC
        LIMIT ${limit}
      `
    }
    
    return NextResponse.json({
      success: true,
      updates
    })
  } catch (error) {
    console.error('Error fetching speaker updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch speaker updates' },
      { status: 500 }
    )
  }
}
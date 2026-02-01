import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const speakerId = parseInt(params.id)
    
    // Verify authentication (simplified for MVP)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const speakers = await sql`
      SELECT 
        id, email, name, bio, short_bio, one_liner,
        headshot_url, website, topics,
        speaking_fee_range, travel_preferences,
        technical_requirements, dietary_restrictions,
        active
      FROM speakers
      WHERE id = ${speakerId}
      LIMIT 1
    `

    if (speakers.length === 0) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 })
    }

    return NextResponse.json({ speaker: speakers[0] })

  } catch (error) {
    console.error('Error fetching speaker:', error)
    return NextResponse.json(
      { error: 'Failed to fetch speaker information' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const speakerId = parseInt(params.id)
    
    // Verify authentication (simplified for MVP)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Update speaker information
    const result = await sql`
      UPDATE speakers
      SET 
        name = ${data.name},
        bio = ${data.bio},
        short_bio = ${data.short_bio},
        one_liner = ${data.one_liner},
        headshot_url = ${data.headshot_url},
        website = ${data.website},
        topics = ${JSON.stringify(data.topics || [])},
        speaking_fee_range = ${data.speaking_fee_range},
        travel_preferences = ${data.travel_preferences},
        technical_requirements = ${data.technical_requirements},
        dietary_restrictions = ${data.dietary_restrictions},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${speakerId}
      RETURNING id, email, name, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      speaker: result[0]
    })

  } catch (error) {
    console.error('Error updating speaker:', error)
    return NextResponse.json(
      { error: 'Failed to update speaker information' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    // Check speaker authentication
    const authHeader = request.headers.get('authorization')
    let speakerInfo: any = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // For now, decode the speaker info from the token
      // In production, validate the token properly
      try {
        const decoded = Buffer.from(token, 'base64').toString()
        const [email, name] = decoded.split(':')
        speakerInfo = { email, name }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
      }
    } else {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    
    // Fetch inquiries where this speaker is tagged
    // We'll search for inquiries that have this speaker's name in the tagged_speakers field
    const inquiries = await sql`
      SELECT 
        id,
        client_name,
        client_email,
        event_title,
        event_date,
        event_location,
        event_type,
        event_budget,
        tagged_speakers,
        status,
        created_at,
        notes
      FROM project_inquiries
      WHERE tagged_speakers LIKE ${'%' + speakerInfo.name + '%'}
      ORDER BY created_at DESC
      LIMIT 20
    `

    // Also fetch any direct booking requests
    const bookingRequests = await sql`
      SELECT 
        id,
        requester_name as client_name,
        requester_email as client_email,
        event_name as event_title,
        event_date,
        location as event_location,
        event_type,
        budget_range as event_budget,
        message as notes,
        created_at,
        'booking_request' as type
      FROM booking_requests
      WHERE speaker_name = ${speakerInfo.name}
      ORDER BY created_at DESC
      LIMIT 10
    `

    // Combine and sort all inquiries
    const allInquiries = [
      ...inquiries.map(i => ({ ...i, type: 'inquiry' })),
      ...bookingRequests
    ].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      inquiries: allInquiries
    })
  } catch (error) {
    console.error('Error fetching speaker inquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
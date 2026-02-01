import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify and decode token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const speakerId = decoded.speakerId
    const currentDate = new Date().toISOString().split('T')[0]
    
    // Fetch requests (deals in proposal/negotiation stage for this speaker)
    const requests = await sql`
      SELECT 
        d.id,
        d.client_name,
        d.company,
        d.event_title,
        d.event_date,
        d.event_location,
        d.event_type,
        d.attendee_count,
        d.budget_range,
        d.deal_value,
        d.status,
        d.priority,
        d.notes as admin_message,
        d.created_at
      FROM deals d
      WHERE d.speaker_requested = (SELECT name FROM speakers WHERE id = ${speakerId})
        AND d.status IN ('proposal', 'negotiation', 'qualified')
      ORDER BY d.event_date ASC
    `
    
    // Fetch upcoming engagements (won deals with future dates)
    const upcoming = await sql`
      SELECT 
        d.id,
        d.client_name,
        d.company,
        d.event_title,
        d.event_date,
        d.event_location,
        d.event_type,
        d.attendee_count,
        d.budget_range,
        d.deal_value,
        d.notes as admin_message,
        d.created_at,
        se.speaker_fee,
        se.id as engagement_id
      FROM deals d
      LEFT JOIN speaker_engagements se ON se.deal_id = d.id AND se.speaker_id = ${speakerId}
      WHERE d.speaker_requested = (SELECT name FROM speakers WHERE id = ${speakerId})
        AND d.status = 'won'
        AND d.event_date >= ${currentDate}
      ORDER BY d.event_date ASC
    `
    
    // Fetch past events (won deals with past dates)
    const past = await sql`
      SELECT 
        d.id,
        d.client_name,
        d.company,
        d.event_title,
        d.event_date,
        d.event_location,
        d.event_type,
        d.attendee_count,
        d.budget_range,
        d.deal_value,
        d.notes as admin_message,
        d.created_at,
        se.speaker_fee,
        se.client_feedback,
        se.id as engagement_id
      FROM deals d
      LEFT JOIN speaker_engagements se ON se.deal_id = d.id AND se.speaker_id = ${speakerId}
      WHERE d.speaker_requested = (SELECT name FROM speakers WHERE id = ${speakerId})
        AND d.status = 'won'
        AND d.event_date < ${currentDate}
      ORDER BY d.event_date DESC
    `
    
    // Calculate statistics
    const totalRequests = requests.length
    const totalUpcoming = upcoming.length
    const totalPast = past.length
    const totalRevenue = [...upcoming, ...past].reduce((sum, event) => {
      return sum + (parseFloat(event.speaker_fee || event.deal_value || '0'))
    }, 0)
    
    return NextResponse.json({ 
      success: true,
      requests: requests.map(req => ({
        ...req,
        type: 'request',
        needs_response: req.status === 'proposal'
      })),
      upcoming: upcoming.map(event => ({
        ...event,
        type: 'upcoming'
      })),
      past: past.map(event => ({
        ...event,
        type: 'past'
      })),
      stats: {
        totalRequests,
        totalUpcoming,
        totalPast,
        totalRevenue,
        avgDealValue: totalRequests > 0 ? totalRevenue / (totalUpcoming + totalPast) : 0
      }
    })

  } catch (error) {
    console.error('Error fetching speaker engagements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engagements' },
      { status: 500 }
    )
  }
}

// Handle accepting/declining requests
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify and decode token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const speakerId = decoded.speakerId
    const { dealId, action, negotiationNotes } = await request.json()
    
    if (!dealId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Verify this deal is for this speaker
    const deals = await sql`
      SELECT id, speaker_requested 
      FROM deals 
      WHERE id = ${dealId}
    `
    
    if (deals.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }
    
    const speakerName = await sql`
      SELECT name FROM speakers WHERE id = ${speakerId}
    `
    
    if (deals[0].speaker_requested !== speakerName[0]?.name) {
      return NextResponse.json({ error: 'Unauthorized for this deal' }, { status: 403 })
    }
    
    // Update deal status based on action
    let newStatus = ''
    if (action === 'accept') {
      newStatus = 'negotiation'
    } else if (action === 'decline') {
      newStatus = 'lost'
    } else if (action === 'negotiate') {
      newStatus = 'negotiation'
    }
    
    if (newStatus) {
      // Update the deal status
      const updateNotes = negotiationNotes 
        ? sql`notes = notes || E'\n\n[Speaker Response]: ' || ${negotiationNotes}`
        : sql`notes = notes`
        
      await sql`
        UPDATE deals 
        SET 
          status = ${newStatus},
          ${updateNotes},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${dealId}
      `
      
      // If accepted, create speaker_engagement record
      if (action === 'accept' && newStatus === 'negotiation') {
        const dealInfo = await sql`
          SELECT * FROM deals WHERE id = ${dealId}
        `
        
        if (dealInfo.length > 0) {
          const deal = dealInfo[0]
          
          // Check if engagement already exists
          const existing = await sql`
            SELECT id FROM speaker_engagements 
            WHERE speaker_id = ${speakerId} AND deal_id = ${dealId}
          `
          
          if (existing.length === 0) {
            await sql`
              INSERT INTO speaker_engagements (
                speaker_id,
                deal_id,
                event_name,
                event_date,
                client_company,
                event_type,
                location,
                attendee_count,
                speaker_fee
              ) VALUES (
                ${speakerId},
                ${dealId},
                ${deal.event_title},
                ${deal.event_date},
                ${deal.company},
                ${deal.event_type},
                ${deal.event_location},
                ${deal.attendee_count},
                ${deal.deal_value}
              )
            `
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Request ${action}ed successfully`
    })

  } catch (error) {
    console.error('Error updating engagement:', error)
    return NextResponse.json(
      { error: 'Failed to update engagement' },
      { status: 500 }
    )
  }
}
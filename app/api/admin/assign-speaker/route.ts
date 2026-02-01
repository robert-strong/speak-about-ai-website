import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const { type, id, speaker_id } = body

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID are required' }, { status: 400 })
    }

    if (type === 'deal') {
      // Update deal with speaker_id
      await sql`
        UPDATE deals 
        SET speaker_id = ${speaker_id || null},
            updated_at = NOW()
        WHERE id = ${id}
      `
      
      console.log(`Assigned speaker ${speaker_id} to deal ${id}`)
      
      return NextResponse.json({ 
        success: true, 
        message: `Speaker ${speaker_id ? 'assigned' : 'unassigned'} successfully` 
      })
      
    } else if (type === 'project') {
      // Update project with speaker_id
      await sql`
        UPDATE projects 
        SET speaker_id = ${speaker_id || null},
            updated_at = NOW()
        WHERE id = ${id}
      `
      
      console.log(`Assigned speaker ${speaker_id} to project ${id}`)
      
      return NextResponse.json({ 
        success: true, 
        message: `Speaker ${speaker_id ? 'assigned' : 'unassigned'} successfully` 
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid type. Must be "deal" or "project"' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error assigning speaker:', error)
    return NextResponse.json({ 
      error: 'Failed to assign speaker',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const speaker_id = searchParams.get('speaker_id')
    
    if (!speaker_id) {
      return NextResponse.json({ error: 'Speaker ID is required' }, { status: 400 })
    }
    
    let result = {
      deals: [] as any[],
      projects: [] as any[]
    }
    
    // Get deals for speaker
    if (!type || type === 'deals') {
      const deals = await sql`
        SELECT 
          d.id,
          d.client_name,
          d.company,
          d.event_title,
          d.event_date,
          d.deal_value,
          d.status,
          d.commission_percentage,
          d.commission_amount,
          d.payment_status
        FROM deals d
        WHERE d.speaker_id = ${speaker_id}
        ORDER BY d.event_date DESC
      `
      result.deals = deals
    }
    
    // Get projects for speaker
    if (!type || type === 'projects') {
      const projects = await sql`
        SELECT 
          p.id,
          p.project_name,
          p.client_name,
          p.company,
          p.event_date,
          p.event_location,
          p.status,
          p.speaker_fee,
          p.budget
        FROM projects p
        WHERE p.speaker_id = ${speaker_id}
        ORDER BY p.event_date DESC
      `
      result.projects = projects
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error fetching speaker assignments:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch speaker assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
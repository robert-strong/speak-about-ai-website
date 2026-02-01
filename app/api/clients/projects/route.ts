import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'

const sql = neon(process.env.DATABASE_URL!)

// Helper to verify client token
function verifyClientToken(request: NextRequest): { clientId: number; email: string } | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    if (decoded.type !== 'client' || !decoded.clientId) {
      return null
    }
    return { clientId: decoded.clientId, email: decoded.email }
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = verifyClientToken(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client info to match by email if client_id isn't set
    const clientInfo = await sql`
      SELECT id, email FROM clients WHERE id = ${auth.clientId}
    `

    if (clientInfo.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const clientEmail = clientInfo[0].email

    // Fetch projects linked to this client (by client_id OR email match)
    const projects = await sql`
      SELECT
        p.id,
        p.project_name,
        p.description,
        p.status,
        p.priority,
        p.start_date,
        p.end_date,
        p.deadline,
        p.budget,
        p.completion_percentage,
        p.event_name,
        p.event_date,
        p.event_location,
        p.event_type,
        p.requested_speaker_name,
        p.program_topic,
        p.program_type,
        p.audience_size,
        p.created_at,
        p.updated_at,
        s.name as speaker_name,
        s.headshot_url as speaker_headshot
      FROM projects p
      LEFT JOIN speakers s ON p.speaker_id = s.id
      WHERE p.client_id = ${auth.clientId}
         OR LOWER(p.client_email) = ${clientEmail.toLowerCase()}
      ORDER BY p.event_date DESC NULLS LAST, p.created_at DESC
    `

    // Get summary stats
    const stats = {
      total: projects.length,
      in_progress: projects.filter((p: any) => p.status === 'in_progress').length,
      completed: projects.filter((p: any) => p.status === 'completed').length,
      planning: projects.filter((p: any) => p.status === 'planning').length
    }

    return NextResponse.json({
      success: true,
      projects,
      stats
    })

  } catch (error) {
    console.error('Error fetching client projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

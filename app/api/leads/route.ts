import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const leads = await sql`
      SELECT
        l.*,
        kc.picture_url,
        kc.conversation_status,
        kc.latest_message,
        COALESCE(
          (SELECT COUNT(*) FROM tasks t WHERE t.lead_id = l.id AND t.status = 'pending'),
          0
        ) as pending_tasks_count,
        COALESCE(
          (SELECT COUNT(*) FROM tasks t WHERE t.lead_id = l.id AND t.status = 'pending' AND t.due_date < NOW()),
          0
        ) as overdue_tasks_count,
        COALESCE(
          (SELECT COUNT(*) FROM email_threads e WHERE e.lead_id = l.id),
          0
        ) as email_thread_count
      FROM leads l
      LEFT JOIN kondo_contacts kc ON l.kondo_contact_id = kc.id
      ORDER BY
        CASE
          WHEN l.priority = 'high' THEN 1
          WHEN l.priority = 'medium' THEN 2
          WHEN l.priority = 'low' THEN 3
        END,
        l.next_follow_up_date ASC NULLS LAST,
        l.created_at DESC
    `

    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const { id, status, priority, notes, next_follow_up_date } = body

    await sql`
      UPDATE leads
      SET
        status = COALESCE(${status}, status),
        priority = COALESCE(${priority}, priority),
        notes = COALESCE(${notes}, notes),
        next_follow_up_date = COALESCE(${next_follow_up_date}, next_follow_up_date),
        updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

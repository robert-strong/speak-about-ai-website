import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const relatedToType = searchParams.get('related_to_type')
    const leadId = searchParams.get('lead_id')
    const dealId = searchParams.get('deal_id')

    // Build query based on filters
    let tasks

    if (leadId) {
      tasks = await sql`
        SELECT
          t.*,
          l.name as lead_name,
          l.email as lead_email,
          l.company as lead_company
        FROM tasks t
        LEFT JOIN leads l ON t.lead_id = l.id
        WHERE t.lead_id = ${leadId}
        ORDER BY
          CASE WHEN t.status = 'pending' THEN 1 ELSE 2 END,
          t.due_date ASC NULLS LAST,
          t.created_at DESC
      `
    } else if (dealId) {
      tasks = await sql`
        SELECT
          t.*,
          d.client_name as deal_client_name,
          d.event_title as deal_event_title
        FROM tasks t
        LEFT JOIN deals d ON t.deal_id = d.id
        WHERE t.deal_id = ${dealId}
        ORDER BY
          CASE WHEN t.status = 'pending' THEN 1 ELSE 2 END,
          t.due_date ASC NULLS LAST,
          t.created_at DESC
      `
    } else {
      // Get all tasks with related info
      tasks = await sql`
        SELECT
          t.*,
          l.name as lead_name,
          l.email as lead_email,
          l.company as lead_company,
          d.client_name as deal_client_name,
          d.event_title as deal_event_title
        FROM tasks t
        LEFT JOIN leads l ON t.lead_id = l.id
        LEFT JOIN deals d ON t.deal_id = d.id
        WHERE
          (${status}::text IS NULL OR t.status = ${status})
          AND (${relatedToType}::text IS NULL OR t.related_to_type = ${relatedToType})
        ORDER BY
          CASE
            WHEN t.priority = 'high' THEN 1
            WHEN t.priority = 'medium' THEN 2
            WHEN t.priority = 'low' THEN 3
          END,
          CASE WHEN t.status = 'pending' THEN 1 ELSE 2 END,
          t.due_date ASC NULLS LAST,
          t.created_at DESC
      `
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const {
      title,
      description,
      due_date,
      related_to_type,
      lead_id,
      deal_id,
      task_type,
      priority,
      notes
    } = body

    const result = await sql`
      INSERT INTO tasks (
        title,
        description,
        due_date,
        related_to_type,
        lead_id,
        deal_id,
        task_type,
        priority,
        notes,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${title},
        ${description || null},
        ${due_date || null},
        ${related_to_type || null},
        ${lead_id || null},
        ${deal_id || null},
        ${task_type},
        ${priority || 'medium'},
        ${notes || null},
        'pending',
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({ task: result[0], success: true })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const { id, title, description, due_date, status, priority, notes } = body

    // If marking as completed, set completed_at
    const completedAt = status === 'completed' ? new Date() : null

    const result = await sql`
      UPDATE tasks
      SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        due_date = COALESCE(${due_date}, due_date),
        status = COALESCE(${status}, status),
        priority = COALESCE(${priority}, priority),
        notes = COALESCE(${notes}, notes),
        completed_at = COALESCE(${completedAt}, completed_at),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ task: result[0], success: true })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    await sql`DELETE FROM tasks WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = parseInt(id)
    
    const tasks = await sql`
      SELECT * FROM project_tasks 
      WHERE project_id = ${projectId}
      ORDER BY 
        CASE priority 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        created_at DESC
    `

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching project tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = parseInt(id)
    const { tasks } = await request.json()

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks provided' },
        { status: 400 }
      )
    }

    // First, check for existing tasks to avoid duplicates
    const existingTasks = await sql`
      SELECT task_name, category 
      FROM project_tasks 
      WHERE project_id = ${projectId} 
        AND created_from = 'generated'
        AND completed = false
    `

    const existingTaskNames = new Set(
      existingTasks.map(t => `${t.task_name}-${t.category}`)
    )

    // Filter out tasks that already exist
    const newTasks = tasks.filter(task => 
      !existingTaskNames.has(`${task.name}-${task.category}`)
    )

    if (newTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All tasks already exist',
        tasks: [],
        count: 0,
        skipped: tasks.length
      })
    }

    // Insert only new tasks
    const insertedTasks = []
    for (const task of newTasks) {
      // Store requirements and deliverables as JSON in notes field
      const taskDetails = {
        requirements: task.requirements || [],
        deliverables: task.deliverables || []
      }
      
      const result = await sql`
        INSERT INTO project_tasks (
          project_id,
          task_name,
          description,
          category,
          priority,
          stage,
          created_from,
          status,
          notes
        ) VALUES (
          ${projectId},
          ${task.name},
          ${task.description},
          ${task.category},
          ${task.priority || 'medium'},
          ${task.stage || 'logistics_planning'},
          'generated',
          'pending',
          ${JSON.stringify(taskDetails)}
        )
        RETURNING *
      `
      insertedTasks.push(result[0])
    }

    return NextResponse.json({
      success: true,
      tasks: insertedTasks,
      count: insertedTasks.length,
      skipped: tasks.length - newTasks.length
    })
  } catch (error) {
    console.error('Error creating project tasks:', error)
    return NextResponse.json(
      { error: 'Failed to create tasks' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { taskId, completed, status } = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID required' },
        { status: 400 }
      )
    }

    const updates = []
    const values = []
    let paramCount = 1

    if (completed !== undefined) {
      updates.push(`completed = $${paramCount}`)
      values.push(completed)
      paramCount++
      
      if (completed) {
        updates.push(`completed_at = $${paramCount}`)
        values.push(new Date())
        paramCount++
      }
    }

    if (status) {
      updates.push(`status = $${paramCount}`)
      values.push(status)
      paramCount++
    }

    values.push(taskId)

    const query = `
      UPDATE project_tasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await sql(query, values)

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
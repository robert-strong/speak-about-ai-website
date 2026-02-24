import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// GET /api/projects/tasks-bulk — fetch all project tasks in a single query
export async function GET() {
  try {
    const tasks = await sql`
      SELECT * FROM project_tasks
      ORDER BY
        project_id,
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
    console.error('Error fetching all project tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

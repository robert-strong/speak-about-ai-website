import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

interface Task {
  id: number
  title: string
  description: string | null
  status: 'pending' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  due_date: string | null
  project_id: number | null
  deal_id: number | null
  project_name?: string
  client_name?: string
  event_date?: string
}

interface Project {
  id: number
  project_name: string
  client_name: string
  status: string
  event_date: string | null
  deadline: string | null
  pending_tasks: number
  overdue_tasks: number
  completed_tasks: number
  total_tasks: number
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (skip in development for manual testing)
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Get active projects (not completed or archived)
    const projects = await sql`
      SELECT
        p.id,
        p.project_name,
        p.client_name,
        p.status,
        p.event_date,
        p.deadline,
        COUNT(CASE WHEN pt.status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN pt.status = 'pending' AND pt.due_date < NOW() THEN 1 END) as overdue_tasks,
        COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(pt.id) as total_tasks
      FROM projects p
      LEFT JOIN project_tasks pt ON p.id = pt.project_id
      WHERE p.status NOT IN ('completed', 'archived', 'cancelled')
      GROUP BY p.id, p.project_name, p.client_name, p.status, p.event_date, p.deadline
      HAVING COUNT(CASE WHEN pt.status = 'pending' THEN 1 END) > 0
      ORDER BY p.event_date ASC NULLS LAST
    ` as Project[]

    // Get all pending and overdue tasks for active projects
    const tasks = await sql`
      SELECT
        pt.id,
        pt.title,
        pt.description,
        pt.status,
        pt.priority,
        pt.due_date,
        pt.project_id,
        p.project_name,
        p.client_name,
        p.event_date
      FROM project_tasks pt
      INNER JOIN projects p ON pt.project_id = p.id
      WHERE pt.status = 'pending'
        AND p.status NOT IN ('completed', 'archived', 'cancelled')
      ORDER BY
        CASE WHEN pt.due_date < NOW() THEN 0 ELSE 1 END,
        pt.priority = 'high' DESC,
        pt.due_date ASC NULLS LAST
    ` as Task[]

    // Group tasks by project
    const tasksByProject = tasks.reduce((acc, task) => {
      if (!acc[task.project_id!]) {
        acc[task.project_id!] = []
      }
      acc[task.project_id!].push(task)
      return acc
    }, {} as Record<number, Task[]>)

    // Send email roundup
    const emailHtml = generateWeeklyRoundupEmail(projects, tasksByProject)

    // Send email using Resend
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@speakabout.ai'

    await resend.emails.send({
      from: fromEmail,
      to: 'noah@speakabout.ai',
      subject: `Weekly Task Roundup - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      html: emailHtml
    })

    return NextResponse.json({
      success: true,
      projectsCount: projects.length,
      tasksCount: tasks.length,
      overdueTasksCount: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length
    })
  } catch (error) {
    console.error('Error generating weekly task roundup:', error)
    return NextResponse.json(
      { error: 'Failed to generate weekly task roundup' },
      { status: 500 }
    )
  }
}

function generateWeeklyRoundupEmail(projects: Project[], tasksByProject: Record<number, Task[]>): string {
  const totalPendingTasks = projects.reduce((sum, p) => sum + (p.pending_tasks || 0), 0)
  const totalOverdueTasks = projects.reduce((sum, p) => sum + (p.overdue_tasks || 0), 0)
  const totalCompletedTasks = projects.reduce((sum, p) => sum + (p.completed_tasks || 0), 0)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Task Roundup</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 3px solid #1E68C6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #1E68C6;
      font-size: 28px;
    }
    .header .date {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 6px;
    }
    .summary-item {
      flex: 1;
      text-align: center;
    }
    .summary-item .number {
      font-size: 32px;
      font-weight: bold;
      color: #1E68C6;
    }
    .summary-item .overdue {
      color: #dc3545;
    }
    .summary-item .completed {
      color: #28a745;
    }
    .summary-item .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-top: 5px;
    }
    .project {
      margin-bottom: 30px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
    .project-header {
      background-color: #1E68C6;
      color: white;
      padding: 15px 20px;
    }
    .project-header h2 {
      margin: 0;
      font-size: 20px;
    }
    .project-header .client {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 3px;
    }
    .project-header .meta {
      font-size: 12px;
      opacity: 0.8;
      margin-top: 8px;
    }
    .project-stats {
      display: flex;
      gap: 15px;
      padding: 12px 20px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      font-size: 13px;
    }
    .stat {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .stat .badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 12px;
    }
    .badge-overdue {
      background-color: #dc3545;
      color: white;
    }
    .badge-pending {
      background-color: #ffc107;
      color: #000;
    }
    .badge-completed {
      background-color: #28a745;
      color: white;
    }
    .tasks {
      padding: 0;
    }
    .task {
      padding: 15px 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    .task:last-child {
      border-bottom: none;
    }
    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 5px;
    }
    .task-title {
      font-weight: 600;
      font-size: 15px;
      color: #333;
    }
    .task-priority {
      padding: 3px 10px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .priority-high {
      background-color: #dc3545;
      color: white;
    }
    .priority-medium {
      background-color: #ffc107;
      color: #000;
    }
    .priority-low {
      background-color: #6c757d;
      color: white;
    }
    .task-description {
      font-size: 13px;
      color: #666;
      margin-top: 5px;
    }
    .task-due {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
    }
    .task-due.overdue {
      color: #dc3545;
      font-weight: 600;
    }
    .no-tasks {
      padding: 30px;
      text-align: center;
      color: #999;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Weekly Task Roundup</h1>
      <div class="date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <div class="summary">
      <div class="summary-item">
        <div class="number">${projects.length}</div>
        <div class="label">Active Projects</div>
      </div>
      <div class="summary-item">
        <div class="number overdue">${totalOverdueTasks}</div>
        <div class="label">Overdue Tasks</div>
      </div>
      <div class="summary-item">
        <div class="number">${totalPendingTasks}</div>
        <div class="label">Pending Tasks</div>
      </div>
      <div class="summary-item">
        <div class="number completed">${totalCompletedTasks}</div>
        <div class="label">Completed This Week</div>
      </div>
    </div>

    ${projects.length === 0 ? `
      <div class="no-tasks">
        <p>🎉 No active projects with pending tasks!</p>
      </div>
    ` : projects.map(project => {
      const projectTasks = tasksByProject[project.id] || []
      const overdueTasks = projectTasks.filter(t => t.due_date && new Date(t.due_date) < new Date())

      return `
        <div class="project">
          <div class="project-header">
            <h2>${project.project_name}</h2>
            <div class="client">Client: ${project.client_name}</div>
            <div class="meta">
              Status: ${project.status}
              ${project.event_date ? ` • Event: ${new Date(project.event_date).toLocaleDateString()}` : ''}
            </div>
          </div>

          <div class="project-stats">
            ${project.overdue_tasks > 0 ? `
              <div class="stat">
                <span class="badge badge-overdue">${project.overdue_tasks} Overdue</span>
              </div>
            ` : ''}
            <div class="stat">
              <span class="badge badge-pending">${project.pending_tasks} Pending</span>
            </div>
            <div class="stat">
              <span class="badge badge-completed">${project.completed_tasks} Completed</span>
            </div>
          </div>

          <div class="tasks">
            ${projectTasks.length === 0 ? `
              <div class="no-tasks">No pending tasks</div>
            ` : projectTasks.map(task => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date()
              const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'

              return `
                <div class="task">
                  <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-priority priority-${task.priority}">${task.priority}</div>
                  </div>
                  ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                  <div class="task-due ${isOverdue ? 'overdue' : ''}">
                    ${isOverdue ? '⚠️ Overdue: ' : 'Due: '}${dueDate}
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </div>
      `
    }).join('')}

    <div class="footer">
      <p>This is an automated weekly roundup from Speak About AI</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

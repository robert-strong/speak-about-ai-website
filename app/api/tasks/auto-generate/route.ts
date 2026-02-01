import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const results = {
      leads: { checked: 0, tasksCreated: 0 },
      deals: { checked: 0, tasksCreated: 0 },
      projects: { checked: 0, tasksCreated: 0 }
    }

    // 1. AUTO-GENERATE TASKS FOR LEADS

    // Get leads with overdue follow-ups (no task exists yet)
    const overdueLeads = await sql`
      SELECT l.* FROM leads l
      WHERE l.next_follow_up_date < NOW()
      AND l.status != 'qualified'
      AND NOT EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.lead_id = l.id
        AND t.status = 'pending'
        AND t.task_type = 'follow_up'
      )
    `

    results.leads.checked = overdueLeads.length

    for (const lead of overdueLeads) {
      const daysSinceContact = lead.last_contact_date
        ? Math.floor((new Date() - new Date(lead.last_contact_date)) / (1000 * 60 * 60 * 24))
        : null

      await sql`
        INSERT INTO tasks (
          title,
          description,
          due_date,
          related_to_type,
          lead_id,
          task_type,
          priority,
          notes,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${`Follow up with ${lead.name}`},
          ${`Lead has not been contacted recently. Last contact: ${daysSinceContact ? daysSinceContact + ' days ago' : 'Unknown'}`},
          ${lead.next_follow_up_date},
          'lead',
          ${lead.id},
          'follow_up',
          ${daysSinceContact && daysSinceContact > 14 ? 'high' : 'medium'},
          ${`Original follow-up date: ${new Date(lead.next_follow_up_date).toLocaleDateString()}`},
          'pending',
          NOW(),
          NOW()
        )
      `
      results.leads.tasksCreated++
    }

    // Get leads without recent contact (7+ days, no follow-up scheduled)
    const staleLeads = await sql`
      SELECT l.* FROM leads l
      WHERE l.last_contact_date < NOW() - INTERVAL '7 days'
      AND (l.next_follow_up_date IS NULL OR l.next_follow_up_date > NOW())
      AND l.status IN ('new', 'contacted')
      AND NOT EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.lead_id = l.id
        AND t.status = 'pending'
        AND t.created_at > NOW() - INTERVAL '7 days'
      )
    `

    for (const lead of staleLeads) {
      const daysSinceContact = Math.floor((new Date() - new Date(lead.last_contact_date)) / (1000 * 60 * 60 * 24))

      await sql`
        INSERT INTO tasks (
          title,
          description,
          due_date,
          related_to_type,
          lead_id,
          task_type,
          priority,
          notes,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${`Check in with ${lead.name}`},
          ${`No contact in ${daysSinceContact} days. Time for a follow-up.`},
          ${new Date(Date.now() + 24 * 60 * 60 * 1000)},
          'lead',
          ${lead.id},
          'follow_up',
          ${daysSinceContact > 21 ? 'high' : 'medium'},
          ${`Last contact: ${new Date(lead.last_contact_date).toLocaleDateString()}`},
          'pending',
          NOW(),
          NOW()
        )
      `
      results.leads.tasksCreated++
    }

    // 2. AUTO-GENERATE TASKS FOR DEALS

    // Get deals in negotiation without recent activity
    const staleDeals = await sql`
      SELECT d.* FROM deals d
      WHERE d.status IN ('qualified', 'proposal', 'negotiation')
      AND d.last_contact < NOW() - INTERVAL '5 days'
      AND NOT EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.deal_id = d.id
        AND t.status = 'pending'
        AND t.created_at > NOW() - INTERVAL '5 days'
      )
    `

    results.deals.checked = staleDeals.length

    for (const deal of staleDeals) {
      const daysSinceContact = Math.floor((new Date() - new Date(deal.last_contact)) / (1000 * 60 * 60 * 24))
      const daysUntilEvent = deal.event_date
        ? Math.floor((new Date(deal.event_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null

      let priority = 'medium'
      if (daysUntilEvent && daysUntilEvent < 30) priority = 'high'
      if (daysUntilEvent && daysUntilEvent < 14) priority = 'high'
      if (daysSinceContact > 10) priority = 'high'

      await sql`
        INSERT INTO tasks (
          title,
          description,
          due_date,
          related_to_type,
          deal_id,
          task_type,
          priority,
          notes,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${`Follow up on ${deal.event_title}`},
          ${`Deal in ${deal.status} stage. No contact in ${daysSinceContact} days.${daysUntilEvent ? ` Event in ${daysUntilEvent} days.` : ''}`},
          ${new Date(Date.now() + 24 * 60 * 60 * 1000)},
          'deal',
          ${deal.id},
          ${deal.status === 'proposal' ? 'proposal' : 'follow_up'},
          ${priority},
          ${`Last contact: ${new Date(deal.last_contact).toLocaleDateString()}`},
          'pending',
          NOW(),
          NOW()
        )
      `
      results.deals.tasksCreated++
    }

    // Get deals with upcoming events (7-14 days out) without contract tasks
    const upcomingDeals = await sql`
      SELECT d.* FROM deals d
      WHERE d.status = 'won'
      AND d.event_date BETWEEN NOW() + INTERVAL '7 days' AND NOW() + INTERVAL '14 days'
      AND NOT EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.deal_id = d.id
        AND t.task_type IN ('contract', 'meeting')
        AND t.status = 'pending'
      )
    `

    for (const deal of upcomingDeals) {
      const daysUntilEvent = Math.floor((new Date(deal.event_date) - new Date()) / (1000 * 60 * 60 * 24))

      await sql`
        INSERT INTO tasks (
          title,
          description,
          due_date,
          related_to_type,
          deal_id,
          task_type,
          priority,
          notes,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${`Finalize details for ${deal.event_title}`},
          ${`Event is in ${daysUntilEvent} days. Ensure all logistics are confirmed.`},
          ${new Date(deal.event_date.getTime() - 3 * 24 * 60 * 60 * 1000)},
          'deal',
          ${deal.id},
          'meeting',
          'high',
          ${`Event date: ${new Date(deal.event_date).toLocaleDateString()}`},
          'pending',
          NOW(),
          NOW()
        )
      `
      results.deals.tasksCreated++
    }

    // 3. AUTO-GENERATE TASKS FOR PROJECTS

    // Get projects approaching event date without recent task activity
    const upcomingProjects = await sql`
      SELECT p.* FROM projects p
      WHERE p.event_date BETWEEN NOW() AND NOW() + INTERVAL '21 days'
      AND p.project_status NOT IN ('completed', 'cancelled')
      AND NOT EXISTS (
        SELECT 1 FROM project_tasks pt
        WHERE pt.project_id = p.id
        AND pt.completed = false
        AND pt.created_at > NOW() - INTERVAL '7 days'
      )
    `

    results.projects.checked = upcomingProjects.length

    for (const project of upcomingProjects) {
      const daysUntilEvent = Math.floor((new Date(project.event_date) - new Date()) / (1000 * 60 * 60 * 24))

      let taskType = 'other'
      let taskTitle = `Review ${project.project_name} status`
      let taskDescription = `Event in ${daysUntilEvent} days. Review project checklist.`

      if (daysUntilEvent <= 7) {
        taskType = 'meeting'
        taskTitle = `Final prep for ${project.project_name}`
        taskDescription = `Event is in ${daysUntilEvent} days. Final logistics check required.`
      } else if (daysUntilEvent <= 14) {
        taskType = 'follow_up'
        taskTitle = `Pre-event check-in for ${project.project_name}`
        taskDescription = `Event in ${daysUntilEvent} days. Confirm all details with client and speaker.`
      }

      // Create general task (not project_tasks, but regular tasks linked to the deal)
      if (project.deal_id) {
        await sql`
          INSERT INTO tasks (
            title,
            description,
            due_date,
            related_to_type,
            deal_id,
            task_type,
            priority,
            notes,
            status,
            created_at,
            updated_at
          ) VALUES (
            ${taskTitle},
            ${taskDescription},
            ${new Date(project.event_date.getTime() - daysUntilEvent * 24 * 60 * 60 * 1000 / 2)},
            'deal',
            ${project.deal_id},
            ${taskType},
            ${daysUntilEvent <= 7 ? 'high' : 'medium'},
            ${`Project: ${project.project_name} | Event: ${new Date(project.event_date).toLocaleDateString()}`},
            'pending',
            NOW(),
            NOW()
          )
        `
        results.projects.tasksCreated++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-generated tasks created successfully',
      results
    })

  } catch (error) {
    console.error('Error auto-generating tasks:', error)
    return NextResponse.json(
      { error: 'Failed to auto-generate tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

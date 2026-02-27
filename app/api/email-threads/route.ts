import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const dealId = searchParams.get('deal_id')
    const projectId = searchParams.get('project_id')

    if (!leadId && !dealId && !projectId) {
      return NextResponse.json(
        { error: 'lead_id, deal_id, or project_id is required' },
        { status: 400 }
      )
    }

    let threads
    if (projectId) {
      // Look up the project's deal_id and client_email
      const projects = await sql`
        SELECT deal_id, client_email FROM projects WHERE id = ${projectId}
      `
      if (projects.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      const project = projects[0]
      const projectDealId = project.deal_id
      const clientEmail = project.client_email

      if (!projectDealId && !clientEmail) {
        // No deal or email to match on
        threads = []
      } else if (projectDealId && clientEmail) {
        threads = await sql`
          SELECT
            id, gmail_message_id, gmail_thread_id, subject,
            from_email, to_email, cc_emails, body_snippet, body_full,
            direction, is_read, received_at, labels, created_at
          FROM email_threads
          WHERE deal_id = ${projectDealId}
            OR from_email = ${clientEmail}
            OR to_email = ${clientEmail}
          ORDER BY received_at DESC
          LIMIT 50
        `
      } else if (projectDealId) {
        threads = await sql`
          SELECT
            id, gmail_message_id, gmail_thread_id, subject,
            from_email, to_email, cc_emails, body_snippet, body_full,
            direction, is_read, received_at, labels, created_at
          FROM email_threads
          WHERE deal_id = ${projectDealId}
          ORDER BY received_at DESC
          LIMIT 50
        `
      } else {
        threads = await sql`
          SELECT
            id, gmail_message_id, gmail_thread_id, subject,
            from_email, to_email, cc_emails, body_snippet, body_full,
            direction, is_read, received_at, labels, created_at
          FROM email_threads
          WHERE from_email = ${clientEmail}
            OR to_email = ${clientEmail}
          ORDER BY received_at DESC
          LIMIT 50
        `
      }
    } else if (leadId) {
      threads = await sql`
        SELECT
          id,
          gmail_message_id,
          gmail_thread_id,
          subject,
          from_email,
          to_email,
          cc_emails,
          body_snippet,
          body_full,
          direction,
          is_read,
          received_at,
          labels,
          created_at
        FROM email_threads
        WHERE lead_id = ${leadId}
        ORDER BY received_at DESC
        LIMIT 50
      `
    } else {
      threads = await sql`
        SELECT
          id,
          gmail_message_id,
          gmail_thread_id,
          subject,
          from_email,
          to_email,
          cc_emails,
          body_snippet,
          body_full,
          direction,
          is_read,
          received_at,
          labels,
          created_at
        FROM email_threads
        WHERE deal_id = ${dealId}
        ORDER BY received_at DESC
        LIMIT 50
      `
    }

    return NextResponse.json({
      success: true,
      threads,
      count: threads.length
    })
  } catch (error) {
    console.error('Error fetching email threads:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch email threads',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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
    let searchedDealId: any = null
    let searchedClientEmail: string | null = null
    let searchedTerms: string[] = []

    if (projectId) {
      // Look up the project's deal_id, client_email, and searchable fields
      const projects = await sql`
        SELECT deal_id, client_email, project_name, event_name, event_date, event_location, venue_name
        FROM projects WHERE id = ${projectId}
      `
      if (projects.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      const project = projects[0]
      const projectDealId = project.deal_id
      const clientEmail = project.client_email
      searchedDealId = projectDealId || null
      searchedClientEmail = clientEmail || null

      // Build text search keywords from project fields
      const searchTerms: string[] = []
      if (project.project_name) searchTerms.push(project.project_name)
      if (project.event_name && project.event_name !== project.project_name) searchTerms.push(project.event_name)
      if (project.event_location) searchTerms.push(project.event_location)
      if (project.venue_name) searchTerms.push(project.venue_name)

      // Format event_date for text matching (e.g. "March 15" or "2026-03-15")
      let dateSearchTerms: string[] = []
      if (project.event_date) {
        const d = new Date(project.event_date)
        if (!isNaN(d.getTime())) {
          const isoDate = d.toISOString().split('T')[0] // 2026-03-15
          const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) // March 15
          const shortMonthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) // Mar 15
          dateSearchTerms = [isoDate, monthDay, shortMonthDay]
        }
      }

      // Track search terms for UI display
      searchedTerms = [...searchTerms, ...dateSearchTerms]

      // Build the query with all matching criteria
      const hasEmailMatch = !!(projectDealId || clientEmail)
      const hasTextMatch = searchTerms.length > 0 || dateSearchTerms.length > 0

      if (!hasEmailMatch && !hasTextMatch) {
        threads = []
      } else {
        // Use a single query with OR conditions for all criteria
        // Escape regex special characters for PostgreSQL ~* operator
        const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const textPattern = searchTerms.length > 0
          ? searchTerms.map(escapeRegex).join('|')
          : null
        const datePattern = dateSearchTerms.length > 0
          ? dateSearchTerms.map(escapeRegex).join('|')
          : null

        threads = await sql`
          SELECT DISTINCT
            id, gmail_message_id, gmail_thread_id, subject,
            from_email, to_email, cc_emails, body_snippet, body_full,
            direction, is_read, received_at, labels, created_at
          FROM email_threads
          WHERE
            (${projectDealId}::int IS NOT NULL AND deal_id = ${projectDealId})
            OR (${clientEmail}::text IS NOT NULL AND (LOWER(from_email) = LOWER(${clientEmail}) OR LOWER(to_email) = LOWER(${clientEmail})))
            OR (${textPattern}::text IS NOT NULL AND (subject ~* ${textPattern} OR body_snippet ~* ${textPattern} OR body_full ~* ${textPattern}))
            OR (${datePattern}::text IS NOT NULL AND (subject ~* ${datePattern} OR body_snippet ~* ${datePattern}))
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
      count: threads.length,
      ...(projectId ? { searchedDealId, searchedClientEmail, searchedTerms } : {})
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

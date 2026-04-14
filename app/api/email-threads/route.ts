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
      // Only include terms that are specific enough (>4 chars) to avoid false matches
      const searchTerms: string[] = []
      if (project.project_name && project.project_name.length > 4) searchTerms.push(project.project_name)
      if (project.event_name && project.event_name !== project.project_name && project.event_name.length > 4) searchTerms.push(project.event_name)
      if (project.venue_name && project.venue_name.length > 4) searchTerms.push(project.venue_name)
      // Skip event_location — too generic (e.g. "LA", "NY", "Virtual")

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
        // Escape regex special characters for PostgreSQL ~* operator
        const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const textPattern = searchTerms.length > 0
          ? searchTerms.map(escapeRegex).join('|')
          : ''
        const datePattern = dateSearchTerms.length > 0
          ? dateSearchTerms.map(escapeRegex).join('|')
          : ''

        // Run separate targeted queries and merge results to avoid complex null-handling in SQL
        const resultSets: any[][] = []

        // Match by deal_id
        if (projectDealId) {
          const r = await sql`
            SELECT id, gmail_message_id, gmail_thread_id, subject, from_email, to_email, cc_emails, body_snippet, body_full, direction, is_read, received_at, labels, created_at
            FROM email_threads WHERE deal_id = ${projectDealId}
            ORDER BY received_at DESC LIMIT 50
          `
          resultSets.push(r)
        }

        // Match by client email
        if (clientEmail) {
          const r = await sql`
            SELECT id, gmail_message_id, gmail_thread_id, subject, from_email, to_email, cc_emails, body_snippet, body_full, direction, is_read, received_at, labels, created_at
            FROM email_threads WHERE LOWER(from_email) = LOWER(${clientEmail}) OR LOWER(to_email) = LOWER(${clientEmail})
            ORDER BY received_at DESC LIMIT 50
          `
          resultSets.push(r)
        }

        // Match by text keywords (project name, event name, venue) — subject only to reduce noise
        if (textPattern) {
          const r = await sql`
            SELECT id, gmail_message_id, gmail_thread_id, subject, from_email, to_email, cc_emails, body_snippet, body_full, direction, is_read, received_at, labels, created_at
            FROM email_threads WHERE subject ~* ${textPattern}
            ORDER BY received_at DESC LIMIT 50
          `
          resultSets.push(r)
        }

        // Merge and deduplicate by id, sort by received_at desc
        const seenIds = new Set<number>()
        const merged: any[] = []
        for (const rs of resultSets) {
          for (const row of rs) {
            if (!seenIds.has(row.id)) {
              seenIds.add(row.id)
              merged.push(row)
            }
          }
        }
        threads = merged.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime()).slice(0, 50)
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

    // Get diagnostics
    const totalCount = await sql`SELECT COUNT(*) as total FROM email_threads`
    const totalEmails = totalCount[0]?.total || 0

    // Debug: sample stored emails to verify what's in DB
    let debugInfo: any = undefined
    if (projectId && threads.length === 0) {
      const sample = await sql`
        SELECT id, from_email, to_email, subject, received_at
        FROM email_threads
        ORDER BY received_at DESC
        LIMIT 5
      `
      debugInfo = {
        sampleEmails: sample.map((e: any) => ({ from: e.from_email, to: e.to_email, subject: e.subject?.substring(0, 50), date: e.received_at })),
        totalEmails,
      }
      // Also check if client email exists anywhere
      if (searchedClientEmail) {
        const emailCheck = await sql`
          SELECT COUNT(*) as cnt FROM email_threads
          WHERE LOWER(from_email) = LOWER(${searchedClientEmail})
            OR LOWER(to_email) = LOWER(${searchedClientEmail})
        `
        debugInfo.clientEmailMatchCount = emailCheck[0]?.cnt || 0
      }
    }

    return NextResponse.json({
      success: true,
      threads,
      count: threads.length,
      totalEmails,
      ...(projectId ? { searchedDealId, searchedClientEmail, searchedTerms } : {}),
      ...(debugInfo ? { debugInfo } : {})
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

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    // Fetch project details
    const projects = await sql`
      SELECT project_name, client_name, client_email, company, event_date, event_type,
             event_location, venue_name, notes, requested_speaker_name,
             budget, speaker_fee, status, deal_id, event_name
      FROM projects WHERE id = ${projectId}
    `
    if (projects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    const project = projects[0]

    // Fetch related email threads using the same matching logic as email-threads route
    // 1. Match by client email (most reliable)
    // 2. Match by deal_id
    // 3. Match by project name / event name in subject
    const emailSets: any[][] = []

    if (project.client_email) {
      const r = await sql`
        SELECT subject, from_email, to_email, body_snippet, body_full, direction, received_at
        FROM email_threads
        WHERE LOWER(from_email) = LOWER(${project.client_email})
           OR LOWER(to_email) = LOWER(${project.client_email})
        ORDER BY received_at DESC LIMIT 30
      `
      emailSets.push(r)
    }

    if (project.deal_id) {
      const r = await sql`
        SELECT subject, from_email, to_email, body_snippet, body_full, direction, received_at
        FROM email_threads
        WHERE deal_id = ${project.deal_id}
        ORDER BY received_at DESC LIMIT 20
      `
      emailSets.push(r)
    }

    // Search by project/event name in subject line
    const nameTerms = [project.project_name, project.event_name].filter((t: string) => t && t.length > 4)
    if (nameTerms.length > 0) {
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = nameTerms.map(escapeRegex).join('|')
      const r = await sql`
        SELECT subject, from_email, to_email, body_snippet, body_full, direction, received_at
        FROM email_threads
        WHERE subject ~* ${pattern}
        ORDER BY received_at DESC LIMIT 20
      `
      emailSets.push(r)
    }

    // Deduplicate by received_at + from_email combo
    const seen = new Set<string>()
    const emails: any[] = []
    for (const set of emailSets) {
      for (const e of set) {
        const key = `${e.received_at}-${e.from_email}-${e.subject}`
        if (!seen.has(key)) {
          seen.add(key)
          emails.push(e)
        }
      }
    }
    emails.sort((a: any, b: any) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
    const topEmails = emails.slice(0, 25)

    // Build context for the AI
    const projectContext = [
      `Project: ${project.project_name}`,
      `Client: ${project.client_name}${project.company ? ` (${project.company})` : ''}`,
      `Event Date: ${project.event_date || 'TBD'}`,
      `Event Type: ${project.event_type || 'TBD'}`,
      project.event_location ? `Location: ${project.event_location}` : null,
      project.venue_name ? `Venue: ${project.venue_name}` : null,
      project.requested_speaker_name
        ? `Speaker: ${project.requested_speaker_name}`
        : null,
      project.status ? `Status: ${project.status}` : null,
    ].filter(Boolean).join('\n')

    const notesSection = project.notes ? `\nProject Notes:\n${project.notes}` : ''

    const emailSection = topEmails.length > 0
      ? '\n\nEmail Correspondence (most recent first):\n' + topEmails.map((e: any) => {
          const body = (e.body_full || e.body_snippet || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          const truncated = body.length > 2000 ? body.substring(0, 2000) + '...' : body
          return `---\nDate: ${e.received_at}\nFrom: ${e.from_email}\nTo: ${e.to_email}\nSubject: ${e.subject}\n${truncated}`
        }).join('\n')
      : ''

    const systemPrompt = `You are a concise business assistant summarizing project communications for a speaker booking agency (Speak About AI). Robert Strong is the CEO.

Produce a comprehensive but concise summary of this project based on the notes AND email correspondence. Cover:
- What the client is looking for (event goals, speaker requirements, topics)
- Key decisions made, proposals sent, negotiations, and current status
- Important logistics mentioned in emails (dates, times, venues, travel, A/V)
- Action items or next steps that are pending
- Any concerns, budget discussions, or timeline pressures

Rules:
- Write 4-8 short bullet points using "•" as the bullet character
- Each bullet should be one concise, informative sentence
- Use people's first names when referencing individuals
- Prioritize the most recent and actionable information
- Include specific details from emails (names, dates, dollar amounts, decisions)
- Do NOT include generic pleasantries, email signatures, or newsletter content
- Do NOT repeat basic project details (event date, client name) unless adding new context
- Ignore any emails that are clearly unrelated to this specific project/event
- Return ONLY the bullet points, no headers or extra formatting`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Summarize this project:\n\n${projectContext}${notesSection}${emailSection}`
          }
        ]
      })
    })

    if (!response.ok) {
      const errData = await response.json()
      return NextResponse.json({ error: errData.error?.message || 'AI request failed' }, { status: 500 })
    }

    const result = await response.json()
    const summary = result.content?.[0]?.text || ''

    return NextResponse.json({ success: true, summary })
  } catch (error: any) {
    console.error('Error generating AI summary:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate summary' }, { status: 500 })
  }
}

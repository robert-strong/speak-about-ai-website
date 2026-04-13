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
      SELECT project_name, client_name, company, event_date, event_type,
             event_location, venue_name, notes, requested_speaker_name,
             budget, speaker_fee, status
      FROM projects WHERE id = ${projectId}
    `
    if (projects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    const project = projects[0]

    // Fetch related email threads
    const emails = await sql`
      SELECT subject, from_email, to_email, body_snippet, body_full, direction, received_at
      FROM email_threads
      WHERE project_id = ${projectId}
         OR (${project.client_name || ''} != '' AND (
           from_email ILIKE '%' || ${project.client_name || ''} || '%'
           OR to_email ILIKE '%' || ${project.client_name || ''} || '%'
         ))
      ORDER BY received_at DESC
      LIMIT 20
    `

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

    const emailSection = emails.length > 0
      ? '\n\nEmail Correspondence (most recent first):\n' + emails.map((e: any) => {
          const body = (e.body_full || e.body_snippet || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          const truncated = body.length > 1500 ? body.substring(0, 1500) + '...' : body
          return `---\nDate: ${e.received_at}\nFrom: ${e.from_email}\nTo: ${e.to_email}\nSubject: ${e.subject}\n${truncated}`
        }).join('\n')
      : ''

    const systemPrompt = `You are a concise business assistant summarizing project communications for a speaker booking agency (Speak About AI).

Produce a brief, actionable summary of what's happening with this project based on the notes and email correspondence. Focus on:
- Key decisions, requests, or action items from the emails
- Important logistics (dates, times, locations, arrival details)
- Current status of negotiations or planning

Rules:
- Write 3-6 short bullet points using "•" as the bullet character
- Each bullet should be one concise sentence
- Use people's first names when referencing individuals
- Focus on the most recent and relevant information
- Do NOT include generic pleasantries or email signatures
- Do NOT repeat information already visible in the project details (like event date or client name) unless adding new context about them
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
        max_tokens: 512,
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

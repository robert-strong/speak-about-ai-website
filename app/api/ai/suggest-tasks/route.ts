import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// POST /api/ai/suggest-tasks — suggest actionable tasks for a project based on
// its matched email correspondence (and notes). Returns structured suggestions
// the user can one-click add (each with an optional due date for the calendar).
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

    // Fetch related email threads using the same matching logic as the
    // email-threads / summarize-notes routes:
    //   1. Match by client email (most reliable)
    //   2. Match by deal_id
    //   3. Match by project name / event name in subject
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

    // Deduplicate by received_at + from_email + subject
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

    if (topEmails.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'No matched email correspondence found for this project. Sync emails or add a client email to enable suggestions.',
      })
    }

    // Build context for the AI
    const today = new Date().toISOString().split('T')[0]

    const projectContext = [
      `Project: ${project.project_name}`,
      `Client: ${project.client_name}${project.company ? ` (${project.company})` : ''}`,
      `Event Date: ${project.event_date ? String(project.event_date).split('T')[0] : 'TBD'}`,
      `Event Type: ${project.event_type || 'TBD'}`,
      project.event_location ? `Location: ${project.event_location}` : null,
      project.venue_name ? `Venue: ${project.venue_name}` : null,
      project.requested_speaker_name ? `Speaker: ${project.requested_speaker_name}` : null,
      project.status ? `Status: ${project.status}` : null,
    ].filter(Boolean).join('\n')

    const notesSection = project.notes ? `\nProject Notes:\n${project.notes}` : ''

    const emailSection = '\n\nEmail Correspondence (most recent first):\n' + topEmails.map((e: any) => {
      const body = (e.body_full || e.body_snippet || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const truncated = body.length > 2000 ? body.substring(0, 2000) + '...' : body
      return `---\nDate: ${e.received_at}\nDirection: ${e.direction}\nFrom: ${e.from_email}\nTo: ${e.to_email}\nSubject: ${e.subject}\n${truncated}`
    }).join('\n')

    const systemPrompt = `You are an operations assistant for Speak About AI, a speaker booking agency. Robert Strong is the CEO. You read a project's email correspondence and propose concrete, actionable to-do tasks the team should complete to move this booking forward.

Today's date is ${today}.

Base every suggestion on something specific in the emails — a commitment made, a question awaiting an answer, a deadline mentioned, missing information, a logistics detail to confirm, a document to send, or a follow-up that is overdue. Do NOT invent generic workflow tasks that aren't grounded in the correspondence.

For each task provide:
- "name": a short imperative task title (max ~8 words, e.g. "Send signed contract to client")
- "rationale": one sentence citing what in the email prompted this (mention the person and roughly when)
- "due_date": an ISO date (YYYY-MM-DD) if the emails imply a deadline or it's time-sensitive; otherwise null. Never pick a date in the past relative to today (${today}).
- "priority": "high", "medium", or "low"

Rules:
- Propose between 1 and 6 tasks. Quality over quantity — only real, useful next actions.
- If the emails clearly show nothing is pending, return an empty array.
- Use people's first names.
- Return ONLY valid JSON in exactly this shape, with no markdown, no code fences, and no commentary:
{"suggestions": [{"name": "...", "rationale": "...", "due_date": "YYYY-MM-DD" or null, "priority": "high|medium|low"}]}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Suggest tasks for this project based on the email correspondence:\n\n${projectContext}${notesSection}${emailSection}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errData.error?.message || 'AI request failed' }, { status: 500 })
    }

    const result = await response.json()
    const text = result.content?.[0]?.text || ''

    // Parse the JSON the model returned (tolerate stray prose / code fences)
    let suggestions: any[] = []
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text)
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    } catch (e) {
      console.error('Failed to parse AI task suggestions:', text)
      return NextResponse.json(
        { error: 'Could not parse AI suggestions. Please try again.' },
        { status: 502 }
      )
    }

    // Sanitize: keep only valid shapes, clamp priority, drop past due dates
    const validPriorities = new Set(['high', 'medium', 'low'])
    const cleaned = suggestions
      .filter((s) => s && typeof s.name === 'string' && s.name.trim())
      .slice(0, 6)
      .map((s) => {
        let due = typeof s.due_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.due_date) ? s.due_date : null
        if (due && due < today) due = null
        return {
          name: String(s.name).trim().slice(0, 200),
          rationale: typeof s.rationale === 'string' ? s.rationale.trim().slice(0, 400) : '',
          due_date: due,
          priority: validPriorities.has(s.priority) ? s.priority : 'medium',
        }
      })

    return NextResponse.json({
      success: true,
      suggestions: cleaned,
      emailsAnalyzed: topEmails.length,
    })
  } catch (error: any) {
    console.error('Error generating task suggestions:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate suggestions' }, { status: 500 })
  }
}

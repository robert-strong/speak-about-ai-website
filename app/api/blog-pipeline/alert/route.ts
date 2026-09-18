import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { sendSlackWebhook } from '@/lib/slack'
import { getAdminEmails } from '@/lib/admin-emails'

/**
 * POST /api/blog-pipeline/alert
 *
 * Lets the GitHub Actions blog pipeline (check_credentials.py in the Blog
 * repo) email the site admins when one of its secrets stops working, so a
 * stale token is noticed the week it dies rather than on the next publish.
 *
 * Auth: Bearer BLOG_PIPELINE_API_KEY, same as the other blog-pipeline routes.
 */

interface AlertFailure {
  name: string
  detail: string
  fix?: string
  fatal?: boolean
}

interface AlertPayload {
  subject?: string
  source?: string
  run_url?: string
  failures?: AlertFailure[]
  message?: string
}

function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.substring(7)
  const expectedKey = process.env.BLOG_PIPELINE_API_KEY
  if (!expectedKey) {
    console.error('BLOG_PIPELINE_API_KEY environment variable is not set')
    return false
  }
  return token === expectedKey
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildEmail(payload: AlertPayload): { subject: string; html: string; text: string } {
  const failures = Array.isArray(payload.failures) ? payload.failures : []
  const fatal = failures.filter((f) => f.fatal)
  const source = payload.source || 'blog pipeline'

  const subject =
    payload.subject ||
    (fatal.length > 0
      ? `🚨 Blog pipeline blocked: ${fatal.map((f) => f.name).join(', ')} credential failed`
      : `⚠️ Blog pipeline warning from ${source}`)

  const textLines: string[] = [
    `Source: ${source}`,
    payload.run_url ? `Run: ${payload.run_url}` : '',
    '',
  ]
  const htmlRows: string[] = []

  for (const f of failures) {
    const label = f.fatal ? 'BLOCKING' : 'warning'
    textLines.push(`[${label}] ${f.name}: ${f.detail}`)
    if (f.fix) textLines.push(`    Fix: ${f.fix}`)
    textLines.push('')
    htmlRows.push(
      `<tr>
        <td style="padding:8px;border:1px solid #ddd;font-weight:600;color:${f.fatal ? '#b91c1c' : '#b45309'}">${escapeHtml(f.name)}<br><span style="font-size:12px;font-weight:400">${label}</span></td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(f.detail)}${
          f.fix ? `<br><br><strong>Fix:</strong> ${escapeHtml(f.fix)}` : ''
        }</td>
      </tr>`
    )
  }

  if (payload.message) {
    textLines.push(payload.message)
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:680px">
      <h2 style="margin:0 0 8px">${escapeHtml(subject)}</h2>
      <p style="color:#555;margin:0 0 16px">
        Source: ${escapeHtml(source)}
        ${payload.run_url ? ` &middot; <a href="${escapeHtml(payload.run_url)}">View the run</a>` : ''}
      </p>
      ${
        htmlRows.length > 0
          ? `<table style="border-collapse:collapse;width:100%">${htmlRows.join('')}</table>`
          : ''
      }
      ${payload.message ? `<p>${escapeHtml(payload.message)}</p>` : ''}
      <p style="color:#777;font-size:12px;margin-top:24px">
        Sent by the blog pipeline credential check. Until every blocking item is fixed,
        Generate Briefs, Draft Articles and Publish will stop before doing any work.
      </p>
    </div>`

  return { subject, html, text: textLines.filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n') }
}

export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: AlertPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const hasContent =
    (Array.isArray(payload.failures) && payload.failures.length > 0) || !!payload.message
  if (!hasContent) {
    return NextResponse.json({ error: 'Provide failures[] or message' }, { status: 400 })
  }

  const { subject, html, text } = buildEmail(payload)
  const recipients = await getAdminEmails()

  let emailed = false
  let slacked = false
  try {
    emailed = !!(await sendEmail({ to: recipients, subject, html, text }))
  } catch (error) {
    console.error('Blog pipeline alert email failed:', error)
  }
  if (!emailed) {
    try {
      slacked = await sendSlackWebhook({ text: `${subject}\n${text}` })
    } catch (error) {
      console.error('Blog pipeline alert Slack fallback failed:', error)
    }
  }

  console.warn('Blog pipeline alert:', subject, { emailed, slacked, source: payload.source })

  return NextResponse.json({
    ok: emailed || slacked,
    emailed,
    slacked,
    recipients: emailed ? recipients : [],
    summary: emailed
      ? `emailed ${recipients.length} admin(s)`
      : slacked
        ? 'email failed, posted to Slack'
        : 'no delivery channel succeeded',
  })
}

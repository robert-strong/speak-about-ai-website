/**
 * Website form health monitoring
 *
 * Runs synthetic end-to-end checks against every public submission form on
 * speakabout.ai, records the results, and emails the team when a form breaks
 * (and again when it recovers).
 *
 * Checks performed on every run:
 *   - page:contact             /contact renders and contains the inquiry form
 *   - page:apply               /apply renders and contains the speaker application
 *   - form:contact             POST /api/submit-deal (health-check mode) succeeds end to end
 *   - form:speaker-application POST /api/speaker-applications (health-check mode) succeeds
 *   - form:newsletter          POST /api/newsletter/signup (health-check mode) succeeds
 *   - form:landing-page        form_submissions table accepts a write (landing page forms)
 *   - service:turnstile        Turnstile secret is valid and Cloudflare's verify API is reachable
 *   - service:resend           Resend API key is valid and the sending domain is verified
 *   - config:admin-emails      Inquiry notification recipients are configured
 *
 * Health-check mode: a request carrying the `x-form-health-check` header with the
 * shared secret makes a form route skip CAPTCHA + notification emails and delete the
 * test record it just created, so the real code path is exercised without side effects.
 */

import { neon } from '@neondatabase/serverless'
import { sendEmail } from './email'
import { sendSlackWebhook } from './slack'
import { getAdminEmails } from './admin-emails'

// ---------------------------------------------------------------------------
// Constants & configuration
// ---------------------------------------------------------------------------

export const FORM_HEALTH_HEADER = 'x-form-health-check'
export const HEALTH_CHECK_EMAIL = 'form-health-check@speakabout.ai'
export const HEALTH_CHECK_NAME = 'Form Health Check (auto-deleted)'
export const DEFAULT_ALERT_EMAIL = 'human@speakabout.ai'

/** How often to re-send an alert while a check keeps failing */
export const REMINDER_INTERVAL_HOURS = Number(process.env.FORM_HEALTH_REMINDER_HOURS || 6)
/** Per-check HTTP timeout */
const CHECK_TIMEOUT_MS = 20_000
/** Delay before retrying a failed check once (filters out cold starts / blips) */
const RETRY_DELAY_MS = 3_000
/** How long to keep run history */
const RUN_RETENTION_DAYS = 30

export const ADMIN_STATUS_URL = 'https://speakabout.ai/admin/form-health'

export function getFormHealthSecret(): string | null {
  return process.env.FORM_HEALTH_SECRET || process.env.CRON_SECRET || null
}

/** Base URL of the site whose forms are being tested (what real visitors hit) */
export function getFormHealthBaseUrl(): string {
  if (process.env.FORM_HEALTH_BASE_URL) return process.env.FORM_HEALTH_BASE_URL.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') {
    return (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
  }
  return 'https://speakabout.ai'
}

/** Who gets the alert emails. Defaults to human@speakabout.ai. */
export function getFormHealthAlertRecipients(): string[] {
  const configured = (process.env.FORM_HEALTH_ALERT_EMAILS || '')
    .split(',')
    .map(e => e.trim())
    .filter(e => e.includes('@'))
  return configured.length > 0 ? configured : [DEFAULT_ALERT_EMAIL]
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * True when the incoming request is a synthetic health check from our own monitor.
 * Form routes use this to skip CAPTCHA/notifications and clean up after themselves.
 */
export function isFormHealthCheckRequest(request: Request): boolean {
  const secret = getFormHealthSecret()
  if (!secret) return false
  const provided = request.headers.get(FORM_HEALTH_HEADER)
  return !!provided && constantTimeEqual(provided, secret)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckResult {
  name: string
  label: string
  ok: boolean
  durationMs: number
  /** Short human-readable note on success */
  detail?: string
  /** Failure reason */
  error?: string
}

interface CheckDefinition {
  name: string
  label: string
  run: () => Promise<{ ok: boolean; detail?: string; error?: string }>
}

export interface CheckStatusRow {
  check_name: string
  label: string | null
  status: 'ok' | 'failing'
  consecutive_failures: number
  last_checked_at: string | null
  last_ok_at: string | null
  last_failure_at: string | null
  last_alert_at: string | null
  last_error: string | null
  last_detail: string | null
  last_duration_ms: number | null
}

export type AlertKind = 'failure' | 'recovery' | 'reminder'

export interface HealthRunSummary {
  ranAt: string
  triggeredBy: string
  overallOk: boolean
  durationMs: number
  results: CheckResult[]
  newlyFailing: string[]
  recovered: string[]
  stillFailing: string[]
  alertSent: AlertKind | null
  alertRecipients: string[]
  alertDelivery: 'email' | 'slack' | 'none' | 'failed'
  cleanup: Record<string, number>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return `Timed out after ${CHECK_TIMEOUT_MS / 1000}s`
    return error.message
  }
  return String(error)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'user-agent': 'SpeakAboutAI-FormHealthMonitor/1.0',
        ...(init.headers || {})
      }
    })
  } finally {
    clearTimeout(timer)
  }
}

async function readJsonSafe(response: Response): Promise<any> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { _raw: text.slice(0, 300) }
  }
}

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  return neon(process.env.DATABASE_URL)
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

function buildChecks(baseUrl: string): CheckDefinition[] {
  const secret = getFormHealthSecret()
  const healthHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(secret ? { [FORM_HEALTH_HEADER]: secret } : {})
  }

  const pageCheck = (name: string, label: string, path: string, markers: string[]): CheckDefinition => ({
    name,
    label,
    run: async () => {
      const response = await fetchWithTimeout(`${baseUrl}${path}`)
      if (!response.ok) return { ok: false, error: `GET ${path} returned HTTP ${response.status}` }
      const html = await response.text()
      const missing = markers.filter(m => !html.includes(m))
      if (missing.length > 0) {
        return { ok: false, error: `GET ${path} loaded (HTTP 200) but the form was not found in the page (missing: ${missing.join(', ')})` }
      }
      return { ok: true, detail: `${path} renders with the form (${Math.round(html.length / 1024)} KB)` }
    }
  })

  const postCheck = (
    name: string,
    label: string,
    path: string,
    body: Record<string, unknown>,
    expect: (data: any) => string | null
  ): CheckDefinition => ({
    name,
    label,
    run: async () => {
      if (!secret) return { ok: false, error: 'CRON_SECRET / FORM_HEALTH_SECRET is not configured, cannot run synthetic submission' }
      const response = await fetchWithTimeout(`${baseUrl}${path}`, {
        method: 'POST',
        headers: healthHeaders,
        body: JSON.stringify(body)
      })
      const data = await readJsonSafe(response)
      if (!response.ok) {
        const reason = data?.error || data?.message || data?._raw || 'no error message'
        return { ok: false, error: `POST ${path} returned HTTP ${response.status}: ${reason}` }
      }
      const problem = expect(data)
      if (problem) return { ok: false, error: `POST ${path} responded 200 but ${problem}` }
      return { ok: true, detail: 'Synthetic submission accepted and cleaned up' }
    }
  })

  const expectHealthSuccess = (data: any): string | null => {
    if (!data?.success) return 'did not report success'
    if (!data?.healthCheck) return 'health-check mode was not recognised (test record may not have been cleaned up)'
    return null
  }

  return [
    pageCheck('page:contact', 'Contact page (/contact)', '/contact', ['id="clientEmail"']),
    pageCheck('page:apply', 'Speaker application page (/apply)', '/apply', ['Join Speak About AI', '<form']),

    postCheck(
      'form:contact',
      'Contact / inquiry form (/api/submit-deal)',
      '/api/submit-deal',
      {
        clientName: HEALTH_CHECK_NAME,
        clientEmail: HEALTH_CHECK_EMAIL,
        organizationName: 'Speak About AI monitoring',
        eventLocation: 'Automated check',
        eventBudget: 'TBD',
        additionalInfo: 'Automated form health check. This record is deleted immediately.',
        eventDates: [new Date().toISOString().split('T')[0]],
        requestType: 'keynote',
        turnstileToken: 'health-check'
      },
      expectHealthSuccess
    ),

    postCheck(
      'form:speaker-application',
      'Speaker application form (/api/speaker-applications)',
      '/api/speaker-applications',
      {
        first_name: 'Form Health',
        last_name: 'Check',
        email: HEALTH_CHECK_EMAIL,
        bio: 'Automated form health check. This record is deleted immediately.',
        location: 'Automated check',
        title: 'Monitor',
        company: 'Speak About AI monitoring',
        speaking_topics: 'Automated form health check',
        agree_to_terms: true
      },
      expectHealthSuccess
    ),

    postCheck(
      'form:newsletter',
      'Newsletter signup (/api/newsletter/signup)',
      '/api/newsletter/signup',
      {
        email: HEALTH_CHECK_EMAIL,
        name: HEALTH_CHECK_NAME,
        company: 'Speak About AI monitoring'
      },
      expectHealthSuccess
    ),

    {
      name: 'form:landing-page',
      label: 'Landing page forms (form_submissions table)',
      run: async () => {
        const sql = getSql()
        const [row] = await sql`
          INSERT INTO form_submissions (
            submission_type, source_url, name, email, message, form_data, newsletter_opt_in, status
          ) VALUES (
            'health_check', 'form-health-monitor', ${HEALTH_CHECK_NAME}, ${HEALTH_CHECK_EMAIL},
            'Automated form health check. This record is deleted immediately.',
            ${JSON.stringify({ healthCheck: true })}, false, 'archived'
          )
          RETURNING id
        `
        if (!row?.id) return { ok: false, error: 'INSERT into form_submissions returned no id' }
        await sql`DELETE FROM form_submissions WHERE id = ${row.id}`
        return { ok: true, detail: 'Database accepted and removed a test submission' }
      }
    },

    {
      name: 'service:turnstile',
      label: 'Cloudflare Turnstile (CAPTCHA on the contact form)',
      run: async () => {
        if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
          return { ok: false, error: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set, the CAPTCHA widget cannot load and the contact form cannot be submitted' }
        }
        const secretKey = process.env.TURNSTILE_SECRET_KEY
        if (!secretKey) {
          return { ok: false, error: 'TURNSTILE_SECRET_KEY is not set, every contact form submission will be rejected' }
        }
        const params = new URLSearchParams({ secret: secretKey, response: 'form-health-monitor-probe' })
        const response = await fetchWithTimeout('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        })
        if (!response.ok) return { ok: false, error: `Turnstile verify API returned HTTP ${response.status}` }
        const data = await readJsonSafe(response)
        const codes: string[] = data?.['error-codes'] || []
        if (codes.includes('invalid-input-secret')) {
          return { ok: false, error: 'TURNSTILE_SECRET_KEY is rejected by Cloudflare (invalid-input-secret). Real submissions will fail CAPTCHA.' }
        }
        if (data?.success === true) {
          return { ok: true, detail: 'Turnstile is in test/always-pass mode' }
        }
        if (codes.includes('invalid-input-response') || codes.includes('timeout-or-duplicate')) {
          return { ok: true, detail: 'Cloudflare verify API reachable and secret key accepted' }
        }
        return { ok: false, error: `Unexpected Turnstile verify response: ${JSON.stringify(data).slice(0, 200)}` }
      }
    },

    {
      name: 'service:resend',
      label: 'Resend (email delivery for inquiry notifications)',
      run: async () => {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) return { ok: false, error: 'RESEND_API_KEY is not set, inquiry notification emails cannot be sent' }
        const response = await fetchWithTimeout('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${apiKey}` }
        })
        if (response.status === 401 || response.status === 403) {
          return { ok: false, error: `Resend rejected the API key (HTTP ${response.status})` }
        }
        if (!response.ok) return { ok: false, error: `Resend API returned HTTP ${response.status}` }
        const data = await readJsonSafe(response)
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@speakabout.ai'
        const fromDomain = fromEmail.split('@')[1]?.toLowerCase()
        const domains: Array<{ name: string; status: string }> = data?.data || []
        const match = domains.find(d => d.name?.toLowerCase() === fromDomain)
        if (!match) {
          return { ok: false, error: `Sending domain ${fromDomain} is not registered in Resend (found: ${domains.map(d => d.name).join(', ') || 'none'})` }
        }
        if (match.status !== 'verified') {
          return { ok: false, error: `Sending domain ${fromDomain} is "${match.status}" in Resend, not verified` }
        }
        return { ok: true, detail: `API key valid, ${fromDomain} verified` }
      }
    },

    {
      name: 'config:admin-emails',
      label: 'Inquiry notification recipients',
      run: async () => {
        const emails = await getAdminEmails()
        const valid = emails.filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        if (valid.length === 0) return { ok: false, error: 'No valid admin notification email addresses are configured' }
        return { ok: true, detail: `New inquiries notify: ${valid.join(', ')}` }
      }
    }
  ]
}

async function runCheck(def: CheckDefinition): Promise<CheckResult> {
  const attempt = async () => {
    const started = Date.now()
    try {
      const outcome = await def.run()
      return { ...outcome, durationMs: Date.now() - started }
    } catch (error) {
      return { ok: false, error: errorMessage(error), durationMs: Date.now() - started }
    }
  }

  let outcome = await attempt()
  if (!outcome.ok) {
    // One retry after a short pause so a single cold start or network blip does not page anyone
    const firstError = outcome.error
    await sleep(RETRY_DELAY_MS)
    const retry = await attempt()
    if (retry.ok) {
      retry.detail = `${retry.detail || 'OK'} (passed on retry; first attempt: ${firstError})`
    }
    outcome = retry
  }

  return { name: def.name, label: def.label, ...outcome }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function ensureFormHealthTables(): Promise<void> {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS form_health_status (
      check_name VARCHAR(100) PRIMARY KEY,
      label VARCHAR(200),
      status VARCHAR(20) NOT NULL DEFAULT 'ok',
      consecutive_failures INTEGER NOT NULL DEFAULT 0,
      last_checked_at TIMESTAMPTZ,
      last_ok_at TIMESTAMPTZ,
      last_failure_at TIMESTAMPTZ,
      last_alert_at TIMESTAMPTZ,
      last_error TEXT,
      last_detail TEXT,
      last_duration_ms INTEGER,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS form_health_runs (
      id SERIAL PRIMARY KEY,
      ran_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      triggered_by VARCHAR(50),
      overall_ok BOOLEAN NOT NULL,
      failing_count INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER,
      alert_sent VARCHAR(20),
      results JSONB
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS form_failure_reports (
      id SERIAL PRIMARY KEY,
      form_id VARCHAR(50) NOT NULL,
      kind VARCHAR(50) NOT NULL,
      status_code INTEGER,
      message TEXT,
      page_url TEXT,
      user_agent TEXT,
      ip_address VARCHAR(100),
      alerted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `
}

export async function getFormHealthStatuses(): Promise<CheckStatusRow[]> {
  const sql = getSql()
  const rows = await sql`SELECT * FROM form_health_status ORDER BY check_name`
  return rows as CheckStatusRow[]
}

/**
 * Remove any test records a health check may have left behind (for example if a
 * form route crashed between inserting and deleting its test row).
 */
export async function cleanupHealthCheckRecords(): Promise<Record<string, number>> {
  const sql = getSql()
  const counts: Record<string, number> = {}
  const targets: Array<[string, () => Promise<any[]>]> = [
    ['deals', () => sql`DELETE FROM deals WHERE client_email = ${HEALTH_CHECK_EMAIL} RETURNING id`],
    ['speaker_applications', () => sql`DELETE FROM speaker_applications WHERE email = ${HEALTH_CHECK_EMAIL} RETURNING id`],
    ['newsletter_signups', () => sql`DELETE FROM newsletter_signups WHERE email = ${HEALTH_CHECK_EMAIL} RETURNING id`],
    ['form_submissions', () => sql`DELETE FROM form_submissions WHERE email = ${HEALTH_CHECK_EMAIL} RETURNING id`],
    ['landing_page_signups', () => sql`DELETE FROM landing_page_signups WHERE email = ${HEALTH_CHECK_EMAIL} RETURNING id`]
  ]
  for (const [table, run] of targets) {
    try {
      const deleted = await run()
      counts[table] = deleted.length
    } catch (error) {
      // A missing optional table is not a form failure; surface it in the run output only
      counts[table] = -1
      console.warn(`[form-health] cleanup skipped for ${table}:`, errorMessage(error))
    }
  }
  return counts
}

// ---------------------------------------------------------------------------
// Alerting
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatPst(date: Date): string {
  return date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' }) + ' PT'
}

export function buildAlertEmail(kind: AlertKind, results: CheckResult[], statuses: Map<string, CheckStatusRow>) {
  const failing = results.filter(r => !r.ok)
  const passing = results.filter(r => r.ok)
  const now = new Date()
  const site = getFormHealthBaseUrl().replace(/^https?:\/\//, '')

  let subject: string
  let headline: string
  let intro: string
  let color: string

  if (kind === 'failure') {
    const formFailures = failing.filter(r => r.name.startsWith('form:') || r.name.startsWith('page:'))
    const what = formFailures.length > 0
      ? `${formFailures.length === 1 ? formFailures[0].label : formFailures.length + ' website forms'} failing`
      : `${failing.length} form dependency check${failing.length === 1 ? '' : 's'} failing`
    subject = `🚨 ${site}: ${what}`
    headline = 'A website submission form is not working'
    intro = 'The automated form monitor just found a problem. Visitors may be unable to submit inquiries until this is fixed.'
    color = '#dc2626'
  } else if (kind === 'reminder') {
    subject = `⚠️ ${site}: form issue still unresolved (${failing.length} check${failing.length === 1 ? '' : 's'} failing)`
    headline = 'Form issue still unresolved'
    intro = `The problem reported earlier is still present. This reminder repeats every ${REMINDER_INTERVAL_HOURS} hours until the checks pass.`
    color = '#d97706'
  } else {
    subject = `✅ ${site}: website forms are working again`
    headline = 'All form checks are passing again'
    intro = 'The previously failing checks have recovered. No action needed.'
    color = '#16a34a'
  }

  const failingRows = failing.map(r => {
    const status = statuses.get(r.name)
    const since = status?.last_ok_at ? `Last passed: ${formatPst(new Date(status.last_ok_at))}` : 'Has not passed since monitoring started'
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;vertical-align:top;"><strong>${escapeHtml(r.label)}</strong><br><span style="color:#666;font-size:12px;">${escapeHtml(since)}</span></td>
        <td style="padding:10px;border-bottom:1px solid #eee;vertical-align:top;color:#b91c1c;">${escapeHtml(r.error || 'Unknown error')}</td>
      </tr>`
  }).join('')

  const passingList = passing.map(r => `<li>${escapeHtml(r.label)}</li>`).join('')

  const recoveredList = kind === 'recovery'
    ? results.filter(r => r.ok && statuses.get(r.name)?.status === 'failing').map(r => `<li>${escapeHtml(r.label)}</li>`).join('')
    : ''

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;">
      <div style="background:${color};color:#fff;padding:20px 24px;border-radius:10px 10px 0 0;">
        <h1 style="margin:0;font-size:20px;">${escapeHtml(headline)}</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:14px;">${escapeHtml(site)} &middot; ${escapeHtml(formatPst(now))}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px;">
        <p style="margin-top:0;">${escapeHtml(intro)}</p>
        ${failing.length > 0 ? `
          <h2 style="font-size:16px;margin:24px 0 8px;">Failing checks</h2>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">
            <thead><tr style="background:#f9fafb;"><th style="text-align:left;padding:10px;">Check</th><th style="text-align:left;padding:10px;">Problem</th></tr></thead>
            <tbody>${failingRows}</tbody>
          </table>` : ''}
        ${recoveredList ? `<h2 style="font-size:16px;margin:24px 0 8px;">Recovered</h2><ul style="font-size:14px;">${recoveredList}</ul>` : ''}
        ${passing.length > 0 ? `<h2 style="font-size:16px;margin:24px 0 8px;">Passing (${passing.length})</h2><ul style="font-size:13px;color:#4b5563;">${passingList}</ul>` : ''}
        ${kind !== 'recovery' ? `
          <h2 style="font-size:16px;margin:24px 0 8px;">What to do</h2>
          <ol style="font-size:14px;line-height:1.6;">
            <li>Open the <a href="${ADMIN_STATUS_URL}">Form Health page</a> in the admin panel for full details and to re-run the checks.</li>
            <li>Try the form yourself at <a href="${getFormHealthBaseUrl()}/contact">${escapeHtml(site)}/contact</a> to confirm what visitors see.</li>
            <li>Check the Vercel deployment logs for the failing route, and the environment variables named in the error.</li>
          </ol>` : ''}
        <p style="margin:24px 0 0;">
          <a href="${ADMIN_STATUS_URL}" style="display:inline-block;background:#1E68C6;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">View Form Health dashboard</a>
        </p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Sent automatically by the Speak About AI form monitor. Checks run every 15 minutes.</p>
      </div>
    </div>`

  const text = [
    headline,
    `${site} - ${formatPst(now)}`,
    '',
    intro,
    '',
    failing.length > 0 ? 'FAILING CHECKS:' : '',
    ...failing.map(r => `- ${r.label}: ${r.error || 'Unknown error'}`),
    '',
    passing.length > 0 ? `PASSING (${passing.length}): ${passing.map(r => r.label).join('; ')}` : '',
    '',
    `Dashboard: ${ADMIN_STATUS_URL}`
  ].join('\n')

  return { subject, html, text }
}

async function deliverAlert(
  kind: AlertKind,
  results: CheckResult[],
  statuses: Map<string, CheckStatusRow>
): Promise<{ delivery: 'email' | 'slack' | 'failed'; recipients: string[] }> {
  const recipients = getFormHealthAlertRecipients()
  const { subject, html, text } = buildAlertEmail(kind, results, statuses)

  let emailed = false
  try {
    emailed = await sendEmail({ to: recipients, subject, html, text })
  } catch (error) {
    console.error('[form-health] alert email threw:', errorMessage(error))
  }
  if (emailed) return { delivery: 'email', recipients }

  // Email failed (Resend may itself be the thing that is down). Try Slack as a fallback.
  console.error('[form-health] alert email could not be sent; attempting Slack fallback')
  try {
    const slackOk = await sendSlackWebhook({ text: `${subject}\n${text}\n(Alert email to ${recipients.join(', ')} could not be sent.)` })
    if (slackOk) return { delivery: 'slack', recipients }
  } catch (error) {
    console.error('[form-health] Slack fallback threw:', errorMessage(error))
  }
  return { delivery: 'failed', recipients }
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export async function runFormHealthCheck(options: { triggeredBy?: string; sendAlerts?: boolean } = {}): Promise<HealthRunSummary> {
  const triggeredBy = options.triggeredBy || 'cron'
  const sendAlerts = options.sendAlerts !== false
  const started = Date.now()
  const ranAt = new Date()

  await ensureFormHealthTables()
  const sql = getSql()

  const baseUrl = getFormHealthBaseUrl()
  const results = await Promise.all(buildChecks(baseUrl).map(runCheck))
  const cleanup = await cleanupHealthCheckRecords()

  // Load previous state so we can detect transitions
  const previousRows = await getFormHealthStatuses()
  const previous = new Map(previousRows.map(row => [row.check_name, row]))

  const newlyFailing: string[] = []
  const recovered: string[] = []
  const stillFailing: string[] = []

  for (const result of results) {
    const prev = previous.get(result.name)
    if (!result.ok) {
      if (prev?.status === 'failing') stillFailing.push(result.name)
      else newlyFailing.push(result.name)
    } else if (prev?.status === 'failing') {
      recovered.push(result.name)
    }
  }

  const failing = results.filter(r => !r.ok)
  const overallOk = failing.length === 0

  // Decide whether this run should notify anyone
  let alertKind: AlertKind | null = null
  if (sendAlerts) {
    if (newlyFailing.length > 0) {
      alertKind = 'failure'
    } else if (failing.length > 0) {
      const reminderDue = stillFailing.some(name => {
        const lastAlert = previous.get(name)?.last_alert_at
        if (!lastAlert) return true
        return Date.now() - new Date(lastAlert).getTime() >= REMINDER_INTERVAL_HOURS * 3600 * 1000
      })
      if (reminderDue) alertKind = 'reminder'
    } else if (recovered.length > 0) {
      alertKind = 'recovery'
    }
  }

  let alertDelivery: HealthRunSummary['alertDelivery'] = 'none'
  let alertRecipients: string[] = []
  if (alertKind) {
    const delivered = await deliverAlert(alertKind, results, previous)
    alertDelivery = delivered.delivery
    alertRecipients = delivered.recipients
    if (delivered.delivery === 'failed') alertKind = null
  }

  // Persist per-check status
  for (const result of results) {
    const prev = previous.get(result.name)
    const consecutive = result.ok ? 0 : (prev?.consecutive_failures || 0) + 1
    const alertedNow = !!alertKind && !result.ok
    await sql`
      INSERT INTO form_health_status (
        check_name, label, status, consecutive_failures, last_checked_at,
        last_ok_at, last_failure_at, last_alert_at, last_error, last_detail, last_duration_ms, updated_at
      ) VALUES (
        ${result.name}, ${result.label}, ${result.ok ? 'ok' : 'failing'}, ${consecutive}, ${ranAt.toISOString()},
        ${result.ok ? ranAt.toISOString() : prev?.last_ok_at || null},
        ${result.ok ? prev?.last_failure_at || null : ranAt.toISOString()},
        ${alertedNow ? ranAt.toISOString() : prev?.last_alert_at || null},
        ${result.ok ? null : result.error || 'Unknown error'},
        ${result.ok ? result.detail || null : null},
        ${result.durationMs}, CURRENT_TIMESTAMP
      )
      ON CONFLICT (check_name) DO UPDATE SET
        label = EXCLUDED.label,
        status = EXCLUDED.status,
        consecutive_failures = EXCLUDED.consecutive_failures,
        last_checked_at = EXCLUDED.last_checked_at,
        last_ok_at = EXCLUDED.last_ok_at,
        last_failure_at = EXCLUDED.last_failure_at,
        last_alert_at = EXCLUDED.last_alert_at,
        last_error = EXCLUDED.last_error,
        last_detail = EXCLUDED.last_detail,
        last_duration_ms = EXCLUDED.last_duration_ms,
        updated_at = CURRENT_TIMESTAMP
    `
  }

  const durationMs = Date.now() - started
  await sql`
    INSERT INTO form_health_runs (ran_at, triggered_by, overall_ok, failing_count, duration_ms, alert_sent, results)
    VALUES (${ranAt.toISOString()}, ${triggeredBy}, ${overallOk}, ${failing.length}, ${durationMs}, ${alertKind}, ${JSON.stringify(results)})
  `
  await sql`DELETE FROM form_health_runs WHERE ran_at < NOW() - (${RUN_RETENTION_DAYS} || ' days')::interval`

  return {
    ranAt: ranAt.toISOString(),
    triggeredBy,
    overallOk,
    durationMs,
    results,
    newlyFailing,
    recovered,
    stillFailing,
    alertSent: alertKind,
    alertRecipients,
    alertDelivery,
    cleanup
  }
}

// ---------------------------------------------------------------------------
// Visitor-reported failures (browser reports a failed real submission)
// ---------------------------------------------------------------------------

export const REPORTABLE_FORM_IDS = ['contact', 'speaker-application', 'newsletter', 'landing-page'] as const
export type ReportableFormId = typeof REPORTABLE_FORM_IDS[number]
export const REPORTABLE_KINDS = ['network_error', 'server_error', 'turnstile_error'] as const
export type ReportableKind = typeof REPORTABLE_KINDS[number]

const FORM_LABELS: Record<ReportableFormId, string> = {
  'contact': 'Contact / inquiry form',
  'speaker-application': 'Speaker application form',
  'newsletter': 'Newsletter signup',
  'landing-page': 'Landing page form'
}

const KIND_LABELS: Record<ReportableKind, string> = {
  network_error: 'the request never reached the server (network error / timeout)',
  server_error: 'the server returned an error',
  turnstile_error: 'the CAPTCHA widget failed to load or verify'
}

/** Minimum gap between visitor-failure alert emails for the same form */
const REPORT_ALERT_COOLDOWN_MINUTES = 60

/**
 * Turnstile error families that only describe the visitor's own browser
 * (300xxx = generic client execution error, 600xxx = challenge execution
 * failure, i.e. the client looked automated or had scripts blocked). They are
 * stored on the dashboard but never emailed, because nothing on our side can
 * fix them. Config problems (106xxx bad sitekey, 110xxx domain/config) still alert.
 */
const NON_ACTIONABLE_TURNSTILE_CODE = /Turnstile error [36][0-9]{5}(?![0-9])/

export function isNonActionableClientFailure(input: Pick<FailureReportInput, 'kind' | 'message'>): boolean {
  return input.kind === 'turnstile_error' && NON_ACTIONABLE_TURNSTILE_CODE.test(input.message || '')
}

export interface FailureReportInput {
  formId: ReportableFormId
  kind: ReportableKind
  statusCode?: number | null
  message?: string | null
  pageUrl?: string | null
  userAgent?: string | null
  ip?: string | null
}

/**
 * Store a browser-reported submission failure and email the team if this form
 * has not already triggered an alert in the last hour. Client-only Turnstile
 * failures (see isNonActionableClientFailure) are stored but never emailed.
 */
export async function recordVisitorFailureReport(input: FailureReportInput): Promise<{ stored: boolean; alerted: boolean }> {
  await ensureFormHealthTables()
  const sql = getSql()

  const [recentAlert] = await sql`
    SELECT created_at FROM form_failure_reports
    WHERE form_id = ${input.formId} AND alerted = true
      AND created_at > NOW() - (${REPORT_ALERT_COOLDOWN_MINUTES} || ' minutes')::interval
    ORDER BY created_at DESC LIMIT 1
  `
  const shouldAlert = !recentAlert && !isNonActionableClientFailure(input)

  const [row] = await sql`
    INSERT INTO form_failure_reports (form_id, kind, status_code, message, page_url, user_agent, ip_address, alerted)
    VALUES (
      ${input.formId}, ${input.kind}, ${input.statusCode ?? null}, ${(input.message || '').slice(0, 500) || null},
      ${(input.pageUrl || '').slice(0, 500) || null}, ${(input.userAgent || '').slice(0, 300) || null},
      ${input.ip || null}, ${shouldAlert}
    )
    RETURNING id
  `

  if (!shouldAlert) return { stored: !!row, alerted: false }

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM form_failure_reports
    WHERE form_id = ${input.formId} AND created_at > NOW() - interval '1 hour'
  `

  const site = getFormHealthBaseUrl().replace(/^https?:\/\//, '')
  const formLabel = FORM_LABELS[input.formId]
  const subject = `⚠️ ${site}: a visitor could not submit the ${formLabel.toLowerCase()}`
  const details: Array<[string, string]> = [
    ['Form', formLabel],
    ['What happened', KIND_LABELS[input.kind]],
    ['HTTP status', input.statusCode ? String(input.statusCode) : 'n/a'],
    ['Error message', input.message || 'n/a'],
    ['Page', input.pageUrl || 'n/a'],
    ['Browser', input.userAgent || 'n/a'],
    ['Reports in the last hour', String(count)],
    ['Time', formatPst(new Date())]
  ]
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;">
      <div style="background:#d97706;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0;">
        <h1 style="margin:0;font-size:20px;">A visitor's form submission failed</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:14px;">${escapeHtml(site)}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px;">
        <p style="margin-top:0;">A real visitor's browser reported that the <strong>${escapeHtml(formLabel)}</strong> failed to submit. The scheduled monitor will confirm on its next run; in the meantime you may want to try the form yourself.</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          ${details.map(([k, v]) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee;color:#6b7280;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;">${escapeHtml(v)}</td></tr>`).join('')}
        </table>
        <p style="margin:24px 0 0;">
          <a href="${ADMIN_STATUS_URL}" style="display:inline-block;background:#1E68C6;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">View Form Health dashboard</a>
        </p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">You will receive at most one of these emails per form per hour. Individual reports are listed on the dashboard.</p>
      </div>
    </div>`
  const text = [`A visitor's form submission failed on ${site}`, '', ...details.map(([k, v]) => `${k}: ${v}`), '', `Dashboard: ${ADMIN_STATUS_URL}`].join('\n')

  let alerted = false
  try {
    alerted = await sendEmail({ to: getFormHealthAlertRecipients(), subject, html, text })
  } catch (error) {
    console.error('[form-health] visitor failure alert email threw:', errorMessage(error))
  }
  if (!alerted) {
    try {
      alerted = await sendSlackWebhook({ text: `${subject}\n${text}` })
    } catch {
      /* ignore */
    }
  }
  if (!alerted && row?.id) {
    // Do not consume the cooldown if nothing was delivered
    await sql`UPDATE form_failure_reports SET alerted = false WHERE id = ${row.id}`
  }
  return { stored: !!row, alerted }
}

export async function getRecentFailureReports(limit = 50) {
  const sql = getSql()
  return sql`SELECT * FROM form_failure_reports ORDER BY created_at DESC LIMIT ${limit}`
}

export async function getRecentRuns(limit = 30) {
  const sql = getSql()
  return sql`SELECT id, ran_at, triggered_by, overall_ok, failing_count, duration_ms, alert_sent, results FROM form_health_runs ORDER BY ran_at DESC LIMIT ${limit}`
}

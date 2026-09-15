'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, CheckCircle2, XCircle, RefreshCw, Mail, Clock, AlertTriangle, Bell } from 'lucide-react'
import { authGet } from '@/lib/auth-fetch'
import { formatDateTimePST, formatRelativeTimePST } from '@/lib/date-utils'

interface CheckStatus {
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

interface Run {
  id: number
  ran_at: string
  triggered_by: string
  overall_ok: boolean
  failing_count: number
  duration_ms: number
  alert_sent: string | null
  results: Array<{ name: string; label: string; ok: boolean; error?: string }>
}

interface FailureReport {
  id: number
  form_id: string
  kind: string
  status_code: number | null
  message: string | null
  page_url: string | null
  user_agent: string | null
  alerted: boolean
  created_at: string
}

interface StatusPayload {
  statuses: CheckStatus[]
  runs: Run[]
  reports: FailureReport[]
  config: {
    alertRecipients: string[]
    baseUrl: string
    reminderIntervalHours: number
    schedule: string
    cronConfigured: boolean
    slackFallbackConfigured: boolean
  }
}

const GROUP_ORDER: Array<[string, string]> = [
  ['form:', 'Form submissions (end to end)'],
  ['page:', 'Pages'],
  ['service:', 'Dependencies'],
  ['config:', 'Configuration']
]

export default function FormHealthPage() {
  const router = useRouter()
  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [runMessage, setRunMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await authGet('/api/admin/form-health')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setData(await response.json())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    const sessionToken = localStorage.getItem('adminSessionToken')
    if (!isLoggedIn || !sessionToken) {
      router.push('/admin')
      return
    }
    load()
  }, [router, load])

  const runNow = async (quiet: boolean) => {
    setRunning(true)
    setRunMessage(null)
    try {
      const response = await authGet(`/api/cron/form-health-check${quiet ? '?quiet=1' : ''}`)
      const result = await response.json()
      if (result?.results) {
        const failing = result.results.filter((r: any) => !r.ok).length
        const alert = result.alertSent
          ? `Alert email (${result.alertSent}) sent via ${result.alertDelivery} to ${result.alertRecipients.join(', ')}.`
          : quiet ? 'No alert sent (quiet run).' : 'No alert needed.'
        setRunMessage(`${failing === 0 ? 'All checks passed' : `${failing} check${failing === 1 ? '' : 's'} failing`} in ${(result.durationMs / 1000).toFixed(1)}s. ${alert}`)
      } else {
        setRunMessage(result?.details || result?.error || 'Run failed')
      }
    } catch (err) {
      setRunMessage(err instanceof Error ? err.message : 'Run failed')
    } finally {
      setRunning(false)
      load()
    }
  }

  const statuses = data?.statuses || []
  const failing = statuses.filter(s => s.status === 'failing')
  const lastChecked = statuses.reduce<string | null>((latest, s) => {
    if (!s.last_checked_at) return latest
    return !latest || s.last_checked_at > latest ? s.last_checked_at : latest
  }, null)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-600" />
            Form Health
          </h1>
          <p className="text-gray-600 mt-1">
            Automated checks that every website submission form still works. Runs {data?.config.schedule.toLowerCase() || 'every 15 minutes'};
            failures email {data?.config.alertRecipients.join(', ') || 'human@speakabout.ai'}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => runNow(true)} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            Run checks (no email)
          </Button>
          <Button onClick={() => runNow(false)} disabled={running}>
            <Bell className="h-4 w-4 mr-2" />
            Run checks now
          </Button>
        </div>
      </div>

      {runMessage && (
        <div className="rounded-md border bg-blue-50 border-blue-200 text-blue-900 px-4 py-3 text-sm">{runMessage}</div>
      )}
      {error && (
        <div className="rounded-md border bg-red-50 border-red-200 text-red-900 px-4 py-3 text-sm">Could not load status: {error}</div>
      )}

      {/* Overall banner */}
      {!loading && statuses.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-600">
            No checks have run yet. Click <strong>Run checks now</strong>, or wait for the next scheduled run.
          </CardContent>
        </Card>
      )}
      {statuses.length > 0 && (
        <Card className={failing.length === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="py-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {failing.length === 0
                ? <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                : <XCircle className="h-8 w-8 text-red-600" />}
              <div>
                <div className="text-lg font-semibold">
                  {failing.length === 0 ? 'All forms are working' : `${failing.length} check${failing.length === 1 ? '' : 's'} failing`}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Last checked {lastChecked ? formatRelativeTimePST(lastChecked) : 'never'}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Alerts: {data?.config.alertRecipients.join(', ')}</div>
              <div>Reminder while failing: every {data?.config.reminderIntervalHours}h · Slack fallback: {data?.config.slackFallbackConfigured ? 'on' : 'off'}</div>
              {!data?.config.cronConfigured && (
                <div className="text-red-700 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> CRON_SECRET is not set, scheduled runs will be rejected</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-check status */}
      {GROUP_ORDER.map(([prefix, title]) => {
        const group = statuses.filter(s => s.check_name.startsWith(prefix))
        if (group.length === 0) return null
        return (
          <Card key={prefix}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {group.map(s => (
                <div key={s.check_name} className="py-3 flex flex-wrap items-start gap-3">
                  {s.status === 'ok'
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    : <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-[240px]">
                    <div className="font-medium">{s.label || s.check_name}</div>
                    <div className={`text-sm ${s.status === 'ok' ? 'text-gray-600' : 'text-red-700'}`}>
                      {s.status === 'ok' ? (s.last_detail || 'OK') : (s.last_error || 'Failing')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4">
                      <span>Checked {s.last_checked_at ? formatRelativeTimePST(s.last_checked_at) : 'never'}</span>
                      {s.last_duration_ms !== null && <span>{(s.last_duration_ms / 1000).toFixed(1)}s</span>}
                      {s.status === 'failing' && s.last_ok_at && <span>Last passed {formatDateTimePST(s.last_ok_at)}</span>}
                      {s.status === 'failing' && s.consecutive_failures > 1 && <span>{s.consecutive_failures} consecutive failures</span>}
                      {s.last_alert_at && <span>Last alert {formatDateTimePST(s.last_alert_at)}</span>}
                    </div>
                  </div>
                  <Badge variant={s.status === 'ok' ? 'secondary' : 'destructive'}>{s.status === 'ok' ? 'Passing' : 'Failing'}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      {/* Visitor reports */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Visitor-reported failures</CardTitle>
          <p className="text-sm text-gray-600">
            Sent by a visitor's browser when a real submission failed because of a server or CAPTCHA error. At most one email per form per hour. Turnstile 300xxx / 600xxx codes (the visitor&apos;s own browser failed the challenge) are logged here but not emailed.
          </p>
        </CardHeader>
        <CardContent>
          {(data?.reports || []).length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No failures reported by visitors.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Form</th>
                    <th className="py-2 pr-4">Kind</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Message</th>
                    <th className="py-2 pr-4">Emailed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data!.reports.map(r => (
                    <tr key={r.id}>
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDateTimePST(r.created_at)}</td>
                      <td className="py-2 pr-4">{r.form_id}</td>
                      <td className="py-2 pr-4">{r.kind.replace('_', ' ')}</td>
                      <td className="py-2 pr-4">{r.status_code ?? '—'}</td>
                      <td className="py-2 pr-4 max-w-md truncate" title={r.message || ''}>{r.message || '—'}</td>
                      <td className="py-2 pr-4">{r.alerted ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent runs</CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.runs || []).length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No runs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Result</th>
                    <th className="py-2 pr-4">Trigger</th>
                    <th className="py-2 pr-4">Duration</th>
                    <th className="py-2 pr-4">Alert</th>
                    <th className="py-2 pr-4">Failing checks</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data!.runs.map(run => (
                    <tr key={run.id}>
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDateTimePST(run.ran_at)}</td>
                      <td className="py-2 pr-4">
                        {run.overall_ok
                          ? <span className="text-emerald-700 font-medium">Pass</span>
                          : <span className="text-red-700 font-medium">{run.failing_count} failing</span>}
                      </td>
                      <td className="py-2 pr-4">{run.triggered_by}</td>
                      <td className="py-2 pr-4">{(run.duration_ms / 1000).toFixed(1)}s</td>
                      <td className="py-2 pr-4">{run.alert_sent || '—'}</td>
                      <td className="py-2 pr-4 text-gray-600">
                        {(run.results || []).filter(r => !r.ok).map(r => r.label).join('; ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

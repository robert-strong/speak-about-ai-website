/**
 * Client-side helper: tell the server when a real visitor's form submission
 * fails because the site is broken (not because of their input).
 *
 * Fire-and-forget. Never throws, never blocks the UI.
 */

export type FormFailureFormId = 'contact' | 'speaker-application' | 'newsletter' | 'landing-page'
export type FormFailureKind = 'network_error' | 'server_error' | 'turnstile_error'

export function reportFormFailure(input: {
  formId: FormFailureFormId
  kind: FormFailureKind
  statusCode?: number
  message?: string
}): void {
  if (typeof window === 'undefined') return
  // Validation errors are not outages
  if (input.kind === 'server_error' && input.statusCode && input.statusCode < 500 && input.statusCode !== 404) return

  try {
    const payload = JSON.stringify({
      ...input,
      message: input.message ? String(input.message).slice(0, 500) : undefined,
      pageUrl: window.location.href
    })
    fetch('/api/forms/report-failure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {
      /* ignore */
    })
  } catch {
    /* ignore */
  }
}

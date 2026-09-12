# Website Form Health Monitoring

Automated checks that every public submission form on speakabout.ai keeps working,
with an email to **human@speakabout.ai** the moment something breaks (and again when
it recovers).

## What is monitored

| Check | What it proves |
|---|---|
| `form:contact` | A synthetic inquiry POSTed to `/api/submit-deal` is accepted end to end (validation, DB insert, cleanup). |
| `form:speaker-application` | A synthetic application POSTed to `/api/speaker-applications` is accepted end to end. |
| `form:newsletter` | A synthetic signup POSTed to `/api/newsletter/signup` is accepted end to end. |
| `form:landing-page` | The `form_submissions` table (landing page / blog forms via the server action) accepts a write. |
| `page:contact` | `/contact` returns 200 and the HTML contains the inquiry form. |
| `page:apply` | `/apply` returns 200 and the HTML contains the application form. |
| `service:turnstile` | `TURNSTILE_SECRET_KEY` is accepted by Cloudflare and the site key is set. A bad secret silently rejects every real contact submission. |
| `service:resend` | `RESEND_API_KEY` is valid and the sending domain is verified, so inquiry notification emails can go out. |
| `config:admin-emails` | Inquiry notifications have at least one valid recipient. |

Every check is retried once after 3 seconds before it is counted as a failure, so a
single cold start or network blip does not page anyone.

## Two independent signals

1. **Scheduled synthetic checks** (`/api/cron/form-health-check`, every 15 minutes via
   Vercel Cron). This is the primary guarantee that the forms work.
2. **Visitor failure reports** (`/api/forms/report-failure`). The contact and apply
   forms in the browser report when a *real* submission fails because of a network
   error, a 5xx/404 response, or a Turnstile widget error. Validation errors are not
   reported. The team is emailed at most once per form per hour. This catches
   browser-only breakage (for example a Turnstile site-key/domain mismatch) that a
   server-side check cannot see.

## Health-check mode (how the synthetic submissions avoid side effects)

The cron sends each form route the header `x-form-health-check: <secret>` where the
secret is `FORM_HEALTH_SECRET` or, if unset, `CRON_SECRET`. The route only enters
health-check mode when the header matches **and** the payload email is
`form-health-check@speakabout.ai`. In that mode the route:

- skips the Turnstile CAPTCHA (contact form only),
- runs its normal validation and database insert,
- deletes the record it just created,
- skips notification emails and analytics,
- responds `{ success: true, healthCheck: true }`.

After every run the monitor also sweeps `deals`, `speaker_applications`,
`newsletter_signups`, `form_submissions` and `landing_page_signups` for any row with
the health-check email, in case a route crashed between insert and delete.

## Alert emails

| Situation | Email |
|---|---|
| A check goes from passing to failing | 🚨 immediate alert listing every failing check, the error, when it last passed, and what to do |
| Still failing | ⚠️ reminder every 6 hours (`FORM_HEALTH_REMINDER_HOURS`) |
| Everything passes again | ✅ recovery notice |
| A visitor's submission failed | ⚠️ one email per form per hour with the browser, page and error |

Emails are sent through the existing Resend service. If Resend itself is down the
alert falls back to Slack when `SLACK_WEBHOOK_URL` is configured; otherwise the
failure is logged and shown on the dashboard.

## Dashboard

`/admin/form-health` (Admin sidebar → System → Form Health) shows each check's
current status, last error, last pass, consecutive failures, visitor reports, and
the last 30 runs. Two buttons:

- **Run checks now** – runs immediately and sends an alert if warranted.
- **Run checks (no email)** – same, but never emails. Use this to verify the setup.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `CRON_SECRET` | yes (already set) | Authenticates Vercel Cron; also the default health-check secret. |
| `FORM_HEALTH_SECRET` | no | Dedicated health-check header secret if you prefer not to reuse `CRON_SECRET`. |
| `FORM_HEALTH_ALERT_EMAILS` | no | Comma-separated recipients. Default: `human@speakabout.ai`. |
| `FORM_HEALTH_REMINDER_HOURS` | no | Reminder cadence while failing. Default 6. |
| `FORM_HEALTH_BASE_URL` | no | Site to test. Default `https://speakabout.ai` in production. |
| `SLACK_WEBHOOK_URL` | no | Fallback alert channel when email cannot be sent. |

The database tables (`form_health_status`, `form_health_runs`,
`form_failure_reports`) are created automatically on first run.

## Manual trigger

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://speakabout.ai/api/cron/form-health-check
# dry run without emails:
curl -H "Authorization: Bearer $CRON_SECRET" "https://speakabout.ai/api/cron/form-health-check?quiet=1"
```

The response is the full run summary (per-check results, transitions, whether an
alert was sent and to whom). HTTP 200 when everything passes, 503 when any check
fails, 500 if the monitor itself could not run.

## Files

- `lib/form-health.ts` – checks, state, alert emails, visitor report handling
- `lib/form-failure-reporter.ts` – browser helper used by the forms
- `app/api/cron/form-health-check/route.ts` – scheduled / manual runner
- `app/api/forms/report-failure/route.ts` – visitor failure reports (rate limited)
- `app/api/admin/form-health/route.ts` – dashboard data
- `app/admin/form-health/page.tsx` – dashboard
- `vercel.json` – cron schedule (`*/15 * * * *`)
- Health-check mode: `app/api/submit-deal/route.ts`, `app/api/speaker-applications/route.ts`, `app/api/newsletter/signup/route.ts`

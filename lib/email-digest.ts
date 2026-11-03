/**
 * Email Digester
 *
 * Takes the pasted text of a single email, matches it against open projects
 * and deals, and asks Claude to propose one action:
 *   - update an existing project (fields + optional workflow status move)
 *   - update an existing deal
 *   - create a new project
 *   - create a new deal (add to CRM)
 *   - no action
 *
 * Nothing is written until the admin reviews and applies the proposal.
 */

import Anthropic from "@anthropic-ai/sdk"
import { neon } from "@neondatabase/serverless"
import {
  getProjectById,
  createProject,
  updateProject,
  type Project,
} from "@/lib/projects-db"
import {
  getDealById,
  createDeal,
  updateDeal,
  type Deal,
} from "@/lib/deals-db"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DigestAction =
  | "update_project"
  | "update_deal"
  | "create_project"
  | "create_deal"
  | "no_action"

export type ProjectWorkflowStatus =
  | "qualified"
  | "proposal"
  | "contracts_signed"
  | "invoicing"
  | "logistics_planning"
  | "pre_event"
  | "event_week"
  | "follow_up"
  | "completed"
  | "cancelled"
  | "lost"

export type DealStatus = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost"

export interface CandidateProject {
  id: number
  project_name: string
  client_name: string | null
  client_email: string | null
  company: string | null
  event_name: string | null
  event_date: string | null
  event_location: string | null
  status: string
  requested_speaker_name: string | null
  contact_emails: string[]
  deal_id: number | null
  prematch: string | null
}

export interface CandidateDeal {
  id: number
  client_name: string | null
  client_email: string | null
  company: string | null
  event_title: string | null
  event_date: string | null
  event_location: string | null
  status: string
  speaker_requested: string | null
  prematch: string | null
}

export interface DigestCandidates {
  projects: CandidateProject[]
  deals: CandidateDeal[]
  speakers: string[]
}

export interface DigestAnalysis {
  email_summary: string
  sender: { name: string | null; email: string | null; company: string | null }
  is_business_relevant: boolean
  match: {
    entity_type: "project" | "deal" | "none"
    entity_id: number | null
    confidence: "high" | "medium" | "low"
    reasoning: string
    alternatives: Array<{ entity_type: "project" | "deal"; entity_id: number; reason: string }>
  }
  recommended_action: DigestAction
  action_reasoning: string
  proposed_project_fields: Record<string, string | number | boolean | null>
  proposed_project_status: ProjectWorkflowStatus | null
  status_reasoning: string | null
  proposed_deal_fields: Record<string, string | number | boolean | null>
  proposed_deal_status: DealStatus | null
  note_to_append: string | null
  follow_ups: string[]
}

export interface FieldDef {
  key: string
  label: string
  type: "string" | "number" | "boolean" | "date" | "enum"
  options?: string[]
}

// Fields the digester is allowed to propose for a project. Keep this list in
// sync with updateProject() in lib/projects-db.ts (every key must be settable there).
export const PROJECT_FIELDS: FieldDef[] = [
  { key: "client_name", label: "Client name", type: "string" },
  { key: "client_email", label: "Client email", type: "string" },
  { key: "client_phone", label: "Client phone", type: "string" },
  { key: "company", label: "Company", type: "string" },
  { key: "event_name", label: "Event name", type: "string" },
  { key: "event_date", label: "Event date", type: "date" },
  { key: "event_location", label: "Event location", type: "string" },
  { key: "event_type", label: "Event type", type: "string" },
  { key: "event_classification", label: "Classification", type: "enum", options: ["virtual", "local", "travel"] },
  { key: "event_website", label: "Event website", type: "string" },
  { key: "venue_name", label: "Venue name", type: "string" },
  { key: "venue_address", label: "Venue address", type: "string" },
  { key: "attendee_count", label: "Attendee count", type: "number" },
  { key: "audience_demographics", label: "Audience", type: "string" },
  { key: "requested_speaker_name", label: "Requested speaker", type: "string" },
  { key: "program_topic", label: "Program topic", type: "string" },
  { key: "program_type", label: "Program type", type: "string" },
  { key: "program_length", label: "Program length (min)", type: "number" },
  { key: "qa_length", label: "Q&A length (min)", type: "number" },
  { key: "speaker_presentation_title", label: "Presentation title", type: "string" },
  { key: "event_start_time", label: "Event start time", type: "string" },
  { key: "event_end_time", label: "Event end time", type: "string" },
  { key: "program_start_time", label: "Program start time", type: "string" },
  { key: "speaker_arrival_time", label: "Speaker arrival time", type: "string" },
  { key: "event_timezone", label: "Timezone", type: "string" },
  { key: "speaker_fee", label: "Speaker fee ($)", type: "number" },
  { key: "budget", label: "Deal value ($)", type: "number" },
  { key: "payment_terms", label: "Payment terms", type: "string" },
  { key: "invoice_number", label: "Invoice number", type: "string" },
  { key: "purchase_order_number", label: "PO number", type: "string" },
  { key: "travel_required", label: "Travel required", type: "boolean" },
  { key: "fly_in_date", label: "Fly-in date", type: "date" },
  { key: "fly_out_date", label: "Fly-out date", type: "date" },
  { key: "flight_number_in", label: "Inbound flight", type: "string" },
  { key: "flight_number_out", label: "Outbound flight", type: "string" },
  { key: "nearest_airport", label: "Nearest airport", type: "string" },
  { key: "hotel_name", label: "Hotel", type: "string" },
  { key: "hotel_reservation_number", label: "Hotel reservation #", type: "string" },
  { key: "av_requirements", label: "A/V requirements", type: "string" },
  { key: "recording_allowed", label: "Recording allowed", type: "boolean" },
  { key: "live_streaming", label: "Live streaming", type: "boolean" },
  { key: "tech_rehearsal_date", label: "Tech rehearsal date", type: "date" },
  { key: "billing_contact_name", label: "Billing contact", type: "string" },
  { key: "billing_contact_email", label: "Billing email", type: "string" },
  { key: "billing_contact_phone", label: "Billing phone", type: "string" },
  { key: "billing_address", label: "Billing address", type: "string" },
  { key: "logistics_contact_name", label: "Logistics contact", type: "string" },
  { key: "logistics_contact_email", label: "Logistics email", type: "string" },
  { key: "logistics_contact_phone", label: "Logistics phone", type: "string" },
  { key: "venue_contact_name", label: "Venue contact", type: "string" },
  { key: "venue_contact_email", label: "Venue email", type: "string" },
  { key: "venue_contact_phone", label: "Venue phone", type: "string" },
  { key: "prep_call_date", label: "Prep call date", type: "date" },
  { key: "contract_signed", label: "Contract signed", type: "boolean" },
  { key: "invoice_sent", label: "Invoice sent", type: "boolean" },
  { key: "payment_received", label: "Payment received", type: "boolean" },
  { key: "special_requests", label: "Special requests", type: "string" },
]

export const DEAL_FIELDS: FieldDef[] = [
  { key: "client_name", label: "Client name", type: "string" },
  { key: "client_email", label: "Client email", type: "string" },
  { key: "client_phone", label: "Client phone", type: "string" },
  { key: "company", label: "Company", type: "string" },
  { key: "event_title", label: "Event title", type: "string" },
  { key: "event_date", label: "Event date", type: "date" },
  { key: "event_location", label: "Event location", type: "string" },
  { key: "event_type", label: "Event type", type: "string" },
  { key: "speaker_requested", label: "Speaker requested", type: "string" },
  { key: "attendee_count", label: "Attendee count", type: "number" },
  { key: "budget_range", label: "Budget range", type: "string" },
  { key: "deal_value", label: "Deal value ($)", type: "number" },
  { key: "next_follow_up", label: "Next follow-up", type: "date" },
  { key: "travel_required", label: "Travel required", type: "boolean" },
]

export const PROJECT_STATUS_ORDER: ProjectWorkflowStatus[] = [
  "qualified",
  "proposal",
  "contracts_signed",
  "invoicing",
  "logistics_planning",
  "pre_event",
  "event_week",
  "follow_up",
  "completed",
]

export const PROJECT_STATUS_LABELS: Record<ProjectWorkflowStatus, string> = {
  qualified: "Qualified",
  proposal: "Proposal",
  contracts_signed: "Contracting",
  invoicing: "Invoicing",
  logistics_planning: "Logistics",
  pre_event: "Pre-Event",
  event_week: "Event Week",
  follow_up: "Follow-up",
  completed: "Completed",
  cancelled: "Cancelled",
  lost: "Lost",
}

export const DEAL_STATUS_ORDER: DealStatus[] = ["lead", "qualified", "proposal", "negotiation", "won"]

// ---------------------------------------------------------------------------
// Candidate loading + pre-matching
// ---------------------------------------------------------------------------

const getSql = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set")
  return neon(process.env.DATABASE_URL)
}

const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
const GENERIC_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com",
  "me.com", "live.com", "msn.com", "protonmail.com", "speakabout.ai",
])

function extractEmailsAndDomains(text: string) {
  const emails = new Set<string>()
  const domains = new Set<string>()
  for (const m of text.match(EMAIL_RE) || []) {
    const e = m.toLowerCase()
    emails.add(e)
    const d = e.split("@")[1]
    if (d && !GENERIC_DOMAINS.has(d)) domains.add(d)
  }
  return { emails, domains }
}

function prematchReason(
  text: string,
  emails: Set<string>,
  domains: Set<string>,
  candidateEmails: string[],
  company: string | null,
  names: Array<string | null>,
): string | null {
  const lowerText = text.toLowerCase()
  for (const ce of candidateEmails) {
    if (ce && emails.has(ce.toLowerCase())) return `email ${ce} appears in message`
  }
  for (const ce of candidateEmails) {
    const d = ce?.toLowerCase().split("@")[1]
    if (d && domains.has(d)) return `sender domain ${d} matches`
  }
  if (company && company.length > 3 && lowerText.includes(company.toLowerCase())) {
    return `company "${company}" mentioned`
  }
  for (const n of names) {
    if (n && n.length > 5 && lowerText.includes(n.toLowerCase())) return `"${n}" mentioned`
  }
  return null
}

export async function loadDigestCandidates(emailText: string): Promise<DigestCandidates> {
  const sql = getSql()
  const { emails, domains } = extractEmailsAndDomains(emailText)

  const [projectRows, dealRows, speakerRows] = await Promise.all([
    sql`
      SELECT id, project_name, client_name, client_email, company, event_name, event_date,
             event_location, status, requested_speaker_name, deal_id,
             billing_contact_email, logistics_contact_email, venue_contact_email
      FROM projects
      WHERE status NOT IN ('completed', 'cancelled', 'lost')
        AND COALESCE(is_demo, false) = false
      ORDER BY updated_at DESC
      LIMIT 200
    `,
    sql`
      SELECT id, client_name, client_email, company, event_title, event_date,
             event_location, status, speaker_requested
      FROM deals
      WHERE status NOT IN ('won', 'lost')
        AND COALESCE(is_demo, false) = false
      ORDER BY updated_at DESC
      LIMIT 200
    `,
    sql`SELECT name FROM speakers WHERE listed = true ORDER BY name LIMIT 300`,
  ])

  const projects: CandidateProject[] = projectRows.map((p: any) => {
    const contact_emails = [p.client_email, p.billing_contact_email, p.logistics_contact_email, p.venue_contact_email]
      .filter((e: string | null): e is string => !!e)
    return {
      id: p.id,
      project_name: p.project_name,
      client_name: p.client_name,
      client_email: p.client_email,
      company: p.company,
      event_name: p.event_name,
      event_date: p.event_date ? String(p.event_date).split("T")[0] : null,
      event_location: p.event_location,
      status: p.status,
      requested_speaker_name: p.requested_speaker_name,
      contact_emails,
      deal_id: p.deal_id,
      prematch: prematchReason(emailText, emails, domains, contact_emails, p.company, [p.client_name, p.event_name, p.project_name]),
    }
  })

  const deals: CandidateDeal[] = dealRows.map((d: any) => ({
    id: d.id,
    client_name: d.client_name,
    client_email: d.client_email,
    company: d.company,
    event_title: d.event_title,
    event_date: d.event_date ? String(d.event_date).split("T")[0] : null,
    event_location: d.event_location,
    status: d.status,
    speaker_requested: d.speaker_requested,
    prematch: prematchReason(emailText, emails, domains, [d.client_email], d.company, [d.client_name, d.event_title]),
  }))

  // Pre-matched candidates first so they are easy for the model (and the admin) to see
  projects.sort((a, b) => Number(!!b.prematch) - Number(!!a.prematch))
  deals.sort((a, b) => Number(!!b.prematch) - Number(!!a.prematch))

  return { projects, deals, speakers: speakerRows.map((s: any) => s.name) }
}

// ---------------------------------------------------------------------------
// Claude analysis
// ---------------------------------------------------------------------------

const MODEL = "claude-opus-5-5"

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "email_summary", "sender", "is_business_relevant", "match", "recommended_action",
    "action_reasoning", "proposed_project_fields", "proposed_project_status", "status_reasoning",
    "proposed_deal_fields", "proposed_deal_status", "note_to_append", "follow_ups",
  ],
  properties: {
    email_summary: { type: "string" },
    sender: {
      type: "object",
      additionalProperties: false,
      required: ["name", "email", "company"],
      properties: {
        name: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        company: { type: ["string", "null"] },
      },
    },
    is_business_relevant: { type: "boolean" },
    match: {
      type: "object",
      additionalProperties: false,
      required: ["entity_type", "entity_id", "confidence", "reasoning", "alternatives"],
      properties: {
        entity_type: { type: "string", enum: ["project", "deal", "none"] },
        entity_id: { type: ["integer", "null"] },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        reasoning: { type: "string" },
        alternatives: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["entity_type", "entity_id", "reason"],
            properties: {
              entity_type: { type: "string", enum: ["project", "deal"] },
              entity_id: { type: "integer" },
              reason: { type: "string" },
            },
          },
        },
      },
    },
    recommended_action: {
      type: "string",
      enum: ["update_project", "update_deal", "create_project", "create_deal", "no_action"],
    },
    action_reasoning: { type: "string" },
    // Lists of {key, value} pairs rather than one nullable property per field:
    // the API caps schemas at 16 union-typed properties, and values are coerced
    // from strings by coerceFields() anyway.
    proposed_project_fields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "value"],
        properties: {
          key: { type: "string", enum: PROJECT_FIELDS.map((f) => f.key) },
          value: { type: "string" },
        },
      },
    },
    proposed_project_status: {
      anyOf: [{ type: "string", enum: [...PROJECT_STATUS_ORDER, "cancelled", "lost"] }, { type: "null" }],
    },
    status_reasoning: { type: ["string", "null"] },
    proposed_deal_fields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "value"],
        properties: {
          key: { type: "string", enum: DEAL_FIELDS.map((f) => f.key) },
          value: { type: "string" },
        },
      },
    },
    proposed_deal_status: {
      anyOf: [{ type: "string", enum: [...DEAL_STATUS_ORDER, "lost"] }, { type: "null" }],
    },
    note_to_append: { type: ["string", "null"] },
    follow_ups: { type: "array", items: { type: "string" } },
  },
} as const

function buildSystemPrompt(today: string): string {
  const projectFieldList = PROJECT_FIELDS.map((f) => `- ${f.key} (${f.type}${f.options ? ": " + f.options.join("|") : ""}): ${f.label}`).join("\n")
  const dealFieldList = DEAL_FIELDS.map((f) => `- ${f.key} (${f.type}): ${f.label}`).join("\n")

  return `You are the operations assistant for Speak About AI, a speaker bureau that books AI keynote speakers for corporate events. An admin pastes the text of one email. Your job is to decide what, if anything, should change in the bureau's CRM and project tracker, and to extract the facts needed to make that change.

Today's date is ${today}. Resolve relative dates ("next Thursday", "in two weeks") against the email's own date line if present, otherwise against today. Output dates as YYYY-MM-DD.

DATA MODEL
- A DEAL is a sales opportunity (CRM). Deal statuses, in order: lead -> qualified -> proposal -> negotiation -> won. "lost" is terminal.
- A PROJECT is a booked or actively-worked engagement. Project workflow statuses, in order:
  qualified (lead qualified, outreach and follow-ups) ->
  proposal (requirements discussed, proposal drafted/sent) ->
  contracts_signed (contracts sent and signed with client and speaker) ->
  invoicing (invoices sent) ->
  logistics_planning (details, A/V, travel confirmed) ->
  pre_event (all logistics confirmed, speaker prepared) ->
  event_week (final prep and execution) ->
  follow_up (post-event communications) ->
  completed.
  "cancelled" and "lost" are terminal. Projects also have time-based display statuses (2plus_months, final_week, etc.) that are auto-computed. NEVER propose those.
- Most projects are linked to a deal. If a project exists for this client/event, prefer updating the PROJECT over the deal.

MATCHING
You will be given lists of open projects and open deals. Some are pre-flagged with a "prematch" reason (an email address or company name from the message appears on that record). Pick the single best match. Treat the same client contacting about a different event as NO match (that is a new deal). Report confidence honestly: "high" only when an email address or an unambiguous event name matches.

DECIDING THE ACTION
- update_project: a matched project exists and the email contains new facts or a milestone (contract signed, invoice paid, speaker confirmed, logistics details, cancellation).
- update_deal: a matched deal exists, no project exists for it, and the email moves the deal or adds facts.
- create_deal: a genuine new speaking inquiry from a prospective client with no matching record. This is "add to CRM".
- create_project: only when the email shows a booking is confirmed/agreed and no record exists at all. Otherwise use create_deal.
- no_action: newsletters, vendor pitches, spam, speaker-side chatter with no client facts, duplicates, or anything that does not change the record.

EXTRACTION RULES
- proposed_project_fields and proposed_deal_fields are LISTS of {"key", "value"} pairs. Include a pair only for fields the email actually provides; omit everything else. Every value is a string: numbers without formatting ("35000"), booleans as "true"/"false", dates as YYYY-MM-DD, times as "9:30 AM".
- Only extract facts stated or clearly implied in the email. Never invent values.
- Fees and deal values are numbers in USD with no formatting. If a range is given, put it in budget_range (deals) and leave deal_value null.
- Speaker names: normalize to the exact spelling in the SPEAKERS list when the person is clearly one of them.
- For an existing record, propose a field only if the email provides a value for it. The admin will see current vs. proposed and decide.
- Status: propose a move only when the email gives clear evidence, and only FORWARD through the workflow (or to cancelled/lost). If nothing changes, return null. Give one sentence of evidence in status_reasoning quoting the email.
- note_to_append: 1-3 sentences summarizing what this email established, written for the project notes field. Null if no_action.
- follow_ups: concrete next steps for the admin implied by the email (reply needed, send contract, confirm A/V), max 5.

PROJECT FIELDS YOU MAY PROPOSE
${projectFieldList}

DEAL FIELDS YOU MAY PROPOSE
${dealFieldList}

Return ONLY a JSON object matching the required schema. No prose before or after it.`
}

function compactCandidates(c: DigestCandidates): string {
  const projects = c.projects.map((p) => ({
    id: p.id,
    name: p.project_name,
    client: p.client_name,
    client_email: p.client_email,
    other_emails: p.contact_emails.filter((e) => e !== p.client_email),
    company: p.company,
    event: p.event_name,
    date: p.event_date,
    location: p.event_location,
    status: p.status,
    speaker: p.requested_speaker_name,
    deal_id: p.deal_id,
    ...(p.prematch ? { prematch: p.prematch } : {}),
  }))
  const deals = c.deals.map((d) => ({
    id: d.id,
    client: d.client_name,
    client_email: d.client_email,
    company: d.company,
    event: d.event_title,
    date: d.event_date,
    location: d.event_location,
    status: d.status,
    speaker: d.speaker_requested,
    ...(d.prematch ? { prematch: d.prematch } : {}),
  }))
  return `OPEN PROJECTS (${projects.length}):\n${JSON.stringify(projects)}\n\nOPEN DEALS (${deals.length}):\n${JSON.stringify(deals)}\n\nSPEAKERS:\n${c.speakers.join(", ")}`
}

function extractJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error("Model response did not contain JSON")
    return JSON.parse(m[0])
  }
}

function coerceFields(raw: any, defs: FieldDef[]): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {}
  if (!raw || typeof raw !== "object") return out
  // Accept either the structured-output form ([{key, value}, ...]) or a plain object.
  if (Array.isArray(raw)) {
    const obj: Record<string, unknown> = {}
    for (const pair of raw) {
      if (pair && typeof pair === "object" && typeof pair.key === "string") obj[pair.key] = pair.value
    }
    raw = obj
  }
  for (const def of defs) {
    const v = raw[def.key]
    if (v === undefined || v === null || v === "") continue
    switch (def.type) {
      case "number": {
        const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.-]/g, ""))
        if (!isNaN(n)) out[def.key] = n
        break
      }
      case "boolean":
        if (typeof v === "boolean") out[def.key] = v
        else if (/^(true|yes)$/i.test(String(v))) out[def.key] = true
        else if (/^(false|no)$/i.test(String(v))) out[def.key] = false
        break
      case "date": {
        const s = String(v).trim()
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) out[def.key] = s.slice(0, 10)
        break
      }
      case "enum":
        if (def.options?.includes(String(v))) out[def.key] = String(v)
        break
      default:
        out[def.key] = String(v).trim()
    }
  }
  return out
}

function normalizeAnalysis(raw: any): DigestAnalysis {
  const validProjectStatuses = new Set<string>([...PROJECT_STATUS_ORDER, "cancelled", "lost"])
  const validDealStatuses = new Set<string>([...DEAL_STATUS_ORDER, "lost"])
  const validActions = new Set<string>(["update_project", "update_deal", "create_project", "create_deal", "no_action"])

  const match = raw?.match || {}
  const entityType = ["project", "deal"].includes(match.entity_type) ? match.entity_type : "none"
  const entityId = entityType !== "none" && Number.isInteger(match.entity_id) ? match.entity_id : null

  return {
    email_summary: String(raw?.email_summary || ""),
    sender: {
      name: raw?.sender?.name ?? null,
      email: raw?.sender?.email ?? null,
      company: raw?.sender?.company ?? null,
    },
    is_business_relevant: raw?.is_business_relevant !== false,
    match: {
      entity_type: entityId ? entityType : "none",
      entity_id: entityId,
      confidence: ["high", "medium", "low"].includes(match.confidence) ? match.confidence : "low",
      reasoning: String(match.reasoning || ""),
      alternatives: Array.isArray(match.alternatives)
        ? match.alternatives
            .filter((a: any) => ["project", "deal"].includes(a?.entity_type) && Number.isInteger(a?.entity_id))
            .map((a: any) => ({ entity_type: a.entity_type, entity_id: a.entity_id, reason: String(a.reason || "") }))
        : [],
    },
    recommended_action: validActions.has(raw?.recommended_action) ? raw.recommended_action : "no_action",
    action_reasoning: String(raw?.action_reasoning || ""),
    proposed_project_fields: coerceFields(raw?.proposed_project_fields, PROJECT_FIELDS),
    proposed_project_status: validProjectStatuses.has(raw?.proposed_project_status) ? raw.proposed_project_status : null,
    status_reasoning: raw?.status_reasoning ?? null,
    proposed_deal_fields: coerceFields(raw?.proposed_deal_fields, DEAL_FIELDS),
    proposed_deal_status: validDealStatuses.has(raw?.proposed_deal_status) ? raw.proposed_deal_status : null,
    note_to_append: raw?.note_to_append ?? null,
    follow_ups: Array.isArray(raw?.follow_ups) ? raw.follow_ups.map(String).slice(0, 5) : [],
  }
}

export async function analyzeEmail(emailText: string, candidates: DigestCandidates): Promise<DigestAnalysis> {
  const client = new Anthropic()
  const today = new Date().toISOString().split("T")[0]
  const system = buildSystemPrompt(today)
  const userContent = `${compactCandidates(candidates)}\n\n=== EMAIL ===\n${emailText.trim()}\n=== END EMAIL ===`

  // The installed SDK (0.71.x) predates output_config / server-side fallbacks in its
  // typings, but the request body is passed through verbatim, so we cast.
  const baseRequest: any = {
    model: MODEL,
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: userContent }],
  }

  let response: any
  try {
    response = await (client.beta.messages as any).create({
      ...baseRequest,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: ANALYSIS_SCHEMA },
      },
    })
  } catch (err) {
    // If the structured-output request is rejected (schema or beta mismatch),
    // fall back to a plain request and parse the JSON out of the text.
    if (err instanceof Anthropic.BadRequestError) {
      console.warn("email-digest: structured output rejected, retrying plain:", err.message)
      response = await client.messages.create(baseRequest)
    } else {
      throw err
    }
  }

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to analyze this email")
  }

  const textBlock = (response.content || []).find((b: any) => b.type === "text")
  if (!textBlock) throw new Error("Model returned no text")

  return normalizeAnalysis(extractJson(textBlock.text))
}

// ---------------------------------------------------------------------------
// Snapshots (current values shown next to proposals)
// ---------------------------------------------------------------------------

export async function getProjectSnapshot(id: number) {
  const p = await getProjectById(id)
  if (!p) return null
  const snapshot: Record<string, any> = {
    id: p.id,
    project_name: p.project_name,
    status: p.status,
    notes: p.notes || "",
    deal_id: p.deal_id ?? null,
  }
  for (const f of PROJECT_FIELDS) snapshot[f.key] = (p as any)[f.key] ?? null
  if (snapshot.event_date) snapshot.event_date = String(snapshot.event_date).split("T")[0]
  return snapshot
}

export async function getDealSnapshot(id: number) {
  const d = await getDealById(id)
  if (!d) return null
  const snapshot: Record<string, any> = {
    id: d.id,
    event_title: d.event_title,
    status: d.status,
    notes: d.notes || "",
  }
  for (const f of DEAL_FIELDS) snapshot[f.key] = (d as any)[f.key] ?? null
  if (snapshot.event_date) snapshot.event_date = String(snapshot.event_date).split("T")[0]
  return snapshot
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

export interface ApplyDigestInput {
  action: DigestAction
  target_id?: number | null
  fields: Record<string, string | number | boolean | null>
  status?: string | null
  status_reasoning?: string | null
  note?: string | null
  email_summary?: string | null
  is_demo?: boolean
}

export interface ApplyDigestResult {
  action: DigestAction
  entity_type: "project" | "deal" | null
  entity_id: number | null
  entity_label: string | null
  changed_fields: string[]
  status_changed: boolean
  message: string
}

function appendNote(existing: string | null | undefined, note: string): string {
  const stamp = new Date().toISOString().split("T")[0]
  const entry = `[${stamp} email digest] ${note.trim()}`
  return existing && existing.trim() ? `${existing.trimEnd()}\n\n${entry}` : entry
}

function isForwardOrTerminal(current: string, next: string): boolean {
  if (next === "cancelled" || next === "lost") return true
  const ci = PROJECT_STATUS_ORDER.indexOf(current as ProjectWorkflowStatus)
  const ni = PROJECT_STATUS_ORDER.indexOf(next as ProjectWorkflowStatus)
  // Time-based statuses (2plus_months etc.) aren't in the order list; allow any workflow move from them.
  if (ci === -1) return ni !== -1
  return ni > ci
}

export async function applyDigest(input: ApplyDigestInput): Promise<ApplyDigestResult> {
  const today = new Date().toISOString().split("T")[0]

  if (input.action === "no_action") {
    return { action: input.action, entity_type: null, entity_id: null, entity_label: null, changed_fields: [], status_changed: false, message: "No changes made" }
  }

  // ----- update_project -----
  if (input.action === "update_project") {
    if (!input.target_id) throw new Error("target_id required for update_project")
    const project = await getProjectById(input.target_id)
    if (!project) throw new Error(`Project ${input.target_id} not found`)

    const updates: Partial<Project> = { ...(coerceFields(input.fields, PROJECT_FIELDS) as any) }
    const changed = Object.keys(updates)

    let statusChanged = false
    let flaggedPendingLost = false
    if (input.status && input.status !== project.status) {
      if (!isForwardOrTerminal(project.status, input.status)) {
        throw new Error(`Refusing to move project backward from ${project.status} to ${input.status}`)
      }
      if (input.status === "lost") {
        // "Lost" is never applied directly from an email. The project goes into the
        // pending_lost holding stage and an admin confirms or cancels on the projects page.
        flaggedPendingLost = true
      } else {
        ;(updates as any).status = input.status
      }
      statusChanged = true
    }

    if (input.note && input.note.trim()) {
      updates.notes = appendNote(project.notes, input.note)
    }

    if (changed.length === 0 && !statusChanged && !updates.notes) {
      return { action: input.action, entity_type: "project", entity_id: project.id, entity_label: project.project_name, changed_fields: [], status_changed: false, message: "Nothing selected to apply" }
    }

    if (changed.length > 0 || updates.notes) {
      const updated = await updateProject(project.id, updates)
      if (!updated) throw new Error("Project update failed")

      // Same propagation the PUT /api/projects/[id] route does: keep linked deal/contract
      // columns (client info, event date, fee) in step. Non-blocking.
      try {
        const { propagateChanges, extractSyncableFields } = await import("@/lib/entity-sync")
        const changedFields = extractSyncableFields("project", updates as Record<string, any>, project as any)
        if (Object.keys(changedFields).length > 0) {
          await propagateChanges({ sourceEntity: "project", sourceId: project.id, changedFields })
        }
      } catch (syncError) {
        console.error("email-digest: entity sync failed (non-blocking):", syncError)
      }
    }

    if (flaggedPendingLost) {
      const { flagProjectPendingLost } = await import("@/lib/pending-lost")
      await flagProjectPendingLost(project.id, input.status_reasoning || input.note || input.email_summary || null)
    }

    // Keep the linked deal's last-contact date fresh
    if (project.deal_id) {
      try {
        await updateDeal(project.deal_id, { last_contact: today } as any)
      } catch (e) {
        console.warn("email-digest: could not bump deal last_contact", e)
      }
    }

    return {
      action: input.action,
      entity_type: "project",
      entity_id: project.id,
      entity_label: project.project_name,
      changed_fields: changed,
      status_changed: statusChanged,
      message: flaggedPendingLost
        ? `Updated project "${project.project_name}" and flagged it as pending lost. Confirm or cancel from the projects page.`
        : `Updated project "${project.project_name}"${statusChanged ? ` and moved it to ${PROJECT_STATUS_LABELS[input.status as ProjectWorkflowStatus] || input.status}` : ""}`,
    }
  }

  // ----- update_deal -----
  if (input.action === "update_deal") {
    if (!input.target_id) throw new Error("target_id required for update_deal")
    const deal = await getDealById(input.target_id)
    if (!deal) throw new Error(`Deal ${input.target_id} not found`)

    const updates: Partial<Deal> = { ...(coerceFields(input.fields, DEAL_FIELDS) as any), last_contact: today }
    const changed = Object.keys(updates).filter((k) => k !== "last_contact")
    let statusChanged = false
    if (input.status && input.status !== deal.status) {
      ;(updates as any).status = input.status
      statusChanged = true
    }
    if (input.note && input.note.trim()) updates.notes = appendNote(deal.notes, input.note)

    const updated = await updateDeal(deal.id, updates)
    if (!updated) throw new Error("Deal update failed")

    return {
      action: input.action,
      entity_type: "deal",
      entity_id: deal.id,
      entity_label: deal.event_title,
      changed_fields: changed,
      status_changed: statusChanged,
      message: `Updated deal "${deal.event_title}"${statusChanged ? ` and moved it to ${input.status}` : ""}`,
    }
  }

  // ----- create_deal -----
  if (input.action === "create_deal") {
    const f = coerceFields(input.fields, DEAL_FIELDS) as Record<string, any>
    const missing = ["client_name", "client_email", "company", "event_title", "event_date"].filter((k) => !f[k])
    if (missing.length) throw new Error(`Missing required deal fields: ${missing.join(", ")}`)

    const deal = await createDeal(
      {
        client_name: f.client_name,
        client_email: f.client_email,
        client_phone: f.client_phone || "",
        company: f.company,
        event_title: f.event_title,
        event_date: f.event_date,
        event_location: f.event_location || "TBD",
        event_type: f.event_type || "Keynote",
        speaker_requested: f.speaker_requested || undefined,
        attendee_count: f.attendee_count || 0,
        budget_range: f.budget_range || (f.deal_value ? `$${f.deal_value}` : "TBD"),
        deal_value: f.deal_value || 0,
        status: (input.status as DealStatus) || "lead",
        priority: "medium",
        source: "Email",
        notes: appendNote(null, input.note || input.email_summary || "Created from email digest"),
        last_contact: today,
        next_follow_up: f.next_follow_up || undefined,
        travel_required: f.travel_required || false,
      } as any,
      input.is_demo || false,
    )
    if (!deal) throw new Error("Deal creation failed")

    return {
      action: input.action,
      entity_type: "deal",
      entity_id: deal.id,
      entity_label: deal.event_title,
      changed_fields: Object.keys(f),
      status_changed: false,
      message: `Added deal "${deal.event_title}" to the CRM as ${deal.status}`,
    }
  }

  // ----- create_project -----
  if (input.action === "create_project") {
    const f = coerceFields(input.fields, PROJECT_FIELDS) as Record<string, any>
    const missing = ["client_name", "event_name"].filter((k) => !f[k])
    if (missing.length) throw new Error(`Missing required project fields: ${missing.join(", ")}`)

    const { event_name, budget, ...rest } = f
    const project = await createProject(
      {
        ...rest,
        project_name: event_name,
        event_name,
        client_name: f.client_name,
        project_type: f.event_type || "Speaking",
        status: (input.status as any) || "qualified",
        priority: "medium",
        start_date: today,
        deadline: f.event_date || undefined,
        budget: budget || 0,
        spent: 0,
        completion_percentage: 0,
        notes: appendNote(null, input.note || input.email_summary || "Created from email digest"),
        tags: ["email-digest"],
      } as any,
      input.is_demo || false,
    )
    if (!project) throw new Error("Project creation failed")

    // createProject only inserts the core columns; push the rest through update.
    const extra = Object.fromEntries(Object.entries(rest).filter(([k]) => !["client_name", "client_email", "client_phone", "company", "event_date", "event_location", "event_type", "attendee_count", "speaker_fee", "requested_speaker_name"].includes(k)))
    if (Object.keys(extra).length) await updateProject(project.id, extra as any)

    return {
      action: input.action,
      entity_type: "project",
      entity_id: project.id,
      entity_label: project.project_name,
      changed_fields: Object.keys(f),
      status_changed: false,
      message: `Created project "${project.project_name}" at ${PROJECT_STATUS_LABELS[project.status as ProjectWorkflowStatus] || project.status}`,
    }
  }

  throw new Error(`Unknown action ${input.action}`)
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, Sparkles, AlertTriangle, CheckCircle2, ExternalLink, ArrowLeft } from "lucide-react"
import { authGet, authPost } from "@/lib/auth-fetch"

// Mirrors the shapes returned by /api/admin/email-digest
type DigestAction = "update_project" | "update_deal" | "create_project" | "create_deal" | "no_action"

interface FieldDef {
  key: string
  label: string
  type: "string" | "number" | "boolean" | "date" | "enum"
  options?: string[]
}

interface Candidate {
  id: number
  label: string
  status: string
  prematch: string | null
}

interface Analysis {
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
  proposed_project_status: string | null
  status_reasoning: string | null
  proposed_deal_fields: Record<string, string | number | boolean | null>
  proposed_deal_status: string | null
  note_to_append: string | null
  follow_ups: string[]
}

interface AnalyzeResponse {
  analysis: Analysis
  snapshot: Record<string, any> | null
  candidates: { projects: Candidate[]; deals: Candidate[] }
  meta: {
    projectFields: FieldDef[]
    dealFields: FieldDef[]
    projectStatuses: Array<{ value: string; label: string }>
    dealStatuses: string[]
  }
}

interface ApplyResult {
  action: DigestAction
  entity_type: "project" | "deal" | null
  entity_id: number | null
  entity_label: string | null
  changed_fields: string[]
  status_changed: boolean
  message: string
}

interface FieldRow {
  include: boolean
  value: string
}

interface EmailDigestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplied?: (result: ApplyResult) => void
}

const ACTION_LABELS: Record<DigestAction, string> = {
  update_project: "Update existing project",
  update_deal: "Update existing deal",
  create_project: "Create new project",
  create_deal: "Add to CRM (new deal)",
  no_action: "No action",
}

const REQUIRED_CREATE: Record<"project" | "deal", string[]> = {
  project: ["client_name", "event_name"],
  deal: ["client_name", "client_email", "company", "event_title", "event_date"],
}

function toInputString(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "boolean") return v ? "true" : "false"
  return String(v)
}

function sameValue(a: unknown, b: unknown): boolean {
  return toInputString(a).trim().toLowerCase() === toInputString(b).trim().toLowerCase()
}

export function EmailDigestDialog({ open, onOpenChange, onApplied }: EmailDigestDialogProps) {
  const router = useRouter()
  const [emailText, setEmailText] = useState("")
  const [phase, setPhase] = useState<"input" | "review" | "done">("input")
  const [analyzing, setAnalyzing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<AnalyzeResponse | null>(null)
  const [action, setAction] = useState<DigestAction>("no_action")
  const [targetId, setTargetId] = useState<number | null>(null)
  const [snapshot, setSnapshot] = useState<Record<string, any> | null>(null)
  const [loadingSnapshot, setLoadingSnapshot] = useState(false)
  const [fields, setFields] = useState<Record<string, FieldRow>>({})
  const [applyStatus, setApplyStatus] = useState(false)
  const [statusValue, setStatusValue] = useState<string>("")
  const [includeNote, setIncludeNote] = useState(true)
  const [note, setNote] = useState("")
  const [result, setResult] = useState<ApplyResult | null>(null)

  const entityType: "project" | "deal" | null = useMemo(() => {
    if (action === "update_project" || action === "create_project") return "project"
    if (action === "update_deal" || action === "create_deal") return "deal"
    return null
  }, [action])

  const isUpdate = action === "update_project" || action === "update_deal"
  const isCreate = action === "create_project" || action === "create_deal"

  const fieldDefs: FieldDef[] = useMemo(() => {
    if (!data || !entityType) return []
    return entityType === "project" ? data.meta.projectFields : data.meta.dealFields
  }, [data, entityType])

  const candidates: Candidate[] = useMemo(() => {
    if (!data || !entityType) return []
    return entityType === "project" ? data.candidates.projects : data.candidates.deals
  }, [data, entityType])

  const statusOptions = useMemo(() => {
    if (!data || !entityType) return [] as Array<{ value: string; label: string }>
    return entityType === "project"
      ? data.meta.projectStatuses
      : data.meta.dealStatuses.map((s) => ({ value: s, label: s }))
  }, [data, entityType])

  const resetAll = () => {
    setEmailText("")
    setPhase("input")
    setError(null)
    setData(null)
    setAction("no_action")
    setTargetId(null)
    setSnapshot(null)
    setFields({})
    setApplyStatus(false)
    setStatusValue("")
    setIncludeNote(true)
    setNote("")
    setResult(null)
  }

  // Rebuild the field rows whenever the action, target snapshot, or analysis changes
  useEffect(() => {
    if (!data || !entityType) {
      setFields({})
      return
    }
    const proposed = entityType === "project" ? data.analysis.proposed_project_fields : data.analysis.proposed_deal_fields
    const defs = entityType === "project" ? data.meta.projectFields : data.meta.dealFields
    const next: Record<string, FieldRow> = {}
    for (const def of defs) {
      const p = proposed[def.key]
      const hasProposal = p !== null && p !== undefined && p !== ""
      const required = isCreate && REQUIRED_CREATE[entityType].includes(def.key)
      if (!hasProposal && !required) continue
      const current = snapshot ? snapshot[def.key] : null
      const differs = !isUpdate || !sameValue(current, p)
      next[def.key] = { include: hasProposal && differs, value: toInputString(p) }
    }
    setFields(next)

    const proposedStatus = entityType === "project" ? data.analysis.proposed_project_status : data.analysis.proposed_deal_status
    const currentStatus = snapshot?.status
    setStatusValue(proposedStatus || "")
    setApplyStatus(!!proposedStatus && (!isUpdate || proposedStatus !== currentStatus))
  }, [data, entityType, snapshot, isCreate, isUpdate])

  // Load the current record when the target changes (so current vs proposed is accurate)
  useEffect(() => {
    if (!isUpdate || !entityType || !targetId) {
      setSnapshot(null)
      return
    }
    if (data?.snapshot && data.snapshot.id === targetId && data.analysis.match.entity_type === entityType) {
      setSnapshot(data.snapshot)
      return
    }
    let cancelled = false
    setLoadingSnapshot(true)
    authGet(`/api/admin/email-digest?type=${entityType}&id=${targetId}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setSnapshot(j.snapshot || null)
      })
      .catch(() => {
        if (!cancelled) setSnapshot(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingSnapshot(false)
      })
    return () => {
      cancelled = true
    }
  }, [isUpdate, entityType, targetId, data])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await authPost("/api/admin/email-digest", { emailText })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.details || json.error || "Analysis failed")
      }
      const resp = json as AnalyzeResponse
      setData(resp)
      setAction(resp.analysis.recommended_action)
      setTargetId(resp.analysis.match.entity_id)
      setSnapshot(resp.snapshot)
      setNote(resp.analysis.note_to_append || "")
      setIncludeNote(!!resp.analysis.note_to_append)
      setPhase("review")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApply = async () => {
    if (!data) return
    setApplying(true)
    setError(null)
    try {
      const chosenFields: Record<string, string | number | boolean | null> = {}
      for (const [key, row] of Object.entries(fields)) {
        if (!row.include) continue
        const def = fieldDefs.find((d) => d.key === key)
        const raw = row.value.trim()
        if (raw === "") continue
        if (def?.type === "boolean") chosenFields[key] = raw === "true"
        else if (def?.type === "number") chosenFields[key] = parseFloat(raw.replace(/[^0-9.-]/g, ""))
        else chosenFields[key] = raw
      }

      const res = await authPost("/api/admin/email-digest/apply", {
        action,
        target_id: isUpdate ? targetId : null,
        fields: chosenFields,
        status: applyStatus && statusValue ? statusValue : null,
        status_reasoning: data.analysis.status_reasoning,
        note: includeNote && note.trim() ? note.trim() : null,
        email_summary: data.analysis.email_summary,
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Apply failed")
      setResult(json.result)
      setPhase("done")
      onApplied?.(json.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed")
    } finally {
      setApplying(false)
    }
  }

  const missingRequired = isCreate && entityType
    ? REQUIRED_CREATE[entityType].filter((k) => !fields[k]?.include || !fields[k]?.value.trim())
    : []

  const canApply =
    action === "no_action" ||
    (isUpdate && !!targetId && !loadingSnapshot) ||
    (isCreate && missingRequired.length === 0)

  const confidenceColor = {
    high: "bg-green-100 text-green-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-red-100 text-red-800",
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAll()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Digester
          </DialogTitle>
          <DialogDescription>
            Paste one email. It will be matched to an open project or deal and turned into a proposed update, a new project, or a new CRM deal. Nothing is saved until you click Apply.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ---------------- Phase 1: paste ---------------- */}
        {phase === "input" && (
          <div className="space-y-4">
            <Textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder={"Paste the email here, including the From / Subject / Date lines if you have them."}
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{emailText.length.toLocaleString()} characters</span>
              <Button onClick={handleAnalyze} disabled={analyzing || emailText.trim().length < 20}>
                {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {analyzing ? "Analyzing..." : "Analyze email"}
              </Button>
            </div>
          </div>
        )}

        {/* ---------------- Phase 2: review ---------------- */}
        {phase === "review" && data && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {data.analysis.sender.name || data.analysis.sender.email || "Unknown sender"}
                  {data.analysis.sender.company ? ` · ${data.analysis.sender.company}` : ""}
                </Badge>
                {!data.analysis.is_business_relevant && (
                  <Badge className="bg-gray-200 text-gray-700">Not business relevant</Badge>
                )}
                {data.analysis.match.entity_type !== "none" && (
                  <Badge className={confidenceColor[data.analysis.match.confidence]}>
                    {data.analysis.match.confidence} confidence match
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-800">{data.analysis.email_summary}</p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Why:</span> {data.analysis.action_reasoning}
              </p>
            </div>

            {/* Action + target */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Action</Label>
                <Select value={action} onValueChange={(v) => setAction(v as DigestAction)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACTION_LABELS) as DigestAction[]).map((a) => (
                      <SelectItem key={a} value={a}>
                        {ACTION_LABELS[a]}
                        {a === data.analysis.recommended_action ? " (recommended)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isUpdate && (
                <div className="space-y-1.5">
                  <Label>{entityType === "project" ? "Project" : "Deal"} to update</Label>
                  <Select value={targetId ? String(targetId) : ""} onValueChange={(v) => setTargetId(parseInt(v, 10))}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Choose a ${entityType}`} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {candidates.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.prematch ? "★ " : ""}
                          {c.label} · {c.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {data.analysis.match.reasoning && (
                    <p className="text-xs text-gray-600">{data.analysis.match.reasoning}</p>
                  )}
                  {data.analysis.match.alternatives.length > 0 && (
                    <div className="text-xs text-gray-600">
                      Also possible:{" "}
                      {data.analysis.match.alternatives.map((alt) => (
                        <button
                          key={`${alt.entity_type}-${alt.entity_id}`}
                          type="button"
                          className="underline mr-2"
                          title={alt.reason}
                          onClick={() => {
                            setAction(alt.entity_type === "project" ? "update_project" : "update_deal")
                            setTargetId(alt.entity_id)
                          }}
                        >
                          {alt.entity_type} #{alt.entity_id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fields */}
            {entityType && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isCreate ? "New record details" : "Proposed field changes"}</Label>
                  {loadingSnapshot && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> loading current values
                    </span>
                  )}
                </div>
                {Object.keys(fields).length === 0 ? (
                  <p className="text-sm text-gray-500 rounded-md border border-dashed p-3">
                    No field values were found in this email.
                  </p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-600">
                        <tr>
                          <th className="w-8 p-2"></th>
                          <th className="text-left p-2">Field</th>
                          {isUpdate && <th className="text-left p-2">Current</th>}
                          <th className="text-left p-2">{isUpdate ? "Proposed" : "Value"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fieldDefs
                          .filter((d) => fields[d.key])
                          .map((def) => {
                            const row = fields[def.key]
                            const current = snapshot ? snapshot[def.key] : null
                            const required = isCreate && entityType && REQUIRED_CREATE[entityType].includes(def.key)
                            const unchanged = isUpdate && sameValue(current, row.value)
                            return (
                              <tr key={def.key} className={`border-t ${row.include ? "" : "opacity-60"}`}>
                                <td className="p-2 align-middle">
                                  <Checkbox
                                    checked={row.include}
                                    onCheckedChange={(c) =>
                                      setFields((prev) => ({ ...prev, [def.key]: { ...prev[def.key], include: c === true } }))
                                    }
                                  />
                                </td>
                                <td className="p-2 align-middle whitespace-nowrap">
                                  {def.label}
                                  {required && <span className="text-red-600 ml-1">*</span>}
                                </td>
                                {isUpdate && (
                                  <td className="p-2 align-middle text-gray-500 max-w-[200px] truncate" title={toInputString(current)}>
                                    {toInputString(current) || <span className="italic">empty</span>}
                                  </td>
                                )}
                                <td className="p-2 align-middle">
                                  {def.type === "boolean" || def.type === "enum" ? (
                                    <Select
                                      value={row.value}
                                      onValueChange={(v) => setFields((prev) => ({ ...prev, [def.key]: { ...prev[def.key], value: v } }))}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(def.type === "boolean" ? ["true", "false"] : def.options || []).map((o) => (
                                          <SelectItem key={o} value={o}>
                                            {o}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      className={`h-8 ${unchanged ? "text-gray-400" : ""}`}
                                      type={def.type === "date" ? "date" : "text"}
                                      value={row.value}
                                      onChange={(e) =>
                                        setFields((prev) => ({ ...prev, [def.key]: { ...prev[def.key], value: e.target.value } }))
                                      }
                                    />
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
                {missingRequired.length > 0 && (
                  <p className="text-xs text-red-600">
                    Required before creating: {missingRequired.map((k) => fieldDefs.find((d) => d.key === k)?.label || k).join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Status */}
            {entityType && statusOptions.length > 0 && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <Checkbox checked={applyStatus} onCheckedChange={(c) => setApplyStatus(c === true)} />
                  <Label className="whitespace-nowrap">
                    {isCreate ? "Starting stage" : "Move stage"}
                    {isUpdate && snapshot?.status ? ` (currently ${snapshot.status})` : ""}
                  </Label>
                  <Select value={statusValue} onValueChange={setStatusValue}>
                    <SelectTrigger className="h-8 w-56">
                      <SelectValue placeholder="No change" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {data.analysis.status_reasoning && (
                  <p className="text-xs text-gray-600">{data.analysis.status_reasoning}</p>
                )}
                {entityType === "project" && applyStatus && statusValue === "lost" && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    The project will be moved to <strong>Pending Lost</strong>. Confirm or cancel it from the projects page.
                  </p>
                )}
              </div>
            )}

            {/* Note */}
            {action !== "no_action" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={includeNote} onCheckedChange={(c) => setIncludeNote(c === true)} />
                  <Label>Append to notes</Label>
                </div>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[70px] text-sm" />
              </div>
            )}

            {/* Follow-ups */}
            {data.analysis.follow_ups.length > 0 && (
              <div className="text-sm">
                <Label>Suggested follow-ups</Label>
                <ul className="list-disc pl-5 mt-1 text-gray-700 space-y-0.5">
                  {data.analysis.follow_ups.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <Button variant="ghost" onClick={() => setPhase("input")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Edit email
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApply} disabled={!canApply || applying}>
                  {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {action === "no_action" ? "Close without changes" : `Apply: ${ACTION_LABELS[action]}`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Phase 3: done ---------------- */}
        {phase === "done" && result && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900">{result.message}</p>
                {result.changed_fields.length > 0 && (
                  <p className="text-green-800 mt-1">Fields set: {result.changed_fields.join(", ")}</p>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetAll}>
                Digest another email
              </Button>
              <div className="flex gap-2">
                {result.entity_type === "project" && result.entity_id && (
                  <Button variant="outline" onClick={() => router.push(`/admin/projects/${result.entity_id}/edit`)}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Open project
                  </Button>
                )}
                {result.entity_type === "deal" && (
                  <Button variant="outline" onClick={() => router.push("/admin/crm")}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Open CRM
                  </Button>
                )}
                <Button onClick={() => onOpenChange(false)}>Done</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

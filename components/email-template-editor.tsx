"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Eye, EyeOff, Code, Type, Plus, Trash2, ArrowUp, ArrowDown,
  Info, Loader2, Save, GripVertical, AlertTriangle, RotateCcw
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface EmailTemplate {
  id?: number
  template_key: string
  subject: string
  body_html: string
  updated_at?: string
}

interface VisualContent {
  greeting: string
  blocks: ContentBlock[]
  buttonText: string
  buttonNote: string
  expiryNote: string
  contactEmail: string
  signOffName: string
}

type ContentBlock =
  | { type: "paragraph"; id: string; text: string }
  | { type: "rejection_block"; id: string }

interface EmailTemplateEditorProps {
  template: EmailTemplate
  onTemplateChange: (template: EmailTemplate) => void
  onSave: (template: EmailTemplate) => void
  saving: boolean
  templateType: "approved" | "rejected"
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const APPROVED_VARIABLES = [
  { label: "First Name", value: "{{first_name}}" },
  { label: "Last Name", value: "{{last_name}}" },
  { label: "Email", value: "{{email}}" },
  { label: "Company", value: "{{company}}" },
  { label: "Title", value: "{{title}}" },
  { label: "Invite URL", value: "{{invite_url}}" },
]

const REJECTED_VARIABLES = [
  { label: "First Name", value: "{{first_name}}" },
  { label: "Last Name", value: "{{last_name}}" },
  { label: "Email", value: "{{email}}" },
  { label: "Company", value: "{{company}}" },
  { label: "Title", value: "{{title}}" },
  { label: "Rejection Reason", value: "{{rejection_reason}}" },
]

const SAMPLE_DATA: Record<string, string> = {
  "{{first_name}}": "John",
  "{{last_name}}": "Smith",
  "{{email}}": "john.smith@example.com",
  "{{company}}": "Acme Technology Corp",
  "{{title}}": "Director of AI",
  "{{invite_url}}": "https://speakabout.ai/invite/sample-token-12345",
  "{{rejection_reason}}": "We are currently at capacity for speakers in your topic area.",
  "{{rejection_reason_block}}": `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;"><p style="color: #92400e; font-size: 14px; margin: 0;"><strong>Reason:</strong> We are currently at capacity for speakers in your topic area.</p></div>`,
}

// ─── Utility Functions ─────────────────────────────────────────────────────────

let _blockId = 0
function nextId() {
  return `blk-${++_blockId}-${Date.now()}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function textToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br>")
}

function buildTemplateHtml(content: VisualContent, type: "approved" | "rejected"): string {
  let bodyHtml = ""
  for (const block of content.blocks) {
    if (block.type === "paragraph") {
      bodyHtml += `    <p style="color: #4b5563; font-size: 16px;">${textToHtml(block.text)}</p>\n`
    } else if (block.type === "rejection_block") {
      bodyHtml += `    {{rejection_reason_block}}\n`
    }
  }

  let buttonSection = ""
  if (type === "approved" && content.buttonText) {
    buttonSection = `    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invite_url}}" style="display: inline-block; background: #1E68C6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${escapeHtml(content.buttonText)}</a>
    </div>
    <p style="color: #6b7280; font-size: 14px; text-align: center;">${escapeHtml(content.buttonNote)}</p>\n`
  }

  let expirySection = ""
  if (type === "approved" && content.expiryNote) {
    expirySection = `    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;"><strong>Important:</strong> ${escapeHtml(content.expiryNote)}</p>\n`
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1E68C6; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <img src="https://speakabout.ai/speak-about-ai-dark-logo.png" alt="Speak About AI" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">${escapeHtml(content.greeting)}</h2>
${bodyHtml}${buttonSection}${expirySection}    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #6b7280; font-size: 14px;">Questions? Reach out at <a href="mailto:${escapeHtml(content.contactEmail)}" style="color: #1E68C6;">${escapeHtml(content.contactEmail)}</a></p>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Best regards,<br><strong>${escapeHtml(content.signOffName)}</strong></p>
  </div>
</body>
</html>`
}

function parseTemplateHtml(html: string, type: "approved" | "rejected"): VisualContent | null {
  try {
    const greetingMatch = html.match(/<h2[^>]*>(.*?)<\/h2>/s)
    const greeting = greetingMatch
      ? greetingMatch[1].replace(/<[^>]+>/g, "").trim()
      : `Dear {{first_name}} {{last_name}},`

    const bodySection = html.match(/<\/h2>([\s\S]*?)<hr/)?.[1] || ""

    const blocks: ContentBlock[] = []
    // Split body into segments and identify paragraphs vs rejection block
    const segments = bodySection.split(/({{rejection_reason_block}})/)
    let pIdx = 0
    for (const segment of segments) {
      if (segment.trim() === "{{rejection_reason_block}}") {
        blocks.push({ type: "rejection_block", id: nextId() })
      } else {
        const pMatches = segment.matchAll(/<p\s+style="[^"]*color:\s*#4b5563[^"]*"[^>]*>([\s\S]*?)<\/p>/g)
        for (const m of pMatches) {
          const text = m[1]
            .replace(/<br\s*\/?>/g, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim()
          if (text) {
            blocks.push({ type: "paragraph", id: nextId(), text })
            pIdx++
          }
        }
      }
    }

    // For rejected templates, ensure rejection block exists
    if (type === "rejected" && !blocks.some(b => b.type === "rejection_block")) {
      // Insert after 2nd paragraph or at end
      const insertIdx = Math.min(2, blocks.length)
      blocks.splice(insertIdx, 0, { type: "rejection_block", id: nextId() })
    }

    let buttonText = "Create Your Account"
    let buttonNote = "Or copy and paste this link: {{invite_url}}"
    let expiryNote = "This invitation link will expire in 7 days."

    const btnMatch = bodySection.match(/<a[^>]*gradient[^>]*>([\s\S]*?)<\/a>/)
    if (btnMatch) buttonText = btnMatch[1].replace(/<[^>]+>/g, "").trim()

    const noteMatch = bodySection.match(/<p[^>]*text-align:\s*center[^>]*>([\s\S]*?)<\/p>/g)
    if (noteMatch) {
      for (const n of noteMatch) {
        const text = n.replace(/<[^>]+>/g, "").trim()
        if (text.includes("copy and paste") || text.includes("invite_url") || text.includes("{{invite_url}}")) {
          buttonNote = text
        }
      }
    }

    const expiryMatch = bodySection.match(/<strong>Important:<\/strong>\s*([\s\S]*?)<\/p>/)
    if (expiryMatch) expiryNote = expiryMatch[1].replace(/<[^>]+>/g, "").trim()

    let contactEmail = "hello@speakabout.ai"
    const contactMatch = html.match(/mailto:([\w@.]+)/)
    if (contactMatch) contactEmail = contactMatch[1]

    let signOffName = "The Speak About AI Team"
    const signOffMatch = html.match(/Best regards,[\s\S]*?<strong>([\s\S]*?)<\/strong>/)
    if (signOffMatch) signOffName = signOffMatch[1].replace(/<[^>]+>/g, "").trim()

    if (blocks.filter(b => b.type === "paragraph").length === 0) return null

    return { greeting, blocks, buttonText, buttonNote, expiryNote, contactEmail, signOffName }
  } catch {
    return null
  }
}

function getDefaultVisualContent(type: "approved" | "rejected"): VisualContent {
  if (type === "approved") {
    return {
      greeting: "Dear {{first_name}} {{last_name}},",
      blocks: [
        { type: "paragraph", id: nextId(), text: "Congratulations! Your application to join Speak About AI has been approved." },
        { type: "paragraph", id: nextId(), text: "We are excited to welcome you to our exclusive network of AI and technology thought leaders." },
        { type: "paragraph", id: nextId(), text: "Please click the button below to create your speaker account:" },
      ],
      buttonText: "Create Your Account",
      buttonNote: "Or copy and paste this link: {{invite_url}}",
      expiryNote: "This invitation link will expire in 7 days.",
      contactEmail: "hello@speakabout.ai",
      signOffName: "The Speak About AI Team",
    }
  }
  return {
    greeting: "Dear {{first_name}} {{last_name}},",
    blocks: [
      { type: "paragraph", id: nextId(), text: "Thank you for your interest in joining Speak About AI and for taking the time to submit your application." },
      { type: "paragraph", id: nextId(), text: "After careful review, we regret to inform you that we are unable to accept your application at this time." },
      { type: "rejection_block", id: nextId() },
      { type: "paragraph", id: nextId(), text: "We encourage you to continue developing your speaking career and welcome you to reapply in the future." },
      { type: "paragraph", id: nextId(), text: "We wish you the very best in your professional endeavors." },
    ],
    buttonText: "",
    buttonNote: "",
    expiryNote: "",
    contactEmail: "hello@speakabout.ai",
    signOffName: "The Speak About AI Team",
  }
}

function getPreviewHtml(html: string): string {
  let result = html
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    result = result.split(key).join(value)
  }
  return result
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function EmailTemplateEditor({
  template,
  onTemplateChange,
  onSave,
  saving,
  templateType,
}: EmailTemplateEditorProps) {
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual")
  const [showPreview, setShowPreview] = useState(false)
  const [visualContent, setVisualContent] = useState<VisualContent>(() =>
    parseTemplateHtml(template.body_html, templateType) || getDefaultVisualContent(templateType)
  )
  const [parseWarning, setParseWarning] = useState(false)
  const lastFocusedField = useRef<string>("greeting")
  const variables = templateType === "approved" ? APPROVED_VARIABLES : REJECTED_VARIABLES

  const updateVisual = useCallback((newContent: VisualContent) => {
    setVisualContent(newContent)
    const newHtml = buildTemplateHtml(newContent, templateType)
    onTemplateChange({ ...template, body_html: newHtml })
  }, [template, templateType, onTemplateChange])

  const handleModeSwitch = useCallback((mode: "visual" | "html") => {
    if (mode === "visual" && editorMode === "html") {
      const parsed = parseTemplateHtml(template.body_html, templateType)
      if (parsed) {
        setVisualContent(parsed)
        setParseWarning(false)
      } else {
        setParseWarning(true)
      }
    }
    setEditorMode(mode)
  }, [editorMode, template.body_html, templateType])

  const handleInsertVariable = useCallback((variable: string) => {
    if (editorMode === "html") {
      onTemplateChange({ ...template, body_html: template.body_html + variable })
      return
    }
    const key = lastFocusedField.current
    if (key === "subject") {
      onTemplateChange({ ...template, subject: template.subject + variable })
    } else if (key === "greeting") {
      updateVisual({ ...visualContent, greeting: visualContent.greeting + variable })
    } else if (key.startsWith("paragraph-")) {
      const idx = parseInt(key.split("-")[1])
      const newBlocks = visualContent.blocks.map(b => ({ ...b }))
      const paragraphs = newBlocks.filter((b): b is ContentBlock & { type: "paragraph" } => b.type === "paragraph")
      if (paragraphs[idx]) {
        paragraphs[idx].text += variable
      }
      updateVisual({ ...visualContent, blocks: newBlocks })
    } else if (key === "buttonText") {
      updateVisual({ ...visualContent, buttonText: visualContent.buttonText + variable })
    } else if (key === "contactEmail") {
      updateVisual({ ...visualContent, contactEmail: visualContent.contactEmail + variable })
    } else if (key === "signOffName") {
      updateVisual({ ...visualContent, signOffName: visualContent.signOffName + variable })
    }
  }, [editorMode, template, visualContent, updateVisual, onTemplateChange])

  // Block management
  const addParagraph = useCallback((afterIndex?: number) => {
    const newBlock: ContentBlock = { type: "paragraph", id: nextId(), text: "" }
    const newBlocks = [...visualContent.blocks]
    if (afterIndex !== undefined) {
      newBlocks.splice(afterIndex + 1, 0, newBlock)
    } else {
      // Add before the last non-paragraph block or at end
      newBlocks.push(newBlock)
    }
    updateVisual({ ...visualContent, blocks: newBlocks })
  }, [visualContent, updateVisual])

  const removeBlock = useCallback((blockId: string) => {
    const block = visualContent.blocks.find(b => b.id === blockId)
    if (block?.type === "rejection_block") return // Can't remove rejection block
    const newBlocks = visualContent.blocks.filter(b => b.id !== blockId)
    if (newBlocks.filter(b => b.type === "paragraph").length === 0) return // Keep at least one
    updateVisual({ ...visualContent, blocks: newBlocks })
  }, [visualContent, updateVisual])

  const moveBlock = useCallback((blockId: string, direction: "up" | "down") => {
    const idx = visualContent.blocks.findIndex(b => b.id === blockId)
    if (idx === -1) return
    const newIdx = direction === "up" ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= visualContent.blocks.length) return
    const newBlocks = [...visualContent.blocks]
    ;[newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]]
    updateVisual({ ...visualContent, blocks: newBlocks })
  }, [visualContent, updateVisual])

  const updateParagraphText = useCallback((blockId: string, text: string) => {
    const newBlocks = visualContent.blocks.map(b =>
      b.id === blockId && b.type === "paragraph" ? { ...b, text } : { ...b }
    )
    updateVisual({ ...visualContent, blocks: newBlocks })
  }, [visualContent, updateVisual])

  const handleResetToDefault = useCallback(() => {
    const defaults = getDefaultVisualContent(templateType)
    setVisualContent(defaults)
    const newHtml = buildTemplateHtml(defaults, templateType)
    onTemplateChange({ ...template, body_html: newHtml })
    setParseWarning(false)
  }, [templateType, template, onTemplateChange])

  const previewHtml = useMemo(() => getPreviewHtml(template.body_html), [template.body_html])

  // Track paragraph index for focused field
  const getParagraphIndex = (blockId: string): number => {
    const paragraphs = visualContent.blocks.filter(b => b.type === "paragraph")
    return paragraphs.findIndex(b => b.id === blockId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {templateType === "approved" ? "Approved Application Letter" : "Rejected Application Letter"}
        </CardTitle>
        <CardDescription>
          {templateType === "approved"
            ? "This email is sent when a speaker application is approved. It includes the account creation link."
            : "This email is sent when a speaker application is rejected."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Subject */}
        <div>
          <Label htmlFor={`${templateType}-subject`}>Email Subject</Label>
          <Input
            id={`${templateType}-subject`}
            value={template.subject}
            onChange={(e) => onTemplateChange({ ...template, subject: e.target.value })}
            onFocus={() => { lastFocusedField.current = "subject" }}
            placeholder="Enter email subject..."
          />
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => handleModeSwitch("visual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                editorMode === "visual"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              Visual Editor
            </button>
            <button
              onClick={() => handleModeSwitch("html")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-l ${
                editorMode === "html"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              HTML Source
            </button>
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1.5"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
        </div>

        {/* Variable Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Insert variable:</span>
          {variables.map((v) => (
            <Badge
              key={v.value}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
              onClick={() => handleInsertVariable(v.value)}
            >
              {v.label}
            </Badge>
          ))}
        </div>

        {/* Parse Warning */}
        {parseWarning && editorMode === "visual" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Custom HTML detected</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>The template HTML couldn&apos;t be parsed into visual fields. You can reset to the standard layout or switch to HTML Source mode.</span>
              <Button variant="outline" size="sm" onClick={handleResetToDefault} className="ml-2 shrink-0">
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset Layout
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ─── Visual Editor ─── */}
        {editorMode === "visual" && !parseWarning && (
          <div className="space-y-4">
            {/* Greeting */}
            <div>
              <Label htmlFor={`${templateType}-greeting`} className="text-sm font-medium">Greeting</Label>
              <Input
                id={`${templateType}-greeting`}
                value={visualContent.greeting}
                onChange={(e) => updateVisual({ ...visualContent, greeting: e.target.value })}
                onFocus={() => { lastFocusedField.current = "greeting" }}
                placeholder='e.g. Dear {{first_name}} {{last_name}},'
              />
            </div>

            <Separator />

            {/* Content Blocks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Email Body</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addParagraph()}
                  className="gap-1 h-7 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Paragraph
                </Button>
              </div>
              <div className="space-y-2">
                {visualContent.blocks.map((block, idx) => {
                  if (block.type === "rejection_block") {
                    return (
                      <div
                        key={block.id}
                        className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                      >
                        <div className="flex flex-col gap-0.5">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveBlock(block.id, "up")} disabled={idx === 0}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveBlock(block.id, "down")} disabled={idx === visualContent.blocks.length - 1}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            Rejection Reason Block
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-500">
                            This section automatically shows the rejection reason when provided. You can drag it to reposition.
                          </p>
                        </div>
                      </div>
                    )
                  }

                  const pIndex = getParagraphIndex(block.id)
                  return (
                    <div key={block.id} className="flex gap-2 group">
                      <div className="flex flex-col items-center gap-0.5 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveBlock(block.id, "up")} disabled={idx === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveBlock(block.id, "down")} disabled={idx === visualContent.blocks.length - 1}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Paragraph {pIndex + 1}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => removeBlock(block.id)}
                            disabled={visualContent.blocks.filter(b => b.type === "paragraph").length <= 1}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <Textarea
                          value={block.text}
                          onChange={(e) => updateParagraphText(block.id, e.target.value)}
                          onFocus={() => { lastFocusedField.current = `paragraph-${pIndex}` }}
                          placeholder="Enter paragraph text..."
                          rows={2}
                          className="text-sm resize-y"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Button Section (Approved only) */}
            {templateType === "approved" && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Call-to-Action Button</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${templateType}-btntext`} className="text-xs text-muted-foreground">Button Text</Label>
                      <Input
                        id={`${templateType}-btntext`}
                        value={visualContent.buttonText}
                        onChange={(e) => updateVisual({ ...visualContent, buttonText: e.target.value })}
                        onFocus={() => { lastFocusedField.current = "buttonText" }}
                        placeholder="Create Your Account"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${templateType}-btnnote`} className="text-xs text-muted-foreground">Below-Button Note</Label>
                      <Input
                        id={`${templateType}-btnnote`}
                        value={visualContent.buttonNote}
                        onChange={(e) => updateVisual({ ...visualContent, buttonNote: e.target.value })}
                        placeholder="Or copy and paste this link..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`${templateType}-expiry`} className="text-xs text-muted-foreground">Expiry Note</Label>
                    <Input
                      id={`${templateType}-expiry`}
                      value={visualContent.expiryNote}
                      onChange={(e) => updateVisual({ ...visualContent, expiryNote: e.target.value })}
                      placeholder="This invitation link will expire in 7 days."
                    />
                  </div>
                </div>
              </>
            )}

            {/* Footer / Sign-off */}
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sign-off</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`${templateType}-contact`} className="text-xs text-muted-foreground">Contact Email</Label>
                  <Input
                    id={`${templateType}-contact`}
                    value={visualContent.contactEmail}
                    onChange={(e) => updateVisual({ ...visualContent, contactEmail: e.target.value })}
                    onFocus={() => { lastFocusedField.current = "contactEmail" }}
                    placeholder="hello@speakabout.ai"
                  />
                </div>
                <div>
                  <Label htmlFor={`${templateType}-signoff`} className="text-xs text-muted-foreground">Team / Sender Name</Label>
                  <Input
                    id={`${templateType}-signoff`}
                    value={visualContent.signOffName}
                    onChange={(e) => updateVisual({ ...visualContent, signOffName: e.target.value })}
                    onFocus={() => { lastFocusedField.current = "signOffName" }}
                    placeholder="The Speak About AI Team"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── HTML Source Editor ─── */}
        {editorMode === "html" && (
          <div>
            <Textarea
              value={template.body_html}
              onChange={(e) => onTemplateChange({ ...template, body_html: e.target.value })}
              onFocus={() => { lastFocusedField.current = "html" }}
              placeholder="Enter email HTML content..."
              rows={20}
              className="font-mono text-sm"
            />
          </div>
        )}

        {/* ─── Preview ─── */}
        {showPreview && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email Preview</span>
              <span className="text-xs text-muted-foreground">(sample data shown for variables)</span>
            </div>
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <iframe
                srcDoc={previewHtml}
                className="w-full border-0"
                style={{ height: "500px" }}
                title="Email preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}

        {/* Reset to default */}
        {editorMode === "visual" && !parseWarning && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleResetToDefault} className="text-xs text-muted-foreground gap-1">
              <RotateCcw className="h-3 w-3" />
              Reset to Default
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div>
          {template.updated_at && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(template.updated_at).toLocaleString()}
            </p>
          )}
        </div>
        <Button onClick={() => onSave(template)} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

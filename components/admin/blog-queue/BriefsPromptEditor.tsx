'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, RotateCcw, Info, ChevronDown, ChevronUp, Sliders, Search, Image } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface BriefsPromptEditorProps {
  settings: Record<string, string>
  onSave: (settings: Record<string, string>) => Promise<void>
  defaultPrompt: string
}

// Default body prompt for article drafts
const DEFAULT_BODY_PROMPT = `You are a senior content writer for Speak About AI, a premier AI keynote speakers bureau.
Write a complete blog post in markdown format based on the title and brief below.

Title: {title}

Brief:
{brief}

Requirements:
- Length: ~{article_length_min}-{article_length_max} words
- Use markdown ## for major sections (and ### for sub-sections if needed)
- Do NOT include the title as an H1 — start with an opening paragraph that hooks the reader
- Conversational but professional tone, like a knowledgeable colleague writing for event planners and business leaders
- Include concrete examples and specific actionable advice; avoid generic AI-thought-leadership filler
- No "In this article we will..." or "In conclusion..." style filler — just substantive content from the first sentence
- Use bold (**text**) sparingly to emphasize the most important takeaways
- Output the markdown body only — no preamble, no closing remarks, no meta-commentary

{formatting_rules}
`

// Default values for all settings
const DEFAULTS: Record<string, string> = {
  cta_ratio: '0.6',
  default_brief_count: '5',
  brief_length_min: '100',
  brief_length_max: '180',
  article_length_min: '1500',
  article_length_max: '1800',
  github_repo: '',
  briefs_prompt: '',
  enable_web_search: 'true',
  max_web_searches: '5',
  image_style_reference: '',
  image_style_description: '',
  // Draft settings
  draft_body_prompt: '',
  draft_formatting_rules: `Do NOT use horizontal rules (---) to separate sections. Use headings (## or ###) instead for visual breaks.
Do NOT use em-dashes (—) or en-dashes (–) in sentences. Restructure sentences to flow naturally without dashes.
Prefer commas, periods, or restructured clauses over parenthetical dash constructions.
Hyphenated compound words are fine (e.g., "decision-makers", "real-world", "AI-powered").`,
  draft_tone: 'Conversational but professional, like a knowledgeable colleague writing for event planners and business leaders',
  draft_avoid_phrases: `"In this article we will..."
"In conclusion..."
"Let's dive in..."
"Without further ado..."
Generic AI-thought-leadership filler`
}

export function BriefsPromptEditor({
  settings,
  onSave,
  defaultPrompt
}: BriefsPromptEditorProps) {
  const [currentSettings, setCurrentSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('parameters')

  useEffect(() => {
    // Initialize with settings or defaults
    setCurrentSettings({
      ...DEFAULTS,
      briefs_prompt: defaultPrompt,
      ...settings
    })
  }, [settings, defaultPrompt])

  const updateSetting = (key: string, value: string) => {
    setCurrentSettings(prev => {
      const updated = { ...prev, [key]: value }
      setHasChanges(true)
      return updated
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(currentSettings)
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  const handleResetPrompt = () => {
    updateSetting('briefs_prompt', defaultPrompt)
  }

  const ctaPercent = Math.round(parseFloat(currentSettings.cta_ratio || '0.6') * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            <span>Brief & Draft Generation Settings</span>
          </div>
          {hasChanges && (
            <span className="text-sm font-normal text-orange-600">
              Unsaved changes
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Configure parameters for generating briefs and drafting full articles with Claude
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="parameters">Briefs</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="prompt">Brief Prompt</TabsTrigger>
            <TabsTrigger value="image">Image Style</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="space-y-6">
            {/* CTA Ratio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cta_ratio">CTA Ratio</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="cta_ratio"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={currentSettings.cta_ratio || '0.6'}
                    onChange={(e) => updateSetting('cta_ratio', e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">
                    {ctaPercent}% of briefs will include CTA hooks
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Ratio of briefs that should include a speaker bureau CTA (0.0 to 1.0)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_brief_count">Default Brief Count</Label>
                <Input
                  id="default_brief_count"
                  type="number"
                  min="1"
                  max="20"
                  value={currentSettings.default_brief_count || '5'}
                  onChange={(e) => updateSetting('default_brief_count', e.target.value)}
                  className="w-24"
                />
                <p className="text-xs text-gray-500">
                  Default number of briefs to generate per batch
                </p>
              </div>
            </div>

            {/* Length Settings */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Length Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Brief Length (words)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="50"
                      max="500"
                      value={currentSettings.brief_length_min || '100'}
                      onChange={(e) => updateSetting('brief_length_min', e.target.value)}
                      className="w-24"
                      placeholder="Min"
                    />
                    <span className="text-gray-400">to</span>
                    <Input
                      type="number"
                      min="50"
                      max="500"
                      value={currentSettings.brief_length_max || '180'}
                      onChange={(e) => updateSetting('brief_length_max', e.target.value)}
                      className="w-24"
                      placeholder="Max"
                    />
                    <span className="text-sm text-gray-500">words per brief</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Article Length (words)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="500"
                      max="5000"
                      value={currentSettings.article_length_min || '1500'}
                      onChange={(e) => updateSetting('article_length_min', e.target.value)}
                      className="w-24"
                      placeholder="Min"
                    />
                    <span className="text-gray-400">to</span>
                    <Input
                      type="number"
                      min="500"
                      max="5000"
                      value={currentSettings.article_length_max || '1800'}
                      onChange={(e) => updateSetting('article_length_max', e.target.value)}
                      className="w-24"
                      placeholder="Max"
                    />
                    <span className="text-sm text-gray-500">words per article</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Topic Areas */}
            <div className="border-t pt-6">
              <Label htmlFor="topic_areas">Topic Areas</Label>
              <Textarea
                id="topic_areas"
                value={currentSettings.topic_areas || `AI in specific industries (healthcare, finance, manufacturing, retail, legal, education, real estate, media, hospitality, logistics)
Enterprise AI deployment, governance, organizational change management
AI for sales, marketing, customer service, HR/recruiting
Generative AI / AI agents / multi-modal AI applications
AI impact on jobs, hiring, talent strategy, reskilling
AI security, deepfakes, misinformation, brand protection
AI strategy and decision-making for executives and boards
AI in events, conferences, B2B marketing, demand generation
Recent breakthroughs or product/regulatory shifts
AI economics: compute costs, infrastructure, ROI, build-vs-buy
Practical AI adoption patterns: what's working vs. what's stalling`}
                onChange={(e) => updateSetting('topic_areas', e.target.value)}
                rows={8}
                className="mt-2 font-mono text-sm"
                placeholder="One topic area per line..."
              />
              <p className="text-xs text-gray-500 mt-1">
                One topic area per line. Briefs will rotate across these topics.
              </p>
            </div>

            {/* Avoid List */}
            <div className="border-t pt-6">
              <Label htmlFor="avoid_list">Topics to Avoid</Label>
              <Textarea
                id="avoid_list"
                value={currentSettings.avoid_list || `Duplicating angles from existing briefs
Vague AI-thought-leadership generalities without concrete specifics
Generic "what is AI" explainers
Overplayed framings (e.g., not "ChatGPT for business" but "Why ChatGPT-only deployments stall in enterprise")`}
                onChange={(e) => updateSetting('avoid_list', e.target.value)}
                rows={4}
                className="mt-2 font-mono text-sm"
                placeholder="Topics to avoid, one per line..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Topics and patterns to avoid when generating briefs
              </p>
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-6">
            {/* Draft Article Settings */}
            <div className="space-y-2">
              <Label className="font-medium">Article Draft Settings</Label>
              <p className="text-sm text-gray-500">
                Configure how full articles are drafted from briefs. These settings control the tone, formatting, and structure of generated articles.
              </p>
            </div>

            {/* Article Length */}
            <div className="space-y-4">
              <Label>Target Article Length (words)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="500"
                  max="5000"
                  value={currentSettings.article_length_min || '1500'}
                  onChange={(e) => updateSetting('article_length_min', e.target.value)}
                  className="w-24"
                  placeholder="Min"
                />
                <span className="text-gray-400">to</span>
                <Input
                  type="number"
                  min="500"
                  max="5000"
                  value={currentSettings.article_length_max || '1800'}
                  onChange={(e) => updateSetting('article_length_max', e.target.value)}
                  className="w-24"
                  placeholder="Max"
                />
                <span className="text-sm text-gray-500">words per article</span>
              </div>
            </div>

            {/* Tone */}
            <div className="border-t pt-6 space-y-2">
              <Label htmlFor="draft_tone">Writing Tone</Label>
              <Textarea
                id="draft_tone"
                value={currentSettings.draft_tone || 'Conversational but professional, like a knowledgeable colleague writing for event planners and business leaders'}
                onChange={(e) => updateSetting('draft_tone', e.target.value)}
                rows={2}
                className="font-mono text-sm"
                placeholder="Describe the desired writing tone..."
              />
              <p className="text-xs text-gray-500">
                Describe the voice and tone for article drafts
              </p>
            </div>

            {/* Formatting Rules */}
            <div className="border-t pt-6 space-y-2">
              <Label htmlFor="draft_formatting_rules">Formatting Rules</Label>
              <Textarea
                id="draft_formatting_rules"
                value={currentSettings.draft_formatting_rules || `Do NOT use horizontal rules (---) to separate sections. Use headings (## or ###) instead for visual breaks.
Do NOT use em-dashes (—) or en-dashes (–) in sentences. Restructure sentences to flow naturally without dashes.
Prefer commas, periods, or restructured clauses over parenthetical dash constructions.
Hyphenated compound words are fine (e.g., "decision-makers", "real-world", "AI-powered").`}
                onChange={(e) => updateSetting('draft_formatting_rules', e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="Formatting rules for article structure..."
              />
              <p className="text-xs text-gray-500">
                Rules for markdown formatting, punctuation, and structure. One rule per line.
              </p>
            </div>

            {/* Phrases to Avoid */}
            <div className="border-t pt-6 space-y-2">
              <Label htmlFor="draft_avoid_phrases">Phrases to Avoid</Label>
              <Textarea
                id="draft_avoid_phrases"
                value={currentSettings.draft_avoid_phrases || `"In this article we will..."
"In conclusion..."
"Let's dive in..."
"Without further ado..."
Generic AI-thought-leadership filler`}
                onChange={(e) => updateSetting('draft_avoid_phrases', e.target.value)}
                rows={5}
                className="font-mono text-sm"
                placeholder="Phrases and patterns to avoid in articles..."
              />
              <p className="text-xs text-gray-500">
                Common filler phrases and patterns the AI should avoid. One per line.
              </p>
            </div>

            {/* Custom Body Prompt */}
            <div className="border-t pt-6 space-y-2">
              <Label htmlFor="draft_body_prompt">Custom Draft Prompt (Advanced)</Label>
              <Textarea
                id="draft_body_prompt"
                value={currentSettings.draft_body_prompt || ''}
                onChange={(e) => updateSetting('draft_body_prompt', e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="Leave empty to use the default prompt with the above settings. Only fill this in if you want to completely override the draft generation prompt.

Available variables: {title}, {brief}, {article_length_min}, {article_length_max}, {formatting_rules}, {tone}, {avoid_phrases}"
              />
              <p className="text-xs text-gray-500">
                Leave empty to use the default prompt with settings above. Fill in to completely override.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4">
            <div>
              <Button
                variant="outline"
                size="sm"
                className="mb-4"
                onClick={() => setHelpOpen(!helpOpen)}
              >
                <Info className="h-4 w-4 mr-2" />
                Template Variables
                {helpOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
              {helpOpen && (
                <Alert className="mb-4">
                  <AlertDescription>
                    <p className="font-medium mb-2">Available template variables:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li><code className="bg-gray-100 px-1 rounded">{'{count}'}</code> - Number of briefs to generate</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{cta_count}'}</code> - Number of briefs with CTA hook</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{non_cta_count}'}</code> - Number of briefs without CTA</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{existing_briefs}'}</code> - Recent briefs for de-duplication</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{brief_length_min}'}</code> - Minimum brief length</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{brief_length_max}'}</code> - Maximum brief length</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{article_length_min}'}</code> - Minimum article length</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{article_length_max}'}</code> - Maximum article length</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{topic_areas}'}</code> - Topic areas list</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{avoid_list}'}</code> - Things to avoid</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <Label htmlFor="prompt">Full Prompt Template</Label>
              <Textarea
                id="prompt"
                value={currentSettings.briefs_prompt || defaultPrompt}
                onChange={(e) => updateSetting('briefs_prompt', e.target.value)}
                rows={25}
                className="mt-2 font-mono text-sm"
                placeholder="Enter the Claude prompt for generating briefs..."
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {(currentSettings.briefs_prompt || '').length} characters
                </p>
                <Button variant="outline" size="sm" onClick={handleResetPrompt}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-6">
            {/* Image Style Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <Label className="font-medium">Hero Image Generation</Label>
              </div>
              <p className="text-sm text-gray-500">
                Configure the style and look of generated blog hero images. Uses Gemini 3.1 Flash for image generation.
              </p>
            </div>

            {/* Style Reference Image */}
            <div className="space-y-2">
              <Label htmlFor="image_style_reference">Style Reference Image URL</Label>
              <Input
                id="image_style_reference"
                value={currentSettings.image_style_reference || ''}
                onChange={(e) => updateSetting('image_style_reference', e.target.value)}
                placeholder="https://example.com/style-reference.png"
                className="max-w-lg"
              />
              <p className="text-xs text-gray-500">
                URL to an image that represents the desired visual style. The AI will use this as a reference when generating hero images.
              </p>
              {currentSettings.image_style_reference && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <img
                    src={currentSettings.image_style_reference}
                    alt="Style reference preview"
                    className="max-w-xs max-h-32 rounded border object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Style Description */}
            <div className="border-t pt-6 space-y-2">
              <Label htmlFor="image_style_description">Image Style Description</Label>
              <Textarea
                id="image_style_description"
                value={currentSettings.image_style_description || ''}
                onChange={(e) => updateSetting('image_style_description', e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="Describe the visual style you want for blog hero images...

Example:
Modern, professional corporate style with clean lines. Use a navy blue and white color palette. Include subtle tech/AI visual elements like circuit patterns or neural network nodes. The overall feel should be sophisticated and trustworthy, suitable for a B2B audience of event planners and executives."
              />
              <p className="text-xs text-gray-500">
                Additional description to guide the AI when generating images. This is combined with each article's specific image prompt.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            {/* Web Search Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Label className="font-medium">Web Search Settings</Label>
              </div>
              <p className="text-sm text-gray-500">
                Claude can search the web to ground briefs in recent news and developments.
              </p>
              <div className="flex items-center justify-between max-w-md">
                <div className="space-y-0.5">
                  <Label htmlFor="enable_web_search">Enable Web Search</Label>
                  <p className="text-xs text-gray-500">
                    Allow Claude to search for recent AI news when generating briefs
                  </p>
                </div>
                <Switch
                  id="enable_web_search"
                  checked={(currentSettings.enable_web_search || 'true') === 'true'}
                  onCheckedChange={(checked) => updateSetting('enable_web_search', checked ? 'true' : 'false')}
                />
              </div>
              {(currentSettings.enable_web_search || 'true') === 'true' && (
                <div className="space-y-2">
                  <Label htmlFor="max_web_searches">Max Web Searches</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="max_web_searches"
                      type="number"
                      min="1"
                      max="10"
                      value={currentSettings.max_web_searches || '5'}
                      onChange={(e) => updateSetting('max_web_searches', e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">searches per generation</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Maximum number of web searches Claude can perform (1-10)
                  </p>
                </div>
              )}
            </div>

            {/* GitHub Repository */}
            <div className="border-t pt-6 space-y-2">
              <Label htmlFor="github_repo">GitHub Repository</Label>
              <Input
                id="github_repo"
                value={currentSettings.github_repo || ''}
                onChange={(e) => updateSetting('github_repo', e.target.value)}
                placeholder="owner/repo (e.g., robert-strong/Speak-About-AI-Blog)"
                className="max-w-md"
              />
              <p className="text-xs text-gray-500">
                Repository for workflow triggers (owner/repo format). Can also be set via GITHUB_REPO env var.
              </p>
            </div>

            {/* Web Search Queries */}
            <div className="border-t pt-6">
              <Label htmlFor="search_queries">Web Search Queries</Label>
              <Textarea
                id="search_queries"
                value={currentSettings.search_queries || `enterprise AI deployment 2026
recent AI product launches by major labs (OpenAI, Anthropic, Google, etc.)
AI regulation news and policy shifts
industry-specific AI applications (healthcare, finance, sales, manufacturing, etc.)
notable AI case studies, controversies, or research findings`}
                onChange={(e) => updateSetting('search_queries', e.target.value)}
                rows={5}
                className="mt-2 font-mono text-sm"
                placeholder="Search queries for grounding briefs in current events..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Example search queries Claude should use to ground briefs in recent news (one per line)
              </p>
            </div>

            {/* Brief Requirements */}
            <div className="border-t pt-6">
              <Label htmlFor="brief_requirements">Brief Requirements</Label>
              <Textarea
                id="brief_requirements"
                value={currentSettings.brief_requirements || `Cover a different angle on AI today or the near future (next 6-12 months)
Reference at least one specific real-world example, recent news event, company, product launch, or research finding
Provide enough specificity that a writer can produce a full article from the brief alone
Each brief must explicitly name: target audience, specific angle/thesis, 3-5 sub-topics, 2-3 concrete examples
Identify 2-3 SEO target keyword phrases (long-tail)`}
                onChange={(e) => updateSetting('brief_requirements', e.target.value)}
                rows={6}
                className="mt-2 font-mono text-sm"
                placeholder="Requirements for each brief..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Requirements each generated brief must meet (one per line)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button - Always visible */}
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

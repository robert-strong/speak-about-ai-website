'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, RotateCcw, Info, ChevronDown, ChevronUp, Sliders, Search } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface BriefsPromptEditorProps {
  settings: Record<string, string>
  onSave: (settings: Record<string, string>) => Promise<void>
  defaultPrompt: string
}

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
  max_web_searches: '5'
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
            <span>Brief Generation Settings</span>
          </div>
          {hasChanges && (
            <span className="text-sm font-normal text-orange-600">
              Unsaved changes
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Configure all parameters used when generating blog briefs with Claude
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="prompt">Prompt Template</TabsTrigger>
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

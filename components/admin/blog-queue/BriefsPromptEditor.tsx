'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, RotateCcw, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface BriefsPromptEditorProps {
  prompt: string
  ctaRatio: string
  onSave: (settings: { briefs_prompt: string; cta_ratio: string }) => Promise<void>
  defaultPrompt: string
}

export function BriefsPromptEditor({
  prompt,
  ctaRatio,
  onSave,
  defaultPrompt
}: BriefsPromptEditorProps) {
  const [currentPrompt, setCurrentPrompt] = useState(prompt)
  const [currentRatio, setCurrentRatio] = useState(ctaRatio)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const handlePromptChange = (value: string) => {
    setCurrentPrompt(value)
    setHasChanges(value !== prompt || currentRatio !== ctaRatio)
  }

  const handleRatioChange = (value: string) => {
    setCurrentRatio(value)
    setHasChanges(currentPrompt !== prompt || value !== ctaRatio)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        briefs_prompt: currentPrompt,
        cta_ratio: currentRatio
      })
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setCurrentPrompt(defaultPrompt)
    setHasChanges(defaultPrompt !== prompt)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Briefs Prompt Configuration</span>
          {hasChanges && (
            <span className="text-sm font-normal text-orange-600">
              Unsaved changes
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Configure the Claude prompt used to generate blog briefs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            className="mb-2"
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
            <Alert>
              <AlertDescription>
                <p className="font-medium mb-2">Available template variables:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">{'{count}'}</code> - Number of briefs to generate</li>
                  <li><code className="bg-gray-100 px-1 rounded">{'{cta_count}'}</code> - Number of briefs with CTA hook</li>
                  <li><code className="bg-gray-100 px-1 rounded">{'{non_cta_count}'}</code> - Number of briefs without CTA</li>
                  <li><code className="bg-gray-100 px-1 rounded">{'{existing_briefs}'}</code> - Recent briefs for de-duplication</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <Label htmlFor="cta_ratio">CTA Ratio</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              id="cta_ratio"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={currentRatio}
              onChange={(e) => handleRatioChange(e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-gray-500">
              {Math.round(parseFloat(currentRatio || '0') * 100)}% of briefs will include CTA hooks
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="prompt">Prompt Template</Label>
          <Textarea
            id="prompt"
            value={currentPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            rows={20}
            className="mt-1 font-mono text-sm"
            placeholder="Enter the Claude prompt for generating briefs..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {currentPrompt.length} characters
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, FileText, Loader2, Plus, Trash2 } from "lucide-react"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"

interface DeliverablesEditorProps {
  projectId: number
  initialDeliverables?: string
  eventType?: string
  onUpdate?: (deliverables: string) => void
}

const DEFAULT_TEMPLATES = {
  keynote: [
    "Pre-event consultation call (30-60 minutes)",
    "Content customization for your audience and industry",
    "Professional keynote presentation (as specified)",
    "Interactive Q&A session with audience",
    "High-resolution presentation slides (PDF format)",
    "Post-event recording rights (if applicable)",
    "Follow-up resources and materials"
  ],
  workshop: [
    "Pre-workshop planning and curriculum design",
    "Interactive workshop facilitation",
    "Hands-on exercises and activities",
    "Workshop materials and handouts",
    "Small group breakout sessions",
    "Post-workshop summary and action items",
    "Digital resource package for participants"
  ],
  panel: [
    "Pre-event briefing and coordination",
    "Expert panel participation",
    "Thought leadership and insights",
    "Audience Q&A participation",
    "Post-panel networking (if requested)"
  ],
  virtual: [
    "Technical setup and testing session",
    "Virtual presentation delivery",
    "Screen sharing and interactive elements",
    "Digital Q&A facilitation",
    "Recording permission (if requested)",
    "Digital handouts and resources"
  ]
}

export function DeliverablesEditor({
  projectId,
  initialDeliverables = "",
  eventType = "keynote",
  onUpdate
}: DeliverablesEditorProps) {
  const [deliverables, setDeliverables] = useState<string[]>(
    initialDeliverables ? initialDeliverables.split('\n').filter(Boolean) : []
  )
  const [newDeliverable, setNewDeliverable] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleAddDeliverable = () => {
    if (newDeliverable.trim()) {
      setDeliverables([...deliverables, newDeliverable.trim()])
      setNewDeliverable("")
    }
  }

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index))
  }

  const handleLoadTemplate = () => {
    const template = DEFAULT_TEMPLATES[eventType.toLowerCase() as keyof typeof DEFAULT_TEMPLATES] || DEFAULT_TEMPLATES.keynote
    setDeliverables(template)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await authPost('/api/projects/set-deliverables', {
          projectId,
          deliverables: deliverables
        })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Deliverables updated successfully"
        })
        onUpdate?.(data.deliverables)
      } else {
        throw new Error('Failed to update deliverables')
      }
    } catch (error) {
      console.error('Error saving deliverables:', error)
      toast({
        title: "Error",
        description: "Failed to update deliverables",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Deliverables</CardTitle>
        <CardDescription>
          Define what will be delivered as part of this engagement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Deliverables */}
        {deliverables.length > 0 && (
          <div className="space-y-2">
            <Label>Current Deliverables</Label>
            <div className="space-y-2">
              {deliverables.map((item, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="flex-1 text-sm">{item}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveDeliverable(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Deliverable */}
        <div className="space-y-2">
          <Label>Add Deliverable</Label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="Enter a deliverable..."
              value={newDeliverable}
              onChange={(e) => setNewDeliverable(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddDeliverable()}
            />
            <Button onClick={handleAddDeliverable} disabled={!newDeliverable.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Template Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleLoadTemplate}
          >
            <FileText className="h-4 w-4 mr-2" />
            Load {eventType} Template
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || deliverables.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Deliverables
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500">
          These deliverables will appear on invoices and contracts. Be specific about what's included.
        </p>
      </CardContent>
    </Card>
  )
}
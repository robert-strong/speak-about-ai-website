"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  Save,
  Send,
  Eye,
  FileText,
  Calendar as CalendarIcon,
  DollarSign,
  AlertTriangle,
  Loader2,
  Download,
  Edit
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Deal } from "@/lib/deals-db"
import { generateContractHTML } from "@/lib/contract-processor"

interface DynamicField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency' | 'textarea'
  defaultValue?: string
  required: boolean
}

interface ContractTemplate {
  id: string
  name: string
  description?: string
  content: string
  dynamicFields: DynamicField[]
  variables?: string[]
}

interface ContractFormData {
  client_company?: string
  client_signer_name?: string
  event_name?: string
  event_date?: string
  event_location?: string
  speaking_fee?: string | number
  deposit_amount?: string | number
  [key: string]: string | number | undefined
}

interface ContractData extends ContractFormData {
  template_id: string
  deal_id?: number
  html_content?: string
  status?: string
}

interface ContractCreatorProps {
  dealId?: number
  onSave?: (contractData: ContractData) => void
  onCancel?: () => void
}

export function ContractCreator({ dealId, onSave, onCancel }: ContractCreatorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [template, setTemplate] = useState<ContractTemplate | null>(null)
  const [formData, setFormData] = useState<ContractFormData>({})
  const [preview, setPreview] = useState<string>("")
  const [activeTab, setActiveTab] = useState("details")
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    loadTemplate()
    if (dealId) {
      loadDeal(dealId)
    }
  }, [dealId])

  const loadTemplate = () => {
    // Load template from localStorage
    const templates = localStorage.getItem('contractTemplates')
    if (templates) {
      const parsedTemplates = JSON.parse(templates)
      const standardTemplate = parsedTemplates.find((t: ContractTemplate) => t.id === 'standard-speaking-agreement')
      if (standardTemplate) {
        setTemplate(standardTemplate)
        
        // Initialize form data with default values
        const initialData: ContractFormData = {}
        standardTemplate.dynamicFields.forEach((field: DynamicField) => {
          if (field.defaultValue) {
            initialData[field.key] = field.defaultValue
          }
        })
        setFormData(initialData)
      }
    }
  }

  const loadDeal = async (id: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/deals/${id}`)
      if (response.ok) {
        const dealData = await response.json()
        setDeal(dealData)
        
        // Pre-fill form with deal data
        setFormData(prev => ({
          ...prev,
          client_company: dealData.company,
          client_signer_name: dealData.client_name,
          event_name: dealData.event_title,
          event_date: dealData.event_date,
          event_location: dealData.event_location,
          speaker_fee: dealData.deal_value,
          speaker_name: dealData.speaker_requested || '',
          agreement_date: new Date().toISOString().split('T')[0]
        }))
      }
    } catch (error) {
      console.error("Error loading deal:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const generatePreview = async () => {
    if (!template || !template.fileUrl) {
      // Use a default template
      const content = generateDefaultContract(formData)
      const html = generateContractHTML(content, `Contract - ${formData.event_name || 'Draft'}`)
      setPreview(html)
      return
    }

    try {
      // Process uploaded Word template
      const response = await fetch('/api/contracts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateUrl: template.fileUrl,
          data: formData
        })
      })

      if (response.ok) {
        const { html } = await response.json()
        setPreview(html)
      }
    } catch (error) {
      console.error("Error generating preview:", error)
    }
  }

  const generateDefaultContract = (data: Record<string, any>) => {
    return `
# SPEAKING ENGAGEMENT AGREEMENT

This agreement is entered into by and between:

**a) ${data.agent_name || 'Speak About AI, a division of Strong Entertainment, LLC'}** ("Agent" for the Speaker)

**b) ${data.speaker_name || '[SPEAKER NAME]'}** ("Speaker")

**c) ${data.client_company || '[CLIENT COMPANY]'}** ("Client")

for the purposes of engaging the Speaker for:

## 1. CONTRACT DETAILS

**Event Reference:** ${data.event_reference || '[EVENT REFERENCE]'}

**Client & Name of Event:** ${data.client_company || '[CLIENT]'} / ${data.event_name || '[EVENT NAME]'} ("Event")

**Date(s)/Time(s):** ${formatDate(data.event_date)} from ${data.event_time_start || '[START TIME]'} to ${data.event_time_end || '[END TIME]'}

**Location(s):** ${data.event_location || '[EVENT LOCATION]'}

**The fee and any other consideration payable to the Agent:** ${formatCurrency(data.speaker_fee)} USD

**Travel:** ${data.travel_stipend ? `Travel stipend of ${formatCurrency(data.travel_stipend)}` : '[TRAVEL DETAILS]'}${data.accommodation_details ? `, ${data.accommodation_details}` : ''}

## 2. SPEAKER DELIVERABLES

For the fee stated above, the Speaker will provide:

- A ${data.keynote_duration || '40-minute'} keynote on the topic of: "${data.keynote_topic || '[KEYNOTE TOPIC]'}"
${data.qa_duration ? `- A ${data.qa_duration} Q&A session` : ''}
- Attendance at the main event:
  - ${data.arrival_time || '[ARRIVAL TIME]'} - Speaker Arrival/Load-in ${data.tech_check_time ? `(Tech check: ${data.tech_check_time})` : '(Tech check TBD)'}
  - ${data.keynote_time || '[KEYNOTE TIME]'} - Speaker's Keynote
  ${data.qa_duration ? `- Q&A Session immediately following keynote` : ''}
  - ${data.departure_time || '[DEPARTURE TIME]'} - Speaker's departure from venue

${data.virtual_meetings ? `- ${data.virtual_meetings}` : ''}
${data.additional_requirements ? `\n## Additional Requirements:\n${data.additional_requirements}` : ''}

## 3. PAYMENT TERMS

Payment of the speaking fee shall be made ${data.payment_due_date ? `by ${formatDate(data.payment_due_date)}` : 'within 30 days of the event completion'}.

## 4. CANCELLATION POLICY

${data.cancellation_deadline ? `Cancellation must be made before ${formatDate(data.cancellation_deadline)} to avoid penalties.` : 'Standard cancellation terms apply as per agency policy.'}

## 5. SIGNATURES

**For the Agent:**

_________________________________
${data.agent_signer_name || '[AGENT SIGNER NAME]'}
${data.agent_signer_title || '[AGENT SIGNER TITLE]'}
Date: _________________

**For the Speaker:**

_________________________________
${data.speaker_signer_name || data.speaker_name || '[SPEAKER NAME]'}
Date: _________________

**For the Client:**

_________________________________
${data.client_signer_name || '[CLIENT SIGNER NAME]'}
${data.client_signer_title || '[CLIENT SIGNER TITLE]'}
Date: _________________
    `
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '[DATE]'
    const date = new Date(dateString)
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const formatCurrency = (value?: string | number) => {
    if (!value) return '[AMOUNT]'
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numValue)
  }

  const validateForm = (): boolean => {
    if (!template) return false
    
    const errors: string[] = []
    template.dynamicFields
      .filter((field: DynamicField) => field.required)
      .forEach((field: DynamicField) => {
        if (!formData[field.key]) {
          errors.push(`${field.label} is required`)
        }
      })
    
    setErrors(errors)
    return errors.length === 0
  }

  const handleSave = async (sendForSignature = false) => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      
      const contractData = {
        deal_id: dealId,
        template_id: template.id,
        data: formData,
        send_for_signature: sendForSignature
      }
      
      onSave?.(contractData)
    } catch (error) {
      console.error("Error saving contract:", error)
      toast({
        title: "Error",
        description: "Failed to save contract",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field: DynamicField) => {
    const value = formData[field.key] || ''
    
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.defaultValue || `Enter ${field.label.toLowerCase()}`}
            rows={3}
          />
        )
      
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : `Select ${field.label.toLowerCase()}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleFieldChange(field.key, date?.toISOString().split('T')[0])}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      
      case 'currency':
        return (
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.defaultValue || "0.00"}
              className="pl-10"
            />
          </div>
        )
      
      default:
        return (
          <Input
            type={field.type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.defaultValue || `Enter ${field.label.toLowerCase()}`}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (!template) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          No contract template configured. Please upload a template first.
          <Button 
            variant="link" 
            onClick={() => window.location.href = '/admin/contracts-hub/templates/upload'}
            className="ml-2"
          >
            Upload Template
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Group fields by category
  const fieldsByCategory = {
    parties: ['agent_name', 'speaker_name', 'client_company', 'agent_signer_name', 'agent_signer_title', 'speaker_signer_name', 'client_signer_name', 'client_signer_title'],
    event: ['event_reference', 'event_name', 'event_date', 'event_time_start', 'event_time_end', 'event_location'],
    financial: ['speaker_fee', 'travel_stipend', 'accommodation_details', 'payment_due_date'],
    deliverables: ['keynote_duration', 'keynote_topic', 'qa_duration', 'virtual_meetings', 'additional_requirements'],
    schedule: ['arrival_time', 'tech_check_time', 'keynote_time', 'departure_time'],
    dates: ['agreement_date', 'cancellation_deadline']
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Contract</h2>
          {deal && (
            <p className="text-gray-600 mt-1">
              {deal.event_title} - {deal.client_name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={generatePreview}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Create & Send
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <p className="font-medium mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Fields */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                <TabsTrigger value="parties" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Parties
                </TabsTrigger>
                <TabsTrigger value="event" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Event Details
                </TabsTrigger>
                <TabsTrigger value="financial" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Financial
                </TabsTrigger>
                <TabsTrigger value="deliverables" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Deliverables
                </TabsTrigger>
                <TabsTrigger value="schedule" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="dates" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Key Dates
                </TabsTrigger>
              </TabsList>
            </div>

            {Object.entries(fieldsByCategory).map(([category, fieldKeys]) => (
              <TabsContent key={category} value={category} className="p-6 space-y-4">
                {template.dynamicFields
                  .filter((field: DynamicField) => fieldKeys.includes(field.key))
                  .map((field: DynamicField) => (
                    <div key={field.key}>
                      <Label htmlFor={field.key}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="mt-1">
                        {renderField(field)}
                      </div>
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Contract Preview</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const printWindow = window.open('', '_blank')
                    printWindow?.document.write(preview)
                    printWindow?.document.close()
                    printWindow?.print()
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreview("")}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8">
              <div dangerouslySetInnerHTML={{ __html: preview }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
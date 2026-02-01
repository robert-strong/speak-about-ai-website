"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  Save,
  Send,
  Eye,
  FileText,
  User,
  Building,
  Calendar as CalendarIcon,
  DollarSign,
  MapPin,
  Clock,
  AlertTriangle,
  Info,
  Loader2,
  ChevronRight,
  Settings
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { defaultContractTemplates, type ContractTemplate, type ContractVariable } from "@/lib/contract-templates"
import type { Deal } from "@/lib/deals-db"

interface ContractEditorProps {
  contractId?: number | null
  isCreating?: boolean
  onSave?: () => void
  onCancel?: () => void
}

interface ContractData {
  template_id: string
  deal_id?: number
  type: string
  category: string
  title: string
  status: string
  values: Record<string, any>
}

export function ContractEditor({ contractId, isCreating, onSave, onCancel }: ContractEditorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contract, setContract] = useState<ContractData>({
    template_id: 'standard-speaker-agreement',
    type: 'client_speaker',
    category: 'external',
    title: '',
    status: 'draft',
    values: {}
  })
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [activeSection, setActiveSection] = useState("basic")
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (isCreating) {
      loadDeals()
      loadTemplate('standard-speaker-agreement', {})
    } else if (contractId) {
      loadContract(contractId)
    }
  }, [contractId, isCreating])

  const loadContract = async (id: number) => {
    try {
      setLoading(true)
      console.log("Loading contract with ID:", id)
      const response = await fetch(`/api/contracts/${id}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Contract data received from API:", data)
        console.log("contract_data field:", data.contract_data)
        
        const contractValues = data.contract_data || {}
        const contractToSet = {
          template_id: data.template_id || 'standard-speaker-agreement',
          deal_id: data.deal_id,
          type: data.type || 'client_speaker',
          category: data.category || 'external',
          title: data.title,
          status: data.status,
          values: contractValues
        }
        console.log("Setting contract state to:", contractToSet)
        setContract(contractToSet)
        
        // Load template but pass existing values to preserve them
        const templateId = data.template_id || 'standard-speaker-agreement'
        console.log("Loading template with existing values:", templateId, contractValues)
        loadTemplate(templateId, contractValues)
      } else {
        console.error("Failed to load contract, status:", response.status)
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Error loading contract:", error)
      toast({
        title: "Error",
        description: "Failed to load contract",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDeals = async () => {
    try {
      const response = await fetch("/api/deals?status=won")
      if (response.ok) {
        const data = await response.json()
        setDeals(data)
      }
    } catch (error) {
      console.error("Error loading deals:", error)
    }
  }

  const loadTemplate = (templateId: string, existingValues?: Record<string, any>) => {
    const template = defaultContractTemplates.find(t => t.id === templateId)
    console.log('Loading template:', templateId, template)
    console.log('Existing values:', existingValues)
    if (template) {
      setSelectedTemplate(template)
      // Only set default values if no existing values are provided
      if (!existingValues || Object.keys(existingValues).length === 0) {
        // Initialize default values only for new contracts
        const defaultValues: Record<string, any> = {}
        template.variables.forEach(variable => {
          if (variable.defaultValue !== undefined) {
            defaultValues[variable.key] = variable.defaultValue
          }
        })
        setContract(prev => ({
          ...prev,
          template_id: templateId,
          values: { ...defaultValues, ...prev.values }
        }))
        console.log('Set default values for new contract')
      } else {
        // For existing contracts, preserve the values
        console.log('Preserving existing values:', existingValues)
      }
    }
  }

  const handleDealSelect = (dealId: string) => {
    const deal = deals.find(d => d.id.toString() === dealId)
    if (deal) {
      setSelectedDeal(deal)
      setContract(prev => ({
        ...prev,
        deal_id: deal.id,
        title: `Speaking Agreement - ${deal.event_title}`,
        values: {
          ...prev.values,
          client_company: deal.company,
          client_contact_name: deal.client_name,
          client_email: deal.client_email,
          client_phone: deal.client_phone,
          event_title: deal.event_title,
          event_date: deal.event_date,
          event_location: deal.event_location,
          attendee_count: deal.attendee_count,
          speaker_fee: deal.deal_value,
          agreement_date: new Date().toISOString().split('T')[0]
        }
      }))
    }
  }

  const handleValueChange = (key: string, value: any) => {
    setContract(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [key]: value
      }
    }))
  }

  const validateContract = (): boolean => {
    if (!selectedTemplate) return false
    
    const errors: string[] = []
    selectedTemplate.variables.forEach(variable => {
      if (variable.required && !contract.values[variable.key]) {
        errors.push(`${variable.label} is required`)
      }
    })
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSave = async (sendForSignature = false) => {
    if (!validateContract()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      
      const endpoint = contractId 
        ? `/api/contracts/${contractId}`
        : `/api/contracts/simple`  // Using simple endpoint for debugging
      
      const method = contractId ? 'PUT' : 'POST'
      
      const payload = {
        ...contract,
        send_for_signature: sendForSignature
      }
      
      console.log('Saving contract with payload:', payload)
      
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const responseText = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', responseText)
      
      if (response.ok) {
        toast({
          title: "Success",
          description: sendForSignature 
            ? "Contract saved and sent for signature"
            : "Contract saved successfully"
        })
        onSave?.()
      } else {
        let errorMessage = "Failed to save contract"
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
          if (errorData.details) {
            console.error('Error details:', errorData.details)
            errorMessage += `: ${errorData.details}`
          }
        } catch (e) {
          console.error('Could not parse error response:', responseText)
        }
        throw new Error(errorMessage)
      }
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

  const renderVariableInput = (variable: ContractVariable) => {
    const value = contract.values[variable.key] || ''
    
    switch (variable.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleValueChange(variable.key, e.target.value)}
            placeholder={`Enter ${variable.label.toLowerCase()}`}
            rows={3}
          />
        )
      
      case 'select':
        return (
          <Select value={value} onValueChange={(v) => handleValueChange(variable.key, v)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${variable.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {variable.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : `Select ${variable.label.toLowerCase()}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleValueChange(variable.key, date?.toISOString().split('T')[0])}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      
      case 'number':
      case 'currency':
        return (
          <div className="relative">
            {variable.type === 'currency' && (
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            )}
            <Input
              type="number"
              value={value}
              onChange={(e) => handleValueChange(variable.key, e.target.value)}
              placeholder={`Enter ${variable.label.toLowerCase()}`}
              className={variable.type === 'currency' ? 'pl-10' : ''}
            />
          </div>
        )
      
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleValueChange(variable.key, e.target.value)}
            placeholder={`Enter ${variable.label.toLowerCase()}`}
          />
        )
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(variable.key, e.target.value)}
            placeholder={`Enter ${variable.label.toLowerCase()}`}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading contract...</span>
      </div>
    )
  }

  const variablesBySection = {
    basic: ['agreement_date', 'client_company', 'client_address', 'client_contact_name', 'client_email', 'client_phone', 'client_signer_name', 'client_signer_title'],
    speaker: ['speaker_name', 'speaker_email', 'speaker_phone', 'speaker_address'],
    event: ['event_title', 'event_date', 'event_time', 'presentation_duration', 'event_location', 'venue_name', 'attendee_count', 'event_type', 'presentation_title', 'presentation_format', 'presentation_description', 'additional_requirements'],
    financial: ['speaker_fee', 'payment_terms', 'additional_compensation', 'expense_coverage', 'expense_submission_deadline'],
    travel: ['travel_arrangements', 'travel_cost_type', 'travel_buyout_amount', 'travel_buyout_includes', 'client_covers_items', 'departure_city', 'arrival_requirements', 'ground_transportation', 'hotel_arrangements', 'checkin_date', 'checkout_date', 'meal_arrangements'],
    terms: ['arrival_buffer', 'additional_activities', 'materials_deadline', 'bio_length', 'technical_requirements', 'venue_requirements', 'info_deadline', 'recording_rights', 'marketing_rights', 'distribution_rights'],
    cancellation: ['cancellation_period_1', 'cancellation_period_2', 'cancellation_fee_1', 'cancellation_fee_2', 'cancellation_fee_3'],
    legal: ['additional_confidentiality', 'insurance_requirements', 'governing_state', 'agency_signer_name', 'agency_signer_title']
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isCreating ? 'Create New Contract' : 'Edit Contract'}
          </h2>
          <p className="text-gray-600 mt-1">
            {contract.title || 'Untitled Contract'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Save & Send
          </Button>
        </div>
      </div>

      {/* Deal Selection (for new contracts) */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Select Deal</CardTitle>
            <CardDescription>
              Choose a won deal to create a contract for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={contract.deal_id?.toString()} onValueChange={handleDealSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a deal" />
              </SelectTrigger>
              <SelectContent>
                {deals.map(deal => (
                  <SelectItem key={deal.id} value={deal.id.toString()}>
                    {deal.event_title} - {deal.client_name} (${deal.deal_value.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Template</CardTitle>
          <CardDescription>
            Choose the contract template to use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={contract.template_id} onValueChange={(templateId) => loadTemplate(templateId, contract.values)}>
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {defaultContractTemplates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <p className="font-medium mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Contract Fields */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <div className="border-b">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                <TabsTrigger value="basic" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="speaker" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Speaker
                </TabsTrigger>
                <TabsTrigger value="event" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Event Details
                </TabsTrigger>
                <TabsTrigger value="financial" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Financial
                </TabsTrigger>
                <TabsTrigger value="travel" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Travel
                </TabsTrigger>
                <TabsTrigger value="terms" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Terms
                </TabsTrigger>
                <TabsTrigger value="cancellation" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Cancellation
                </TabsTrigger>
                <TabsTrigger value="legal" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">
                  Legal
                </TabsTrigger>
              </TabsList>
            </div>

            {Object.entries(variablesBySection).map(([section, variableKeys]) => (
              <TabsContent key={section} value={section} className="p-6 space-y-4">
                {selectedTemplate?.variables
                  .filter(v => variableKeys.includes(v.key))
                  .map(variable => (
                    <div key={variable.key}>
                      <Label htmlFor={variable.key}>
                        {variable.label}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="mt-1">
                        {renderVariableInput(variable)}
                      </div>
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
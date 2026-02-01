"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Building,
  User,
  Calendar,
  Clock,
  Mic,
  Plane,
  DollarSign,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  MapPin,
  Users,
  Camera,
  Hotel,
  Utensils,
  Phone,
  Mail,
  Globe,
  FileText
} from "lucide-react"
import type { FirmOffer } from "@/lib/firm-offer-types"
import { emptyFirmOffer } from "@/lib/firm-offer-types"
import { useToast } from "@/hooks/use-toast"

interface FirmOfferFormProps {
  proposalId: number
  proposalTitle: string
  speakerName: string
  speakerFee: number
  eventDate?: string
  initialData?: Partial<FirmOffer>
  onSave?: (data: Partial<FirmOffer>) => Promise<void>
  onSubmit?: (data: Partial<FirmOffer>) => Promise<void>
  readOnly?: boolean
}

const steps = [
  { id: 'overview', title: 'Event Overview', icon: Building },
  { id: 'program', title: 'Speaker Program', icon: User },
  { id: 'schedule', title: 'Event Schedule', icon: Clock },
  { id: 'technical', title: 'Technical Requirements', icon: Mic },
  { id: 'travel', title: 'Travel & Accommodation', icon: Plane },
  { id: 'additional', title: 'Additional Info', icon: FileText },
  { id: 'financial', title: 'Financial Details', icon: DollarSign },
  { id: 'confirmation', title: 'Confirmation', icon: CheckCircle },
]

export function FirmOfferForm({
  proposalId,
  proposalTitle,
  speakerName,
  speakerFee,
  eventDate,
  initialData,
  onSave,
  onSubmit,
  readOnly = false
}: FirmOfferFormProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data with initialData or empty template
  const [formData, setFormData] = useState<Partial<FirmOffer>>(() => {
    const base = { ...emptyFirmOffer }
    if (initialData) {
      return {
        ...base,
        ...initialData,
        event_overview: { ...base.event_overview, ...initialData.event_overview },
        speaker_program: {
          ...base.speaker_program,
          ...initialData.speaker_program,
          requested_speaker_name: speakerName
        },
        event_schedule: { ...base.event_schedule, ...initialData.event_schedule },
        technical_requirements: { ...base.technical_requirements, ...initialData.technical_requirements },
        travel_accommodation: { ...base.travel_accommodation, ...initialData.travel_accommodation },
        additional_info: { ...base.additional_info, ...initialData.additional_info },
        financial_details: {
          ...base.financial_details,
          ...initialData.financial_details,
          speaker_fee: speakerFee
        },
        confirmation: { ...base.confirmation, ...initialData.confirmation },
      }
    }
    // Pre-fill with proposal data
    base.speaker_program.requested_speaker_name = speakerName
    base.financial_details.speaker_fee = speakerFee
    if (eventDate) {
      base.event_overview.event_date = eventDate
    }
    return base
  })

  const updateField = (section: keyof FirmOffer, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }))
  }

  const updateNestedField = (section: keyof FirmOffer, parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [parent]: {
          ...((prev[section] as any)?.[parent] || {}),
          [field]: value
        }
      }
    }))
  }

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true)
      try {
        await onSave(formData)
        toast({ title: "Saved", description: "Your progress has been saved." })
      } catch (error) {
        toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" })
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleSubmit = async () => {
    if (onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(formData)
        toast({ title: "Submitted!", description: "Your firm offer has been submitted for review." })
      } catch (error) {
        toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))
  const goToStep = (index: number) => setCurrentStep(index)

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Firm Offer Sheet</h1>
        <p className="text-gray-600 mt-2">{proposalTitle}</p>
        <Badge className="mt-2 bg-blue-100 text-blue-800">Speaker: {speakerName}</Badge>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-4 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => !readOnly && goToStep(index)}
              disabled={readOnly}
              className={`flex flex-col items-center min-w-[80px] px-2 ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              } ${!readOnly ? 'cursor-pointer hover:text-blue-700' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                index < currentStep ? 'bg-green-500 text-white' :
                index === currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {index < currentStep ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium text-center">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const StepIcon = steps[currentStep].icon
              return <StepIcon className="h-5 w-5" />
            })()}
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription>
            {currentStep === 0 && "Provide your organization and event contact information"}
            {currentStep === 1 && "Tell us about the speaking program requirements"}
            {currentStep === 2 && "Share the event timeline and schedule"}
            {currentStep === 3 && "Specify technical and AV requirements"}
            {currentStep === 4 && "Detail travel and accommodation needs"}
            {currentStep === 5 && "Additional event information"}
            {currentStep === 6 && "Confirm financial terms"}
            {currentStep === 7 && "Review and submit your firm offer"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Event Overview */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Billing Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Billing Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.event_overview?.billing_contact?.name || ''}
                      onChange={(e) => updateNestedField('event_overview', 'billing_contact', 'name', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={formData.event_overview?.billing_contact?.title || ''}
                      onChange={(e) => updateNestedField('event_overview', 'billing_contact', 'title', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.event_overview?.billing_contact?.email || ''}
                      onChange={(e) => updateNestedField('event_overview', 'billing_contact', 'email', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={formData.event_overview?.billing_contact?.phone || ''}
                      onChange={(e) => updateNestedField('event_overview', 'billing_contact', 'phone', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Billing Address *</Label>
                    <Textarea
                      value={formData.event_overview?.billing_contact?.address || ''}
                      onChange={(e) => updateNestedField('event_overview', 'billing_contact', 'address', e.target.value)}
                      disabled={readOnly}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Logistics Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Logistics Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.event_overview?.logistics_contact?.name || ''}
                      onChange={(e) => updateNestedField('event_overview', 'logistics_contact', 'name', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.event_overview?.logistics_contact?.email || ''}
                      onChange={(e) => updateNestedField('event_overview', 'logistics_contact', 'email', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={formData.event_overview?.logistics_contact?.phone || ''}
                      onChange={(e) => updateNestedField('event_overview', 'logistics_contact', 'phone', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>End Client Name *</Label>
                    <Input
                      value={formData.event_overview?.end_client_name || ''}
                      onChange={(e) => updateField('event_overview', 'end_client_name', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Event Date *</Label>
                    <Input
                      type="date"
                      value={formData.event_overview?.event_date || ''}
                      onChange={(e) => updateField('event_overview', 'event_date', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Event Name *</Label>
                    <Input
                      value={formData.event_overview?.event_name || ''}
                      onChange={(e) => updateField('event_overview', 'event_name', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Event Website/Link</Label>
                    <Input
                      type="url"
                      value={formData.event_overview?.event_website || ''}
                      onChange={(e) => updateField('event_overview', 'event_website', e.target.value)}
                      disabled={readOnly}
                      placeholder="https://"
                    />
                  </div>
                </div>
              </div>

              {/* Venue Details */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Venue Details
                </h3>
                <p className="text-sm text-gray-500">Can be confirmed after contract is signed</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Venue Name</Label>
                    <Input
                      value={formData.event_overview?.venue_name || ''}
                      onChange={(e) => updateField('event_overview', 'venue_name', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Venue Full Address</Label>
                    <Input
                      value={formData.event_overview?.venue_address || ''}
                      onChange={(e) => updateField('event_overview', 'venue_address', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Venue Contact Name</Label>
                    <Input
                      value={formData.event_overview?.venue_contact?.name || ''}
                      onChange={(e) => updateNestedField('event_overview', 'venue_contact', 'name', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Venue Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.event_overview?.venue_contact?.email || ''}
                      onChange={(e) => updateNestedField('event_overview', 'venue_contact', 'email', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Venue Contact Phone</Label>
                    <Input
                      value={formData.event_overview?.venue_contact?.phone || ''}
                      onChange={(e) => updateNestedField('event_overview', 'venue_contact', 'phone', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Speaker Program */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Requested Speaker *</Label>
                  <Input
                    value={formData.speaker_program?.requested_speaker_name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Program Type *</Label>
                  <Select
                    value={formData.speaker_program?.program_type || 'keynote'}
                    onValueChange={(value) => updateField('speaker_program', 'program_type', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keynote">Keynote</SelectItem>
                      <SelectItem value="fireside_chat">Fireside Chat</SelectItem>
                      <SelectItem value="panel_discussion">Panel Discussion</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.speaker_program?.program_type === 'other' && (
                  <div>
                    <Label>Specify Program Type</Label>
                    <Input
                      value={formData.speaker_program?.program_type_other || ''}
                      onChange={(e) => updateField('speaker_program', 'program_type_other', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label>Program Topic *</Label>
                  <Textarea
                    value={formData.speaker_program?.program_topic || ''}
                    onChange={(e) => updateField('speaker_program', 'program_topic', e.target.value)}
                    disabled={readOnly}
                    placeholder="What specific topics should the speaker focus on?"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Audience Size *</Label>
                  <Input
                    type="number"
                    value={formData.speaker_program?.audience_size || ''}
                    onChange={(e) => updateField('speaker_program', 'audience_size', parseInt(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Speaker's Attire *</Label>
                  <Select
                    value={formData.speaker_program?.speaker_attire || 'business_casual'}
                    onValueChange={(value) => updateField('speaker_program', 'speaker_attire', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business_formal">Business Formal</SelectItem>
                      <SelectItem value="business_casual">Business Casual</SelectItem>
                      <SelectItem value="smart_casual">Smart Casual</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Audience Demographics *</Label>
                  <Textarea
                    value={formData.speaker_program?.audience_demographics || ''}
                    onChange={(e) => updateField('speaker_program', 'audience_demographics', e.target.value)}
                    disabled={readOnly}
                    placeholder="Job titles, industries, experience levels, etc."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Event Schedule */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Event Start Time</Label>
                  <Input
                    type="time"
                    value={formData.event_schedule?.event_start_time || ''}
                    onChange={(e) => updateField('event_schedule', 'event_start_time', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Event End Time</Label>
                  <Input
                    type="time"
                    value={formData.event_schedule?.event_end_time || ''}
                    onChange={(e) => updateField('event_schedule', 'event_end_time', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Speaker Arrival Time at Venue *</Label>
                  <Input
                    type="time"
                    value={formData.event_schedule?.speaker_arrival_time || ''}
                    onChange={(e) => updateField('event_schedule', 'speaker_arrival_time', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Speaker Program Start Time *</Label>
                  <Input
                    type="time"
                    value={formData.event_schedule?.program_start_time || ''}
                    onChange={(e) => updateField('event_schedule', 'program_start_time', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Program Length (minutes) *</Label>
                  <Input
                    type="number"
                    value={formData.event_schedule?.program_length_minutes || ''}
                    onChange={(e) => updateField('event_schedule', 'program_length_minutes', parseInt(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Q&A Length (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.event_schedule?.qa_length_minutes || ''}
                    onChange={(e) => updateField('event_schedule', 'qa_length_minutes', parseInt(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Total Program Length (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.event_schedule?.total_program_length_minutes || ''}
                    onChange={(e) => updateField('event_schedule', 'total_program_length_minutes', parseInt(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Speaker Departure Time from Venue</Label>
                  <Input
                    type="time"
                    value={formData.event_schedule?.speaker_departure_time || ''}
                    onChange={(e) => updateField('event_schedule', 'speaker_departure_time', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Timezone *</Label>
                  <Select
                    value={formData.event_schedule?.timezone || 'America/New_York'}
                    onValueChange={(value) => updateField('event_schedule', 'timezone', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Detailed Event Timeline</Label>
                <Textarea
                  value={formData.event_schedule?.detailed_timeline || ''}
                  onChange={(e) => updateField('event_schedule', 'detailed_timeline', e.target.value)}
                  disabled={readOnly}
                  placeholder="Please provide full agenda with specific times..."
                  rows={6}
                />
              </div>
            </div>
          )}

          {/* Step 3: Technical Requirements */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">Can be confirmed after executed contract</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Microphone Type</Label>
                  <Input
                    value={formData.technical_requirements?.microphone_type || ''}
                    onChange={(e) => updateField('technical_requirements', 'microphone_type', e.target.value)}
                    disabled={readOnly}
                    placeholder="Lavalier/lapel, handheld, headset..."
                  />
                </div>
                <div>
                  <Label>Projector/Screen</Label>
                  <Input
                    value={formData.technical_requirements?.projector_screen || ''}
                    onChange={(e) => updateField('technical_requirements', 'projector_screen', e.target.value)}
                    disabled={readOnly}
                    placeholder="Screen size, aspect ratio..."
                  />
                </div>
                <div>
                  <Label>Lighting Requirements</Label>
                  <Input
                    value={formData.technical_requirements?.lighting_requirements || ''}
                    onChange={(e) => updateField('technical_requirements', 'lighting_requirements', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Other AV Requirements</Label>
                  <Input
                    value={formData.technical_requirements?.other_av || ''}
                    onChange={(e) => updateField('technical_requirements', 'other_av', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Recording & Photography</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.technical_requirements?.recording_allowed || false}
                      onCheckedChange={(checked) => updateField('technical_requirements', 'recording_allowed', checked)}
                      disabled={readOnly}
                    />
                    <Label>Recording Allowed</Label>
                  </div>
                  {formData.technical_requirements?.recording_allowed && (
                    <div>
                      <Label>Recording Purpose</Label>
                      <Select
                        value={formData.technical_requirements?.recording_purpose || 'internal'}
                        onValueChange={(value) => updateField('technical_requirements', 'recording_purpose', value)}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal Use Only</SelectItem>
                          <SelectItem value="promotional">Promotional Use</SelectItem>
                          <SelectItem value="both">Both Internal & Promotional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.technical_requirements?.live_stream || false}
                      onCheckedChange={(checked) => updateField('technical_requirements', 'live_stream', checked)}
                      disabled={readOnly}
                    />
                    <Label>Live Streaming</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.technical_requirements?.photography_allowed || false}
                      onCheckedChange={(checked) => updateField('technical_requirements', 'photography_allowed', checked)}
                      disabled={readOnly}
                    />
                    <Label>Photography Allowed</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tech Rehearsal Date</Label>
                  <Input
                    type="date"
                    value={formData.technical_requirements?.tech_rehearsal_date || ''}
                    onChange={(e) => updateField('technical_requirements', 'tech_rehearsal_date', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Tech Rehearsal Time</Label>
                  <Input
                    type="time"
                    value={formData.technical_requirements?.tech_rehearsal_time || ''}
                    onChange={(e) => updateField('technical_requirements', 'tech_rehearsal_time', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Travel & Accommodation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Expected Fly-In Date *</Label>
                  <Input
                    type="date"
                    value={formData.travel_accommodation?.fly_in_date || ''}
                    onChange={(e) => updateField('travel_accommodation', 'fly_in_date', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Expected Fly-Out Date *</Label>
                  <Input
                    type="date"
                    value={formData.travel_accommodation?.fly_out_date || ''}
                    onChange={(e) => updateField('travel_accommodation', 'fly_out_date', e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Nearest Airport</Label>
                  <Input
                    value={formData.travel_accommodation?.nearest_airport || ''}
                    onChange={(e) => updateField('travel_accommodation', 'nearest_airport', e.target.value)}
                    disabled={readOnly}
                    placeholder="Airport code or name"
                  />
                </div>
                <div>
                  <Label>Airport to Hotel Transportation</Label>
                  <Select
                    value={formData.travel_accommodation?.airport_transportation || 'tbd'}
                    onValueChange={(value) => updateField('travel_accommodation', 'airport_transportation', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client_provides">Client Will Provide</SelectItem>
                      <SelectItem value="speaker_arranges">Speaker to Arrange</SelectItem>
                      <SelectItem value="tbd">To Be Determined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hotel to Venue Transportation</Label>
                  <Select
                    value={formData.travel_accommodation?.hotel_transportation || 'tbd'}
                    onValueChange={(value) => updateField('travel_accommodation', 'hotel_transportation', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client_provides">Client Will Provide</SelectItem>
                      <SelectItem value="speaker_arranges">Speaker to Arrange</SelectItem>
                      <SelectItem value="tbd">To Be Determined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.travel_accommodation?.hotel_required || false}
                    onCheckedChange={(checked) => updateField('travel_accommodation', 'hotel_required', checked)}
                    disabled={readOnly}
                  />
                  <Label>Hotel Accommodation Required</Label>
                </div>
                {formData.travel_accommodation?.hotel_required && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label>Hotel Dates Needed</Label>
                      <Input
                        value={formData.travel_accommodation?.hotel_dates || ''}
                        onChange={(e) => updateField('travel_accommodation', 'hotel_dates', e.target.value)}
                        disabled={readOnly}
                        placeholder="e.g., Jan 15-17"
                      />
                    </div>
                    <div>
                      <Label>Preferred Hotel Tier</Label>
                      <Select
                        value={formData.travel_accommodation?.hotel_tier || 'upscale'}
                        onValueChange={(value) => updateField('travel_accommodation', 'hotel_tier', value)}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="upscale">Upscale</SelectItem>
                          <SelectItem value="luxury">Luxury</SelectItem>
                          <SelectItem value="tbd">To Be Determined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label>Meals Provided</Label>
                <div className="flex flex-wrap gap-4">
                  {['Breakfast', 'Lunch', 'Dinner', 'Refreshments'].map((meal) => (
                    <div key={meal} className="flex items-center space-x-2">
                      <Checkbox
                        checked={(formData.travel_accommodation?.meals_provided || []).includes(meal)}
                        onCheckedChange={(checked) => {
                          const current = formData.travel_accommodation?.meals_provided || []
                          const updated = checked
                            ? [...current, meal]
                            : current.filter(m => m !== meal)
                          updateField('travel_accommodation', 'meals_provided', updated)
                        }}
                        disabled={readOnly}
                      />
                      <Label>{meal}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Special Dietary Requirements</Label>
                <Input
                  value={formData.travel_accommodation?.dietary_requirements || ''}
                  onChange={(e) => updateField('travel_accommodation', 'dietary_requirements', e.target.value)}
                  disabled={readOnly}
                  placeholder="Vegetarian, allergies, etc."
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.travel_accommodation?.guest_list_invitation || false}
                    onCheckedChange={(checked) => updateField('travel_accommodation', 'guest_list_invitation', checked)}
                    disabled={readOnly}
                  />
                  <Label>Speaker invited to reception/dinner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.travel_accommodation?.vip_meet_greet || false}
                    onCheckedChange={(checked) => updateField('travel_accommodation', 'vip_meet_greet', checked)}
                    disabled={readOnly}
                  />
                  <Label>VIP Meet & Greet</Label>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Additional Info */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.additional_info?.green_room_available || false}
                    onCheckedChange={(checked) => updateField('additional_info', 'green_room_available', checked)}
                    disabled={readOnly}
                  />
                  <Label>Green Room/Holding Area Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.additional_info?.marketing_use_approved || false}
                    onCheckedChange={(checked) => updateField('additional_info', 'marketing_use_approved', checked)}
                    disabled={readOnly}
                  />
                  <Label>Speaker name/bio can be used in marketing</Label>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Meet & Greet Opportunities</Label>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.additional_info?.meet_greet_before || false}
                      onCheckedChange={(checked) => updateField('additional_info', 'meet_greet_before', !!checked)}
                      disabled={readOnly}
                    />
                    <Label>Before presentation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.additional_info?.meet_greet_after || false}
                      onCheckedChange={(checked) => updateField('additional_info', 'meet_greet_after', !!checked)}
                      disabled={readOnly}
                    />
                    <Label>After presentation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.additional_info?.vip_reception || false}
                      onCheckedChange={(checked) => updateField('additional_info', 'vip_reception', !!checked)}
                      disabled={readOnly}
                    />
                    <Label>VIP Reception</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.additional_info?.press_media_present || false}
                    onCheckedChange={(checked) => updateField('additional_info', 'press_media_present', checked)}
                    disabled={readOnly}
                  />
                  <Label>Press/Media will be present</Label>
                </div>
                {formData.additional_info?.press_media_present && (
                  <div className="pl-6">
                    <Label>Interview Requests</Label>
                    <Textarea
                      value={formData.additional_info?.interview_requests || ''}
                      onChange={(e) => updateField('additional_info', 'interview_requests', e.target.value)}
                      disabled={readOnly}
                      placeholder="Details about any media interview requests..."
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Special Requests or Considerations</Label>
                <Textarea
                  value={formData.additional_info?.special_requests || ''}
                  onChange={(e) => updateField('additional_info', 'special_requests', e.target.value)}
                  disabled={readOnly}
                  placeholder="Any other special requirements or considerations..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 6: Financial Details */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Speaker Fee</span>
                  <span className="text-2xl font-bold">${(formData.financial_details?.speaker_fee || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Travel Expenses</Label>
                <Select
                  value={formData.financial_details?.travel_expenses_type || 'flat_buyout'}
                  onValueChange={(value) => updateField('financial_details', 'travel_expenses_type', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat_buyout">Flat Travel Buyout</SelectItem>
                    <SelectItem value="client_books">Client Books Travel</SelectItem>
                    <SelectItem value="reimbursement">Speaker Books, Client Reimburses</SelectItem>
                  </SelectContent>
                </Select>

                {formData.financial_details?.travel_expenses_type === 'flat_buyout' && (
                  <div>
                    <Label>Travel Buyout Amount</Label>
                    <Input
                      type="number"
                      value={formData.financial_details?.travel_buyout_amount || ''}
                      onChange={(e) => updateField('financial_details', 'travel_buyout_amount', parseInt(e.target.value) || 0)}
                      disabled={readOnly}
                      placeholder="Enter amount"
                    />
                  </div>
                )}

                <div>
                  <Label>Travel Notes</Label>
                  <Textarea
                    value={formData.financial_details?.travel_notes || ''}
                    onChange={(e) => updateField('financial_details', 'travel_notes', e.target.value)}
                    disabled={readOnly}
                    placeholder="Ground transportation, accommodation, meals details..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>Payment Terms</Label>
                <Select
                  value={formData.financial_details?.payment_terms || 'Net 30 days after event'}
                  onValueChange={(value) => updateField('financial_details', 'payment_terms', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 30 days after event">Net 30 days after event</SelectItem>
                    <SelectItem value="50% deposit, 50% after event">50% deposit, 50% after event</SelectItem>
                    <SelectItem value="Upon completion">Upon completion</SelectItem>
                    <SelectItem value="Custom">Custom (specify in notes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 7: Confirmation */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Ready to Submit</h3>
                <p className="text-green-700 text-sm">
                  Please review all the information you've provided. Once submitted, this firm offer will be sent to Speak About AI for review and then forwarded to the speaker for confirmation.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.confirmation?.prep_call_requested || false}
                    onCheckedChange={(checked) => updateField('confirmation', 'prep_call_requested', checked)}
                    disabled={readOnly}
                  />
                  <Label>Request a prep call with the speaker</Label>
                </div>
                {formData.confirmation?.prep_call_requested && (
                  <div className="pl-6">
                    <Label>Preferred Date/Time for Prep Call</Label>
                    <Input
                      value={formData.confirmation?.prep_call_date_preferences || ''}
                      onChange={(e) => updateField('confirmation', 'prep_call_date_preferences', e.target.value)}
                      disabled={readOnly}
                      placeholder="e.g., Week of Jan 15, mornings preferred"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.confirmation?.additional_notes || ''}
                  onChange={(e) => updateField('confirmation', 'additional_notes', e.target.value)}
                  disabled={readOnly}
                  placeholder="Any other information you'd like to share..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {!readOnly && onSave && (
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Progress'}
            </Button>
          )}

          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : !readOnly && onSubmit ? (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Firm Offer'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

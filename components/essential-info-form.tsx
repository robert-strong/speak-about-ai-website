"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  MapPin,
  Users,
  Mic,
  Plane,
  Hotel,
  Camera,
  MessageSquare,
  Handshake
} from "lucide-react"
import type { FirmOffer } from "@/lib/firm-offer-types"
import { emptyFirmOffer } from "@/lib/firm-offer-types"
import { useToast } from "@/hooks/use-toast"

interface EssentialInfoFormProps {
  proposalId?: number
  dealId?: number
  speakerName: string
  speakerFee: number
  travelBuyout?: number
  eventDate?: string
  eventName?: string
  eventLocation?: string
  clientName?: string
  clientCompany?: string
  initialData?: Partial<FirmOffer>
  onSubmit?: (data: Partial<FirmOffer>) => Promise<void>
}

const steps = [
  { id: 'event', title: 'Event Details', icon: Calendar },
  { id: 'program', title: 'Speaking Program', icon: Mic },
  { id: 'travel', title: 'Travel', icon: Plane },
  { id: 'additional', title: 'Additional Commitments', icon: Handshake },
  { id: 'confirm', title: 'Confirm', icon: CheckCircle },
]

export function EssentialInfoForm({
  proposalId,
  dealId,
  speakerName,
  speakerFee,
  travelBuyout = 0,
  eventDate,
  eventName,
  eventLocation,
  clientName,
  clientCompany,
  initialData,
  onSubmit
}: EssentialInfoFormProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data
  const [formData, setFormData] = useState<Partial<FirmOffer>>(() => {
    const base = { ...emptyFirmOffer }

    // Pre-fill from props
    base.event_overview.end_client_name = clientCompany || clientName || ''
    base.event_overview.event_date = eventDate || ''
    base.event_overview.event_name = eventName || ''
    base.event_overview.venue_address = eventLocation || ''
    base.speaker_program.requested_speaker_name = speakerName
    base.financial_details.speaker_fee = speakerFee
    base.financial_details.travel_buyout_amount = travelBuyout

    if (initialData) {
      return {
        ...base,
        ...initialData,
        event_overview: { ...base.event_overview, ...initialData.event_overview },
        speaker_program: { ...base.speaker_program, ...initialData.speaker_program },
        event_schedule: { ...base.event_schedule, ...initialData.event_schedule },
        travel_accommodation: { ...base.travel_accommodation, ...initialData.travel_accommodation },
        additional_info: { ...base.additional_info, ...initialData.additional_info },
        financial_details: { ...base.financial_details, ...initialData.financial_details },
      }
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Event details
        return !!(
          formData.event_overview?.end_client_name &&
          formData.event_overview?.event_date &&
          formData.event_overview?.event_name &&
          formData.event_overview?.venue_address
        )
      case 1: // Program
        return !!(
          formData.speaker_program?.program_type &&
          formData.event_schedule?.program_start_time &&
          formData.event_schedule?.program_length_minutes
        )
      case 2: // Travel
        return !!(
          formData.travel_accommodation?.fly_in_date &&
          formData.travel_accommodation?.fly_out_date
        )
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (onSubmit) {
      setIsSubmitting(true)
      try {
        const submitData = {
          ...formData,
          status: 'submitted' as const
        }
        await onSubmit(submitData)
        toast({
          title: "Submitted!",
          description: "Your event information has been submitted. We'll confirm with the speaker and be in touch shortly."
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to submit. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    } else {
      toast({
        title: "Please complete required fields",
        description: "Fill in all required fields before continuing.",
        variant: "destructive"
      })
    }
  }
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))
  const goToStep = (index: number) => {
    if (index < currentStep || validateStep(currentStep)) {
      setCurrentStep(index)
    }
  }

  const totalFee = speakerFee + travelBuyout

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Event Confirmation Form</h1>
        <p className="text-gray-600 mt-2">Please confirm the details for your speaking engagement</p>
        <div className="flex justify-center gap-2 mt-3">
          <Badge className="bg-blue-100 text-blue-800">Speaker: {speakerName}</Badge>
          <Badge className="bg-green-100 text-green-800">
            Total: ${totalFee.toLocaleString()}
          </Badge>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className={`flex flex-col items-center flex-1 ${
              index <= currentStep ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
              index < currentStep ? 'bg-green-500 text-white' :
              index === currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {index < currentStep ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
            </div>
            <span className="text-xs font-medium text-center hidden sm:block">{step.title}</span>
          </button>
        ))}
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
            {currentStep === 0 && "When and where is your event?"}
            {currentStep === 1 && "Tell us about the speaking program"}
            {currentStep === 2 && "Travel expectations for the speaker"}
            {currentStep === 3 && "Any additional commitments beyond the main presentation?"}
            {currentStep === 4 && "Review and confirm your booking"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Event Details */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Organization/Company Name *</Label>
                <Input
                  value={formData.event_overview?.end_client_name || ''}
                  onChange={(e) => updateField('event_overview', 'end_client_name', e.target.value)}
                  placeholder="Your organization name"
                />
              </div>
              <div>
                <Label>Event Name *</Label>
                <Input
                  value={formData.event_overview?.event_name || ''}
                  onChange={(e) => updateField('event_overview', 'event_name', e.target.value)}
                  placeholder="e.g., Annual Leadership Summit 2025"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Event Date *
                  </Label>
                  <Input
                    type="date"
                    value={formData.event_overview?.event_date || ''}
                    onChange={(e) => updateField('event_overview', 'event_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Event Location (City) *
                  </Label>
                  <Input
                    value={formData.event_overview?.venue_address || ''}
                    onChange={(e) => updateField('event_overview', 'venue_address', e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              </div>
              <div>
                <Label>Event Website/Link (optional)</Label>
                <Input
                  type="url"
                  value={formData.event_overview?.event_website || ''}
                  onChange={(e) => updateField('event_overview', 'event_website', e.target.value)}
                  placeholder="https://"
                />
              </div>
            </div>
          )}

          {/* Step 1: Speaking Program */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Requested Speaker:</strong> {speakerName}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Program Type *</Label>
                  <Select
                    value={formData.speaker_program?.program_type || 'keynote'}
                    onValueChange={(value) => updateField('speaker_program', 'program_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keynote">Keynote Presentation</SelectItem>
                      <SelectItem value="fireside_chat">Fireside Chat</SelectItem>
                      <SelectItem value="panel_discussion">Panel Discussion</SelectItem>
                      <SelectItem value="workshop">Workshop/Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> Audience Size *
                  </Label>
                  <Input
                    type="number"
                    value={formData.speaker_program?.audience_size || ''}
                    onChange={(e) => updateField('speaker_program', 'audience_size', parseInt(e.target.value) || 0)}
                    placeholder="Expected attendees"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Program Start Time *
                  </Label>
                  <Input
                    type="time"
                    value={formData.event_schedule?.program_start_time || ''}
                    onChange={(e) => updateField('event_schedule', 'program_start_time', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Program Length (minutes) *</Label>
                  <Input
                    type="number"
                    value={formData.event_schedule?.program_length_minutes || ''}
                    onChange={(e) => updateField('event_schedule', 'program_length_minutes', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 45"
                  />
                </div>
              </div>

              <div>
                <Label>Q&A Length (minutes)</Label>
                <Input
                  type="number"
                  value={formData.event_schedule?.qa_length_minutes || ''}
                  onChange={(e) => updateField('event_schedule', 'qa_length_minutes', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 15"
                />
              </div>

              <div>
                <Label>Program Topic/Focus (optional)</Label>
                <Textarea
                  value={formData.speaker_program?.program_topic || ''}
                  onChange={(e) => updateField('speaker_program', 'program_topic', e.target.value)}
                  placeholder="What specific topics would you like the speaker to address?"
                  rows={3}
                />
              </div>

              <div>
                <Label>Audience Description (optional)</Label>
                <Textarea
                  value={formData.speaker_program?.audience_demographics || ''}
                  onChange={(e) => updateField('speaker_program', 'audience_demographics', e.target.value)}
                  placeholder="Who will be in the audience? (job titles, industries, experience levels)"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Travel */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Plane className="h-3 w-3" /> Expected Fly-In Date *
                  </Label>
                  <Input
                    type="date"
                    value={formData.travel_accommodation?.fly_in_date || ''}
                    onChange={(e) => updateField('travel_accommodation', 'fly_in_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Plane className="h-3 w-3" /> Expected Fly-Out Date *
                  </Label>
                  <Input
                    type="date"
                    value={formData.travel_accommodation?.fly_out_date || ''}
                    onChange={(e) => updateField('travel_accommodation', 'fly_out_date', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Nearest Airport (optional)</Label>
                <Input
                  value={formData.travel_accommodation?.nearest_airport || ''}
                  onChange={(e) => updateField('travel_accommodation', 'nearest_airport', e.target.value)}
                  placeholder="e.g., SFO, LAX, JFK"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.travel_accommodation?.hotel_required || false}
                  onCheckedChange={(checked) => updateField('travel_accommodation', 'hotel_required', checked)}
                />
                <Label className="flex items-center gap-1">
                  <Hotel className="h-3 w-3" /> Hotel Accommodation Required
                </Label>
              </div>

              {formData.travel_accommodation?.hotel_required && (
                <div className="pl-6 space-y-4">
                  <div>
                    <Label>Hotel Dates Needed</Label>
                    <Input
                      value={formData.travel_accommodation?.hotel_dates || ''}
                      onChange={(e) => updateField('travel_accommodation', 'hotel_dates', e.target.value)}
                      placeholder="e.g., March 14-16"
                    />
                  </div>
                </div>
              )}

              {/* Financial Terms Summary */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 mt-6">
                <h4 className="font-medium text-green-800 mb-3">Travel & Fee Terms</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speaker Fee:</span>
                    <span className="font-medium">${speakerFee.toLocaleString()}</span>
                  </div>
                  {travelBuyout > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Travel Allowance:</span>
                      <span className="font-medium">${travelBuyout.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-green-200">
                    <span className="font-medium text-green-800">Total Investment:</span>
                    <span className="font-bold text-green-800">${totalFee.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Additional Commitments */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Beyond the main presentation, will the speaker be expected to participate in any of the following?
              </p>

              {/* Meet & Greet */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Handshake className="h-4 w-4" /> Meet & Greet / Networking
                </Label>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.additional_info?.meet_greet_before || false}
                      onCheckedChange={(checked) => updateField('additional_info', 'meet_greet_before', !!checked)}
                    />
                    <Label className="font-normal">Meet & greet before presentation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.additional_info?.meet_greet_after || false}
                      onCheckedChange={(checked) => updateField('additional_info', 'meet_greet_after', !!checked)}
                    />
                    <Label className="font-normal">Meet & greet after presentation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.additional_info?.vip_reception || false}
                      onCheckedChange={(checked) => updateField('additional_info', 'vip_reception', !!checked)}
                    />
                    <Label className="font-normal">VIP reception / dinner</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.travel_accommodation?.guest_list_invitation || false}
                      onCheckedChange={(checked) => updateField('travel_accommodation', 'guest_list_invitation', !!checked)}
                    />
                    <Label className="font-normal">Invited to event dinner/reception as guest</Label>
                  </div>
                </div>
              </div>

              {/* Press & Media */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Press & Media
                </Label>
                <div className="space-y-3 pl-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.additional_info?.press_media_present || false}
                      onCheckedChange={(checked) => updateField('additional_info', 'press_media_present', checked)}
                    />
                    <Label className="font-normal">Press/media will be present at the event</Label>
                  </div>
                  {formData.additional_info?.press_media_present && (
                    <div>
                      <Label className="text-sm">Interview requests or media expectations</Label>
                      <Textarea
                        value={formData.additional_info?.interview_requests || ''}
                        onChange={(e) => updateField('additional_info', 'interview_requests', e.target.value)}
                        placeholder="Please describe any expected media interviews or press interactions..."
                        rows={2}
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.technical_requirements?.recording_allowed || false}
                      onCheckedChange={(checked) => updateField('technical_requirements', 'recording_allowed', checked)}
                    />
                    <Label className="font-normal">Recording the presentation</Label>
                  </div>
                  {formData.technical_requirements?.recording_allowed && (
                    <div className="pl-6">
                      <Label className="text-sm">Recording will be used for</Label>
                      <Select
                        value={formData.technical_requirements?.recording_purpose || 'internal'}
                        onValueChange={(value) => updateField('technical_requirements', 'recording_purpose', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal use only</SelectItem>
                          <SelectItem value="promotional">Promotional/marketing</SelectItem>
                          <SelectItem value="both">Both internal and promotional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.technical_requirements?.live_stream || false}
                      onCheckedChange={(checked) => updateField('technical_requirements', 'live_stream', checked)}
                    />
                    <Label className="font-normal">Live streaming the presentation</Label>
                  </div>
                </div>
              </div>

              {/* Other Engagements */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Other Engagements
                </Label>
                <div>
                  <Textarea
                    value={formData.additional_info?.special_requests || ''}
                    onChange={(e) => updateField('additional_info', 'special_requests', e.target.value)}
                    placeholder="Any other activities or commitments expected? (e.g., breakout session, book signing, one-on-one meetings, attending other sessions)"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">Booking Summary</h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Speaker</p>
                    <p className="font-medium">{speakerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Event Date</p>
                    <p className="font-medium">
                      {formData.event_overview?.event_date
                        ? new Date(formData.event_overview.event_date).toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })
                        : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Event</p>
                    <p className="font-medium">{formData.event_overview?.event_name || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{formData.event_overview?.venue_address || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Program</p>
                    <p className="font-medium capitalize">
                      {formData.speaker_program?.program_type?.replace('_', ' ') || 'Keynote'}
                      {formData.event_schedule?.program_length_minutes && ` (${formData.event_schedule.program_length_minutes} min)`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Start Time</p>
                    <p className="font-medium">{formData.event_schedule?.program_start_time || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Travel</p>
                    <p className="font-medium">
                      {formData.travel_accommodation?.fly_in_date && formData.travel_accommodation?.fly_out_date
                        ? `${new Date(formData.travel_accommodation.fly_in_date).toLocaleDateString()} - ${new Date(formData.travel_accommodation.fly_out_date).toLocaleDateString()}`
                        : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Audience Size</p>
                    <p className="font-medium">{formData.speaker_program?.audience_size || 0} attendees</p>
                  </div>
                </div>

                {/* Additional Commitments Summary */}
                {(formData.additional_info?.meet_greet_before ||
                  formData.additional_info?.meet_greet_after ||
                  formData.additional_info?.vip_reception ||
                  formData.additional_info?.press_media_present ||
                  formData.technical_requirements?.recording_allowed) && (
                  <div className="pt-4 border-t">
                    <p className="text-gray-500 text-sm mb-2">Additional Commitments:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.additional_info?.meet_greet_before && (
                        <Badge variant="secondary">Meet & Greet (Before)</Badge>
                      )}
                      {formData.additional_info?.meet_greet_after && (
                        <Badge variant="secondary">Meet & Greet (After)</Badge>
                      )}
                      {formData.additional_info?.vip_reception && (
                        <Badge variant="secondary">VIP Reception</Badge>
                      )}
                      {formData.additional_info?.press_media_present && (
                        <Badge variant="secondary">Press/Media</Badge>
                      )}
                      {formData.technical_requirements?.recording_allowed && (
                        <Badge variant="secondary">Recording</Badge>
                      )}
                      {formData.technical_requirements?.live_stream && (
                        <Badge variant="secondary">Live Stream</Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-500 text-sm">Speaker Fee</p>
                      <p className="font-medium">${speakerFee.toLocaleString()}</p>
                    </div>
                    {travelBuyout > 0 && (
                      <div>
                        <p className="text-gray-500 text-sm">Travel Allowance</p>
                        <p className="font-medium">${travelBuyout.toLocaleString()}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-gray-500 text-sm">Total Investment</p>
                      <p className="text-xl font-bold text-green-600">${totalFee.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">What happens next?</h4>
                <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                  <li>We'll confirm these details with {speakerName}</li>
                  <li>You'll receive a contract for e-signature</li>
                  <li>After signing, we'll send detailed logistics forms for venue, AV, etc.</li>
                  <li>We'll coordinate all remaining travel and event details</li>
                </ol>
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
          Back
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button onClick={nextStep}>
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        )}
      </div>
    </div>
  )
}

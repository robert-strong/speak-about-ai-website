"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Building,
  Calendar,
  Clock,
  MapPin,
  Users,
  Mic,
  Plane,
  Hotel,
  DollarSign,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  Globe,
  Camera
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Props {
  token: string
  firmOffer: any
  speakerName: string
}

export function SpeakerReviewClient({ token, firmOffer, speakerName }: Props) {
  const { toast } = useToast()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [speakerNotes, setSpeakerNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState(firmOffer.status)

  const eventOverview = firmOffer.event_overview || {}
  const speakerProgram = firmOffer.speaker_program || {}
  const eventSchedule = firmOffer.event_schedule || {}
  const technicalReqs = firmOffer.technical_requirements || {}
  const travelAccom = firmOffer.travel_accommodation || {}
  const additionalInfo = firmOffer.additional_info || {}
  const financialDetails = firmOffer.financial_details || {}
  const confirmation = firmOffer.confirmation || {}

  // Already responded
  if (status === 'speaker_confirmed' || status === 'speaker_declined' || firmOffer.speaker_confirmed !== null) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            {firmOffer.speaker_confirmed ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">You've Confirmed This Engagement</h1>
                <p className="text-gray-600">
                  Thank you for confirming! The Speak About AI team will be in touch with next steps.
                </p>
                {firmOffer.speaker_notes && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                    <p className="text-sm font-medium text-gray-700">Your notes:</p>
                    <p className="text-sm text-gray-600">{firmOffer.speaker_notes}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">You've Declined This Engagement</h1>
                <p className="text-gray-600">
                  Thank you for your response. We appreciate you letting us know.
                </p>
                {firmOffer.speaker_notes && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                    <p className="text-sm font-medium text-gray-700">Your feedback:</p>
                    <p className="text-sm text-gray-600">{firmOffer.speaker_notes}</p>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    )
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/firm-offers/${firmOffer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'speaker_confirmed',
          speaker_confirmed: true,
          speaker_notes: speakerNotes
        })
      })

      if (!response.ok) throw new Error('Failed to confirm')

      setStatus('speaker_confirmed')
      setShowConfirmDialog(false)
      toast({
        title: "Confirmed!",
        description: "You've confirmed this speaking engagement."
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

  const handleDecline = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/firm-offers/${firmOffer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'speaker_declined',
          speaker_confirmed: false,
          speaker_notes: speakerNotes
        })
      })

      if (!response.ok) throw new Error('Failed to decline')

      setStatus('speaker_declined')
      setShowDeclineDialog(false)
      toast({
        title: "Response Submitted",
        description: "Thank you for your feedback."
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return ''
    }
  }

  // Helper to check if a section has meaningful data
  const hasScheduleData = eventSchedule.speaker_arrival_time || eventSchedule.program_start_time ||
                          eventSchedule.program_length_minutes || eventSchedule.detailed_timeline
  const hasTravelData = travelAccom.fly_in_date || travelAccom.fly_out_date || travelAccom.nearest_airport ||
                        travelAccom.hotel_required || travelAccom.hotel_dates
  const hasTechnicalData = technicalReqs.recording_allowed === true || technicalReqs.live_stream === true ||
                           technicalReqs.photography_allowed === true || technicalReqs.tech_rehearsal_date
  const hasAdditionalData = additionalInfo.green_room_available === true || additionalInfo.meet_greet_before === true ||
                            additionalInfo.meet_greet_after === true || additionalInfo.vip_reception === true ||
                            additionalInfo.press_media_present === true || additionalInfo.special_requests ||
                            additionalInfo.additional_engagements === true || additionalInfo.meet_and_greet ||
                            additionalInfo.marketing_promotion || additionalInfo.press_media || additionalInfo.guest_list_notes

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Speaking Engagement Review</h1>
          <p className="text-gray-600 mt-2">
            Please review the details below and confirm your availability
          </p>
          <Badge className="mt-2 bg-blue-100 text-blue-800">
            {firmOffer.proposal_title || eventOverview.event_name || 'Speaking Engagement'}
          </Badge>
        </div>

        {/* Financial - Always show prominently */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-700" />
                <span className="text-lg font-medium text-green-800">Your Fee</span>
              </div>
              <span className="text-3xl font-bold text-green-700">
                ${(financialDetails.speaker_fee || firmOffer.total_investment || 0).toLocaleString()}
              </span>
            </div>
            {financialDetails.travel_expenses_type && (
              <p className="text-sm text-green-700 mt-2">
                Travel: {financialDetails.travel_expenses_type === 'flat_buyout' ?
                  `Flat buyout${financialDetails.travel_buyout_amount ? ` ($${financialDetails.travel_buyout_amount.toLocaleString()})` : ''}` :
                  financialDetails.travel_expenses_type === 'client_books' ? 'Client books travel' :
                  financialDetails.travel_expenses_type === 'reimbursement' ? 'Speaker books, client reimburses' :
                  financialDetails.travel_expenses_type.replace(/_/g, ' ')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Event Overview - Essential info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Event Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(eventOverview.event_name || firmOffer.event_title) && (
                <div>
                  <p className="text-sm text-gray-500">Event Name</p>
                  <p className="font-medium">{eventOverview.event_name || firmOffer.event_title}</p>
                </div>
              )}
              {eventOverview.end_client_name && (
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">{eventOverview.end_client_name}</p>
                </div>
              )}
              {(eventOverview.event_date || firmOffer.event_date) && formatDate(eventOverview.event_date || firmOffer.event_date) && (
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(eventOverview.event_date || firmOffer.event_date)}
                  </p>
                </div>
              )}
              {eventOverview.event_location && (
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {eventOverview.event_location}
                  </p>
                </div>
              )}
              {(eventOverview.venue_name || eventOverview.venue_address) && (
                <div>
                  <p className="text-sm text-gray-500">Venue</p>
                  <p className="font-medium">
                    {eventOverview.venue_name}
                    {eventOverview.venue_name && eventOverview.venue_address && <br />}
                    {eventOverview.venue_address}
                  </p>
                </div>
              )}
              {eventOverview.event_website && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Event Website</p>
                  <a href={eventOverview.event_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {eventOverview.event_website}
                  </a>
                </div>
              )}
            </div>

            {/* Logistics Contact - only show if filled */}
            {(eventOverview.logistics_contact?.name || eventOverview.logistics_contact?.email) && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Logistics Contact</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {eventOverview.logistics_contact?.name && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4 text-gray-400" />
                      {eventOverview.logistics_contact.name}
                    </span>
                  )}
                  {eventOverview.logistics_contact?.email && (
                    <a href={`mailto:${eventOverview.logistics_contact.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                      <Mail className="h-4 w-4" />
                      {eventOverview.logistics_contact.email}
                    </a>
                  )}
                  {eventOverview.logistics_contact?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {eventOverview.logistics_contact.phone}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Speaker Program - Essential */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {speakerProgram.program_type && (
                <div>
                  <p className="text-sm text-gray-500">Program Type</p>
                  <p className="font-medium capitalize">{speakerProgram.program_type.replace(/_/g, ' ')}</p>
                </div>
              )}
              {speakerProgram.audience_size && (
                <div>
                  <p className="text-sm text-gray-500">Audience Size</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {speakerProgram.audience_size} attendees
                  </p>
                </div>
              )}
              {speakerProgram.speaker_attire && (
                <div>
                  <p className="text-sm text-gray-500">Attire</p>
                  <p className="font-medium capitalize">{speakerProgram.speaker_attire.replace(/_/g, ' ')}</p>
                </div>
              )}
              {speakerProgram.program_topic && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Topic</p>
                  <p className="font-medium">{speakerProgram.program_topic}</p>
                </div>
              )}
              {speakerProgram.audience_demographics && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Audience Demographics</p>
                  <p className="font-medium">{speakerProgram.audience_demographics}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule - only if has data */}
        {hasScheduleData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {eventSchedule.speaker_arrival_time && (
                  <div>
                    <p className="text-sm text-gray-500">Arrival at Venue</p>
                    <p className="font-medium">{eventSchedule.speaker_arrival_time}</p>
                  </div>
                )}
                {eventSchedule.program_start_time && (
                  <div>
                    <p className="text-sm text-gray-500">Program Start</p>
                    <p className="font-medium">{eventSchedule.program_start_time}</p>
                  </div>
                )}
                {eventSchedule.program_length_minutes && (
                  <div>
                    <p className="text-sm text-gray-500">Program Length</p>
                    <p className="font-medium">{eventSchedule.program_length_minutes} min</p>
                  </div>
                )}
                {eventSchedule.qa_length_minutes && (
                  <div>
                    <p className="text-sm text-gray-500">Q&A</p>
                    <p className="font-medium">{eventSchedule.qa_length_minutes} min</p>
                  </div>
                )}
                {eventSchedule.speaker_departure_time && (
                  <div>
                    <p className="text-sm text-gray-500">Departure</p>
                    <p className="font-medium">{eventSchedule.speaker_departure_time}</p>
                  </div>
                )}
                {eventSchedule.timezone && (
                  <div>
                    <p className="text-sm text-gray-500">Timezone</p>
                    <p className="font-medium">{eventSchedule.timezone}</p>
                  </div>
                )}
              </div>
              {eventSchedule.detailed_timeline && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Timeline</p>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                    {eventSchedule.detailed_timeline}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Technical - only if has data */}
        {hasTechnicalData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Technical & Recording
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {technicalReqs.recording_allowed === true && (
                  <Badge variant="secondary">
                    <Camera className="h-3 w-3 mr-1" />
                    Recording {technicalReqs.recording_purpose ? `(${technicalReqs.recording_purpose})` : ''}
                  </Badge>
                )}
                {technicalReqs.live_stream === true && (
                  <Badge variant="secondary">Live Streaming</Badge>
                )}
                {technicalReqs.photography_allowed === true && (
                  <Badge variant="secondary">Photography</Badge>
                )}
              </div>
              {technicalReqs.tech_rehearsal_date && formatDate(technicalReqs.tech_rehearsal_date) && (
                <div>
                  <p className="text-sm text-gray-500">Tech Rehearsal</p>
                  <p className="font-medium">
                    {formatDate(technicalReqs.tech_rehearsal_date)}
                    {technicalReqs.tech_rehearsal_time ? ` at ${technicalReqs.tech_rehearsal_time}` : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Travel - only if has data */}
        {hasTravelData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Travel & Accommodation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {travelAccom.fly_in_date && formatDate(travelAccom.fly_in_date) && (
                  <div>
                    <p className="text-sm text-gray-500">Fly-In Date</p>
                    <p className="font-medium">{formatDate(travelAccom.fly_in_date)}</p>
                  </div>
                )}
                {travelAccom.fly_out_date && formatDate(travelAccom.fly_out_date) && (
                  <div>
                    <p className="text-sm text-gray-500">Fly-Out Date</p>
                    <p className="font-medium">{formatDate(travelAccom.fly_out_date)}</p>
                  </div>
                )}
                {travelAccom.nearest_airport && (
                  <div>
                    <p className="text-sm text-gray-500">Nearest Airport</p>
                    <p className="font-medium">{travelAccom.nearest_airport}</p>
                  </div>
                )}
                {travelAccom.airport_transportation && travelAccom.airport_transportation !== 'tbd' && (
                  <div>
                    <p className="text-sm text-gray-500">Airport Transportation</p>
                    <p className="font-medium capitalize">{travelAccom.airport_transportation.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>

              {/* Hotel */}
              {travelAccom.hotel_required === true && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hotel className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Hotel Accommodation</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    {travelAccom.hotel_dates && (
                      <div>
                        <p className="text-sm text-gray-500">Dates</p>
                        <p className="font-medium">{travelAccom.hotel_dates}</p>
                      </div>
                    )}
                    {travelAccom.hotel_tier && travelAccom.hotel_tier !== 'tbd' && (
                      <div>
                        <p className="text-sm text-gray-500">Hotel Tier</p>
                        <p className="font-medium capitalize">{travelAccom.hotel_tier}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Meals */}
              {travelAccom.meals_provided?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Meals Provided</p>
                  <p className="font-medium">{travelAccom.meals_provided.join(', ')}</p>
                </div>
              )}

              {/* Perks */}
              {(travelAccom.guest_list_invitation === true || travelAccom.vip_meet_greet === true) && (
                <div className="flex gap-2 flex-wrap">
                  {travelAccom.guest_list_invitation === true && <Badge>Guest List Invite</Badge>}
                  {travelAccom.vip_meet_greet === true && <Badge>VIP Meet & Greet</Badge>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Info - only if has data */}
        {hasAdditionalData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {additionalInfo.green_room_available === true && <Badge variant="secondary">Green Room Available</Badge>}
                {additionalInfo.meet_greet_before === true && <Badge variant="secondary">Meet & Greet (Before)</Badge>}
                {additionalInfo.meet_greet_after === true && <Badge variant="secondary">Meet & Greet (After)</Badge>}
                {additionalInfo.vip_reception === true && <Badge variant="secondary">VIP Reception</Badge>}
                {additionalInfo.press_media_present === true && <Badge variant="secondary">Press/Media Present</Badge>}
              </div>
              {additionalInfo.special_requests && (
                <div>
                  <p className="text-sm text-gray-500">Special Requests</p>
                  <p className="font-medium whitespace-pre-wrap">{additionalInfo.special_requests}</p>
                </div>
              )}

              {/* Additional Engagements Section */}
              {(additionalInfo.meet_and_greet || additionalInfo.marketing_promotion || additionalInfo.press_media || additionalInfo.guest_list_notes) && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Additional Engagement Opportunities</p>
                  <div className="space-y-3">
                    {additionalInfo.meet_and_greet && (
                      <div>
                        <p className="text-sm text-gray-500">Meet & Greet</p>
                        <p className="font-medium whitespace-pre-wrap">{additionalInfo.meet_and_greet}</p>
                      </div>
                    )}
                    {additionalInfo.guest_list_notes && (
                      <div>
                        <p className="text-sm text-gray-500">Guest List Notes</p>
                        <p className="font-medium whitespace-pre-wrap">{additionalInfo.guest_list_notes}</p>
                      </div>
                    )}
                    {additionalInfo.marketing_promotion && (
                      <div>
                        <p className="text-sm text-gray-500">Marketing & Promotion</p>
                        <p className="font-medium whitespace-pre-wrap">{additionalInfo.marketing_promotion}</p>
                      </div>
                    )}
                    {additionalInfo.press_media && (
                      <div>
                        <p className="text-sm text-gray-500">Press & Media</p>
                        <p className="font-medium whitespace-pre-wrap">{additionalInfo.press_media}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prep Call - only if requested */}
        {confirmation.prep_call_requested === true && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prep Call
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                The client has requested a prep call.
                {confirmation.prep_call_date_preferences && (
                  <span className="block mt-1 font-medium">Preferred timing: {confirmation.prep_call_date_preferences}</span>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Additional Notes */}
        {confirmation.additional_notes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Notes from Client</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{confirmation.additional_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Ready to Confirm?</h2>
              <p className="text-gray-600 mb-6">
                Please review all details above and let us know if you can accept this engagement.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowConfirmDialog(true)}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirm Engagement
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowDeclineDialog(true)}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirm Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Speaking Engagement</DialogTitle>
              <DialogDescription>
                You're confirming your availability for this event. Add any notes or special requests below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Notes or Special Requests (Optional)</Label>
                <Textarea
                  value={speakerNotes}
                  onChange={(e) => setSpeakerNotes(e.target.value)}
                  placeholder="Any additional information or requests..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Engagement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decline Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Engagement</DialogTitle>
              <DialogDescription>
                Please let us know why you're unable to accept this engagement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason for Declining</Label>
                <Textarea
                  value={speakerNotes}
                  onChange={(e) => setSpeakerNotes(e.target.value)}
                  placeholder="Schedule conflict, topic mismatch, etc..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDecline}
                disabled={isSubmitting}
                variant="destructive"
              >
                {isSubmitting ? 'Submitting...' : 'Decline Engagement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

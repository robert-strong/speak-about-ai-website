"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
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
  Send,
  Copy,
  ExternalLink,
  Edit,
  User,
  Mail,
  Phone,
  Loader2,
  FileSignature,
  Video,
  Camera,
  Monitor,
  Coffee,
  Handshake,
  Globe,
  FileText,
  Briefcase,
  MessageSquare
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface FirmOffer {
  id: number
  status: string
  speaker_access_token: string
  event_overview: any
  speaker_program: any
  event_schedule: any
  technical_requirements: any
  travel_accommodation: any
  additional_info: any
  financial_details: any
  confirmation: any
  created_at: string
  updated_at: string
  sent_to_speaker_at?: string
  speaker_viewed_at?: string
  speaker_response_at?: string
  speaker_confirmed?: boolean
  speaker_notes?: string
}

export default function FirmOfferViewPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [offer, setOffer] = useState<FirmOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [speakerEmail, setSpeakerEmail] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadOffer()
  }, [params.id])

  const loadOffer = async () => {
    try {
      const response = await fetch(`/api/firm-offers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setOffer(data)
        // Pre-fill speaker email if available
        if (data.speaker_program?.speaker_email) {
          setSpeakerEmail(data.speaker_program.speaker_email)
        }
      }
    } catch (error) {
      console.error("Error loading firm offer:", error)
      toast({
        title: "Error",
        description: "Failed to load firm offer",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = () => {
    if (!offer) return
    const url = `${window.location.origin}/speaker-review/${offer.speaker_access_token}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: "Speaker review link copied to clipboard",
    })
  }

  const copyClientLink = () => {
    if (!offer) return
    const url = `${window.location.origin}/firm-offer/${offer.speaker_access_token}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: "Client form link copied to clipboard",
    })
  }

  const handleSendToSpeaker = async () => {
    if (!offer || !speakerEmail) return

    setSending(true)
    try {
      const response = await fetch(`/api/firm-offers/${offer.id}/send-to-speaker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker_email: speakerEmail,
          speaker_name: offer.speaker_program?.speaker_name
        })
      })

      if (response.ok) {
        toast({
          title: "Sent!",
          description: "Firm offer sent to speaker for review",
        })
        setShowSendDialog(false)
        loadOffer() // Refresh data
      } else {
        throw new Error('Failed to send')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send to speaker",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = () => {
    if (!offer) return null

    if (offer.speaker_confirmed === true) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Speaker Confirmed</Badge>
    }
    if (offer.speaker_confirmed === false) {
      return <Badge className="bg-red-100 text-red-800">Speaker Declined</Badge>
    }
    if (offer.speaker_viewed_at) {
      return <Badge className="bg-purple-100 text-purple-800">Speaker Viewed</Badge>
    }
    if (offer.sent_to_speaker_at) {
      return <Badge className="bg-blue-100 text-blue-800"><Send className="h-3 w-3 mr-1" />Sent to Speaker</Badge>
    }
    if (offer.status === 'completed') {
      return <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="h-3 w-3 mr-1" />Client Completed</Badge>
    }
    if (offer.status === 'draft') {
      return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="fixed left-0 top-0 h-full z-[60]">
          <AdminSidebar />
        </div>
        <div className="flex-1 ml-72 min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="fixed left-0 top-0 h-full z-[60]">
          <AdminSidebar />
        </div>
        <div className="flex-1 ml-72 min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Firm offer not found</p>
        </div>
      </div>
    )
  }

  const overview = offer.event_overview || {}
  const program = offer.speaker_program || {}
  const schedule = offer.event_schedule || {}
  const technical = offer.technical_requirements || {}
  const travel = offer.travel_accommodation || {}
  const additional = offer.additional_info || {}
  const financial = offer.financial_details || {}
  const confirmation = offer.confirmation || {}
  const isVirtual = overview.event_classification === 'virtual'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>

      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/firm-offers')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Firm Offers
            </Button>

            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {overview.event_name || overview.company_name || 'Firm Offer'}
                  </h1>
                  {getStatusBadge()}
                </div>
                <p className="text-gray-600">
                  Created {formatDate(offer.created_at)}
                  {offer.updated_at && ` • Updated ${formatDate(offer.updated_at)}`}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={copyClientLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Client Link
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowSendDialog(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Speaker
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-amber-500" />
                    Event Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">{overview.company_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Client</p>
                      <p className="font-medium">{overview.end_client_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Event Name</p>
                      <p className="font-medium">{overview.event_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Event Date</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {overview.event_date && formatDate(overview.event_date) ? formatDate(overview.event_date) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {overview.event_location || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Event Type</p>
                      <p className="font-medium capitalize">{overview.event_classification || '-'}</p>
                    </div>
                    {overview.event_website && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Event Website</p>
                        <a href={overview.event_website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {overview.event_website}
                        </a>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Billing Contact</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-gray-400" />
                        {overview.billing_contact?.name || '-'}
                        {overview.billing_contact?.title && <span className="text-gray-400">({overview.billing_contact.title})</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {overview.billing_contact?.email || '-'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {overview.billing_contact?.phone || '-'}
                      </div>
                      {overview.billing_contact?.address && (
                        <div className="flex items-center gap-1 col-span-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {overview.billing_contact.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Logistics Contact</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-gray-400" />
                        {overview.logistics_contact?.name || '-'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {overview.logistics_contact?.email || '-'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {overview.logistics_contact?.phone || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Venue Details */}
                  {(overview.venue?.name || overview.venue?.address) && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Venue Details</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4 text-gray-400" />
                          {overview.venue?.name || '-'}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {overview.venue?.address || '-'}
                        </div>
                        {overview.venue?.contact_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            {overview.venue.contact_name}
                          </div>
                        )}
                        {overview.venue?.contact_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {overview.venue.contact_email}
                          </div>
                        )}
                        {overview.venue?.contact_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {overview.venue.contact_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Speaker & Program */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-blue-500" />
                    Speaker & Program
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Speaker Name</p>
                      <p className="font-medium">{program.speaker_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Program Type</p>
                      <p className="font-medium capitalize">{program.program_type || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Topic</p>
                      <p className="font-medium">{program.program_topic || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Audience Size</p>
                      <p className="font-medium flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {program.audience_size || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Attire</p>
                      <p className="font-medium capitalize">{program.speaker_attire?.replace(/_/g, ' ') || '-'}</p>
                    </div>
                    {program.audience_demographics && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Audience Demographics</p>
                        <p className="font-medium">{program.audience_demographics}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    Event Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Event Start</p>
                      <p className="font-medium">{schedule.event_start_time || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Event End</p>
                      <p className="font-medium">{schedule.event_end_time || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Speaker Arrival</p>
                      <p className="font-medium">{schedule.speaker_arrival_time || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Speaker Departure</p>
                      <p className="font-medium">{schedule.speaker_departure_time || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Program Start</p>
                      <p className="font-medium">{schedule.program_start_time || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Timezone</p>
                      <p className="font-medium">{schedule.timezone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Program Length</p>
                      <p className="font-medium">{schedule.program_length_minutes ? `${schedule.program_length_minutes} min` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Q&A Length</p>
                      <p className="font-medium">{schedule.qa_length_minutes ? `${schedule.qa_length_minutes} min` : '-'}</p>
                    </div>
                  </div>
                  {schedule.detailed_timeline && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Detailed Timeline</p>
                        <p className="font-medium whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">{schedule.detailed_timeline}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Technical Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-indigo-500" />
                    Technical Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Recording Allowed</p>
                      <p className="font-medium flex items-center gap-1">
                        <Video className="h-4 w-4" />
                        {technical.recording_allowed === true ? 'Yes' : technical.recording_allowed === false ? 'No' : '-'}
                      </p>
                    </div>
                    {technical.recording_allowed && technical.recording_purpose && (
                      <div>
                        <p className="text-sm text-gray-500">Recording Purpose</p>
                        <p className="font-medium">{technical.recording_purpose}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Live Streaming</p>
                      <p className="font-medium">{technical.live_streaming === true ? 'Yes' : technical.live_streaming === false ? 'No' : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Photography Allowed</p>
                      <p className="font-medium flex items-center gap-1">
                        <Camera className="h-4 w-4" />
                        {technical.photography_allowed === true ? 'Yes' : technical.photography_allowed === false ? 'No' : '-'}
                      </p>
                    </div>
                    {technical.av_requirements && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">AV Requirements</p>
                        <p className="font-medium">{technical.av_requirements}</p>
                      </div>
                    )}
                    {technical.tech_rehearsal_time && (
                      <div>
                        <p className="text-sm text-gray-500">Tech Rehearsal Time</p>
                        <p className="font-medium">{technical.tech_rehearsal_time}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Travel - only show for non-virtual events or if travel data exists */}
              {(!isVirtual || travel.fly_in_date || travel.fly_out_date || travel.nearest_airport || travel.hotel_name) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-green-500" />
                      Travel & Accommodation
                      {isVirtual && <Badge variant="secondary" className="text-xs">Virtual Event</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isVirtual && !travel.fly_in_date && !travel.fly_out_date && !travel.nearest_airport ? (
                      <p className="text-sm text-gray-500">No travel required for virtual event</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Fly In Date</p>
                          <p className="font-medium">{travel.fly_in_date && formatDate(travel.fly_in_date) ? formatDate(travel.fly_in_date) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fly Out Date</p>
                          <p className="font-medium">{travel.fly_out_date && formatDate(travel.fly_out_date) ? formatDate(travel.fly_out_date) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Nearest Airport</p>
                          <p className="font-medium">{travel.nearest_airport || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Airport Transport</p>
                          <p className="font-medium">{travel.airport_transport_provided ? 'Provided' : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hotel Transport</p>
                          <p className="font-medium">{travel.hotel_transport_provided ? 'Provided' : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hotel Required</p>
                          <p className="font-medium">{travel.hotel_required === true ? 'Yes' : travel.hotel_required === false ? 'No' : '-'}</p>
                        </div>
                        {travel.hotel_name && (
                          <div>
                            <p className="text-sm text-gray-500">Hotel</p>
                            <p className="font-medium flex items-center gap-1">
                              <Hotel className="h-4 w-4" />
                              {travel.hotel_name}
                            </p>
                          </div>
                        )}
                        {travel.hotel_dates_needed && (
                          <div>
                            <p className="text-sm text-gray-500">Hotel Dates</p>
                            <p className="font-medium">{travel.hotel_dates_needed}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              {(additional.green_room_available !== undefined || additional.meet_and_greet !== undefined || additional.additional_engagements || additional.marketing_promotion || additional.press_media || additional.special_requests || additional.guest_list_notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-orange-500" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Green Room</p>
                        <p className="font-medium flex items-center gap-1">
                          <Coffee className="h-4 w-4" />
                          {additional.green_room_available === true ? 'Available' : additional.green_room_available === false ? 'Not Available' : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Meet & Greet</p>
                        <p className="font-medium flex items-center gap-1">
                          <Handshake className="h-4 w-4" />
                          {additional.meet_and_greet === true ? 'Yes' : additional.meet_and_greet === false ? 'No' : '-'}
                        </p>
                      </div>
                      {additional.additional_engagements && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Additional Engagements</p>
                          <p className="font-medium">{additional.additional_engagements}</p>
                        </div>
                      )}
                      {additional.marketing_promotion && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Marketing/Promotion</p>
                          <p className="font-medium">{additional.marketing_promotion}</p>
                        </div>
                      )}
                      {additional.press_media && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Press/Media</p>
                          <p className="font-medium">{additional.press_media}</p>
                        </div>
                      )}
                      {additional.special_requests && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Special Requests</p>
                          <p className="font-medium">{additional.special_requests}</p>
                        </div>
                      )}
                      {additional.guest_list_notes && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Guest List Notes</p>
                          <p className="font-medium">{additional.guest_list_notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Confirmation/Prep Call */}
              {(confirmation.prep_call_date || confirmation.prep_call_time || confirmation.additional_notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-cyan-500" />
                      Confirmation & Prep
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {confirmation.prep_call_date && formatDate(confirmation.prep_call_date) && (
                        <div>
                          <p className="text-sm text-gray-500">Prep Call Date</p>
                          <p className="font-medium">{formatDate(confirmation.prep_call_date)}</p>
                        </div>
                      )}
                      {confirmation.prep_call_time && (
                        <div>
                          <p className="text-sm text-gray-500">Prep Call Time</p>
                          <p className="font-medium">{confirmation.prep_call_time}</p>
                        </div>
                      )}
                      {confirmation.additional_notes && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Additional Notes</p>
                          <p className="font-medium whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">{confirmation.additional_notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Financial Summary */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <DollarSign className="h-5 w-5" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-green-700">Speaker Fee</p>
                    <p className="text-2xl font-bold text-green-800">
                      {financial.speaker_fee ? formatCurrency(financial.speaker_fee) : '-'}
                    </p>
                  </div>
                  {financial.travel_expenses_type && (
                    <div>
                      <p className="text-sm text-green-700">Travel Arrangement</p>
                      <p className="font-medium text-green-800 capitalize">
                        {financial.travel_expenses_type === 'client_booked' ? 'Client Books Travel' :
                         financial.travel_expenses_type === 'speaker_booked' ? 'Speaker Books (Reimbursed)' :
                         financial.travel_expenses_type === 'stipend' ? 'Fixed Stipend' :
                         financial.travel_expenses_type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                  {financial.travel_expenses_amount && (
                    <div>
                      <p className="text-sm text-green-700">Travel Budget</p>
                      <p className="text-lg font-semibold text-green-800">
                        {formatCurrency(financial.travel_expenses_amount)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-green-700">Payment Terms</p>
                    <p className="font-medium text-green-800 capitalize">
                      {financial.payment_terms?.replace(/_/g, ' ') || '-'}
                    </p>
                  </div>
                  {financial.payment_notes && (
                    <div>
                      <p className="text-sm text-green-700">Payment Notes</p>
                      <p className="font-medium text-green-800 text-sm">
                        {financial.payment_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowSendDialog(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to Speaker
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={copyShareLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Speaker Link
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`/speaker-review/${offer.speaker_access_token}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview Speaker View
                  </Button>
                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={copyClientLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Client Form Link
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/admin/firm-offers/new?edit=${offer.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Firm Offer
                  </Button>
                </CardContent>
              </Card>

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-xs text-gray-500">{formatDate(offer.created_at)}</p>
                      </div>
                    </div>
                    {offer.status === 'completed' && (
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Client Completed</p>
                          <p className="text-xs text-gray-500">{formatDate(offer.updated_at)}</p>
                        </div>
                      </div>
                    )}
                    {offer.sent_to_speaker_at && (
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Sent to Speaker</p>
                          <p className="text-xs text-gray-500">{formatDate(offer.sent_to_speaker_at)}</p>
                        </div>
                      </div>
                    )}
                    {offer.speaker_viewed_at && (
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Speaker Viewed</p>
                          <p className="text-xs text-gray-500">{formatDate(offer.speaker_viewed_at)}</p>
                        </div>
                      </div>
                    )}
                    {offer.speaker_response_at && (
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 ${offer.speaker_confirmed ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                        <div>
                          <p className="text-sm font-medium">
                            Speaker {offer.speaker_confirmed ? 'Confirmed' : 'Declined'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(offer.speaker_response_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Speaker Notes */}
              {offer.speaker_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Speaker Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{offer.speaker_notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send to Speaker Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Speaker for Review</DialogTitle>
            <DialogDescription>
              Send this firm offer to the speaker for their review and confirmation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="speakerEmail">Speaker Email</Label>
              <Input
                id="speakerEmail"
                type="email"
                value={speakerEmail}
                onChange={(e) => setSpeakerEmail(e.target.value)}
                placeholder="speaker@example.com"
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                The speaker will receive a link to review all event details and either confirm or decline the engagement.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendToSpeaker}
              disabled={!speakerEmail || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Speaker
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

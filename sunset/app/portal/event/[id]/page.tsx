"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Building2,
  User,
  Mic,
  Monitor,
  Plane,
  Hotel,
  Utensils,
  Camera,
  Video,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Globe,
  Shirt,
  MessageSquare,
  CreditCard
} from "lucide-react"
import Link from "next/link"

interface EventDetails {
  // Basic Info
  id: number
  project_name: string
  event_name?: string
  event_date?: string
  event_location?: string
  event_classification?: "virtual" | "local" | "travel"
  status: string
  
  // Event Overview - Billing Contact
  billing_contact_name?: string
  billing_contact_title?: string
  billing_contact_email?: string
  billing_contact_phone?: string
  billing_address?: string
  
  // Event Overview - Logistics Contact
  logistics_contact_name?: string
  logistics_contact_email?: string
  logistics_contact_phone?: string
  
  // Event Overview - Additional
  end_client_name?: string
  client_name: string
  company?: string
  event_website?: string
  venue_name?: string
  venue_address?: string
  venue_contact_name?: string
  venue_contact_email?: string
  venue_contact_phone?: string
  
  // Speaker Program Details
  requested_speaker_name?: string
  program_topic?: string
  program_type?: string
  audience_size?: number
  audience_demographics?: string
  speaker_attire?: string
  
  // Event Schedule
  event_start_time?: string
  event_end_time?: string
  speaker_arrival_time?: string
  program_start_time?: string
  program_length?: number
  qa_length?: number
  total_program_length?: number
  speaker_departure_time?: string
  event_timeline?: string
  event_timezone?: string
  
  // Technical Requirements
  av_requirements?: string
  recording_allowed?: boolean
  recording_purpose?: string
  live_streaming?: boolean
  photography_allowed?: boolean
  tech_rehearsal_date?: string
  tech_rehearsal_time?: string
  
  // Travel & Accommodation
  travel_required?: boolean
  fly_in_date?: string
  fly_out_date?: string
  nearest_airport?: string
  airport_transport_provided?: boolean
  airport_transport_details?: string
  venue_transport_provided?: boolean
  venue_transport_details?: string
  accommodation_required?: boolean
  hotel_dates_needed?: string
  hotel_tier_preference?: string
  meals_provided?: string
  dietary_requirements?: string
  guest_list_details?: string
  
  // Additional Information
  green_room_available?: boolean
  meet_greet_opportunities?: string
  marketing_use_allowed?: boolean
  press_media_present?: boolean
  media_interview_requests?: string
  special_requests?: string
  
  // Financial Details
  speaker_fee?: number
  travel_expenses_type?: string
  travel_expenses_amount?: number
  payment_terms?: string
  invoice_number?: string
  purchase_order_number?: string
  
  // Confirmation Details
  prep_call_requested?: boolean
  prep_call_date?: string
  prep_call_time?: string
  additional_notes?: string
  notes?: string
  
  // Status Tracking
  contract_signed?: boolean
  invoice_sent?: boolean
  payment_received?: boolean
  presentation_ready?: boolean
  materials_sent?: boolean
}

const STATUS_COLORS = {
  "2plus_months": "bg-blue-500",
  "1to2_months": "bg-yellow-500", 
  "less_than_month": "bg-orange-500",
  "final_week": "bg-red-500",
  "completed": "bg-green-500",
  "cancelled": "bg-gray-500"
}

const STATUS_LABELS = {
  "2plus_months": "2+ Months Out",
  "1to2_months": "1-2 Months Out", 
  "less_than_month": "< 1 Month Out",
  "final_week": "Final Week",
  "completed": "Completed",
  "cancelled": "Cancelled"
}

export default function EventDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check authentication
    const isClientLoggedIn = localStorage.getItem("clientLoggedIn")
    if (!isClientLoggedIn) {
      router.push("/portal")
      return
    }

    // Load event details
    loadEventDetails()
  }, [params.id, router])

  const loadEventDetails = async () => {
    try {
      // In production, this would be an API call
      // For now, get from localStorage
      const projectsData = localStorage.getItem("clientProjects")
      if (projectsData) {
        const projects = JSON.parse(projectsData)
        const foundEvent = projects.find((p: any) => p.id === parseInt(params.id as string))
        if (foundEvent) {
          setEvent(foundEvent)
        } else {
          setError("Event not found")
        }
      }
    } catch (error) {
      console.error("Error loading event:", error)
      setError("Failed to load event details")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time?: string) => {
    if (!time) return "TBD"
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return time
    }
  }

  const calculateDaysUntilEvent = (eventDate?: string) => {
    if (!eventDate) return null
    const today = new Date()
    const event = new Date(eventDate)
    const diffTime = event.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error || "Event not found"}</p>
              <Link href="/portal/dashboard">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const daysUntilEvent = calculateDaysUntilEvent(event.event_date)
  const isUpcoming = daysUntilEvent !== null && daysUntilEvent <= 30 && daysUntilEvent >= 0
  const isOverdue = daysUntilEvent !== null && daysUntilEvent < 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/portal/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {event.event_name || event.project_name}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <Badge className={`${STATUS_COLORS[event.status as keyof typeof STATUS_COLORS]} text-white`}>
                  {STATUS_LABELS[event.status as keyof typeof STATUS_LABELS]}
                </Badge>
                {event.event_classification && (
                  <Badge variant={
                    event.event_classification === 'virtual' ? 'secondary' : 
                    event.event_classification === 'travel' ? 'default' : 
                    'outline'
                  }>
                    {event.event_classification === 'virtual' && <Monitor className="w-3 h-3 mr-1" />}
                    {event.event_classification === 'travel' && <Plane className="w-3 h-3 mr-1" />}
                    {event.event_classification === 'local' && <MapPin className="w-3 h-3 mr-1" />}
                    {event.event_classification.toUpperCase()}
                  </Badge>
                )}
                {isUpcoming && (
                  <Badge className="bg-orange-500 text-white">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {daysUntilEvent} DAYS LEFT
                  </Badge>
                )}
                {isOverdue && (
                  <Badge className="bg-red-500 text-white">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    OVERDUE
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Overview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Event Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Event Information</h4>
                  <div className="space-y-2">
                    {event.event_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {event.event_location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{event.event_location}</span>
                      </div>
                    )}
                    {event.event_website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a href={event.event_website} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          Event Website
                        </a>
                      </div>
                    )}
                    {event.end_client_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>End Client: {event.end_client_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4" />

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Venue Details</h4>
                  <div className="space-y-2">
                    {event.venue_name && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">{event.venue_name}</p>
                          {event.venue_address && (
                            <p className="text-sm text-gray-600">{event.venue_address}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {event.venue_contact_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{event.venue_contact_name}</span>
                      </div>
                    )}
                    {event.venue_contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${event.venue_contact_email}`} 
                           className="text-sm text-blue-600 hover:underline">
                          {event.venue_contact_email}
                        </a>
                      </div>
                    )}
                    {event.venue_contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{event.venue_contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Billing Contact</h4>
                  <div className="space-y-2">
                    {event.billing_contact_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>
                          {event.billing_contact_name}
                          {event.billing_contact_title && `, ${event.billing_contact_title}`}
                        </span>
                      </div>
                    )}
                    {event.billing_contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${event.billing_contact_email}`} 
                           className="text-blue-600 hover:underline">
                          {event.billing_contact_email}
                        </a>
                      </div>
                    )}
                    {event.billing_contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{event.billing_contact_phone}</span>
                      </div>
                    )}
                    {event.billing_address && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-sm whitespace-pre-line">{event.billing_address}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4" />

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Logistics Contact</h4>
                  <div className="space-y-2">
                    {event.logistics_contact_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{event.logistics_contact_name}</span>
                      </div>
                    )}
                    {event.logistics_contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${event.logistics_contact_email}`} 
                           className="text-blue-600 hover:underline">
                          {event.logistics_contact_email}
                        </a>
                      </div>
                    )}
                    {event.logistics_contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{event.logistics_contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Speaker Program Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Speaker Program Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {event.requested_speaker_name && (
                  <div>
                    <p className="text-sm text-gray-500">Requested Speaker</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      {event.requested_speaker_name}
                    </p>
                  </div>
                )}
                {event.program_topic && (
                  <div>
                    <p className="text-sm text-gray-500">Program Topic</p>
                    <p className="font-medium">{event.program_topic}</p>
                  </div>
                )}
                {event.program_type && (
                  <div>
                    <p className="text-sm text-gray-500">Program Type</p>
                    <p className="font-medium">{event.program_type}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {event.audience_size !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Audience Size</p>
                    <p className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {event.audience_size} attendees
                    </p>
                  </div>
                )}
                {event.speaker_attire && (
                  <div>
                    <p className="text-sm text-gray-500">Speaker Attire</p>
                    <p className="font-medium flex items-center gap-2">
                      <Shirt className="h-4 w-4" />
                      {event.speaker_attire}
                    </p>
                  </div>
                )}
                {event.audience_demographics && (
                  <div>
                    <p className="text-sm text-gray-500">Audience Demographics</p>
                    <p className="text-sm">{event.audience_demographics}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Event Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {event.event_start_time && (
                  <div>
                    <p className="text-sm text-gray-500">Event Start</p>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatTime(event.event_start_time)}
                    </p>
                  </div>
                )}
                {event.event_end_time && (
                  <div>
                    <p className="text-sm text-gray-500">Event End</p>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatTime(event.event_end_time)}
                    </p>
                  </div>
                )}
                {event.event_timezone && (
                  <div>
                    <p className="text-sm text-gray-500">Time Zone</p>
                    <p className="font-medium">{event.event_timezone}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.speaker_arrival_time && (
                  <div>
                    <p className="text-sm text-gray-500">Speaker Arrival</p>
                    <p className="font-medium">{formatTime(event.speaker_arrival_time)}</p>
                  </div>
                )}
                {event.program_start_time && (
                  <div>
                    <p className="text-sm text-gray-500">Program Start</p>
                    <p className="font-medium">{formatTime(event.program_start_time)}</p>
                  </div>
                )}
                {event.speaker_departure_time && (
                  <div>
                    <p className="text-sm text-gray-500">Speaker Departure</p>
                    <p className="font-medium">{formatTime(event.speaker_departure_time)}</p>
                  </div>
                )}
              </div>

              {(event.program_length || event.qa_length) && (
                <>
                  <div className="border-t border-gray-200 my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {event.program_length && (
                      <div>
                        <p className="text-sm text-gray-500">Program Length</p>
                        <p className="font-medium">{event.program_length} minutes</p>
                      </div>
                    )}
                    {event.qa_length && (
                      <div>
                        <p className="text-sm text-gray-500">Q&A Length</p>
                        <p className="font-medium">{event.qa_length} minutes</p>
                      </div>
                    )}
                    {event.total_program_length && (
                      <div>
                        <p className="text-sm text-gray-500">Total Length</p>
                        <p className="font-medium">{event.total_program_length} minutes</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {event.event_timeline && (
                <>
                  <div className="border-t border-gray-200 my-4" />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Detailed Event Timeline</p>
                    <p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded">
                      {event.event_timeline}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Technical Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Technical Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.av_requirements && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">AV Requirements</p>
                  <p className="text-sm">{event.av_requirements}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${
                    event.recording_allowed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {event.recording_allowed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm">Recording Allowed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${
                    event.live_streaming ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {event.live_streaming && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm">Live Streaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${
                    event.photography_allowed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {event.photography_allowed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm">Photography Allowed</span>
                </div>
              </div>

              {event.recording_purpose && (
                <div>
                  <p className="text-sm text-gray-500">Recording Purpose</p>
                  <p className="text-sm">{event.recording_purpose}</p>
                </div>
              )}

              {(event.tech_rehearsal_date || event.tech_rehearsal_time) && (
                <div>
                  <p className="text-sm text-gray-500">Tech Rehearsal</p>
                  <p className="text-sm">
                    {event.tech_rehearsal_date && new Date(event.tech_rehearsal_date).toLocaleDateString()}
                    {event.tech_rehearsal_time && ` at ${formatTime(event.tech_rehearsal_time)}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Travel & Accommodation */}
          {(event.travel_required || event.accommodation_required) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Travel & Accommodation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Travel Details</h4>
                    {event.fly_in_date && (
                      <div>
                        <p className="text-sm text-gray-500">Fly-in Date</p>
                        <p className="text-sm">{new Date(event.fly_in_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {event.fly_out_date && (
                      <div>
                        <p className="text-sm text-gray-500">Fly-out Date</p>
                        <p className="text-sm">{new Date(event.fly_out_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {event.nearest_airport && (
                      <div>
                        <p className="text-sm text-gray-500">Nearest Airport</p>
                        <p className="text-sm flex items-center gap-2">
                          <Plane className="h-4 w-4" />
                          {event.nearest_airport}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Transportation</h4>
                    <div>
                      <p className="text-sm text-gray-500">Airport Transport</p>
                      <p className="text-sm">
                        {event.airport_transport_provided ? 'Provided by client' : 'Speaker to arrange'}
                      </p>
                      {event.airport_transport_details && (
                        <p className="text-xs text-gray-600 mt-1">{event.airport_transport_details}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Venue Transport</p>
                      <p className="text-sm">
                        {event.venue_transport_provided ? 'Provided by client' : 'Speaker to arrange'}
                      </p>
                      {event.venue_transport_details && (
                        <p className="text-xs text-gray-600 mt-1">{event.venue_transport_details}</p>
                      )}
                    </div>
                  </div>
                </div>

                {(event.hotel_dates_needed || event.hotel_tier_preference) && (
                  <>
                    <div className="border-t border-gray-200 my-4" />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Hotel className="h-4 w-4" />
                        Hotel Accommodation
                      </h4>
                      {event.hotel_dates_needed && (
                        <div>
                          <p className="text-sm text-gray-500">Dates Needed</p>
                          <p className="text-sm">{event.hotel_dates_needed}</p>
                        </div>
                      )}
                      {event.hotel_tier_preference && (
                        <div>
                          <p className="text-sm text-gray-500">Hotel Tier Preference</p>
                          <p className="text-sm">{event.hotel_tier_preference}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(event.meals_provided || event.dietary_requirements) && (
                  <>
                    <div className="border-t border-gray-200 my-4" />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Meals & Dietary
                      </h4>
                      {event.meals_provided && (
                        <div>
                          <p className="text-sm text-gray-500">Meals Provided</p>
                          <p className="text-sm">{event.meals_provided}</p>
                        </div>
                      )}
                      {event.dietary_requirements && (
                        <div>
                          <p className="text-sm text-gray-500">Dietary Requirements</p>
                          <p className="text-sm">{event.dietary_requirements}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {event.guest_list_details && (
                  <>
                    <div className="border-t border-gray-200 my-4" />
                    <div>
                      <p className="text-sm text-gray-500">Guest List & VIP Access</p>
                      <p className="text-sm">{event.guest_list_details}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${
                    event.green_room_available ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {event.green_room_available && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm">Green Room Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${
                    event.marketing_use_allowed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {event.marketing_use_allowed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm">Marketing Use Allowed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${
                    event.press_media_present ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {event.press_media_present && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm">Press/Media Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${
                    event.prep_call_requested ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {event.prep_call_requested && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm">Prep Call Requested</span>
                </div>
              </div>

              {event.meet_greet_opportunities && (
                <div>
                  <p className="text-sm text-gray-500">Meet & Greet Opportunities</p>
                  <p className="text-sm">{event.meet_greet_opportunities}</p>
                </div>
              )}

              {event.media_interview_requests && (
                <div>
                  <p className="text-sm text-gray-500">Media Interview Requests</p>
                  <p className="text-sm">{event.media_interview_requests}</p>
                </div>
              )}

              {event.special_requests && (
                <div>
                  <p className="text-sm text-gray-500">Special Requests</p>
                  <p className="text-sm">{event.special_requests}</p>
                </div>
              )}

              {event.prep_call_date && (
                <div>
                  <p className="text-sm text-gray-500">Prep Call Scheduled</p>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {new Date(event.prep_call_date).toLocaleDateString()}
                    {event.prep_call_time && ` at ${formatTime(event.prep_call_time)}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {event.speaker_fee !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Speaker Fee</p>
                      <p className="font-medium text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        ${event.speaker_fee.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {event.travel_expenses_type && (
                    <div>
                      <p className="text-sm text-gray-500">Travel Expenses</p>
                      <p className="text-sm">{event.travel_expenses_type}</p>
                      {event.travel_expenses_amount && (
                        <p className="text-sm font-medium">
                          ${event.travel_expenses_amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  {event.payment_terms && (
                    <div>
                      <p className="text-sm text-gray-500">Payment Terms</p>
                      <p className="text-sm">{event.payment_terms}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {event.purchase_order_number && (
                    <div>
                      <p className="text-sm text-gray-500">PO Number</p>
                      <p className="text-sm font-mono">{event.purchase_order_number}</p>
                    </div>
                  )}
                  {event.invoice_number && (
                    <div>
                      <p className="text-sm text-gray-500">Invoice Number</p>
                      <p className="text-sm font-mono">{event.invoice_number}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Contract Signed</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        event.contract_signed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {event.contract_signed && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Invoice Sent</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        event.invoice_sent ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {event.invoice_sent && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Payment Received</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        event.payment_received ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {event.payment_received && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(event.additional_notes || event.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {event.additional_notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{event.additional_notes}</p>
                  </div>
                )}
                {event.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">General Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
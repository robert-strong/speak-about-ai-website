"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Save,
  FileSignature,
  Building2,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Plane,
  Hotel,
  Mic,
  Clock,
  Users,
  Loader2,
  Copy,
  ExternalLink,
  CheckCircle,
  Link as LinkIcon,
  Send,
  Sparkles,
  Mail,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"

interface Deal {
  id: number
  title?: string
  event_title?: string
  company: string
  client_name: string
  client_email: string
  client_phone?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  value?: string
  deal_value?: number
  status: string
  event_date: string
  event_location: string
  event_type?: string
  speaker_id?: number
  speaker_requested?: string
  speaker_name?: string
  notes?: string
  attendee_count?: number
  travel_required?: boolean
  flight_required?: boolean
  travel_stipend?: number
}

export default function NewFirmOfferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    }>
      <NewFirmOfferContent />
    </Suspense>
  )
}

function NewFirmOfferContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const dealId = searchParams.get('deal_id')
  const editId = searchParams.get('edit')

  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [createdOffer, setCreatedOffer] = useState<{ id: number; share_url: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // AI parsing state
  const [showAiParser, setShowAiParser] = useState(false)
  const [aiInputText, setAiInputText] = useState('')
  const [aiParsing, setAiParsing] = useState(false)

  // Gmail import state
  const [showGmailImport, setShowGmailImport] = useState(false)
  const [gmailLoading, setGmailLoading] = useState(false)
  const [emailThreads, setEmailThreads] = useState<any[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [gmailSearchMode, setGmailSearchMode] = useState<'synced' | 'live'>('synced')
  const [gmailNeedsAuth, setGmailNeedsAuth] = useState(false)

  // Form state - pre-populated from deal
  const [formData, setFormData] = useState({
    // Overview
    event_classification: 'travel' as 'virtual' | 'local' | 'travel',
    company_name: '',
    end_client_name: '',
    event_name: '',
    event_date: '',
    event_location: '',
    event_website: '',

    // Billing Contact
    billing_contact_name: '',
    billing_contact_title: '',
    billing_contact_email: '',
    billing_contact_phone: '',
    billing_address: '',

    // Logistics Contact
    logistics_contact_name: '',
    logistics_contact_email: '',
    logistics_contact_phone: '',

    // Venue Details
    venue_name: '',
    venue_address: '',
    venue_contact_name: '',
    venue_contact_email: '',
    venue_contact_phone: '',

    // Program Details
    speaker_name: '',
    program_topic: '',
    program_type: 'keynote',
    audience_size: '',
    audience_demographics: '',
    speaker_attire: 'business_casual',

    // Schedule
    event_start_time: '',
    event_end_time: '',
    speaker_arrival_time: '',
    program_start_time: '',
    program_length_minutes: '',
    qa_length_minutes: '',
    speaker_departure_time: '',
    timezone: 'America/Los_Angeles',
    detailed_timeline: '',

    // Technical
    recording_allowed: false,
    recording_purpose: '',
    live_streaming: false,
    photography_allowed: false,
    av_requirements: '',
    tech_rehearsal_time: '',

    // Travel
    fly_in_date: '',
    fly_out_date: '',
    nearest_airport: '',
    airport_transport_provided: false,
    hotel_transport_provided: false,
    hotel_required: false,
    hotel_name: '',
    hotel_dates_needed: '',

    // Financial
    speaker_fee: '',
    travel_expenses_type: 'flat_buyout',
    travel_expenses_amount: '',
    payment_terms: 'net_30',
    payment_notes: '',

    // Additional
    green_room_available: false,
    additional_engagements: false,
    meet_and_greet: '',
    marketing_promotion: '',
    press_media: '',
    special_requests: '',
    guest_list_notes: '',
    prep_call_date: '',
    prep_call_time: '',
    additional_notes: ''
  })

  useEffect(() => {
    if (editId) {
      loadFirmOffer(editId)
    } else if (dealId) {
      loadDeal(dealId)
    } else {
      setLoading(false)
    }
  }, [dealId, editId])

  const loadDeal = async (id: string) => {
    try {
      const response = await fetch(`/api/deals/${id}`)
      if (response.ok) {
        const dealData = await response.json()
        setDeal(dealData)

        // Pre-populate form from deal data
        // Determine event classification from event type
        let eventClassification: 'virtual' | 'local' | 'travel' = 'travel'
        const eventType = (dealData.event_type || '').toLowerCase()
        if (eventType.includes('virtual') || eventType.includes('webinar') || eventType.includes('online')) {
          eventClassification = 'virtual'
        } else if (!dealData.travel_required && !dealData.flight_required) {
          eventClassification = 'local'
        }

        setFormData(prev => ({
          ...prev,
          // Event Overview
          event_classification: eventClassification,
          company_name: dealData.company || '',
          event_name: dealData.event_title || '',
          event_date: dealData.event_date?.split('T')[0] || '',
          event_location: dealData.event_location || '',

          // Billing Contact
          billing_contact_name: dealData.client_name || '',
          billing_contact_email: dealData.client_email || '',
          billing_contact_phone: dealData.client_phone || '',

          // Logistics Contact (same as billing by default)
          logistics_contact_name: dealData.client_name || '',
          logistics_contact_email: dealData.client_email || '',
          logistics_contact_phone: dealData.client_phone || '',

          // Speaker Program
          speaker_name: dealData.speaker_requested || '',
          program_type: eventType.includes('workshop') ? 'workshop' :
                       eventType.includes('panel') ? 'panel_discussion' :
                       eventType.includes('fireside') ? 'fireside_chat' : 'keynote',
          audience_size: dealData.attendee_count?.toString() || '',

          // Financial Details
          speaker_fee: dealData.deal_value?.toString() || '',
          travel_expenses_type: dealData.travel_required ? 'flat_buyout' : 'included',
          travel_expenses_amount: dealData.travel_stipend?.toString() || '',

          // Additional Notes
          additional_notes: dealData.notes || ''
        }))
      }
    } catch (error) {
      console.error("Error loading deal:", error)
      toast({
        title: "Error",
        description: "Failed to load deal data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFirmOffer = async (id: string) => {
    try {
      const response = await fetch(`/api/firm-offers/${id}`)
      if (response.ok) {
        const offerData = await response.json()
        setIsEditMode(true)

        // Extract data from JSONB columns
        const overview = offerData.event_overview || {}
        const program = offerData.speaker_program || {}
        const schedule = offerData.event_schedule || {}
        const technical = offerData.technical_requirements || {}
        const travel = offerData.travel_accommodation || {}
        const additional = offerData.additional_info || {}
        const financial = offerData.financial_details || {}

        // Also extract confirmation section
        const confirmation = offerData.confirmation || {}

        // Populate form from existing data - direct set, no callback
        setFormData({
          // Event Overview
          event_classification: overview.event_classification || 'travel',
          company_name: overview.company_name || '',
          end_client_name: overview.end_client_name || '',
          event_name: overview.event_name || '',
          event_date: overview.event_date?.split('T')[0] || '',
          event_location: overview.event_location || '',
          event_website: overview.event_website || '',

          // Billing Contact
          billing_contact_name: overview.billing_contact?.name || '',
          billing_contact_title: overview.billing_contact?.title || '',
          billing_contact_email: overview.billing_contact?.email || '',
          billing_contact_phone: overview.billing_contact?.phone || '',
          billing_address: overview.billing_contact?.address || '',

          // Logistics Contact
          logistics_contact_name: overview.logistics_contact?.name || '',
          logistics_contact_email: overview.logistics_contact?.email || '',
          logistics_contact_phone: overview.logistics_contact?.phone || '',

          // Venue Details
          venue_name: overview.venue?.name || '',
          venue_address: overview.venue?.address || '',
          venue_contact_name: overview.venue?.contact_name || '',
          venue_contact_email: overview.venue?.contact_email || '',
          venue_contact_phone: overview.venue?.contact_phone || '',

          // Program Details
          speaker_name: program.speaker_name || '',
          program_topic: program.program_topic || '',
          program_type: program.program_type || 'keynote',
          audience_size: program.audience_size?.toString() || '',
          audience_demographics: program.audience_demographics || '',
          speaker_attire: program.speaker_attire || 'business_casual',

          // Schedule
          event_start_time: schedule.event_start_time || '',
          event_end_time: schedule.event_end_time || '',
          speaker_arrival_time: schedule.speaker_arrival_time || '',
          program_start_time: schedule.program_start_time || '',
          program_length_minutes: schedule.program_length_minutes?.toString() || '',
          qa_length_minutes: schedule.qa_length_minutes?.toString() || '',
          speaker_departure_time: schedule.speaker_departure_time || '',
          timezone: schedule.timezone || 'America/Los_Angeles',
          detailed_timeline: schedule.detailed_timeline || '',

          // Technical
          recording_allowed: technical.recording_allowed || false,
          recording_purpose: technical.recording_purpose || '',
          live_streaming: technical.live_streaming || false,
          photography_allowed: technical.photography_allowed || false,
          av_requirements: technical.av_requirements || '',
          tech_rehearsal_time: technical.tech_rehearsal_time || '',

          // Travel
          fly_in_date: travel.fly_in_date?.split('T')[0] || '',
          fly_out_date: travel.fly_out_date?.split('T')[0] || '',
          nearest_airport: travel.nearest_airport || '',
          airport_transport_provided: travel.airport_transport_provided || false,
          hotel_transport_provided: travel.hotel_transport_provided || false,
          hotel_required: travel.hotel_required || !!travel.hotel_name,
          hotel_name: travel.hotel_name || '',
          hotel_dates_needed: travel.hotel_dates_needed || '',

          // Financial
          speaker_fee: financial.speaker_fee?.toString() || '',
          travel_expenses_type: financial.travel_expenses_type || 'flat_buyout',
          travel_expenses_amount: financial.travel_expenses_amount?.toString() || '',
          payment_terms: financial.payment_terms || 'net_30',
          payment_notes: financial.payment_notes || '',

          // Additional
          green_room_available: additional.green_room_available || false,
          additional_engagements: additional.additional_engagements || !!(additional.meet_and_greet || additional.guest_list_notes || additional.marketing_promotion || additional.press_media),
          meet_and_greet: additional.meet_and_greet || '',
          marketing_promotion: additional.marketing_promotion || '',
          press_media: additional.press_media || '',
          special_requests: additional.special_requests || '',
          guest_list_notes: additional.guest_list_notes || '',
          prep_call_date: confirmation.prep_call_date?.split('T')[0] || '',
          prep_call_time: confirmation.prep_call_time || '',
          additional_notes: additional.notes || ''
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to load firm offer",
          variant: "destructive"
        })
        router.push('/admin/firm-offers')
      }
    } catch (error) {
      console.error("Error loading firm offer:", error)
      toast({
        title: "Error",
        description: "Failed to load firm offer data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const url = isEditMode ? `/api/firm-offers/${editId}` : "/api/firm-offers"
      const method = isEditMode ? "PATCH" : "POST"

      // For PATCH, we need to build the JSONB structures
      let bodyData: any
      if (isEditMode) {
        bodyData = {
          event_overview: {
            event_classification: formData.event_classification,
            company_name: formData.company_name,
            end_client_name: formData.end_client_name,
            event_name: formData.event_name,
            event_date: formData.event_date,
            event_location: formData.event_location,
            event_website: formData.event_website,
            billing_contact: {
              name: formData.billing_contact_name,
              title: formData.billing_contact_title,
              email: formData.billing_contact_email,
              phone: formData.billing_contact_phone,
              address: formData.billing_address
            },
            logistics_contact: {
              name: formData.logistics_contact_name,
              email: formData.logistics_contact_email,
              phone: formData.logistics_contact_phone
            },
            venue: {
              name: formData.venue_name,
              address: formData.venue_address,
              contact_name: formData.venue_contact_name,
              contact_email: formData.venue_contact_email,
              contact_phone: formData.venue_contact_phone
            }
          },
          speaker_program: {
            speaker_name: formData.speaker_name,
            program_topic: formData.program_topic,
            program_type: formData.program_type,
            audience_size: formData.audience_size ? parseInt(formData.audience_size) : null,
            audience_demographics: formData.audience_demographics,
            speaker_attire: formData.speaker_attire
          },
          event_schedule: {
            event_start_time: formData.event_start_time,
            event_end_time: formData.event_end_time,
            speaker_arrival_time: formData.speaker_arrival_time,
            program_start_time: formData.program_start_time,
            program_length_minutes: formData.program_length_minutes ? parseInt(formData.program_length_minutes) : null,
            qa_length_minutes: formData.qa_length_minutes ? parseInt(formData.qa_length_minutes) : null,
            speaker_departure_time: formData.speaker_departure_time,
            timezone: formData.timezone,
            detailed_timeline: formData.detailed_timeline
          },
          technical_requirements: {
            recording_allowed: formData.recording_allowed,
            recording_purpose: formData.recording_purpose,
            live_streaming: formData.live_streaming,
            photography_allowed: formData.photography_allowed,
            av_requirements: formData.av_requirements,
            tech_rehearsal_time: formData.tech_rehearsal_time
          },
          travel_accommodation: {
            fly_in_date: formData.fly_in_date,
            fly_out_date: formData.fly_out_date,
            nearest_airport: formData.nearest_airport,
            airport_transport_provided: formData.airport_transport_provided,
            hotel_transport_provided: formData.hotel_transport_provided,
            hotel_required: formData.hotel_required,
            hotel_name: formData.hotel_name,
            hotel_dates_needed: formData.hotel_dates_needed
          },
          financial_details: {
            speaker_fee: formData.speaker_fee ? parseFloat(formData.speaker_fee) : null,
            travel_expenses_type: formData.travel_expenses_type,
            travel_expenses_amount: formData.travel_expenses_amount ? parseFloat(formData.travel_expenses_amount) : null,
            payment_terms: formData.payment_terms,
            payment_notes: formData.payment_notes
          },
          additional_info: {
            green_room_available: formData.green_room_available,
            additional_engagements: formData.additional_engagements,
            meet_and_greet: formData.meet_and_greet,
            marketing_promotion: formData.marketing_promotion,
            press_media: formData.press_media,
            special_requests: formData.special_requests,
            guest_list_notes: formData.guest_list_notes,
            notes: formData.additional_notes
          },
          confirmation: {
            prep_call_date: formData.prep_call_date,
            prep_call_time: formData.prep_call_time
          }
        }
      } else {
        // POST uses flat structure
        bodyData = {
          deal_id: dealId ? parseInt(dealId) : null,
          ...formData
        }
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      })

      if (response.ok) {
        const result = await response.json()

        if (isEditMode) {
          toast({
            title: "Success",
            description: "Firm offer updated successfully"
          })
          router.push(`/admin/firm-offers/${editId}`)
        } else {
          setCreatedOffer({
            id: result.id,
            share_url: result.share_url
          })
          toast({
            title: "Success",
            description: "Firm offer created successfully"
          })
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} firm offer`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} firm offer:`, error)
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} firm offer`,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const copyLink = async () => {
    if (createdOffer) {
      const fullUrl = `${window.location.origin}${createdOffer.share_url}`
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast({
        title: "Link Copied!",
        description: "Share this link with the client to fill in the details"
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // AI parsing function
  const parseWithAI = async () => {
    if (!aiInputText.trim()) {
      toast({
        title: "Error",
        description: "Please paste some text to parse",
        variant: "destructive"
      })
      return
    }

    setAiParsing(true)
    try {
      const response = await fetch('/api/ai/parse-event-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiInputText })
      })

      if (response.ok) {
        const parsed = await response.json()

        // Merge parsed data with existing form data
        setFormData(prev => ({
          ...prev,
          // Event Overview
          company_name: parsed.company_name || prev.company_name,
          end_client_name: parsed.end_client_name || prev.end_client_name,
          event_name: parsed.event_name || prev.event_name,
          event_date: parsed.event_date || prev.event_date,
          event_location: parsed.event_location || prev.event_location,
          event_website: parsed.event_website || prev.event_website,
          event_classification: parsed.event_type || prev.event_classification,

          // Billing Contact
          billing_contact_name: parsed.billing_contact_name || parsed.contact_name || prev.billing_contact_name,
          billing_contact_email: parsed.billing_contact_email || parsed.contact_email || prev.billing_contact_email,
          billing_contact_phone: parsed.billing_contact_phone || parsed.contact_phone || prev.billing_contact_phone,
          billing_contact_title: parsed.billing_contact_title || parsed.contact_title || prev.billing_contact_title,
          billing_address: parsed.billing_address || prev.billing_address,

          // Logistics Contact
          logistics_contact_name: parsed.logistics_contact_name || parsed.contact_name || prev.logistics_contact_name,
          logistics_contact_email: parsed.logistics_contact_email || parsed.contact_email || prev.logistics_contact_email,
          logistics_contact_phone: parsed.logistics_contact_phone || parsed.contact_phone || prev.logistics_contact_phone,

          // Venue Details
          venue_name: parsed.venue_name || prev.venue_name,
          venue_address: parsed.venue_address || prev.venue_address,
          venue_contact_name: parsed.venue_contact_name || prev.venue_contact_name,
          venue_contact_email: parsed.venue_contact_email || prev.venue_contact_email,
          venue_contact_phone: parsed.venue_contact_phone || prev.venue_contact_phone,

          // Speaker & Program
          speaker_name: parsed.speaker_name || prev.speaker_name,
          program_topic: parsed.program_topic || prev.program_topic,
          program_type: parsed.program_type || prev.program_type,
          audience_size: parsed.audience_size?.toString() || prev.audience_size,
          audience_demographics: parsed.audience_demographics || prev.audience_demographics,
          speaker_attire: parsed.speaker_attire || prev.speaker_attire,

          // Schedule
          event_start_time: parsed.event_start_time || prev.event_start_time,
          event_end_time: parsed.event_end_time || prev.event_end_time,
          speaker_arrival_time: parsed.speaker_arrival_time || prev.speaker_arrival_time,
          program_start_time: parsed.program_start_time || prev.program_start_time,
          program_length_minutes: parsed.program_length_minutes?.toString() || prev.program_length_minutes,
          qa_length_minutes: parsed.qa_length_minutes?.toString() || prev.qa_length_minutes,
          speaker_departure_time: parsed.speaker_departure_time || prev.speaker_departure_time,
          timezone: parsed.timezone || prev.timezone,
          detailed_timeline: parsed.detailed_timeline || prev.detailed_timeline,

          // Technical
          recording_allowed: parsed.recording_allowed ?? prev.recording_allowed,
          recording_purpose: parsed.recording_purpose || prev.recording_purpose,
          photography_allowed: parsed.photography_allowed ?? prev.photography_allowed,
          live_streaming: parsed.live_streaming ?? prev.live_streaming,
          av_requirements: parsed.av_requirements || prev.av_requirements,
          tech_rehearsal_time: parsed.tech_rehearsal_time || prev.tech_rehearsal_time,

          // Travel
          fly_in_date: parsed.fly_in_date || prev.fly_in_date,
          fly_out_date: parsed.fly_out_date || prev.fly_out_date,
          nearest_airport: parsed.nearest_airport || prev.nearest_airport,
          airport_transport_provided: parsed.airport_transport_provided ?? prev.airport_transport_provided,
          hotel_transport_provided: parsed.hotel_transport_provided ?? prev.hotel_transport_provided,
          hotel_required: parsed.hotel_required ?? (parsed.hotel_name ? true : prev.hotel_required),
          hotel_name: parsed.hotel_name || prev.hotel_name,
          hotel_dates_needed: parsed.hotel_dates_needed || prev.hotel_dates_needed,

          // Financial
          speaker_fee: parsed.speaker_fee?.toString() || prev.speaker_fee,
          travel_expenses_amount: parsed.travel_expenses_amount?.toString() || prev.travel_expenses_amount,
          travel_expenses_type: parsed.travel_expenses_type || prev.travel_expenses_type,
          payment_terms: parsed.payment_terms || prev.payment_terms,
          payment_notes: parsed.payment_notes || prev.payment_notes,

          // Additional Info
          green_room_available: parsed.green_room_available ?? prev.green_room_available,
          additional_engagements: (parsed.additional_engagements ?? !!(parsed.meet_and_greet || parsed.guest_list_notes || parsed.marketing_promotion || parsed.press_media)) || prev.additional_engagements,
          meet_and_greet: parsed.meet_and_greet || prev.meet_and_greet,
          marketing_promotion: parsed.marketing_promotion || prev.marketing_promotion,
          press_media: parsed.press_media || prev.press_media,
          special_requests: parsed.special_requests || prev.special_requests,
          guest_list_notes: parsed.guest_list_notes || prev.guest_list_notes,

          // Prep Call
          prep_call_date: parsed.prep_call_date || prev.prep_call_date,
          prep_call_time: parsed.prep_call_time || prev.prep_call_time,

          // Notes
          additional_notes: parsed.notes || prev.additional_notes
        }))

        toast({
          title: "Success",
          description: "Event details extracted and filled in"
        })
        setShowAiParser(false)
        setAiInputText('')
      } else {
        toast({
          title: "Error",
          description: "Failed to parse text with AI",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("AI parsing error:", error)
      toast({
        title: "Error",
        description: "Failed to parse text",
        variant: "destructive"
      })
    } finally {
      setAiParsing(false)
    }
  }

  // Gmail import function - tries synced emails first, then searches Gmail directly
  const loadGmailThreads = async () => {
    const clientEmail = deal?.client_email || formData.billing_contact_email

    if (!clientEmail) {
      toast({
        title: "Error",
        description: "No client email to search for. Enter a billing contact email first.",
        variant: "destructive"
      })
      return
    }

    setGmailLoading(true)
    setGmailNeedsAuth(false)

    try {
      // First, try to load synced emails from database
      if (dealId) {
        const syncedResponse = await fetch(`/api/email-threads?deal_id=${dealId}`)
        if (syncedResponse.ok) {
          const data = await syncedResponse.json()
          if (data.threads && data.threads.length > 0) {
            setEmailThreads(data.threads)
            setGmailSearchMode('synced')
            setShowGmailImport(true)
            setGmailLoading(false)
            return
          }
        }
      }

      // No synced emails found - search Gmail directly using client email
      if (clientEmail) {
        const searchResponse = await fetch(`/api/gmail/search?email=${encodeURIComponent(clientEmail)}`)

        if (searchResponse.ok) {
          const data = await searchResponse.json()
          setEmailThreads(data.emails || [])
          setGmailSearchMode('live')
          setShowGmailImport(true)

          if (data.emails?.length === 0) {
            toast({
              title: "No emails found",
              description: `No emails found for ${clientEmail}`,
            })
          }
        } else {
          const errorData = await searchResponse.json()
          if (errorData.needsAuth) {
            setGmailNeedsAuth(true)
            setShowGmailImport(true)
          } else {
            toast({
              title: "Error",
              description: errorData.error || "Failed to search Gmail",
              variant: "destructive"
            })
          }
        }
      } else {
        toast({
          title: "No client email",
          description: "This deal doesn't have a client email address to search",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Gmail load error:", error)
      toast({
        title: "Error",
        description: "Failed to load emails",
        variant: "destructive"
      })
    } finally {
      setGmailLoading(false)
    }
  }

  const parseEmailsWithAI = async () => {
    if (selectedEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please select emails to parse",
        variant: "destructive"
      })
      return
    }

    const selectedContent = emailThreads
      .filter(t => selectedEmails.includes(t.id))
      .map(t => `Subject: ${t.subject}\n\n${t.body_full || t.body_snippet}`)
      .join('\n\n---\n\n')

    setAiInputText(selectedContent)
    setShowGmailImport(false)
    setShowAiParser(true)
  }

  const isVirtual = formData.event_classification === 'virtual'
  const isLocal = formData.event_classification === 'local'

  // Calculate form completion
  const calculateCompletion = () => {
    const requiredFields = [
      // Event Info
      { name: 'Company', value: formData.company_name },
      { name: 'Event Name', value: formData.event_name },
      { name: 'Event Date', value: formData.event_date },
      { name: 'Event Location', value: !isVirtual ? formData.event_location : 'virtual' },
      { name: 'Timezone', value: formData.timezone },

      // Contacts
      { name: 'Billing Contact Name', value: formData.billing_contact_name },
      { name: 'Billing Contact Email', value: formData.billing_contact_email },

      // Speaker & Program
      { name: 'Speaker Name', value: formData.speaker_name },
      { name: 'Program Topic', value: formData.program_topic },
      { name: 'Program Type', value: formData.program_type },
      { name: 'Program Length', value: formData.program_length_minutes },

      // Financial
      { name: 'Speaker Fee', value: formData.speaker_fee },
    ]

    const optionalFields = [
      // Event Overview
      { name: 'End Client', value: formData.end_client_name },
      { name: 'Event Website', value: formData.event_website },

      // Billing Contact
      { name: 'Billing Phone', value: formData.billing_contact_phone },
      { name: 'Billing Title', value: formData.billing_contact_title },
      { name: 'Billing Address', value: formData.billing_address },

      // Logistics Contact
      { name: 'Logistics Contact', value: formData.logistics_contact_name },
      { name: 'Logistics Email', value: formData.logistics_contact_email },
      { name: 'Logistics Phone', value: formData.logistics_contact_phone },

      // Venue Details
      { name: 'Venue Name', value: formData.venue_name },
      { name: 'Venue Address', value: formData.venue_address },
      { name: 'Venue Contact', value: formData.venue_contact_name },
      { name: 'Venue Email', value: formData.venue_contact_email },
      { name: 'Venue Phone', value: formData.venue_contact_phone },

      // Program (topic, type, length are now required)
      { name: 'Audience Size', value: formData.audience_size },
      { name: 'Audience Demographics', value: formData.audience_demographics },

      // Schedule
      { name: 'Event Start Time', value: formData.event_start_time },
      { name: 'Event End Time', value: formData.event_end_time },
      { name: 'Speaker Arrival', value: formData.speaker_arrival_time },
      { name: 'Program Start Time', value: formData.program_start_time },
      { name: 'Q&A Length', value: formData.qa_length_minutes },
      { name: 'Speaker Departure', value: formData.speaker_departure_time },
      { name: 'Detailed Timeline', value: formData.detailed_timeline },

      // Technical
      { name: 'AV Requirements', value: formData.av_requirements },
      { name: 'Tech Rehearsal', value: formData.tech_rehearsal_time },
      { name: 'Recording Purpose', value: formData.recording_purpose },

      // Financial
      { name: 'Travel Expenses', value: formData.travel_expenses_amount },
      { name: 'Payment Notes', value: formData.payment_notes },

      // Additional Info
      { name: 'Meet & Greet', value: formData.meet_and_greet },
      { name: 'Guest List Notes', value: formData.guest_list_notes },
      { name: 'Marketing/Promotion', value: formData.marketing_promotion },
      { name: 'Press/Media', value: formData.press_media },
      { name: 'Special Requests', value: formData.special_requests },
      { name: 'Prep Call Date', value: formData.prep_call_date },
      { name: 'Prep Call Time', value: formData.prep_call_time },
      { name: 'Additional Notes', value: formData.additional_notes },
    ]

    // Add travel fields only if not virtual
    if (!isVirtual) {
      optionalFields.push(
        { name: 'Fly-In Date', value: formData.fly_in_date },
        { name: 'Fly-Out Date', value: formData.fly_out_date },
        { name: 'Nearest Airport', value: formData.nearest_airport },
        { name: 'Hotel Name', value: formData.hotel_name },
        { name: 'Hotel Dates', value: formData.hotel_dates_needed }
      )
    }

    const filledRequired = requiredFields.filter(f => f.value && f.value.toString().trim() !== '').length
    const filledOptional = optionalFields.filter(f => f.value && f.value.toString().trim() !== '').length

    const missingRequired = requiredFields.filter(f => !f.value || f.value.toString().trim() === '').map(f => f.name)

    const totalRequired = requiredFields.length
    const totalOptional = optionalFields.length

    // Weight: required fields count 2x
    const weightedFilled = (filledRequired * 2) + filledOptional
    const weightedTotal = (totalRequired * 2) + totalOptional
    const percentage = Math.round((weightedFilled / weightedTotal) * 100)

    return {
      percentage,
      filledRequired,
      totalRequired,
      filledOptional,
      totalOptional,
      missingRequired
    }
  }

  const completion = calculateCompletion()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // Success state - show share link
  if (createdOffer) {
    const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${createdOffer.share_url}`

    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="fixed left-0 top-0 h-full z-[60]">
          <AdminSidebar />
        </div>
        <div className="flex-1 ml-72 min-h-screen flex items-center justify-center">
          <Card className="max-w-lg w-full mx-4">
            <CardContent className="pt-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Firm Offer Created!</h2>
              <p className="text-gray-600 mb-6">Share this link with the client to fill in the event details</p>

              {/* Share Link */}
              <div className="bg-gray-50 border rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Share Link</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={fullUrl}
                    readOnly
                    className="text-sm bg-white"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    className={copied ? "border-green-500 text-green-500" : ""}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={copyLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(createdOffer.share_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Form
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/admin/firm-offers')}
                >
                  Back to Firm Offers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FileSignature className="h-6 w-6 text-amber-500" />
                  {isEditMode ? 'Edit Firm Offer' : 'Create Firm Offer'}
                </h1>
                {deal && (
                  <p className="text-gray-600">
                    For: {deal.event_title || deal.title || deal.company} - {deal.speaker_requested || deal.speaker_name || 'Speaker TBD'}
                  </p>
                )}
                {isEditMode && formData.event_name && (
                  <p className="text-gray-600">
                    {formData.event_name} - {formData.company_name}
                  </p>
                )}
              </div>
            </div>
            <Button
              className="bg-amber-500 hover:bg-amber-600"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditMode ? 'Update Firm Offer' : 'Save Firm Offer'}
            </Button>
          </div>

          {/* Deal Summary Card */}
          {deal && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-amber-700 font-medium">Company</p>
                    <p>{deal.company}</p>
                  </div>
                  <div>
                    <p className="text-amber-700 font-medium">Speaker</p>
                    <p>{deal.speaker_requested || deal.speaker_name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-amber-700 font-medium">Event Date</p>
                    <p>{deal.event_date ? new Date(deal.event_date).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-amber-700 font-medium">Location</p>
                    <p>{deal.event_location || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-amber-700 font-medium">Deal Value</p>
                    <p className="text-lg font-bold text-green-600">${(deal.deal_value || parseFloat(deal.value || '0')).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion Progress Indicator */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-5 w-5 ${completion.percentage === 100 ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="font-medium">Form Completion</span>
                </div>
                <span className={`text-lg font-bold ${
                  completion.percentage >= 80 ? 'text-green-600' :
                  completion.percentage >= 50 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {completion.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    completion.percentage >= 80 ? 'bg-green-500' :
                    completion.percentage >= 50 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    completion.filledRequired === completion.totalRequired
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    Required: {completion.filledRequired}/{completion.totalRequired}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    Optional: {completion.filledOptional}/{completion.totalOptional}
                  </span>
                </div>
              </div>

              {/* Missing Required Fields */}
              {completion.missingRequired.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Missing required fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {completion.missingRequired.map(field => (
                      <span key={field} className="px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Import Section */}
          <Card className="mb-6 border-purple-200 bg-purple-50/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-purple-900">Quick Fill with AI</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAiParser(!showAiParser)}
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Paste & Parse
                    {showAiParser ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </Button>
                  {(deal?.client_email || formData.billing_contact_email) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadGmailThreads}
                      disabled={gmailLoading}
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                    >
                      {gmailLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Search Gmail
                    </Button>
                  )}
                </div>
              </div>

              {/* AI Parser Panel */}
              {showAiParser && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <Label className="text-purple-900">Paste email, notes, or event details</Label>
                  <Textarea
                    value={aiInputText}
                    onChange={(e) => setAiInputText(e.target.value)}
                    placeholder="Paste any text containing event details - emails, notes, RFPs, etc. AI will extract the relevant information."
                    rows={6}
                    className="mt-2 bg-white"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAiParser(false)
                        setAiInputText('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={parseWithAI}
                      disabled={aiParsing || !aiInputText.trim()}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      {aiParsing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Extract Details
                    </Button>
                  </div>
                </div>
              )}

              {/* Gmail Import Panel */}
              {showGmailImport && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-purple-900">
                        {gmailSearchMode === 'live' ? `Emails with ${deal?.client_email}` : 'Synced email threads'}
                      </Label>
                      {gmailSearchMode === 'live' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Live Search</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowGmailImport(false)
                        setSelectedEmails([])
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Gmail Auth Required */}
                  {gmailNeedsAuth ? (
                    <div className="text-center py-4">
                      <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">Connect Gmail to search for emails with this client</p>
                      <Button
                        variant="outline"
                        onClick={() => window.open('/api/auth/gmail', '_blank')}
                        className="border-purple-300 text-purple-700"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Connect Gmail
                      </Button>
                    </div>
                  ) : emailThreads.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      No emails found for {deal?.client_email || 'this client'}.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {emailThreads.map((thread) => (
                        <div
                          key={thread.id}
                          className={`p-3 rounded border cursor-pointer transition-all ${
                            selectedEmails.includes(thread.id)
                              ? 'border-purple-400 bg-purple-100'
                              : 'border-gray-200 bg-white hover:border-purple-200'
                          }`}
                          onClick={() => {
                            setSelectedEmails(prev =>
                              prev.includes(thread.id)
                                ? prev.filter(id => id !== thread.id)
                                : [...prev, thread.id]
                            )
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{thread.subject}</span>
                            <span className="text-xs text-gray-500">
                              {thread.received_at ? new Date(thread.received_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{thread.body_snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {emailThreads.length > 0 && (
                    <div className="flex justify-end mt-3">
                      <Button
                        onClick={parseEmailsWithAI}
                        disabled={selectedEmails.length === 0}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Parse Selected ({selectedEmails.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Sections on One Page */}
          <div className="space-y-6">
            {/* Event Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Event Overview</CardTitle>
                <CardDescription>Basic event information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={formData.event_classification}
                    onValueChange={(value) => updateField('event_classification', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual (Online)</SelectItem>
                      <SelectItem value="local">Local (No Travel Required)</SelectItem>
                      <SelectItem value="travel">Travel Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company / Organization</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => updateField('company_name', e.target.value)}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <Label>End Client (if different)</Label>
                    <Input
                      value={formData.end_client_name}
                      onChange={(e) => updateField('end_client_name', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <Label>Event Name</Label>
                  <Input
                    value={formData.event_name}
                    onChange={(e) => updateField('event_name', e.target.value)}
                    placeholder="Annual Leadership Summit 2025"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Event Date</Label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => updateField('event_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Event Location</Label>
                    <Input
                      value={formData.event_location}
                      onChange={(e) => updateField('event_location', e.target.value)}
                      placeholder="San Francisco, CA"
                      disabled={isVirtual}
                    />
                  </div>
                </div>

                <div>
                  <Label>Event Website</Label>
                  <Input
                    value={formData.event_website}
                    onChange={(e) => updateField('event_website', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Billing Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={formData.billing_contact_name}
                        onChange={(e) => updateField('billing_contact_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={formData.billing_contact_title}
                        onChange={(e) => updateField('billing_contact_title', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.billing_contact_email}
                        onChange={(e) => updateField('billing_contact_email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.billing_contact_phone}
                        onChange={(e) => updateField('billing_contact_phone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Billing Address</Label>
                    <Textarea
                      value={formData.billing_address}
                      onChange={(e) => updateField('billing_address', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3">Logistics Contact</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={formData.logistics_contact_name}
                        onChange={(e) => updateField('logistics_contact_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.logistics_contact_email}
                        onChange={(e) => updateField('logistics_contact_email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.logistics_contact_phone}
                        onChange={(e) => updateField('logistics_contact_phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3">Venue Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Venue Name</Label>
                      <Input
                        value={formData.venue_name}
                        onChange={(e) => updateField('venue_name', e.target.value)}
                        placeholder="e.g., Linwood Country Club"
                      />
                    </div>
                    <div>
                      <Label>Venue Address</Label>
                      <Input
                        value={formData.venue_address}
                        onChange={(e) => updateField('venue_address', e.target.value)}
                        placeholder="500 Shore Road, Linwood, NJ 08221"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label>Venue Contact Name</Label>
                      <Input
                        value={formData.venue_contact_name}
                        onChange={(e) => updateField('venue_contact_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Venue Contact Email</Label>
                      <Input
                        type="email"
                        value={formData.venue_contact_email}
                        onChange={(e) => updateField('venue_contact_email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Venue Contact Phone</Label>
                      <Input
                        value={formData.venue_contact_phone}
                        onChange={(e) => updateField('venue_contact_phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Speaker Program Details */}
            <Card>
              <CardHeader>
                <CardTitle>Speaker Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Speaker Name</Label>
                    <Input
                      value={formData.speaker_name}
                      onChange={(e) => updateField('speaker_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Program Type</Label>
                    <Select
                      value={formData.program_type}
                      onValueChange={(value) => updateField('program_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keynote">Keynote</SelectItem>
                        <SelectItem value="fireside_chat">Fireside Chat</SelectItem>
                        <SelectItem value="panel_discussion">Panel Discussion</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="breakout_session">Breakout Session</SelectItem>
                        <SelectItem value="emcee">Emcee / Host</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Program Topic</Label>
                  <Input
                    value={formData.program_topic}
                    onChange={(e) => updateField('program_topic', e.target.value)}
                    placeholder="AI in the Enterprise: What Leaders Need to Know"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Audience Size</Label>
                    <Input
                      type="number"
                      value={formData.audience_size}
                      onChange={(e) => updateField('audience_size', e.target.value)}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <Label>Speaker Attire</Label>
                    <Select
                      value={formData.speaker_attire}
                      onValueChange={(value) => updateField('speaker_attire', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business_formal">Business Formal</SelectItem>
                        <SelectItem value="business_casual">Business Casual</SelectItem>
                        <SelectItem value="smart_casual">Smart Casual</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="black_tie">Black Tie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Audience Demographics</Label>
                  <Textarea
                    value={formData.audience_demographics}
                    onChange={(e) => updateField('audience_demographics', e.target.value)}
                    placeholder="C-suite executives, VPs of Technology, IT Directors..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Event Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Event Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Event Start Time</Label>
                    <Input
                      type="time"
                      value={formData.event_start_time}
                      onChange={(e) => updateField('event_start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Event End Time</Label>
                    <Input
                      type="time"
                      value={formData.event_end_time}
                      onChange={(e) => updateField('event_end_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => updateField('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <Label>Speaker Arrival</Label>
                    <Input
                      type="time"
                      value={formData.speaker_arrival_time}
                      onChange={(e) => updateField('speaker_arrival_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Program Start</Label>
                    <Input
                      type="time"
                      value={formData.program_start_time}
                      onChange={(e) => updateField('program_start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{formData.program_type === 'workshop' ? 'Duration (min)' : 'Program (min)'}</Label>
                    <Input
                      type="number"
                      value={formData.program_length_minutes}
                      onChange={(e) => updateField('program_length_minutes', e.target.value)}
                      placeholder={formData.program_type === 'workshop' ? '180' : '45'}
                    />
                  </div>
                  <div>
                    <Label>{formData.program_type === 'workshop' ? 'Breaks (min)' : 'Q&A (min)'}</Label>
                    <Input
                      type="number"
                      value={formData.qa_length_minutes}
                      onChange={(e) => updateField('qa_length_minutes', e.target.value)}
                      placeholder={formData.program_type === 'workshop' ? '30' : '15'}
                    />
                  </div>
                  <div>
                    <Label>Speaker Departure</Label>
                    <Input
                      type="time"
                      value={formData.speaker_departure_time}
                      onChange={(e) => updateField('speaker_departure_time', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Detailed Timeline / Agenda</Label>
                  <Textarea
                    value={formData.detailed_timeline}
                    onChange={(e) => updateField('detailed_timeline', e.target.value)}
                    placeholder="Full event agenda with specific times..."
                    rows={3}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Technical Requirements</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>AV Requirements</Label>
                      <Textarea
                        value={formData.av_requirements}
                        onChange={(e) => updateField('av_requirements', e.target.value)}
                        placeholder="Lavalier microphone, projector, confidence monitor..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Tech Rehearsal Time</Label>
                      <Input
                        value={formData.tech_rehearsal_time}
                        onChange={(e) => updateField('tech_rehearsal_time', e.target.value)}
                        placeholder="e.g., Day before at 2pm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recording"
                      checked={formData.recording_allowed}
                      onCheckedChange={(checked) => updateField('recording_allowed', checked)}
                    />
                    <Label htmlFor="recording" className="font-normal">Recording Allowed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="streaming"
                      checked={formData.live_streaming}
                      onCheckedChange={(checked) => updateField('live_streaming', checked)}
                    />
                    <Label htmlFor="streaming" className="font-normal">Live Streaming</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="photography"
                      checked={formData.photography_allowed}
                      onCheckedChange={(checked) => updateField('photography_allowed', checked)}
                    />
                    <Label htmlFor="photography" className="font-normal">Photography</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travel & Accommodation - only show if not virtual */}
            {!isVirtual && (
              <Card>
                <CardHeader>
                  <CardTitle>Travel & Accommodation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Fly-In Date</Label>
                      <Input
                        type="date"
                        value={formData.fly_in_date}
                        onChange={(e) => updateField('fly_in_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Fly-Out Date</Label>
                      <Input
                        type="date"
                        value={formData.fly_out_date}
                        onChange={(e) => updateField('fly_out_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Nearest Airport</Label>
                      <Input
                        value={formData.nearest_airport}
                        onChange={(e) => updateField('nearest_airport', e.target.value)}
                        placeholder="SFO"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="airport_transport"
                        checked={formData.airport_transport_provided}
                        onCheckedChange={(checked) => updateField('airport_transport_provided', checked)}
                      />
                      <Label htmlFor="airport_transport" className="font-normal">Airport Transportation Provided</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hotel_transport"
                        checked={formData.hotel_transport_provided}
                        onCheckedChange={(checked) => updateField('hotel_transport_provided', checked)}
                      />
                      <Label htmlFor="hotel_transport" className="font-normal">Hotel to Venue Transport Provided</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hotel_required"
                        checked={formData.hotel_required}
                        onCheckedChange={(checked) => updateField('hotel_required', checked)}
                      />
                      <Label htmlFor="hotel_required" className="font-normal">Hotel Required</Label>
                    </div>
                  </div>

                  {formData.hotel_required && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Hotel Name</Label>
                        <Input
                          value={formData.hotel_name}
                          onChange={(e) => updateField('hotel_name', e.target.value)}
                          placeholder="Four Seasons"
                        />
                      </div>
                      <div>
                        <Label>Hotel Dates Needed</Label>
                        <Input
                          value={formData.hotel_dates_needed}
                          onChange={(e) => updateField('hotel_dates_needed', e.target.value)}
                          placeholder="March 14-16, 2025"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Speaker Fee</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={formData.speaker_fee}
                        onChange={(e) => updateField('speaker_fee', e.target.value)}
                        className="pl-10"
                        placeholder="25000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <Select
                      value={formData.payment_terms}
                      onValueChange={(value) => updateField('payment_terms', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="net_15">Net 15</SelectItem>
                        <SelectItem value="upon_completion">Upon Completion</SelectItem>
                        <SelectItem value="deposit_balance">50% Deposit / 50% Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Travel Expenses</Label>
                    <Select
                      value={formData.travel_expenses_type}
                      onValueChange={(value) => updateField('travel_expenses_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat_buyout">Flat Buyout</SelectItem>
                        <SelectItem value="actual_expenses">Actual Expenses</SelectItem>
                        <SelectItem value="client_books">Client Books Travel</SelectItem>
                        <SelectItem value="included">Included in Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.travel_expenses_type === 'flat_buyout' || formData.travel_expenses_type === 'actual_expenses') && (
                    <div>
                      <Label>
                        {formData.travel_expenses_type === 'flat_buyout' ? 'Travel Buyout Amount' : 'Estimated Travel Budget'}
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          value={formData.travel_expenses_amount}
                          onChange={(e) => updateField('travel_expenses_amount', e.target.value)}
                          className="pl-10"
                          placeholder="2500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Payment Notes</Label>
                  <Input
                    value={formData.payment_notes}
                    onChange={(e) => updateField('payment_notes', e.target.value)}
                    placeholder="e.g., 50% due after signing, 50% due before event"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prep Call - Standard for all events */}
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-3">Prep Call</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prep Call Date</Label>
                      <Input
                        type="date"
                        value={formData.prep_call_date}
                        onChange={(e) => updateField('prep_call_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Prep Call Time</Label>
                      <Input
                        type="time"
                        value={formData.prep_call_time}
                        onChange={(e) => updateField('prep_call_time', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="green_room"
                      checked={formData.green_room_available}
                      onCheckedChange={(checked) => updateField('green_room_available', checked)}
                    />
                    <Label htmlFor="green_room" className="font-normal">Green Room Available</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="additional_engagements"
                      checked={formData.additional_engagements}
                      onCheckedChange={(checked) => updateField('additional_engagements', checked)}
                    />
                    <Label htmlFor="additional_engagements" className="font-normal">Additional Engagement Opportunities</Label>
                  </div>
                </div>

                {/* Additional Engagements - expandable */}
                {formData.additional_engagements && (
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Meet & Greet Opportunities</Label>
                        <Input
                          value={formData.meet_and_greet}
                          onChange={(e) => updateField('meet_and_greet', e.target.value)}
                          placeholder="e.g., After presentation at lunch"
                        />
                      </div>
                      <div>
                        <Label>Guest List Notes</Label>
                        <Input
                          value={formData.guest_list_notes}
                          onChange={(e) => updateField('guest_list_notes', e.target.value)}
                          placeholder="e.g., Speaker invited to lunch"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Marketing / Promotion</Label>
                        <Input
                          value={formData.marketing_promotion}
                          onChange={(e) => updateField('marketing_promotion', e.target.value)}
                          placeholder="Marketing restrictions or permissions"
                        />
                      </div>
                      <div>
                        <Label>Press / Media</Label>
                        <Input
                          value={formData.press_media}
                          onChange={(e) => updateField('press_media', e.target.value)}
                          placeholder="e.g., No media or interviews"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Special Requests</Label>
                  <Textarea
                    value={formData.special_requests}
                    onChange={(e) => updateField('special_requests', e.target.value)}
                    rows={2}
                    placeholder="Any special requests or considerations..."
                  />
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={formData.additional_notes}
                    onChange={(e) => updateField('additional_notes', e.target.value)}
                    rows={3}
                    placeholder="Any other relevant information..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Save Button */}
          <div className="flex justify-end mt-6">
            <Button
              className="bg-amber-500 hover:bg-amber-600"
              size="lg"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditMode ? 'Update Firm Offer' : 'Save Firm Offer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

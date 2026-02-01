"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Send,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  Search,
  RefreshCw,
  Plus,
  AlertTriangle,
  Timer
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { AdminSidebar } from "@/components/admin-sidebar"

interface FirmOffer {
  id: number
  proposal_id: number
  status: string
  proposal_title: string
  client_name: string
  client_email: string
  event_overview: any
  speaker_program: any
  financial_details: any
  speaker_access_token: string
  speaker_viewed_at: string | null
  speaker_response_at: string | null
  speaker_confirmed: boolean | null
  speaker_notes: string | null
  created_at: string
  submitted_at: string | null
  sent_to_speaker_at: string | null
  hold_expires_at: string | null
}

interface Proposal {
  id: number
  title: string
  client_name: string
  client_email: string
  speakers: any[]
  total_investment: number
  event_title: string
  event_date: string
  event_location?: string
  attendee_count?: number
}

interface Deal {
  id: number
  client_name: string
  client_email: string
  client_phone: string
  company: string
  event_title: string
  event_date: string
  event_location: string
  event_type: string
  speaker_requested?: string
  attendee_count: number
  budget_range: string
  deal_value: number
  status: string
  travel_required?: boolean
  flight_required?: boolean
  hotel_required?: boolean
  travel_stipend?: number
  travel_notes?: string
}

export default function AdminFirmOffersPage() {
  const { toast } = useToast()
  const [firmOffers, setFirmOffers] = useState<FirmOffer[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOffer, setSelectedOffer] = useState<FirmOffer | null>(null)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [speakerEmail, setSpeakerEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [sourceType, setSourceType] = useState<'deal' | 'proposal' | 'manual'>('deal')

  // Create form state - expanded with all firm offer sheet fields
  const [createForm, setCreateForm] = useState({
    deal_id: "",
    proposal_id: "",
    // Client/Billing Info
    client_name: "",
    client_email: "",
    client_phone: "",
    client_company: "",
    // Event Info
    event_name: "",
    event_date: "",
    event_location: "",
    event_type: "",
    attendee_count: "",
    // Speaker Info
    speaker_name: "",
    speaker_fee: "",
    program_type: "keynote",
    // Travel Info
    travel_required: false,
    flight_required: false,
    hotel_required: false,
    travel_buyout: "",
    travel_notes: "",
    // Notes
    notes: ""
  })

  useEffect(() => {
    fetchFirmOffers()
    fetchProposals()
    fetchDeals()
  }, [])

  const fetchFirmOffers = async () => {
    try {
      const response = await fetch('/api/firm-offers')
      if (response.ok) {
        const data = await response.json()
        setFirmOffers(data)
      }
    } catch (error) {
      console.error('Error fetching firm offers:', error)
      toast({
        title: "Error",
        description: "Failed to load firm offers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals')
      if (response.ok) {
        const data = await response.json()
        setProposals(data)
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
    }
  }

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals')
      if (response.ok) {
        const data = await response.json()
        // Only show won deals or deals in negotiation/proposal stage
        const relevantDeals = data.filter((d: Deal) =>
          d.status === 'won' || d.status === 'negotiation' || d.status === 'proposal'
        )
        setDeals(relevantDeals)
      }
    } catch (error) {
      console.error('Error fetching deals:', error)
    }
  }

  const getHoldStatus = (offer: FirmOffer) => {
    // Calculate hold expiration (2 weeks from creation)
    const createdAt = new Date(offer.created_at)
    const holdExpires = offer.hold_expires_at
      ? new Date(offer.hold_expires_at)
      : new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days
    const now = new Date()
    const daysRemaining = Math.ceil((holdExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysRemaining < 0) {
      return { expired: true, daysRemaining: 0, expiresAt: holdExpires }
    }
    return { expired: false, daysRemaining, expiresAt: holdExpires }
  }

  const getStatusBadge = (offer: FirmOffer) => {
    const holdStatus = getHoldStatus(offer)

    if (offer.speaker_confirmed === true) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Speaker Confirmed</Badge>
    }
    if (offer.speaker_confirmed === false) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Speaker Declined</Badge>
    }
    if (holdStatus.expired && offer.status !== 'speaker_confirmed') {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Hold Expired</Badge>
    }
    if (offer.status === 'sent_to_speaker') {
      return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Awaiting Speaker</Badge>
    }
    if (offer.status === 'submitted') {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Ready for Review</Badge>
    }
    if (offer.status === 'out_for_delivery') {
      return <Badge className="bg-purple-100 text-purple-800"><Send className="h-3 w-3 mr-1" />Out for Delivery</Badge>
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>
  }

  const handleCreateFirmOffer = async () => {
    setIsCreating(true)
    try {
      // Calculate hold expiration (2 weeks from now)
      const holdExpiresAt = new Date()
      holdExpiresAt.setDate(holdExpiresAt.getDate() + 14)

      // Map event_type to program_type
      const programType = createForm.program_type ||
        (createForm.event_type?.toLowerCase().includes('keynote') ? 'keynote' :
         createForm.event_type?.toLowerCase().includes('panel') ? 'panel_discussion' :
         createForm.event_type?.toLowerCase().includes('workshop') ? 'workshop' :
         createForm.event_type?.toLowerCase().includes('fireside') ? 'fireside_chat' : 'keynote')

      const response = await fetch('/api/firm-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: createForm.proposal_id ? parseInt(createForm.proposal_id) : null,
          status: 'out_for_delivery',
          hold_expires_at: holdExpiresAt.toISOString(),
          event_overview: {
            end_client_name: createForm.client_company || createForm.client_name,
            event_name: createForm.event_name,
            event_date: createForm.event_date,
            venue_name: '',
            venue_address: createForm.event_location,
            billing_contact: {
              name: createForm.client_name,
              email: createForm.client_email,
              phone: createForm.client_phone,
              title: '',
              address: ''
            },
            logistics_contact: {
              name: createForm.client_name,
              email: createForm.client_email,
              phone: createForm.client_phone
            },
            venue_contact: {
              name: '',
              email: '',
              phone: ''
            }
          },
          speaker_program: {
            requested_speaker_name: createForm.speaker_name,
            program_topic: '',
            program_type: programType,
            audience_size: parseInt(createForm.attendee_count) || 0,
            audience_demographics: '',
            speaker_attire: 'business_casual'
          },
          event_schedule: {
            event_start_time: '',
            event_end_time: '',
            speaker_arrival_time: '',
            program_start_time: '',
            program_length_minutes: 60,
            qa_length_minutes: 15,
            total_program_length_minutes: 75,
            speaker_departure_time: '',
            detailed_timeline: '',
            timezone: 'America/New_York'
          },
          technical_requirements: {
            microphone_type: 'Lavalier/lapel preferred',
            projector_screen: '',
            lighting_requirements: '',
            other_av: '',
            recording_allowed: false,
            recording_purpose: 'none',
            live_stream: false,
            photography_allowed: true,
            tech_rehearsal_date: '',
            tech_rehearsal_time: ''
          },
          travel_accommodation: {
            fly_in_date: '',
            fly_out_date: '',
            nearest_airport: '',
            airport_transportation: 'tbd',
            hotel_transportation: 'tbd',
            hotel_required: createForm.hotel_required,
            hotel_dates: '',
            hotel_tier: 'upscale',
            meals_provided: [],
            dietary_requirements: '',
            guest_list_invitation: false,
            vip_meet_greet: false
          },
          additional_info: {
            green_room_available: false,
            meet_greet_before: false,
            meet_greet_after: false,
            vip_reception: false,
            marketing_use_approved: true,
            press_media_present: false,
            interview_requests: '',
            special_requests: ''
          },
          financial_details: {
            speaker_fee: parseFloat(createForm.speaker_fee) || 0,
            travel_expenses_type: createForm.travel_buyout ? 'flat_buyout' : 'client_books',
            travel_buyout_amount: parseFloat(createForm.travel_buyout) || 0,
            travel_notes: createForm.travel_notes || '',
            payment_terms: 'Net 30 days after event'
          },
          confirmation: {
            prep_call_requested: true,
            prep_call_date_preferences: '',
            additional_notes: createForm.notes
          }
        })
      })

      if (response.ok) {
        const newOffer = await response.json()
        toast({
          title: "Firm Offer Created",
          description: "The firm offer has been created with a 2-week hold."
        })

        // Copy the client link
        const clientLink = `${window.location.origin}/firm-offer/${newOffer.speaker_access_token}`
        navigator.clipboard.writeText(clientLink)
        toast({
          title: "Link Copied",
          description: "Client firm offer link copied to clipboard."
        })

        setShowCreateDialog(false)
        resetCreateForm()
        fetchFirmOffers()
      } else {
        throw new Error('Failed to create')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create firm offer",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      deal_id: "",
      proposal_id: "",
      client_name: "",
      client_email: "",
      client_phone: "",
      client_company: "",
      event_name: "",
      event_date: "",
      event_location: "",
      event_type: "",
      attendee_count: "",
      speaker_name: "",
      speaker_fee: "",
      program_type: "keynote",
      travel_required: false,
      flight_required: false,
      hotel_required: false,
      travel_buyout: "",
      travel_notes: "",
      notes: ""
    })
    setSourceType('deal')
  }

  const handleSendToSpeaker = async () => {
    if (!selectedOffer) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/firm-offers/${selectedOffer.id}/send-to-speaker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker_email: speakerEmail,
          speaker_name: selectedOffer.speaker_program?.requested_speaker_name
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sent!",
          description: "Firm offer sent to speaker for review."
        })
        setShowSendDialog(false)
        fetchFirmOffers()

        // Copy the review URL to clipboard
        if (data.speaker_review_url) {
          navigator.clipboard.writeText(data.speaker_review_url)
          toast({
            title: "Link Copied",
            description: "Speaker review link has been copied to clipboard."
          })
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send to speaker",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const copyReviewLink = (token: string) => {
    const url = `${window.location.origin}/speaker-review/${token}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Copied!",
      description: "Speaker review link copied to clipboard."
    })
  }

  const copyClientLink = (token: string) => {
    const url = `${window.location.origin}/firm-offer/${token}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Copied!",
      description: "Client firm offer link copied to clipboard."
    })
  }

  const handleDealSelect = (dealId: string) => {
    setCreateForm(prev => ({ ...prev, deal_id: dealId, proposal_id: "" }))
    const deal = deals.find(d => d.id === parseInt(dealId))
    if (deal) {
      // Calculate speaker fee (80% of deal value assuming 20% commission)
      const speakerFee = deal.deal_value * 0.8

      setCreateForm(prev => ({
        ...prev,
        client_name: deal.client_name || '',
        client_email: deal.client_email || '',
        client_phone: deal.client_phone || '',
        client_company: deal.company || '',
        event_name: deal.event_title || '',
        event_date: deal.event_date || '',
        event_location: deal.event_location || '',
        event_type: deal.event_type || '',
        attendee_count: (deal.attendee_count || '').toString(),
        speaker_name: deal.speaker_requested || '',
        speaker_fee: speakerFee.toString(),
        program_type: deal.event_type?.toLowerCase().includes('keynote') ? 'keynote' :
                      deal.event_type?.toLowerCase().includes('panel') ? 'panel_discussion' :
                      deal.event_type?.toLowerCase().includes('workshop') ? 'workshop' :
                      deal.event_type?.toLowerCase().includes('fireside') ? 'fireside_chat' : 'keynote',
        travel_required: deal.travel_required || false,
        flight_required: deal.flight_required || false,
        hotel_required: deal.hotel_required || false,
        travel_buyout: (deal.travel_stipend || '').toString(),
        travel_notes: deal.travel_notes || ''
      }))
    }
  }

  const handleProposalSelect = (proposalId: string) => {
    setCreateForm(prev => ({ ...prev, proposal_id: proposalId, deal_id: "" }))
    const proposal = proposals.find(p => p.id === parseInt(proposalId))
    if (proposal) {
      const speaker = proposal.speakers?.[0]
      setCreateForm(prev => ({
        ...prev,
        client_name: proposal.client_name || '',
        client_email: proposal.client_email || '',
        client_phone: '',
        client_company: '',
        event_name: proposal.event_title || proposal.title || '',
        event_date: proposal.event_date || '',
        event_location: proposal.event_location || '',
        event_type: '',
        attendee_count: (proposal.attendee_count || '').toString(),
        speaker_name: speaker?.name || '',
        speaker_fee: (speaker?.fee || proposal.total_investment || '').toString(),
        program_type: 'keynote'
      }))
    }
  }

  const filteredOffers = firmOffers.filter(offer =>
    offer.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.proposal_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.speaker_program?.requested_speaker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.event_overview?.event_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Firm Offers</h1>
              <p className="text-gray-600">Manage client firm offer sheets and speaker confirmations</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Firm Offer
              </Button>
              <Button onClick={fetchFirmOffers} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Timer className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800">
                <strong>Speaker holds are valid for 2 weeks.</strong> After expiration, you'll need to re-confirm availability with the speaker.
              </p>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{firmOffers.length}</div>
                <div className="text-sm text-gray-500">Total Offers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {firmOffers.filter(o => o.status === 'out_for_delivery').length}
                </div>
                <div className="text-sm text-gray-500">Out for Delivery</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {firmOffers.filter(o => o.status === 'submitted').length}
                </div>
                <div className="text-sm text-gray-500">Ready for Review</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {firmOffers.filter(o => o.status === 'sent_to_speaker' && o.speaker_confirmed === null).length}
                </div>
                <div className="text-sm text-gray-500">Awaiting Speaker</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {firmOffers.filter(o => o.speaker_confirmed === true).length}
                </div>
                <div className="text-sm text-gray-500">Confirmed</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by client, event, or speaker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client / Event</TableHead>
                    <TableHead>Speaker</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hold Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredOffers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No firm offers found. Click "Create Firm Offer" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOffers.map((offer) => {
                      const holdStatus = getHoldStatus(offer)
                      return (
                        <TableRow key={offer.id} className={holdStatus.expired ? 'bg-red-50' : ''}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{offer.client_name || offer.event_overview?.end_client_name || '-'}</p>
                              <p className="text-sm text-gray-500">{offer.proposal_title || offer.event_overview?.event_name || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {offer.speaker_program?.requested_speaker_name || '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(offer)}
                            {offer.speaker_viewed_at && offer.speaker_confirmed === null && (
                              <p className="text-xs text-gray-500 mt-1">
                                Viewed {formatDate(offer.speaker_viewed_at)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {holdStatus.expired ? (
                              <span className="text-red-600 font-medium">Expired</span>
                            ) : (
                              <div>
                                <span className={holdStatus.daysRemaining <= 3 ? 'text-amber-600 font-medium' : ''}>
                                  {holdStatus.daysRemaining} days left
                                </span>
                                <p className="text-xs text-gray-500">{formatDate(holdStatus.expiresAt.toISOString())}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(offer.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.open(`/firm-offer/${offer.speaker_access_token}`, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Form
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyClientLink(offer.speaker_access_token)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Client Link
                                </DropdownMenuItem>
                                {(offer.status === 'submitted' || offer.status === 'out_for_delivery') && (
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedOffer(offer)
                                    setShowSendDialog(true)
                                  }}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send to Speaker
                                  </DropdownMenuItem>
                                )}
                                {offer.status === 'sent_to_speaker' && (
                                  <>
                                    <DropdownMenuItem onClick={() => copyReviewLink(offer.speaker_access_token)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Speaker Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(`/speaker-review/${offer.speaker_access_token}`, '_blank')}>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Speaker Page
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Firm Offer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) resetCreateForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Firm Offer</DialogTitle>
            <DialogDescription>
              Create a new firm offer to send to the client. The speaker hold will be valid for 2 weeks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Source Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Pre-fill From</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={sourceType === 'deal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSourceType('deal')}
                >
                  Deal
                </Button>
                <Button
                  type="button"
                  variant={sourceType === 'proposal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSourceType('proposal')}
                >
                  Proposal
                </Button>
                <Button
                  type="button"
                  variant={sourceType === 'manual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSourceType('manual')}
                >
                  Manual Entry
                </Button>
              </div>

              {sourceType === 'deal' && (
                <Select value={createForm.deal_id} onValueChange={handleDealSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deal to pre-fill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        <span className="flex items-center gap-2">
                          <Badge variant={d.status === 'won' ? 'default' : 'secondary'} className="text-xs">
                            {d.status}
                          </Badge>
                          {d.client_name} - {d.event_title}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {sourceType === 'proposal' && (
                <Select value={createForm.proposal_id} onValueChange={handleProposalSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a proposal to pre-fill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {proposals.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.client_name} - {p.title || p.event_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Client/Billing Information */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Client Information</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Contact Name *</Label>
                  <Input
                    value={createForm.client_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label className="text-sm">Company/Organization</Label>
                  <Input
                    value={createForm.client_company}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, client_company: e.target.value }))}
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Email *</Label>
                  <Input
                    type="email"
                    value={createForm.client_email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, client_email: e.target.value }))}
                    placeholder="john@acme.com"
                  />
                </div>
                <div>
                  <Label className="text-sm">Phone</Label>
                  <Input
                    value={createForm.client_phone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Event Information */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Event Details</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Event Name *</Label>
                  <Input
                    value={createForm.event_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, event_name: e.target.value }))}
                    placeholder="Annual Leadership Summit"
                  />
                </div>
                <div>
                  <Label className="text-sm">Event Date *</Label>
                  <Input
                    type="date"
                    value={createForm.event_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, event_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Location</Label>
                  <Input
                    value={createForm.event_location}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, event_location: e.target.value }))}
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div>
                  <Label className="text-sm">Expected Attendees</Label>
                  <Input
                    type="number"
                    value={createForm.attendee_count}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, attendee_count: e.target.value }))}
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            {/* Speaker Information */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Speaker & Program</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Speaker Name *</Label>
                  <Input
                    value={createForm.speaker_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, speaker_name: e.target.value }))}
                    placeholder="Dr. Jane Doe"
                  />
                </div>
                <div>
                  <Label className="text-sm">Speaker Fee *</Label>
                  <Input
                    type="number"
                    value={createForm.speaker_fee}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, speaker_fee: e.target.value }))}
                    placeholder="15000"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">Program Type</Label>
                <Select
                  value={createForm.program_type}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, program_type: value }))}
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
            </div>

            {/* Travel Information */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Travel & Accommodation</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createForm.flight_required}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, flight_required: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Flight Required</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createForm.hotel_required}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, hotel_required: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Hotel Required</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Travel Buyout Amount</Label>
                  <Input
                    type="number"
                    value={createForm.travel_buyout}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, travel_buyout: e.target.value }))}
                    placeholder="2500"
                  />
                </div>
                <div>
                  <Label className="text-sm">Travel Notes</Label>
                  <Input
                    value={createForm.travel_notes}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, travel_notes: e.target.value }))}
                    placeholder="Business class required"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Additional Notes</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional information for the client to review..."
                rows={3}
              />
            </div>

            {/* Hold Warning */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>⏱️ 2-Week Hold:</strong> This firm offer will include a note that the speaker hold expires in 2 weeks. After that, availability must be re-confirmed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFirmOffer}
              disabled={isCreating || !createForm.client_name || !createForm.speaker_name || !createForm.event_name}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create & Copy Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Speaker Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Speaker</DialogTitle>
            <DialogDescription>
              Send this firm offer to the speaker for review and confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Speaker</Label>
              <p className="font-medium">{selectedOffer?.speaker_program?.requested_speaker_name}</p>
            </div>
            <div>
              <Label>Event</Label>
              <p className="text-sm text-gray-600">
                {selectedOffer?.event_overview?.event_name || selectedOffer?.proposal_title}
              </p>
            </div>
            <div>
              <Label htmlFor="speaker-email">Speaker Email (optional)</Label>
              <Input
                id="speaker-email"
                type="email"
                value={speakerEmail}
                onChange={(e) => setSpeakerEmail(e.target.value)}
                placeholder="speaker@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to just copy the review link
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendToSpeaker} disabled={isSending}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send & Copy Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

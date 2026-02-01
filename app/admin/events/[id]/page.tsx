"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Phone,
  Mail,
  Building2,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Save,
  X,
  Plane,
  Hotel,
  Utensils,
  Monitor,
  User,
  CreditCard,
  Send,
  FileCheck,
  Loader2
} from "lucide-react"

interface Project {
  id: number
  project_name: string
  client_name: string
  client_email?: string
  client_phone?: string
  company?: string
  project_type: string
  description?: string
  status: "2plus_months" | "1to2_months" | "less_than_month" | "final_week" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  start_date: string
  deadline?: string
  event_date?: string
  event_location?: string
  event_type?: string
  attendee_count?: number
  speaker_fee?: number
  travel_required?: boolean
  accommodation_required?: boolean
  av_requirements?: string
  catering_requirements?: string
  special_requirements?: string
  event_agenda?: any
  marketing_materials?: any
  contact_person?: string
  venue_contact?: string
  contract_signed?: boolean
  invoice_sent?: boolean
  payment_received?: boolean
  presentation_ready?: boolean
  materials_sent?: boolean
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
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

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [event, setEvent] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [editData, setEditData] = useState<Partial<Project>>({})

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    const sessionToken = localStorage.getItem("adminSessionToken")
    if (!isAdminLoggedIn || !sessionToken) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    fetchEvent()
  }, [router, params.id])

  const fetchEvent = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch event details")
      }
      const data = await response.json()
      setEvent(data)
      setEditData(data)
    } catch (error) {
      console.error("Error fetching event:", error)
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveEvent = async () => {
    if (!event) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/projects/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData)
      })
      
      if (!response.ok) {
        throw new Error("Failed to update event")
      }
      
      const updatedEvent = await response.json()
      setEvent(updatedEvent)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Event updated successfully"
      })
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const calculateDaysUntilEvent = () => {
    if (!event?.event_date) return null
    const today = new Date()
    const eventDate = new Date(event.event_date)
    const diffTime = eventDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">Event not found</p>
            <Link href="/admin/projects">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysUntilEvent = calculateDaysUntilEvent()
  const isOverdue = daysUntilEvent !== null && daysUntilEvent < 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <Link href="/admin/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.project_name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={`${STATUS_COLORS[event.status]} text-white`}>
                  {STATUS_LABELS[event.status]}
                </Badge>
                {daysUntilEvent !== null && (
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>
                    {isOverdue ? `${Math.abs(daysUntilEvent)} days ago` : `${daysUntilEvent} days left`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditData(event) }} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={saveEvent} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Event Date</label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.event_date?.split('T')[0] || ''}
                        onChange={(e) => setEditData({...editData, event_date: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Event Type</label>
                    {isEditing ? (
                      <Select value={editData.event_type || ''} onValueChange={(value) => setEditData({...editData, event_type: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Workshop">Workshop</SelectItem>
                          <SelectItem value="Keynote">Keynote</SelectItem>
                          <SelectItem value="Conference">Conference</SelectItem>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="Consulting">Consulting</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1">{event.event_type || 'Not specified'}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  {isEditing ? (
                    <Input
                      value={editData.event_location || ''}
                      onChange={(e) => setEditData({...editData, event_location: e.target.value})}
                      placeholder="Event location"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {event.event_location || 'Location TBD'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Expected Attendees</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.attendee_count || ''}
                        onChange={(e) => setEditData({...editData, attendee_count: parseInt(e.target.value) || 0})}
                        placeholder="Number of attendees"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        {event.attendee_count || 'TBD'} attendees
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Speaker Fee</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editData.speaker_fee || ''}
                        onChange={(e) => setEditData({...editData, speaker_fee: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        ${(event.speaker_fee || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  {isEditing ? (
                    <Textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      placeholder="Event description"
                      rows={3}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">{event.description || 'No description provided'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Primary Contact</label>
                    {isEditing ? (
                      <Input
                        value={editData.contact_person || editData.client_name || ''}
                        onChange={(e) => setEditData({...editData, contact_person: e.target.value})}
                        placeholder="Contact person name"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {event.contact_person || event.client_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company</label>
                    {isEditing ? (
                      <Input
                        value={editData.company || ''}
                        onChange={(e) => setEditData({...editData, company: e.target.value})}
                        placeholder="Company name"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1">{event.company || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editData.client_email || ''}
                        onChange={(e) => setEditData({...editData, client_email: e.target.value})}
                        placeholder="client@company.com"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {event.client_email || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    {isEditing ? (
                      <Input
                        value={editData.client_phone || ''}
                        onChange={(e) => setEditData({...editData, client_phone: e.target.value})}
                        placeholder="Phone number"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {event.client_phone || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Venue Contact</label>
                  {isEditing ? (
                    <Input
                      value={editData.venue_contact || ''}
                      onChange={(e) => setEditData({...editData, venue_contact: e.target.value})}
                      placeholder="Venue contact person"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{event.venue_contact || 'Not specified'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Requirements & Logistics */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements & Logistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <Checkbox
                        checked={editData.travel_required || false}
                        onCheckedChange={(checked) => setEditData({...editData, travel_required: !!checked})}
                      />
                    ) : (
                      <div className={`w-4 h-4 rounded border ${event.travel_required ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                        {event.travel_required && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-gray-400" />
                      <span>Travel Required</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <Checkbox
                        checked={editData.accommodation_required || false}
                        onCheckedChange={(checked) => setEditData({...editData, accommodation_required: !!checked})}
                      />
                    ) : (
                      <div className={`w-4 h-4 rounded border ${event.accommodation_required ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                        {event.accommodation_required && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Hotel className="h-4 w-4 text-gray-400" />
                      <span>Accommodation Required</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    AV Requirements
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editData.av_requirements || ''}
                      onChange={(e) => setEditData({...editData, av_requirements: e.target.value})}
                      placeholder="Audio/visual equipment needed"
                      rows={2}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">{event.av_requirements || 'Standard AV setup'}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Catering Requirements
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editData.catering_requirements || ''}
                      onChange={(e) => setEditData({...editData, catering_requirements: e.target.value})}
                      placeholder="Catering and dietary requirements"
                      rows={2}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">{event.catering_requirements || 'No special requirements'}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Special Requirements</label>
                  {isEditing ? (
                    <Textarea
                      value={editData.special_requirements || ''}
                      onChange={(e) => setEditData({...editData, special_requirements: e.target.value})}
                      placeholder="Any other special requirements"
                      rows={2}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">{event.special_requirements || 'None specified'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    placeholder="Internal notes and comments"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{event.notes || 'No notes added'}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Event Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'contract_signed', label: 'Contract Signed', icon: FileCheck },
                  { key: 'invoice_sent', label: 'Invoice Sent', icon: Send },
                  { key: 'payment_received', label: 'Payment Received', icon: CreditCard },
                  { key: 'presentation_ready', label: 'Presentation Ready', icon: Monitor },
                  { key: 'materials_sent', label: 'Materials Sent', icon: FileText }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{label}</span>
                    </div>
                    {isEditing ? (
                      <Checkbox
                        checked={editData[key as keyof Project] as boolean || false}
                        onCheckedChange={(checked) => setEditData({...editData, [key]: !!checked})}
                      />
                    ) : (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        event[key as keyof Project] ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {event[key as keyof Project] && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium">
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium">
                    {new Date(event.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {event.tags && event.tags.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  Mic,
  Clock,
  Monitor,
  Plane,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
  Timer
} from "lucide-react"
import Link from "next/link"
import { generateDeliverablesFromProject, formatDeliverablesForStorage } from "@/lib/generate-deliverables"
import { authFetch } from "@/lib/auth-fetch"

interface Project {
  id: number
  project_name: string
  client_name: string
  client_email?: string
  client_phone?: string
  company?: string
  project_type: string
  description?: string
  status: "2plus_months" | "1to2_months" | "less_than_month" | "final_week" | "contracts_signed" | "invoicing" | "logistics_planning" | "pre_event" | "event_week" | "follow_up" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  start_date: string
  deadline?: string
  budget: number
  completion_percentage: number
  
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
  
  // Event Overview - Additional Fields
  event_name?: string
  event_date?: string
  event_location?: string
  event_website?: string
  venue_name?: string
  venue_address?: string
  venue_contact_name?: string
  venue_contact_email?: string
  venue_contact_phone?: string
  
  // Speaker Program Details
  requested_speaker_name?: string
  program_topic?: string
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
  flight_number_in?: string
  flight_number_out?: string
  nearest_airport?: string
  airport_transport_provided?: boolean
  airport_transport_details?: string
  venue_transport_provided?: boolean
  venue_transport_details?: string
  accommodation_required?: boolean
  hotel_name?: string
  hotel_reservation_number?: string
  hotel_dates_needed?: string
  hotel_tier_preference?: string
  guest_list_details?: string
  
  // Speaker Information (Speaker Portal Provided)
  speaker_bio?: string
  speaker_headshot?: string
  speaker_presentation_title?: string
  speaker_av_requirements?: string
  
  // Additional Information
  green_room_available?: boolean
  meet_greet_opportunities?: string
  marketing_use_allowed?: boolean
  press_media_present?: boolean
  media_interview_requests?: string
  special_requests?: string
  
  // Financial Details
  speaker_fee?: number
  commission_percentage?: number
  commission_amount?: number
  travel_expenses_type?: string
  travel_expenses_amount?: number
  travel_buyout?: number
  payment_terms?: string
  invoice_number?: string
  purchase_order_number?: string

  // Payment Tracking
  payment_status?: "pending" | "partial" | "paid"
  payment_date?: string
  speaker_payment_status?: "pending" | "paid"
  speaker_payment_date?: string
  
  // Confirmation Details
  prep_call_requested?: boolean
  prep_call_date?: string
  prep_call_time?: string
  
  // Status Tracking
  contract_signed?: boolean
  invoice_sent?: boolean
  presentation_ready?: boolean
  materials_sent?: boolean
  
  // Event Classification
  event_classification?: "virtual" | "local" | "travel"
  
  // Deliverables
  deliverables?: string
  
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

// Workflow stages (what's been completed)
// Matches task-definitions.ts for consistency
const WORKFLOW_STAGES = {
  // Time-based statuses (auto-assigned based on event date)
  "2plus_months": "2+ Months Out",
  "1to2_months": "1-2 Months Out",
  "less_than_month": "< 1 Month",
  "final_week": "Final Week",
  // Workflow statuses
  "contracts_signed": "1. Contracting",
  "invoicing": "2. Invoicing",
  "logistics_planning": "3. Logistics",
  "pre_event": "4. Pre-Event",
  "event_week": "5. Event Week",
  "follow_up": "6. Follow-up",
  "completed": "7. Completed",
  "cancelled": "Cancelled"
}

// Stage descriptions for reference
const STAGE_DETAILS = {
  contracts_signed: {
    label: "Contracting",
    description: "Client contract first (prepare → send → signed), then speaker agreement"
  },
  invoicing: {
    label: "Invoicing",
    description: "Deposit invoice (50%), kickoff meeting, confirm event specs"
  },
  logistics_planning: {
    label: "Logistics Planning",
    description: "Event details, A/V, travel/virtual setup, press pack, materials"
  },
  pre_event: {
    label: "Pre-Event",
    description: "48-hour verification, speaker prep, final materials delivered"
  },
  event_week: {
    label: "Event Week",
    description: "Day-before prep, event execution, real-time support"
  },
  follow_up: {
    label: "Follow-up",
    description: "Thank you, feedback, testimonials, lessons learned"
  },
  completed: {
    label: "Completed",
    description: "All tasks done, feedback collected, project archived"
  },
  cancelled: {
    label: "Cancelled",
    description: "Project cancelled or on hold"
  }
}

// Helper to calculate time urgency from event date
function getTimeUrgency(eventDate?: string): { text: string; urgency: string; color: string; bgColor: string } {
  if (!eventDate) return { text: "No date set", urgency: "unknown", color: "text-gray-500", bgColor: "bg-gray-100" }

  const event = new Date(eventDate)
  const today = new Date()
  event.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const diffTime = event.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)} days ago`, urgency: "past", color: "text-gray-500", bgColor: "bg-gray-100" }
  } else if (diffDays === 0) {
    return { text: "TODAY!", urgency: "today", color: "text-red-700", bgColor: "bg-red-100 border border-red-300" }
  } else if (diffDays <= 7) {
    return { text: `${diffDays} day${diffDays === 1 ? '' : 's'} left`, urgency: "urgent", color: "text-orange-700", bgColor: "bg-orange-100 border border-orange-300" }
  } else if (diffDays <= 30) {
    return { text: `${diffDays} days left`, urgency: "soon", color: "text-yellow-700", bgColor: "bg-yellow-100 border border-yellow-300" }
  } else {
    return { text: `${diffDays} days left`, urgency: "comfortable", color: "text-blue-600", bgColor: "bg-blue-50 border border-blue-200" }
  }
}

const PRIORITY_LEVELS = ["low", "medium", "high", "urgent"]
const PROJECT_TYPES = ["Speaking", "Workshop", "Consulting", "Training", "Keynote", "Panel", "Other"]

export default function ProjectEditPage() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<Partial<Project>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Safely extract project ID - handle both string and array cases
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    if (!projectId) {
      setError("No project ID provided")
      setIsLoading(false)
      return
    }

    try {
      const response = await authFetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const projectData = await response.json()
        setProject(projectData)
        setFormData(projectData)
      } else if (response.status === 401) {
        setError("Not authenticated. Please log in.")
      } else {
        setError("Failed to load project")
      }
    } catch (error) {
      setError("Failed to load project")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await authFetch(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess("Project updated successfully!")
        setTimeout(() => {
          router.push("/admin/projects")
        }, 1500)
      } else if (response.status === 401) {
        setError("Not authenticated. Please log in.")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update project")
      }
    } catch (error) {
      setError("Failed to update project")
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatTime = (time?: string) => {
    if (!time) return ""
    return time.includes("T") ? time.split("T")[1].substring(0, 5) : time
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Project not found</p>
              <Link href="/admin/projects">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/projects">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
              <p className="text-gray-600 mt-1">{project.project_name}</p>
            </div>

            {/* Status Summary - Workflow Stage & Time Urgency */}
            <div className="flex items-center gap-4">
              {/* Workflow Stage Badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <div className="text-left">
                  <div className="text-xs text-purple-500 font-medium">Workflow Stage</div>
                  <div className="text-sm font-semibold text-purple-700">
                    {formData.status ? WORKFLOW_STAGES[formData.status as keyof typeof WORKFLOW_STAGES] || formData.status : 'Not set'}
                  </div>
                </div>
              </div>

              {/* Time Urgency Indicator */}
              {(() => {
                const timeInfo = getTimeUrgency(formData.event_date)
                return (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${timeInfo.bgColor}`}>
                    <Timer className={`h-4 w-4 ${timeInfo.color}`} />
                    <div className="text-left">
                      <div className="text-xs text-gray-500 font-medium">Time Until Event</div>
                      <div className={`text-sm font-semibold ${timeInfo.color}`}>{timeInfo.text}</div>
                    </div>
                  </div>
                )
              })()}
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="event">Event Details</TabsTrigger>
            <TabsTrigger value="speaker">Speaker Program</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project_name">Project Name *</Label>
                    <Input
                      id="project_name"
                      value={formData.project_name || ""}
                      onChange={(e) => updateField("project_name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="project_type">Project Type *</Label>
                    <Select value={formData.project_type} onValueChange={(value) => updateField("project_type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Workflow Stage *</Label>
                    <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WORKFLOW_STAGES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => updateField("priority", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_LEVELS.map(level => (
                          <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date?.split('T')[0] || ""}
                      onChange={(e) => updateField("start_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline?.split('T')[0] || ""}
                      onChange={(e) => updateField("deadline", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="completion_percentage">Completion %</Label>
                    <Input
                      id="completion_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.completion_percentage || ""}
                      onChange={(e) => updateField("completion_percentage", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_name">Client Name *</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name || ""}
                      onChange={(e) => updateField("client_name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company || ""}
                      onChange={(e) => updateField("company", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_email">Client Email</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={formData.client_email || ""}
                      onChange={(e) => updateField("client_email", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_phone">Client Phone</Label>
                    <Input
                      id="client_phone"
                      value={formData.client_phone || ""}
                      onChange={(e) => updateField("client_phone", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Event Details */}
          <TabsContent value="event" className="space-y-6">
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
                    <Label htmlFor="event_name">Event Name</Label>
                    <Input
                      id="event_name"
                      value={formData.event_name || ""}
                      onChange={(e) => updateField("event_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_date">Event Date</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date?.split('T')[0] || ""}
                      onChange={(e) => updateField("event_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_location">Event Location</Label>
                    <Input
                      id="event_location"
                      value={formData.event_location || ""}
                      onChange={(e) => updateField("event_location", e.target.value)}
                      placeholder="e.g., San Francisco, CA or Virtual"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_classification">Event Classification</Label>
                    <Select 
                      value={formData.event_classification} 
                      onValueChange={(value) => {
                        updateField("event_classification", value);
                        // Auto-clear travel and venue fields when switching to virtual
                        if (value === "virtual") {
                          updateField("travel_required", false);
                          updateField("accommodation_required", false);
                          updateField("airport_transport_provided", false);
                          updateField("venue_transport_provided", false);
                          updateField("venue_name", "");
                          updateField("venue_contact_name", "");
                          updateField("venue_contact_email", "");
                          updateField("venue_contact_phone", "");
                          updateField("venue_address", "");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="travel">Travel Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="event_website">Event Website</Label>
                    <Input
                      id="event_website"
                      type="url"
                      value={formData.event_website || ""}
                      onChange={(e) => updateField("event_website", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_name" className={formData.event_classification === "virtual" ? "text-gray-400" : ""}>
                      Venue Name {formData.event_classification === "virtual" && <span className="text-xs">(Not required - Virtual)</span>}
                    </Label>
                    <Input
                      id="venue_name"
                      value={formData.venue_name || ""}
                      onChange={(e) => updateField("venue_name", e.target.value)}
                      disabled={formData.event_classification === "virtual"}
                      placeholder={formData.event_classification === "virtual" ? "Not applicable for virtual event" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_contact_name" className={formData.event_classification === "virtual" ? "text-gray-400" : ""}>
                      Venue Contact {formData.event_classification === "virtual" && <span className="text-xs">(Not required - Virtual)</span>}
                    </Label>
                    <Input
                      id="venue_contact_name"
                      value={formData.venue_contact_name || ""}
                      onChange={(e) => updateField("venue_contact_name", e.target.value)}
                      disabled={formData.event_classification === "virtual"}
                      placeholder={formData.event_classification === "virtual" ? "Not applicable for virtual event" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_contact_email" className={formData.event_classification === "virtual" ? "text-gray-400" : ""}>
                      Venue Contact Email {formData.event_classification === "virtual" && <span className="text-xs">(Not required - Virtual)</span>}
                    </Label>
                    <Input
                      id="venue_contact_email"
                      type="email"
                      value={formData.venue_contact_email || ""}
                      onChange={(e) => updateField("venue_contact_email", e.target.value)}
                      disabled={formData.event_classification === "virtual"}
                      placeholder={formData.event_classification === "virtual" ? "Not applicable for virtual event" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue_contact_phone" className={formData.event_classification === "virtual" ? "text-gray-400" : ""}>
                      Venue Contact Phone {formData.event_classification === "virtual" && <span className="text-xs">(Not required - Virtual)</span>}
                    </Label>
                    <Input
                      id="venue_contact_phone"
                      value={formData.venue_contact_phone || ""}
                      onChange={(e) => updateField("venue_contact_phone", e.target.value)}
                      disabled={formData.event_classification === "virtual"}
                      placeholder={formData.event_classification === "virtual" ? "Not applicable for virtual event" : ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venue_address" className={formData.event_classification === "virtual" ? "text-gray-400" : ""}>
                    Venue Address {formData.event_classification === "virtual" && <span className="text-xs">(Not required - Virtual)</span>}
                  </Label>
                  <Textarea
                    id="venue_address"
                    value={formData.venue_address || ""}
                    onChange={(e) => updateField("venue_address", e.target.value)}
                    rows={2}
                    disabled={formData.event_classification === "virtual"}
                    placeholder={formData.event_classification === "virtual" ? "Not applicable for virtual event" : ""}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Billing Contact</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          billing_contact_name: prev.client_name || "",
                          billing_contact_email: prev.client_email || "",
                          billing_contact_phone: prev.client_phone || ""
                        }))
                      }}
                    >
                      Copy from Client
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billing_contact_name">Name</Label>
                      <Input
                        id="billing_contact_name"
                        value={formData.billing_contact_name || ""}
                        onChange={(e) => updateField("billing_contact_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_contact_title">Title</Label>
                      <Input
                        id="billing_contact_title"
                        value={formData.billing_contact_title || ""}
                        onChange={(e) => updateField("billing_contact_title", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_contact_email">Email</Label>
                      <Input
                        id="billing_contact_email"
                        type="email"
                        value={formData.billing_contact_email || ""}
                        onChange={(e) => updateField("billing_contact_email", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_contact_phone">Phone</Label>
                      <Input
                        id="billing_contact_phone"
                        value={formData.billing_contact_phone || ""}
                        onChange={(e) => updateField("billing_contact_phone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="billing_address">Billing Address</Label>
                    <Textarea
                      id="billing_address"
                      value={formData.billing_address || ""}
                      onChange={(e) => updateField("billing_address", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Logistics Contact</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          logistics_contact_name: prev.client_name || "",
                          logistics_contact_email: prev.client_email || "",
                          logistics_contact_phone: prev.client_phone || ""
                        }))
                      }}
                    >
                      Copy from Client
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logistics_contact_name">Name</Label>
                      <Input
                        id="logistics_contact_name"
                        value={formData.logistics_contact_name || ""}
                        onChange={(e) => updateField("logistics_contact_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="logistics_contact_email">Email</Label>
                      <Input
                        id="logistics_contact_email"
                        type="email"
                        value={formData.logistics_contact_email || ""}
                        onChange={(e) => updateField("logistics_contact_email", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="logistics_contact_phone">Phone</Label>
                      <Input
                        id="logistics_contact_phone"
                        value={formData.logistics_contact_phone || ""}
                        onChange={(e) => updateField("logistics_contact_phone", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Speaker Program */}
          <TabsContent value="speaker" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Speaker Program Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="requested_speaker_name">Requested Speaker</Label>
                    <Input
                      id="requested_speaker_name"
                      value={formData.requested_speaker_name || ""}
                      onChange={(e) => updateField("requested_speaker_name", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="program_topic">Program Topic</Label>
                    <Input
                      id="program_topic"
                      value={formData.program_topic || ""}
                      onChange={(e) => updateField("program_topic", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="audience_size">Audience Size</Label>
                    <Input
                      id="audience_size"
                      type="number"
                      value={formData.audience_size || ""}
                      onChange={(e) => updateField("audience_size", parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="speaker_attire">Speaker Attire</Label>
                    <Input
                      id="speaker_attire"
                      value={formData.speaker_attire || ""}
                      onChange={(e) => updateField("speaker_attire", e.target.value)}
                      placeholder="Business Formal, Business Casual, etc."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="audience_demographics">Audience Demographics</Label>
                  <Textarea
                    id="audience_demographics"
                    value={formData.audience_demographics || ""}
                    onChange={(e) => updateField("audience_demographics", e.target.value)}
                    rows={3}
                    placeholder="Job titles, industries, experience levels, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Speaker Information
                </CardTitle>
                <CardDescription>
                  Speaker materials for this engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="speaker_bio">Speaker Biography</Label>
                    <Textarea
                      id="speaker_bio"
                      value={formData.speaker_bio || ""}
                      onChange={(e) => updateField("speaker_bio", e.target.value)}
                      rows={4}
                      placeholder="Enter speaker biography"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speaker_headshot">Speaker Headshot URL</Label>
                    <Input
                      id="speaker_headshot"
                      value={formData.speaker_headshot || ""}
                      onChange={(e) => updateField("speaker_headshot", e.target.value)}
                      placeholder="URL to speaker headshot"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speaker_presentation_title">Presentation Title</Label>
                    <Input
                      id="speaker_presentation_title"
                      value={formData.speaker_presentation_title || ""}
                      onChange={(e) => updateField("speaker_presentation_title", e.target.value)}
                      placeholder="Enter presentation title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speaker_av_requirements">Speaker A/V Requirements</Label>
                    <Textarea
                      id="speaker_av_requirements"
                      value={formData.speaker_av_requirements || ""}
                      onChange={(e) => updateField("speaker_av_requirements", e.target.value)}
                      rows={3}
                      placeholder="Enter speaker's technical requirements"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Technical Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="av_requirements">A/V Equipment Available at Venue</Label>
                  <Textarea
                    id="av_requirements"
                    value={formData.av_requirements || ""}
                    onChange={(e) => updateField("av_requirements", e.target.value)}
                    rows={4}
                    placeholder="Specify what A/V equipment is available at the venue:&#10;• Microphone types (wireless handheld, lapel, headset)&#10;• Projection equipment (projector specifications, screen size)&#10;• Audio system (speakers, sound mixing)&#10;• Lighting capabilities&#10;• Internet/WiFi availability&#10;• Power outlets and extension capabilities"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recording_allowed"
                      checked={formData.recording_allowed || false}
                      onCheckedChange={(checked) => updateField("recording_allowed", checked)}
                    />
                    <Label htmlFor="recording_allowed">Recording Allowed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="live_streaming"
                      checked={formData.live_streaming || false}
                      onCheckedChange={(checked) => updateField("live_streaming", checked)}
                    />
                    <Label htmlFor="live_streaming">Live Streaming</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="photography_allowed"
                      checked={formData.photography_allowed || false}
                      onCheckedChange={(checked) => updateField("photography_allowed", checked)}
                    />
                    <Label htmlFor="photography_allowed">Photography Allowed</Label>
                  </div>
                </div>

                {formData.recording_allowed && (
                  <div>
                    <Label htmlFor="recording_purpose">Recording Purpose</Label>
                    <Input
                      id="recording_purpose"
                      value={formData.recording_purpose || ""}
                      onChange={(e) => updateField("recording_purpose", e.target.value)}
                      placeholder="Internal use, promotional, etc."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tech_rehearsal_date">Tech Rehearsal Date</Label>
                    <Input
                      id="tech_rehearsal_date"
                      type="date"
                      value={formData.tech_rehearsal_date?.split('T')[0] || ""}
                      onChange={(e) => updateField("tech_rehearsal_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tech_rehearsal_time">Tech Rehearsal Time</Label>
                    <Input
                      id="tech_rehearsal_time"
                      type="time"
                      value={formatTime(formData.tech_rehearsal_time)}
                      onChange={(e) => updateField("tech_rehearsal_time", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Event Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="event_start_time">Event Start Time</Label>
                    <Input
                      id="event_start_time"
                      type="time"
                      value={formatTime(formData.event_start_time)}
                      onChange={(e) => updateField("event_start_time", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_end_time">Event End Time</Label>
                    <Input
                      id="event_end_time"
                      type="time"
                      value={formatTime(formData.event_end_time)}
                      onChange={(e) => updateField("event_end_time", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_timezone">Time Zone</Label>
                    <Input
                      id="event_timezone"
                      value={formData.event_timezone || ""}
                      onChange={(e) => updateField("event_timezone", e.target.value)}
                      placeholder="EST, PST, UTC, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="speaker_arrival_time">Speaker Arrival</Label>
                    <Input
                      id="speaker_arrival_time"
                      type="time"
                      value={formatTime(formData.speaker_arrival_time)}
                      onChange={(e) => updateField("speaker_arrival_time", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="program_start_time">Program Start</Label>
                    <Input
                      id="program_start_time"
                      type="time"
                      value={formatTime(formData.program_start_time)}
                      onChange={(e) => updateField("program_start_time", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="speaker_departure_time">Speaker Departure</Label>
                    <Input
                      id="speaker_departure_time"
                      type="time"
                      value={formatTime(formData.speaker_departure_time)}
                      onChange={(e) => updateField("speaker_departure_time", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="program_length">Program Length (minutes)</Label>
                    <Input
                      id="program_length"
                      type="number"
                      value={formData.program_length || ""}
                      onChange={(e) => updateField("program_length", parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="qa_length">Q&A Length (minutes)</Label>
                    <Input
                      id="qa_length"
                      type="number"
                      value={formData.qa_length || ""}
                      onChange={(e) => updateField("qa_length", parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_program_length">Total Length (minutes)</Label>
                    <Input
                      id="total_program_length"
                      type="number"
                      value={(formData.program_length || 0) + (formData.qa_length || 0) || ""}
                      readOnly
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="event_timeline">Detailed Event Timeline</Label>
                  <Textarea
                    id="event_timeline"
                    value={formData.event_timeline || ""}
                    onChange={(e) => updateField("event_timeline", e.target.value)}
                    rows={6}
                    placeholder="Full agenda with specific times and time zone"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logistics */}
          <TabsContent value="logistics" className="space-y-6">
            {/* Show notice for virtual events */}
            {formData.event_classification === "virtual" && (
              <Alert className="border-blue-200 bg-blue-50">
                <Monitor className="h-4 w-4" />
                <AlertDescription>
                  <strong>Virtual Event</strong> - Travel, accommodation, and physical venue arrangements are not required for this event.
                </AlertDescription>
              </Alert>
            )}
            
            <Card className={formData.event_classification === "virtual" ? "opacity-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Travel & Accommodation
                  {formData.event_classification === "virtual" && (
                    <Badge variant="secondary" className="ml-2">Not Required - Virtual Event</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="travel_required"
                      checked={formData.event_classification === "virtual" ? false : (formData.travel_required || false)}
                      onCheckedChange={(checked) => updateField("travel_required", checked)}
                      disabled={formData.event_classification === "virtual"}
                    />
                    <Label htmlFor="travel_required" className={formData.event_classification === "virtual" ? "text-gray-400" : ""}>
                      Travel Required
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accommodation_required"
                      checked={formData.event_classification === "virtual" ? false : (formData.accommodation_required || false)}
                      onCheckedChange={(checked) => updateField("accommodation_required", checked)}
                      disabled={formData.event_classification === "virtual"}
                    />
                    <Label htmlFor="accommodation_required" className={formData.event_classification === "virtual" ? "text-gray-400" : ""}>
                      Accommodation Required
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="airport_transport_provided"
                      checked={formData.airport_transport_provided || false}
                      onCheckedChange={(checked) => updateField("airport_transport_provided", checked)}
                    />
                    <Label htmlFor="airport_transport_provided">Airport Transport Provided</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="venue_transport_provided"
                      checked={formData.venue_transport_provided || false}
                      onCheckedChange={(checked) => updateField("venue_transport_provided", checked)}
                    />
                    <Label htmlFor="venue_transport_provided">Venue Transport Provided</Label>
                  </div>
                </div>

                {formData.travel_required && formData.event_classification !== "virtual" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                    <h5 className="font-medium text-blue-900">Travel Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fly_in_date">Fly-in Date</Label>
                        <Input
                          id="fly_in_date"
                          type="date"
                          value={formData.fly_in_date?.split('T')[0] || ""}
                          onChange={(e) => updateField("fly_in_date", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fly_out_date">Fly-out Date</Label>
                        <Input
                          id="fly_out_date"
                          type="date"
                          value={formData.fly_out_date?.split('T')[0] || ""}
                          onChange={(e) => updateField("fly_out_date", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="flight_number_in">Inbound Flight Number</Label>
                        <Input
                          id="flight_number_in"
                          value={formData.flight_number_in || ""}
                          onChange={(e) => updateField("flight_number_in", e.target.value)}
                          placeholder="e.g., AA 1234"
                        />
                      </div>
                      <div>
                        <Label htmlFor="flight_number_out">Outbound Flight Number</Label>
                        <Input
                          id="flight_number_out"
                          value={formData.flight_number_out || ""}
                          onChange={(e) => updateField("flight_number_out", e.target.value)}
                          placeholder="e.g., AA 5678"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nearest_airport">Nearest Airport</Label>
                        <Input
                          id="nearest_airport"
                          value={formData.nearest_airport || ""}
                          onChange={(e) => updateField("nearest_airport", e.target.value)}
                          placeholder="Airport code (e.g., LAX, JFK)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.accommodation_required && formData.event_classification !== "virtual" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                    <h5 className="font-medium text-green-900">Accommodation Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hotel_name">Hotel Name</Label>
                        <Input
                          id="hotel_name"
                          value={formData.hotel_name || ""}
                          onChange={(e) => updateField("hotel_name", e.target.value)}
                          placeholder="e.g., Marriott Downtown"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hotel_reservation_number">Reservation Number</Label>
                        <Input
                          id="hotel_reservation_number"
                          value={formData.hotel_reservation_number || ""}
                          onChange={(e) => updateField("hotel_reservation_number", e.target.value)}
                          placeholder="Confirmation/Reference #"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hotel_dates_needed">Hotel Dates Needed</Label>
                        <Input
                          id="hotel_dates_needed"
                          value={formData.hotel_dates_needed || ""}
                          onChange={(e) => updateField("hotel_dates_needed", e.target.value)}
                          placeholder="Check-in to Check-out dates"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hotel_tier_preference">Hotel Tier Preference</Label>
                        <Input
                          id="hotel_tier_preference"
                          value={formData.hotel_tier_preference || ""}
                          onChange={(e) => updateField("hotel_tier_preference", e.target.value)}
                          placeholder="4-star, luxury, business class, etc."
                        />
                      </div>
                    </div>
                  </div>
                )}



                <div>
                  <Label htmlFor="guest_list_details">Guest List & VIP Access</Label>
                  <Textarea
                    id="guest_list_details"
                    value={formData.guest_list_details || ""}
                    onChange={(e) => updateField("guest_list_details", e.target.value)}
                    rows={3}
                    placeholder="Reception/dinner invites, VIP meet & greet details"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="green_room_available"
                      checked={formData.green_room_available || false}
                      onCheckedChange={(checked) => updateField("green_room_available", checked)}
                    />
                    <Label htmlFor="green_room_available">Green Room Available</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="marketing_use_allowed"
                      checked={formData.marketing_use_allowed || false}
                      onCheckedChange={(checked) => updateField("marketing_use_allowed", checked)}
                    />
                    <Label htmlFor="marketing_use_allowed">Marketing Use Allowed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="press_media_present"
                      checked={formData.press_media_present || false}
                      onCheckedChange={(checked) => updateField("press_media_present", checked)}
                    />
                    <Label htmlFor="press_media_present">Press/Media Present</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prep_call_requested"
                      checked={formData.prep_call_requested || false}
                      onCheckedChange={(checked) => updateField("prep_call_requested", checked)}
                    />
                    <Label htmlFor="prep_call_requested">Prep Call Requested</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="meet_greet_opportunities">Meet & Greet Opportunities</Label>
                  <Textarea
                    id="meet_greet_opportunities"
                    value={formData.meet_greet_opportunities || ""}
                    onChange={(e) => updateField("meet_greet_opportunities", e.target.value)}
                    rows={2}
                    placeholder="Before/after presentation, VIP reception, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="media_interview_requests">Media Interview Requests</Label>
                  <Textarea
                    id="media_interview_requests"
                    value={formData.media_interview_requests || ""}
                    onChange={(e) => updateField("media_interview_requests", e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="special_requests">Special Requests</Label>
                  <Textarea
                    id="special_requests"
                    value={formData.special_requests || ""}
                    onChange={(e) => updateField("special_requests", e.target.value)}
                    rows={3}
                  />
                </div>

                {formData.prep_call_requested && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prep_call_date">Prep Call Date</Label>
                      <Input
                        id="prep_call_date"
                        type="date"
                        value={formData.prep_call_date?.split('T')[0] || ""}
                        onChange={(e) => updateField("prep_call_date", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="prep_call_time">Prep Call Time</Label>
                      <Input
                        id="prep_call_time"
                        type="time"
                        value={formatTime(formData.prep_call_time)}
                        onChange={(e) => updateField("prep_call_time", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Commission Calculation Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Fee & Commission Calculation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="budget">Deal Value ($) *</Label>
                      <Input
                        id="budget"
                        type="number"
                        step="0.01"
                        value={formData.budget || ""}
                        onChange={(e) => {
                          const newBudget = parseFloat(e.target.value) || 0
                          const percentage = formData.commission_percentage || 20
                          const commission = newBudget * percentage / 100
                          const speakerFee = newBudget - commission
                          setFormData(prev => ({
                            ...prev,
                            budget: newBudget,
                            commission_amount: commission,
                            speaker_fee: speakerFee
                          }))
                        }}
                        placeholder="Total client pays"
                      />
                      <p className="text-xs text-gray-500 mt-1">Total amount client pays</p>
                    </div>
                    <div>
                      <Label htmlFor="commission_percentage">Commission %</Label>
                      <div className="relative">
                        <Input
                          id="commission_percentage"
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={formData.commission_percentage ?? 20}
                          onChange={(e) => {
                            const newPercentage = parseFloat(e.target.value) || 0
                            const budget = formData.budget || 0
                            const commission = budget * newPercentage / 100
                            const speakerFee = budget - commission
                            setFormData(prev => ({
                              ...prev,
                              commission_percentage: newPercentage,
                              commission_amount: commission,
                              speaker_fee: speakerFee
                            }))
                          }}
                          className="pr-7"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Our commission rate</p>
                    </div>
                    <div>
                      <Label htmlFor="commission_amount">Our Commission ($)</Label>
                      <Input
                        id="commission_amount"
                        type="number"
                        value={Number(formData.commission_amount || ((formData.budget || 0) * (formData.commission_percentage || 20) / 100)).toFixed(2)}
                        readOnly
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Deal × Commission %</p>
                    </div>
                    <div>
                      <Label htmlFor="speaker_fee">Speaker Fee ($)</Label>
                      <Input
                        id="speaker_fee"
                        type="number"
                        value={Number(formData.speaker_fee || ((formData.budget || 0) - ((formData.budget || 0) * (formData.commission_percentage || 20) / 100))).toFixed(2)}
                        readOnly
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Deal − Commission</p>
                    </div>
                  </div>
                </div>

                {/* Other Financial Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="travel_buyout">Travel Buyout ($)</Label>
                    <Input
                      id="travel_buyout"
                      type="number"
                      step="0.01"
                      value={formData.travel_buyout || ""}
                      onChange={(e) => updateField("travel_buyout", parseFloat(e.target.value) || 0)}
                      placeholder="Flat travel buyout amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pass-through to speaker, added to total</p>
                  </div>
                  <div>
                    <Label htmlFor="travel_expenses_amount">Travel Expenses ($)</Label>
                    <Input
                      id="travel_expenses_amount"
                      type="number"
                      step="0.01"
                      value={formData.travel_expenses_amount || ""}
                      onChange={(e) => updateField("travel_expenses_amount", parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="travel_expenses_type">Travel Expenses Type</Label>
                    <Input
                      id="travel_expenses_type"
                      value={formData.travel_expenses_type || ""}
                      onChange={(e) => updateField("travel_expenses_type", e.target.value)}
                      placeholder="Flat buyout, actual expenses, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Input
                      id="payment_terms"
                      value={formData.payment_terms || ""}
                      onChange={(e) => updateField("payment_terms", e.target.value)}
                      placeholder="Net 30, upon completion, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchase_order_number">PO Number</Label>
                    <Input
                      id="purchase_order_number"
                      value={formData.purchase_order_number || ""}
                      onChange={(e) => updateField("purchase_order_number", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                      id="invoice_number"
                      value={formData.invoice_number || ""}
                      onChange={(e) => updateField("invoice_number", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Tracking Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Financial Summary */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">Financial Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Deal Value</span>
                      <p className="font-semibold text-lg">${(formData.budget || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Commission Rate</span>
                      <p className="font-semibold text-lg">{formData.commission_percentage ?? 20}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Speaker Fee</span>
                      <p className="font-semibold text-lg">${(formData.speaker_fee || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Travel Buyout</span>
                      <p className="font-semibold text-lg">${(formData.travel_buyout || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total to Collect</span>
                      <p className="font-semibold text-lg text-blue-600">${((formData.budget || 0) + (formData.travel_buyout || 0)).toLocaleString()}</p>
                      <span className="text-xs text-gray-400">Deal + Travel</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Speaker Payout</span>
                      <p className="font-semibold text-lg text-orange-600">${((formData.speaker_fee || 0) + (formData.travel_buyout || 0)).toLocaleString()}</p>
                      <span className="text-xs text-gray-400">Fee + Travel</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Net Commission</span>
                      <p className={`font-semibold text-lg ${(formData.commission_amount || ((formData.budget || 0) - (formData.speaker_fee || 0))) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(formData.commission_amount || ((formData.budget || 0) - (formData.speaker_fee || 0))).toLocaleString()}
                      </p>
                      <span className="text-xs text-gray-400">{formData.commission_percentage ?? 20}% of deal</span>
                    </div>
                  </div>
                </div>

                {/* Client Payment */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Client Payment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payment_status">Payment Status</Label>
                      <Select
                        value={formData.payment_status || "pending"}
                        onValueChange={(value) => updateField("payment_status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500" />
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="partial">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              Partial
                            </div>
                          </SelectItem>
                          <SelectItem value="paid">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              Paid
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="payment_date">Payment Date</Label>
                      <Input
                        id="payment_date"
                        type="date"
                        value={formData.payment_date?.split('T')[0] || ""}
                        onChange={(e) => updateField("payment_date", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Speaker Payment */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Speaker Payment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="speaker_payment_status">Speaker Payment Status</Label>
                      <Select
                        value={formData.speaker_payment_status || "pending"}
                        onValueChange={(value) => updateField("speaker_payment_status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500" />
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="paid">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              Paid
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="speaker_payment_date">Speaker Payment Date</Label>
                      <Input
                        id="speaker_payment_date"
                        type="date"
                        value={formData.speaker_payment_date?.split('T')[0] || ""}
                        onChange={(e) => updateField("speaker_payment_date", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Deliverables
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const generatedDeliverables = generateDeliverablesFromProject(formData)
                      updateField("deliverables", formatDeliverablesForStorage(generatedDeliverables))
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Auto-Generate
                  </Button>
                </CardTitle>
                <CardDescription>
                  Define what will be delivered as part of this engagement. These will appear on invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deliverables">Deliverables List</Label>
                  <Textarea
                    id="deliverables"
                    value={formData.deliverables || ""}
                    onChange={(e) => updateField("deliverables", e.target.value)}
                    placeholder="Enter each deliverable on a new line...
• Pre-event consultation call
• 60-minute keynote presentation
• Interactive Q&A session
• Post-event resources"
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter each deliverable on a new line. Click "Auto-Generate" to create deliverables based on project details.
                  </p>
                </div>
                
                {formData.deliverables && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="mb-2 block">Preview:</Label>
                    <div className="space-y-1">
                      {formData.deliverables.split('\n').filter(Boolean).map((item, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contract_signed"
                      checked={formData.contract_signed || false}
                      onCheckedChange={(checked) => updateField("contract_signed", checked)}
                    />
                    <Label htmlFor="contract_signed">Contract Signed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="invoice_sent"
                      checked={formData.invoice_sent || false}
                      onCheckedChange={(checked) => updateField("invoice_sent", checked)}
                    />
                    <Label htmlFor="invoice_sent">Invoice Sent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="presentation_ready"
                      checked={formData.presentation_ready || false}
                      onCheckedChange={(checked) => updateField("presentation_ready", checked)}
                    />
                    <Label htmlFor="presentation_ready">Presentation Ready</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="materials_sent"
                      checked={formData.materials_sent || false}
                      onCheckedChange={(checked) => updateField("materials_sent", checked)}
                    />
                    <Label htmlFor="materials_sent">Materials Sent</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="notes">Project Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={6}
                    placeholder="Internal notes, special instructions, important details..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Floating Save Button */}
        <div className="fixed bottom-6 right-6">
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="shadow-lg">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
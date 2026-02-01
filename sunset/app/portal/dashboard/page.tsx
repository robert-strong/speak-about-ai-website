"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  Mail,
  LogOut,
  Monitor,
  Plane,
  Loader2,
  RefreshCw,
  FileText,
  Timer,
  ArrowRight,
  ClipboardList
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
  event_classification?: "virtual" | "local" | "travel"
  attendee_count?: number
  speaker_fee?: number
  travel_required?: boolean
  accommodation_required?: boolean
  av_requirements?: string
  catering_requirements?: string
  special_requirements?: string
  contact_person?: string
  venue_contact?: string
  contract_signed?: boolean
  invoice_sent?: boolean
  payment_received?: boolean
  presentation_ready?: boolean
  materials_sent?: boolean
  notes?: string
  speaker_bio?: string
  speaker_headshot_url?: string
  speaker_topics?: any
  speaker_social_media?: any
  speaker_website?: string
  speaker_one_liner?: string
  promotional_materials?: any
  contract_requirements?: string
  invoice_requirements?: string
  payment_terms?: string
  purchase_order_number?: string
  invoice_number?: string
  contract_url?: string
  invoice_url?: string
  created_at: string
  updated_at: string
}

interface ClientUser {
  email: string
  name: string
  company?: string
  projectCount: number
}

interface FirmOffer {
  id: number
  status: string
  eventName: string
  eventDate: string | null
  speakerName: string
  speakerFee: number
  clientName: string
  accessToken: string
  createdAt: string
  submittedAt: string | null
  holdExpiration: {
    expiresAt: string
    daysRemaining: number
    expired: boolean
  }
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

export default function ClientPortalDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<ClientUser | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [firmOffers, setFirmOffers] = useState<FirmOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")

  const fetchFirmOffers = async (email: string) => {
    try {
      const response = await fetch(`/api/client-portal/firm-offers?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFirmOffers(data.firmOffers || [])
        }
      }
    } catch (error) {
      console.error("Error fetching firm offers:", error)
    }
  }

  useEffect(() => {
    const isClientLoggedIn = localStorage.getItem("clientLoggedIn")
    const sessionToken = localStorage.getItem("clientSessionToken")
    const userData = localStorage.getItem("clientUser")
    const projectsData = localStorage.getItem("clientProjects")

    if (!isClientLoggedIn || !sessionToken || !userData) {
      router.push("/portal")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      const parsedProjects = projectsData ? JSON.parse(projectsData) : []

      setUser(parsedUser)
      setProjects(parsedProjects)

      // Fetch firm offers for this client
      if (parsedUser.email) {
        fetchFirmOffers(parsedUser.email)
      }
    } catch (error) {
      console.error("Error parsing stored data:", error)
      handleLogout()
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("clientLoggedIn")
    localStorage.removeItem("clientSessionToken")
    localStorage.removeItem("clientUser")
    localStorage.removeItem("clientProjects")
    router.push("/portal")
  }

  const refreshProjects = async () => {
    if (!user) return

    try {
      setIsRefreshing(true)
      setError("")

      const sessionToken = localStorage.getItem("clientSessionToken")
      const response = await fetch("/api/auth/client-refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ email: user.email })
      })

      const data = await response.json()

      if (data.success) {
        setProjects(data.projects)
        localStorage.setItem("clientProjects", JSON.stringify(data.projects))
      } else {
        setError(data.error || "Failed to refresh projects")
      }

      // Also refresh firm offers
      await fetchFirmOffers(user.email)
    } catch (error) {
      console.error("Refresh error:", error)
      setError("Connection error. Please try again.")
    } finally {
      setIsRefreshing(false)
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

  const getUrgentProjects = () => {
    return projects.filter(project => {
      const days = calculateDaysUntilEvent(project.event_date)
      return days !== null && days <= 30 && days >= 0
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your events...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">Session expired</p>
            <Button onClick={() => router.push("/portal")}>
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeProjects = projects.filter(p => !['completed', 'cancelled'].includes(p.status))
  const completedProjects = projects.filter(p => p.status === 'completed')
  const urgentProjects = getUrgentProjects()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Dashboard</h1>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{user.name}</span>
              </div>
              {user.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{user.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{user.email}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 lg:mt-0">
            <Button 
              variant="outline" 
              onClick={refreshProjects}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeProjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming (30 days)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{urgentProjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedProjects.length}</div>
            </CardContent>
          </Card>
          <Card className={firmOffers.length > 0 ? "border-purple-200 bg-purple-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Forms</CardTitle>
              <ClipboardList className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{firmOffers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Firm Offers Section */}
        {firmOffers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Action Required: Event Information Forms</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {firmOffers.map((offer) => (
                <Card
                  key={offer.id}
                  className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${
                    offer.holdExpiration.expired
                      ? 'border-l-red-500 bg-red-50'
                      : offer.holdExpiration.daysRemaining <= 3
                      ? 'border-l-amber-500 bg-amber-50'
                      : 'border-l-purple-500 bg-purple-50'
                  }`}
                  onClick={() => window.open(`/firm-offer/${offer.accessToken}`, '_blank')}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{offer.eventName}</CardTitle>
                        <CardDescription className="mt-1">
                          Speaker: {offer.speakerName}
                        </CardDescription>
                      </div>
                      {offer.holdExpiration.expired ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Hold Expired
                        </Badge>
                      ) : (
                        <Badge className={
                          offer.holdExpiration.daysRemaining <= 3
                            ? "bg-amber-500 text-white"
                            : "bg-purple-500 text-white"
                        }>
                          <Timer className="h-3 w-3 mr-1" />
                          {offer.holdExpiration.daysRemaining} days left
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-sm text-gray-600">
                        {offer.eventDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(offer.eventDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          ${offer.speakerFee.toLocaleString()}
                        </div>
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Complete Form
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    {!offer.holdExpiration.expired && offer.holdExpiration.daysRemaining <= 7 && (
                      <Alert className="mt-3 py-2 bg-amber-100 border-amber-300">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 text-xs">
                          Speaker hold expires on {new Date(offer.holdExpiration.expiresAt).toLocaleDateString()}.
                          Please complete this form soon to secure availability.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Your Events</h2>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-500 mb-4">
                  You don't have any events scheduled at the moment.
                </p>
                <Button onClick={refreshProjects} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh Events
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {projects.map((project) => {
                const daysUntilEvent = calculateDaysUntilEvent(project.event_date)
                const isUpcoming = daysUntilEvent !== null && daysUntilEvent <= 30 && daysUntilEvent >= 0
                const isOverdue = daysUntilEvent !== null && daysUntilEvent < 0

                return (
                  <Card 
                    key={project.id} 
                    className={`hover:shadow-lg transition-shadow cursor-pointer ${
                      isUpcoming ? 'border-orange-200 bg-orange-50' : 
                      isOverdue ? 'border-red-200 bg-red-50' : ''
                    }`}
                    onClick={() => router.push(`/portal/event/${project.id}`)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{project.project_name}</CardTitle>
                            <Badge className={`${STATUS_COLORS[project.status]} text-white`}>
                              {STATUS_LABELS[project.status]}
                            </Badge>
                            {project.event_classification && (
                              <Badge variant={
                                project.event_classification === 'virtual' ? 'secondary' : 
                                project.event_classification === 'travel' ? 'default' : 
                                'outline'
                              }>
                                {project.event_classification === 'virtual' && <Monitor className="w-3 h-3 mr-1" />}
                                {project.event_classification === 'travel' && <Plane className="w-3 h-3 mr-1" />}
                                {project.event_classification === 'local' && <MapPin className="w-3 h-3 mr-1" />}
                                {project.event_classification.toUpperCase()}
                              </Badge>
                            )}
                            {isUpcoming && (
                              <Badge className="bg-orange-500 text-white">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                UPCOMING
                              </Badge>
                            )}
                            {isOverdue && (
                              <Badge className="bg-red-500 text-white">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                OVERDUE
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                              <div>
                                {project.event_date && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {new Date(project.event_date).toLocaleDateString()}
                                    {daysUntilEvent !== null && (
                                      <span className={`ml-2 font-semibold ${
                                        isOverdue ? 'text-red-600' : isUpcoming ? 'text-orange-600' : ''
                                      }`}>
                                        ({Math.abs(daysUntilEvent)} days {isOverdue ? 'ago' : 'left'})
                                      </span>
                                    )}
                                  </div>
                                )}
                                {project.event_location && (
                                  <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {project.event_location}
                                  </div>
                                )}
                              </div>
                              <div>
                                {project.event_type && (
                                  <div className="text-sm text-gray-600">
                                    <strong>Type:</strong> {project.event_type}
                                  </div>
                                )}
                                {project.attendee_count && (
                                  <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <Users className="mr-2 h-4 w-4" />
                                    {project.attendee_count} attendees
                                  </div>
                                )}
                              </div>
                              <div>
                                {project.speaker_fee && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    ${project.speaker_fee.toLocaleString()}
                                  </div>
                                )}
                                {project.contact_person && (
                                  <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <User className="mr-2 h-4 w-4" />
                                    {project.contact_person}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">
                                  <strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <strong>Updated:</strong> {new Date(project.updated_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
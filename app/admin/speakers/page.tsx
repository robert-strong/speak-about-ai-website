"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Users,
  Search,
  Edit,
  Eye,
  LogOut,
  ArrowLeft,
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  Loader2,
  AlertTriangle,
  Plus,
  Filter,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  Calendar,
  Video,
  BarChart3,
  MousePointer,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin-sidebar"
import { TableSkeleton, ListItemSkeleton } from "@/components/admin-loading-skeletons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { authGet, authPost, authPatch, authDelete } from "@/lib/auth-fetch"

interface Speaker {
  id: number
  name: string
  email: string
  bio: string
  short_bio: string
  one_liner: string
  headshot_url: string
  website: string
  location: string
  programs: string
  topics: string[]
  industries: string[]
  videos: Array<{
    id: string
    title: string
    url: string
    thumbnail?: string
  }>
  testimonials: Array<{
    quote: string
    author: string
    position?: string
    company?: string
  }>
  speaking_fee_range: string
  featured: boolean
  active: boolean
  listed: boolean
  ranking: number
  created_at: string
  updated_at: string
}

interface SpeakerApplication {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  website?: string
  linkedin_url?: string
  location: string
  title: string
  company: string
  bio: string
  expertise_areas: string[]
  speaking_topics: string
  years_speaking?: number
  previous_engagements?: string
  video_links: string[]
  reference_contacts?: string
  speaking_fee_range?: string
  travel_requirements?: string
  available_formats: string[]
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'invited'
  admin_notes?: string
  rejection_reason?: string
  invitation_sent_at?: string
  account_created_at?: string
  created_at: string
  updated_at: string
  reviewed_at?: string
  reviewed_by?: string
}

interface SpeakerAnalytics {
  name: string
  slug?: string
  location?: string
  views: number
  bookClicks: number
  conversionRate: string | number
  topics?: string
}

export default function AdminSpeakersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [applications, setApplications] = useState<SpeakerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingApplications, setLoadingApplications] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchApplications, setSearchApplications] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [featuredFilter, setFeaturedFilter] = useState("all")
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("all")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<SpeakerApplication | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'invite' | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [processingAction, setProcessingAction] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteFormData, setInviteFormData] = useState({
    speaker_id: "",
    personal_message: ""
  })
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [speakerAnalytics, setSpeakerAnalytics] = useState<SpeakerAnalytics[]>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Check authentication and load data
  useEffect(() => {
    try {
      const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
      if (!isAdminLoggedIn) {
        router.push("/admin")
        return
      }
      setIsLoggedIn(true)
      loadSpeakers()
      loadApplications()
      loadSpeakerAnalytics()
    } catch (error) {
      console.error("Error in useEffect:", error)
      setPageError("Failed to initialize page. Please refresh.")
      setLoading(false)
      setLoadingApplications(false)
    }
  }, [router])

  const handleDeleteSpeaker = async (speakerId: number, speakerName: string) => {
    if (!confirm(`Are you sure you want to delete ${speakerName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await authDelete(`/api/admin/speakers/${speakerId}`)

      if (response.ok) {
        toast({
          title: "Success",
          description: `${speakerName} has been deleted successfully`,
        })
        // Reload speakers list
        loadSpeakers()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete speaker",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting speaker:", error)
      toast({
        title: "Error",
        description: "Failed to delete speaker. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadApplications = async () => {
    try {
      setLoadingApplications(true)
      const response = await authGet("/api/speaker-applications")

      if (response.ok) {
        const data = await response.json()
        // Ensure applications is always an array
        const applications = Array.isArray(data.applications) ? data.applications : []
        setApplications(applications)
      } else {
        let errorMessage = "Failed to load applications"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response isn't JSON, use default message
        }
        console.warn("Applications API error:", errorMessage)
        // Don't show toast for applications - they're optional
        setApplications([])
      }
    } catch (error) {
      console.error("Error loading applications:", error)
      // Don't show toast for applications - they're optional
      setApplications([])
    } finally {
      setLoadingApplications(false)
    }
  }

  const handleApplicationAction = async () => {
    if (!selectedApplication || !actionType) return

    setProcessingAction(true)
    try {
      const response = await authPatch(`/api/speaker-applications/${selectedApplication.id}`, {
          action: actionType,
          admin_notes: adminNotes,
          rejection_reason: actionType === 'reject' ? rejectionReason : undefined
        })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message || `Application ${actionType} successfully`,
        })
        loadApplications()
        setReviewDialogOpen(false)
        setSelectedApplication(null)
        setAdminNotes("")
        setRejectionReason("")
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || `Failed to ${actionType} application`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error processing application:`, error)
      toast({
        title: "Error",
        description: `Failed to ${actionType} application`,
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const openReviewDialog = (application: SpeakerApplication, action: 'approve' | 'reject' | 'invite') => {
    setSelectedApplication(application)
    setActionType(action)
    setReviewDialogOpen(true)
  }

  const handleSendDirectInvite = async () => {
    if (!selectedSpeaker) {
      toast({
        title: "Error",
        description: "Please select a speaker to invite",
        variant: "destructive",
      })
      return
    }

    setSendingInvite(true)
    try {
      const response = await authPost('/api/speaker-invitations', {
          speaker_id: selectedSpeaker.id,
          first_name: selectedSpeaker?.name ? selectedSpeaker.name.split(' ')[0] : ''
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: `Account creation invitation sent to ${selectedSpeaker.name}`,
        })
        setShowInviteDialog(false)
        setInviteFormData({
          speaker_id: "",
          personal_message: ""
        })
        setSelectedSpeaker(null)
        // Reload applications to show the new invitation
        loadApplications()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to send invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setSendingInvite(false)
    }
  }

  const loadSpeakerAnalytics = async () => {
    try {
      setLoadingAnalytics(true)
      const response = await authGet("/api/analytics/speaker-views?days=30")

      if (response.ok) {
        const data = await response.json()
        setSpeakerAnalytics(data.speakers || [])
      }
    } catch (error) {
      console.error("Error loading speaker analytics:", error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const loadSpeakers = async () => {
    try {
      setLoading(true)

      const response = await authGet("/api/admin/speakers")

      if (response.ok) {
        const speakersData = await response.json()
        // Ensure speakers is always an array
        const speakers = Array.isArray(speakersData.speakers) ? speakersData.speakers : []
        // Validate and sanitize speaker data
        const validatedSpeakers = speakers.map((speaker: any) => ({
          ...speaker,
          name: speaker.name || 'Unknown Speaker',
          email: speaker.email || '',
          topics: Array.isArray(speaker.topics) ? speaker.topics : [],
          industries: Array.isArray(speaker.industries) ? speaker.industries : [],
          videos: Array.isArray(speaker.videos) ? speaker.videos : [],
          testimonials: Array.isArray(speaker.testimonials) ? speaker.testimonials : []
        }))
        setSpeakers(validatedSpeakers)
      } else {
        let errorMessage = "Failed to load speakers"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response isn't JSON, use default message
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading speakers:", error)
      toast({
        title: "Error",
        description: "Failed to load speakers. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("adminLoggedIn")
      localStorage.removeItem("adminSessionToken")
      localStorage.removeItem("adminUser")
      router.push("/admin")
    }
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      (app.first_name || '').toLowerCase().includes(searchApplications.toLowerCase()) ||
      (app.last_name || '').toLowerCase().includes(searchApplications.toLowerCase()) ||
      (app.email || '').toLowerCase().includes(searchApplications.toLowerCase()) ||
      (app.company || '').toLowerCase().includes(searchApplications.toLowerCase()) ||
      (app.speaking_topics || '').toLowerCase().includes(searchApplications.toLowerCase())

    const matchesStatus = applicationStatusFilter === "all" || app.status === applicationStatusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending Review', variant: 'secondary' as const, icon: Clock },
      under_review: { label: 'Under Review', variant: 'outline' as const, icon: FileText },
      approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
      invited: { label: 'Invited', variant: 'default' as const, icon: Send },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const filteredSpeakers = speakers.filter((speaker) => {
    const matchesSearch =
      (speaker.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (speaker.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (speaker.bio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (speaker.topics || []).some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (speaker.industries || []).some(industry => industry.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesActive = activeFilter === "all" || 
      (activeFilter === "active" && speaker.active) ||
      (activeFilter === "inactive" && !speaker.active)

    const matchesFeatured = featuredFilter === "all" ||
      (featuredFilter === "featured" && speaker.featured) ||
      (featuredFilter === "not-featured" && !speaker.featured)

    return matchesSearch && matchesActive && matchesFeatured
  })

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (pageError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Page</h2>
              <p className="text-gray-600 mb-4">{pageError}</p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading speakers...</span>
      </div>
    )
  }

  const totalSpeakers = speakers.length
  const activeSpeakers = speakers.filter(s => s.active).length
  const featuredSpeakers = speakers.filter(s => s.featured).length
  const speakersWithVideos = speakers.filter(s => s.videos && s.videos.length > 0).length

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Speaker Management</h1>
              <p className="mt-2 text-gray-600">Manage speaker profiles and applications</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/speakers/new">
                <Button variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Speaker
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setShowInviteDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Invite Speaker
              </Button>
            </div>
          </div>

          <Tabs defaultValue="speakers" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="speakers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Speakers ({speakers.length})
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Applications ({applications.filter(a => a.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="speakers" className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Speakers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSpeakers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Speakers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSpeakers}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((activeSpeakers / totalSpeakers) * 100)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured Speakers</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{featuredSpeakers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Videos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{speakersWithVideos}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((speakersWithVideos / totalSpeakers) * 100)}% have videos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search speakers by name, email, bio, topics, or industries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Speakers</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Speakers</SelectItem>
                  <SelectItem value="featured">Featured Only</SelectItem>
                  <SelectItem value="not-featured">Not Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing {filteredSpeakers.length} of {totalSpeakers} speakers
          </p>
        </div>

        {/* Speakers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpeakers.map((speaker) => (
            <Card key={speaker.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={speaker.headshot_url} alt={speaker.name} />
                      <AvatarFallback>{(speaker.name || 'S').split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase() || 'S'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{speaker.name}</CardTitle>
                      <div className="flex gap-1 mt-1">
                        {speaker.featured && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                        <Badge variant={speaker.active ? "default" : "secondary"} className="text-xs">
                          {speaker.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{speaker.email}</span>
                  </div>
                  {speaker.location && (
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{speaker.location}</span>
                    </div>
                  )}
                  {speaker.website && (
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{speaker.website}</span>
                    </div>
                  )}
                </div>

                {speaker.one_liner && (
                  <p className="text-sm text-gray-700 line-clamp-2">{speaker.one_liner}</p>
                )}

                {speaker.topics && speaker.topics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Topics:</p>
                    <div className="flex flex-wrap gap-1">
                      {speaker.topics.slice(0, 3).map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {speaker.topics.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{speaker.topics.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2 mt-auto">
                  <div className="text-xs text-gray-500 text-center mb-3">
                    {speaker.videos?.length || 0} videos • {speaker.testimonials?.length || 0} testimonials
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Link href={`/admin/speakers/${speaker.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/admin/speakers/${speaker.id}/edit`}>
                      <Button size="sm">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteSpeaker(speaker.id, speaker.name)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSpeakers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No speakers found</h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search terms or filters." : "No speakers match the current filters."}
              </p>
            </CardContent>
          </Card>
        )}
            </TabsContent>

            <TabsContent value="applications" className="space-y-6">
              {/* Application Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {applications.filter(a => a.status === 'pending').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {applications.filter(a => a.status === 'under_review').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {applications.filter(a => a.status === 'approved').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Invited</CardTitle>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {applications.filter(a => a.status === 'invited').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {applications.filter(a => a.status === 'rejected').length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Application Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search applications..."
                          value={searchApplications}
                          onChange={(e) => setSearchApplications(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={applicationStatusFilter} onValueChange={setApplicationStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Applications</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="invited">Invited</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Applications List */}
              {loadingApplications ? (
                <ListItemSkeleton count={5} />
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map((application) => (
                    <Card key={application.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-lg">
                                {application.first_name} {application.last_name}
                              </CardTitle>
                              {getStatusBadge(application.status)}
                            </div>
                            <CardDescription>
                              {application.title} at {application.company}
                            </CardDescription>
                          </div>
                          <div className="text-sm text-gray-500">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {new Date(application.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Contact</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {application.email}
                              </div>
                              {application.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {application.phone}
                                </div>
                              )}
                              {application.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {application.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Links</p>
                            <div className="space-y-1">
                              {application.website && (
                                <div className="flex items-center gap-2">
                                  <Globe className="h-3 w-3" />
                                  <a href={application.website} target="_blank" rel="noopener" className="text-blue-600 hover:underline truncate">
                                    {application.website}
                                  </a>
                                </div>
                              )}
                              {application.linkedin_url && (
                                <div className="flex items-center gap-2">
                                  <Globe className="h-3 w-3" />
                                  <a href={application.linkedin_url} target="_blank" rel="noopener" className="text-blue-600 hover:underline truncate">
                                    LinkedIn Profile
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {application.bio !== 'Direct invitation from admin' ? (
                          <div>
                            <p className="text-gray-500 mb-1 text-sm">Bio</p>
                            <p className="text-sm line-clamp-3">{application.bio}</p>
                          </div>
                        ) : (
                          <Alert className="bg-blue-50 border-blue-200">
                            <Send className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                              This is a direct invitation sent by an admin. The speaker has not yet created their profile.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-500 mb-1 text-sm">Expertise Areas</p>
                            <div className="flex flex-wrap gap-1">
                              {application.expertise_areas && application.expertise_areas.length > 0 ? (
                                <>
                                  {application.expertise_areas.slice(0, 3).map((area, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {area}
                                    </Badge>
                                  ))}
                                  {application.expertise_areas.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{application.expertise_areas.length - 3} more
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">None specified</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1 text-sm">Experience</p>
                            <p className="text-sm">
                              {application.years_speaking ? `${application.years_speaking} years speaking` : 'Not specified'}
                            </p>
                          </div>
                        </div>

                        {application.video_links && application.video_links.length > 0 && (
                          <div>
                            <p className="text-gray-500 mb-1 text-sm">Video Links</p>
                            <div className="space-y-1">
                              {application.video_links.slice(0, 3).map((link, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Video className="h-3 w-3 text-gray-400" />
                                  <a 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm text-blue-600 hover:underline truncate max-w-md"
                                  >
                                    {link}
                                  </a>
                                </div>
                              ))}
                              {application.video_links.length > 3 && (
                                <p className="text-xs text-gray-500 ml-5">
                                  +{application.video_links.length - 3} more videos
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {application.admin_notes && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-gray-500 mb-1 text-sm">Admin Notes</p>
                            <p className="text-sm">{application.admin_notes}</p>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                          <Link href={`/admin/speakers/applications/${application.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </Link>
                          {application.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openReviewDialog(application, 'approve')}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openReviewDialog(application, 'reject')}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {application.status === 'approved' && !application.invitation_sent_at && (
                            <Button
                              size="sm"
                              onClick={() => openReviewDialog(application, 'invite')}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send Invitation
                            </Button>
                          )}
                          {application.status === 'invited' && (
                            <Badge variant="outline" className="text-xs">
                              Invitation sent {new Date(application.invitation_sent_at!).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredApplications.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
                        <p className="text-gray-500">
                          {searchApplications ? "Try adjusting your search terms or filters." : "No applications match the current filters."}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Analytics Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Profile Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {speakerAnalytics.reduce((sum, s) => sum + (s.views || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Book Clicks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {speakerAnalytics.reduce((sum, s) => sum + (s.bookClicks || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total conversions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Avg Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {speakerAnalytics.length > 0 
                        ? (speakerAnalytics.reduce((sum, s) => sum + parseFloat(s.conversionRate || 0), 0) / speakerAnalytics.length).toFixed(1)
                        : '0'}%
                    </div>
                    <p className="text-xs text-muted-foreground">Views to book clicks</p>
                  </CardContent>
                </Card>
              </div>

              {/* Speaker Analytics Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Speaker Profile Performance</CardTitle>
                  <CardDescription>
                    Track which speaker profiles are getting the most views and engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingAnalytics ? (
                    <TableSkeleton rows={5} />
                  ) : speakerAnalytics.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No analytics data available yet. Speaker profile views will appear here once tracked.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Speaker</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Eye className="h-4 w-4" />
                                Views
                              </div>
                            </TableHead>
                            <TableHead className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <MousePointer className="h-4 w-4" />
                                Book Clicks
                              </div>
                            </TableHead>
                            <TableHead className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                Conversion
                              </div>
                            </TableHead>
                            <TableHead>Topics</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {speakerAnalytics.map((speaker, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {speaker.slug ? (
                                  <Link 
                                    href={`/speakers/${speaker.slug}`}
                                    target="_blank"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    {speaker.name}
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                ) : (
                                  speaker.name
                                )}
                              </TableCell>
                              <TableCell>{speaker.location || '-'}</TableCell>
                              <TableCell className="text-center font-semibold">
                                {speaker.views || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {speaker.bookClicks || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={parseFloat(speaker.conversionRate) > 5 ? 'default' : 'secondary'}>
                                  {speaker.conversionRate || 0}%
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {speaker.topics || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' && 'Approve Application'}
                {actionType === 'reject' && 'Reject Application'}
                {actionType === 'invite' && 'Send Invitation'}
              </DialogTitle>
              <DialogDescription>
                {selectedApplication && (
                  <span>{selectedApplication.first_name} {selectedApplication.last_name} - {selectedApplication.email}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any internal notes about this decision..."
                  rows={3}
                />
              </div>
              {actionType === 'reject' && (
                <div>
                  <Label htmlFor="rejection_reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection (optional)..."
                    rows={3}
                  />
                </div>
              )}
              {actionType === 'invite' && (
                <Alert>
                  <Send className="h-4 w-4" />
                  <AlertTitle>Invitation Email</AlertTitle>
                  <AlertDescription>
                    An invitation email will be sent with a link to create their speaker account. The link will expire in 7 days.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApplicationAction}
                disabled={processingAction}
                variant={actionType === 'reject' ? 'destructive' : 'default'}
              >
                {processingAction ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === 'approve' && 'Approve'}
                    {actionType === 'reject' && 'Reject'}
                    {actionType === 'invite' && 'Send Invitation'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite Speaker Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Invite Speaker to Create Account</DialogTitle>
              <DialogDescription>
                Send an account creation invitation to an existing speaker
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="speaker_select">Select Speaker</Label>
                <Select
                  value={inviteFormData.speaker_id}
                  onValueChange={(value) => {
                    const speaker = speakers.find(s => s.id.toString() === value)
                    setInviteFormData({...inviteFormData, speaker_id: value})
                    setSelectedSpeaker(speaker || null)
                  }}
                >
                  <SelectTrigger id="speaker_select">
                    <SelectValue placeholder="Choose a speaker to invite" />
                  </SelectTrigger>
                  <SelectContent>
                    {speakers
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(speaker => (
                        <SelectItem key={speaker.id} value={speaker.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{speaker.name}</span>
                            <span className="text-gray-500">- {speaker.email}</span>
                            {speaker.active && (
                              <Badge variant="outline" className="text-xs ml-2">Active</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedSpeaker && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Speaker Details:</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{selectedSpeaker.email}</span>
                    </div>
                    {selectedSpeaker.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{selectedSpeaker.location}</span>
                      </div>
                    )}
                    {selectedSpeaker.one_liner && (
                      <p className="italic">"{selectedSpeaker.one_liner}"</p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="personal_message">Personal Message (Optional)</Label>
                <Textarea
                  id="personal_message"
                  value={inviteFormData.personal_message}
                  onChange={(e) => setInviteFormData({...inviteFormData, personal_message: e.target.value})}
                  placeholder="Add a personal note to include in the invitation email..."
                  rows={4}
                />
              </div>
              <Alert>
                <Send className="h-4 w-4" />
                <AlertTitle>Invitation Details</AlertTitle>
                <AlertDescription>
                  The invitation will be sent to the speaker's registered email address. They will receive a secure link to create their account that expires in 7 days.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendDirectInvite}
                disabled={sendingInvite || !inviteFormData.speaker_id}
              >
                {sendingInvite ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { SpeakerDashboardLayout } from "@/components/speaker-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  TrendingUp,
  Users,
  Calendar,
  Star,
  Award,
  Eye,
  Clock,
  DollarSign,
  Activity,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  FileText,
  Video,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  MapPin,
  Banknote
} from "lucide-react"

export default function SpeakerDashboard() {
  const [stats, setStats] = useState({
    activeDeals: 0,
    pendingDeals: 0,
    completedEvents: 0,
    earnings: 0,
    profileCompletion: 0
  })
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [assignedDeals, setAssignedDeals] = useState<any[]>([])
  const [assignedProjects, setAssignedProjects] = useState<any[]>([])

  // Fetch profile and calculate completion
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("speakerToken")
        if (!token) return

        // Fetch profile
        const profileResponse = await fetch("/api/speakers/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (profileResponse.ok) {
          const data = await profileResponse.json()
          if (data.profile) {
            setProfile(data.profile)
            
            // Calculate profile completion based on actual data
            const profileCompletionItems = [
              !!(data.profile.first_name && data.profile.last_name && data.profile.email),
              !!(data.profile.title && data.profile.company),
              data.profile.speaking_topics?.length > 0,
              data.profile.videos?.length > 0,
              data.profile.publications?.length > 0,
              data.profile.testimonials?.length > 0,
              !!(data.profile.linkedin_url || data.profile.twitter_url),
              !!(data.profile.speaking_fee_range && data.profile.travel_preferences)
            ]
            
            const completedItems = profileCompletionItems.filter(item => item).length
            const totalItems = profileCompletionItems.length
            const completionPercentage = Math.round((completedItems / totalItems) * 100)
            
            setStats(prev => ({
              ...prev,
              profileCompletion: completionPercentage
            }))
          }
        }

        // Fetch inquiries where speaker is tagged
        const inquiriesResponse = await fetch("/api/speakers/inquiries", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (inquiriesResponse.ok) {
          const inquiriesData = await inquiriesResponse.json()
          if (inquiriesData.inquiries) {
            setInquiries(inquiriesData.inquiries)
          }
        }

        // Fetch assigned deals and projects (beta feature)
        const speakerId = localStorage.getItem("speakerId")
        if (speakerId) {
          try {
            const assignmentsResponse = await fetch(`/api/admin/assign-speaker?speaker_id=${speakerId}`)
            if (assignmentsResponse.ok) {
              const assignmentsData = await assignmentsResponse.json()
              setAssignedDeals(assignmentsData.deals || [])
              setAssignedProjects(assignmentsData.projects || [])
              
              // Update stats with real deal/project data
              const activeDeals = (assignmentsData.deals || []).filter((d: any) =>
                d.status === 'won' || d.status === 'negotiation'
              )
              const pendingDeals = (assignmentsData.deals || []).filter((d: any) =>
                d.status === 'new' || d.status === 'contacted' || d.status === 'proposal_sent'
              )
              const completedProjects = (assignmentsData.projects || []).filter((p: any) =>
                p.status === 'completed'
              )

              setStats(prev => ({
                ...prev,
                activeDeals: activeDeals.length,
                pendingDeals: pendingDeals.length,
                completedEvents: completedProjects.length,
                earnings: (assignmentsData.deals || []).reduce((sum: number, deal: any) =>
                  sum + (deal.payment_status === 'paid' ? Number(deal.deal_value || 0) : 0), 0
                )
              }))
            }
          } catch (error) {
            console.error("Error fetching speaker assignments:", error)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch analytics when period changes
  useEffect(() => {
    const fetchPeriodAnalytics = async () => {
      const token = localStorage.getItem("speakerToken")
      if (!token) return

      // Map period to days for API
      const periodMap: { [key: string]: string } = {
        "30days": "30d",
        "3months": "90d",
        "year": "365d"
      }

      const range = periodMap[selectedPeriod] || "30d"

      try {
        const response = await fetch(`/api/speakers/me/analytics?range=${range}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (response.ok) {
          const analytics = await response.json()
          if (analytics.success && analytics.analytics) {
            setAnalyticsData(analytics.analytics)
          }
        }
      } catch (error) {
        console.error("Error fetching period analytics:", error)
      }
    }

    if (selectedPeriod) {
      fetchPeriodAnalytics()
    }
  }, [selectedPeriod])

  const upcomingEvents: any[] = []

  // Format inquiries as recent activity
  const recentActivity = inquiries.length > 0 
    ? inquiries.slice(0, 5).map((inquiry, index) => ({
        id: inquiry.id || index,
        type: "inquiry",
        message: `New inquiry from ${inquiry.client_name || 'Unknown'} - ${inquiry.event_title || 'Event'}`,
        time: inquiry.created_at ? formatTimeAgo(inquiry.created_at) : 'Recently',
        icon: MessageSquare,
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      }))
    : [{
        id: 1,
        type: "info",
        message: "No recent inquiries",
        time: "Check back later",
        icon: AlertCircle,
        color: "text-gray-500",
        bgColor: "bg-gray-50"
      }]

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <SpeakerDashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#1E68C6] to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
              <p className="text-white/80">Here's what's happening with your speaker profile today.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Active Deals</CardTitle>
                <Target className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.activeDeals}</div>
              <p className="text-sm text-gray-500 mt-1">In negotiation or won</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Deals</CardTitle>
                <MessageSquare className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pendingDeals}</div>
              <p className="text-sm text-gray-500 mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Completed Events</CardTitle>
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.completedEvents}</div>
              <p className="text-sm text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${stats.earnings > 0 ? (stats.earnings / 1000).toFixed(0) + 'k' : '0'}</div>
              <p className="text-sm text-gray-500 mt-1">Paid to date</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
                  <Link href="/speakers/dashboard/events">
                    <Button variant="ghost" size="sm">
                      View All <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${
                          event.status === "confirmed" ? "bg-green-100" : "bg-yellow-100"
                        }`}>
                          <Calendar className={`h-5 w-5 ${
                            event.status === "confirmed" ? "text-green-600" : "text-yellow-600"
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{event.date} • {event.location}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {event.type}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              event.status === "confirmed" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{event.fee}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Profile Completion */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Completion</span>
                      <span className="text-sm font-semibold">{stats.profileCompletion}%</span>
                    </div>
                    <Progress value={stats.profileCompletion} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    {profile && (
                      <>
                        <div className="flex items-center">
                          {profile.first_name && profile.last_name && profile.email ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                          )}
                          <span className="text-sm text-gray-600">Basic Information</span>
                        </div>
                        <div className="flex items-center">
                          {profile.headshot_url ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                          )}
                          <span className="text-sm text-gray-600">Profile Photo</span>
                        </div>
                        <div className="flex items-center">
                          {profile.speaking_topics?.length > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                          )}
                          <span className="text-sm text-gray-600">Speaking Topics</span>
                        </div>
                        <Link href="/speakers/dashboard/profile" className="flex items-center hover:bg-gray-50 p-1 rounded transition-colors">
                          {profile.videos?.length > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                          )}
                          <span className="text-sm text-gray-600 hover:text-gray-900">Video Samples</span>
                        </Link>
                        <Link href="/speakers/dashboard/profile" className="flex items-center hover:bg-gray-50 p-1 rounded transition-colors">
                          {profile.testimonials?.length > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                          )}
                          <span className="text-sm text-gray-600 hover:text-gray-900">Testimonials</span>
                        </Link>
                      </>
                    )}
                  </div>
                  <Link href="/speakers/dashboard/profile">
                    <Button className="w-full bg-gradient-to-r from-[#1E68C6] to-blue-600 hover:from-blue-700 hover:to-blue-800">
                      <Edit className="h-4 w-4 mr-2" />
                      Complete Your Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Recent Inquiries</CardTitle>
                  {inquiries.length > 0 && (
                    <Badge variant="secondary">{inquiries.length} total</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Clock className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    recentActivity.map((activity) => {
                      const Icon = activity.icon
                      return (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                            <Icon className={`h-4 w-4 ${activity.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-gray-50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="ghost">
                    <FileText className="h-4 w-4 mr-2" />
                    Update Bio
                  </Button>
                  <Button className="w-full justify-start" variant="ghost">
                    <Video className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                  <Button className="w-full justify-start" variant="ghost">
                    <Calendar className="h-4 w-4 mr-2" />
                    Set Availability
                  </Button>
                  <Button className="w-full justify-start" variant="ghost">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Update Rates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Assigned Deals and Projects (Beta) */}
        {(assignedDeals.length > 0 || assignedProjects.length > 0) && (
          <div className="mt-6 space-y-6">
            {/* Assigned Deals */}
            {assignedDeals.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Your Opportunities</CardTitle>
                      <CardDescription>Active deals and negotiations</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Beta
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignedDeals.slice(0, 5).map((deal) => (
                      <div key={deal.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{deal.event_title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {deal.client_name} • {deal.company}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-500">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(deal.event_date).toLocaleDateString()}
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                <DollarSign className="h-3 w-3 inline" />
                                {Number(deal.deal_value).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={
                              deal.status === 'won' ? 'default' :
                              deal.status === 'negotiation' ? 'secondary' :
                              'outline'
                            }>
                              {deal.status}
                            </Badge>
                            {deal.payment_status && (
                              <Badge variant={
                                deal.payment_status === 'paid' ? 'default' :
                                deal.payment_status === 'pending' ? 'secondary' :
                                'outline'
                              } className="text-xs">
                                {deal.payment_status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {assignedDeals.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href="/speakers/dashboard/events">
                        <Button variant="ghost" size="sm">
                          View All {assignedDeals.length} Deals
                          <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Assigned Projects */}
            {assignedProjects.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Your Projects</CardTitle>
                      <CardDescription>Active speaking engagements</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      Beta
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignedProjects.slice(0, 5).map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{project.project_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {project.client_name} • {project.company}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-500">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(project.event_date).toLocaleDateString()}
                              </span>
                              <span className="text-sm text-gray-500">
                                <MapPin className="h-3 w-3 inline mr-1" />
                                {project.event_location}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={
                              project.status === 'completed' ? 'default' :
                              project.status === 'pre_event' ? 'secondary' :
                              project.status === 'event_week' ? 'destructive' :
                              'outline'
                            }>
                              {project.status.replace('_', ' ')}
                            </Badge>
                            {project.speaker_fee && (
                              <span className="text-sm font-medium text-green-600">
                                <DollarSign className="h-3 w-3 inline" />
                                {Number(project.speaker_fee).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {assignedProjects.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href="/speakers/dashboard/events">
                        <Button variant="ghost" size="sm">
                          View All {assignedProjects.length} Projects
                          <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </SpeakerDashboardLayout>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User,
  Mail,
  Globe,
  Camera,
  DollarSign,
  Award,
  FileText,
  Settings,
  Save,
  Loader2,
  Plus,
  X,
  MapPin,
  Phone,
  AlertTriangle,
  Utensils,
  CreditCard,
  LogOut,
  Video,
  MessageSquare,
  Calendar,
  Building,
  Edit2,
  Trash2,
  ExternalLink
} from "lucide-react"

interface Video {
  id: string
  title: string
  url: string
  thumbnail?: string
  source?: string
  duration?: string
}

interface Testimonial {
  quote: string
  author: string
  position?: string
  company?: string
  event?: string
}

interface Speaker {
  id: number
  email: string
  name: string
  bio?: string
  short_bio?: string
  one_liner?: string
  headshot_url?: string
  website?: string
  location?: string
  programs?: string[]
  topics?: string[]
  industries?: string[]
  videos?: Video[]
  testimonials?: Testimonial[]
  speaking_fee_range?: string
  travel_preferences?: string
  technical_requirements?: string
  dietary_restrictions?: string
  active: boolean
}

export default function SpeakerHub() {
  const router = useRouter()
  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [newTopic, setNewTopic] = useState("")
  const [bookings, setBookings] = useState<any>(null)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    short_bio: "",
    one_liner: "",
    headshot_url: "",
    website: "",
    location: "",
    programs: [] as string[],
    topics: [] as string[],
    industries: [] as string[],
    videos: [] as Video[],
    testimonials: [] as Testimonial[],
    speaking_fee_range: "",
    travel_preferences: "",
    technical_requirements: "",
    dietary_restrictions: "",
  })

  const [newIndustry, setNewIndustry] = useState("")
  const [newProgram, setNewProgram] = useState("")
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [newVideo, setNewVideo] = useState<Video>({ id: "", title: "", url: "" })
  const [newTestimonial, setNewTestimonial] = useState<Testimonial>({ quote: "", author: "" })

  useEffect(() => {
    const fetchSpeakerData = async () => {
      try {
        const sessionToken = localStorage.getItem("speakerSessionToken")
        const isLoggedIn = localStorage.getItem("speakerLoggedIn")
        
        if (!sessionToken || !isLoggedIn) {
          router.push("/portal/speaker")
          return
        }

        const response = await fetch("/api/speakers/me", {
          headers: {
            "Authorization": `Bearer ${sessionToken}`,
            "Content-Type": "application/json"
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Session expired, redirect to login
            localStorage.removeItem("speakerLoggedIn")
            localStorage.removeItem("speakerSessionToken")
            localStorage.removeItem("speakerUser")
            router.push("/portal/speaker")
            return
          }
          throw new Error("Failed to fetch speaker data")
        }

        const data = await response.json()
        const speakerData = data.speaker

        setSpeaker(speakerData)
        setFormData({
          name: speakerData.name || "",
          bio: speakerData.bio || "",
          short_bio: speakerData.short_bio || "",
          one_liner: speakerData.one_liner || "",
          headshot_url: speakerData.headshot_url || "",
          website: speakerData.website || "",
          location: speakerData.location || "",
          programs: speakerData.programs || [],
          topics: speakerData.topics || [],
          industries: speakerData.industries || [],
          videos: speakerData.videos || [],
          testimonials: speakerData.testimonials || [],
          speaking_fee_range: speakerData.speaking_fee_range || "",
          travel_preferences: speakerData.travel_preferences || "",
          technical_requirements: speakerData.technical_requirements || "",
          dietary_restrictions: speakerData.dietary_restrictions || "",
        })
      } catch (error) {
        console.error("Error fetching speaker data:", error)
        setError("Failed to load speaker profile. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSpeakerData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("speakerLoggedIn")
    localStorage.removeItem("speakerSessionToken")
    localStorage.removeItem("speakerUser")
    router.push("/portal")
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const sessionToken = localStorage.getItem("speakerSessionToken")
      
      if (!sessionToken) {
        setError("Session expired. Please log in again.")
        return
      }

      const response = await fetch("/api/speakers/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("speakerLoggedIn")
          localStorage.removeItem("speakerSessionToken")
          localStorage.removeItem("speakerUser")
          router.push("/portal/speaker")
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save changes")
      }

      const data = await response.json()
      setSpeaker(data.speaker)
      setSuccess("Profile updated successfully!")
      
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Save error:", error)
      setError(error instanceof Error ? error.message : "Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const addTopic = () => {
    if (newTopic.trim() && !formData.topics.includes(newTopic.trim())) {
      setFormData({
        ...formData,
        topics: [...formData.topics, newTopic.trim()]
      })
      setNewTopic("")
    }
  }

  const removeTopic = (topicToRemove: string) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter(topic => topic !== topicToRemove)
    })
  }

  // Program management
  const addProgram = () => {
    if (newProgram.trim() && !formData.programs.includes(newProgram.trim())) {
      setFormData({
        ...formData,
        programs: [...formData.programs, newProgram.trim()]
      })
      setNewProgram("")
    }
  }

  const removeProgram = (programToRemove: string) => {
    setFormData({
      ...formData,
      programs: formData.programs.filter(program => program !== programToRemove)
    })
  }

  // Industry management
  const addIndustry = () => {
    if (newIndustry.trim() && !formData.industries.includes(newIndustry.trim())) {
      setFormData({
        ...formData,
        industries: [...formData.industries, newIndustry.trim()]
      })
      setNewIndustry("")
    }
  }

  const removeIndustry = (industryToRemove: string) => {
    setFormData({
      ...formData,
      industries: formData.industries.filter(industry => industry !== industryToRemove)
    })
  }

  // Video management
  const addVideo = () => {
    if (newVideo.title.trim() && newVideo.url.trim()) {
      const videoToAdd = {
        ...newVideo,
        id: newVideo.id || `video_${Date.now()}`
      }
      setFormData({
        ...formData,
        videos: [...formData.videos, videoToAdd]
      })
      setNewVideo({ id: "", title: "", url: "" })
    }
  }

  const removeVideo = (videoId: string) => {
    setFormData({
      ...formData,
      videos: formData.videos.filter(video => video.id !== videoId)
    })
  }

  const updateVideo = (videoId: string, updatedVideo: Video) => {
    setFormData({
      ...formData,
      videos: formData.videos.map(video => 
        video.id === videoId ? updatedVideo : video
      )
    })
    setEditingVideo(null)
  }

  // Testimonial management
  const addTestimonial = () => {
    if (newTestimonial.quote.trim() && newTestimonial.author.trim()) {
      setFormData({
        ...formData,
        testimonials: [...formData.testimonials, newTestimonial]
      })
      setNewTestimonial({ quote: "", author: "" })
    }
  }

  const removeTestimonial = (testimonialIndex: number) => {
    setFormData({
      ...formData,
      testimonials: formData.testimonials.filter((_, index) => index !== testimonialIndex)
    })
  }

  const updateTestimonial = (testimonialIndex: number, updatedTestimonial: Testimonial) => {
    setFormData({
      ...formData,
      testimonials: formData.testimonials.map((testimonial, index) => 
        index === testimonialIndex ? updatedTestimonial : testimonial
      )
    })
    setEditingTestimonial(null)
  }

  const fetchBookings = async () => {
    setBookingsLoading(true)
    try {
      const sessionToken = localStorage.getItem("speakerSessionToken")
      
      if (!sessionToken) {
        return
      }

      const response = await fetch("/api/speakers/me/bookings", {
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data.data)
      } else {
        console.error("Failed to fetch bookings")
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setBookingsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading speaker profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Speaker Hub</h1>
            <p className="mt-2 text-gray-600">Manage your speaker profile and information</p>
          </div>
          <div className="flex gap-2 mt-4 lg:mt-0">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
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

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {bookings ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-blue-600">{bookings.summary.totalUpcoming}</div>
                      <div className="text-sm text-gray-600">Upcoming Events</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-green-600">{bookings.summary.totalOpportunities}</div>
                      <div className="text-sm text-gray-600">Opportunities</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-gray-600">{bookings.summary.totalPast}</div>
                      <div className="text-sm text-gray-600">Past Events</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Events */}
                {bookings.bookings.upcoming.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Upcoming Events
                      </CardTitle>
                      <CardDescription>Your confirmed speaking engagements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {bookings.bookings.upcoming.map((event: any) => (
                          <div key={`${event.type}-${event.id}`} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                <p className="text-gray-600">{event.client} • {event.company}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={event.classification === 'virtual' ? 'secondary' : event.classification === 'travel' ? 'destructive' : 'default'}>
                                  {event.classification || event.eventType}
                                </Badge>
                                <p className="text-sm text-gray-500 mt-1">{event.status}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <strong>Date:</strong> {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBD'}
                              </div>
                              <div>
                                <strong>Location:</strong> {event.location || 'TBD'}
                              </div>
                              <div>
                                <strong>Attendees:</strong> {event.attendeeCount || 'TBD'}
                              </div>
                            </div>
                            {event.fee && (
                              <div className="mt-2 text-sm">
                                <strong>Speaker Fee:</strong> ${event.fee.toLocaleString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Opportunities */}
                {bookings.bookings.opportunities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Opportunities
                      </CardTitle>
                      <CardDescription>Potential speaking engagements in progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {bookings.bookings.opportunities.map((opportunity: any) => (
                          <div key={`${opportunity.type}-${opportunity.id}`} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                                <p className="text-gray-600">{opportunity.client} • {opportunity.company}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={
                                  opportunity.status === 'won' ? 'default' : 
                                  opportunity.status === 'negotiation' ? 'secondary' : 
                                  'outline'
                                }>
                                  {opportunity.status}
                                </Badge>
                                <p className="text-sm text-gray-500 mt-1">Deal</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <strong>Date:</strong> {opportunity.eventDate ? new Date(opportunity.eventDate).toLocaleDateString() : 'TBD'}
                              </div>
                              <div>
                                <strong>Location:</strong> {opportunity.location || 'TBD'}
                              </div>
                              <div>
                                <strong>Budget:</strong> {opportunity.budgetRange || 'TBD'}
                              </div>
                            </div>
                            {opportunity.estimatedFee && (
                              <div className="mt-2 text-sm">
                                <strong>Estimated Value:</strong> ${opportunity.estimatedFee.toLocaleString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Past Events */}
                {bookings.bookings.past.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Past Events
                      </CardTitle>
                      <CardDescription>Your completed speaking engagements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {bookings.bookings.past.slice(0, 5).map((event: any) => (
                          <div key={`${event.type}-${event.id}`} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">{event.title}</h3>
                                <p className="text-gray-600 text-sm">{event.client} • {event.company}</p>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date TBD'}
                              </div>
                            </div>
                          </div>
                        ))}
                        {bookings.bookings.past.length > 5 && (
                          <p className="text-center text-gray-500 text-sm">
                            And {bookings.bookings.past.length - 5} more past events...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State */}
                {bookings.summary.totalUpcoming === 0 && bookings.summary.totalOpportunities === 0 && bookings.summary.totalPast === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Yet</h3>
                      <p className="text-gray-600 mb-4">
                        You haven't been assigned to any speaking events yet. Make sure your profile is complete to attract opportunities!
                      </p>
                      <Button onClick={() => window.location.href = '#profile'} variant="outline">
                        Complete Your Profile
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  {bookingsLoading ? (
                    <div>
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600">Loading your events...</p>
                    </div>
                  ) : (
                    <div>
                      <Button onClick={fetchBookings}>
                        Load My Events
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your core speaker profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={speaker?.email || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="one_liner">One-Liner (Tagline)</Label>
                  <Input
                    id="one_liner"
                    placeholder="Your memorable tagline"
                    value={formData.one_liner}
                    onChange={(e) => setFormData({ ...formData, one_liner: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://your-website.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="San Francisco, CA"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="programs">Signature Programs/Presentations</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="programs"
                      placeholder="AI Leadership Masterclass"
                      value={newProgram}
                      onChange={(e) => setNewProgram(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProgram())}
                    />
                    <Button onClick={addProgram} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.programs.map((program, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {program}
                        <button
                          onClick={() => removeProgram(program)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headshot_url">Headshot URL</Label>
                  <div className="flex gap-4 items-start">
                    <Input
                      id="headshot_url"
                      type="url"
                      placeholder="https://example.com/your-headshot.jpg"
                      value={formData.headshot_url}
                      onChange={(e) => setFormData({ ...formData, headshot_url: e.target.value })}
                      className="flex-1"
                    />
                    {formData.headshot_url && (
                      <img 
                        src={formData.headshot_url} 
                        alt="Headshot preview" 
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biography Section */}
            <Card>
              <CardHeader>
                <CardTitle>Biography</CardTitle>
                <CardDescription>Your speaker biography for event promotions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="short_bio">Short Bio (50-100 words)</Label>
                  <Textarea
                    id="short_bio"
                    placeholder="A brief bio for event listings and quick introductions"
                    value={formData.short_bio}
                    onChange={(e) => setFormData({ ...formData, short_bio: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Full Biography</Label>
                  <Textarea
                    id="bio"
                    placeholder="Your complete speaker biography"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Speaking Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Speaking Topics</CardTitle>
                <CardDescription>Topics you speak about</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a topic"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                  />
                  <Button onClick={addTopic} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {topic}
                      <button
                        onClick={() => removeTopic(topic)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Industries */}
            <Card>
              <CardHeader>
                <CardTitle>Industries</CardTitle>
                <CardDescription>Industries you serve and understand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an industry"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())}
                  />
                  <Button onClick={addIndustry} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.industries.map((industry, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {industry}
                      <button
                        onClick={() => removeIndustry(industry)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Speaking Videos */}
            <Card>
              <CardHeader>
                <CardTitle>Speaking Videos</CardTitle>
                <CardDescription>Your speaking videos for event organizers to review</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new video form */}
                <div className="p-4 border border-dashed border-gray-300 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Video
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="video_title">Video Title</Label>
                        <Input
                          id="video_title"
                          placeholder="Keynote at AI Summit 2024"
                          value={newVideo.title}
                          onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="video_url">Video URL</Label>
                        <Input
                          id="video_url"
                          placeholder="https://youtube.com/watch?v=..."
                          value={newVideo.url}
                          onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="video_source">Source</Label>
                        <Input
                          id="video_source"
                          placeholder="YouTube"
                          value={newVideo.source || ""}
                          onChange={(e) => setNewVideo({ ...newVideo, source: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="video_duration">Duration</Label>
                        <Input
                          id="video_duration"
                          placeholder="18:14"
                          value={newVideo.duration || ""}
                          onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="video_thumbnail">Thumbnail URL</Label>
                        <Input
                          id="video_thumbnail"
                          placeholder="https://..."
                          value={newVideo.thumbnail || ""}
                          onChange={(e) => setNewVideo({ ...newVideo, thumbnail: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={addVideo} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Video
                    </Button>
                  </div>
                </div>

                {/* Existing videos list */}
                <div className="space-y-4">
                  {formData.videos.map((video, index) => (
                    <Card key={video.id || index} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{video.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              {video.source || 'Video'}
                            </span>
                            {video.duration && (
                              <span>{video.duration}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(video.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingVideo(video)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeVideo(video.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {video.thumbnail && (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full max-w-sm h-auto rounded-lg mt-2"
                        />
                      )}
                    </Card>
                  ))}
                  
                  {formData.videos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No videos added yet. Add your first speaking video above!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle>Client Testimonials</CardTitle>
                <CardDescription>Testimonials from past speaking engagements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new testimonial form */}
                <div className="p-4 border border-dashed border-gray-300 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Testimonial
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="testimonial_quote">Quote</Label>
                      <Textarea
                        id="testimonial_quote"
                        placeholder="The speaker delivered an outstanding presentation that truly inspired our team..."
                        value={newTestimonial.quote}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="testimonial_author">Author</Label>
                        <Input
                          id="testimonial_author"
                          placeholder="Jane Smith"
                          value={newTestimonial.author}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, author: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="testimonial_position">Position</Label>
                        <Input
                          id="testimonial_position"
                          placeholder="CEO"
                          value={newTestimonial.position || ""}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, position: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="testimonial_company">Company</Label>
                        <Input
                          id="testimonial_company"
                          placeholder="Tech Innovations Inc."
                          value={newTestimonial.company || ""}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, company: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="testimonial_event">Event</Label>
                        <Input
                          id="testimonial_event"
                          placeholder="AI Leadership Summit 2024"
                          value={newTestimonial.event || ""}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, event: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={addTestimonial} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Testimonial
                    </Button>
                  </div>
                </div>

                {/* Existing testimonials list */}
                <div className="space-y-4">
                  {formData.testimonials.map((testimonial, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <blockquote className="text-lg italic text-gray-700 mb-3">
                            "{testimonial.quote}"
                          </blockquote>
                          <div className="text-sm text-gray-600">
                            <div className="font-semibold">{testimonial.author}</div>
                            {testimonial.position && <div>{testimonial.position}</div>}
                            {testimonial.company && <div>{testimonial.company}</div>}
                            {testimonial.event && <div className="italic">{testimonial.event}</div>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTestimonial(testimonial)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTestimonial(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {formData.testimonials.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No testimonials added yet. Add your first testimonial above!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="logistics" className="space-y-6">
            {/* Speaking Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Speaking Fees</CardTitle>
                <CardDescription>Your speaking fee information for event organizers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="speaking_fee_range">Speaking Fee Range</Label>
                  <Input
                    id="speaking_fee_range"
                    placeholder="$5,000 - $15,000"
                    value={formData.speaking_fee_range}
                    onChange={(e) => setFormData({ ...formData, speaking_fee_range: e.target.value })}
                  />
                  <p className="text-sm text-gray-500">
                    This helps event organizers understand your fee structure
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Travel & Technical Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Travel & Technical Requirements</CardTitle>
                <CardDescription>Your standard requirements for speaking engagements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="travel_preferences">Travel Preferences</Label>
                  <Textarea
                    id="travel_preferences"
                    placeholder="Business class for flights over 3 hours, specific airline preferences, etc."
                    value={formData.travel_preferences}
                    onChange={(e) => setFormData({ ...formData, travel_preferences: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technical_requirements">AV & Technical Requirements</Label>
                  <Textarea
                    id="technical_requirements"
                    placeholder="HDMI connection, wireless microphone, specific stage setup, lighting preferences, etc."
                    value={formData.technical_requirements}
                    onChange={(e) => setFormData({ ...formData, technical_requirements: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                  <Input
                    id="dietary_restrictions"
                    placeholder="Vegetarian, vegan, allergies, etc."
                    value={formData.dietary_restrictions}
                    onChange={(e) => setFormData({ ...formData, dietary_restrictions: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>


            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Banking and tax information (encrypted and secure)</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    Contact your account manager to update payment and tax information securely. All financial data is encrypted and handled according to industry standards.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
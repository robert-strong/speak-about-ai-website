"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Edit,
  Mail,
  Globe,
  MapPin,
  Star,
  Users,
  Video,
  MessageSquare,
  Calendar,
  DollarSign,
  Loader2,
  ExternalLink,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

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

interface Program {
  title: string
  format?: string
  duration?: string
  description?: string
}

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
  programs: (string | Program)[]
  topics: string[]
  industries: string[]
  videos: Video[]
  testimonials: Testimonial[]
  speaking_fee_range: string
  travel_preferences: string
  technical_requirements: string
  dietary_restrictions: string
  featured: boolean
  active: boolean
  listed: boolean
  ranking: number
  created_at: string
  updated_at: string
}

interface UpdateLog {
  id: number
  speaker_id: number
  speaker_name: string
  speaker_email: string
  field_name: string
  old_value: string
  new_value: string
  changed_by: string
  change_type: string
  metadata: any
  created_at: string
  current_speaker_name?: string
}

export default function AdminSpeakerViewPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [updates, setUpdates] = useState<UpdateLog[]>([])
  const [loadingUpdates, setLoadingUpdates] = useState(false)
  const [showAllUpdates, setShowAllUpdates] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadSpeaker()
  }, [router, params.id])

  const loadSpeaker = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/speakers/${params.id}`)

      if (response.ok) {
        const data = await response.json()
        setSpeaker(data.speaker)
        // Load update logs after speaker loads
        loadUpdates()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to load speaker",
          variant: "destructive",
        })
        router.push("/admin/speakers")
      }
    } catch (error) {
      console.error("Error loading speaker:", error)
      toast({
        title: "Error",
        description: "Failed to load speaker",
        variant: "destructive",
      })
      router.push("/admin/speakers")
    } finally {
      setLoading(false)
    }
  }

  const loadUpdates = async () => {
    try {
      setLoadingUpdates(true)
      const response = await fetch(`/api/admin/speakers/updates?speakerId=${params.id}&limit=50`)
      
      if (response.ok) {
        const data = await response.json()
        setUpdates(data.updates || [])
      } else {
        console.error("Failed to load update logs")
      }
    } catch (error) {
      console.error("Error loading update logs:", error)
    } finally {
      setLoadingUpdates(false)
    }
  }

  const formatFieldName = (field: string) => {
    return field.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatValue = (value: string, field: string) => {
    if (!value || value === '') return '<empty>'
    if (field === 'topics' || field === 'industries' || field === 'programs') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed.join(', ') || '<empty>'
        }
      } catch {
        return value
      }
    }
    if (value.length > 100) {
      return value.substring(0, 100) + '...'
    }
    return value
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading speaker...</span>
      </div>
    )
  }

  if (!speaker) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Speaker not found</h2>
          <Link href="/admin/speakers">
            <Button>Back to Speakers</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/speakers">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Speakers
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{speaker.name}</h1>
              <p className="mt-2 text-gray-600">Speaker Profile Details</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href={`/admin/speakers/${speaker.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Speaker
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={speaker.headshot_url} alt={speaker.name} />
                    <AvatarFallback className="text-2xl">
                      {speaker.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{speaker.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {speaker.featured && (
                        <Badge variant="default">
                          <Star className="mr-1 h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                      <Badge variant={speaker.active ? "default" : "secondary"}>
                        {speaker.active ? "Active" : "Inactive"}
                      </Badge>
                      {speaker.listed && (
                        <Badge variant="outline">Listed</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a href={`mailto:${speaker.email}`} className="text-blue-600 hover:underline">
                      {speaker.email}
                    </a>
                  </div>
                  {speaker.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a href={speaker.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        {speaker.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {speaker.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{speaker.location}</span>
                    </div>
                  )}
                  {speaker.speaking_fee_range && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>{speaker.speaking_fee_range}</span>
                    </div>
                  )}
                </div>

                {speaker.ranking && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ranking</p>
                    <p className="text-lg font-semibold">{speaker.ranking}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Created</p>
                  <p className="text-sm">{new Date(speaker.created_at).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Last Updated</p>
                  <p className="text-sm">{new Date(speaker.updated_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* One Liner */}
            {speaker.one_liner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">One Liner</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg italic text-gray-700">"{speaker.one_liner}"</p>
                </CardContent>
              </Card>
            )}

            {/* Short Bio */}
            {speaker.short_bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Short Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{speaker.short_bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Full Bio */}
            {speaker.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Full Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{speaker.bio}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Topics & Industries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Topics */}
              {speaker.topics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Speaking Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {speaker.topics.map((topic, index) => (
                        <Badge key={index} variant="outline">{topic}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Industries */}
              {speaker.industries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Industries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {speaker.industries.map((industry, index) => (
                        <Badge key={index} variant="secondary">{industry}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Programs */}
            {speaker.programs && speaker.programs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {speaker.programs.map((program, index) => (
                      <Badge key={index} variant="outline">{typeof program === 'string' ? program : program.title}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Videos */}
            {speaker.videos && speaker.videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Videos ({speaker.videos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {speaker.videos.map((video, index) => (
                      <div key={video.id || index} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{video.title}</h4>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                        >
                          Watch Video
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {video.duration && (
                          <p className="text-xs text-gray-500 mt-1">Duration: {video.duration}</p>
                        )}
                        {video.source && (
                          <p className="text-xs text-gray-500">Source: {video.source}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Testimonials */}
            {speaker.testimonials && speaker.testimonials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Testimonials ({speaker.testimonials.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {speaker.testimonials.map((testimonial, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <blockquote className="text-gray-700 italic mb-3">
                          "{testimonial.quote}"
                        </blockquote>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{testimonial.author}</p>
                          {testimonial.position && <p>{testimonial.position}</p>}
                          {testimonial.company && <p>{testimonial.company}</p>}
                          {testimonial.event && <p>Event: {testimonial.event}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Logistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Travel Preferences */}
              {speaker.travel_preferences && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Travel Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{speaker.travel_preferences}</p>
                  </CardContent>
                </Card>
              )}

              {/* Technical Requirements */}
              {speaker.technical_requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Technical Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{speaker.technical_requirements}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Dietary Restrictions */}
            {speaker.dietary_restrictions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dietary Restrictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{speaker.dietary_restrictions}</p>
                </CardContent>
              </Card>
            )}

            {/* Update Log Section */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">Profile Update History</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {updates.length > 0 && (
                      <Badge variant="secondary">{updates.length} changes</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadUpdates}
                      disabled={loadingUpdates}
                    >
                      {loadingUpdates ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Track all changes made to this speaker's profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUpdates ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading update history...</span>
                  </div>
                ) : updates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No profile updates recorded yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show limited updates or all based on toggle */}
                    {(showAllUpdates ? updates : updates.slice(0, 10)).map((update) => (
                      <div
                        key={update.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {formatFieldName(update.field_name)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(update.created_at)}
                              </span>
                              {update.changed_by && update.changed_by !== 'self' && (
                                <span className="text-xs text-gray-500">
                                  by {update.changed_by}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">Previous Value:</p>
                                <p className="text-sm text-gray-800 bg-red-50 p-2 rounded border border-red-200">
                                  {formatValue(update.old_value, update.field_name)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">New Value:</p>
                                <p className="text-sm text-gray-800 bg-green-50 p-2 rounded border border-green-200">
                                  {formatValue(update.new_value, update.field_name)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show more/less toggle */}
                    {updates.length > 10 && (
                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAllUpdates(!showAllUpdates)}
                          className="gap-2"
                        >
                          {showAllUpdates ? (
                            <>
                              Show Less
                              <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Show All {updates.length} Updates
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    )}
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
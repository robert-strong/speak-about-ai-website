"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MapPin, Globe, Mail, Phone, Calendar, Clock, ArrowLeft,
  ExternalLink, Users, Building2, CheckCircle, AlertCircle,
  FileText, Award, TrendingUp, Linkedin, Image as ImageIcon
} from "lucide-react"
import { format, parseISO } from "date-fns"

interface ConferenceImage {
  url: string
  caption?: string
  year?: number
  order: number
  featured?: boolean
}

interface Conference {
  id: number
  name: string
  slug: string
  category?: {
    name: string
    slug: string
    icon?: string
  }
  organization?: string
  website_url?: string
  description?: string
  start_date?: string
  end_date?: string
  date_display?: string
  location?: string
  city?: string
  state?: string
  country?: string
  venue?: string
  is_recurring: boolean
  recurring_frequency?: string
  cfp_open: boolean
  cfp_link?: string
  cfp_deadline?: string
  cfp_deadline_display?: string
  speaker_benefits?: string
  cfp_notes?: string
  contact_name?: string
  contact_role?: string
  contact_email?: string
  contact_phone?: string
  contact_linkedin?: string
  status: string
  priority: string
  estimated_attendees?: number
  typical_speaker_count?: number
  logo_url?: string
  banner_url?: string
  images?: ConferenceImage[]
  tags?: string[]
  topics?: string[]
  target_audience?: string
  event_format?: string
  notes?: string
  featured: boolean
  verified: boolean
  created_at: string
  updated_at: string
}

export default function ConferenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConference()
  }, [params.slug])

  const fetchConference = async () => {
    try {
      const response = await fetch(`/api/conferences/slug/${params.slug}`)
      if (response.ok) {
        const data = await response.json()
        setConference(data.conference)
      } else {
        router.push("/conference-directory/conferences")
      }
    } catch (error) {
      console.error("Error fetching conference:", error)
      router.push("/conference-directory/conferences")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr?: string, displayStr?: string) => {
    if (displayStr) return displayStr
    if (!dateStr) return "TBA"
    try {
      return format(parseISO(dateStr), "MMMM d, yyyy")
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conference details...</p>
        </div>
      </div>
    )
  }

  if (!conference) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Conference not found</p>
          <Button onClick={() => router.push("/conference-directory/conferences")}>
            Back to Directory
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {conference.banner_url && (
        <div
          className="h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${conference.banner_url})` }}
        />
      )}

      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/conference-directory/conferences")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>

          <div className="flex flex-col md:flex-row items-start gap-8">
            {conference.logo_url ? (
              <img
                src={conference.logo_url}
                alt={conference.name}
                className="max-h-32 max-w-xs object-contain border-4 border-gray-100 rounded-lg bg-white p-2"
              />
            ) : (
              <div className="h-32 w-32 border-4 border-gray-100 rounded-lg bg-gray-100 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-gray-400" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {conference.name}
                    </h1>
                    {conference.verified && (
                      <CheckCircle className="h-6 w-6 text-blue-500" />
                    )}
                  </div>

                  {conference.organization && (
                    <p className="text-lg text-gray-600 flex items-center gap-2 mb-4">
                      <Building2 className="h-5 w-5" />
                      {conference.organization}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                    {(conference.start_date || conference.date_display) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(conference.start_date, conference.date_display)}
                      </span>
                    )}
                    {conference.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {conference.location}
                      </span>
                    )}
                    {conference.event_format && (
                      <Badge variant="outline">{conference.event_format}</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {conference.category && (
                      <Badge variant="secondary">
                        {conference.category.icon && <span className="mr-1">{conference.category.icon}</span>}
                        {conference.category.name}
                      </Badge>
                    )}
                    {conference.featured && (
                      <Badge className="bg-yellow-500 text-white">Featured</Badge>
                    )}
                    {conference.is_recurring && conference.recurring_frequency && (
                      <Badge variant="outline">🔁 {conference.recurring_frequency}</Badge>
                    )}
                  </div>
                </div>

                {conference.website_url && (
                  <div className="mt-4">
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.open(conference.website_url, '_blank')}
                    >
                      <Globe className="h-5 w-5 mr-2" />
                      Visit Official Website
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {conference.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About the Conference</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{conference.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Event Photos Gallery */}
            {conference.images && conference.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Event Photos from Previous Years
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {conference.images
                      .sort((a, b) => a.order - b.order)
                      .map((image, index) => (
                        <div
                          key={index}
                          className="relative group overflow-hidden rounded-lg bg-gray-100 aspect-video"
                        >
                          <img
                            src={image.url}
                            alt={image.caption || `Conference photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {(image.caption || image.year) && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                              {image.caption && (
                                <p className="text-white text-sm font-medium mb-1">
                                  {image.caption}
                                </p>
                              )}
                              {image.year && (
                                <p className="text-white/80 text-xs">
                                  {image.year}
                                </p>
                              )}
                            </div>
                          )}
                          {image.featured && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-yellow-500 text-white text-xs">
                                Featured
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                  {conference.images.length > 4 && (
                    <p className="text-sm text-gray-500 mt-4 text-center">
                      Showing {Math.min(4, conference.images.length)} of {conference.images.length} photos
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Topics */}
            {conference.topics && conference.topics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Topics & Themes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {conference.topics.map((topic, idx) => (
                      <Badge key={idx} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {conference.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{conference.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {conference.venue && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">Venue</p>
                      <p className="text-sm text-gray-600">{conference.venue}</p>
                      {conference.city && conference.country && (
                        <p className="text-xs text-gray-500">{conference.city}, {conference.country}</p>
                      )}
                    </div>
                  </div>
                )}

                {conference.estimated_attendees && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">Expected Attendance</p>
                      <p className="text-sm text-gray-600">
                        ~{conference.estimated_attendees.toLocaleString()} attendees
                      </p>
                    </div>
                  </div>
                )}

                {conference.typical_speaker_count && (
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">Typical Speakers</p>
                      <p className="text-sm text-gray-600">~{conference.typical_speaker_count} speakers</p>
                    </div>
                  </div>
                )}

                {conference.target_audience && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">Target Audience</p>
                      <p className="text-sm text-gray-600">{conference.target_audience}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            {(conference.contact_name || conference.contact_email || conference.website_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conference.contact_name && (
                    <div>
                      <p className="font-medium text-sm text-gray-900">{conference.contact_name}</p>
                      {conference.contact_role && (
                        <p className="text-xs text-gray-600">{conference.contact_role}</p>
                      )}
                    </div>
                  )}

                  <Separator />

                  {conference.contact_email && (
                    <a
                      href={`mailto:${conference.contact_email}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="h-4 w-4" />
                      {conference.contact_email}
                    </a>
                  )}

                  {conference.contact_phone && (
                    <a
                      href={`tel:${conference.contact_phone}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="h-4 w-4" />
                      {conference.contact_phone}
                    </a>
                  )}

                  {conference.contact_linkedin && (
                    <a
                      href={conference.contact_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}

                  {conference.website_url && (
                    <>
                      <Separator />
                      <a
                        href={conference.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Globe className="h-4 w-4" />
                        Conference Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {conference.tags && conference.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {conference.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Search, MapPin, Calendar, ChevronLeft, ExternalLink,
  CheckCircle, Clock, Users, Building2, ChevronRight
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format, parseISO } from "date-fns"

export interface ConferenceSummary {
  id: number
  name: string
  slug: string
  category?: {
    name: string
    slug: string
    icon?: string
  }
  logo_url?: string
  description?: string
  organization?: string
  location?: string
  city?: string
  country?: string
  venue?: string
  start_date?: string
  end_date?: string
  date_display?: string
  cfp_open: boolean
  cfp_link?: string
  cfp_deadline?: string
  cfp_deadline_display?: string
  featured: boolean
  verified: boolean
  is_recurring: boolean
  recurring_frequency?: string
  status: string
  website_url?: string
  estimated_attendees?: number
}

export interface ConferenceCategorySummary {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
}

interface Props {
  initialConferences: ConferenceSummary[]
  initialCategories: ConferenceCategorySummary[]
}

// The server page (./page.tsx) renders the full published list into the HTML
// so crawlers and first paint see real content; this component only refetches
// when the visitor changes a filter.
export default function ConferenceListClient({ initialConferences, initialCategories }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [conferences, setConferences] = useState<ConferenceSummary[]>(initialConferences)
  const [categories] = useState<ConferenceCategorySummary[]>(initialCategories)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationSearch, setLocationSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [subscriber, setSubscriber] = useState<any>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Optional greeting for visitors who signed up on /conference-directory
    const subscriberData = sessionStorage.getItem("conferenceSubscriber")
    if (subscriberData) {
      try {
        setSubscriber(JSON.parse(subscriberData))
      } catch (e) {
        console.error("Error parsing subscriber data:", e)
      }
    }
  }, [])

  // Refetch only when a filter changes; the initial list came from the server.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const debounce = setTimeout(() => {
      loadConferences()
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm, locationSearch, selectedCategory])

  const loadConferences = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (searchTerm.trim()) params.append("search", searchTerm.trim())
      if (locationSearch.trim()) params.append("location", locationSearch.trim())

      const response = await fetch(`/api/conferences?${params}`)
      const data = await response.json()

      if (response.ok) {
        setConferences(data.conferences || [])
      } else {
        console.error("Failed to load conferences:", data)
        toast({
          title: "Error",
          description: data.error || "Failed to load conferences",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading conferences:", error)
      toast({
        title: "Error",
        description: "Failed to load conferences. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const sortedConferences = [...conferences].sort((a, b) => {
    switch (sortBy) {
      case "date":
        if (!a.start_date && !b.start_date) return 0
        if (!a.start_date) return 1
        if (!b.start_date) return -1
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    }
  })

  const formatDate = (dateStr?: string, displayStr?: string) => {
    if (displayStr) return displayStr
    if (!dateStr) return "TBA"
    try {
      return format(parseISO(dateStr), "MMM d, yyyy")
    } catch {
      return dateStr
    }
  }

  const formatLocation = (conference: ConferenceSummary) => {
    const parts = []

    // Add venue if available
    if (conference.venue) {
      parts.push(conference.venue)
    }

    // Add city and country
    if (conference.city && conference.country) {
      parts.push(`${conference.city}, ${conference.country}`)
    } else if (conference.city) {
      parts.push(conference.city)
    } else if (conference.country) {
      parts.push(conference.country)
    } else if (conference.location && !conference.venue) {
      // Fallback to generic location if no specific fields
      parts.push(conference.location)
    }

    return parts.length > 0 ? parts.join(' • ') : null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/conference-directory")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Conference Directory</h1>
                <p className="text-sm text-gray-600">
                  {subscriber?.name && `Welcome back, ${subscriber.name}`}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {conferences.length} Conferences
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search conferences by name, organization, or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative md:w-[200px]">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Location..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading conferences...</p>
          </div>
        ) : sortedConferences.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No conferences found matching your criteria</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm("")
                  setLocationSearch("")
                  setSelectedCategory("all")
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedConferences.map((conference) => (
              <Card
                key={conference.id}
                className="hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden"
                onClick={() => {
                  router.push(`/conference-directory/conferences/${conference.slug || conference.id}`)
                }}
              >
                {conference.featured && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-yellow-500 text-white">Featured</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start space-x-4">
                    {conference.logo_url ? (
                      <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center flex-shrink-0">
                        <img
                          src={conference.logo_url}
                          alt={conference.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2 mb-1">
                        <span className="truncate">{conference.name}</span>
                        {conference.verified && (
                          <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </CardTitle>
                      {conference.organization && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {conference.organization}
                        </p>
                      )}
                      {conference.category && (
                        <Badge variant="secondary" className="mt-2">
                          {conference.category.icon && <span className="mr-1">{conference.category.icon}</span>}
                          {conference.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Description */}
                  {conference.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {conference.description}
                    </p>
                  )}

                  {/* Date & Location */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {(conference.start_date || conference.date_display) && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(conference.start_date, conference.date_display)}
                      </div>
                    )}
                    {formatLocation(conference) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatLocation(conference)}
                      </div>
                    )}
                  </div>

                  {/* CFP Info */}
                  {conference.cfp_open && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Call for Proposals Open
                        </div>
                        {conference.cfp_deadline_display && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Due: {conference.cfp_deadline_display}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
                    {conference.is_recurring && conference.recurring_frequency && (
                      <span>🔁 {conference.recurring_frequency}</span>
                    )}
                    {conference.estimated_attendees && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {conference.estimated_attendees.toLocaleString()} attendees
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 space-y-2">
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                      <Link
                        href={`/conference-directory/conferences/${conference.slug}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View More Info
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    {conference.website_url && (
                      <a
                        href={conference.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Event Website
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

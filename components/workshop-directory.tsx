"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Clock, Users, ChevronRight, Loader2, MapPin, Filter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Workshop {
  id: number
  title: string
  slug: string
  speaker_id: number | null
  speaker_name?: string
  speaker_slug?: string
  speaker_headshot?: string
  speaker_location?: string
  short_description: string | null
  duration_minutes: number | null
  format: string | null
  target_audience: string | null
  price_range: string | null
  topics: string[] | null
  thumbnail_url: string | null
  thumbnail_position: string | null
  featured: boolean
  active: boolean
}

interface WorkshopDirectoryContent {
  hero: {
    title: string
    subtitle: string
  }
  filters: {
    search_placeholder: string
    show_filters: string
    hide_filters: string
    format_label: string
    all_formats: string
    length_label: string
    all_lengths: string
    short_length: string
    medium_length: string
    long_length: string
    location_label: string
    all_locations: string
    audience_label: string
    all_audiences: string
    showing_text: string
    clear_filters: string
  }
  results: {
    loading_text: string
    no_results: string
  }
  buttons: {
    inquire: string
    view_details: string
  }
}

interface WorkshopDirectoryProps {
  content?: WorkshopDirectoryContent
}

const DEFAULT_CONTENT: WorkshopDirectoryContent = {
  hero: {
    title: 'AI Workshops',
    subtitle: 'Discover hands-on AI workshops led by industry experts. Interactive training programs covering machine learning, generative AI, and practical implementation strategies for your team.',
  },
  filters: {
    search_placeholder: 'Search workshops by name, topic, or instructor...',
    show_filters: 'Show Filters',
    hide_filters: 'Hide Filters',
    format_label: 'Format',
    all_formats: 'All Formats',
    length_label: 'Length',
    all_lengths: 'All Lengths',
    short_length: 'Short (< 1 hour)',
    medium_length: 'Medium (1-2 hours)',
    long_length: 'Long (> 2 hours)',
    location_label: 'Instructor Location',
    all_locations: 'All Locations',
    audience_label: 'Target Audience',
    all_audiences: 'All Audiences',
    showing_text: 'Showing {displayed} of {total} workshops',
    clear_filters: 'Clear All Filters',
  },
  results: {
    loading_text: 'Loading workshops...',
    no_results: 'No workshops found matching your criteria.',
  },
  buttons: {
    inquire: 'Inquire About Workshop',
    view_details: 'View Details',
  },
}

export default function WorkshopDirectory({ content = DEFAULT_CONTENT }: WorkshopDirectoryProps) {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [filteredWorkshops, setFilteredWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFormat, setSelectedFormat] = useState<string>("all")
  const [selectedDuration, setSelectedDuration] = useState<string>("all")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedAudience, setSelectedAudience] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const loadWorkshops = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/workshops")
      if (response.ok) {
        const data = await response.json()
        // Handle both response formats: { workshops: [...] } or direct array
        // Ensure we always get an array
        let workshopsData = data.workshops || data || []
        if (!Array.isArray(workshopsData)) {
          console.error("Workshops data is not an array:", workshopsData)
          workshopsData = []
        }
        setWorkshops(workshopsData)
        setFilteredWorkshops(workshopsData)
      } else {
        setWorkshops([])
        setFilteredWorkshops([])
      }
    } catch (error) {
      console.error("Error loading workshops:", error)
      setWorkshops([])
      setFilteredWorkshops([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load workshops on mount
  useEffect(() => {
    loadWorkshops()
  }, [loadWorkshops])

  const filterWorkshops = useCallback(() => {
    // Ensure workshops is always an array
    if (!Array.isArray(workshops)) {
      setFilteredWorkshops([])
      return
    }
    let filtered = workshops

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(
        (w) =>
          w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.speaker_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.target_audience?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.topics?.some((topic) => topic.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Format filter (case-insensitive matching)
    if (selectedFormat !== "all") {
      filtered = filtered.filter((w) =>
        w.format?.toLowerCase().replace(/[-_\s]/g, '') === selectedFormat.toLowerCase().replace(/[-_\s]/g, '')
      )
    }

    // Duration filter
    if (selectedDuration !== "all") {
      filtered = filtered.filter((w) => {
        if (!w.duration_minutes) return false
        switch (selectedDuration) {
          case "short": // Under 1 hour
            return w.duration_minutes <= 60
          case "medium": // 1-2 hours
            return w.duration_minutes > 60 && w.duration_minutes <= 120
          case "long": // Over 2 hours
            return w.duration_minutes > 120
          default:
            return true
        }
      })
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter((w) =>
        w.speaker_location?.toLowerCase().includes(selectedLocation.toLowerCase())
      )
    }

    // Audience filter
    if (selectedAudience !== "all") {
      filtered = filtered.filter((w) =>
        w.target_audience?.toLowerCase().includes(selectedAudience.toLowerCase())
      )
    }

    setFilteredWorkshops(filtered)
  }, [workshops, searchQuery, selectedFormat, selectedDuration, selectedLocation, selectedAudience])

  // Filter workshops when search/format changes
  useEffect(() => {
    filterWorkshops()
  }, [filterWorkshops])

  // Fixed format options
  const formatOptions = [
    { value: "all", label: "All Formats" },
    { value: "virtual", label: "Virtual" },
    { value: "in-person", label: "In-Person" },
    { value: "hybrid", label: "Hybrid" }
  ]

  // Extract unique values for other filters (with safety checks)
  const workshopsArray = Array.isArray(workshops) ? workshops : []
  const locations = ["all", ...Array.from(new Set(workshopsArray.map((w) => w.speaker_location).filter(Boolean)))]
  const audiences = ["all", ...Array.from(new Set(workshopsArray.map((w) => w.target_audience).filter(Boolean)))]

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-[#EAEAEE] to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-neue-haas">
              {content.hero.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat">
              {content.hero.subtitle}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Search Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1E68C6] w-5 h-5" />
                  <Input
                    type="text"
                    placeholder={content.filters.search_placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 font-montserrat border-2 border-[#1E68C6]/30 shadow-lg hover:shadow-xl focus:shadow-xl focus:border-[#1E68C6] transition-all"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="font-montserrat flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? content.filters.hide_filters : content.filters.show_filters}
                </Button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  {/* Format Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block font-montserrat">
                      {content.filters.format_label}
                    </label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger className="font-montserrat">
                        <SelectValue placeholder={content.filters.all_formats} />
                      </SelectTrigger>
                      <SelectContent>
                        {formatOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Duration Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block font-montserrat">
                      {content.filters.length_label}
                    </label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger className="font-montserrat">
                        <SelectValue placeholder={content.filters.all_lengths} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{content.filters.all_lengths}</SelectItem>
                        <SelectItem value="short">{content.filters.short_length}</SelectItem>
                        <SelectItem value="medium">{content.filters.medium_length}</SelectItem>
                        <SelectItem value="long">{content.filters.long_length}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block font-montserrat">
                      {content.filters.location_label}
                    </label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="font-montserrat">
                        <SelectValue placeholder={content.filters.all_locations} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{content.filters.all_locations}</SelectItem>
                        {locations.filter(l => l !== "all").map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Audience Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block font-montserrat">
                      {content.filters.audience_label}
                    </label>
                    <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                      <SelectTrigger className="font-montserrat">
                        <SelectValue placeholder={content.filters.all_audiences} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{content.filters.all_audiences}</SelectItem>
                        {audiences.filter(a => a !== "all").map((audience) => (
                          <SelectItem key={audience} value={audience}>
                            {audience}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Results Count and Clear Filters */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 font-montserrat">
                  {content.filters.showing_text.replace('{displayed}', String(filteredWorkshops.length)).replace('{total}', String(workshops.length))}
                </div>
                {(selectedFormat !== "all" || selectedDuration !== "all" || selectedLocation !== "all" || selectedAudience !== "all" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedFormat("all")
                      setSelectedDuration("all")
                      setSelectedLocation("all")
                      setSelectedAudience("all")
                    }}
                    className="font-montserrat text-[#1E68C6] hover:text-blue-700"
                  >
                    {content.filters.clear_filters}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workshops Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E68C6]" />
              <span className="ml-2 text-gray-600 font-montserrat">{content.results.loading_text}</span>
            </div>
          ) : filteredWorkshops.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg font-montserrat">
                {content.results.no_results}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredWorkshops.map((workshop) => (
                <Card key={workshop.id} className="flex flex-col h-full overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out border-0 bg-white group transform hover:-translate-y-1.5">
                  <Link href={`/ai-workshops/${workshop.slug}`} className="block">
                    <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden rounded-t-xl">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1E68C6] z-20 group-hover:opacity-100 opacity-75 transition-opacity duration-300"></div>
                      {workshop.thumbnail_url ? (
                        <Image
                          src={workshop.thumbnail_url}
                          alt={workshop.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          style={{ objectPosition: workshop.thumbnail_position || 'center' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                          <span className="text-gray-400 text-4xl">🎓</span>
                        </div>
                      )}
                      {workshop.format && (
                        <Badge className="absolute top-3 left-3 bg-[#1E68C6] text-white font-montserrat text-xs px-3 py-1.5 rounded-md shadow-md z-10">
                          {workshop.format}
                        </Badge>
                      )}
                      {workshop.price_range && (
                        <Badge
                          variant="secondary"
                          className="absolute top-3 right-3 bg-black/75 text-white backdrop-blur-sm text-xs px-2.5 py-1.5 font-montserrat rounded-md shadow-md z-10"
                        >
                          {workshop.price_range}
                        </Badge>
                      )}
                    </div>
                  </Link>

                  <CardContent className="p-4 sm:p-5 flex flex-col flex-grow relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-b-xl -z-1"></div>
                    <div className="relative z-0">
                      <Link href={`/ai-workshops/${workshop.slug}`} className="block">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-neue-haas leading-tight mb-2 group-hover:text-[#1E68C6] transition-colors duration-300">
                          {workshop.title}
                        </h2>
                      </Link>

                      {/* Speaker info with mini headshot */}
                      {workshop.speaker_name && (
                        <Link href={workshop.speaker_slug ? `/speakers/${workshop.speaker_slug}` : '#'} className="flex items-center gap-3 mb-3 group/speaker">
                          {workshop.speaker_headshot ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-100 group-hover/speaker:ring-blue-300 transition-all flex-shrink-0">
                              <Image
                                src={workshop.speaker_headshot}
                                alt={workshop.speaker_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 group-hover/speaker:text-[#1E68C6] transition-colors truncate">
                              {workshop.speaker_name}
                            </p>
                            {workshop.speaker_location && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {workshop.speaker_location}
                              </p>
                            )}
                          </div>
                        </Link>
                      )}

                      {workshop.short_description && (
                        <p className="text-gray-600 text-sm font-montserrat mb-3 line-clamp-2">{workshop.short_description}</p>
                      )}

                      {/* Duration badge */}
                      {workshop.duration_minutes && (
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="flex items-center gap-1 font-montserrat text-gray-600 border-gray-300">
                            <Clock className="w-3 h-3" />
                            {workshop.duration_minutes} min
                          </Badge>
                        </div>
                      )}

                      {/* Topics with enhanced styling */}
                      {workshop.topics && workshop.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {workshop.topics.slice(0, 3).map((topic, idx) => (
                            <Badge
                              key={idx}
                              className="text-xs font-montserrat bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                            >
                              {topic}
                            </Badge>
                          ))}
                          {workshop.topics.length > 3 && (
                            <Badge className="text-xs font-montserrat bg-gray-100 text-gray-600">
                              +{workshop.topics.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="mt-auto pt-4 flex flex-col gap-3">
                        <Link href={`/contact?workshop=${workshop.id}`}>
                          <Button className="w-full font-montserrat font-bold text-sm" variant="gold">
                            {content.buttons.inquire}
                          </Button>
                        </Link>
                        <Link href={`/ai-workshops/${workshop.slug}`}>
                          <Button className="w-full font-montserrat text-sm" variant="outline">
                            {content.buttons.view_details}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

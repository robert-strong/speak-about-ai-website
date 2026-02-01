"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, MapPin, DollarSign } from "lucide-react"
import type { Speaker } from "@/lib/speakers-data"
import { SpeakerCard } from "@/components/speaker-card"

// Fee range filter options
const FEE_RANGES: Record<string, { label: string; min: number; max: number }> = {
  "under-10k": { label: "Under $10K", min: 0, max: 10000 },
  "10k-20k": { label: "$10K - $20K", min: 10000, max: 20000 },
  "20k-30k": { label: "$20K - $30K", min: 20000, max: 30000 },
  "30k-50k": { label: "$30K - $50K", min: 30000, max: 50000 },
  "50k-plus": { label: "$50K+", min: 50000, max: Infinity },
}

// Location region buckets
const LOCATION_REGIONS: Record<string, string[]> = {
  "San Francisco Bay Area": ["san francisco", "bay area", "silicon valley", "palo alto", "san jose", "sausalito", "orinda", "scotts valley", "california"],
  "New York": ["new york", "nyc", "manhattan"],
  "Los Angeles": ["los angeles", "malibu", "orange county"],
  "Seattle": ["seattle"],
  "Boston": ["boston", "massachusetts", "burlington", "wenham"],
  "Austin/Texas": ["austin", "texas"],
  "Miami/Florida": ["miami", "florida"],
  "Chicago": ["chicago", "illinois"],
  "Atlanta": ["atlanta", "georgia"],
  "Europe": ["london", "uk", "united kingdom", "berlin", "germany", "munich", "dublin", "ireland", "lisbon", "portugal", "rome", "italy", "paris", "france", "europe"],
  "Canada": ["canada", "toronto", "alberta"],
  "International": ["india", "vietnam", "asia", "israel"],
}

// Parse fee string to get numeric value
function parseFeeToNumber(feeStr: string | undefined): number | null {
  if (!feeStr) return null
  const cleanFee = feeStr.toLowerCase().trim()
  if (cleanFee.includes("inquire")) return null

  // Extract first number found (handles "$10K", "$10k to $20k", "$10,000", etc.)
  const match = cleanFee.match(/\$?([\d,]+)(?:k|K)?/)
  if (!match) return null

  let value = parseInt(match[1].replace(/,/g, ""), 10)
  // If the number is small and there's a 'k' indicator, multiply by 1000
  if ((cleanFee.includes("k") || cleanFee.includes("K")) && value < 1000) {
    value *= 1000
  }
  return value
}

// Define the 7 industry buckets and their associated keywords
const INDUSTRY_BUCKETS: Record<string, string[]> = {
  "Technology & AI": [
    "technology",
    "ai",
    "artificial intelligence",
    "software",
    "saas",
    "cybersecurity",
    "data science",
    "tech",
    "enterprise technology",
    "innovation",
  ],
  "Healthcare & Life Sciences": [
    "healthcare",
    "medical",
    "biotech",
    "pharmaceuticals",
    "health",
    "life sciences",
    "digital health",
    "wellness",
  ],
  "Financial Services": [
    "finance",
    "financial services",
    "fintech",
    "banking",
    "venture capital",
    "vc",
    "investment",
    "private equity",
    "insurance",
    "wall street",
  ],
  "Leadership & Business": [
    "leadership",
    "business strategy",
    "strategy",
    "management",
    "consulting",
    "executive",
    "corporate culture",
    "future of work",
    "entrepreneurship",
  ],
  "Sales, Marketing & Retail": [
    "sales",
    "marketing",
    "advertising",
    "digital marketing",
    "e-commerce",
    "ecommerce",
    "retail",
    "consumer goods",
    "cpg",
    "fashion",
    "customer experience",
    "cx",
  ],
  "Industrial & Automotive": [
    "manufacturing",
    "automotive",
    "industrial",
    "supply chain",
    "logistics",
    "energy",
    "aerospace",
  ],
  "Government & Education": ["government", "public sector", "policy", "education", "academia", "non-profit"],
}

const industryBucketKeys = Object.keys(INDUSTRY_BUCKETS)

interface SpeakerDirectoryContent {
  hero: {
    title: string
    subtitle: string
  }
  filters: {
    search_placeholder: string
    industry_label: string
    all_industries: string
    fee_label: string
    all_fees: string
    location_label: string
    all_locations: string
    showing_text: string
  }
  results: {
    loading_text: string
    no_results: string
    clear_filters: string
  }
  buttons: {
    load_more: string
  }
}

interface SpeakerDirectoryProps {
  initialSpeakers: Speaker[]
  content?: SpeakerDirectoryContent
}

const DEFAULT_CONTENT: SpeakerDirectoryContent = {
  hero: {
    title: 'All AI Keynote Speakers',
    subtitle: 'Browse our complete directory of world-class artificial intelligence experts, tech visionaries, and industry practitioners.',
  },
  filters: {
    search_placeholder: 'Search speakers by name, expertise, or industry...',
    industry_label: 'Industry',
    all_industries: 'All Industries',
    fee_label: 'Fee Range',
    all_fees: 'All Fee Ranges',
    location_label: 'Location',
    all_locations: 'All Locations',
    showing_text: 'Showing {displayed} of {total} speakers',
  },
  results: {
    loading_text: 'Loading speakers...',
    no_results: 'No speakers found matching your criteria. Try adjusting your search or filters.',
    clear_filters: 'Clear Filters',
  },
  buttons: {
    load_more: 'Load More Speakers ({remaining} remaining)',
  },
}

export default function SpeakerDirectory({ initialSpeakers, content = DEFAULT_CONTENT }: SpeakerDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("all")
  const [selectedFeeRange, setSelectedFeeRange] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastTrackedSearch = useRef<string>("")

  const validInitialSpeakers = useMemo(() => {
    if (!Array.isArray(initialSpeakers)) {
      return []
    }
    return initialSpeakers.filter((s) => s && s.slug && s.name)
  }, [initialSpeakers])

  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>(validInitialSpeakers)
  const [displayedSpeakers, setDisplayedSpeakers] = useState<Speaker[]>(validInitialSpeakers.slice(0, 12))
  const [displayCount, setDisplayCount] = useState(12)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  // Track search event with Umami
  const trackSearchEvent = (query: string, resultCount: number, industry: string, speakers: Speaker[] = []) => {
    // Only track if the search query has changed and is not empty
    if (query && query !== lastTrackedSearch.current) {
      lastTrackedSearch.current = query
      
      // Track with Umami if available
      if (typeof window !== 'undefined' && (window as any).umami) {
        (window as any).umami.track('speaker-search', {
          search_query: query,
          result_count: resultCount,
          industry_filter: industry,
          timestamp: new Date().toISOString()
        })
      }

      // Get top 10 speaker results to track
      const topSpeakers = speakers.slice(0, 10).map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug
      }))

      // Also send to our analytics API for admin dashboard
      fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          resultCount,
          industry,
          page: '/speakers',
          speakerResults: topSpeakers
        })
      }).catch(err => console.error('Failed to track search:', err))
    }
  }

  useEffect(() => {
    const applyFilters = () => {
      setIsLoading(true)
      setError(false)

      try {
        const noFiltersActive = searchQuery.trim() === "" &&
          selectedIndustry === "all" &&
          selectedFeeRange === "all" &&
          selectedLocation === "all"

        if (noFiltersActive) {
          setFilteredSpeakers(validInitialSpeakers)
          setDisplayedSpeakers(validInitialSpeakers.slice(0, 12))
          setDisplayCount(12)
          setIsLoading(false)
          return
        }

        let searchResults: Speaker[] = []

        if (searchQuery.trim()) {
          const searchTerm = searchQuery.toLowerCase().trim()
          const speakersWithScores = validInitialSpeakers.map((speaker) => {
            let score = 0
            const matchedFields: string[] = []

            const checkAndScore = (field: string | string[] | undefined, weight: number, fieldName: string) => {
              if (!field) return
              let isMatch = false
              if (typeof field === "string") {
                if (field.toLowerCase().includes(searchTerm)) isMatch = true
              } else if (Array.isArray(field)) {
                if (field.some((item) => typeof item === "string" && item.toLowerCase().includes(searchTerm)))
                  isMatch = true
              }
              if (isMatch) {
                score += weight
                if (!matchedFields.includes(fieldName)) {
                  matchedFields.push(fieldName)
                }
              }
            }

            checkAndScore(speaker.expertise, 4, "expertise")
            checkAndScore(speaker.industries, 3, "industries")
            checkAndScore(speaker.programs, 2, "programs")
            checkAndScore(speaker.name, 1, "name")
            checkAndScore(speaker.title, 1, "title")
            checkAndScore(speaker.bio, 1, "bio")
            checkAndScore(speaker.location, 1, "location")
            checkAndScore(speaker.tags, 1, "tags")

            return { speaker, score, matchedFields }
          })

          searchResults = speakersWithScores
            .filter((item) => item.score > 0)
            .sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score
              return a.speaker.name.localeCompare(b.speaker.name)
            })
            .map((item) => item.speaker)
        } else {
          searchResults = validInitialSpeakers
        }

        let finalFilteredSpeakers = searchResults

        // Apply industry filter
        if (selectedIndustry !== "all") {
          const keywords = INDUSTRY_BUCKETS[selectedIndustry]
          if (keywords) {
            finalFilteredSpeakers = finalFilteredSpeakers.filter((speaker) => {
              if (!speaker.industries) return false

              const speakerIndustries = (
                typeof speaker.industries === "string" ? speaker.industries.split(",") : speaker.industries
              ).map((i) => i.trim().toLowerCase())

              return speakerIndustries.some((ind) => keywords.some((kw) => ind.includes(kw)))
            })
          }
        }

        // Apply fee range filter
        if (selectedFeeRange !== "all") {
          const feeConfig = FEE_RANGES[selectedFeeRange]
          if (feeConfig) {
            finalFilteredSpeakers = finalFilteredSpeakers.filter((speaker) => {
              const feeValue = parseFeeToNumber(speaker.fee || speaker.feeRange)
              if (feeValue === null) return false
              return feeValue >= feeConfig.min && feeValue < feeConfig.max
            })
          }
        }

        // Apply location filter
        if (selectedLocation !== "all") {
          const locationKeywords = LOCATION_REGIONS[selectedLocation]
          if (locationKeywords) {
            finalFilteredSpeakers = finalFilteredSpeakers.filter((speaker) => {
              if (!speaker.location) return false
              const speakerLocation = speaker.location.toLowerCase()
              return locationKeywords.some(kw => speakerLocation.includes(kw))
            })
          }
        }

        setFilteredSpeakers(finalFilteredSpeakers)
        setDisplayedSpeakers(finalFilteredSpeakers.slice(0, 12))
        setDisplayCount(12)

        // Track search after filtering with debounce
        if (searchDebounceTimer.current) {
          clearTimeout(searchDebounceTimer.current)
        }
        searchDebounceTimer.current = setTimeout(() => {
          if (searchQuery.trim()) {
            console.log('Tracking search:', searchQuery.trim(), 'Results:', finalFilteredSpeakers.length, 'Industry:', selectedIndustry)
            trackSearchEvent(searchQuery.trim(), finalFilteredSpeakers.length, selectedIndustry, finalFilteredSpeakers)
          }
        }, 500) // Wait 500ms after user stops typing
      } catch (err) {
        console.error("Error applying filters in SpeakerDirectory:", err)
        setError(true)
        setFilteredSpeakers(validInitialSpeakers)
        setDisplayedSpeakers(validInitialSpeakers.slice(0, 12))
      } finally {
        setIsLoading(false)
      }
    }

    applyFilters()

    // Cleanup debounce timer
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current)
      }
    }
  }, [searchQuery, selectedIndustry, selectedFeeRange, selectedLocation, validInitialSpeakers])

  const handleLoadMore = () => {
    const newCount = displayCount + 12
    setDisplayedSpeakers(filteredSpeakers.slice(0, newCount))
    setDisplayCount(newCount)
  }

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

          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1E68C6] w-5 h-5" />
                <Input
                  type="text"
                  placeholder={content.filters.search_placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-montserrat border-2 border-[#1E68C6]/30 shadow-lg hover:shadow-xl focus:shadow-xl focus:border-[#1E68C6] transition-all"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Industry Filter */}
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="text-[#1E68C6] w-4 h-4 flex-shrink-0" />
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger className="w-full font-montserrat text-sm">
                      <SelectValue placeholder={content.filters.industry_label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{content.filters.all_industries}</SelectItem>
                      {industryBucketKeys.map((bucket) => (
                        <SelectItem key={bucket} value={bucket}>
                          {bucket}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fee Range Filter */}
                <div className="flex items-center gap-2 flex-1">
                  <DollarSign className="text-[#1E68C6] w-4 h-4 flex-shrink-0" />
                  <Select value={selectedFeeRange} onValueChange={setSelectedFeeRange}>
                    <SelectTrigger className="w-full font-montserrat text-sm">
                      <SelectValue placeholder={content.filters.fee_label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{content.filters.all_fees}</SelectItem>
                      {Object.entries(FEE_RANGES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div className="flex items-center gap-2 flex-1">
                  <MapPin className="text-[#1E68C6] w-4 h-4 flex-shrink-0" />
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-full font-montserrat text-sm">
                      <SelectValue placeholder={content.filters.location_label} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{content.filters.all_locations}</SelectItem>
                      {Object.keys(LOCATION_REGIONS).map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600 font-montserrat">
                {content.filters.showing_text.replace('{displayed}', String(displayedSpeakers.length)).replace('{total}', String(filteredSpeakers.length))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading && <div className="text-center py-12 font-montserrat text-gray-600">{content.results.loading_text}</div>}

          {!isLoading && !error && filteredSpeakers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4 font-montserrat">
                {content.results.no_results}
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedIndustry("all")
                  setSelectedFeeRange("all")
                  setSelectedLocation("all")
                }}
                className="bg-blue-600 hover:bg-blue-700 font-montserrat"
              >
                {content.results.clear_filters}
              </Button>
            </div>
          )}

          {!isLoading && !error && filteredSpeakers.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {displayedSpeakers.map((speaker) => (
                  <SpeakerCard key={speaker.slug} speaker={speaker} contactSource="speaker_directory" />
                ))}
              </div>

              {displayCount < filteredSpeakers.length && (
                <div className="text-center mt-12">
                  <Button
                    onClick={handleLoadMore}
                    variant="default"
                    className="font-montserrat"
                  >
                    {content.buttons.load_more.replace('{remaining}', String(filteredSpeakers.length - displayCount))}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

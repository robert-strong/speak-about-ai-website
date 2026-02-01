"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Quote, Building2, MapPin, User, CalendarCheck, X, ChevronLeft, ChevronRight } from "lucide-react"

interface Speaker {
  name: string
  slug: string
  title: string
  headshot: string
}

interface CaseStudy {
  id: number
  company: string
  logo_url: string
  location: string
  event_type: string
  image_url: string
  image_alt: string
  speaker_contribution: string
  testimonial: string
  testimonial_author?: string
  testimonial_title?: string
  video_url?: string
  speakers: Speaker[]
  impact_points: string[]
}

interface SpeakerDetails {
  name: string
  slug: string
  title: string
  bio?: string
  image?: string
  programs?: any[]
  industries?: string[]
  fee?: string
  feeRange?: string
  location?: string
  linkedin?: string
  twitter?: string
  website?: string
  featured?: boolean
  videos?: any[]
  testimonials?: any[]
  topics?: string[]
  listed?: boolean
  ranking?: number
  youtube?: string
  instagram?: string
}

export default function ClientCaseStudies() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [expandedSpeaker, setExpandedSpeaker] = useState<{speaker: Speaker, caseStudyId: number} | null>(null)
  const [expandedCaseStudy, setExpandedCaseStudy] = useState<CaseStudy | null>(null)
  const [speakerDetails, setSpeakerDetails] = useState<SpeakerDetails | null>(null)
  const [loadingSpeaker, setLoadingSpeaker] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const fetchCaseStudies = async () => {
      try {
        const response = await fetch('/api/case-studies')
        const data = await response.json()
        if (data.success && data.data) {
          setCaseStudies(data.data)
        }
      } catch (error) {
        console.error('Error fetching case studies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCaseStudies()
  }, [])

  const handleImageLoad = (id: number) => {
    setLoadedImages((prev) => new Set(prev).add(String(id)))
  }

  const handleNext = useCallback(() => {
    // Move by 2 since we're showing 2 at a time
    setCurrentIndex((prev) => {
      const next = prev + 2
      return next >= caseStudies.length ? 0 : next
    })
  }, [caseStudies.length])

  const handlePrev = useCallback(() => {
    // Move by 2 since we're showing 2 at a time
    setCurrentIndex((prev) => {
      const prevIndex = prev - 2
      return prevIndex < 0 ? Math.max(0, caseStudies.length - 2) : prevIndex
    })
  }, [caseStudies.length])

  const handleExpandSpeaker = async (speaker: Speaker, caseStudyId: number) => {
    setExpandedSpeaker({speaker, caseStudyId})
    setLoadingSpeaker(true)

    try {
      const response = await fetch(`/api/speakers/public/${speaker.slug}`)
      const data = await response.json()
      if (data.found) {
        setSpeakerDetails(data.speaker)
      }
    } catch (error) {
      console.error('Error fetching speaker details:', error)
    } finally {
      setLoadingSpeaker(false)
    }
  }

  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      let videoId = ''
      let startTime = ''

      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || ''
        startTime = urlObj.searchParams.get('t') || ''
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1)
      }

      if (videoId) {
        let embedUrl = `https://www.youtube.com/embed/${videoId}`
        if (startTime) {
          // Remove 's' suffix if present and convert to start parameter
          const timeInSeconds = startTime.replace('s', '')
          embedUrl += `?start=${timeInSeconds}`
        }
        return embedUrl
      }
    } catch (error) {
      console.error('Error parsing YouTube URL:', error)
    }
    return null
  }

  // Auto-rotation effect
  useEffect(() => {
    if (!isPaused && caseStudies.length > 2) {
      const interval = setInterval(() => {
        handleNext()
      }, 5000) // Rotate every 5 seconds

      return () => clearInterval(interval)
    }
  }, [isPaused, currentIndex, caseStudies.length, handleNext])

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 font-montserrat">Loading case studies...</p>
          </div>
        </div>
      </section>
    )
  }

  if (caseStudies.length === 0) {
    return null
  }

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-amber-100 text-gray-900 rounded-full text-sm font-medium mb-6 font-montserrat">
            <Building2 className="w-4 h-4 mr-2" />
            Client Success Stories
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 font-neue-haas">
            Real Results from Real Events
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat leading-relaxed">
            See how our speakers have delivered exceptional value and measurable impact for organizations worldwide
          </p>
        </div>

        {/* Case Studies - Carousel with Arrows */}
        <div
          className="relative group/carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          {caseStudies.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 p-4 rounded-full bg-white/95 backdrop-blur-sm border-2 border-[#1E68C6] text-[#1E68C6] hover:bg-[#1E68C6] hover:text-white transition-all duration-300 shadow-2xl hover:shadow-[0_0_30px_rgba(30,104,198,0.5)] hover:scale-110"
                aria-label="Previous case study"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 p-4 rounded-full bg-white/95 backdrop-blur-sm border-2 border-[#1E68C6] text-[#1E68C6] hover:bg-[#1E68C6] hover:text-white transition-all duration-300 shadow-2xl hover:shadow-[0_0_30px_rgba(30,104,198,0.5)] hover:scale-110"
                aria-label="Next case study"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 50}%)`
              }}
            >
              {caseStudies.map((study) => (
                <div
                  key={study.id}
                  className="flex-shrink-0 w-full md:w-1/2 px-2 md:px-4"
                >
                  <div className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-[#1E68C6]">
                    <div className="flex flex-col">
                      {/* Event Image */}
                      <div className="relative h-64 bg-gray-200 overflow-hidden">
                        <img
                          src={study.image_url}
                          alt={study.image_alt}
                          onLoad={() => handleImageLoad(study.id)}
                          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                            loadedImages.has(String(study.id)) ? "opacity-100" : "opacity-0"
                          }`}
                          loading="lazy"
                        />
                        {/* Company Logo Overlay */}
                        <div className="absolute top-6 left-6 bg-white rounded-xl p-4 shadow-xl">
                          <img
                            src={study.logo_url || "/placeholder.svg"}
                            alt={`${study.company} logo`}
                            className={`w-auto object-contain ${study.company === 'Chapman University' ? 'h-7' : 'h-10'}`}
                            loading="lazy"
                          />
                        </div>
                        {/* Event Type Badge */}
                        <div className="absolute bottom-6 left-6">
                          <div className="px-5 py-2 bg-gradient-to-r from-[#1E68C6] to-blue-700 text-white rounded-full text-sm font-bold font-montserrat shadow-xl">
                            {study.event_type}
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 font-neue-haas mb-4">{study.company}</h3>

                        {/* Featured Speakers */}
                        {study.speakers && study.speakers.length > 0 && (
                          <div className="mb-5">
                            <h4 className="text-xs uppercase tracking-wide font-bold text-gray-500 font-montserrat mb-3">
                              Featured Speaker{study.speakers.length > 1 ? 's' : ''}
                            </h4>
                            <div className="space-y-3">
                              {study.speakers.slice(0, 2).map((speaker, idx) => (
                                <div
                                  key={idx}
                                  className="relative flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 rounded-xl border-2 border-blue-700 cursor-pointer hover:border-[#D4AF37] hover:shadow-2xl transition-all duration-300 overflow-hidden group/speaker"
                                  onClick={() => handleExpandSpeaker(speaker, study.id)}
                                >
                                  {/* Animated gradient overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/speaker:opacity-100 transition-opacity duration-500"></div>

                                  <img
                                    src={speaker.headshot}
                                    alt={speaker.name}
                                    className="relative z-10 w-14 h-14 rounded-full object-cover border-3 border-white shadow-xl group-hover/speaker:scale-110 transition-transform duration-300"
                                  />
                                  <div className="relative z-10 flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white font-neue-haas drop-shadow-lg">
                                      {speaker.name}
                                    </p>
                                    <p className="text-xs text-blue-100 font-montserrat line-clamp-1">
                                      {speaker.title}
                                    </p>
                                  </div>
                                  {/* Click indicator */}
                                  <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/speaker:bg-[#D4AF37] transition-colors">
                                    <ChevronRight className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              ))}
                              {study.speakers.length > 2 && (
                                <p className="text-xs text-gray-500 font-montserrat pl-3">
                                  + {study.speakers.length - 2} more
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Testimonial - Truncated */}
                        {study.testimonial && (
                          <div className="mb-5 bg-blue-50 rounded-lg p-4 relative">
                            <Quote className="absolute top-3 left-3 w-6 h-6 text-[#1E68C6] opacity-20" />
                            <p className="text-gray-700 font-montserrat leading-relaxed text-sm italic pl-6 line-clamp-3">
                              "{study.testimonial}"
                            </p>
                            {study.testimonial_author && (
                              <p className="text-xs text-gray-600 font-montserrat mt-2 pl-6">
                                — {study.testimonial_author}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Impact Points */}
                        {study.impact_points && study.impact_points.length > 0 && (
                          <div className="mb-5">
                            <h4 className="text-xs uppercase tracking-wide font-bold text-gray-500 font-montserrat mb-3">
                              Key Impact
                            </h4>
                            <div className="space-y-2">
                              {study.impact_points.slice(0, 2).map((point, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1E68C6] flex items-center justify-center mt-0.5">
                                    <span className="text-white text-xs font-bold">{idx + 1}</span>
                                  </div>
                                  <span className="text-gray-700 font-montserrat text-sm leading-relaxed flex-1">
                                    {point}
                                  </span>
                                </div>
                              ))}
                              {study.impact_points.length > 2 && (
                                <p className="text-xs text-gray-500 font-montserrat ml-7">
                                  + {study.impact_points.length - 2} more
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View More Button */}
                        <div className="mt-auto pt-4">
                          <Button
                            variant="gold"
                            size="sm"
                            className="w-full font-montserrat font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                            onClick={() => setExpandedCaseStudy(study)}
                          >
                            View Full Case Study →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>

        {/* Dots Indicator */}
        {caseStudies.length > 2 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.ceil(caseStudies.length / 2) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx * 2)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx * 2
                    ? 'bg-[#1E68C6] w-12'
                    : 'bg-gray-300 hover:bg-gray-400 w-2'
                }`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Speaker Detail Modal */}
      {expandedSpeaker && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => {
            setExpandedSpeaker(null)
            setSpeakerDetails(null)
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setExpandedSpeaker(null)
                setSpeakerDetails(null)
              }}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {loadingSpeaker ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#1E68C6]"></div>
                <p className="mt-4 text-gray-600 font-montserrat">Loading speaker details...</p>
              </div>
            ) : speakerDetails ? (
              <div>
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-[#1E68C6] to-blue-700 p-8 text-white">
                  <div className="flex items-start gap-6">
                    <img
                      src={speakerDetails.image}
                      alt={speakerDetails.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl"
                    />
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold font-neue-haas mb-2">{speakerDetails.name}</h3>
                      <p className="text-xl text-blue-100 font-montserrat mb-4">{speakerDetails.title}</p>
                      {speakerDetails.feeRange && (
                        <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                          Speaking Fee: {speakerDetails.feeRange}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Bio */}
                  {speakerDetails.bio && (
                    <div className="mb-8">
                      <h4 className="text-xl font-bold text-gray-900 font-neue-haas mb-4">Biography</h4>
                      <p className="text-gray-700 font-montserrat leading-relaxed whitespace-pre-line">
                        {speakerDetails.bio}
                      </p>
                    </div>
                  )}

                  {/* Topics */}
                  {speakerDetails.topics && Array.isArray(speakerDetails.topics) && speakerDetails.topics.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-xl font-bold text-gray-900 font-neue-haas mb-4">Speaking Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {speakerDetails.topics.map((topic: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-blue-100 text-[#1E68C6] rounded-full text-sm font-semibold font-montserrat"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Programs */}
                  {speakerDetails.programs && Array.isArray(speakerDetails.programs) && speakerDetails.programs.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-xl font-bold text-gray-900 font-neue-haas mb-4">Signature Programs</h4>
                      <div className="grid gap-4">
                        {speakerDetails.programs.map((program: any, idx: number) => {
                          // Handle both string and object formats
                          const isString = typeof program === 'string'
                          const title = isString ? program : (program.title || program.name || '')
                          const description = isString ? '' : (program.description || '')

                          if (!title) return null

                          return (
                            <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200">
                              <h5 className="font-bold text-gray-900 font-neue-haas mb-2">{title}</h5>
                              {description && (
                                <p className="text-gray-700 font-montserrat text-sm">{description}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {speakerDetails.videos && Array.isArray(speakerDetails.videos) && speakerDetails.videos.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-xl font-bold text-gray-900 font-neue-haas mb-4">Videos</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {speakerDetails.videos.map((video: any, idx: number) => {
                          // Handle both string URLs and object formats
                          const videoUrl = typeof video === 'string' ? video : (video.url || video.embed_url || '')
                          const videoTitle = typeof video === 'string' ? `Video ${idx + 1}` : (video.title || `Video ${idx + 1}`)
                          const embedUrl = getYouTubeEmbedUrl(videoUrl)

                          if (!embedUrl) return null

                          return (
                            <div key={idx} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                              <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allowFullScreen
                                title={videoTitle}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <Button
                      asChild
                      variant="gold"
                      size="lg"
                      className="flex-1 font-montserrat font-bold text-lg"
                    >
                      <Link href={`/contact?source=case_study_modal&speakerName=${encodeURIComponent(expandedSpeaker.speaker.name)}`}>
                        Book {expandedSpeaker.speaker.name}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="font-montserrat font-bold"
                    >
                      <Link href={`/speakers/${expandedSpeaker.speaker.slug}`}>
                        View Full Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-600 font-montserrat">Unable to load speaker details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Case Study Modal */}
      {expandedCaseStudy && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setExpandedCaseStudy(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setExpandedCaseStudy(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-[#1E68C6] to-blue-700 p-8 text-white">
              <div className="flex items-center gap-6">
                <img
                  src={expandedCaseStudy.logo_url}
                  alt={expandedCaseStudy.company}
                  className="h-20 w-auto object-contain bg-white rounded-lg p-4"
                />
                <div className="flex-1">
                  <h3 className="text-3xl font-bold font-neue-haas mb-2">{expandedCaseStudy.company}</h3>
                  <div className="flex gap-3 flex-wrap">
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                      {expandedCaseStudy.event_type}
                    </span>
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {expandedCaseStudy.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Event Image */}
              {expandedCaseStudy.image_url && (
                <div className="mb-8 rounded-xl overflow-hidden">
                  <img
                    src={expandedCaseStudy.image_url}
                    alt={expandedCaseStudy.image_alt}
                    className="w-full h-96 object-cover"
                  />
                </div>
              )}

              {/* Video Embed */}
              {expandedCaseStudy.video_url && getYouTubeEmbedUrl(expandedCaseStudy.video_url) && (
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-gray-900 font-neue-haas mb-4">
                    Watch Highlights
                  </h4>
                  <div className="relative w-full rounded-xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={getYouTubeEmbedUrl(expandedCaseStudy.video_url) || ''}
                      title={`${expandedCaseStudy.company} Video`}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* All Featured Speakers */}
              {expandedCaseStudy.speakers && expandedCaseStudy.speakers.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-gray-900 font-neue-haas mb-4">
                    Featured Speaker{expandedCaseStudy.speakers.length > 1 ? 's' : ''}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {expandedCaseStudy.speakers.map((speaker, idx) => (
                      <div
                        key={idx}
                        className="relative flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 rounded-xl border-2 border-blue-700 cursor-pointer hover:border-[#D4AF37] hover:shadow-2xl transition-all duration-300 overflow-hidden group/speaker"
                        onClick={() => handleExpandSpeaker(speaker, expandedCaseStudy.id)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/speaker:opacity-100 transition-opacity duration-500"></div>
                        <img
                          src={speaker.headshot}
                          alt={speaker.name}
                          className="relative z-10 w-14 h-14 rounded-full object-cover border-3 border-white shadow-xl group-hover/speaker:scale-110 transition-transform duration-300"
                        />
                        <div className="relative z-10 flex-1 min-w-0">
                          <p className="text-sm font-bold text-white font-neue-haas drop-shadow-lg">
                            {speaker.name}
                          </p>
                          <p className="text-xs text-blue-100 font-montserrat line-clamp-1">
                            {speaker.title}
                          </p>
                        </div>
                        <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/speaker:bg-[#D4AF37] transition-colors">
                          <ChevronRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Testimonial */}
              {expandedCaseStudy.testimonial && (
                <div className="mb-8 bg-blue-50 rounded-xl p-6 relative">
                  <Quote className="absolute top-4 left-4 w-10 h-10 text-[#1E68C6] opacity-20" />
                  <p className="text-gray-800 font-montserrat leading-relaxed text-lg italic pl-8 mb-4">
                    "{expandedCaseStudy.testimonial}"
                  </p>
                  {expandedCaseStudy.testimonial_author && (
                    <div className="pl-8 border-l-4 border-[#1E68C6]">
                      <p className="text-gray-900 font-bold font-neue-haas">
                        {expandedCaseStudy.testimonial_author}
                      </p>
                      {expandedCaseStudy.testimonial_title && (
                        <p className="text-gray-600 font-montserrat text-sm">
                          {expandedCaseStudy.testimonial_title}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Speaker Contribution */}
              {expandedCaseStudy.speaker_contribution && (
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-gray-900 font-neue-haas mb-4">
                    What the Speaker Provided
                  </h4>
                  <p className="text-gray-700 font-montserrat leading-relaxed text-lg">
                    {expandedCaseStudy.speaker_contribution}
                  </p>
                </div>
              )}

              {/* All Impact Points */}
              {expandedCaseStudy.impact_points && expandedCaseStudy.impact_points.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-gray-900 font-neue-haas mb-4">
                    Key Impact
                  </h4>
                  <div className="grid gap-4">
                    {expandedCaseStudy.impact_points.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1E68C6] flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{idx + 1}</span>
                        </div>
                        <span className="text-gray-700 font-montserrat leading-relaxed flex-1 text-lg">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button
                  asChild
                  variant="gold"
                  size="lg"
                  className="flex-1 font-montserrat font-bold text-lg"
                >
                  <Link href={`/contact?source=case_study_${expandedCaseStudy.id}`}>
                    Book a Speaker Like This
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

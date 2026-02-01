"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Linkedin, Globe, Mail, ArrowLeft, Play, Quote, Building, Award, Calendar, CheckCircle, BookOpen, Trophy, Download, Mic, Users, Clock, Briefcase, Star, MessageSquare } from "lucide-react"
import type { Speaker } from "@/lib/speakers-data"
import { SpeakerRelatedBlogPosts } from "@/components/speaker-related-blog-posts"
import { SpeakerSimilarSpeakers } from "@/components/speaker-similar-speakers"

interface OptimizedSpeakerProfileProps {
  speaker: Speaker
  similarSpeakers?: Speaker[]
}

const OptimizedSpeakerProfile: React.FC<OptimizedSpeakerProfileProps> = ({ speaker, similarSpeakers }) => {
  const imageUrl = speaker.image || "/placeholder.svg"

  // Format bio with proper paragraphs
  const formatBio = (bio: string) => {
    if (!bio) return null
    const paragraphs = bio.split(/\n\s*\n/).filter((p) => p.trim())
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-4 text-gray-700 leading-relaxed text-lg">
        {paragraph.trim()}
      </p>
    ))
  }

  // We'll always show 2 tabs: About and Speaking

  // Generate breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://speakabout.ai"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "AI Speakers",
        "item": "https://speakabout.ai/speakers"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": speaker.name,
        "item": `https://speakabout.ai/speakers/${speaker.slug}`
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <div className="min-h-screen bg-white">
        {/* Breadcrumb Navigation */}
        <nav className="bg-gray-50 py-4 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ol className="flex items-center space-x-2 text-sm">
              <li><Link href="/" className="text-gray-500 hover:text-[#1E68C6]">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link href="/speakers" className="text-gray-500 hover:text-[#1E68C6]">AI Speakers</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-semibold">{speaker.name}</li>
            </ol>
          </div>
        </nav>

        {/* Hero Section with H1 */}
        <section className="bg-gradient-to-br from-gray-50 to-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Image and Quick Info */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-24" suppressHydrationWarning>
                  <Card className="shadow-lg border border-gray-200">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <Image
                        src={imageUrl}
                        alt={`${speaker.name} - AI Keynote Speaker`}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                      />
                      {speaker.fee && (
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                          <span className="font-semibold text-gray-900 text-sm">{speaker.fee}</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      {/* Name and Title */}
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{speaker.name}</h2>
                      <p className="text-[#5084C6] font-semibold mb-4">{speaker.title}</p>
                      
                      {/* Availability Indicator */}
                      {speaker.availabilityNote && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center text-green-800">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="text-sm font-semibold">{speaker.availabilityNote}</span>
                          </div>
                        </div>
                      )}
                      
                      <Button
                        asChild
                        variant="gold"
                        size="lg"
                        className="w-full font-semibold"
                      >
                        <Link href={`/contact?speaker=${encodeURIComponent(speaker.name)}`}>
                          Book {speaker.name.split(' ')[0]} Now
                        </Link>
                      </Button>
                      
                      {/* Quick Info */}
                      <div className="mt-6 space-y-3">
                        {speaker.location && (
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-[#1E68C6]" />
                            <span>{speaker.location}</span>
                          </div>
                        )}
                        {speaker.languages && speaker.languages.length > 0 && (
                          <div className="flex items-center text-gray-600">
                            <Globe className="w-4 h-4 mr-2 text-[#1E68C6]" />
                            <span>{speaker.languages.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Industries */}
                      {speaker.industries && speaker.industries.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">Industries:</h3>
                          <div className="flex flex-wrap gap-2">
                            {speaker.industries.map((industry, index) => (
                              <Badge key={index} className="bg-[#1E68C6] text-white text-xs">
                                {industry}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Social Links */}
                      {speaker.linkedin && (
                        <div className="flex justify-center space-x-4 mt-6 pt-6 border-t">
                          <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer"
                             className="text-gray-500 hover:text-[#1E68C6]">
                            <Linkedin className="w-5 h-5" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right: Main Content with Proper H Tags */}
              <div className="lg:col-span-2">
                {/* H1 - Main Title */}
                <div className="mb-8 text-center">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                    {speaker.name}
                  </h1>
                  {speaker.title && (
                    <p className="text-xl text-gray-600">
                      {speaker.title}
                    </p>
                  )}
                </div>

                {/* Main Content - Single Page Layout */}
                <div className="space-y-8">

                    {/* Videos - At the top */}
                    {speaker.videos && speaker.videos.length > 0 && (
                      <section className="p-8 rounded-xl bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 border border-blue-100">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                          <Play className="w-8 h-8 mr-3 text-[#1E68C6]" />
                          Speaker Videos & Media
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                          {speaker.videos.map((video, index) => {
                            // Function to extract YouTube video ID
                            const getYouTubeId = (url: string) => {
                              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
                              const match = url?.match(regExp)
                              return (match && match[2].length === 11) ? match[2] : null
                            }

                            const getYouTubeThumbnail = (url: string) => {
                              const videoId = getYouTubeId(url)
                              if (videoId) {
                                return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                              }
                              return null
                            }

                            const thumbnail = video.thumbnail || getYouTubeThumbnail(video.url) || "/placeholder.svg"

                            return (
                              <a
                                key={index}
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block"
                              >
                                <div className="relative rounded-lg overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl">
                                  <div className="aspect-video bg-gray-100 relative">
                                    <img
                                      src={thumbnail}
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        if (thumbnail.includes('maxresdefault')) {
                                          target.src = thumbnail.replace('maxresdefault', 'hqdefault')
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-20 transition-all duration-300">
                                      <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Play className="w-8 h-8 text-[#1E68C6] ml-1" />
                                      </div>
                                    </div>
                                    {video.duration && (
                                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                        {video.duration}
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-4 bg-white">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-[#1E68C6] transition-colors duration-300">
                                      {video.title}
                                    </h3>
                                    {video.source && (
                                      <p className="text-sm text-gray-500 mt-1">{video.source}</p>
                                    )}
                                  </div>
                                </div>
                              </a>
                            )
                          })}
                        </div>
                      </section>
                    )}

                    {/* Speaking Programs - Second */}
                    {speaker.programs && Array.isArray(speaker.programs) && speaker.programs.length > 0 && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">
                          Available Speaking Programs
                        </h2>
                        <div className="space-y-6">
                          {speaker.programs.map((program, index) => {
                            const isString = typeof program === 'string'
                            const title = isString ? program : program.title
                            const description = isString ? null : program.description
                            const duration = isString ? null : program.duration
                            const format = isString ? null : program.format

                            return (
                              <div key={index} className="border-l-4 border-[#1E68C6] pl-6">
                                <div className="flex items-start">
                                  <Calendar className="w-5 h-5 mr-3 mt-1 text-[#1E68C6] flex-shrink-0" />
                                  <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                      {title}
                                      {format && (
                                        <Badge className="ml-3 bg-gray-100 text-gray-700">{format}</Badge>
                                      )}
                                    </h3>
                                    {description && (
                                      <p className="text-gray-600 mb-2">{description}</p>
                                    )}
                                    {duration && (
                                      <p className="text-sm text-gray-500">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Duration: {duration}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    )}

                    {/* About Section */}
                    {speaker.bio && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                          <Award className="w-8 h-8 mr-3 text-[#1E68C6]" />
                          About {speaker.name}
                        </h2>
                        <div className="prose prose-lg max-w-none text-gray-700">
                          {formatBio(speaker.bio)}
                        </div>
                      </section>
                    )}

                    {/* Expertise */}
                    {speaker.expertise && speaker.expertise.length > 0 && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Areas of Expertise</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                          {speaker.expertise.map((skill, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <span className="font-semibold text-gray-900">{skill}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Minimal Content Fallback */}
                    {!speaker.bio && (!speaker.expertise || speaker.expertise.length === 0) && (
                      <section className="bg-gray-50 rounded-lg p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                          About {speaker.name}
                        </h2>
                        <p className="text-lg text-gray-700 mb-4">
                          {speaker.name} is a renowned speaker specializing in artificial intelligence and emerging technologies.
                        </p>
                        <p className="text-lg text-gray-700">
                          Contact Speak About AI to learn more about booking {speaker.name} for your next event.
                        </p>
                      </section>
                    )}

                    {/* Testimonials */}
                    {speaker.testimonials && speaker.testimonials.length > 0 && (
                      <section className="p-8 rounded-xl bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 border border-blue-100">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                          <MessageSquare className="w-8 h-8 mr-3 text-[#1E68C6]" />
                          Testimonials
                        </h2>
                        <div className="space-y-6">
                          {speaker.testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white p-6 rounded-lg border-l-4 border-[#1E68C6] relative shadow-sm">
                              <Quote className="absolute top-4 right-4 w-8 h-8 text-slate-200" />
                              <p className="text-gray-700 italic mb-4 relative z-10 text-lg">
                                "{testimonial.quote}"
                              </p>
                              <div className="space-y-1">
                                <p className="font-semibold text-gray-900">{testimonial.author}</p>
                                {(testimonial.position || testimonial.company) && (
                                  <p className="text-sm text-gray-600">
                                    {testimonial.position}
                                    {testimonial.position && testimonial.company ? ", " : ""}
                                    {testimonial.company}
                                  </p>
                                )}
                                {testimonial.event && (
                                  <p className="text-xs text-gray-500 flex items-center">
                                    <Building className="w-3 h-3 mr-1.5 text-gray-400" />
                                    {testimonial.event}
                                  </p>
                                )}
                                {testimonial.date && (
                                  <p className="text-xs text-gray-500 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1.5 text-gray-400" />
                                    {new Date(testimonial.date).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Speaking Requirements */}
                    {speaker.speakingRequirements && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Requirements & Logistics</h2>
                        <Card className="p-6">
                          {speaker.speakingRequirements.avNeeds && speaker.speakingRequirements.avNeeds.length > 0 && (
                            <div className="mb-4">
                              <h3 className="font-semibold mb-2">AV Requirements:</h3>
                              <ul className="list-disc list-inside text-gray-600">
                                {speaker.speakingRequirements.avNeeds.map((need, index) => (
                                  <li key={index}>{need}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {speaker.speakingRequirements.stageSetup && (
                            <div className="mb-4">
                              <h3 className="font-semibold mb-2">Stage Setup:</h3>
                              <p className="text-gray-600">{speaker.speakingRequirements.stageSetup}</p>
                            </div>
                          )}
                          {speaker.speakingRequirements.virtualCapable && (
                            <Badge className="bg-green-100 text-green-800">Virtual Presentations Available</Badge>
                          )}
                        </Card>
                      </section>
                    )}

                    {/* Downloadable Speaker Kit */}
                    {speaker.speakerKit && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                          <Download className="w-8 h-8 mr-3 text-[#1E68C6]" />
                          Speaker Resources
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                          {speaker.speakerKit.onePagerUrl && (
                            <a href={speaker.speakerKit.onePagerUrl} download className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
                              <Download className="w-5 h-5 mr-3 text-[#1E68C6]" />
                              <div>
                                <p className="font-semibold">Speaker One-Pager</p>
                                <p className="text-sm text-gray-600">PDF with bio, topics, and photos</p>
                              </div>
                            </a>
                          )}
                          {speaker.speakerKit.highResPhotoUrl && (
                            <a href={speaker.speakerKit.highResPhotoUrl} download className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
                              <Download className="w-5 h-5 mr-3 text-[#1E68C6]" />
                              <div>
                                <p className="font-semibold">High-Res Photos</p>
                                <p className="text-sm text-gray-600">Professional headshots for marketing</p>
                              </div>
                            </a>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Past Speaking Engagements */}
                    {speaker.pastEvents && speaker.pastEvents.length > 0 && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                          <Briefcase className="w-8 h-8 mr-3 text-[#1E68C6]" />
                          Past Speaking Engagements
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                          {speaker.pastEvents.map((event, index) => (
                            <div key={index} className="border-l-4 border-gray-300 pl-4 py-2">
                              <h3 className="font-semibold text-gray-900">
                                {event.eventName}
                                {event.keynote && <Badge className="ml-2 bg-[#FFB800] text-white">Keynote</Badge>}
                              </h3>
                              {(event.eventType || event.location || event.date) && (
                                <p className="text-gray-600 text-sm">
                                  {event.eventType && <span>{event.eventType}</span>}
                                  {event.location && <span> • {event.location}</span>}
                                  {event.date && <span> • {event.date}</span>}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Awards & Recognition */}
                    {speaker.awards && speaker.awards.length > 0 && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                          <Trophy className="w-8 h-8 mr-3 text-[#1E68C6]" />
                          Awards & Recognition
                        </h2>
                        <div className="space-y-4">
                          {speaker.awards.map((award, index) => (
                            <div key={index} className="flex items-start">
                              <Star className="w-5 h-5 mr-3 mt-1 text-[#FFB800] flex-shrink-0" />
                              <div>
                                <h3 className="font-semibold text-gray-900">{award.title}</h3>
                                {(award.organization || award.year) && (
                                  <p className="text-gray-600">
                                    {award.organization}
                                    {award.organization && award.year && ' • '}
                                    {award.year}
                                  </p>
                                )}
                                {award.description && (
                                  <p className="text-gray-600 text-sm mt-1">{award.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Client Logos */}
                    {speaker.clientLogos && speaker.clientLogos.length > 0 && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Trusted By Leading Organizations</h2>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
                            {speaker.clientLogos.map((client, index) => (
                              <div key={index} className="flex items-center justify-center">
                                {client.logoUrl ? (
                                  <img src={client.logoUrl} alt={client.name} className="max-h-12 opacity-60 hover:opacity-100 transition-opacity" />
                                ) : (
                                  <span className="text-gray-500 text-sm text-center">{client.name}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Publications */}
                    {speaker.publications && speaker.publications.length > 0 && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                          <BookOpen className="w-8 h-8 mr-3 text-[#1E68C6]" />
                          Books & Publications
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {speaker.publications.map((pub, index) => (
                            <Card key={index} className="hover:shadow-lg transition-shadow">
                              {pub.coverImage && (
                                <img src={pub.coverImage} alt={pub.title} className="w-full h-48 object-cover rounded-t-lg" />
                              )}
                              <CardContent className="p-4">
                                <Badge className="mb-2" variant="outline">{pub.type}</Badge>
                                <h3 className="font-semibold text-gray-900 mb-1">{pub.title}</h3>
                                {pub.publisher && <p className="text-sm text-gray-600">{pub.publisher}</p>}
                                {pub.date && <p className="text-xs text-gray-500">{pub.date}</p>}
                                {pub.link && (
                                  <a href={pub.link} target="_blank" rel="noopener noreferrer" className="text-[#1E68C6] text-sm hover:underline mt-2 inline-block">
                                    View →
                                  </a>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Podcast & Media Appearances */}
                    {speaker.mediaAppearances && speaker.mediaAppearances.length > 0 && (
                      <section>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                          <Mic className="w-8 h-8 mr-3 text-[#1E68C6]" />
                          Media Appearances
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                          {speaker.mediaAppearances.map((media, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <Badge className="mb-2" variant="outline">{media.type}</Badge>
                                  <h3 className="font-semibold text-gray-900">{media.title}</h3>
                                  {media.outlet && <p className="text-gray-600">{media.outlet}</p>}
                                  {media.date && <p className="text-sm text-gray-500">{media.date}</p>}
                                </div>
                                {media.link && (
                                  <a href={media.link} target="_blank" rel="noopener noreferrer" className="text-[#1E68C6] hover:underline">
                                    <Play className="w-5 h-5" />
                                  </a>
                                )}
                              </div>
                              {media.embedCode && (
                                <div className="mt-4" dangerouslySetInnerHTML={{ __html: media.embedCode }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                </div>

                {/* Related Blog Posts - Show articles featuring this speaker */}
                <SpeakerRelatedBlogPosts
                  speakerName={speaker.name}
                  speakerSlug={speaker.slug}
                  limit={3}
                />

                {/* Book This Speaker CTA - Always show */}
                <section className="bg-gradient-to-r from-[#1E68C6] to-[#5084C6] rounded-xl p-8 text-white mt-12">
                  {speaker.availabilityNote && (
                    <div className="mb-4 flex items-center justify-center">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="text-lg font-semibold">{speaker.availabilityNote}</span>
                    </div>
                  )}
                  <h2 className="text-3xl font-bold mb-4">
                    Book {speaker.name} for Your Next Event
                  </h2>
                  <p className="text-xl mb-6 opacity-95">
                    Transform your event with insights on AI and {speaker.expertise?.[0]?.toLowerCase() || 'innovation'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      asChild
                      size="lg"
                      variant="gold"
                      className="font-bold text-lg"
                    >
                      <Link href={`/contact?speaker=${encodeURIComponent(speaker.name)}`}>
                        Check Availability & Pricing
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="bg-white text-[#1E68C6] hover:bg-gray-100"
                    >
                      <Link href="/speakers">
                        Browse Other Speakers
                      </Link>
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold mb-4">
                Frequently Asked Questions About Booking {speaker.name}
              </h2>
              <h3 className="text-xl font-semibold mt-6">
                What is {speaker.name}'s speaking fee?
              </h3>
              <p>
                {speaker.name}'s speaking fee is {speaker.fee || 'available upon request'}. 
                Final pricing depends on event location, date, and specific requirements.
              </p>
              <h3 className="text-xl font-semibold mt-6">
                What topics does {speaker.name} speak about?
              </h3>
              <p>
                {speaker.name} specializes in {speaker.topics?.slice(0, 3).join(', ') || 'AI and technology topics'}, 
                delivering customized presentations for your audience.
              </p>
              <h3 className="text-xl font-semibold mt-6">
                Is {speaker.name} available for virtual events?
              </h3>
              <p>
                Yes, {speaker.name} is available for both in-person and virtual keynote presentations worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* Similar Speakers - Automatically generated based on similarity algorithm */}
        {similarSpeakers && similarSpeakers.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SpeakerSimilarSpeakers
                similarSpeakers={similarSpeakers}
                currentSpeakerName={speaker.name}
              />
            </div>
          </section>
        )}
      </div>
    </>
  )
}

export default OptimizedSpeakerProfile
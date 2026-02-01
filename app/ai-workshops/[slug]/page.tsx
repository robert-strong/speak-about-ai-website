import { notFound } from "next/navigation"
import { getWorkshopBySlug, incrementWorkshopPopularity } from "@/lib/workshops-db"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Users, MapPin, CheckCircle, Target, BookOpen, Award, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import WorkshopAnalyticsTracker from "@/components/workshop-analytics-tracker"

interface PageProps {
  params: Promise<{ slug: string }>
}

// Force dynamic rendering to always fetch fresh data from the database
export const dynamic = 'force-dynamic'

export default async function WorkshopDetailPage({ params }: PageProps) {
  const { slug } = await params
  const workshop = await getWorkshopBySlug(slug)

  if (!workshop) {
    notFound()
  }

  // Increment popularity counter
  await incrementWorkshopPopularity(workshop.id)

  // Count the number of workshop format options in the agenda
  const agendaSections = workshop.agenda?.split('\n\n') || []
  const formatOptionsCount = agendaSections.filter(section => {
    const lines = section.split('\n').filter(line => line.trim())
    if (lines.length === 0) return false
    const title = lines[0]
    // Exclude section headers (all uppercase single lines)
    const isMainHeading = title === title.toUpperCase() && !title.includes(':') && lines.length === 1
    return !isMainHeading
  }).length

  // Determine if we should show sidebar pricing (only when there's 1 or fewer format options)
  const hasMultipleFormats = formatOptionsCount > 1

  return (
    <>
      {/* Analytics Tracker - Tracks workshop page views */}
      <WorkshopAnalyticsTracker
        workshopId={workshop.id}
        workshopTitle={workshop.title}
        workshopSlug={workshop.slug}
        speakerName={workshop.speaker_name}
        speakerSlug={workshop.speaker_slug}
        format={workshop.format}
        topics={workshop.topics}
      />

      {/* Hero Header Image - Full width banner style */}
      {workshop.thumbnail_url && (
        <section className="relative w-full h-64 md:h-80 lg:h-96 bg-gray-100">
          <Image
            src={workshop.thumbnail_url}
            alt={workshop.title}
            fill
            className="object-cover"
            style={{ objectPosition: workshop.thumbnail_position || 'center' }}
            priority
            sizes="100vw"
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </section>
      )}

      {/* Hero Section - Content below header image */}
      <section className="bg-gradient-to-br from-[#EAEAEE] to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="p-8 rounded-xl bg-white shadow-xl">
                <div className="flex gap-2 mb-4">
                  <Badge variant="default" className="capitalize">
                    {workshop.format}
                  </Badge>
                  {workshop.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1 fill-yellow-800" />
                      Featured
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  {workshop.title}
                </h1>

                {workshop.short_description && (
                  <p className="text-xl text-gray-600 mb-6">{workshop.short_description}</p>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 mb-8">
                  {workshop.duration_minutes && (
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="font-medium">{workshop.duration_minutes} minutes</span>
                    </div>
                  )}
                  {workshop.target_audience && (
                    <div className="flex items-center text-gray-700">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="font-medium">{workshop.target_audience}</span>
                    </div>
                  )}
                  {workshop.max_participants && (
                    <div className="flex items-center text-gray-700">
                      <Award className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="font-medium">Max {workshop.max_participants} participants</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Speaker & CTA */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Workshop Facilitator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {workshop.speaker_name ? (
                    <>
                      <Link href={`/speakers/${workshop.speaker_slug}`} className="block group">
                        <div className="flex items-center gap-4 mb-4">
                          {workshop.speaker_headshot && (
                            <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all">
                              <Image
                                src={workshop.speaker_headshot}
                                alt={workshop.speaker_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">
                              {workshop.speaker_name}
                            </h3>
                            <p className="text-sm text-gray-600">{workshop.speaker_one_liner || "Workshop Facilitator"}</p>
                            {workshop.speaker_location && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {workshop.speaker_location}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                      <Link href={`/speakers/${workshop.speaker_slug}`}>
                        <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                          View Speaker Profile
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <p className="text-gray-500">Instructor to be assigned</p>
                  )}

                  {/* Pricing Tiers or Legacy Price Range */}
                  {workshop.pricing_tiers && workshop.pricing_tiers.length > 0 ? (
                    <div className="py-4 border-t border-b">
                      <p className="text-sm text-gray-600 mb-3">Fee Options</p>
                      <div className="space-y-3">
                        {workshop.pricing_tiers.map((tier, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-900">{tier.name}</p>
                                <p className="text-xs text-gray-500">{tier.duration}</p>
                              </div>
                              <p className="text-lg font-bold text-[#1E68C6]">{tier.price}</p>
                            </div>
                            {tier.description && (
                              <p className="text-xs text-gray-600 mt-1">{tier.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : workshop.price_range && !hasMultipleFormats ? (
                    <div className="py-4 border-t border-b">
                      <p className="text-sm text-gray-600 mb-1">Fee</p>
                      <p className="text-2xl font-bold text-gray-900">{workshop.price_range}</p>
                    </div>
                  ) : hasMultipleFormats ? (
                    <div className="py-4 border-t border-b">
                      <p className="text-sm text-gray-600 mb-1">Fee</p>
                      <p className="text-lg font-semibold text-gray-900">See format options below</p>
                      <p className="text-xs text-gray-500 mt-1">Pricing varies by workshop length</p>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <Link href={`/contact?workshop=${workshop.id}`}>
                      <Button className="w-full font-bold" size="lg" variant="gold">
                        Request This Workshop
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-500 text-center">
                      Fully customizable for your organization
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-10">
              {/* Description */}
              {workshop.description && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Workshop</h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    {workshop.description.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlight Videos */}
              {workshop.video_urls && workshop.video_urls.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Workshop Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {workshop.video_urls.map((videoUrl, index) => {
                      // Extract video ID from YouTube or Vimeo URLs
                      let embedUrl = ""
                      if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
                        const videoId = videoUrl.includes("youtu.be")
                          ? videoUrl.split("youtu.be/")[1]?.split("?")[0]
                          : videoUrl.split("v=")[1]?.split("&")[0]
                        embedUrl = `https://www.youtube.com/embed/${videoId}`
                      } else if (videoUrl.includes("vimeo.com")) {
                        const videoId = videoUrl.split("vimeo.com/")[1]?.split("?")[0]
                        embedUrl = `https://player.vimeo.com/video/${videoId}`
                      } else {
                        embedUrl = videoUrl
                      }

                      return (
                        <div key={index} className="relative w-full pb-[56.25%] rounded-xl overflow-hidden shadow-lg">
                          <iframe
                            src={embedUrl}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Learning Objectives */}
              {workshop.learning_objectives && workshop.learning_objectives.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                    <Target className="h-8 w-8 mr-3 text-blue-600" />
                    Learning Objectives
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workshop.learning_objectives.map((objective, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <p className="text-gray-800">{objective}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {workshop.key_takeaways && workshop.key_takeaways.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                    <Award className="h-8 w-8 mr-3 text-amber-600" />
                    Key Takeaways
                  </h2>
                  <ul className="space-y-3">
                    {workshop.key_takeaways.map((takeaway, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-amber-600 font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-gray-800 text-lg">{takeaway}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Format Options */}
              {workshop.agenda && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                    <BookOpen className="h-8 w-8 mr-3 text-[#1E68C6]" />
                    Workshop Formats & Options
                  </h2>

                  {/* Parse and display agenda as structured cards */}
                  <div className="space-y-6">
                    {workshop.agenda.split('\n\n').map((section, sectionIndex) => {
                      const lines = section.split('\n').filter(line => line.trim())
                      if (lines.length === 0) return null

                      const title = lines[0]
                      const isFeatured = title.includes('FEATURED') || title.includes('Most Popular')
                      const isMainHeading = title === title.toUpperCase() && !title.includes(':')

                      if (isMainHeading && lines.length === 1) {
                        // Section header with gradient styling
                        return (
                          <div key={sectionIndex} className="mt-12 mb-6">
                            <div className="flex items-center">
                              <div className="flex-grow h-px bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300"></div>
                              <h3 className="px-6 text-xl font-bold text-gray-700 uppercase tracking-wide">
                                {title}
                              </h3>
                              <div className="flex-grow h-px bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300"></div>
                            </div>
                          </div>
                        )
                      }

                      // Workshop offering card with enhanced styling
                      return (
                        <Card
                          key={sectionIndex}
                          className={`${
                            isFeatured
                              ? 'border-2 border-[#1E68C6] shadow-2xl bg-gradient-to-br from-blue-50 via-white to-amber-50 hover:shadow-blue-200 transition-all duration-300'
                              : 'border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300'
                          }`}
                        >
                          <CardHeader className={`${isFeatured ? 'bg-gradient-to-r from-[#1E68C6] to-blue-700 text-white' : 'bg-gray-50'} relative overflow-hidden`}>
                            {isFeatured && (
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                            )}
                            <div className="flex items-start justify-between relative z-10">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`p-2 rounded-lg ${isFeatured ? 'bg-white/20' : 'bg-blue-100'}`}>
                                    <BookOpen className={`h-6 w-6 ${isFeatured ? 'text-white' : 'text-blue-600'}`} />
                                  </div>
                                  <CardTitle className={`text-xl ${isFeatured ? 'text-white' : 'text-gray-900'}`}>
                                    {title.replace('FEATURED WORKSHOP:', '').replace(/\([^)]*\)/g, '').trim()}
                                  </CardTitle>
                                </div>
                                {title.match(/\(([^)]+)\)/) && (
                                  <div className="flex gap-2 mt-3">
                                    {title.match(/\(([^)]+)\)/)?.[1].split('-').map((badge, i) => (
                                      <Badge
                                        key={i}
                                        className={`${
                                          isFeatured
                                            ? 'bg-white text-blue-600 hover:bg-white/90'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        } text-xs font-semibold`}
                                      >
                                        {badge.trim()}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {isFeatured && (
                                <Badge className="bg-yellow-400 text-yellow-900 ml-3 flex items-center gap-1 font-bold">
                                  <Star className="h-3 w-3 fill-yellow-900" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-6 pb-6">
                            <div className="space-y-3">
                              {lines.slice(1).map((line, lineIndex) => {
                                const isBullet = line.startsWith('•') || line.startsWith('-')
                                return (
                                  <div key={lineIndex} className="flex items-start gap-3">
                                    {isBullet && (
                                      <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isFeatured ? 'text-blue-600' : 'text-green-600'}`} />
                                    )}
                                    <p className={`${isBullet ? 'flex-1' : ''} text-gray-700 leading-relaxed text-base`}>
                                      {line.replace(/^[•\-]\s*/, '')}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Prerequisites */}
              {workshop.prerequisites && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Prerequisites</h2>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
                    <p className="text-gray-800">{workshop.prerequisites}</p>
                  </div>
                </div>
              )}

              {/* Materials Included */}
              {workshop.materials_included && workshop.materials_included.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Materials Included</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {workshop.materials_included.map((material, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-gray-800">{material}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Topics */}
              {workshop.topics && workshop.topics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Topics Covered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {workshop.topics.map((topic, index) => (
                        <Badge key={index} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customization */}
              {workshop.customizable && (
                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Target className="h-5 w-5" />
                      Fully Customizable
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-700 mb-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span>Tailored to your industry</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span>Scaled for team size</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span>Adjusted for skill level</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span>Flexible scheduling</span>
                      </li>
                    </ul>
                    <Link href={`/contact?workshop=${workshop.id}`} className="block">
                      <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-100">
                        Discuss Customization
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* ROI Stats */}
              {workshop.roi_stats && Object.keys(workshop.roi_stats).length > 0 && (
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-900">
                      <Award className="h-5 w-5" />
                      Return on Investment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(workshop.roi_stats).map(([key, value], index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                          <p className="text-sm text-gray-600 mb-1">{key}</p>
                          <p className="text-2xl font-bold text-green-700">{value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Images Gallery */}
      {workshop.image_urls && workshop.image_urls.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Workshop Gallery
              </h2>
              <p className="text-xl text-gray-600">
                See the workshop in action
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshop.image_urls.map((imageUrl, index) => (
                <div key={index} className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gray-50">
                  <Image
                    src={imageUrl}
                    alt={`Workshop image ${index + 1}`}
                    fill
                    className="object-contain p-2 hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Combined Testimonials & Logos Section - Side by side when both have < 3 items */}
      {workshop.testimonials && workshop.testimonials.length > 0 &&
       workshop.client_logos && workshop.client_logos.length > 0 &&
       workshop.testimonials.length < 3 && workshop.client_logos.length < 3 ? (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Testimonials Column */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center lg:text-left">
                  What Participants Say
                </h2>
                <div className="space-y-4">
                  {workshop.testimonials.map((testimonial, index) => (
                    <Card key={index} className="bg-white">
                      <CardContent className="pt-6">
                        <div className="flex text-yellow-400 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-700 italic mb-4 text-sm">
                          "{testimonial.quote}"
                        </p>
                        <div className="flex items-center gap-3">
                          {testimonial.photo_url && (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden">
                              <Image
                                src={testimonial.photo_url}
                                alt={testimonial.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-gray-900 font-semibold text-sm">{testimonial.name}</p>
                            {testimonial.role && (
                              <p className="text-xs text-gray-600">
                                {testimonial.role}
                                {testimonial.company && ` at ${testimonial.company}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Client Logos Column */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center lg:text-left">
                  Trusted By
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {workshop.client_logos.map((logoUrl, index) => (
                    <div key={index} className="flex items-center justify-center p-6 bg-white rounded-lg shadow-sm">
                      <img
                        src={logoUrl}
                        alt={`Client logo ${index + 1}`}
                        className="max-h-16 max-w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Testimonials Section - Full width when 3+ items or logos missing */}
          {workshop.testimonials && workshop.testimonials.length > 0 && (
            <section className="py-16 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Employee & Participant Testimonials
                  </h2>
                  <p className="text-xl text-gray-600">
                    Hear from past workshop participants
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workshop.testimonials.map((testimonial, index) => (
                    <Card key={index} className="bg-white">
                      <CardContent className="pt-6">
                        <div className="mb-4">
                          <div className="flex text-yellow-400 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 fill-current" />
                            ))}
                          </div>
                          <p className="text-gray-700 italic mb-4">
                            "{testimonial.quote}"
                          </p>
                          <div className="flex items-center gap-3 mt-4">
                            {testimonial.photo_url && (
                              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                <Image
                                  src={testimonial.photo_url}
                                  alt={testimonial.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-gray-900 font-semibold">{testimonial.name}</p>
                              {testimonial.role && (
                                <p className="text-sm text-gray-600">
                                  {testimonial.role}
                                  {testimonial.company && ` at ${testimonial.company}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Client Logos Section - Full width when 3+ items or testimonials missing */}
          {workshop.client_logos && workshop.client_logos.length > 0 && (
            <section className="py-16 bg-white border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Trusted by Leading Organizations
                  </h2>
                  <p className="text-xl text-gray-600">
                    Companies that have chosen this workshop
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-8 items-center">
                  {workshop.client_logos.map((logoUrl, index) => (
                    <div key={index} className="flex items-center justify-center p-6">
                      <img
                        src={logoUrl}
                        alt={`Client logo ${index + 1}`}
                        className="max-h-20 w-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#1E68C6] to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Team?</h2>
          <p className="text-xl mb-8 opacity-90">
            Book this workshop for your organization and equip your team with cutting-edge AI knowledge.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/contact?workshop=${workshop.id}`}>
              <Button size="lg" variant="gold" className="font-bold">
                Request This Workshop
              </Button>
            </Link>
            <Link href="/ai-workshops">
              <Button size="lg" variant="outline" className="font-semibold bg-transparent text-white border-white hover:bg-white hover:text-[#1E68C6]">
                Browse All Workshops
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

// Generate static params for all workshop slugs
export async function generateStaticParams() {
  try {
    const { getActiveWorkshops } = await import("@/lib/workshops-db")
    const workshops = await getActiveWorkshops()

    return workshops.map((workshop) => ({
      slug: workshop.slug,
    }))
  } catch (error) {
    console.error("Error generating static params for workshops:", error)
    // Return empty array to allow dynamic rendering as fallback
    return []
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const workshop = await getWorkshopBySlug(slug)

  if (!workshop) {
    return {
      title: "Workshop Not Found",
    }
  }

  return {
    title: workshop.meta_title || `${workshop.title} | AI Workshop | Speak About AI`,
    description: workshop.meta_description || workshop.short_description || workshop.description?.substring(0, 160),
    keywords: workshop.keywords?.join(", ") || workshop.topics?.join(", "),
  }
}

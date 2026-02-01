"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getFeaturedSpeakers, type Speaker } from "@/lib/speakers-data"
import { SpeakerCard } from "@/components/speaker-card"

interface FeaturedSpeakersProps {
  initialSpeakers?: Speaker[]
  title?: string
  subtitle?: string
  ctaText?: string
}

export default function FeaturedSpeakers({
  initialSpeakers,
  title = "Featured AI Keynote Speakers",
  subtitle = "World-class artificial intelligence experts, machine learning pioneers, and tech visionaries who are shaping the future of AI across every industry.",
  ctaText = "View All AI Speakers"
}: FeaturedSpeakersProps) {
  const [speakers, setSpeakers] = useState<Speaker[]>(
    Array.isArray(initialSpeakers) ? initialSpeakers.filter((s) => s && s.slug) : [], // Filter on init
  )
  const [loading, setLoading] = useState(!initialSpeakers)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!initialSpeakers) {
      getFeaturedSpeakers(8)
        .then((data) => {
          // Filter out speakers without a slug or that are null/undefined
          const validSpeakers = Array.isArray(data) ? data.filter((s) => s && s.slug) : []
          setSpeakers(validSpeakers)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Failed to load featured speakers:", err)
          setError(true)
          setSpeakers([])
          setLoading(false)
        })
    } else {
      // Ensure initialSpeakers are also filtered if provided directly
      setSpeakers(Array.isArray(initialSpeakers) ? initialSpeakers.filter((s) => s && s.slug) : [])
      setLoading(false)
    }
  }, [initialSpeakers])

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-black mb-4 font-neue-haas">{title}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat mb-8">
            Loading our world-class speakers...
          </p>
        </div>
      </section>
    )
  }

  if (error || speakers.length === 0) {
    // speakers is now guaranteed to be an array of valid items or empty
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-black mb-4 font-neue-haas">{title}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat mb-8">
            {error
              ? "Unable to load speakers at the moment. Please try again later."
              : "No featured speakers available at this time."}
          </p>
          {error && ( // Only show "View All" if it was an error, not if there are just no featured speakers
            <Link
              href="/speakers"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-11 px-8 border border-[#1E68C6] text-[#1E68C6] hover:bg-[#1E68C6] hover:text-white transition-colors mt-4"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Very subtle dot pattern background */}
      <div className="absolute inset-0 opacity-[0.01]" style={{ backgroundImage: "radial-gradient(circle, #1E68C6 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-4 font-neue-haas">{title}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* speakers array is already filtered to ensure s and s.slug exist */}
          {speakers.map((speaker) => (
            <SpeakerCard
              key={speaker.slug} // slug is guaranteed here
              speaker={speaker}
              contactSource="featured_speakers"
              maxTopicsToShow={2}
            />
          ))}
        </div>

        <div className="text-center">
          <Button
            asChild
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-11 px-8 bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-montserrat"
          >
            <Link href="/speakers" className="text-white no-underline">
              {ctaText}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

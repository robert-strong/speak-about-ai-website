"use client"

import { useEffect } from "react"
import { SpeakerCard } from "@/components/speaker-card"

interface Speaker {
  [key: string]: any
}

interface TechnologyClientPageProps {
  speakers: Speaker[]
}

export default function TechnologyClientPage({ speakers }: TechnologyClientPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Technology AI Keynote Speakers</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Book world-class technology and AI experts for your next event. Our speakers are at the forefront of
            technological innovation.
          </p>
        </div>
      </section>

      {/* Speakers Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {speakers.map((speaker, index) => (
              <SpeakerCard key={index} speaker={speaker} />
            ))}
          </div>

          {speakers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No technology speakers found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

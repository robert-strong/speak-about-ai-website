"use client"

import { Users } from "lucide-react"
import type { Speaker } from "@/lib/speakers-data"
import { SpeakerCard } from "@/components/speaker-card"

interface SpeakerSimilarSpeakersProps {
  similarSpeakers: Speaker[]
  currentSpeakerName: string
}

export function SpeakerSimilarSpeakers({ similarSpeakers, currentSpeakerName }: SpeakerSimilarSpeakersProps) {
  // Don't render anything if no speakers
  if (!similarSpeakers || similarSpeakers.length === 0) {
    return null
  }

  return (
    <section className="mb-12 mt-12">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="w-8 h-8 mr-3 text-[#1E68C6]" />
          You May Also Like
        </h2>
        <p className="text-gray-600 mt-2">
          Other exceptional AI speakers you might be interested in
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarSpeakers.map((speaker) => (
          <SpeakerCard
            key={speaker.slug}
            speaker={speaker}
            contactSource={`similar-to-${currentSpeakerName.toLowerCase().replace(/\s+/g, '-')}`}
          />
        ))}
      </div>
    </section>
  )
}

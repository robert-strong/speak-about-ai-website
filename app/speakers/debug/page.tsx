"use client"

import { useState, useEffect } from "react"
import { getAllSpeakers } from "@/lib/speakers-data"
import Link from "next/link"

export default function SpeakersDebugPage() {
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSpeakers() {
      try {
        const speakersData = await getAllSpeakers()
        setSpeakers(speakersData)
      } catch (error) {
        console.error("Error loading speakers:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSpeakers()
  }, [])

  if (loading) {
    return <div className="p-8">Loading speakers...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Available Speaker URLs</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded">
        <p className="text-blue-800">
          <strong>Note:</strong> The correct URL for Peter Norvig is <code>/speakers/peter-norvig</code> (not
          peter-norvig-headshot)
        </p>
      </div>

      <div className="grid gap-4">
        {speakers.map((speaker) => (
          <div key={speaker.slug} className="border p-4 rounded">
            <h3 className="font-bold">{speaker.name}</h3>
            <p className="text-gray-600 mb-2">{speaker.title}</p>
            <div className="space-y-1">
              <p>
                <strong>Slug:</strong> <code>{speaker.slug}</code>
              </p>
              <p>
                <strong>Correct URL:</strong>
                <Link href={`/speakers/${speaker.slug}`} className="text-blue-600 hover:underline ml-2">
                  /speakers/{speaker.slug}
                </Link>
              </p>
              <p>
                <strong>Image:</strong> <code>{speaker.image}</code>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h2 className="font-bold mb-2">Common Issues:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Make sure you're using the speaker's slug, not their image filename</li>
          <li>Speaker slugs are typically lowercase with hyphens (e.g., "peter-norvig")</li>
          <li>Image filenames often include "-headshot" but URLs don't</li>
        </ul>
      </div>
    </div>
  )
}

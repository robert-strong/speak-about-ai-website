"use client"

import { useState, useEffect } from "react"
import { getSpeakerBySlug, getAllSpeakers } from "@/lib/speakers-data"

export default function DebugPage() {
  const [peter, setPeter] = useState(null)
  const [allSpeakers, setAllSpeakers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const peterData = await getSpeakerBySlug("peter-norvig")
        const speakersData = await getAllSpeakers()
        setPeter(peterData)
        setAllSpeakers(speakersData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Speaker Debug Page</h1>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Peter Norvig Data:</h2>
        {peter ? (
          <div>
            <p>
              <strong>Name:</strong> {peter.name}
            </p>
            <p>
              <strong>Image Path:</strong> {peter.image}
            </p>
            <p>
              <strong>Image Test:</strong>
            </p>
            <div className="border p-4 mb-4">
              <img
                src={peter.image || "/placeholder.svg"}
                alt={peter.name}
                className="h-64 object-cover"
                onError={() => console.error(`Failed to load image: ${peter.image}`)}
              />
            </div>
            <p>
              <strong>Placeholder Test:</strong>
            </p>
            <div className="border p-4">
              <img src="/placeholder.svg?height=300&width=300" alt="Placeholder" className="h-64 object-cover" />
            </div>
          </div>
        ) : (
          <p className="text-red-500">Peter Norvig data not found!</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">All Speakers Data Source:</h2>
        <pre className="bg-gray-100 p-4 overflow-auto max-h-96">{JSON.stringify(allSpeakers, null, 2)}</pre>
      </div>
    </div>
  )
}

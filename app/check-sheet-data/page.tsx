"use client"

import { useState } from "react"
import { fetchSpeakersFromSheet } from "@/app/actions/google-sheets"

export default function CheckSheetDataPage() {
  const [sheetData, setSheetData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSheetData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSpeakersFromSheet()
      console.log("Raw sheet data:", data)
      setSheetData(data)
    } catch (err) {
      console.error("Error loading sheet data:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const missingLocalSpeakers = [
    {
      name: "Katie McMahon",
      slug: "katie-mcmahon",
      expectedImage: "/speakers/Katie-McMahon-Headshot.jpeg",
    },
    {
      name: "Gopi Kallayil",
      slug: "gopi-kallayil",
      expectedImage: "/speakers/gopi-kallayil-headshot.jpg",
    },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Google Sheet Data Check</h1>

      <div className="mb-6">
        <button
          onClick={loadSheetData}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load Google Sheet Data"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {sheetData.length > 0 && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-300 rounded p-4">
            <h2 className="text-xl font-bold mb-2">✅ Google Sheet Connected Successfully</h2>
            <p>Found {sheetData.length} speakers in the sheet</p>
          </div>

          {/* Missing Speakers Analysis */}
          <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
            <h2 className="text-xl font-bold mb-4">🔍 Missing Speakers Analysis</h2>
            {missingLocalSpeakers.map((speaker) => {
              const foundInSheet = sheetData.find(
                (s) => s.slug === speaker.slug || s.name?.toLowerCase() === speaker.name.toLowerCase(),
              )

              return (
                <div key={speaker.slug} className="mb-4 p-3 border rounded">
                  <h3 className="font-bold">{speaker.name}</h3>
                  <p className="text-sm">
                    <strong>Expected slug:</strong> {speaker.slug}
                  </p>
                  <p className="text-sm">
                    <strong>Found in sheet:</strong> {foundInSheet ? "✅ Yes" : "❌ No"}
                  </p>
                  {foundInSheet && (
                    <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                      <strong>Sheet data:</strong>
                      <pre>{JSON.stringify(foundInSheet, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Adam Cheyer Analysis */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <h2 className="text-xl font-bold mb-4">🔍 Adam Cheyer Image Analysis</h2>
            {(() => {
              const adamInSheet = sheetData.find(
                (s) => s.slug === "adam-cheyer" || s.name?.toLowerCase().includes("adam cheyer"),
              )
              return (
                <div className="p-3 border rounded">
                  <h3 className="font-bold">Adam Cheyer</h3>
                  <p className="text-sm">
                    <strong>Found in sheet:</strong> {adamInSheet ? "✅ Yes" : "❌ No"}
                  </p>
                  {adamInSheet && (
                    <div className="mt-2">
                      <p className="text-sm">
                        <strong>Image URL in sheet:</strong> {adamInSheet.image || "Not set"}
                      </p>
                      <div className="mt-2 text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">
                        <strong>Full sheet data:</strong>
                        <pre>{JSON.stringify(adamInSheet, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* All Speakers List */}
          <div>
            <h2 className="text-xl font-bold mb-4">📋 All Speakers in Sheet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sheetData.map((speaker, index) => (
                <div key={index} className="border p-3 rounded text-sm">
                  <h3 className="font-bold">{speaker.name || "No name"}</h3>
                  <p>
                    <strong>Slug:</strong> {speaker.slug || "No slug"}
                  </p>
                  <p>
                    <strong>Image:</strong> {speaker.image ? "✅ Set" : "❌ Missing"}
                  </p>
                  <p>
                    <strong>Listed:</strong> {speaker.listed ? "✅ Yes" : "❌ No"}
                  </p>
                  {speaker.image && (
                    <p className="text-xs break-all mt-1">
                      <strong>URL:</strong> {speaker.image}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {sheetData.length === 0 && !loading && !error && (
        <div className="bg-gray-50 border border-gray-300 rounded p-4">
          <p>Click "Load Google Sheet Data" to check your sheet connection and data.</p>
        </div>
      )}
    </div>
  )
}

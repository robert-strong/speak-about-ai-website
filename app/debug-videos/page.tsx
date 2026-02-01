"use client"

import { useState } from "react"
import { fetchSpeakersFromSheet } from "@/app/actions/google-sheets"
import { fetchRawSheetData } from "@/app/actions/debug-sheets"
import { Button } from "@/components/ui/button"

export default function DebugVideosPage() {
  const [speakerData, setSpeakerData] = useState<any>(null)
  const [rawSheetData, setRawSheetData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null)

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch raw sheet data
      const rawResult = await fetchRawSheetData()
      if (!rawResult.success) {
        throw new Error(rawResult.error || "Failed to fetch raw sheet data")
      }
      setRawSheetData(rawResult)

      // Fetch processed speaker data
      const speakers = await fetchSpeakersFromSheet()
      setSpeakerData(speakers)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const speakerDetails = selectedSpeaker ? speakerData?.find((s: any) => s.slug === selectedSpeaker) : null

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Enhanced Video Data Debug Tool</h1>

      <Button onClick={fetchAllData} disabled={loading} className="mb-8 bg-blue-600 hover:bg-blue-700">
        {loading ? "Loading..." : "Fetch All Data"}
      </Button>

      {error && (
        <div className="p-4 mb-8 bg-red-100 border border-red-300 rounded text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {rawSheetData && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Raw Google Sheet Data</h2>

          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold text-blue-800">Sheet Statistics</h3>
            <p>Total Rows: {rawSheetData.totalRows}</p>
            <p>Total Headers: {rawSheetData.headers.length}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Column Headers</h3>
            <div className="bg-white p-4 rounded border">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                {rawSheetData.headers.map((header: string, index: number) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      header.toLowerCase().includes("video") || header.toLowerCase().includes("testimonial")
                        ? "bg-green-100 border border-green-300"
                        : "bg-gray-100"
                    }`}
                  >
                    <strong>Col {index}:</strong> "{header}"
                    {(header.toLowerCase().includes("video") || header.toLowerCase().includes("testimonial")) && (
                      <div className="text-xs text-green-700 font-semibold">← TARGET COLUMN</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Sample Row Data (First Speaker)</h3>
            <div className="bg-white p-4 rounded border max-h-60 overflow-auto">
              <div className="space-y-2">
                {rawSheetData.headers.map((header: string, index: number) => (
                  <div key={index} className="flex">
                    <div className="w-32 font-semibold text-sm">{header}:</div>
                    <div className="flex-1 text-sm break-all">{rawSheetData.sampleRow[index] || "(empty)"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Show videos and testimonials columns specifically */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rawSheetData.headers.map((header: string, index: number) => {
              if (header.toLowerCase().includes("video") || header.toLowerCase().includes("testimonial")) {
                return (
                  <div key={index} className="bg-white p-4 rounded border">
                    <h4 className="font-semibold text-green-700 mb-2">
                      Column: "{header}" (Index: {index})
                    </h4>
                    <div className="text-sm bg-gray-50 p-2 rounded max-h-40 overflow-auto">
                      <strong>Raw Value:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{rawSheetData.sampleRow[index] || "(empty)"}</pre>
                    </div>
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      )}

      {speakerData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Processed Speakers</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {speakerData.map((speaker: any) => (
                <div
                  key={speaker.slug}
                  className={`p-3 rounded cursor-pointer ${
                    selectedSpeaker === speaker.slug
                      ? "bg-blue-100 border border-blue-300"
                      : "bg-white border hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedSpeaker(speaker.slug)}
                >
                  <div className="font-semibold">{speaker.name}</div>
                  <div className="text-sm text-gray-500">
                    Videos: {speaker.videos?.length || 0} | Testimonials: {speaker.testimonials?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            {speakerDetails ? (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">{speakerDetails.name}</h2>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Videos Data</h3>
                  {speakerDetails.videos && speakerDetails.videos.length > 0 ? (
                    <div className="space-y-4">
                      {speakerDetails.videos.map((video: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded border">
                          <div>
                            <strong>ID:</strong> {video.id || "Missing"}
                          </div>
                          <div>
                            <strong>Title:</strong> {video.title || "Missing"}
                          </div>
                          <div>
                            <strong>URL:</strong> {video.url || "Missing"}
                          </div>
                          <div>
                            <strong>Source:</strong> {video.source || "Not specified"}
                          </div>
                          <div>
                            <strong>Duration:</strong> {video.duration || "Not specified"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 border border-yellow-200 rounded">
                      <p className="text-yellow-800">No videos data found for this speaker.</p>
                      <p className="text-sm mt-2">Raw videos value: {JSON.stringify(speakerDetails.videos)}</p>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Testimonials Data</h3>
                  {speakerDetails.testimonials && speakerDetails.testimonials.length > 0 ? (
                    <div className="space-y-4">
                      {speakerDetails.testimonials.map((testimonial: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded border">
                          <div>
                            <strong>Quote:</strong> {testimonial.quote || "Missing"}
                          </div>
                          <div>
                            <strong>Author:</strong> {testimonial.author || "Missing"}
                          </div>
                          <div>
                            <strong>Company:</strong> {testimonial.company || "Missing"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 border border-yellow-200 rounded">
                      <p className="text-yellow-800">No testimonials data found for this speaker.</p>
                      <p className="text-sm mt-2">
                        Raw testimonials value: {JSON.stringify(speakerDetails.testimonials)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 bg-gray-50 p-4 rounded">
                  <h3 className="text-lg font-semibold mb-2">Complete Raw Speaker Data</h3>
                  <pre className="text-xs overflow-auto max-h-[400px] bg-gray-100 p-2 rounded">
                    {JSON.stringify(speakerDetails, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-500">Select a speaker to view their data</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-2">Debug Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Click "Fetch All Data" to load the sheet data</li>
          <li>Check the "Column Headers" section to see if you have "videos" or "testimonials" columns</li>
          <li>Look for green-highlighted columns that contain "video" or "testimonial" in the name</li>
          <li>Check the "Sample Row Data" to see the actual content in those columns</li>
          <li>Open browser console (F12) to see detailed parsing logs</li>
          <li>Select a speaker from the list to see their processed data</li>
        </ol>
      </div>
    </div>
  )
}

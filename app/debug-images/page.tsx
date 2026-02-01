"use client"

import { useState, useEffect } from "react"
import { getAllSpeakers, getFeaturedSpeakers, type Speaker } from "@/lib/speakers-data"

export default function DebugImagesPage() {
  const [allSpeakers, setAllSpeakers] = useState<Speaker[]>([])
  const [featuredSpeakers, setFeaturedSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)
  const [imageTests, setImageTests] = useState<Record<string, any>>({})

  useEffect(() => {
    async function loadData() {
      try {
        console.log("Loading speakers data for comparison...")

        const [all, featured] = await Promise.all([getAllSpeakers(), getFeaturedSpeakers(8)])

        console.log("All speakers loaded:", all.length)
        console.log("Featured speakers loaded:", featured.length)

        setAllSpeakers(all)
        setFeaturedSpeakers(featured)

        // Test image loading for problematic speakers
        const problematicSpeakers = ["katie-mcmahon", "gopi-kallayil", "adam-cheyer", "peter-norvig"]
        const tests: Record<string, any> = {}

        for (const speakerSlug of problematicSpeakers) {
          const allSpeaker = all.find((s) => s.slug === speakerSlug)
          const featuredSpeaker = featured.find((s) => s.slug === speakerSlug)

          tests[speakerSlug] = {
            foundInAll: !!allSpeaker,
            foundInFeatured: !!featuredSpeaker,
            allImageUrl: allSpeaker?.image,
            featuredImageUrl: featuredSpeaker?.image,
            urlsMatch: allSpeaker?.image === featuredSpeaker?.image,
            allSpeakerData: allSpeaker,
            featuredSpeakerData: featuredSpeaker,
          }
        }

        setImageTests(tests)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const testImageLoad = (url: string, speakerName: string) => {
    return new Promise((resolve) => {
      const img = new Image()
      const startTime = Date.now()

      img.onload = () => {
        const loadTime = Date.now() - startTime
        console.log(`✅ Image loaded for ${speakerName}: ${url} (${loadTime}ms)`)
        resolve({ success: true, loadTime, url })
      }

      img.onerror = (error) => {
        const loadTime = Date.now() - startTime
        console.error(`❌ Image failed for ${speakerName}: ${url} (${loadTime}ms)`, error)
        resolve({ success: false, loadTime, url, error })
      }

      img.crossOrigin = "anonymous"
      img.src = url
    })
  }

  const runImageTests = async () => {
    console.log("Running comprehensive image tests...")

    for (const [speakerSlug, data] of Object.entries(imageTests)) {
      if (data.allImageUrl) {
        console.log(`\n🧪 Testing ${speakerSlug}:`)
        console.log(`URL: ${data.allImageUrl}`)

        // Test direct load
        await testImageLoad(data.allImageUrl, speakerSlug)

        // Test with cache busting
        await testImageLoad(`${data.allImageUrl}?t=${Date.now()}`, `${speakerSlug} (cache-bust)`)

        // Test with different parameters
        if (data.allImageUrl.includes("blob.vercel-storage.com")) {
          await testImageLoad(`${data.allImageUrl}?retry=1&cache=false`, `${speakerSlug} (retry params)`)
        }
      }
    }
  }

  if (loading) {
    return <div className="p-8">Loading debug data...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Image Loading Debug Page</h1>

      <div className="mb-8">
        <button onClick={runImageTests} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Run Image Load Tests
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Data Comparison */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Data Source Comparison</h2>
          <div className="space-y-4">
            {Object.entries(imageTests).map(([slug, data]) => (
              <div key={slug} className="border p-4 rounded">
                <h3 className="font-bold text-lg mb-2">{slug}</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Found in All:</strong> {data.foundInAll ? "✅" : "❌"}
                  </p>
                  <p>
                    <strong>Found in Featured:</strong> {data.foundInFeatured ? "✅" : "❌"}
                  </p>
                  <p>
                    <strong>URLs Match:</strong> {data.urlsMatch ? "✅" : "❌"}
                  </p>

                  {data.allImageUrl && (
                    <div className="mt-2">
                      <p>
                        <strong>All Speakers URL:</strong>
                      </p>
                      <code className="text-xs bg-gray-100 p-1 rounded block break-all">{data.allImageUrl}</code>
                    </div>
                  )}

                  {data.featuredImageUrl && data.featuredImageUrl !== data.allImageUrl && (
                    <div className="mt-2">
                      <p>
                        <strong>Featured URL:</strong>
                      </p>
                      <code className="text-xs bg-gray-100 p-1 rounded block break-all">{data.featuredImageUrl}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Tests */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Visual Image Tests</h2>
          <div className="space-y-4">
            {Object.entries(imageTests).map(([slug, data]) => (
              <div key={slug} className="border p-4 rounded">
                <h3 className="font-bold text-lg mb-2">{slug}</h3>

                {data.allImageUrl && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-2">Direct Image Load Test:</p>
                    <div className="border p-2 bg-gray-50">
                      <img
                        src={data.allImageUrl || "/placeholder.svg"}
                        alt={`${slug} test`}
                        className="w-32 h-32 object-cover rounded"
                        onLoad={() => console.log(`✅ Visual test passed for ${slug}`)}
                        onError={() => console.error(`❌ Visual test failed for ${slug}`)}
                      />
                    </div>
                    <p className="text-xs mt-1 break-all">{data.allImageUrl}</p>
                  </div>
                )}

                {data.allImageUrl && data.allImageUrl.includes("blob.vercel-storage.com") && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-2">Cache-Busted Test:</p>
                    <div className="border p-2 bg-gray-50">
                      <img
                        src={`${data.allImageUrl}?debug=1&t=${Date.now()}`}
                        alt={`${slug} cache-bust test`}
                        className="w-32 h-32 object-cover rounded"
                        onLoad={() => console.log(`✅ Cache-bust test passed for ${slug}`)}
                        onError={() => console.error(`❌ Cache-bust test failed for ${slug}`)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Data Dump */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Raw Speaker Data</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-bold mb-2">All Speakers (first 10)</h3>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(allSpeakers.slice(0, 10), null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Featured Speakers</h3>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(featuredSpeakers, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Network Information */}
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">Debugging Instructions:</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Open browser DevTools (F12)</li>
          <li>Go to Console tab to see detailed logs</li>
          <li>Go to Network tab and filter by "Img"</li>
          <li>Click "Run Image Load Tests" button</li>
          <li>Compare the network requests and console logs</li>
          <li>Check if any images show different status codes or CORS errors</li>
        </ol>
      </div>
    </div>
  )
}

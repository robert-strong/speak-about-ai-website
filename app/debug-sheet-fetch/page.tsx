"use client"

import { useState } from "react"
import { fetchSpeakersFromSheet } from "@/app/actions/google-sheets"

export default function DebugSheetFetchPage() {
  const [rawData, setRawData] = useState<any>(null)
  const [processedData, setProcessedData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testDirectGoogleSheetsAPI = async () => {
    setLoading(true)
    setError(null)
    setLogs([])

    addLog("Starting direct Google Sheets API test...")

    // Get environment variables from the server via API route
    const envResponse = await fetch("/api/debug-env")
    const envData = await envResponse.json()
    const spreadsheetId = envData.sheetId
    const apiKey = envData.apiKey

    addLog(`Sheet ID: ${spreadsheetId || "Not available"}`)
    addLog(`API Key: ${apiKey ? `${apiKey.substring(0, 10)}...` : "Not found"}`)

    try {
      // Test different ranges to see what data we can get
      const ranges = ["Speakers!A:Z", "Sheet1!A:Z", "A:Z", "Speakers!A1:Z1000"]

      for (const range of ranges) {
        addLog(`Testing range: ${range}`)

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`

        try {
          const response = await fetch(url)
          addLog(`Response status for ${range}: ${response.status}`)

          if (response.ok) {
            const data = await response.json()
            addLog(`Success with range ${range}! Found ${data.values?.length || 0} rows`)

            if (data.values && data.values.length > 0) {
              setRawData(data)
              addLog(`Headers: ${JSON.stringify(data.values[0])}`)
              addLog(`Total rows: ${data.values.length}`)

              // Look for Katie and Gopi specifically
              const katieRow = data.values.find((row: string[]) =>
                row.some((cell) => cell && cell.toLowerCase().includes("katie")),
              )
              const gopiRow = data.values.find((row: string[]) =>
                row.some((cell) => cell && cell.toLowerCase().includes("gopi")),
              )

              addLog(`Katie found in raw data: ${katieRow ? "YES" : "NO"}`)
              addLog(`Gopi found in raw data: ${gopiRow ? "YES" : "NO"}`)

              if (katieRow) addLog(`Katie row: ${JSON.stringify(katieRow)}`)
              if (gopiRow) addLog(`Gopi row: ${JSON.stringify(gopiRow)}`)

              break // Stop after first successful range
            }
          } else {
            const errorText = await response.text()
            addLog(`Error with range ${range}: ${errorText}`)
          }
        } catch (rangeError) {
          addLog(`Exception with range ${range}: ${rangeError}`)
        }
      }
    } catch (err) {
      addLog(`Overall error: ${err}`)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testServerAction = async () => {
    setLoading(true)
    setError(null)
    setLogs([])

    addLog("Testing server action fetchSpeakersFromSheet...")

    try {
      const speakers = await fetchSpeakersFromSheet()
      addLog(`Server action returned ${speakers.length} speakers`)

      setProcessedData(speakers)

      // Look for Katie and Gopi
      const katie = speakers.find((s: any) => s.name?.toLowerCase().includes("katie") || s.slug?.includes("katie"))
      const gopi = speakers.find((s: any) => s.name?.toLowerCase().includes("gopi") || s.slug?.includes("gopi"))

      addLog(`Katie found in processed data: ${katie ? "YES" : "NO"}`)
      addLog(`Gopi found in processed data: ${gopi ? "YES" : "NO"}`)

      if (katie) addLog(`Katie data: ${JSON.stringify(katie)}`)
      if (gopi) addLog(`Gopi data: ${JSON.stringify(gopi)}`)

      // Show all speaker names for reference
      const allNames = speakers.map((s: any) => s.name).filter(Boolean)
      addLog(`All speaker names: ${JSON.stringify(allNames)}`)
    } catch (err) {
      addLog(`Server action error: ${err}`)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const clearCache = () => {
    // Force a cache clear by adding a timestamp
    addLog("Attempting to clear cache...")
    window.location.href = window.location.href + "?t=" + Date.now()
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Debug Google Sheet Fetch</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={testDirectGoogleSheetsAPI}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Direct API"}
        </button>

        <button
          onClick={testServerAction}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Server Action"}
        </button>

        <button onClick={clearCache} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
          Clear Cache & Reload
        </button>
      </div>

      {/* Environment Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="font-bold mb-2">Environment Info:</h2>
        <p>Current time: {new Date().toISOString()}</p>
        <p>User agent: {typeof window !== "undefined" ? window.navigator.userAgent : "Server"}</p>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Debug Logs:</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Raw Data */}
      {rawData && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Raw Google Sheets Data:</h2>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
            <pre className="text-xs">{JSON.stringify(rawData, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Processed Data */}
      {processedData.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Processed Speaker Data:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedData.map((speaker, index) => (
              <div key={index} className="border p-3 rounded text-sm">
                <h3 className="font-bold">{speaker.name || "No name"}</h3>
                <p>
                  <strong>Slug:</strong> {speaker.slug || "No slug"}
                </p>
                <p>
                  <strong>Listed:</strong> {speaker.listed ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Image:</strong> {speaker.image ? "Set" : "Missing"}
                </p>
                {speaker.image && (
                  <p className="text-xs break-all">
                    <strong>Image URL:</strong> {speaker.image}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Troubleshooting Guide */}
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">Troubleshooting Checklist:</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Check if Katie McMahon and Gopi Kallayil appear in the raw data</li>
          <li>Verify their row data has all required fields (name, slug, listed=TRUE)</li>
          <li>Check if there are any empty rows or formatting issues</li>
          <li>Ensure the sheet is published to the web</li>
          <li>Verify the sheet name is "Speakers" or adjust the range</li>
          <li>Check for any special characters or hidden characters in the data</li>
          <li>Try clearing the cache and reloading</li>
        </ol>
      </div>
    </div>
  )
}

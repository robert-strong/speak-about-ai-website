"use client"

import { useState } from "react"

export default function DebugSheetDetailedPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDetailedTest = async () => {
    setLoading(true)
    setResults(null)

    try {
      // Get environment variables from the server
      const envResponse = await fetch("/api/debug-env")
      const envData = await envResponse.json()

      console.log("Environment data:", envData)

      if (!envData.sheetId || !envData.apiKey) {
        setResults({
          error: "Missing environment variables",
          details: envData,
        })
        return
      }

      // Test the exact API call
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${envData.sheetId}/values/Speakers!A:Z?key=${envData.apiKey}`

      console.log("Making API call to:", apiUrl.replace(envData.apiKey, "API_KEY_HIDDEN"))

      const response = await fetch(apiUrl)
      const responseText = await response.text()

      console.log("Raw response:", responseText)

      if (!response.ok) {
        setResults({
          error: `API Error: ${response.status}`,
          details: responseText,
          url: apiUrl.replace(envData.apiKey, "API_KEY_HIDDEN"),
        })
        return
      }

      const data = JSON.parse(responseText)

      if (!data.values || data.values.length === 0) {
        setResults({
          error: "No data returned from sheet",
          details: data,
          url: apiUrl.replace(envData.apiKey, "API_KEY_HIDDEN"),
        })
        return
      }

      // Analyze the data
      const headers = data.values[0]
      const rows = data.values.slice(1)

      console.log("Headers:", headers)
      console.log("Total rows:", rows.length)

      // Look for Katie and Gopi with detailed analysis
      const katieAnalysis = analyzeRow(headers, rows, "katie")
      const gopiAnalysis = analyzeRow(headers, rows, "gopi")
      const adamAnalysis = analyzeRow(headers, rows, "adam cheyer")

      // Check for common issues
      const issues = []

      // Check for empty rows
      const emptyRows = rows.filter((row: any[]) => row.every((cell) => !cell || cell.trim() === ""))
      if (emptyRows.length > 0) {
        issues.push(`Found ${emptyRows.length} completely empty rows`)
      }

      // Check for rows with missing critical data
      const nameIndex = headers.findIndex((h: string) => h.toLowerCase().includes("name"))
      const slugIndex = headers.findIndex((h: string) => h.toLowerCase().includes("slug"))
      const listedIndex = headers.findIndex((h: string) => h.toLowerCase().includes("listed"))

      if (nameIndex === -1) issues.push("No 'name' column found")
      if (slugIndex === -1) issues.push("No 'slug' column found")
      if (listedIndex === -1) issues.push("No 'listed' column found")

      setResults({
        success: true,
        totalRows: rows.length,
        headers,
        katieAnalysis,
        gopiAnalysis,
        adamAnalysis,
        issues,
        sampleRows: rows.slice(0, 5), // First 5 rows for inspection
        columnIndexes: {
          name: nameIndex,
          slug: slugIndex,
          listed: listedIndex,
        },
      })
    } catch (error) {
      console.error("Test error:", error)
      setResults({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      })
    } finally {
      setLoading(false)
    }
  }

  const analyzeRow = (headers: string[], rows: any[][], searchTerm: string) => {
    const nameIndex = headers.findIndex((h: string) => h.toLowerCase().includes("name"))
    const slugIndex = headers.findIndex((h: string) => h.toLowerCase().includes("slug"))
    const listedIndex = headers.findIndex((h: string) => h.toLowerCase().includes("listed"))
    const imageIndex = headers.findIndex((h: string) => h.toLowerCase().includes("image"))

    // Find rows that might match
    const matchingRows = rows.filter((row: any[]) => {
      const nameMatch = row[nameIndex]?.toLowerCase().includes(searchTerm.toLowerCase())
      const slugMatch = row[slugIndex]?.toLowerCase().includes(searchTerm.toLowerCase())
      return nameMatch || slugMatch
    })

    return {
      searchTerm,
      found: matchingRows.length > 0,
      matchingRows: matchingRows.map((row: any[], index: number) => ({
        rowIndex: rows.indexOf(row) + 2, // +2 because of header row and 0-based index
        name: row[nameIndex] || "MISSING",
        slug: row[slugIndex] || "MISSING",
        listed: row[listedIndex] || "MISSING",
        image: row[imageIndex] || "MISSING",
        fullRow: row,
      })),
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Detailed Sheet Analysis</h1>

      <button
        onClick={runDetailedTest}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50 mb-8"
      >
        {loading ? "Analyzing..." : "Run Detailed Analysis"}
      </button>

      {results && (
        <div className="space-y-6">
          {results.error ? (
            <div className="p-4 bg-red-100 border border-red-300 rounded">
              <h2 className="font-bold text-red-800 mb-2">Error:</h2>
              <p className="text-red-700">{results.error}</p>
              {results.details && (
                <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                  {JSON.stringify(results.details, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="p-4 bg-green-100 border border-green-300 rounded">
                <h2 className="font-bold text-green-800 mb-2">✅ Successfully Connected to Sheet</h2>
                <p>Found {results.totalRows} data rows</p>
                <p>Headers: {results.headers.length} columns</p>
              </div>

              {/* Issues */}
              {results.issues.length > 0 && (
                <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
                  <h2 className="font-bold text-yellow-800 mb-2">⚠️ Potential Issues:</h2>
                  <ul className="list-disc pl-5">
                    {results.issues.map((issue: string, index: number) => (
                      <li key={index} className="text-yellow-700">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Column Analysis */}
              <div className="p-4 bg-blue-100 border border-blue-300 rounded">
                <h2 className="font-bold text-blue-800 mb-2">📊 Column Analysis:</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Name column:</strong>{" "}
                    {results.columnIndexes.name >= 0 ? `Column ${results.columnIndexes.name + 1}` : "Not found"}
                  </div>
                  <div>
                    <strong>Slug column:</strong>{" "}
                    {results.columnIndexes.slug >= 0 ? `Column ${results.columnIndexes.slug + 1}` : "Not found"}
                  </div>
                  <div>
                    <strong>Listed column:</strong>{" "}
                    {results.columnIndexes.listed >= 0 ? `Column ${results.columnIndexes.listed + 1}` : "Not found"}
                  </div>
                </div>
                <div className="mt-2">
                  <strong>All headers:</strong> {results.headers.join(", ")}
                </div>
              </div>

              {/* Speaker Analysis */}
              {[results.katieAnalysis, results.gopiAnalysis, results.adamAnalysis].map(
                (analysis: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 border rounded ${analysis.found ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}
                  >
                    <h2 className={`font-bold mb-2 ${analysis.found ? "text-green-800" : "text-red-800"}`}>
                      {analysis.found ? "✅" : "❌"} {analysis.searchTerm.toUpperCase()} Analysis:
                    </h2>

                    {analysis.found ? (
                      <div className="space-y-2">
                        {analysis.matchingRows.map((row: any, rowIndex: number) => (
                          <div key={rowIndex} className="bg-white p-3 rounded border">
                            <p>
                              <strong>Row {row.rowIndex}:</strong>
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <strong>Name:</strong> {row.name}
                              </div>
                              <div>
                                <strong>Slug:</strong> {row.slug}
                              </div>
                              <div>
                                <strong>Listed:</strong> {row.listed}
                              </div>
                              <div>
                                <strong>Image:</strong> {row.image ? "Set" : "Missing"}
                              </div>
                            </div>
                            {row.image && (
                              <div className="mt-2 text-xs">
                                <strong>Image URL:</strong> <span className="break-all">{row.image}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-700">No rows found matching "{analysis.searchTerm}"</p>
                    )}
                  </div>
                ),
              )}

              {/* Sample Data */}
              <div className="p-4 bg-gray-100 border border-gray-300 rounded">
                <h2 className="font-bold text-gray-800 mb-2">📋 First 5 Rows (Sample):</h2>
                <div className="overflow-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        {results.headers.map((header: string, index: number) => (
                          <th key={index} className="border p-1 bg-gray-200">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.sampleRows.map((row: any[], index: number) => (
                        <tr key={index}>
                          {results.headers.map((_: string, cellIndex: number) => (
                            <td key={cellIndex} className="border p-1">
                              {row[cellIndex] || ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

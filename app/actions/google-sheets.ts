"use server"

import type { Speaker } from "@/lib/speakers-data"

// Helper function to attempt to fix common JSON syntax errors
function attemptJsonFix(jsonString: string): string {
  let fixed = jsonString.trim()

  // Remove wrapping quotes if present
  if (fixed.startsWith('"') && fixed.endsWith('"')) {
    fixed = fixed.slice(1, -1)
  }

  // Fix double quotes from Google Sheets
  if (fixed.includes('""')) {
    fixed = fixed.replace(/""/g, '"')
  }

  // Replace control characters with spaces
  fixed = fixed
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")

  // Clean up multiple spaces
  fixed = fixed.replace(/\s+/g, " ")

  // Try to fix common JSON syntax issues
  // Fix missing commas between objects/arrays
  fixed = fixed.replace(/}\s*{/g, "},{")
  fixed = fixed.replace(/]\s*\[/g, "],[")
  fixed = fixed.replace(/}\s*\[/g, "},[")
  fixed = fixed.replace(/]\s*{/g, "],{")

  // Fix trailing commas
  fixed = fixed.replace(/,\s*}/g, "}")
  fixed = fixed.replace(/,\s*]/g, "]")

  // Fix missing quotes around property names (basic attempt)
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')

  return fixed
}

// Helper function to safely parse JSON with multiple fallback strategies
function safeJsonParse(jsonString: string, speakerName: string, fieldName: string): any[] {
  if (!jsonString || typeof jsonString !== "string" || jsonString.trim() === "") {
    console.log(`No ${fieldName} data found for ${speakerName} (empty or null value)`)
    return []
  }

  const originalString = jsonString
  console.log(`\n=== Parsing ${fieldName} for ${speakerName} ===`)
  console.log(`Original length: ${originalString.length}`)
  console.log(`First 300 chars: ${originalString.substring(0, 300)}`)

  // Strategy 1: Try with basic cleaning
  try {
    const cleaned = attemptJsonFix(jsonString)
    console.log(`Strategy 1 - Cleaned (first 300 chars): ${cleaned.substring(0, 300)}`)

    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      console.log(`✅ Strategy 1 succeeded: ${parsed.length} items`)
      return parsed
    } else {
      console.log(`⚠️ Strategy 1: Not an array, got ${typeof parsed}`)
      return []
    }
  } catch (error) {
    console.log(`❌ Strategy 1 failed: ${error.message}`)
  }

  // Strategy 2: Try parsing original with minimal changes
  try {
    let minimal = jsonString.trim()
    if (minimal.startsWith('"') && minimal.endsWith('"')) {
      minimal = minimal.slice(1, -1)
    }
    if (minimal.includes('""')) {
      minimal = minimal.replace(/""/g, '"')
    }

    console.log(`Strategy 2 - Minimal (first 300 chars): ${minimal.substring(0, 300)}`)
    const parsed = JSON.parse(minimal)
    if (Array.isArray(parsed)) {
      console.log(`✅ Strategy 2 succeeded: ${parsed.length} items`)
      return parsed
    }
  } catch (error) {
    console.log(`❌ Strategy 2 failed: ${error.message}`)
  }

  // Strategy 3: Extract array content and try to fix it
  try {
    const arrayMatch = jsonString.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      let extracted = arrayMatch[0]
      extracted = attemptJsonFix(extracted)

      console.log(`Strategy 3 - Extracted (first 300 chars): ${extracted.substring(0, 300)}`)
      const parsed = JSON.parse(extracted)
      if (Array.isArray(parsed)) {
        console.log(`✅ Strategy 3 succeeded: ${parsed.length} items`)
        return parsed
      }
    }
  } catch (error) {
    console.log(`❌ Strategy 3 failed: ${error.message}`)
  }

  // Strategy 4: Try to manually parse as individual objects
  try {
    console.log(`Strategy 4 - Manual object parsing`)

    // Look for individual objects within the string
    const objectMatches = jsonString.match(/{[^{}]*}/g)
    if (objectMatches && objectMatches.length > 0) {
      const parsedObjects = []

      for (let i = 0; i < objectMatches.length; i++) {
        try {
          let objStr = objectMatches[i]
          objStr = attemptJsonFix(objStr)
          const obj = JSON.parse(objStr)
          parsedObjects.push(obj)
        } catch (objError) {
          console.log(`Failed to parse object ${i}: ${objError.message}`)
        }
      }

      if (parsedObjects.length > 0) {
        console.log(`✅ Strategy 4 succeeded: ${parsedObjects.length} objects`)
        return parsedObjects
      }
    }
  } catch (error) {
    console.log(`❌ Strategy 4 failed: ${error.message}`)
  }

  // Strategy 5: Try to create a simple structure from key-value pairs
  try {
    console.log(`Strategy 5 - Simple structure creation`)

    // If it looks like it might contain quote and author info, try to extract that
    if (jsonString.includes("quote") || jsonString.includes("author") || jsonString.includes("company")) {
      // This is a very basic attempt to extract testimonial-like data
      const simpleTestimonial = {
        id: `${speakerName.toLowerCase().replace(/\s+/g, "")}_testimonial_1`,
        quote: "Testimonial data needs to be properly formatted in JSON",
        author: "Data Entry Required",
        company: "",
        role: "",
      }

      console.log(`✅ Strategy 5 created fallback testimonial`)
      return [simpleTestimonial]
    }
  } catch (error) {
    console.log(`❌ Strategy 5 failed: ${error.message}`)
  }

  // All strategies failed
  console.error(`🚫 All parsing strategies failed for ${speakerName} ${fieldName}`)
  console.error(`Raw data: "${originalString}"`)

  // Show detailed character analysis for debugging
  const problemChars = []
  for (let i = 0; i < Math.min(originalString.length, 50); i++) {
    const char = originalString[i]
    const code = char.charCodeAt(0)
    if (code < 32 || code > 126) {
      problemChars.push(`pos ${i}: '${char}' (${code})`)
    }
  }
  if (problemChars.length > 0) {
    console.error(`Problem characters: ${problemChars.join(", ")}`)
  }

  return []
}

export async function fetchSpeakersFromSheet(): Promise<Speaker[]> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  // Early return if environment variables are not set
  if (!spreadsheetId || !apiKey) {
    console.warn("Google Sheet ID or API Key is not set. Falling back to local data.")
    return []
  }

  const range = "Speakers!A:Z"
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`

  try {
    console.log("Attempting to fetch data from Google Sheet...")

    const response = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch data from Google Sheet: ${response.status} - ${errorText}`)
      return []
    }

    const data = await response.json()
    const values = data.values

    if (!values || values.length === 0) {
      console.log("No data found in Google Sheet.")
      return []
    }

    const headers = values[0]
    console.log("Headers found:", headers.length, "columns")

    const rows = values.slice(1)

    const speakers: Speaker[] = rows
      .map((row: string[], rowIndex: number) => {
        try {
          const speaker: Partial<Speaker> = {}
          const nameIndex = headers.findIndex((header) => header.replace(/\s/g, "").toLowerCase() === "name")
          const speakerName = row[nameIndex] || `Row ${rowIndex + 2}`

          headers.forEach((header: string, index: number) => {
            const key = header.replace(/\s/g, "").toLowerCase()
            let value: any = row[index]

            // Type conversions
            if (value === "TRUE") {
              value = true
            } else if (value === "FALSE") {
              value = false
            } else if (key === "ranking") {
              value = Number.parseInt(value, 10) || 0
            }
            // Handle array fields
            else if (key === "expertise") {
              value = value ? value.split(",").map((s: string) => s.trim()) : []
              ;(speaker as any)["expertise"] = value
              return
            } else if (key === "topics") {
              value = value ? value.split(",").map((s: string) => s.trim()) : []
              ;(speaker as any)["programs"] = value
              return
            } else if (key.includes("industries")) {
              value = value ? value.split(",").map((s: string) => s.trim()) : []
              ;(speaker as any)["industries"] = value
              return
            } else if (key.includes("programs")) {
              value = value ? value.split(",").map((s: string) => s.trim()) : []
              ;(speaker as any)["programs"] = value
              return
            }
            // Handle JSON fields
            else if (key === "videos" || key === "video" || key.includes("video")) {
              value = safeJsonParse(value, speakerName, "videos")

              // Process YouTube thumbnails
              if (Array.isArray(value)) {
                value = value.map((video) => {
                  if (
                    video.url &&
                    video.url.includes("youtube.com/watch?v=") &&
                    (!video.thumbnail || video.thumbnail === video.url)
                  ) {
                    const videoId = video.url.split("v=")[1]?.split("&")[0]
                    if (videoId) {
                      video.thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                    }
                  }
                  return video
                })
              }
              ;(speaker as any)["videos"] = value
              return
            } else if (key === "testimonials" || key === "testimonial" || key.includes("testimonial")) {
              value = safeJsonParse(value, speakerName, "testimonials")
              ;(speaker as any)["testimonials"] = value
              return
            }
            // Generic assignment
            ;(speaker as any)[key] = value
          })

          // Create final speaker object with defaults
          const finalSpeaker = {
            slug: speaker.slug || "",
            name: speaker.name || "Unknown Speaker",
            title: speaker.title || "",
            image: speaker.image || "/placeholder.svg",
            bio: speaker.bio || "",
            programs: speaker.programs || [],
            fee: speaker.fee || "Please Inquire",
            location: speaker.location || "",
            linkedin: speaker.linkedin || "",
            website: speaker.website || "",
            email: speaker.email || "",
            contact: speaker.contact || "",
            listed: speaker.listed !== undefined ? speaker.listed : true,
            expertise: speaker.expertise || [],
            industries: speaker.industries || [],
            ranking: speaker.ranking || 0,
            imagePosition: speaker.imageposition || "center",
            imageOffsetY: speaker.imageoffsety || "0%",
            videos: speaker.videos || [],
            testimonials: speaker.testimonials || [],
          } as Speaker

          return finalSpeaker
        } catch (rowError) {
          console.error("Error processing speaker row:", rowError)
          return null
        }
      })
      .filter((speaker): speaker is Speaker => speaker !== null)

    const sortedSpeakers = speakers.sort((a, b) => b.ranking - a.ranking)
    console.log(`Successfully processed ${sortedSpeakers.length} speakers`)

    return sortedSpeakers
  } catch (error) {
    console.error("Error fetching speakers from Google Sheet:", error)
    return []
  }
}

import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { event, speakers, budget } = await request.json()

    if (!speakers || speakers.length === 0) {
      return NextResponse.json(
        { error: "No speakers available to suggest from" },
        { status: 400 }
      )
    }

    // Build event context
    const eventContext = [
      event.title && `Event: ${event.title}`,
      event.type && `Type: ${event.type}`,
      event.company && `Company: ${event.company}`,
      event.description && `Description: ${event.description}`,
      event.location && `Location: ${event.location}`,
      event.attendee_count && `Attendees: ${event.attendee_count}`,
      budget && `Budget: $${budget.toLocaleString()}`
    ].filter(Boolean).join("\n")

    // Build speaker catalog
    const speakerCatalog = speakers.map((s: any, i: number) => {
      return `${i + 1}. ${s.name}
   Title: ${s.title || 'N/A'}
   Topics: ${(s.topics || s.primary_topics || []).join(", ") || 'N/A'}
   Bio snippet: ${(s.bio || s.shortBio || '').slice(0, 200)}...`
    }).join("\n\n")

    const prompt = `You are an expert speaker bureau agent. Given the event details below, recommend the TOP 5 most relevant speakers from the catalog.

EVENT DETAILS:
${eventContext || "No event details provided - suggest versatile speakers"}

SPEAKER CATALOG:
${speakerCatalog}

For each recommended speaker, provide:
1. Speaker name (exactly as shown)
2. A brief reason (1-2 sentences) why they're perfect for this event

Return your response as JSON array:
[
  {"name": "Speaker Name", "reason": "Why they're perfect for this event"},
  ...
]

Only return the JSON array, no other text.`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Could not parse suggestions")
    }

    const suggestions = JSON.parse(jsonMatch[0])

    // Match suggestions with full speaker data
    const enrichedSuggestions = suggestions.map((suggestion: any) => {
      const speaker = speakers.find((s: any) =>
        s.name.toLowerCase() === suggestion.name.toLowerCase()
      )

      if (speaker) {
        return {
          ...speaker,
          suggestion_reason: suggestion.reason
        }
      }
      return null
    }).filter(Boolean)

    return NextResponse.json({ suggestions: enrichedSuggestions })
  } catch (error) {
    console.error("Error suggesting speakers:", error)
    return NextResponse.json(
      { error: "Failed to generate speaker suggestions" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { speaker, event } = await request.json()

    if (!speaker?.name) {
      return NextResponse.json(
        { error: "Speaker name is required" },
        { status: 400 }
      )
    }

    const prompt = `Generate ONE compelling sentence (maximum 25 words) explaining why ${speaker.name} is the perfect speaker for this event.

Speaker Information:
- Name: ${speaker.name}
- Title: ${speaker.title || 'Not provided'}
- Bio: ${speaker.bio || 'Not provided'}
- Topics: ${speaker.topics?.join(', ') || 'Not provided'}

Event Information:
- Event Title: ${event.title || 'Not provided'}
- Event Type: ${event.type || 'Not provided'}
- Company: ${event.company || 'Not provided'}
- Description: ${event.description || 'Not provided'}

Requirements:
- ONE sentence only
- Maximum 25 words
- Focus on the speaker's expertise matching the event needs
- Be specific and compelling
- Do not use phrases like "perfect fit" or "ideal choice" - be more creative
- Start directly with the reason, no preamble

Return ONLY the sentence, nothing else.`

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const relevance = message.content[0].type === "text"
      ? message.content[0].text.trim()
      : ""

    return NextResponse.json({ relevance })
  } catch (error) {
    console.error("Error generating relevance:", error)
    return NextResponse.json(
      { error: "Failed to generate relevance text" },
      { status: 500 }
    )
  }
}

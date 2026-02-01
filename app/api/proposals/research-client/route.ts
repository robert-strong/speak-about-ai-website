import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { client_name, client_company, client_email, event_title } = await request.json()

    if (!client_company && !client_name) {
      return NextResponse.json(
        { error: "Please provide at least a client name or company" },
        { status: 400 }
      )
    }

    // Extract domain from email if available
    const emailDomain = client_email ? client_email.split('@')[1] : null

    const prompt = `You are a professional business research assistant. Research and provide information about this client/company for a speaking engagement proposal.

CLIENT DETAILS:
- Name: ${client_name || 'Not provided'}
- Company: ${client_company || 'Not provided'}
- Email domain: ${emailDomain || 'Not provided'}
- Event: ${event_title || 'Not provided'}

Please research and provide:
1. Company website URL (best guess based on company name/email domain)
2. Company LinkedIn URL (format: https://linkedin.com/company/company-name)
3. Person's LinkedIn URL - construct based on their name (format: https://linkedin.com/in/firstname-lastname, all lowercase, no spaces)
4. Person's likely role/title based on typical event planners
5. Brief company description (1-2 sentences about what they do)
6. Industry/sector
7. Approximate company size (startup, SMB, enterprise, etc.)
8. Any relevant context for a speaking engagement (e.g., if they're a tech company interested in AI, their potential AI use cases)

Return your response as JSON:
{
  "website": "https://example.com",
  "linkedin": "https://linkedin.com/company/example",
  "person_linkedin": "https://linkedin.com/in/firstname-lastname",
  "person_role": "Likely role/title",
  "description": "Brief description of the company",
  "industry": "Industry name",
  "company_size": "Size category",
  "speaking_context": "Why an AI speaker would be valuable for them",
  "key_topics": ["topic1", "topic2", "topic3"]
}

Only return the JSON object, no other text. If you cannot determine a field with confidence, use null for that field.`

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
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Could not parse research results")
    }

    const research = JSON.parse(jsonMatch[0])

    return NextResponse.json({ research })
  } catch (error) {
    console.error("Error researching client:", error)
    return NextResponse.json(
      { error: "Failed to research client" },
      { status: 500 }
    )
  }
}

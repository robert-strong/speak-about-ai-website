import { getAllSpeakers } from "@/lib/speakers-data"

// llms.txt — a machine-readable site guide for AI assistants (https://llmstxt.org).
// Served dynamically so the speaker roster stays current.
export const revalidate = 3600

const BASE_URL = "https://speakabout.ai"

export async function GET() {
  let speakerLines = ""
  try {
    const speakers = await getAllSpeakers()
    const clean = (value: string | undefined) => (value || "").replace(/\s+/g, " ").trim()
    speakerLines = speakers
      .filter((speaker) => speaker.listed !== false && speaker.slug && clean(speaker.name))
      .sort((a, b) => (b.ranking || 0) - (a.ranking || 0) || a.name.localeCompare(b.name))
      .map((speaker) => {
        const fee = clean(speaker.fee)
        const detail = [clean(speaker.title), fee && fee.toLowerCase() !== "please inquire" ? `fee ${fee}` : ""]
          .filter(Boolean)
          .join(" — ")
        return `- [${clean(speaker.name)}](${BASE_URL}/speakers/${speaker.slug})${detail ? `: ${detail}` : ""}`
      })
      .join("\n")
  } catch {
    speakerLines = `- [Full speaker directory](${BASE_URL}/speakers)`
  }

  const body = `# Speak About AI

> Speak About AI is the world's only AI-exclusive keynote speaker bureau. We represent 70+ vetted artificial intelligence speakers — including AI pioneers, researchers, and practitioners with backgrounds at organizations like Google, OpenAI, Stanford, and Siri — for keynotes, panels, workshops, and virtual events worldwide. Availability checks, exact quotes, and contracting are handled by our team.

Key facts:
- Based in Silicon Valley, CA; serving events worldwide
- Every speaker page lists fee range, topics, industries, testimonials, and booking FAQs
- Contact: ${BASE_URL}/contact (hello@speakabout.ai, +1-415-665-2442)

## Main pages

- [AI Speaker Directory](${BASE_URL}/speakers): All bookable AI keynote speakers with filters
- [Our Services](${BASE_URL}/our-services): How the bureau works for event organizers
- [Contact / Check Availability](${BASE_URL}/contact): Request a quote for any speaker
- [Blog & Resources](${BASE_URL}/resources): Articles on AI speakers, trends, and event planning

## Speakers by industry

- [Technology AI Keynote Speakers](${BASE_URL}/industries/technology-keynote-speakers)
- [Healthcare AI Keynote Speakers](${BASE_URL}/industries/healthcare-keynote-speakers)
- [Financial Services AI Speakers](${BASE_URL}/industries/financial-services-keynote-speakers)
- [Leadership & Business Strategy AI Speakers](${BASE_URL}/industries/leadership-business-strategy-ai-speakers)
- [Sales & Marketing AI Speakers](${BASE_URL}/industries/sales-marketing-ai-speakers)
- [Retail AI Speakers](${BASE_URL}/industries/retail-ai-speakers)
- [Manufacturing AI Speakers](${BASE_URL}/industries/manufacturing-ai-speakers)
- [Automotive AI Speakers](${BASE_URL}/industries/automotive-ai-speakers)
- [Government & Education AI Speakers](${BASE_URL}/industries/government-education-keynote-speakers)

## Speakers

${speakerLines}
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}

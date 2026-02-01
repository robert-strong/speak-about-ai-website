import { redirect, notFound } from "next/navigation"
import { getAllSpeakers } from "@/lib/speakers-data"

// Define known routes that should not be treated as speaker redirects
const KNOWN_ROUTES = [
  "blog",
  "contact",
  "speakers",
  "our-services",
  "our-team",
  "privacy",
  "terms",
  "industries",
  "ai-keynote-speakers",
  "top-ai-speakers-2025",
  "test-favicon",
  "debug",
  "admin",
  "api",
]

interface CatchAllPageProps {
  params: Promise<{ slug: string }>
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params

  // Check if this is a known route that should not be redirected
  if (KNOWN_ROUTES.includes(slug)) {
    notFound()
  }

  // Get all speakers and check if this slug matches a speaker
  const speakers = await getAllSpeakers()
  const speaker = speakers.find((s) => s.slug === slug)

  if (speaker) {
    // Redirect to the new speaker URL structure
    // Note: redirect() throws internally, so don't wrap in try-catch
    redirect(`/speakers/${slug}`)
  }

  // No speaker found with this slug, show 404
  notFound()
}

// Generate static params for known speaker slugs
export async function generateStaticParams() {
  try {
    const speakers = await getAllSpeakers()
    return speakers
      .filter((speaker) => typeof speaker.slug === 'string' && speaker.slug.trim().length > 0)
      .map((speaker) => ({
        slug: speaker.slug,
      }))
  } catch (error) {
    console.error("Error generating static params:", error)
    return []
  }
}

// Generate metadata for speaker redirects
export async function generateMetadata({ params }: CatchAllPageProps) {
  try {
    const { slug } = await params
    const speakers = await getAllSpeakers()
    const speaker = speakers.find((s) => s.slug === slug)

    if (speaker) {
      return {
        title: `${speaker.name} - AI Keynote Speaker | Speak About AI`,
        description: `Book ${speaker.name} for your next event. ${speaker.bio?.substring(0, 150) || "Expert AI keynote speaker"}...`,
        robots: {
          index: false, // Don't index redirect pages
          follow: false,
        },
      }
    }

    return {
      title: "Page Not Found | Speak About AI",
      robots: {
        index: false,
        follow: false,
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Page Not Found | Speak About AI",
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

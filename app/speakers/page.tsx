import type { Metadata } from "next"
import SpeakerDirectory from "@/components/speaker-directory"
import { getAllSpeakers, getFeaturedSpeakers, type Speaker } from "@/lib/speakers-data"
import { getPageContent, getFromContent } from "@/lib/website-content"

export async function generateMetadata(): Promise<Metadata> {
  // Get featured speakers for dynamic metadata
  let featuredSpeakers: Speaker[] = []
  try {
    featuredSpeakers = await getFeaturedSpeakers(3)
  } catch (error) {
    console.error("Failed to fetch featured speakers for metadata:", error)
  }

  // Create dynamic description with featured speaker names
  const speakerNames = featuredSpeakers
    .slice(0, 3)
    .map(s => s.name)
    .filter(Boolean)
    .join(", ")

  const description = speakerNames
    ? `Browse 70+ AI speakers including ${speakerNames}. Our expert AI speakers directory helps you find the perfect artificial intelligence keynote speaker for your event.`
    : "Browse our directory of 70+ expert AI speakers. Find top artificial intelligence keynote speakers and technology experts for your event."

  // Use the first featured speaker's image if available
  const ogImage = featuredSpeakers[0]?.image
    ? (featuredSpeakers[0].image.startsWith('http')
        ? featuredSpeakers[0].image
        : `https://speakabout.ai${featuredSpeakers[0].image}`)
    : "/hero-image.jpg"

  return {
    title: "AI Speakers Directory - 70+ Expert AI Keynote Speakers",
    description,
    keywords:
      "AI speakers, AI speakers directory, AI keynote speakers, artificial intelligence speakers, machine learning speakers, technology speakers, AI conference speakers, expert AI speakers",
    openGraph: {
      title: "AI Keynote Speakers Directory | Speak About AI",
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "AI Keynote Speakers Directory",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "AI Keynote Speakers Directory",
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: "https://speakabout.ai/speakers",
    },
  }
}

export default async function SpeakersPage() {
  // Fetch content from database
  const pageContent = await getPageContent('speakers')

  // Build content object for the directory component
  const directoryContent = {
    hero: {
      title: getFromContent(pageContent, 'speakers', 'hero', 'title'),
      subtitle: getFromContent(pageContent, 'speakers', 'hero', 'subtitle'),
    },
    filters: {
      search_placeholder: getFromContent(pageContent, 'speakers', 'filters', 'search_placeholder'),
      industry_label: getFromContent(pageContent, 'speakers', 'filters', 'industry_label'),
      all_industries: getFromContent(pageContent, 'speakers', 'filters', 'all_industries'),
      fee_label: getFromContent(pageContent, 'speakers', 'filters', 'fee_label'),
      all_fees: getFromContent(pageContent, 'speakers', 'filters', 'all_fees'),
      location_label: getFromContent(pageContent, 'speakers', 'filters', 'location_label'),
      all_locations: getFromContent(pageContent, 'speakers', 'filters', 'all_locations'),
      showing_text: getFromContent(pageContent, 'speakers', 'filters', 'showing_text'),
    },
    results: {
      loading_text: getFromContent(pageContent, 'speakers', 'results', 'loading_text'),
      no_results: getFromContent(pageContent, 'speakers', 'results', 'no_results'),
      clear_filters: getFromContent(pageContent, 'speakers', 'results', 'clear_filters'),
    },
    buttons: {
      load_more: getFromContent(pageContent, 'speakers', 'buttons', 'load_more'),
    },
  }

  let allSpeakers: Speaker[] = []
  try {
    const fullSpeakers = await getAllSpeakers()
    if (fullSpeakers.length === 0) {
      console.warn(
        "SpeakersPage: getAllSpeakers returned an empty array. This might be due to a fetch error or no data.",
      )
    }
    // Strip heavy fields to reduce HTML payload size for SEO
    // The listing page only needs summary fields, not full bios/videos/testimonials
    allSpeakers = fullSpeakers.map(({
      bio, videos, testimonials, pastEvents, publications, awards,
      clientLogos, mediaAppearances, speakingRequirements,
      ...lightSpeaker
    }) => ({
      ...lightSpeaker,
      // Keep a truncated version of bio for display
      bio: bio ? bio.substring(0, 200) + (bio.length > 200 ? '...' : '') : undefined
    }))
  } catch (error) {
    console.error("SpeakersPage: Failed to load speakers:", error)
  }

  // Generate structured data for the speakers directory
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "AI Keynote Speakers Directory",
    "description": "Browse our comprehensive directory of AI keynote speakers and artificial intelligence experts available for booking.",
    "numberOfItems": allSpeakers.length,
    "itemListElement": allSpeakers.slice(0, 10).map((speaker, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Person",
        "name": speaker.name,
        "jobTitle": speaker.title || "AI Keynote Speaker",
        "url": `https://speakabout.ai/speakers/${speaker.slug}`,
        "image": speaker.image?.startsWith('http')
          ? speaker.image
          : `https://speakabout.ai${speaker.image || '/placeholder.jpg'}`,
        "description": speaker.short_bio || speaker.bio || "",
      }
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SpeakerDirectory initialSpeakers={allSpeakers} content={directoryContent} />
    </>
  )
}

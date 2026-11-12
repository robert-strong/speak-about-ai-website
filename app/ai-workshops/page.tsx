import type { Metadata } from "next"
import WorkshopDirectory, { type Workshop as DirectoryWorkshop } from "@/components/workshop-directory"
import { getActiveWorkshops } from "@/lib/workshops-db"
import { getPageContent, getFromContent } from "@/lib/website-content"

// Force dynamic rendering to always fetch fresh workshop data
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "AI Workshops | Hands-On Training Programs",
  description:
    "Discover hands-on AI workshops led by industry experts. Interactive training programs covering machine learning, generative AI, and practical implementation strategies for your team.",
  keywords:
    "AI workshops, machine learning training, AI corporate training, hands-on AI courses, generative AI workshops, AI implementation training",
  openGraph: {
    title: "AI Workshops | Hands-On Training Programs",
    description:
      "Transform your team with immersive AI workshops led by industry pioneers. Practical, hands-on training programs tailored to your organization.",
    images: [
      {
        url: "/hero-image.jpg",
        width: 1200,
        height: 630,
        alt: "AI Workshops",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Workshops | Hands-On Training",
    description:
      "Transform your team with immersive AI workshops led by industry pioneers.",
    images: ["/hero-image.jpg"],
  },
  alternates: {
    canonical: "https://speakabout.ai/ai-workshops",
  },
}

export default async function WorkshopsPage() {
  // Fetch content and the workshop list on the server so the grid is in the
  // initial HTML. The old client-only fetch left crawlers seeing "0 workshops"
  // and Google classified the page as a Soft 404.
  const [pageContent, workshops] = await Promise.all([
    getPageContent('workshops'),
    getActiveWorkshops().catch((error) => {
      console.error('Workshops page: failed to load workshops on the server:', error)
      return null
    }),
  ])
  const initialWorkshops: DirectoryWorkshop[] | undefined = workshops
    ? workshops.map((w) => ({
        id: w.id,
        title: w.title,
        slug: w.slug,
        speaker_id: w.speaker_id,
        speaker_name: w.speaker_name,
        speaker_slug: w.speaker_slug,
        speaker_headshot: w.speaker_headshot,
        speaker_location: w.speaker_location,
        short_description: w.short_description,
        duration_minutes: w.duration_minutes,
        format: w.format,
        target_audience: w.target_audience,
        price_range: w.price_range,
        topics: w.topics,
        thumbnail_url: w.thumbnail_url,
        thumbnail_position: w.thumbnail_position,
        featured: w.featured,
        active: w.active,
      }))
    : undefined

  // Build content object for the directory component
  const directoryContent = {
    hero: {
      title: getFromContent(pageContent, 'workshops', 'hero', 'title'),
      subtitle: getFromContent(pageContent, 'workshops', 'hero', 'subtitle'),
    },
    filters: {
      search_placeholder: getFromContent(pageContent, 'workshops', 'filters', 'search_placeholder'),
      show_filters: getFromContent(pageContent, 'workshops', 'filters', 'show_filters'),
      hide_filters: getFromContent(pageContent, 'workshops', 'filters', 'hide_filters'),
      format_label: getFromContent(pageContent, 'workshops', 'filters', 'format_label'),
      all_formats: getFromContent(pageContent, 'workshops', 'filters', 'all_formats'),
      length_label: getFromContent(pageContent, 'workshops', 'filters', 'length_label'),
      all_lengths: getFromContent(pageContent, 'workshops', 'filters', 'all_lengths'),
      short_length: getFromContent(pageContent, 'workshops', 'filters', 'short_length'),
      medium_length: getFromContent(pageContent, 'workshops', 'filters', 'medium_length'),
      long_length: getFromContent(pageContent, 'workshops', 'filters', 'long_length'),
      location_label: getFromContent(pageContent, 'workshops', 'filters', 'location_label'),
      all_locations: getFromContent(pageContent, 'workshops', 'filters', 'all_locations'),
      audience_label: getFromContent(pageContent, 'workshops', 'filters', 'audience_label'),
      all_audiences: getFromContent(pageContent, 'workshops', 'filters', 'all_audiences'),
      showing_text: getFromContent(pageContent, 'workshops', 'filters', 'showing_text'),
      clear_filters: getFromContent(pageContent, 'workshops', 'filters', 'clear_filters'),
    },
    results: {
      loading_text: getFromContent(pageContent, 'workshops', 'results', 'loading_text'),
      no_results: getFromContent(pageContent, 'workshops', 'results', 'no_results'),
    },
    buttons: {
      inquire: getFromContent(pageContent, 'workshops', 'buttons', 'inquire'),
      view_details: getFromContent(pageContent, 'workshops', 'buttons', 'view_details'),
    },
  }

  return <WorkshopDirectory content={directoryContent} initialWorkshops={initialWorkshops} />
}

import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { getConferenceBySlug } from "@/lib/conferences-db"
import ConferenceDetailClient, { type ConferenceDetail } from "./conference-detail-client"

// Server-rendered so crawlers get the real content and a real 404 for unknown
// slugs. The previous client-only page returned 200 with a "Loading..." shell
// for every URL, which Search Console reports as a Soft 404.

const BASE_URL = "https://speakabout.ai"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function loadConference(slug: string): Promise<ConferenceDetail | null> {
  const conference = await getConferenceBySlug(slug)
  if (!conference) return null

  // Unpublished conferences are only visible to a logged-in admin (matches
  // the behaviour of /api/conferences/slug/[slug]).
  if (!conference.published) {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get("adminLoggedIn")?.value === "true"
    if (!isAdmin) return null
  }

  // Strip Date objects / bigint counts so the record is plain JSON for the
  // client component.
  return JSON.parse(JSON.stringify(conference)) as ConferenceDetail
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const conference = await loadConference(slug)

  if (!conference) {
    return {
      title: "Conference Not Found",
      robots: { index: false, follow: false },
    }
  }

  const where = [conference.city, conference.country].filter(Boolean).join(", ")
  const when = conference.date_display || conference.start_date
  const description =
    conference.description?.slice(0, 155) ||
    [conference.name, conference.organization, where, when].filter(Boolean).join(" - ")
  const image = conference.banner_url || conference.logo_url

  return {
    title: conference.name,
    description,
    alternates: {
      canonical: `${BASE_URL}/conference-directory/conferences/${conference.slug}`,
    },
    openGraph: {
      title: conference.name,
      description,
      url: `${BASE_URL}/conference-directory/conferences/${conference.slug}`,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ConferenceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const conference = await loadConference(slug)

  if (!conference) {
    notFound()
  }

  return <ConferenceDetailClient conference={conference} />
}

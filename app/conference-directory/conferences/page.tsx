import type { Metadata } from "next"
import { getPublishedConferences, getConferenceCategories } from "@/lib/conferences-db"
import ConferenceListClient, {
  type ConferenceSummary,
  type ConferenceCategorySummary,
} from "./conference-list-client"

// Server-rendered so the published list is in the HTML. The previous
// client-only page showed "0 Conferences / Loading..." to crawlers (the
// /api/ fetch it relied on is disallowed in robots.txt), which reads as an
// empty page.
export const revalidate = 300

export const metadata: Metadata = {
  title: "Browse Event Industry Conferences",
  description:
    "Searchable directory of event industry conferences with dates, locations, organizers and open calls for proposals.",
  alternates: {
    canonical: "https://speakabout.ai/conference-directory/conferences",
  },
}

export default async function ConferenceListingPage() {
  let conferences: ConferenceSummary[] = []
  let categories: ConferenceCategorySummary[] = []

  try {
    const [conferenceRows, categoryRows] = await Promise.all([
      getPublishedConferences(),
      getConferenceCategories(),
    ])
    // Plain JSON for the client component (drops Date objects / bigint counts)
    conferences = JSON.parse(JSON.stringify(conferenceRows))
    categories = JSON.parse(JSON.stringify(categoryRows))
  } catch (error) {
    console.error("Conference directory: failed to load initial data:", error)
  }

  return <ConferenceListClient initialConferences={conferences} initialCategories={categories} />
}

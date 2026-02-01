import { createClient, type Entry, type EntryCollection } from "contentful"
import type { LandingPage } from "@/types/contentful-landing-page"

const space = process.env.CONTENTFUL_SPACE_ID
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN

if (!space || !accessToken) {
  console.warn("Contentful credentials not found. Landing page functionality will be limited.")
}

function getClient() {
  if (!space || !accessToken) {
    return null
  }

  return createClient({
    space,
    accessToken,
  })
}

/**
 * Fetches a single landing page by its URL slug.
 * @param slug The URL slug of the page to fetch.
 */
export async function getLandingPageBySlug(slug: string): Promise<LandingPage | null> {
  const client = getClient()
  if (!client) {
    console.warn("[Contentful] Client not available - missing credentials")
    return null
  }

  try {
    const entries: EntryCollection<LandingPage> = await client.getEntries({
      content_type: "landingPage",
      "fields.urlSlug": slug,
      limit: 1,
      include: 10, // Include linked entries up to 10 levels deep
    })

    if (entries.items && entries.items.length > 0) {
      return entries.items[0].fields
    }

    console.warn(`[Contentful] No landing page found with slug: ${slug}`)
    return null
  } catch (error) {
    console.error(`[Contentful] Error fetching landing page with slug ${slug}:`, error)
    return null
  }
}

/**
 * Fetches all entries of the landingPage content type for a directory.
 */
export async function getAllLandingPages(): Promise<Entry<LandingPage>[]> {
  const client = getClient()
  if (!client) {
    console.warn("[Contentful] Client not available - missing credentials")
    return []
  }

  try {
    console.log("[Contentful] Initialising Contentful client …")
    const entries: EntryCollection<LandingPage> = await client.getEntries({
      content_type: "landingPage",
      order: ["fields.pageTitle"],
      include: 10, // Include linked entries for images and other assets
    })

    return entries.items || []
  } catch (error) {
    console.error("[Contentful] Error fetching all landing pages:", error)
    return []
  }
}

// This file acts as a clean abstraction layer over the Contentful landing page data source.
import {
  getLandingPageBySlug as _getLandingPageBySlug,
  getAllLandingPages as _getAllLandingPages,
} from "./contentful-landing-page"
import type { LandingPage } from "@/types/contentful-landing-page"
import type { Entry } from "contentful"

// Re-export the type for consistent usage across the app.
export type { LandingPage }

// Export wrapped functions to add logging or other logic.
export async function getLandingPageBySlug(slug: string): Promise<LandingPage | null> {
  try {
    return await _getLandingPageBySlug(slug)
  } catch (err) {
    console.error(`Error in getLandingPageBySlug for slug "${slug}":`, err)
    return null
  }
}

export async function getAllLandingPages(): Promise<Entry<LandingPage>[]> {
  try {
    return await _getAllLandingPages()
  } catch (err) {
    console.error("Error in getAllLandingPages:", err)
    return []
  }
}

export async function getLandingPageSlugs(): Promise<string[]> {
  try {
    const pages = await getAllLandingPages()
    return pages
      .filter(page => page.fields.urlSlug)
      .map(page => page.fields.urlSlug)
  } catch (err) {
    console.error("Error in getLandingPageSlugs:", err)
    return []
  }
}
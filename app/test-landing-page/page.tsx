import { getLandingPageBySlug } from "@/lib/contentful-landing-page"
import type { Metadata } from "next"
import { LandingPageClient } from "./landing-page-client"

// Test with the actual slug from Contentful
const TEST_SLUG = "event-planning-checklist"

export async function generateMetadata(): Promise<Metadata> {
  const pageData = await getLandingPageBySlug(TEST_SLUG)

  if (!pageData) {
    return {
      title: "Test Landing Page Not Found",
      description: "The test landing page could not be found.",
    }
  }

  return {
    title: pageData.pageTitle,
    description: pageData.metaDescription,
    alternates: {
      canonical: `https://speakabout.ai/test-landing-page`,
    },
  }
}

export default async function TestLandingPage() {
  const pageData = await getLandingPageBySlug(TEST_SLUG)

  if (!pageData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Landing Page Not Found</h1>
          <p className="text-red-700 mb-4">
            Could not find a landing page with slug: <code className="bg-red-100 px-2 py-1 rounded">{TEST_SLUG}</code>
          </p>
          <p className="text-sm text-red-600">
            Make sure you have created a landing page in Contentful with this URL slug and that it is published.
          </p>
        </div>
      </div>
    )
  }

  return <LandingPageClient pageData={pageData} />
}

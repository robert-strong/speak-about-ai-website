import { notFound } from "next/navigation"
import { getLandingPageBySlug, getLandingPageSlugs } from "@/lib/landing-page-data"
import LandingPageRenderer from "@/components/landing-page-renderer"
import type { Metadata } from "next"

interface PageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  try {
    const slugs = await getLandingPageSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch (error) {
    console.error("Error generating static params for landing pages:", error)
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getLandingPageBySlug(slug)

  if (!page) {
    return {
      title: "Page Not Found",
    }
  }

  return {
    title: page.pageTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `https://speakabout.ai/lp/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function LandingPageSlug({ params }: PageProps) {
  const { slug } = await params
  console.log(`[Landing Page] Fetching page for slug: ${slug}`)
  
  const page = await getLandingPageBySlug(slug)
  console.log(`[Landing Page] Page data:`, page ? 'Found' : 'Not found')
  
  if (!page) {
    console.log(`[Landing Page] Page not found for slug: ${slug}`)
    notFound()
  }

  console.log(`[Landing Page] Page structure:`, {
    heroHeadline: page.heroHeadline ? 'Present' : 'Missing',
    heroSubheadline: page.heroSubheadline ? 'Present' : 'Missing',
    heroBulletPoints: Array.isArray(page.heroBulletPoints) ? `Array(${page.heroBulletPoints.length})` : typeof page.heroBulletPoints,
    formFields: Array.isArray(page.formFields) ? `Array(${page.formFields.length})` : typeof page.formFields,
    howItWorksSteps: Array.isArray(page.howItWorksSteps) ? `Array(${page.howItWorksSteps.length})` : typeof page.howItWorksSteps,
    faqSection: Array.isArray(page.faqSection) ? `Array(${page.faqSection.length})` : typeof page.faqSection
  })

  return <LandingPageRenderer page={page} />
}
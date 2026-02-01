import type { MetadataRoute } from "next"
import { getAllSpeakers } from "@/lib/speakers-data"
import { getBlogPosts } from "@/lib/blog-data"
import { getAllLandingPages } from "@/lib/landing-page-data"

const BASE_URL = "https://speakabout.ai"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  
  // Get all data for dynamic pages
  const [speakers, blogPosts, landingPages] = await Promise.all([
    getAllSpeakers(),
    getBlogPosts(), // Get all published blog posts from Contentful
    getAllLandingPages() // Get all published landing pages
  ])
  
  // Main pages with high priority
  const mainPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/speakers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/top-ai-speakers-2025`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/our-services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/our-team`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ]
  
  // Industry pages with high SEO value
  const industryPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/industries/technology-keynote-speakers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/industries/healthcare-keynote-speakers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/industries/leadership-business-strategy-ai-speakers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/industries/retail-ai-speakers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/industries/manufacturing-ai-speakers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/industries/sales-marketing-ai-speakers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/industries/automotive-ai-speakers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ]
  
  // Individual speaker pages - VERY IMPORTANT FOR SEO
  const speakerPages: MetadataRoute.Sitemap = speakers.map((speaker) => ({
    url: `${BASE_URL}/speakers/${speaker.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))
  
  // Individual blog post pages from Contentful
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedDate),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))
  
  // Landing pages / tools from Contentful
  const toolPages: MetadataRoute.Sitemap = landingPages.map((page) => ({
    url: `${BASE_URL}/lp/${page.fields.urlSlug}`,
    lastModified: page.sys.updatedAt ? new Date(page.sys.updatedAt) : new Date(page.sys.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))
  
  return [...mainPages, ...industryPages, ...speakerPages, ...blogPages, ...toolPages]
}

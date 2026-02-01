import { getBlogPosts, type BlogPost } from "./blog-data"
import { getAllLandingPages, type LandingPage } from "./landing-page-data"
import type { Entry } from "contentful"

// Unified content type that both blog posts and landing pages can be converted to
export interface ContentItem {
  id: string
  type: 'blog' | 'landing'
  title: string
  excerpt: string
  slug: string
  publishedDate: string
  featuredImage?: {
    url: string
    alt?: string
  }
  categories: Array<{
    name: string
    slug: string
  }>
  author?: {
    name: string
  }
  featured?: boolean
  // Original data for type-specific rendering (optional - stripped for listing pages)
  originalData?: BlogPost | LandingPage
}

// Convert blog post to unified content item
function blogPostToContentItem(post: BlogPost): ContentItem {
  return {
    id: post.id,
    type: 'blog',
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    publishedDate: post.publishedDate,
    featuredImage: post.featuredImage,
    categories: post.categories,
    author: post.author,
    featured: post.featured,
    originalData: post
  }
}

// Convert landing page to unified content item
function landingPageToContentItem(page: Entry<LandingPage>): ContentItem {
  const fields = page.fields
  
  // Extract publish date from sys metadata, fallback to created date
  const publishedDate = page.sys.updatedAt || page.sys.createdAt
  
  return {
    id: page.sys.id,
    type: 'landing',
    title: fields.pageTitle,
    excerpt: fields.metaDescription || `Create your custom ${fields.pageTitle.toLowerCase()} with our AI-powered tool.`,
    slug: fields.urlSlug,
    publishedDate: publishedDate,
    featuredImage: fields.heroImage ? {
      url: fields.heroImage.fields.file?.url || '',
      alt: fields.heroImage.fields.description || fields.pageTitle
    } : undefined,
    categories: [{ name: 'Tools & Resources', slug: 'tools-resources' }], // Default category for landing pages
    author: { name: 'Speak About AI' },
    featured: false, // Landing pages are not featured by default
    originalData: fields
  }
}

// Fetch and combine all content types
export async function getCombinedContent(): Promise<ContentItem[]> {
  try {
    const [blogPosts, landingPages] = await Promise.all([
      getBlogPosts(),
      getAllLandingPages()
    ])

    const blogItems = blogPosts.map(blogPostToContentItem)
    const landingItems = landingPages.map(landingPageToContentItem)

    const allContent = [...blogItems, ...landingItems]
    
    // Sort by published date, newest first
    allContent.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    
    return allContent
  } catch (error) {
    console.error('Error fetching combined content:', error)
    // Fallback to just blog posts if landing pages fail
    try {
      const blogPosts = await getBlogPosts()
      return blogPosts.map(blogPostToContentItem)
    } catch (blogError) {
      console.error('Error fetching blog posts:', blogError)
      return []
    }
  }
}

// Get all unique categories from combined content
export function getCategoriesFromContent(content: ContentItem[]): Array<{name: string, slug: string}> {
  const categoryMap = new Map<string, {name: string, slug: string}>()
  
  content.forEach(item => {
    item.categories.forEach(category => {
      categoryMap.set(category.slug, category)
    })
  })
  
  return Array.from(categoryMap.values())
}
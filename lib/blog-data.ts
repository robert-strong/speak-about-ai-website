// This file acts as a clean abstraction layer over the Contentful data source.
import {
  getBlogPosts as _getPosts,
  getBlogPostBySlug as _getPostBySlug,
  getFeaturedBlogPosts as _getFeatured,
  getRelatedBlogPosts as _getRelated,
  type BlogPost,
} from "./contentful-blog"

// Re-export the type for consistent usage across the app.
export type { BlogPost }

// Define a derived category type for the UI
export interface DerivedCategory {
  slug: string
  name: string
}

// Export wrapped functions to add logging or other logic.
export async function getBlogPosts(limit?: number): Promise<BlogPost[]> {
  try {
    return await _getPosts(limit)
  } catch (err) {
    console.error("Error in getBlogPosts:", err)
    return []
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    return await _getPostBySlug(slug)
  } catch (err) {
    console.error(`Error in getBlogPostBySlug for slug "${slug}":`, err)
    return null
  }
}

export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  try {
    return await _getFeatured()
  } catch (err) {
    console.error("Error in getFeaturedBlogPosts:", err)
    return []
  }
}

export async function getRelatedBlogPosts(currentPostId: string, limit = 3): Promise<BlogPost[]> {
  try {
    return await _getRelated(currentPostId, limit)
  } catch (err) {
    console.error("Error in getRelatedBlogPosts:", err)
    return []
  }
}

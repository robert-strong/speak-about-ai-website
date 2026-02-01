"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import type { BlogPost } from "@/lib/blog-data"
import { BlogCard } from "@/components/blog-card"
import { marked } from "marked"

interface BlogPostProps {
  post: BlogPost
  relatedPosts: BlogPost[]
}

// YouTube embed component
const YouTubeEmbed = ({ videoId, title = "YouTube video" }: { videoId: string; title?: string }) => (
  <div className="aspect-video w-full max-w-4xl mx-auto my-8">
    <iframe
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${videoId}`}
      title={title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="rounded-lg shadow-lg"
    />
  </div>
)

export function BlogPostComponent({ post, relatedPosts }: BlogPostProps) {
  // Let's see what we're actually getting from Contentful
  console.log("=== DEBUG: Full post object ===")
  console.log("Post content preview:", post.content?.substring(0, 500))
  console.log("================================")

  // Convert markdown to HTML FIRST - don't preprocess
  const contentHtmlFromMarked = marked(post.content) // Renamed to avoid conflict
  console.log("=== MARKED OUTPUT ===")
  console.log("HTML from marked():", contentHtmlFromMarked)
  console.log("HTML includes iframe:", contentHtmlFromMarked.includes("iframe"))
  console.log("HTML includes youtube:", contentHtmlFromMarked.includes("youtube"))
  console.log("=== END MARKED OUTPUT ===")

  // Function to process HTML content and replace YouTube iframes
  const processYouTubeInHTML = (htmlInput: string): string => {
    // Renamed parameter
    console.log("=== PROCESSING HTML FOR YOUTUBE ===")
    console.log("Input HTML to processYouTubeInHTML:", htmlInput)

    // Now work with the HTML output from marked()
    let processedHtml = htmlInput

    // Try multiple patterns for the HTML that marked() produces
    const patterns = [
      // Standard iframe in HTML
      /<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]+)"[^>]*><\/iframe>/gi,
      // Self-closing iframe (less common but good to check)
      /<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]+)"[^>]*\/>/gi,
      // More general pattern that might catch variations iframes are wrapped in paragraphs by marked
      /<p><iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]+)"[^>]*><\/iframe><\/p>/gi,
      // General pattern for iframes that might be self-closed or have content, looking for the embed URL
      /<iframe[^>]*youtube\.com\/embed\/([A-Za-z0-9_-]+)[^>]*>(?:<\/iframe>)?/gis,
    ]

    patterns.forEach((pattern, index) => {
      const originalHtml = processedHtml
      processedHtml = processedHtml.replace(pattern, (match, videoId) => {
        console.log(`✅ HTML Pattern ${index} matched!`, { match, videoId })
        // Ensure we only return the placeholder, not surrounding <p> tags if matched by pattern 2
        return `[YOUTUBE:${videoId}]`
      })
      if (originalHtml !== processedHtml) {
        console.log(`Pattern ${index} made changes`)
      }
    })

    console.log("Final HTML after YouTube processing:", processedHtml)
    console.log("=== END HTML PROCESSING ===")
    return processedHtml
  }

  // Function to render content with YouTube embeds
  const renderContentWithYouTube = (htmlWithPlaceholders: string) => {
    // Renamed parameter
    console.log("=== RENDERING WITH YOUTUBE COMPONENTS ===")
    console.log("Input to renderContentWithYouTube:", htmlWithPlaceholders)
    // Split content by YouTube markers
    const parts = htmlWithPlaceholders.split(/\[YOUTUBE:([A-Za-z0-9_-]+)\]/g)
    console.log("Split parts:", parts)

    return parts
      .map((part, index) => {
        // Every odd index is a YouTube video ID
        if (index % 2 === 1) {
          console.log(`Rendering YouTubeEmbed for videoId: ${part}`)
          return <YouTubeEmbed key={`youtube-${index}`} videoId={part} />
        }

        // Even indices are regular HTML content
        if (part.trim()) {
          console.log(`Rendering HTML part: ${part.substring(0, 100)}...`)
          return <div key={`content-${index}`} dangerouslySetInnerHTML={{ __html: part }} />
        }
        console.log(`Skipping empty part at index ${index}`)
        return null
      })
      .filter(Boolean)
  }

  // Process the HTML to replace YouTube iframes
  const finalHtmlWithPlaceholders = processYouTubeInHTML(contentHtmlFromMarked)

  // Scroll to top when post changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [post.slug])

  return (
    <article className="container px-4 py-12 md:px-6 md:py-16">
      <Link href="/blog" className="inline-flex items-center text-[#1E68C6] hover:underline mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to all articles
      </Link>

      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{post.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readTime}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="aspect-[16/9] w-full overflow-hidden rounded-lg mb-8">
          <Image
            src={post.coverImage || "/placeholder.svg"}
            alt={post.title}
            width={1200}
            height={675}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Updated content rendering with YouTube support */}
        <div className="prose prose-blue max-w-none prose-p:mb-6 prose-headings:mt-8 prose-headings:mb-4">
          {renderContentWithYouTube(finalHtmlWithPlaceholders)}
        </div>

        <div className="mt-12 border-t pt-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 overflow-hidden rounded-full">
              <Image
                src={post.authorImage || "/placeholder-user.jpg"}
                alt={post.author}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium">{post.author}</p>
              {post.authorTitle && <p className="text-sm text-gray-500">{post.authorTitle}</p>}
            </div>
          </div>
        </div>
      </div>

      {relatedPosts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

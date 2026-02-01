"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText } from "lucide-react"
import { getBlogPostsBySpeaker, type BlogPost } from "@/lib/contentful-blog"
import { BlogCard } from "@/components/blog-card"

interface SpeakerRelatedBlogPostsProps {
  speakerName: string
  speakerSlug: string
  limit?: number
}

export function SpeakerRelatedBlogPosts({ speakerName, speakerSlug, limit = 3 }: SpeakerRelatedBlogPostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        // Try both speaker name and slug
        let results = await getBlogPostsBySpeaker(speakerName, limit)

        // If no results with name, try slug
        if (results.length === 0) {
          results = await getBlogPostsBySpeaker(speakerSlug, limit)
        }

        setPosts(results)
      } catch (error) {
        console.error("Failed to fetch related blog posts:", error)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [speakerName, speakerSlug, limit])

  // Don't render anything if loading or no posts
  if (loading || posts.length === 0) {
    return null
  }

  return (
    <section className="mb-12 mt-12">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-[#1E68C6]" />
          Featured In Our Blog
        </h2>
        <p className="text-gray-600 mt-2">
          Read articles featuring {speakerName.split(' ')[0]} and their insights on AI and technology
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {posts.length >= limit && (
        <div className="mt-6 text-center">
          <Link
            href="/blog"
            className="inline-block text-[#1E68C6] hover:underline font-semibold"
          >
            View All Blog Posts →
          </Link>
        </div>
      )}
    </section>
  )
}

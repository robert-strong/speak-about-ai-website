import Link from "next/link"
import Image from "next/image"
import { getImageUrl, formatDate } from "@/lib/utils"
import type { BlogPost } from "@/lib/contentful-blog" // Assuming BlogPost is exported from here

interface FeaturedBlogPostCardProps {
  post: BlogPost
}

export function FeaturedBlogPostCard({ post }: FeaturedBlogPostCardProps) {
  const featuredImageUrl = getImageUrl(post.featuredImage?.url)

  return (
    <article className="group relative flex flex-col md:flex-row items-center gap-8 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white overflow-hidden">
      {featuredImageUrl && (
        <div className="md:w-1/2 w-full h-64 md:h-80 relative shrink-0 overflow-hidden rounded-md">
          <Link href={`/blog/${post.slug}`} className="block w-full h-full">
            <Image
              src={featuredImageUrl || "/placeholder.svg"}
              alt={post.featuredImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority
            />
          </Link>
        </div>
      )}
      <div className="flex flex-col justify-center">
        {post.categories && post.categories.length > 0 && (
          <Link
            href={`/blog?category=${post.categories[0].slug}`} // Link to the first category
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 uppercase mb-2 self-start"
          >
            {post.categories[0].name}
          </Link>
        )}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
          <Link href={`/blog/${post.slug}`} className="hover:text-blue-700 transition-colors">
            {post.title}
          </Link>
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-3 text-base md:text-lg">{post.excerpt}</p>
        <div className="text-sm text-gray-500 mb-4">
          <span>By {post.author?.name || "Speak About AI"}</span>
          <span className="mx-2">•</span>
          <span>
            {formatDate(post.publishedDate)}
          </span>
        </div>
        <Link href={`/blog/${post.slug}`} className="text-blue-600 hover:underline font-semibold self-start text-base">
          Read article &rarr;
        </Link>
      </div>
    </article>
  )
}

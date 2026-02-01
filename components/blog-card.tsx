// Ensure BlogCard is suitable for the main grid.
// It was previously used in BlogList.
// The previous BlogClientPage used a more detailed inline card structure.
// Let's ensure BlogCard is robust.

import Link from "next/link"
import Image from "next/image"
import { getImageUrl, formatDate } from "@/lib/utils"
import type { BlogPost } from "@/lib/contentful-blog"

interface BlogCardProps {
  post: BlogPost
  featured?: boolean // Keep featured prop in case it's used for styling variations
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const featuredImageUrl = getImageUrl(post.featuredImage?.url)

  // Basic card structure, similar to what was in BlogClientPage's grid before
  return (
    <article
      className={`flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 ${
        featured ? "lg:col-span-2" : "" // Example of using featured prop for styling
      }`}
    >
      {featuredImageUrl && (
        <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] relative overflow-hidden">
          <Image
            src={featuredImageUrl || "/placeholder.svg?width=400&height=225&query=blog+thumbnail"}
            alt={post.featuredImage?.alt || post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
      )}
      <div className="p-5 md:p-6 flex flex-col flex-grow">
        <h3
          className={`font-semibold mb-2 leading-tight flex-1 ${featured ? "text-xl md:text-2xl" : "text-lg md:text-xl"}`}
        >
          <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
            {post.title}
          </Link>
        </h3>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">{post.excerpt}</p>
        <div className="text-xs text-gray-500 mb-3">
          {post.author?.name && ( // Check if author exists
            <>
              <span>By {post.author.name}</span>
              <span className="mx-1.5">•</span>
            </>
          )}
          <span>
            {formatDate(post.publishedDate)}
          </span>
        </div>
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories.slice(0, 3).map(
              (
                category, // Show up to 3 categories
              ) => (
                <Link key={category.slug} href={`/blog/category/${category.slug}`}>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-200 transition-colors">
                    {category.name}
                  </span>
                </Link>
              ),
            )}
          </div>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm text-blue-600 hover:underline font-semibold mt-auto self-start"
        >
          Read more &rarr;
        </Link>
      </div>
    </article>
  )
}

// Provide a default export for compatibility with default-import style
export default BlogCard

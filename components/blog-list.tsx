// This component is now significantly simplified.
// It just takes a list of posts and renders them in a grid.
// The BlogClientPage handles featured posts, titles, and overall layout.
import { BlogCard } from "@/components/blog-card"
import type { BlogPost } from "@/lib/contentful-blog"

interface BlogListProps {
  posts: BlogPost[]
}

export function BlogList({ posts }: BlogListProps) {
  if (!posts || posts.length === 0) {
    return <p className="text-center text-gray-500 py-10">No articles to display.</p>
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  )
}

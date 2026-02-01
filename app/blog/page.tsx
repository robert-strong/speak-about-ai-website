import BlogClientPage from "./blog-client-page"
import { getCombinedContent } from "@/lib/combined-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Insights & Tools - Expert Articles | Speak About AI",
  description:
    "Discover expert articles, cutting-edge tools, and resources for AI-powered events. Stay informed with insights from leading AI speakers.",
  alternates: {
    canonical: "https://speakabout.ai/blog"
  }
}

export default async function BlogPage() {
  // Fetch combined content (blog posts + landing pages) on the server.
  const fullContent = await getCombinedContent()

  // Strip out originalData to reduce HTML payload size
  // The listing page only needs summary fields, not full article content
  const initialContent = fullContent.map(({ originalData, ...item }) => item)

  // Render the client component, passing the lightweight data as a prop.
  return <BlogClientPage initialContent={initialContent} />
}

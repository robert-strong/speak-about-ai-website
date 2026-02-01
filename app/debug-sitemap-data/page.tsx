import { getAllSpeakers, type Speaker } from "@/lib/speakers-data"
import { getBlogPosts, type BlogPost } from "@/lib/blog-data"

export default async function DebugSitemapDataPage() {
  let speakers: Speaker[] = []
  let speakerError: string | null = null
  try {
    speakers = await getAllSpeakers()
  } catch (e: any) {
    speakerError = e.message
  }

  let blogPosts: BlogPost[] = []
  let blogPostError: string | null = null
  try {
    blogPosts = await getBlogPosts()
  } catch (e: any) {
    blogPostError = e.message
  }

  console.log("--- SPEAKERS FOR SITEMAP ---")
  console.log(speakers.slice(0, 3).map((s) => ({ slug: s.slug, lastUpdated: s.lastUpdated })))
  console.log(`Total speakers fetched: ${speakers.length}`)

  console.log("--- BLOG POSTS FOR SITEMAP ---")
  console.log(blogPosts.slice(0, 3).map((p) => ({ slug: p.slug, updatedAt: p.sys?.updatedAt })))
  console.log(`Total blog posts fetched: ${blogPosts.length}`)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Sitemap Data Verification</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Speakers Data</h2>
        {speakerError && <p className="text-red-500">Error fetching speakers: {speakerError}</p>}
        <p>Total speakers fetched: {speakers.length}</p>
        <p>Showing first 3 speakers (check console for more details):</p>
        <ul className="list-disc list-inside bg-gray-50 p-4 rounded-md dark:bg-gray-800">
          {speakers.slice(0, 3).map((speaker) => (
            <li key={speaker.slug}>
              <strong>Slug:</strong> {speaker.slug || "N/A"}, <strong>Last Updated:</strong>{" "}
              {speaker.lastUpdated ? new Date(speaker.lastUpdated).toLocaleDateString() : "N/A"}
            </li>
          ))}
          {speakers.length === 0 && !speakerError && <li>No speakers found.</li>}
        </ul>
        <details className="mt-2 text-sm">
          <summary>View raw data for first speaker (if available)</summary>
          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
            {speakers.length > 0 ? JSON.stringify(speakers[0], null, 2) : "No speaker data"}
          </pre>
        </details>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Blog Posts Data</h2>
        {blogPostError && <p className="text-red-500">Error fetching blog posts: {blogPostError}</p>}
        <p>Total blog posts fetched: {blogPosts.length}</p>
        <p>Showing first 3 blog posts (check console for more details):</p>
        <ul className="list-disc list-inside bg-gray-50 p-4 rounded-md dark:bg-gray-800">
          {blogPosts.slice(0, 3).map((post) => (
            <li key={post.slug}>
              <strong>Slug:</strong> {post.slug || "N/A"}, <strong>Updated At:</strong>{" "}
              {post.sys?.updatedAt ? new Date(post.sys.updatedAt).toLocaleDateString() : "N/A"}
            </li>
          ))}
          {blogPosts.length === 0 && !blogPostError && <li>No blog posts found.</li>}
        </ul>
        <details className="mt-2 text-sm">
          <summary>View raw data for first blog post (if available)</summary>
          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
            {blogPosts.length > 0 ? JSON.stringify(blogPosts[0], null, 2) : "No blog post data"}
          </pre>
        </details>
      </section>
    </div>
  )
}

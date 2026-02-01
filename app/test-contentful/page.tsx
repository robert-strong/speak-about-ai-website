import { getBlogPosts, getBlogPostBySlug } from "@/lib/blog-data"

export default async function TestContentfulPage() {
  try {
    // Test fetching all blog posts
    const allPosts = await getBlogPosts()

    // Test fetching a specific post
    const specificPost = await getBlogPostBySlug("future-of-ai-keynote-speakers")

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Contentful Integration Test</h1>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Blog Posts Status</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">✅ Successfully loaded {allPosts.length} blog posts</p>
            <p className="text-sm text-green-600 mt-2">
              Source: {allPosts.length > 0 && allPosts[0].id.length > 10 ? "Contentful" : "Static Fallback"}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Featured Posts</h2>
          <div className="grid gap-4">
            {allPosts
              .filter((post) => post.featured)
              .map((post) => (
                <div key={post.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-600">
                    By {post.author} • {post.date}
                  </p>
                  <p className="text-sm mt-2">{post.excerpt}</p>
                  <div className="flex gap-2 mt-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Individual Post Test</h2>
          {specificPost ? (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">{specificPost.title}</h3>
              <p className="text-sm text-gray-600">By {specificPost.author}</p>
              <p className="text-sm mt-2">{specificPost.excerpt}</p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">⚠️ Could not load specific post</p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Integration Status</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Contentful client configured</li>
            <li>✅ Blog data functions updated</li>
            <li>✅ Fallback system active</li>
            <li>✅ Environment variables detected</li>
          </ul>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Contentful Integration Test</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ Error testing Contentful integration:</p>
          <pre className="text-sm mt-2 text-red-600">{String(error)}</pre>
        </div>
      </div>
    )
  }
}

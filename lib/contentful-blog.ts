import { createClient, type Entry, type Asset } from "contentful"

/* -------------------------------------------------------------------------- */
/*                               ENV VARIABLES                                */
/* -------------------------------------------------------------------------- */
const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID
const CONTENTFUL_ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN

/* -------------------------------------------------------------------------- */
/*                         LAZY CLIENT INITIALISATION                         */
/* -------------------------------------------------------------------------- */
let _client: ReturnType<typeof createClient> | null = null

function getClient() {
  if (_client) return _client
  if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_ACCESS_TOKEN) {
    console.warn(
      "[Contentful] Missing SPACE_ID or ACCESS_TOKEN – returning null client. " +
        "Blog data will be empty in development / preview environments.",
    )
    return null
  }

  console.log("[Contentful] Initialising Contentful client …")
  _client = createClient({
    space: CONTENTFUL_SPACE_ID,
    accessToken: CONTENTFUL_ACCESS_TOKEN,
  })
  return _client
}

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */
export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt?: string
  content?: any
  author?: { name: string; picture?: { url: string; description?: string } }
  categories?: { slug: string; name: string }[]
  publishedDate: string
  featuredImage?: { url: string; alt: string }
  readTime?: number
  featured?: boolean
  speakers?: string[] // Array of speaker names or slugs mentioned in the post
  sys: any
}

type ContentfulIncludes = {
  Asset?: Asset[]
  Entry?: Entry<any>[]
}

/* -------------------------------------------------------------------------- */
/*                               FIELD HELPERS                                */
/* -------------------------------------------------------------------------- */
function extractAsset(assets: Asset[] | undefined, assetId: string | undefined) {
  if (!assets || !assetId) return undefined
  const asset = assets.find((a) => a.sys.id === assetId)
  if (!asset) return undefined
  return {
    url: asset.fields.file?.url ? `https:${asset.fields.file.url}` : "",
    alt: (asset.fields.description as string) || (asset.fields.title as string) || "",
  }
}

function extractAuthor(entries: Entry<any>[] | undefined, authorId: string | undefined) {
  const fallback = { name: "Speak About AI" }
  if (!entries || !authorId) return fallback

  const entry = entries.find((e) => e.sys.id === authorId && e.sys.contentType.sys.id === "author")
  if (!entry) return fallback

  const pictureAsset = entry.fields.picture as Asset | undefined
  return {
    name: (entry.fields.name as string) || "Speak About AI",
    picture: pictureAsset?.fields?.file
      ? {
          url: `https:${pictureAsset.fields.file.url}`,
          description: pictureAsset.fields.description as string,
        }
      : undefined,
  }
}

function extractCategories(entries: Entry<any>[] | undefined, categoryLinks: Entry<any>[] | undefined) {
  if (!entries || !categoryLinks) return []
  return categoryLinks
    .map((link) => {
      const entry = entries.find((e) => e.sys.id === link.sys.id && e.sys.contentType.sys.id === "category")
      return entry && entry.fields.name && entry.fields.slug
        ? { name: entry.fields.name as string, slug: entry.fields.slug as string }
        : null
    })
    .filter(Boolean) as { slug: string; name: string }[]
}

function resolveRichTextLinks(content: any, includes: ContentfulIncludes | undefined): any {
  if (!content?.content || !includes) return content

  const entryMap = new Map(includes.Entry?.map((e) => [e.sys.id, e]))
  const assetMap = new Map(includes.Asset?.map((a) => [a.sys.id, a]))
  const clone = JSON.parse(JSON.stringify(content))

  function walk(node: any) {
    if (node.nodeType === "embedded-entry-block" || node.nodeType === "embedded-entry-inline") {
      const id = node.data?.target?.sys?.id
      if (id && entryMap.has(id)) node.data.target = entryMap.get(id)
    } else if (node.nodeType === "embedded-asset-block") {
      const id = node.data?.target?.sys?.id
      if (id && assetMap.has(id)) node.data.target = assetMap.get(id)
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }

  clone.content.forEach(walk)
  return clone
}

function mapEntryToPost(entry: Entry<any>, includes?: ContentfulIncludes): BlogPost {
  const { sys, fields } = entry

  // Extract speakers field - can be array or comma-separated string
  let speakers: string[] = []
  if (fields.speakers) {
    if (Array.isArray(fields.speakers)) {
      speakers = fields.speakers.map(s => String(s).trim()).filter(Boolean)
    } else if (typeof fields.speakers === 'string') {
      speakers = fields.speakers.split(',').map(s => s.trim()).filter(Boolean)
    }
  }

  return {
    id: sys.id,
    slug: (fields.slug as string) || `post-${sys.id}`,
    title: (fields.title as string) || "Untitled Post",
    excerpt: fields.excerpt as string | undefined,
    content: resolveRichTextLinks(fields.content, includes),
    author: extractAuthor(includes?.Entry, (fields.author as Entry<any>)?.sys.id),
    categories: extractCategories(includes?.Entry, fields.categories as Entry<any>[]),
    publishedDate: (fields.publishedDate as string) || sys.createdAt,
    featuredImage: extractAsset(includes?.Asset, (fields.featuredImage as Asset)?.sys.id),
    readTime: fields.readTime as number,
    featured: (fields.featured as boolean) ?? false,
    speakers: speakers.length > 0 ? speakers : undefined,
    sys,
  }
}

/* -------------------------------------------------------------------------- */
/*                               PUBLIC API                                   */
/* -------------------------------------------------------------------------- */
const INCLUDE_LEVEL = 10

export async function getBlogPosts(limit?: number): Promise<BlogPost[]> {
  const client = getClient()
  if (!client) return []
  try {
    const res = await client.getEntries({
      content_type: "blogPost",
      order: ["-fields.publishedDate", "-sys.createdAt"],
      include: INCLUDE_LEVEL,
      limit,
    })
    const includes = { Asset: res.includes?.Asset, Entry: res.includes?.Entry }
    return res.items.map((i) => mapEntryToPost(i, includes))
  } catch (e) {
    console.error("[getBlogPosts] Error:", e)
    return []
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const client = getClient()
  if (!client) return null
  try {
    const res = await client.getEntries({
      content_type: "blogPost",
      "fields.slug": slug,
      limit: 1,
      include: INCLUDE_LEVEL,
    })
    if (!res.items.length) return null
    const includes = { Asset: res.includes?.Asset, Entry: res.includes?.Entry }
    return mapEntryToPost(res.items[0], includes)
  } catch (e) {
    console.error(`[getBlogPostBySlug] Error for slug "${slug}":`, e)
    return null
  }
}

export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
  const client = getClient()
  if (!client) return []
  try {
    const res = await client.getEntries({
      content_type: "blogPost",
      "fields.featured": true,
      order: ["-fields.publishedDate", "-sys.createdAt"],
      include: INCLUDE_LEVEL,
      limit,
    })
    const items = res.items.length ? res.items : (await getBlogPosts(limit)).map((p) => ({ fields: p, sys: p.sys }))
    const includes = { Asset: res.includes?.Asset, Entry: res.includes?.Entry }
    return items.map((i) => mapEntryToPost(i as unknown as Entry<any>, includes))
  } catch (e) {
    console.error("[getFeaturedBlogPosts] Error:", e)
    return []
  }
}

export async function getRelatedBlogPosts(currentId: string, limit = 3): Promise<BlogPost[]> {
  const client = getClient()
  if (!client) return []
  try {
    const res = await client.getEntries({
      content_type: "blogPost",
      order: ["-fields.publishedDate", "-sys.createdAt"],
      "sys.id[ne]": currentId,
      limit: limit + 1,
      include: INCLUDE_LEVEL,
    })
    const includes = { Asset: res.includes?.Asset, Entry: res.includes?.Entry }
    return res.items
      .filter((i) => i.sys.id !== currentId)
      .slice(0, limit)
      .map((i) => mapEntryToPost(i, includes))
  } catch (e) {
    console.error("[getRelatedBlogPosts] Error:", e)
    return []
  }
}

export async function getBlogPostsBySpeaker(speakerNameOrSlug: string, limit = 10): Promise<BlogPost[]> {
  const client = getClient()
  if (!client) return []

  try {
    // Get all blog posts and filter client-side for now
    // In the future, if Contentful has the speakers field as a proper array,
    // we can use Contentful's query operators
    const res = await client.getEntries({
      content_type: "blogPost",
      order: ["-fields.publishedDate", "-sys.createdAt"],
      include: INCLUDE_LEVEL,
      limit: 100, // Get more to filter from
    })

    const includes = { Asset: res.includes?.Asset, Entry: res.includes?.Entry }
    const allPosts = res.items.map((i) => mapEntryToPost(i, includes))

    // Normalize the search term (handle both name and slug)
    const searchTerm = speakerNameOrSlug.toLowerCase().trim()
    const searchTermSlug = searchTerm.replace(/\s+/g, '-')

    // Filter posts that mention this speaker
    const filtered = allPosts.filter(post => {
      if (!post.speakers || post.speakers.length === 0) return false

      return post.speakers.some(speaker => {
        const speakerLower = speaker.toLowerCase().trim()
        const speakerSlug = speakerLower.replace(/\s+/g, '-')

        // Match by exact name, slug, or partial match
        return speakerLower === searchTerm ||
               speakerSlug === searchTermSlug ||
               speakerLower.includes(searchTerm) ||
               searchTerm.includes(speakerLower)
      })
    })

    return filtered.slice(0, limit)
  } catch (e) {
    console.error(`[getBlogPostsBySpeaker] Error for speaker "${speakerNameOrSlug}":`, e)
    return []
  }
}

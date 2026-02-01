import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog-data"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { marked } from "marked"
import { getImageUrl, formatDate } from "@/lib/utils"
import { documentToHtmlString, type Options } from "@contentful/rich-text-html-renderer"
import { BLOCKS, INLINES, MARKS } from "@contentful/rich-text-types"
import type { Document, Block, Inline } from "@contentful/rich-text-types"
import { Badge } from "@/components/ui/badge"
import type { Metadata, ResolvingMetadata } from "next"
import { ArrowLeft } from "lucide-react"

// Helper function to create embed URLs for videos
const getEmbedUrl = (url: string): string => {
  if (!url) return ""
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      const videoId = urlObj.hostname.includes("youtu.be") ? urlObj.pathname.slice(1) : urlObj.searchParams.get("v")
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : url
    }
    if (urlObj.hostname.includes("vimeo.com")) {
      const videoId = urlObj.pathname.split("/").pop()
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url
    }
  } catch (e) {
    console.error("Error parsing video URL:", e, "URL was:", url)
    return url
  }
  return url
}

// Helper function to render video embed HTML
const renderVideoEmbed = (node: Block | Inline): string => {
  if (!node.data?.target?.sys?.contentType?.sys?.id) {
    console.error("EMBEDDED_ENTRY: Missing target, sys, contentType, or id.", node.data)
    return `<div class="my-2 p-2 bg-red-100 text-red-700">Error: Video data missing.</div>`
  }
  const contentType = node.data.target.sys.contentType.sys.id
  const fields = node.data.target.fields
  if (
    (contentType === "video" || contentType === "videoEmbed" || contentType === "youtubeVideo") &&
    fields &&
    typeof fields === "object"
  ) {
    const videoUrlField = fields.videoUrl || fields.url || fields.youtubeUrl || fields.file?.url
    const title = fields.title || fields.name || "Embedded video"
    if (typeof videoUrlField === "string") {
      const embedUrl = getEmbedUrl(videoUrlField)
      return `<div class="my-8 relative w-full overflow-hidden rounded-lg shadow-lg mx-auto" style="padding-bottom: 56.25%; max-width: 800px;">
              <iframe src="${embedUrl}" class="absolute top-0 left-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen title="${title}"></iframe>
          </div>`
    } else {
      console.error("EMBEDDED_ENTRY: Video URL field is not a string or not found.", videoUrlField)
      return `<div class="my-2 p-2 bg-yellow-100 text-yellow-700">Warning: Video URL not found or invalid.</div>`
    }
  }
  return ""
}

// Helper function to convert markdown-style images to HTML
const convertMarkdownImages = (html: string): string => {
  if (!html || typeof html !== "string") return ""

  // First handle the malformed case: !<a href="url">text</a>
  html = html.replace(
    /!<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g,
    (match, url, alt) => {
      return `<div class="my-6 flex justify-center">
                <img src="${url}" alt="${alt}" class="max-w-full md:max-w-[80%] h-auto rounded-lg shadow-md object-contain" loading="lazy" />
              </div>`
    }
  )

  // Then handle standard markdown: ![alt text](image url)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, url) => {
      return `<div class="my-6 flex justify-center">
                <img src="${url}" alt="${alt}" class="max-w-full md:max-w-[80%] h-auto rounded-lg shadow-md object-contain" loading="lazy" />
              </div>`
    }
  )

  return html
}

// Helper function to convert markdown-style tables to HTML
const convertMarkdownTables = (html: string): string => {
  if (!html || typeof html !== "string") return ""

  // Match malformed tables without separator rows (each row in separate <p> tags)
  // Pattern: <p>| header |</p><p>| row |</p><p>| row |</p>... (NO separator row)
  // This pattern looks for a header row followed by at least 2 data rows
  html = html.replace(
    /(<p[^>]*>\s*\|.+?\|\s*<\/p>)(\s*<p[^>]*>\s*\|.+?\|\s*<\/p>){2,}/g,
    (match) => {
      // Extract all paragraph contents
      const paragraphMatches = match.match(/<p[^>]*>(\s*\|.+?\|)\s*<\/p>/g) || []
      if (paragraphMatches.length < 2) return match

      const allRows = paragraphMatches.map((p) => {
        // Remove <p> tags and extract content
        const content = p.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '').trim()
        // Split by | and process each cell
        const cells = content.split('|')
          .map((cell: string) => cell.trim())
          .filter((cell: string) => cell)
        return cells
      })

      // Check if we have enough rows
      if (allRows.length < 2) return match

      // First row is header
      const headers = allRows[0]
      const dataRows = allRows.slice(1).filter((row) => row.length > 0)

      // If no valid data rows, return original
      if (dataRows.length === 0) return match

      let tableHTML = '<div class="my-8 overflow-x-auto"><table class="min-w-full border-collapse border border-gray-300">'
      tableHTML += '<thead class="bg-gray-100"><tr>'
      headers.forEach((h: string) => {
        tableHTML += `<th class="border border-gray-300 px-4 py-2 text-left font-semibold">${h}</th>`
      })
      tableHTML += '</tr></thead><tbody>'

      dataRows.forEach((row: string[]) => {
        tableHTML += '<tr>'
        row.forEach((cell: string) => {
          tableHTML += `<td class="border border-gray-300 px-4 py-2">${cell}</td>`
        })
        tableHTML += '</tr>'
      })

      tableHTML += '</tbody></table></div>'
      return tableHTML
    }
  )

  // Match tables that appear as separate paragraphs with separator row
  // Pattern: <p>| header |</p><p>| --- |</p><p>| row |</p>...
  html = html.replace(
    /(?:<p[^>]*>)\s*\|(.+?)\|\s*<\/p>\s*(?:<p[^>]*>)\s*\|[-:\s|]+\|\s*<\/p>((?:\s*<p[^>]*>\s*\|.+?\|\s*<\/p>)+)/g,
    (match, header, rows) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter((h: string) => h)
      const rowMatches = rows.match(/<p[^>]*>\s*\|(.+?)\|\s*<\/p>/g) || []
      const rowsArray = rowMatches.map((rowMatch: string) => {
        const rowContent = rowMatch.replace(/<\/?p[^>]*>/g, '').trim()
        return rowContent.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
      })

      let tableHTML = '<div class="my-8 overflow-x-auto"><table class="min-w-full border-collapse border border-gray-300">'
      tableHTML += '<thead class="bg-gray-100"><tr>'
      headers.forEach((h: string) => {
        tableHTML += `<th class="border border-gray-300 px-4 py-2 text-left font-semibold">${h}</th>`
      })
      tableHTML += '</tr></thead><tbody>'

      rowsArray.forEach((row: string[]) => {
        if (row.length > 0) {
          tableHTML += '<tr>'
          row.forEach((cell: string) => {
            tableHTML += `<td class="border border-gray-300 px-4 py-2">${cell}</td>`
          })
          tableHTML += '</tr>'
        }
      })

      tableHTML += '</tbody></table></div>'
      return tableHTML
    }
  )

  // Match tables within a single paragraph (each line is in the paragraph text)
  // Pattern: <p>| header |\n| --- |\n| row |\n| row |</p>
  html = html.replace(
    /<p[^>]*>\s*(\|.+?\|)\s*\n\s*(\|[-:\s|]+\|)\s*\n((?:\s*\|.+?\|\s*\n?)+)\s*<\/p>/g,
    (match, header, separator, rows) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter((h: string) => h)
      const rowsArray = rows.trim().split('\n').map((row: string) =>
        row.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
      )

      let tableHTML = '<div class="my-8 overflow-x-auto"><table class="min-w-full border-collapse border border-gray-300">'
      tableHTML += '<thead class="bg-gray-100"><tr>'
      headers.forEach((h: string) => {
        tableHTML += `<th class="border border-gray-300 px-4 py-2 text-left font-semibold">${h}</th>`
      })
      tableHTML += '</tr></thead><tbody>'

      rowsArray.forEach((row: string[]) => {
        if (row.length > 0) {
          tableHTML += '<tr>'
          row.forEach((cell: string) => {
            tableHTML += `<td class="border border-gray-300 px-4 py-2">${cell}</td>`
          })
          tableHTML += '</tr>'
        }
      })

      tableHTML += '</tbody></table></div>'
      return tableHTML
    }
  )

  // Match tables WITHOUT leading pipes (Outrank format)
  // Pattern: <p>Header | Header</p><p>Cell | Cell</p><p>Cell | Cell</p>...
  // Must have 3+ consecutive rows with pipes, where first row has 2+ words (header characteristics)
  html = html.replace(
    /(<p[^>]*>[A-Z][^<|]*\|[^<]+<\/p>)(?:\s*<p[^>]*>[^<]+\|[^<]+<\/p>){2,}/g,
    (match) => {
      // Extract all paragraph contents
      const paragraphMatches = match.match(/<p[^>]*>([^<]+)<\/p>/g) || []
      if (paragraphMatches.length < 3) return match

      const allRows = paragraphMatches.map((p) => {
        const content = p.replace(/<\/?p[^>]*>/g, '').trim()
        return content.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
      })

      // Verify this looks like a table (all rows have same number of columns, 2+)
      const columnCount = allRows[0].length
      if (columnCount < 2) return match
      if (!allRows.every(row => row.length === columnCount)) return match

      // First row is header
      const headers = allRows[0]
      const dataRows = allRows.slice(1)

      let tableHTML = '<div class="my-8 overflow-x-auto"><table class="min-w-full border-collapse border border-gray-300">'
      tableHTML += '<thead class="bg-gray-100"><tr>'
      headers.forEach((h: string) => {
        tableHTML += `<th class="border border-gray-300 px-4 py-2 text-left font-semibold">${h}</th>`
      })
      tableHTML += '</tr></thead><tbody>'

      dataRows.forEach((row: string[]) => {
        tableHTML += '<tr>'
        row.forEach((cell: string) => {
          tableHTML += `<td class="border border-gray-300 px-4 py-2">${cell}</td>`
        })
        tableHTML += '</tr>'
      })

      tableHTML += '</tbody></table></div>'
      return tableHTML
    }
  )

  // Remove duplicate table rows that appear without leading pipes (plain text format)
  // These are the duplicate versions that appear after the proper table

  // Pattern 1: Header row with all text in <strong>, followed by rows with first cell in <strong>
  // <p><strong>Header1 | Header2 | Header3</strong></p>
  // <p><strong>Cell1</strong> | Cell2 | Cell3</p>
  html = html.replace(
    /<p[^>]*><strong>[^<]+\|[^<]+\|[^<]+<\/strong><\/p>(?:\s*<p[^>]*><strong>[^<]+<\/strong>\s*\|[^<]+<\/p>){2,}/g,
    ''
  )

  // Pattern 2: <p><strong>Header | ... </strong></p> followed by multiple <p><strong>Row</strong> | ... </p>
  html = html.replace(
    /<p[^>]*><strong>[^<|]+\|[^<]*<\/strong><\/p>(?:\s*<p[^>]*>(?:<strong>)?[^<]+\|[^<]*(?:<\/strong>)?<\/p>){2,}/g,
    ''
  )

  // Pattern 3: Plain text without strong tags - <p>Header | ... </p> followed by multiple <p>Text | ... </p>
  // Look for header row without leading pipe, followed by 3+ data rows with pipes
  html = html.replace(
    /<p[^>]*>(?!.*<\/table>)([A-Z][^<|]*\|[^<]*)<\/p>(?:\s*<p[^>]*>(?!.*<\/table>)(?:<strong>)?[^<]+\|[^<]*(?:<\/strong>)?<\/p>){3,}/g,
    ''
  )

  // Pattern 4: Clean up any remaining orphaned table-like rows (rows with 2+ pipes)
  // These are leftover rows from partial matches above
  // Match: <p><strong>Text</strong> | ... | ... </p> (allows <strong> tags anywhere)
  html = html.replace(
    /<p[^>]*><strong>[^<]+<\/strong>\s*\|[^|]+\|.+?<\/p>/g,
    ''
  )

  return html
}

// Helper function to convert markdown blockquotes to HTML
const convertMarkdownBlockquotes = (html: string): string => {
  if (!html || typeof html !== "string") return ""

  // Match > at start of paragraph
  return html.replace(
    /<p class="mb-4 leading-relaxed">&gt;\s*(.*?)<\/p>/g,
    (match, content) => {
      return `<blockquote class="border-l-4 border-blue-500 bg-blue-50 pl-4 pr-4 py-3 italic my-6 text-gray-700">${content}</blockquote>`
    }
  )
}

// Helper function to style HTML tables from Contentful
const styleContentfulTables = (html: string): string => {
  if (!html || typeof html !== "string") return ""

  // Replace table classes with Tailwind classes
  html = html.replace(
    /<table[^>]*>/g,
    '<div class="my-8 overflow-x-auto"><table class="min-w-full border-collapse border border-gray-300">'
  )

  // Close the wrapper div after table
  html = html.replace(/<\/table>/g, '</table></div>')

  // Style th tags
  html = html.replace(/<th([^>]*)>/g, '<th$1 class="border border-gray-300 px-4 py-2 text-left font-semibold bg-gray-100">')

  // Style td tags
  html = html.replace(/<td([^>]*)>/g, '<td$1 class="border border-gray-300 px-4 py-2">')

  return html
}

// Helper function to fix YouTube URLs in content
const fixYouTubeEmbeds = (html: string): string => {
  if (!html || typeof html !== "string") return ""

  // Wrap standalone YouTube iframes (not already wrapped in a div) with responsive styling
  html = html.replace(
    /(?<!<div[^>]*>)\s*(<iframe[^>]*src=["']https:\/\/www\.youtube\.com\/embed\/[^"']+["'][^>]*>.*?<\/iframe>)\s*(?!<\/div>)/gi,
    (match, iframe) => {
      return `<div class="my-8 relative w-full overflow-hidden rounded-lg shadow-lg mx-auto" style="padding-bottom: 56.25%; max-width: 800px;">
              ${iframe.replace(/<iframe/, '<iframe class="absolute top-0 left-0 w-full h-full"')}
            </div>`
    }
  )

  // Fix iframe embeds with watch URLs
  html = html.replace(
    /<iframe([^>]*)\ssrc=["']https:\/\/www\.youtube\.com\/watch\?v=([^"'&]+)[^"']*["']([^>]*)>/gi,
    (match, beforeSrc, videoId, afterSrc) => {
      const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`
      return `<div class="my-8 relative w-full overflow-hidden rounded-lg shadow-lg mx-auto" style="padding-bottom: 56.25%; max-width: 800px;">
              <iframe${beforeSrc} src="${embedUrl}"${afterSrc} class="absolute top-0 left-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>`
    }
  )

  // Fix bare YouTube embed URLs in paragraphs
  html = html.replace(
    /<p class="mb-4 leading-relaxed">https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]+)<\/p>/g,
    (match, videoId) => {
      return `<div class="my-8 relative w-full overflow-hidden rounded-lg shadow-lg mx-auto" style="padding-bottom: 56.25%; max-width: 800px;">
              <iframe src="https://www.youtube.com/embed/${videoId}?rel=0" class="absolute top-0 left-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>`
    }
  )

  return html
}

type BlogPostPageProps = {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BlogPostPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    return {
      title: "Post Not Found | Speak About AI",
      description: "The requested blog post could not be found.",
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const featuredImageUrl = post.featuredImage?.url ? getImageUrl(post.featuredImage.url) : null

  let description =
    post.excerpt ||
    `Read "${post.title}" on the Speak About AI blog. Discover insights on AI trends, keynote speaking, and more.`
  if (description.length > 160) {
    description = description.substring(0, 157) + "..."
  }

  // Ensure title doesn't exceed ~45 chars (template adds "| Speak About AI")
  const maxTitleLength = 45
  let pageTitle = post.title
  if (post.title.length > maxTitleLength) {
    pageTitle = post.title.substring(0, maxTitleLength - 3) + "..."
  }

  return {
    title: pageTitle,
    description: description,
    keywords: post.categories?.map((cat) => cat.name).join(", "),
    alternates: {
      canonical: `https://speakabout.ai/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: description,
      type: "article",
      publishedTime: post.publishedDate, // Assuming publishedDate is always available
      authors: [post.author?.name || "Speak About AI"],
      images: featuredImageUrl ? [featuredImageUrl, ...previousImages] : previousImages,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const featuredImageUrl = post.featuredImage?.url ? getImageUrl(post.featuredImage.url) : null
  let contentHtml = ""

  if (post.content) {
    if (typeof post.content === "string") {
      // Fallback for plain markdown string content
      contentHtml = marked(post.content)
      contentHtml = convertMarkdownImages(contentHtml)
      contentHtml = convertMarkdownTables(contentHtml)
      contentHtml = convertMarkdownBlockquotes(contentHtml)
      contentHtml = fixYouTubeEmbeds(contentHtml)
    } else if (typeof post.content === "object" && post.content.nodeType === "document") {
      // Preferred: Contentful Rich Text
      const richTextDocument = post.content as Document
      const renderOptions: Options = {
        renderMark: {
          [MARKS.BOLD]: (text) => `<strong>${text}</strong>`,
          [MARKS.ITALIC]: (text) => `<em>${text}</em>`,
          [MARKS.UNDERLINE]: (text) => `<u>${text}</u>`,
          [MARKS.CODE]: (text) =>
            `<code class="bg-gray-100 dark:bg-gray-800 p-1 rounded text-sm font-mono">${text}</code>`,
        },
        renderNode: {
          [BLOCKS.EMBEDDED_ENTRY]: renderVideoEmbed,
          [INLINES.EMBEDDED_ENTRY]: renderVideoEmbed, // Handle inline video embeds too
          [BLOCKS.EMBEDDED_ASSET]: (node) => {
            if (!node.data?.target?.fields?.file?.url || typeof node.data.target.fields.file.url !== "string") {
              return `<p class="text-red-500">Error: Embedded asset is missing 'file.url'.</p>`
            }
            const file = node.data.target.fields.file
            const assetFields = node.data.target.fields
            if (file.contentType && typeof file.contentType === "string" && file.contentType.startsWith("image/")) {
              const imageUrl = getImageUrl(file.url)
              const altText = assetFields.description || assetFields.title || "Embedded image"
              if (!imageUrl) return `<p class="text-red-500">Error: Could not construct image URL.</p>`
              return `<div class="my-6 flex justify-center">
                        <img src="${imageUrl}" alt="${altText}" class="max-w-full md:max-w-[80%] h-auto rounded-lg shadow-md object-contain" loading="lazy" />
                      </div>`
            }
            return `<p class="text-yellow-500">Warning: Embedded asset is not an image.</p>`
          },
          [BLOCKS.PARAGRAPH]: (node, next) => `<p class="mb-4 leading-relaxed">${next(node.content)}</p>`,
          [BLOCKS.HEADING_2]: (node, next) => `<h2 class="text-2xl font-semibold mt-8 mb-3">${next(node.content)}</h2>`,
          [BLOCKS.HEADING_3]: (node, next) => `<h3 class="text-xl font-semibold mt-6 mb-2">${next(node.content)}</h3>`,
          [BLOCKS.UL_LIST]: (node, next) => `<ul class="list-disc mb-4 pl-6 space-y-2">${next(node.content)}</ul>`,
          [BLOCKS.OL_LIST]: (node, next) => `<ol class="list-decimal mb-4 pl-6 space-y-2">${next(node.content)}</ol>`,
          [BLOCKS.LIST_ITEM]: (node, next) => {
            // Extract text content without wrapping paragraph tags
            const content = next(node.content)
            // Remove paragraph tags if they exist
            const cleanContent = content.replace(/<p[^>]*>(.*?)<\/p>/g, '$1')
            return `<li class="mb-1">${cleanContent}</li>`
          },
          [BLOCKS.QUOTE]: (node, next) =>
            `<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4">${next(node.content)}</blockquote>`,
          [INLINES.HYPERLINK]: (node, next) => {
            const href = typeof node.data.uri === "string" ? node.data.uri : "#"
            return `<a href="${href}" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">${next(node.content)}</a>`
          },
        },
      }
      contentHtml = documentToHtmlString(richTextDocument, renderOptions)

      // Unescape HTML tables that were stored as text in Contentful
      contentHtml = contentHtml.replace(
        /<p[^>]*>(&lt;table[\s\S]*?&lt;\/table&gt;)<\/p>/g,
        (match, escapedTable) => {
          // Unescape HTML entities
          return escapedTable
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
        }
      )

      // Unescape HTML iframes that were stored as text in Contentful
      contentHtml = contentHtml.replace(
        /<p[^>]*>(&lt;iframe[\s\S]*?&lt;\/iframe&gt;)<\/p>/g,
        (match, escapedIframe) => {
          // Unescape HTML entities
          return escapedIframe
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
        }
      )

      contentHtml = styleContentfulTables(contentHtml)
      contentHtml = convertMarkdownImages(contentHtml)
      contentHtml = convertMarkdownTables(contentHtml)
      contentHtml = convertMarkdownBlockquotes(contentHtml)
      contentHtml = fixYouTubeEmbeds(contentHtml)
    } else {
      contentHtml = "<p>Content is in an unexpected format.</p>"
    }
  } else {
    contentHtml = "<p>No content available for this post.</p>"
  }

  return (
    <article className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6 group"
        >
          <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
          Back to Blog
        </Link>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 leading-tight text-gray-900 dark:text-white">
          {post.title}
        </h1>
        <div className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          <span>By {post.author?.name || "Speak About AI"}</span>
          <span className="mx-2">•</span>
          <span>
            {formatDate(post.publishedDate)}
          </span>
          {post.readTime && (
            <>
              <span className="mx-2">•</span>
              <span>{post.readTime} min read</span>
            </>
          )}
        </div>

        {post.categories && post.categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <Link href={`/blog/category/${category.slug}`} key={category.slug}>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {featuredImageUrl && (
          <div className="relative w-full aspect-[16/9] mb-8 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={featuredImageUrl || "/placeholder.svg"}
              alt={post.featuredImage?.alt || post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
            />
          </div>
        )}
        <div
          className="prose prose-lg max-w-none 
                     text-gray-700 dark:text-gray-300 
                     prose-headings:text-gray-900 dark:prose-headings:text-white
                     prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline
                     prose-strong:text-gray-800 dark:prose-strong:text-white
                     prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:p-1 prose-code:rounded prose-code:font-mono
                     prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600
                     prose-li:marker:text-gray-500 dark:prose-li:marker:text-gray-400"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </div>
    </article>
  )
}

export async function generateStaticParams() {
  const posts = await getBlogPosts(200) // Fetch a reasonable number for static generation
  return posts
    .filter((post) => typeof post.slug === "string" && post.slug.trim().length > 0)
    .map((post) => ({ slug: post.slug }))
}

// components/LexicalRenderer.tsx
import React from "react"
import NextImage from "next/image"
import { getImageUrl } from "@/lib/utils"

// Helper function to construct embed URLs for videos
const getEmbedUrl = (url: string, videoType: string, autoplay = false): string => {
  if (!url) return "" // Return empty string if URL is not provided
  const autoplayParam = autoplay ? (videoType === "youtube" ? "&autoplay=1&mute=1" : "?autoplay=1&muted=1") : "" // Mute for autoplay

  switch (videoType) {
    case "youtube":
      let videoId = ""
      if (url.includes("youtube.com/watch?v=")) {
        videoId = url.split("watch?v=")[1]?.split("&")[0]
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0]
      } else if (url.includes("youtube.com/embed/")) {
        // If it's already an embed URL, just add autoplay if needed
        const baseUrl = url.split("?")[0]
        return `${baseUrl}?rel=0${autoplayParam}`
      }
      if (!videoId) return url // Fallback to original URL if ID parsing fails
      return `https://www.youtube.com/embed/${videoId}?rel=0${autoplayParam}`

    case "vimeo":
      let vimeoId = ""
      if (url.includes("vimeo.com/")) {
        // Handles URLs like vimeo.com/12345678 or vimeo.com/event/12345/videos/67890
        const parts = url.split("vimeo.com/")[1]?.split("?")[0].split("/")
        vimeoId = parts[parts.length - 1] // Get the last segment as ID
      }
      if (!vimeoId) return url // Fallback
      return `https://player.vimeo.com/video/${vimeoId}${autoplay ? (url.includes("?") ? "&autoplay=1&muted=1" : "?autoplay=1&muted=1") : ""}`

    case "custom":
    default:
      return url // For custom URLs, assume they are already embeddable
  }
}

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  tag?: string
  format?: string | number
  url?: string // For link nodes AND potentially for iframe src if not nested
  fields?: {
    // Link fields
    url?: string
    linkType?: "internal" | "custom"
    // Video block fields
    blockType?: string // e.g., 'video'
    videoUrl?: string
    videoType?: "youtube" | "vimeo" | "custom" | string // Allow string for future types
    title?: string
    aspectRatio?: string // e.g., '16/9', '4/3'
    autoplay?: boolean
  }
  value?: {
    id: string
    url?: string
    filename?: string
    mimeType?: string
    filesize?: number
    width?: number // Expected to be a number
    height?: number // Expected to be a number
    alt?: string
  }
  relationTo?: string
  src?: string // For direct image src OR iframe src
  altText?: string
  width?: string | number
  height?: string | number
  source?: string
  frameBorder?: string | number
  allowFullScreen?: boolean
}

interface LexicalContent {
  root: {
    children: LexicalNode[]
  }
}

interface Node {
  nodeType: string
  content?: Node[]
  value?: string
  marks?: { type: string }[]
  data?: any
}

const renderLexicalNode = (node: LexicalNode, index: number): React.ReactNode => {
  // console.log("Rendering node:", node.type, node); // Temporary debug log

  // Handle text nodes
  if (node.type === "text" && typeof node.text === "string") {
    const style: React.CSSProperties = {}
    if (typeof node.format === "number") {
      if (node.format & 1) style.fontWeight = "bold"
      if (node.format & 2) style.fontStyle = "italic"
      if (node.format & 8) style.textDecoration = "underline"
    }
    return (
      <span key={index} style={style}>
        {node.text}
      </span>
    )
  }

  // Handle paragraph nodes
  if (node.type === "paragraph") {
    if (!node.children || node.children.every((child) => child.type === "text" && !child.text?.trim())) {
      return null
    }
    // Check if paragraph only contains an iframe or video block, if so, don't wrap with <p>
    if (
      node.children?.length === 1 &&
      (node.children[0].type === "iframe" ||
        (node.children[0].type === "block" && node.children[0].fields?.blockType === "video"))
    ) {
      return renderLexicalNode(node.children[0], 0)
    }
    return (
      <p key={index} className="mb-4 leading-relaxed">
        {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
      </p>
    )
  }

  // Handle heading nodes
  if (node.type === "heading" && node.tag && ["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tag)) {
    const HeadingTag = node.tag as any
    let className = "font-bold mb-3 mt-5"
    if (node.tag === "h1") className += " text-3xl md:text-4xl"
    if (node.tag === "h2") className += " text-2xl md:text-3xl"
    if (node.tag === "h3") className += " text-xl md:text-2xl"
    if (node.tag === "h4") className += " text-lg md:text-xl"
    return (
      <HeadingTag key={index} className={className}>
        {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
      </HeadingTag>
    )
  }

  // Handle link nodes (Payload specific structure)
  if (node.type === "link" && node.fields && node.fields.linkType) {
    const url = node.fields.url || "#"
    const isExternal = node.fields.linkType === "custom"
    return (
      <a
        key={index}
        href={url}
        className="text-blue-600 hover:text-blue-800 underline"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
      </a>
    )
  }
  // Handle generic link nodes (if not caught by Payload specific one)
  if (node.type === "link" && node.url) {
    const isExternal = /^(https?:|mailto:|tel:)/.test(node.url)
    return (
      <a
        key={index}
        href={node.url}
        className="text-blue-600 hover:text-blue-800 underline"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
      </a>
    )
  }

  // Handle image nodes - OPTIMIZED VERSION
  if (node.type === "upload" && node.relationTo === "media" && node.value) {
    const rawImageUrl = node.value.url
    const imageUrl = getImageUrl(rawImageUrl)
    const imageAlt = node.value.alt || "Blog image"
    const imageWidth = typeof node.value.width === "number" ? node.value.width : undefined
    const imageHeight = typeof node.value.height === "number" ? node.value.height : undefined

    if (!imageUrl) return null

    if (imageWidth && imageHeight) {
      return (
        <div
          key={index}
          className="my-6 dynamic-image-container" // Class for CSS styling
          style={
            {
              "--original-width": `${imageWidth}px`,
            } as React.CSSProperties
          }
        >
          <NextImage
            src={imageUrl}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
            priority={index < 2}
            className="w-full h-auto rounded-lg shadow-md object-contain"
          />
        </div>
      )
    } else {
      return (
        <div key={index} className="my-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={imageAlt}
            className="max-w-full h-auto rounded-lg shadow-md inline-block"
            style={{ maxWidth: "800px" }}
            loading="lazy"
          />
        </div>
      )
    }
  }

  // Handle video blocks
  if (node.type === "block" && node.fields?.blockType === "video") {
    const { videoUrl, videoType, title, aspectRatio, autoplay } = node.fields
    // Ensure videoUrl and videoType are strings, provide defaults
    const currentVideoUrl = typeof videoUrl === "string" ? videoUrl : ""
    const currentVideoType = typeof videoType === "string" ? videoType : "youtube" // Default to youtube
    const currentAutoplay = typeof autoplay === "boolean" ? autoplay : false

    if (!currentVideoUrl) return null

    const embedUrl = getEmbedUrl(currentVideoUrl, currentVideoType, currentAutoplay)

    if (!embedUrl) return null // If getEmbedUrl returns empty (e.g. bad URL), don't render

    return (
      <div key={index} className="my-8">
        {title && <h4 className="text-lg font-semibold mb-3 text-center">{title}</h4>}
        <div
          className="relative w-full overflow-hidden rounded-lg shadow-lg mx-auto"
          style={{
            aspectRatio: typeof aspectRatio === "string" && aspectRatio.includes("/") ? aspectRatio : "16/9",
            maxWidth: "800px",
          }}
        >
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title || "Video content"}
          />
        </div>
      </div>
    )
  }

  // Handle generic iframe nodes (e.g., YouTube embeds not using the video block)
  if (node.type === "iframe") {
    const iframeSrc = node.src || node.url || node.source
    if (!iframeSrc) {
      return null
    }

    let finalSrc = iframeSrc
    // Attempt to convert to embed URL if it's a watch URL
    if (iframeSrc.includes("youtube.com/watch?v=")) {
      finalSrc = iframeSrc.replace("watch?v=", "embed/")
    } else if (iframeSrc.includes("youtu.be/")) {
      finalSrc = iframeSrc.replace("youtu.be/", "www.youtube.com/embed/")
    }

    const defaultAspectRatio = "16/9"
    const currentWidth = typeof node.width === "string" ? node.width : "100%"

    return (
      <div
        key={index}
        className="my-6 relative w-full overflow-hidden rounded-lg shadow-md mx-auto"
        style={{
          paddingBottom: `calc(100% / (${defaultAspectRatio}))`, // Aspect ratio padding trick
          maxWidth: "800px", // Cap width for generic iframes too
        }}
      >
        <iframe
          src={finalSrc}
          width={currentWidth}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder={node.frameBorder || "0"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen={node.allowFullScreen !== undefined ? node.allowFullScreen : true}
          title={node.altText || "Embedded content"}
        />
      </div>
    )
  }

  // Handle list nodes
  if (node.type === "list" && (node.tag === "ul" || node.tag === "ol")) {
    const ListTag = node.tag as any
    const listStyle = node.tag === "ul" ? "list-disc" : "list-decimal"
    return (
      <ListTag key={index} className={`${listStyle} pl-6 mb-4 space-y-1`}>
        {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
      </ListTag>
    )
  }

  // Handle list item nodes
  if (node.type === "listitem") {
    return <li key={index}>{node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}</li>
  }

  // Handle blockquote nodes
  if (node.type === "quote") {
    return (
      <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic my-4 py-2 text-gray-700">
        {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
      </blockquote>
    )
  }

  return null
}

const renderNode = (node: Node, key: number): React.ReactNode => {
  switch (node.nodeType) {
    case "document":
      return node.content?.map((childNode, index) => renderNode(childNode, index))

    case "paragraph":
      return (
        <p key={key} className="mb-4 last:mb-0">
          {node.content?.map((childNode, index) => renderNode(childNode, index))}
        </p>
      )

    case "heading-1":
      return (
        <h1 key={key} className="text-4xl font-bold my-6">
          {node.content?.map((childNode, index) => renderNode(childNode, index))}
        </h1>
      )
    case "heading-2":
      return (
        <h2 key={key} className="text-3xl font-bold my-5">
          {node.content?.map((childNode, index) => renderNode(childNode, index))}
        </h2>
      )
    case "heading-3":
      return (
        <h3 key={key} className="text-2xl font-bold my-4">
          {node.content?.map((childNode, index) => renderNode(childNode, index))}
        </h3>
      )

    case "text":
      let textElement: React.ReactNode = node.value || ""
      if (node.marks) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case "bold":
              textElement = <strong>{textElement}</strong>
              break
            case "italic":
              textElement = <em>{textElement}</em>
              break
            case "underline":
              textElement = <u>{textElement}</u>
              break
          }
        }
      }
      return <React.Fragment key={key}>{textElement}</React.Fragment>

    case "unordered-list":
      return (
        <ul key={key} className="list-disc pl-6 my-4 space-y-2">
          {node.content?.map((childNode, index) => renderNode(childNode, index))}
        </ul>
      )

    case "ordered-list":
      return (
        <ol key={key} className="list-decimal pl-6 my-4 space-y-2">
          {node.content?.map((childNode, index) => renderNode(childNode, index))}
        </ol>
      )

    case "list-item":
      return <li key={key}>{node.content?.map((childNode, index) => renderNode(childNode, index))}</li>

    case "blockquote":
      return (
        <blockquote key={key} className="border-l-4 border-gray-300 pl-4 italic my-4 py-2">
          {node.content?.map((childNode, index) => renderNode(childNode, index))}
        </blockquote>
      )

    default:
      // console.warn("Unsupported node type:", node.nodeType);
      return null
  }
}

interface LexicalRendererProps {
  content: LexicalContent | Node | string | undefined | null
}

export const LexicalRenderer: React.FC<LexicalRendererProps> = ({ content }) => {
  if (typeof content === "string") {
    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
  }

  if (
    content &&
    typeof content === "object" &&
    "root" in content &&
    content.root &&
    Array.isArray(content.root.children)
  ) {
    const renderedNodes = content.root.children.map((node, index) => renderLexicalNode(node, index)).filter(Boolean)

    if (renderedNodes.length === 0) {
      return <p className="text-gray-500">Content is empty or not renderable.</p>
    }
    return <div className="prose max-w-none">{renderedNodes}</div>
  }

  if (content && typeof content === "object" && "nodeType" in content) {
    return renderNode(content as Node, 0)
  }

  return <p className="text-gray-500">No content available or content is in an unexpected format.</p>
}

export default LexicalRenderer

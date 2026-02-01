import type { Metadata } from "next"

const BASE_URL = "https://www.speakabout.ai"
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`

interface GenerateMetadataProps {
  title: string
  description: string
  keywords?: string[]
  image?: string
  path?: string
  type?: "website" | "article" | "profile"
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  path = "",
  type = "website"
}: GenerateMetadataProps): Metadata {
  const url = `${BASE_URL}${path}`
  
  // Add default keywords to all pages
  const allKeywords = [
    ...keywords,
    "AI speakers",
    "keynote speakers",
    "artificial intelligence",
    "AI conference",
    "book AI speaker"
  ]
  
  return {
    title,
    description,
    keywords: allKeywords.join(", "),
    authors: [{ name: "Speak About AI" }],
    creator: "Speak About AI",
    publisher: "Speak About AI",
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: path || "/"
    },
    openGraph: {
      type,
      locale: "en_US",
      url,
      siteName: "Speak About AI",
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@speakaboutai"
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1
      }
    }
  }
}

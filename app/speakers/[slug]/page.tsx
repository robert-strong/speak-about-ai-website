import { notFound } from "next/navigation"
import { getSpeakerBySlug, getAllSpeakers } from "@/lib/speakers-data"
import OptimizedSpeakerProfile from "@/components/speaker-profile-optimized"
import ScrollToTop from "./scroll-to-top"
import { generateSpeakerStructuredData } from "./structured-data"
import { findSimilarSpeakers } from "@/lib/speaker-similarity"
import Script from "next/script"

interface SpeakerPageProps {
  params: Promise<{ slug: string }>
}

export default async function SpeakerPage({ params }: SpeakerPageProps) {
  const { slug } = await params
  const speaker = await getSpeakerBySlug(slug)

  if (!speaker) {
    notFound()
  }

  // Find similar speakers using the similarity algorithm
  const allSpeakers = await getAllSpeakers()
  const similarSpeakers = findSimilarSpeakers(speaker, allSpeakers, 3)

  // Generate comprehensive structured data for Google
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Person", "PublicFigure"],
    "name": speaker.name,
    "alternateName": speaker.title || "AI Keynote Speaker",
    "jobTitle": speaker.title || "AI Keynote Speaker",
    "description": speaker.bio || speaker.title || "",
    "image": speaker.image?.startsWith('http')
      ? speaker.image
      : `https://speakabout.ai${speaker.image || '/placeholder.jpg'}`,
    "url": `https://speakabout.ai/speakers/${slug}`,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://speakabout.ai/speakers/${slug}`
    },
    "sameAs": [
      speaker.linkedin && `https://linkedin.com/in/${speaker.linkedin}`,
      speaker.twitter && `https://twitter.com/${speaker.twitter}`,
      speaker.website
    ].filter(Boolean),
    "worksFor": {
      "@type": "Organization",
      "name": "Speak About AI Speaker Bureau",
      "url": "https://speakabout.ai"
    },
    "hasOccupation": {
      "@type": "Occupation",
      "name": "AI Keynote Speaker",
      "occupationLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "Global"
        }
      },
      "skills": [...(speaker.topics || []), ...(speaker.expertise || [])].filter(Boolean).slice(0, 10)
    },
    "knowsAbout": [...(speaker.topics || []), ...(speaker.expertise || []), "Artificial Intelligence", "Machine Learning", "AI Strategy", "Keynote Speaking"].filter(Boolean),
    "knowsLanguage": ["en"],
    "alumniOf": speaker.education || undefined,
    "award": speaker.awards || undefined,
    "memberOf": {
      "@type": "Organization",
      "name": "Speak About AI",
      "description": "Premier AI Keynote Speakers Bureau"
    },
    "offers": {
      "@type": "Offer",
      "description": `Book ${speaker.name} for keynote speaking engagements on AI and technology topics`,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Speak About AI",
        "url": "https://speakabout.ai"
      }
    }
  }
  
  // Add speakable schema for voice search
  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${speaker.name} - AI Keynote Speaker Profile`,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".speaker-bio", ".speaker-title", ".speaker-expertise"]
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }}
      />
      <OptimizedSpeakerProfile speaker={speaker} similarSpeakers={similarSpeakers} />
      <ScrollToTop />
    </>
  )
}

export async function generateStaticParams() {
  try {
    const speakers = await getAllSpeakers()
    return speakers
      .filter((speaker) => speaker.slug && typeof speaker.slug === 'string')
      .map((speaker) => ({
        slug: speaker.slug,
      }))
  } catch (error) {
    console.error('Error in generateStaticParams:', error)
    return []
  }
}

// Enable ISR for speaker pages
export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({ params }: SpeakerPageProps) {
  const { slug } = await params
  const speaker = await getSpeakerBySlug(slug)

  if (!speaker) {
    return {
      title: "Speaker Not Found | Speak About AI",
      description: "The requested speaker profile could not be found.",
      openGraph: {
        title: "Speaker Not Found | Speak About AI",
        description: "The requested speaker profile could not be found.",
        images: [
          {
            url: "/hero-image.jpg",
            width: 1200,
            height: 630,
            alt: "Speak About AI",
          },
        ],
      },
    }
  }

  // Create a rich description using bio and expertise
  const bioText = speaker.bio || speaker.title || ""
  const description = bioText.length > 155
    ? `${bioText.substring(0, 152)}...`
    : bioText || `Book ${speaker.name} for your next event. ${speaker.title || 'Expert AI keynote speaker'} specializing in ${speaker.topics?.slice(0, 3).join(', ') || 'artificial intelligence and technology'}.`

  // Build comprehensive keywords
  const keywords = [
    speaker.name,
    `${speaker.name} speaker`,
    `${speaker.name} keynote`,
    "AI speaker",
    "keynote speaker",
    "artificial intelligence speaker",
    ...(speaker.topics || []),
    ...(speaker.expertise || []),
    ...(speaker.industries || []),
    ...(speaker.programs || []),
  ].filter(Boolean)

  // Ensure image URL is absolute
  const imageUrl = speaker.image
    ? (speaker.image.startsWith('http') 
        ? speaker.image 
        : `https://speakabout.ai${speaker.image}`)
    : "https://speakabout.ai/hero-image.jpg"

  // Generate optimized title for better SEO (keep under 60 chars before template adds "| Speak About AI")
  // Helper to create short title from full title
  const getShortTitle = (fullTitle: string): string => {
    // Extract key role/company from title
    const lowerTitle = fullTitle.toLowerCase()
    if (lowerTitle.includes('siri') && lowerTitle.includes('co-founder')) return 'Siri Co-Founder'
    if (lowerTitle.includes('shazam') && lowerTitle.includes('founder')) return 'Shazam Founder'
    if (lowerTitle.includes('google')) return fullTitle.split(',')[0].replace(/former\s*/i, '').trim()
    if (lowerTitle.includes('amazon')) return fullTitle.split(',')[0].replace(/former\s*/i, '').trim()
    if (lowerTitle.includes('ceo')) return fullTitle.split(',')[0].trim()
    if (lowerTitle.includes('founder')) return fullTitle.split(',')[0].trim()
    // Default: take first part before comma, max 40 chars
    const firstPart = fullTitle.split(',')[0].trim()
    return firstPart.length > 40 ? firstPart.substring(0, 37) + '...' : firstPart
  }

  const shortTitle = speaker.title ? getShortTitle(speaker.title) : 'AI Keynote Speaker'
  const pageTitle = `${speaker.name} - ${shortTitle}`

  // Special optimization for featured speakers
  const isAdamCheyer = slug === 'adam-cheyer'
  const optimizedDescription = isAdamCheyer
    ? `Book Adam Cheyer, Siri Co-Founder and AI pioneer, for your next event. Leading AI keynote speaker with 30+ years experience. VP Engineering at Samsung, founder of Viv Labs (acquired by Samsung). Get pricing & availability.`
    : description
    
  return {
    title: pageTitle,
    description: optimizedDescription,
    keywords: isAdamCheyer 
      ? ["Adam Cheyer", "Adam Cheyer speaker", "Siri co-founder", "Adam Cheyer keynote", "book Adam Cheyer", "Adam Cheyer speaking fee", "AI pioneer speaker", "Viv Labs founder", "Samsung AI VP", ...keywords].slice(0, 25)
      : keywords.slice(0, 20),
    openGraph: {
      title: `${speaker.name} - ${speaker.title || 'AI Keynote Speaker'}`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${speaker.name} - ${speaker.title || 'AI Keynote Speaker'}`,
        },
      ],
      type: "profile",
      profile: {
        firstName: speaker.name.split(' ')[0],
        lastName: speaker.name.split(' ').slice(1).join(' '),
      },
    },
    twitter: {
      card: "summary_large_image",
      title: `${speaker.name} - ${speaker.title || 'AI Keynote Speaker'}`,
      description,
      images: [imageUrl],
      creator: speaker.twitter || undefined,
    },
    alternates: {
      canonical: `https://speakabout.ai/speakers/${slug}`,
    },
  }
}

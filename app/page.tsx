import type { Metadata } from "next"
import Hero from "@/components/hero"
import ClientLogos from "@/components/client-logos"
import FeaturedSpeakers from "@/components/featured-speakers"
import WhyChooseUs from "@/components/why-choose-us"
import NavigateTheNoise from "@/components/navigate-the-noise"
import SEOContent from "@/components/seo-content"
import HomeFAQSection from "@/components/home-faq-section"
import BookingCTA from "@/components/booking-cta"
import { getFeaturedSpeakers, type Speaker } from "@/lib/speakers-data"
import { getPageContent, getFromContent } from "@/lib/website-content"

export const metadata: Metadata = {
  title: "AI Keynote Speakers | Book Artificial Intelligence Speakers for Events",
  description:
    "Book an AI keynote speaker from the #1 AI-exclusive bureau. 70+ artificial intelligence keynote speakers including Siri founders, OpenAI staff & Stanford AI experts.",
  keywords:
    "AI keynote speaker, AI keynote speakers, artificial intelligence keynote speaker, artificial intelligence keynote speakers, ai expert speaker, book AI speaker, AI speaker bureau, AI conference speakers, machine learning speakers, generative AI speakers",
  openGraph: {
    title: "AI Keynote Speaker | Book Artificial Intelligence Speakers",
    description:
      "Book an AI keynote speaker from the #1 AI-exclusive bureau. 70+ artificial intelligence keynote speakers for conferences, corporate events & summits.",
    type: "website",
    url: "https://speakabout.ai",
    images: [
      {
        url: "/hero-image.jpg",
        width: 1200,
        height: 630,
        alt: "Speak About AI - Top AI Keynote Speakers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Keynote Speaker | Book Artificial Intelligence Speakers",
    description:
      "Book an AI keynote speaker from the #1 AI-exclusive bureau. 70+ artificial intelligence keynote speakers for your event.",
    images: ["/hero-image.jpg"],
  },
  alternates: {
    canonical: "https://speakabout.ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

// Schema.org structured data for organization and service
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Speak About AI",
  url: "https://speakabout.ai",
  logo: "https://speakabout.ai/logo.png",
  description:
    "The world's only AI-exclusive speaker bureau, connecting organizations with top artificial intelligence keynote speakers.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Silicon Valley",
    addressRegion: "CA",
    addressCountry: "US",
  },
  sameAs: [
    "https://www.linkedin.com/company/speak-about-ai",
    "https://twitter.com/speakaboutai",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-415-665-2442",
    contactType: "sales",
    email: "hello@speakabout.ai",
    availableLanguage: ["en"],
    areaServed: "Worldwide",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does it cost to book an AI keynote speaker?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AI keynote speaker fees typically range from $5K-$20K for emerging experts to $20K+ for industry leaders. Final pricing depends on format, location, date, and speaker requirements."
      }
    },
    {
      "@type": "Question", 
      name: "What topics do AI speakers cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our AI speakers cover artificial intelligence strategy, machine learning, generative AI, ChatGPT, AI ethics, AI in healthcare, automation, and industry-specific AI applications."
      }
    },
    {
      "@type": "Question",
      name: "Do you provide virtual AI keynote speakers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we offer both in-person and virtual AI keynote speakers for online events, webinars, and hybrid conferences worldwide."
      }
    }
  ]
}

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "AI Keynote Speaker Booking",
  provider: {
    "@type": "Organization",
    name: "Speak About AI",
  },
  description:
    "Professional booking service for AI keynote speakers, artificial intelligence experts, and technology thought leaders for corporate events, conferences, and seminars.",
  areaServed: {
    "@type": "Country",
    name: "Worldwide",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "AI Speaker Categories",
    itemListElement: [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "AI Strategy Speakers" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Machine Learning Experts" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "AI Ethics Speakers" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Generative AI Speakers" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "AI Healthcare Speakers" }},
    ]
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    reviewCount: "127",
    bestRating: "5"
  }
}

export default async function HomePage() {
  // Fetch featured speakers
  let featuredSpeakers: Speaker[] = []
  try {
    featuredSpeakers = await getFeaturedSpeakers(6)
    if (featuredSpeakers.length === 0) {
      console.warn(
        "HomePage: getFeaturedSpeakers returned an empty array. This might be due to a fetch error or no featured speakers.",
      )
    }
  } catch (error) {
    console.error("HomePage: Failed to load featured speakers:", error)
  }

  // Fetch content for featured speakers section
  const content = await getPageContent('home')
  const featuredTitle = getFromContent(content, 'home', 'featured-speakers', 'title') || 'Featured AI Keynote Speakers'
  const featuredSubtitle = getFromContent(content, 'home', 'featured-speakers', 'subtitle') || 'World-class artificial intelligence experts, machine learning pioneers, and tech visionaries who are shaping the future of AI across every industry.'
  const featuredCtaText = getFromContent(content, 'home', 'featured-speakers', 'cta_text') || 'View All AI Speakers'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <main className="min-h-screen">
        <Hero />
        <ClientLogos />
        <FeaturedSpeakers
          initialSpeakers={featuredSpeakers}
          title={featuredTitle}
          subtitle={featuredSubtitle}
          ctaText={featuredCtaText}
        />
        <WhyChooseUs />
        <NavigateTheNoise />
        <SEOContent />
        <HomeFAQSection />
        <BookingCTA />
      </main>
    </>
  )
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Speak About AI",
    "url": "https://www.speakabout.ai",
    "logo": "https://www.speakabout.ai/new-ai-logo.png",
    "description": "The premier AI-exclusive keynote speakers bureau trusted by Fortune 500 companies",
    "sameAs": [
      "https://www.linkedin.com/company/speak-about-ai",
      "https://twitter.com/speakaboutai"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-650-123-4567",
      "contactType": "sales",
      "areaServed": "Worldwide",
      "availableLanguage": ["English"]
    }
  }
}

export function generateSpeakerSchema(speaker: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": speaker.name,
    "jobTitle": speaker.title || "AI Keynote Speaker",
    "description": speaker.bio,
    "image": speaker.image ? `https://www.speakabout.ai${speaker.image}` : undefined,
    "url": `https://www.speakabout.ai/speakers/${speaker.slug}`,
    "worksFor": {
      "@type": "Organization",
      "name": speaker.company || "Independent"
    },
    "knowsAbout": speaker.expertise || ["Artificial Intelligence", "Machine Learning", "Technology"]
  }
}

export function generateServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Keynote Speaker Booking",
    "provider": {
      "@type": "Organization",
      "name": "Speak About AI"
    },
    "areaServed": "Worldwide",
    "description": "Book world-class AI keynote speakers for conferences, corporate events, and summits"
  }
}

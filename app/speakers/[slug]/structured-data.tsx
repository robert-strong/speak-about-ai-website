export function generateSpeakerStructuredData(speaker: any, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": url,
    "name": speaker.name,
    "url": url,
    "image": speaker.headshot_url || `https://speakabout.ai/speakers/${speaker.slug}.jpg`,
    "jobTitle": speaker.title || "AI Keynote Speaker",
    "description": speaker.bio || speaker.short_bio,
    "worksFor": {
      "@type": "Organization",
      "name": speaker.company || "Independent"
    },
    "sameAs": [
      speaker.linkedin,
      speaker.twitter,
      speaker.website
    ].filter(Boolean),
    "knowsAbout": speaker.topics || ["Artificial Intelligence", "Machine Learning", "Technology"],
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Keynote Speaker",
      "description": "Professional keynote speaking on AI and technology topics",
      "occupationalCategory": "27-3099.00"
    }
  }
}

export function generateBlogStructuredData(post: any, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url,
    "headline": post.title,
    "description": post.excerpt,
    "url": url,
    "datePublished": post.publishedDate,
    "dateModified": post.updatedDate || post.publishedDate,
    "author": {
      "@type": "Person",
      "name": post.author?.name || "Noah Cheyer",
      "url": "https://speakabout.ai/our-team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Speak About AI",
      "logo": {
        "@type": "ImageObject",
        "url": "https://speakabout.ai/logo.png"
      }
    },
    "image": post.featuredImage?.url ? `https:${post.featuredImage.url}` : "https://speakabout.ai/og-image.jpg",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  }
}
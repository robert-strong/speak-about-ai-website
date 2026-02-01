/**
 * Centralized content defaults - Single source of truth for all website content
 *
 * This file defines all default content values used throughout the website.
 * It is used by:
 * - lib/website-content.ts (fallbacks when database content is missing)
 * - app/api/admin/website-content/route.ts (seeding the database)
 * - Components as fallback values
 */

// Structured defaults organized by page > section > key
export const CONTENT_DEFAULTS = {
  home: {
    hero: {
      badge: '#1 AI-Exclusive Speaker Bureau',
      title: 'Book an AI Speaker for Your Event',
      subtitle: 'The #1 AI speaker bureau with exclusive access to 70+ AI pioneers including Siri Co-Founders, OpenAI Staff, and Stanford Researchers',
    },
    'client-logos': {
      title: 'Trusted by Industry Leaders',
      subtitle: 'Our speakers have worked with leading organizations around the world for their most important events.',
      cta_text: 'View Past Clients & Events',
      cta_link: '/our-services#testimonials',
    },
    'featured-speakers': {
      title: 'Featured AI Keynote Speakers',
      subtitle: 'World-class artificial intelligence experts, machine learning pioneers, and tech visionaries who are shaping the future of AI across every industry.',
      cta_text: 'View All AI Speakers',
    },
    'why-choose-us': {
      section_title: 'Why Work with Speak About AI?',
      section_subtitle: "We book artificial intelligence keynote speakers for your organization's event who don't just talk about the future—they're the innovators building the tech.",
      feature1_title: 'Access to Exclusive AI Pioneers',
      feature1_description: 'Direct connections to the architects of modern AI—Siri co-founders, former Shazam executives, and the researchers who literally authored the AI textbooks.',
      feature2_title: '24-Hour Response Guarantee',
      feature2_description: 'Lightning-fast turnaround, guaranteed. From first inquiry to booking.',
      feature3_title: 'White-Glove Speaker Coordination',
      feature3_description: 'We ensure seamless execution from booking to showtime.',
      feature4_title: 'We Help You Navigate The Noise',
      feature4_description: 'Cut through the AI hype with our deep industry expertise and transparent guidance.',
      feature5_title: 'Proven Stage Presence',
      feature5_description: 'Our speakers command every venue with authority and authenticity.',
      feature6_title: 'Actionable Industry Intelligence',
      feature6_description: 'Tailored AI insights for your sector with concrete next steps.',
    },
    navigate: {
      section_title: 'Navigate the AI Speaker Landscape',
      section_subtitle: 'Clear guidance to help you make informed decisions faster',
      budget_title: 'Budget Guidance',
      budget_tier1_range: '$5k - $20k',
      budget_tier1_desc: 'Rising AI experts, academics, and tech consultants',
      budget_tier2_range: '$20k - $50k',
      budget_tier2_desc: 'Industry leaders, published authors, and proven speakers',
      budget_tier3_range: '$50k+',
      budget_tier3_desc: 'AI pioneers, tech founders, and household names',
      budget_disclaimer: 'Final fees vary by format, location, and date. Contact us for precise quotes.',
      audience_title: 'Audience Types',
      audience_list: 'Corporate & Enterprise, Public Sector & Government, Startups & Scale-ups, Academic & Research, Healthcare & Life Sciences, Financial Services, Technology Companies',
      delivery_title: 'Global Delivery',
      delivery_inperson_title: 'In-Person Events',
      delivery_inperson_desc: 'Worldwide coverage with speaker coordination and booking support',
      delivery_virtual_title: 'Virtual Events',
      delivery_virtual_desc: 'Professional virtual keynotes optimized for online engagement',
      delivery_hybrid_title: 'Hybrid Format',
      delivery_hybrid_desc: 'Seamless blend of in-person and remote engagement for maximum reach',
    },
    'seo-content': {
      main_heading: 'AI Keynote Speakers: Transform Your Event with Leading AI Experts',
      intro_paragraph: "Speak About AI is the premier AI keynote speakers bureau, representing over 70 of the world's most influential artificial intelligence speakers. Our roster includes pioneering AI researchers, Silicon Valley executives, Siri co-founders, Stanford AI professors, and Fortune 500 AI leaders who deliver engaging keynotes on artificial intelligence, machine learning, and generative AI.",
      why_heading: 'Why Choose Our AI Speakers Bureau?',
      why_paragraph: "As a speaker bureau focused exclusively on artificial intelligence, we provide unparalleled expertise in matching your event with the perfect AI keynote speaker. Whether you need a generative AI expert, machine learning pioneer, or AI ethics thought leader, our curated selection of AI speakers delivers transformative insights that resonate with your audience.",
      industries_heading: 'Industries We Serve',
      industries_list: 'Technology & Software Companies, Healthcare & Pharmaceutical, Financial Services & Banking, Manufacturing & Automotive, Retail & E-commerce, Education & Research Institutions',
      topics_heading: 'Popular AI Speaking Topics',
      topics_list: 'Generative AI & Large Language Models, AI Strategy & Digital Transformation, Machine Learning Applications, AI Ethics & Responsible AI, Future of Work with AI, AI in Healthcare & Life Sciences',
      book_heading: 'Book an AI Speaker for Your Next Event',
      book_paragraph: 'From keynote presentations at major conferences to executive briefings and workshop facilitation, our AI speakers bring cutting-edge insights and practical applications to every engagement. Each speaker is carefully vetted for their expertise, presentation skills, and ability to translate complex AI concepts into actionable business strategies.',
      cta_button_text: 'Book an AI Speaker Today',
      closing_paragraph: "Our clients include provincial governments, international conferences, Fortune 500 companies, leading universities, and innovative startups. When you book an AI keynote speaker through Speak About AI, you're partnering with the trusted leader in AI thought leadership.",
    },
    'seo-faq': {
      section_title: 'Frequently Asked Questions About Booking AI Speakers',
      faq1_question: 'How do I book an AI keynote speaker?',
      faq1_answer: 'Simply browse our speakers, select your preferred AI expert, and contact us through our booking form. Our team will handle all logistics and ensure a seamless experience.',
      faq2_question: 'What makes Speak About AI different?',
      faq2_answer: "We're the only speaker bureau focused exclusively on AI, giving us unmatched expertise in artificial intelligence thought leadership and deep relationships with top AI speakers.",
      faq3_question: 'Do you offer virtual AI keynote speakers?',
      faq3_answer: 'Yes, many of our AI speakers offer both in-person and virtual keynote presentations, ensuring global accessibility for your events.',
      faq4_question: "What's the typical fee for an AI speaker?",
      faq4_answer: 'AI speaker fees typically range from $5K-$20K for emerging experts to $20K+ for industry leaders. Final pricing depends on format, location, date, and speaker requirements. Contact us for a precise quote tailored to your event.',
    },
    faq: {
      section_title: 'Frequently Asked Questions',
      faq1_question: 'How long are typical speaking engagements?',
      faq1_answer: "The duration can vary based on your needs. Keynotes typically range from 30-60 minutes, while workshops can be half-day or full-day events. We're flexible and can adjust the format to fit your schedule.",
      faq2_question: 'Can we book multiple services for a single event?',
      faq2_answer: 'Yes, many clients combine our services. For example, you might book a keynote speaker for a large session, followed by a smaller workshop or fireside chat. We can help you design a program that maximizes value for your audience.',
      faq3_question: 'Can your speakers create custom content for our event?',
      faq3_answer: 'Absolutely. Our speakers are happy to tailor their presentations to your specific needs, industry, and audience. This ensures that the content is relevant and valuable to your attendees.',
      faq4_question: 'How do you tailor your services to different industries?',
      faq4_answer: "Our diverse roster of AI experts allows us to match speakers and content to your specific industry. Whether you're in healthcare, finance, technology, or any other sector, we can provide relevant insights and applications of AI to your field.",
    },
    'booking-cta': {
      title: 'Ready to Book Your AI Keynote Speaker?',
      subtitle: 'Connect with our expert team to find the perfect AI speaker for your event. We make the booking process seamless and efficient.',
      contact_info: 'Text or call us at +1 (415) 665-2442 on WhatsApp or reach out to human@speakabout.ai by email',
      primary_cta_text: 'Get Speaker Recommendations',
      primary_cta_link: '/contact?source=home_page_cta_main',
      secondary_cta_text: 'Explore All Speakers',
      secondary_cta_link: '/speakers',
      whatsapp_number: '+1 (415) 665-2442',
      whatsapp_link: 'https://wa.me/14156652442',
      email: 'human@speakabout.ai',
    },
    images: {
      hero_image: '/robert-strong-adam-cheyer-peter-norvig-on-stage-at-microsoft.jpg',
      hero_image_alt: 'Robert Strong, Adam Cheyer (Siri Co-Founder), and Peter Norvig (Google & Stanford AI Researcher) on stage at a Microsoft event',
    },
    meta: {
      title: 'AI Keynote Speakers | Book Artificial Intelligence Speakers for Events',
      description: 'Book an AI keynote speaker from the #1 AI-exclusive bureau. 70+ artificial intelligence keynote speakers including Siri founders, OpenAI staff & Stanford AI experts.',
      keywords: 'AI keynote speaker, AI keynote speakers, artificial intelligence keynote speaker, artificial intelligence keynote speakers, ai expert speaker, book AI speaker, AI speaker bureau, AI conference speakers, machine learning speakers, generative AI speakers',
      og_title: 'AI Keynote Speaker | Book Artificial Intelligence Speakers',
      og_description: 'Book an AI keynote speaker from the #1 AI-exclusive bureau. 70+ artificial intelligence keynote speakers for conferences, corporate events & summits.',
    },
  },
  services: {
    hero: {
      badge: 'What We Offer',
      title: 'Our Services',
      subtitle: 'At Speak About AI, we connect you with world-class AI experts to amaze your attendees, educate your executives, and inspire innovation. Our comprehensive range of services ensures you can leverage AI insights in the format that best suits your needs.',
    },
    offerings: {
      offering1_title: 'Keynote Speeches',
      offering1_description: 'Inspire your audience with engaging and informative keynote speeches on the future of technology.',
      offering2_title: 'Panel Discussions',
      offering2_description: 'Facilitate insightful and dynamic panel discussions on industry trends and challenges.',
      offering3_title: 'Fireside Chats',
      offering3_description: 'Create intimate and engaging conversations with industry leaders in a fireside chat format.',
      offering4_title: 'Workshops',
      offering4_description: "Provide hands-on learning experiences with interactive workshops tailored to your audience's needs.",
      offering5_title: 'Virtual Presentations',
      offering5_description: 'Reach a global audience with engaging and professional virtual presentations.',
      offering6_title: 'Custom Video Content',
      offering6_description: 'Create compelling video content for marketing, training, and internal communications.',
    },
    process: {
      section_title: 'Our Process',
      section_subtitle: 'From initial consultation to final delivery, we ensure a seamless experience that brings world-class AI expertise to your event.',
      step1_title: 'Contact Us',
      step1_description: 'Fill out our online form to request a free consultation. One of our team members will contact you within 24 hours to discuss your event needs.',
      step2_title: 'Pick Your Speaker',
      step2_description: "Based on your event goals, audience, and budget, we'll provide a curated list of AI experts for you to consider.",
      step3_title: 'Enjoy Your Event',
      step3_description: "Once you've selected your speaker, we handle all the details—from booking to logistics to post-event follow-up.",
    },
    events: {
      section_title: 'Our In-Person Events',
      section_subtitle: 'In addition to helping others find keynote speakers for their events, we also host our own event series in the Bay Area, showcasing the speakers on our roster.',
      latest_event_title: 'Latest Event',
      latest_event_description: 'Our last event, hosted at Microsoft HQ in Silicon Valley, featured speakers such as Adam Cheyer, Peter Norvig, Maya Ackerman, Murray Newlands, Jeremiah Owyang, Katie McMahon, Max Sills, and many more.',
      latest_event_cta: "Whether you're an event planner, an executive, or just interested in AI, these events are a great way to get an overview of the current AI landscape!",
      newsletter_title: 'Stay Updated',
      newsletter_description: 'Sign up with your email address to stay up to date on our upcoming events.',
      event_image: '/events/robert-strong-on-stage-at-microsoft.jpg',
    },
    faq: {
      section_title: 'Frequently Asked Questions',
      faq1_question: 'How long are typical speaking engagements?',
      faq1_answer: "The duration can vary based on your needs. Keynotes typically range from 30-60 minutes, while workshops can be half-day or full-day events. We're flexible and can adjust the format to fit your schedule.",
      faq2_question: 'Can we book multiple services for a single event?',
      faq2_answer: 'Yes, many clients combine our services. For example, you might book a keynote speaker for a large session, followed by a smaller workshop or fireside chat. We can help you design a program that maximizes value for your audience.',
      faq3_question: 'Can your speakers create custom content for our event?',
      faq3_answer: 'Absolutely. Our speakers are happy to tailor their presentations to your specific needs, industry, and audience. This ensures that the content is relevant and valuable to your attendees.',
      faq4_question: 'How do you tailor your services to different industries?',
      faq4_answer: "Our diverse roster of AI experts allows us to match speakers and content to your specific industry. Whether you're in healthcare, finance, technology, or any other sector, we can provide relevant insights and applications of AI to your field.",
    },
    cta: {
      title: 'Ready to Elevate Your Event?',
      subtitle: 'Let us connect you with the perfect AI expert to inspire your audience and drive meaningful conversations about the future of artificial intelligence.',
      button_text: 'Book Speaker Today',
      phone_number: '+1-415-665-2442',
      email: 'human@speakabout.ai',
      stat1_value: '24 Hours',
      stat1_label: 'Average Response Time',
      stat2_value: '67+',
      stat2_label: 'AI Experts Available',
      stat3_value: '500+',
      stat3_label: 'Successful Events',
    },
    images: {
      offering1_image: '/services/adam-cheyer-stadium.jpg',
      offering2_image: '/services/sharon-zhou-panel.jpg',
      offering3_image: '/services/allie-k-miller-fireside.jpg',
      offering4_image: '/services/tatyana-mamut-speaking.jpg',
      offering5_image: '/services/sharon-zhou-headshot.png',
      offering6_image: '/services/simon-pierro-youtube.jpg',
    },
    meta: {
      title: 'AI Speaker Services | Keynotes, Panels, Workshops & More',
      description: 'Comprehensive AI speaker services including keynote speeches, panel discussions, fireside chats, workshops, and custom video content from top AI experts.',
      keywords: 'AI speaker services, AI keynote speaker, AI panel discussions, AI workshops, virtual AI presentations',
      og_title: 'AI Speaker Services | Speak About AI',
      og_description: 'Full range of AI speaker services for your events - keynotes, panels, workshops, and more from world-class AI experts.',
    },
  },
  speakers: {
    hero: {
      title: 'All AI Keynote Speakers',
      subtitle: 'Browse our complete directory of world-class artificial intelligence experts, tech visionaries, and industry practitioners.',
    },
    filters: {
      search_placeholder: 'Search speakers by name, expertise, or industry...',
      industry_label: 'Industry',
      all_industries: 'All Industries',
      fee_label: 'Fee Range',
      all_fees: 'All Fee Ranges',
      location_label: 'Location',
      all_locations: 'All Locations',
      showing_text: 'Showing {displayed} of {total} speakers',
    },
    results: {
      loading_text: 'Loading speakers...',
      no_results: 'No speakers found matching your criteria. Try adjusting your search or filters.',
      clear_filters: 'Clear Filters',
    },
    buttons: {
      load_more: 'Load More Speakers ({remaining} remaining)',
    },
    meta: {
      title: 'AI Keynote Speakers | Browse All AI Speakers',
      description: 'Browse our complete directory of AI keynote speakers. 70+ artificial intelligence experts including Siri co-founders, Stanford researchers, and tech pioneers.',
      keywords: 'AI speakers, AI keynote speakers, artificial intelligence speakers, tech speakers, AI experts',
    },
  },
  workshops: {
    hero: {
      title: 'AI Workshops',
      subtitle: 'Discover hands-on AI workshops led by industry experts. Interactive training programs covering machine learning, generative AI, and practical implementation strategies for your team.',
    },
    filters: {
      search_placeholder: 'Search workshops by name, topic, or instructor...',
      show_filters: 'Show Filters',
      hide_filters: 'Hide Filters',
      format_label: 'Format',
      all_formats: 'All Formats',
      length_label: 'Length',
      all_lengths: 'All Lengths',
      short_length: 'Short (< 1 hour)',
      medium_length: 'Medium (1-2 hours)',
      long_length: 'Long (> 2 hours)',
      location_label: 'Instructor Location',
      all_locations: 'All Locations',
      audience_label: 'Target Audience',
      all_audiences: 'All Audiences',
      showing_text: 'Showing {displayed} of {total} workshops',
      clear_filters: 'Clear All Filters',
    },
    results: {
      loading_text: 'Loading workshops...',
      no_results: 'No workshops found matching your criteria.',
    },
    buttons: {
      inquire: 'Inquire About Workshop',
      view_details: 'View Details',
    },
    meta: {
      title: 'AI Workshops | Hands-On AI Training Programs',
      description: 'Discover hands-on AI workshops led by industry experts. Interactive training programs covering machine learning, generative AI, and practical implementation strategies.',
      keywords: 'AI workshops, AI training, machine learning workshops, generative AI training, corporate AI training',
    },
  },
  team: {
    hero: {
      badge: 'Our Story',
      title: 'How It All Started',
      story_paragraph1: "Robert Strong has been booking himself and other talent for 30+ years, and has called Silicon Valley home for 20 of them. Over the decades, he built deep relationships with pioneers in the AI space—people like Daniel Kraft—and ended up living down the street from Peter Norvig in Palo Alto, where they'd walk their Taiwanese street dogs together.",
      story_paragraph2: "After ChatGPT launched and his friends in the AI space started getting flooded with speaking requests, Robert decided to turn it into an agency. With his decades of experience in talent booking and deep roots in Silicon Valley's tech community, he was uniquely positioned to build something special.",
      story_paragraph3: 'Today, Speak About AI has booked speakers everywhere from Silicon Valley to Singapore—helping organizations around the world bring the brightest minds and best speakers in artificial intelligence to their stages.',
    },
    members: {
      member1_name: 'Robert Strong',
      member1_title: 'CEO',
      member1_bio: "Speak About AI was founded by author, speaker, and entertainer Robert Strong and is a division of Strong Entertainment, LLC. With 30+ years of experience booking speakers and entertainers globally, Robert brings unparalleled expertise to the AI speaking circuit. He's also a world-renowned magician who's performed at the White House twice, on Penn & Teller Fool Us, and for every major tech company in Silicon Valley. His Amazon best-selling book 'Amaze & Delight: Secrets to Creating Magic in Business' showcases his unique approach to business entertainment.",
      member1_linkedin: 'https://linkedin.com/in/robertstrong',
      member1_image: '/team/robert-strong-headshot.png',
    },
    cta: {
      title: 'Get In Touch',
      subtitle: "Interested in working with Speak About AI or have questions about our services? We'd love to hear from you.",
      button_text: 'Email Us',
      email: 'human@speakabout.ai',
    },
    meta: {
      title: 'Our Team | Speak About AI - AI Speaker Bureau',
      description: 'Meet the team behind Speak About AI. 30+ years of experience booking speakers and deep roots in Silicon Valley tech community.',
      keywords: 'Speak About AI team, Robert Strong, AI speaker bureau team, speaker booking experts',
      og_title: 'Our Team | Speak About AI',
      og_description: 'Meet the team at Speak About AI - the premier AI-exclusive speaker bureau.',
    },
  },
  footer: {
    company: {
      logo: '/speak-about-ai-light-logo.png',
      logo_alt: 'Speak About AI',
      description: "The world's only AI-exclusive speaker bureau, connecting organizations around the world with the most sought-after artificial intelligence experts and thought leaders.",
      phone: '+1 (415) 665-2442',
      email: 'human@speakabout.ai',
    },
    'quick-links': {
      title: 'Quick Links',
      links: JSON.stringify([
        { text: 'All Speakers', url: '/speakers' },
        { text: 'Our Services', url: '/our-services' },
        { text: 'Our Team', url: '/our-team' },
        { text: 'Contact Us', url: '/contact' },
        { text: 'Blog', url: '/blog' }
      ]),
    },
    industries: {
      title: 'Industries',
      links: JSON.stringify([
        { text: 'Healthcare AI', url: '/industries/healthcare-keynote-speakers' },
        { text: 'Technology & Enterprise', url: '/industries/technology-keynote-speakers' }
      ]),
    },
    'for-speakers': {
      title: 'For Speakers',
      links: JSON.stringify([
        { text: 'Apply to Be a Speaker', url: '/apply' }
      ]),
    },
    bottom: {
      copyright: '© 2026 Speak About AI. All rights reserved.',
      linkedin_url: 'https://www.linkedin.com/company/speakabout-ai/',
    },
  },
} as const

// Type for the structured defaults
export type ContentDefaults = typeof CONTENT_DEFAULTS

/**
 * Get a default value using page, section, and key
 */
export function getDefault(page: string, section: string, key: string): string {
  const pageDefaults = CONTENT_DEFAULTS[page as keyof ContentDefaults]
  if (!pageDefaults) return ''

  const sectionDefaults = pageDefaults[section as keyof typeof pageDefaults]
  if (!sectionDefaults) return ''

  return (sectionDefaults as Record<string, string>)[key] || ''
}

/**
 * Get default value using a full key like "home.hero.title"
 */
export function getDefaultByKey(fullKey: string): string {
  const [page, section, ...keyParts] = fullKey.split('.')
  const key = keyParts.join('.')
  return getDefault(page, section, key)
}

/**
 * Get all defaults as a flat Record<string, string> for a specific page
 */
export function getFlatDefaults(page?: string): Record<string, string> {
  const result: Record<string, string> = {}

  const pages = page
    ? { [page]: CONTENT_DEFAULTS[page as keyof ContentDefaults] }
    : CONTENT_DEFAULTS

  for (const [pageName, sections] of Object.entries(pages)) {
    if (!sections) continue
    for (const [sectionName, keys] of Object.entries(sections)) {
      if (!keys || typeof keys !== 'object') continue
      for (const [keyName, value] of Object.entries(keys)) {
        result[`${pageName}.${sectionName}.${keyName}`] = value as string
      }
    }
  }

  return result
}

/**
 * Convert defaults to array format for database seeding
 */
export function getDefaultsAsArray(): Array<{
  page: string
  section: string
  content_key: string
  content_value: string
}> {
  const result: Array<{
    page: string
    section: string
    content_key: string
    content_value: string
  }> = []

  for (const [page, sections] of Object.entries(CONTENT_DEFAULTS)) {
    for (const [section, keys] of Object.entries(sections)) {
      for (const [key, value] of Object.entries(keys)) {
        result.push({
          page,
          section,
          content_key: key,
          content_value: value as string,
        })
      }
    }
  }

  return result
}

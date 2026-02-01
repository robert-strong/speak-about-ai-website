import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { revalidatePath } from 'next/cache'
import { clearContentCache } from '@/lib/website-content'

// Default content for seeding - extracted from actual page components
const DEFAULT_CONTENT = [
  // Home Page - Hero (from components/hero.tsx)
  { page: 'home', section: 'hero', content_key: 'badge', content_value: '#1 AI-Exclusive Speaker Bureau' },
  { page: 'home', section: 'hero', content_key: 'title', content_value: 'Book an AI Speaker for Your Event' },
  { page: 'home', section: 'hero', content_key: 'subtitle', content_value: 'The #1 AI speaker bureau with exclusive access to 70+ AI pioneers including Siri Co-Founders, OpenAI Staff, and Stanford Researchers' },

  // Home Page - Client Logos (from components/client-logos.tsx)
  { page: 'home', section: 'client-logos', content_key: 'title', content_value: 'Trusted by Industry Leaders' },
  { page: 'home', section: 'client-logos', content_key: 'subtitle', content_value: 'Our speakers have worked with leading organizations around the world for their most important events.' },
  { page: 'home', section: 'client-logos', content_key: 'cta_text', content_value: 'View Past Clients & Events' },
  { page: 'home', section: 'client-logos', content_key: 'cta_link', content_value: '/our-services#testimonials' },

  // Home Page - Why Choose Us (from components/why-choose-us.tsx)
  { page: 'home', section: 'why-choose-us', content_key: 'section_title', content_value: 'Why Work with Speak About AI?' },
  { page: 'home', section: 'why-choose-us', content_key: 'section_subtitle', content_value: "We book artificial intelligence keynote speakers for your organization's event who don't just talk about the future—they're the innovators building the tech." },
  { page: 'home', section: 'why-choose-us', content_key: 'feature1_title', content_value: 'Access to Exclusive AI Pioneers' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature1_description', content_value: 'Direct connections to the architects of modern AI—Siri co-founders, former Shazam executives, and the researchers who literally authored the AI textbooks.' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature2_title', content_value: '24-Hour Response Guarantee' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature2_description', content_value: 'Lightning-fast turnaround, guaranteed. From first inquiry to booking.' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature3_title', content_value: 'White-Glove Speaker Coordination' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature3_description', content_value: 'We ensure seamless execution from booking to showtime.' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature4_title', content_value: 'We Help You Navigate The Noise' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature4_description', content_value: 'Cut through the AI hype with our deep industry expertise and transparent guidance.' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature5_title', content_value: 'Proven Stage Presence' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature5_description', content_value: 'Our speakers command every venue with authority and authenticity.' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature6_title', content_value: 'Actionable Industry Intelligence' },
  { page: 'home', section: 'why-choose-us', content_key: 'feature6_description', content_value: 'Tailored AI insights for your sector with concrete next steps.' },

  // Home Page - Navigate the Speaker Landscape (from components/navigate-the-noise.tsx)
  { page: 'home', section: 'navigate', content_key: 'section_title', content_value: 'Navigate the AI Speaker Landscape' },
  { page: 'home', section: 'navigate', content_key: 'section_subtitle', content_value: 'Clear guidance to help you make informed decisions faster' },
  // Budget Guidance Card
  { page: 'home', section: 'navigate', content_key: 'budget_title', content_value: 'Budget Guidance' },
  { page: 'home', section: 'navigate', content_key: 'budget_tier1_range', content_value: '$5k - $20k' },
  { page: 'home', section: 'navigate', content_key: 'budget_tier1_desc', content_value: 'Rising AI experts, academics, and tech consultants' },
  { page: 'home', section: 'navigate', content_key: 'budget_tier2_range', content_value: '$20k - $50k' },
  { page: 'home', section: 'navigate', content_key: 'budget_tier2_desc', content_value: 'Industry leaders, published authors, and proven speakers' },
  { page: 'home', section: 'navigate', content_key: 'budget_tier3_range', content_value: '$50k+' },
  { page: 'home', section: 'navigate', content_key: 'budget_tier3_desc', content_value: 'AI pioneers, tech founders, and household names' },
  { page: 'home', section: 'navigate', content_key: 'budget_disclaimer', content_value: 'Final fees vary by format, location, and date. Contact us for precise quotes.' },
  // Audience Types Card
  { page: 'home', section: 'navigate', content_key: 'audience_title', content_value: 'Audience Types' },
  { page: 'home', section: 'navigate', content_key: 'audience_list', content_value: 'Corporate & Enterprise, Public Sector & Government, Startups & Scale-ups, Academic & Research, Healthcare & Life Sciences, Financial Services, Technology Companies' },
  // Global Delivery Card
  { page: 'home', section: 'navigate', content_key: 'delivery_title', content_value: 'Global Delivery' },
  { page: 'home', section: 'navigate', content_key: 'delivery_inperson_title', content_value: 'In-Person Events' },
  { page: 'home', section: 'navigate', content_key: 'delivery_inperson_desc', content_value: 'Worldwide coverage with speaker coordination and booking support' },
  { page: 'home', section: 'navigate', content_key: 'delivery_virtual_title', content_value: 'Virtual Events' },
  { page: 'home', section: 'navigate', content_key: 'delivery_virtual_desc', content_value: 'Professional virtual keynotes optimized for online engagement' },
  { page: 'home', section: 'navigate', content_key: 'delivery_hybrid_title', content_value: 'Hybrid Format' },
  { page: 'home', section: 'navigate', content_key: 'delivery_hybrid_desc', content_value: 'Seamless blend of in-person and remote engagement for maximum reach' },

  // Home Page - FAQ Section (from components/faq-section.tsx)
  { page: 'home', section: 'faq', content_key: 'section_title', content_value: 'Frequently Asked Questions' },
  { page: 'home', section: 'faq', content_key: 'faq1_question', content_value: 'How long are typical speaking engagements?' },
  { page: 'home', section: 'faq', content_key: 'faq1_answer', content_value: "The duration can vary based on your needs. Keynotes typically range from 30-60 minutes, while workshops can be half-day or full-day events. We're flexible and can adjust the format to fit your schedule." },
  { page: 'home', section: 'faq', content_key: 'faq2_question', content_value: 'Can we book multiple services for a single event?' },
  { page: 'home', section: 'faq', content_key: 'faq2_answer', content_value: 'Yes, many clients combine our services. For example, you might book a keynote speaker for a large session, followed by a smaller workshop or fireside chat. We can help you design a program that maximizes value for your audience.' },
  { page: 'home', section: 'faq', content_key: 'faq3_question', content_value: 'Can your speakers create custom content for our event?' },
  { page: 'home', section: 'faq', content_key: 'faq3_answer', content_value: 'Absolutely. Our speakers are happy to tailor their presentations to your specific needs, industry, and audience. This ensures that the content is relevant and valuable to your attendees.' },
  { page: 'home', section: 'faq', content_key: 'faq4_question', content_value: 'How do you tailor your services to different industries?' },
  { page: 'home', section: 'faq', content_key: 'faq4_answer', content_value: 'Our diverse roster of AI experts allows us to match speakers and content to your specific industry. Whether you\'re in healthcare, finance, technology, or any other sector, we can provide relevant insights and applications of AI to your field.' },

  // Home Page - SEO Content Section (from app/page.tsx)
  { page: 'home', section: 'seo-content', content_key: 'main_heading', content_value: 'AI Keynote Speakers: Transform Your Event with Leading AI Experts' },
  { page: 'home', section: 'seo-content', content_key: 'intro_paragraph', content_value: "Speak About AI is the premier AI keynote speakers bureau, representing over 70 of the world's most influential artificial intelligence speakers. Our roster includes pioneering AI researchers, Silicon Valley executives, Siri co-founders, Stanford AI professors, and Fortune 500 AI leaders who deliver engaging keynotes on artificial intelligence, machine learning, and generative AI." },
  { page: 'home', section: 'seo-content', content_key: 'why_heading', content_value: 'Why Choose Our AI Speakers Bureau?' },
  { page: 'home', section: 'seo-content', content_key: 'why_paragraph', content_value: "As a speaker bureau focused exclusively on artificial intelligence, we provide unparalleled expertise in matching your event with the perfect AI keynote speaker. Whether you need a generative AI expert, machine learning pioneer, or AI ethics thought leader, our curated selection of AI speakers delivers transformative insights that resonate with your audience." },
  { page: 'home', section: 'seo-content', content_key: 'industries_heading', content_value: 'Industries We Serve' },
  { page: 'home', section: 'seo-content', content_key: 'industries_list', content_value: 'Technology & Software Companies, Healthcare & Pharmaceutical, Financial Services & Banking, Manufacturing & Automotive, Retail & E-commerce, Education & Research Institutions' },
  { page: 'home', section: 'seo-content', content_key: 'topics_heading', content_value: 'Popular AI Speaking Topics' },
  { page: 'home', section: 'seo-content', content_key: 'topics_list', content_value: 'Generative AI & Large Language Models, AI Strategy & Digital Transformation, Machine Learning Applications, AI Ethics & Responsible AI, Future of Work with AI, AI in Healthcare & Life Sciences' },
  { page: 'home', section: 'seo-content', content_key: 'book_heading', content_value: 'Book an AI Speaker for Your Next Event' },
  { page: 'home', section: 'seo-content', content_key: 'book_paragraph', content_value: 'From keynote presentations at major conferences to executive briefings and workshop facilitation, our AI speakers bring cutting-edge insights and practical applications to every engagement. Each speaker is carefully vetted for their expertise, presentation skills, and ability to translate complex AI concepts into actionable business strategies.' },
  { page: 'home', section: 'seo-content', content_key: 'cta_button_text', content_value: 'Book an AI Speaker Today' },
  { page: 'home', section: 'seo-content', content_key: 'closing_paragraph', content_value: "Our clients include provincial governments, international conferences, Fortune 500 companies, leading universities, and innovative startups. When you book an AI keynote speaker through Speak About AI, you're partnering with the trusted leader in AI thought leadership." },

  // Home Page - SEO FAQ Section (from app/page.tsx)
  { page: 'home', section: 'seo-faq', content_key: 'section_title', content_value: 'Frequently Asked Questions About Booking AI Speakers' },
  { page: 'home', section: 'seo-faq', content_key: 'faq1_question', content_value: 'How do I book an AI keynote speaker?' },
  { page: 'home', section: 'seo-faq', content_key: 'faq1_answer', content_value: 'Simply browse our speakers, select your preferred AI expert, and contact us through our booking form. Our team will handle all logistics and ensure a seamless experience.' },
  { page: 'home', section: 'seo-faq', content_key: 'faq2_question', content_value: 'What makes Speak About AI different?' },
  { page: 'home', section: 'seo-faq', content_key: 'faq2_answer', content_value: "We're the only speaker bureau focused exclusively on AI, giving us unmatched expertise in artificial intelligence thought leadership and deep relationships with top AI speakers." },
  { page: 'home', section: 'seo-faq', content_key: 'faq3_question', content_value: 'Do you offer virtual AI keynote speakers?' },
  { page: 'home', section: 'seo-faq', content_key: 'faq3_answer', content_value: 'Yes, many of our AI speakers offer both in-person and virtual keynote presentations, ensuring global accessibility for your events.' },
  { page: 'home', section: 'seo-faq', content_key: 'faq4_question', content_value: "What's the typical fee for an AI speaker?" },
  { page: 'home', section: 'seo-faq', content_key: 'faq4_answer', content_value: 'AI speaker fees typically range from $5K-$20K for emerging experts to $20K+ for industry leaders. Final pricing depends on format, location, date, and speaker requirements. Contact us for a precise quote tailored to your event.' },

  // Home Page - SEO Meta Information
  { page: 'home', section: 'meta', content_key: 'title', content_value: 'AI Keynote Speakers | Book Artificial Intelligence Speakers for Events' },
  { page: 'home', section: 'meta', content_key: 'description', content_value: 'Book an AI keynote speaker from the #1 AI-exclusive bureau. 70+ artificial intelligence keynote speakers including Siri founders, OpenAI staff & Stanford AI experts.' },
  { page: 'home', section: 'meta', content_key: 'keywords', content_value: 'AI keynote speaker, AI keynote speakers, artificial intelligence keynote speaker, artificial intelligence keynote speakers, ai expert speaker, book AI speaker, AI speaker bureau, AI conference speakers, machine learning speakers, generative AI speakers' },
  { page: 'home', section: 'meta', content_key: 'og_title', content_value: 'AI Keynote Speaker | Book Artificial Intelligence Speakers' },
  { page: 'home', section: 'meta', content_key: 'og_description', content_value: 'Book an AI keynote speaker from the #1 AI-exclusive bureau. 70+ artificial intelligence keynote speakers for conferences, corporate events & summits.' },

  // Services Page - SEO Meta Information
  { page: 'services', section: 'meta', content_key: 'title', content_value: 'AI Speaker Services | Keynotes, Panels, Workshops & More' },
  { page: 'services', section: 'meta', content_key: 'description', content_value: 'Comprehensive AI speaker services including keynote speeches, panel discussions, fireside chats, workshops, and custom video content from top AI experts.' },
  { page: 'services', section: 'meta', content_key: 'keywords', content_value: 'AI speaker services, AI keynote speaker, AI panel discussions, AI workshops, virtual AI presentations' },
  { page: 'services', section: 'meta', content_key: 'og_title', content_value: 'AI Speaker Services | Speak About AI' },
  { page: 'services', section: 'meta', content_key: 'og_description', content_value: 'Full range of AI speaker services for your events - keynotes, panels, workshops, and more from world-class AI experts.' },

  // Team Page - SEO Meta Information
  { page: 'team', section: 'meta', content_key: 'title', content_value: 'Our Team | Speak About AI - AI Speaker Bureau' },
  { page: 'team', section: 'meta', content_key: 'description', content_value: 'Meet the team behind Speak About AI. 30+ years of experience booking speakers and deep roots in Silicon Valley tech community.' },
  { page: 'team', section: 'meta', content_key: 'keywords', content_value: 'Speak About AI team, Robert Strong, AI speaker bureau team, speaker booking experts' },
  { page: 'team', section: 'meta', content_key: 'og_title', content_value: 'Our Team | Speak About AI' },
  { page: 'team', section: 'meta', content_key: 'og_description', content_value: 'Meet the team at Speak About AI - the premier AI-exclusive speaker bureau.' },

  // Services Page - Hero (from components/services-hero.tsx)
  { page: 'services', section: 'hero', content_key: 'badge', content_value: 'What We Offer' },
  { page: 'services', section: 'hero', content_key: 'title', content_value: 'Our Services' },
  { page: 'services', section: 'hero', content_key: 'subtitle', content_value: 'At Speak About AI, we connect you with world-class AI experts to amaze your attendees, educate your executives, and inspire innovation. Our comprehensive range of services ensures you can leverage AI insights in the format that best suits your needs.' },

  // Services Page - Offerings (from components/service-offerings.tsx)
  { page: 'services', section: 'offerings', content_key: 'offering1_title', content_value: 'Keynote Speeches' },
  { page: 'services', section: 'offerings', content_key: 'offering1_description', content_value: 'Inspire your audience with engaging and informative keynote speeches on the future of technology.' },
  { page: 'services', section: 'offerings', content_key: 'offering2_title', content_value: 'Panel Discussions' },
  { page: 'services', section: 'offerings', content_key: 'offering2_description', content_value: 'Facilitate insightful and dynamic panel discussions on industry trends and challenges.' },
  { page: 'services', section: 'offerings', content_key: 'offering3_title', content_value: 'Fireside Chats' },
  { page: 'services', section: 'offerings', content_key: 'offering3_description', content_value: 'Create intimate and engaging conversations with industry leaders in a fireside chat format.' },
  { page: 'services', section: 'offerings', content_key: 'offering4_title', content_value: 'Workshops' },
  { page: 'services', section: 'offerings', content_key: 'offering4_description', content_value: "Provide hands-on learning experiences with interactive workshops tailored to your audience's needs." },
  { page: 'services', section: 'offerings', content_key: 'offering5_title', content_value: 'Virtual Presentations' },
  { page: 'services', section: 'offerings', content_key: 'offering5_description', content_value: 'Reach a global audience with engaging and professional virtual presentations.' },
  { page: 'services', section: 'offerings', content_key: 'offering6_title', content_value: 'Custom Video Content' },
  { page: 'services', section: 'offerings', content_key: 'offering6_description', content_value: 'Create compelling video content for marketing, training, and internal communications.' },

  // Services Page - Our Process (from components/service-process.tsx)
  { page: 'services', section: 'process', content_key: 'section_title', content_value: 'Our Process' },
  { page: 'services', section: 'process', content_key: 'section_subtitle', content_value: 'From initial consultation to final delivery, we ensure a seamless experience that brings world-class AI expertise to your event.' },
  { page: 'services', section: 'process', content_key: 'step1_title', content_value: 'Contact Us' },
  { page: 'services', section: 'process', content_key: 'step1_description', content_value: 'Fill out our online form to request a free consultation. One of our team members will contact you within 24 hours to discuss your event needs.' },
  { page: 'services', section: 'process', content_key: 'step2_title', content_value: 'Pick Your Speaker' },
  { page: 'services', section: 'process', content_key: 'step2_description', content_value: "Based on your event goals, audience, and budget, we'll provide a curated list of AI experts for you to consider." },
  { page: 'services', section: 'process', content_key: 'step3_title', content_value: 'Enjoy Your Event' },
  { page: 'services', section: 'process', content_key: 'step3_description', content_value: "Once you've selected your speaker, we handle all the details—from booking to logistics to post-event follow-up." },

  // Services Page - In-Person Events (from components/events-section.tsx)
  { page: 'services', section: 'events', content_key: 'section_title', content_value: 'Our In-Person Events' },
  { page: 'services', section: 'events', content_key: 'section_subtitle', content_value: 'In addition to helping others find keynote speakers for their events, we also host our own event series in the Bay Area, showcasing the speakers on our roster.' },
  { page: 'services', section: 'events', content_key: 'latest_event_title', content_value: 'Latest Event' },
  { page: 'services', section: 'events', content_key: 'latest_event_description', content_value: 'Our last event, hosted at Microsoft HQ in Silicon Valley, featured speakers such as Adam Cheyer, Peter Norvig, Maya Ackerman, Murray Newlands, Jeremiah Owyang, Katie McMahon, Max Sills, and many more.' },
  { page: 'services', section: 'events', content_key: 'latest_event_cta', content_value: "Whether you're an event planner, an executive, or just interested in AI, these events are a great way to get an overview of the current AI landscape!" },
  { page: 'services', section: 'events', content_key: 'newsletter_title', content_value: 'Stay Updated' },
  { page: 'services', section: 'events', content_key: 'newsletter_description', content_value: 'Sign up with your email address to stay up to date on our upcoming events.' },
  { page: 'services', section: 'events', content_key: 'event_image', content_value: '/events/robert-strong-on-stage-at-microsoft.jpg' },

  // Services Page - CTA (from components/services-contact.tsx)
  { page: 'services', section: 'cta', content_key: 'title', content_value: 'Ready to Elevate Your Event?' },
  { page: 'services', section: 'cta', content_key: 'subtitle', content_value: 'Let us connect you with the perfect AI expert to inspire your audience and drive meaningful conversations about the future of artificial intelligence.' },
  { page: 'services', section: 'cta', content_key: 'button_text', content_value: 'Book Speaker Today' },
  { page: 'services', section: 'cta', content_key: 'phone_number', content_value: '+1-415-665-2442' },
  { page: 'services', section: 'cta', content_key: 'email', content_value: 'human@speakabout.ai' },
  { page: 'services', section: 'cta', content_key: 'stat1_value', content_value: '24 Hours' },
  { page: 'services', section: 'cta', content_key: 'stat1_label', content_value: 'Average Response Time' },
  { page: 'services', section: 'cta', content_key: 'stat2_value', content_value: '67+' },
  { page: 'services', section: 'cta', content_key: 'stat2_label', content_value: 'AI Experts Available' },
  { page: 'services', section: 'cta', content_key: 'stat3_value', content_value: '500+' },
  { page: 'services', section: 'cta', content_key: 'stat3_label', content_value: 'Successful Events' },

  // Team Page - Hero Story (from components/team-hero.tsx)
  { page: 'team', section: 'hero', content_key: 'badge', content_value: 'Our Story' },
  { page: 'team', section: 'hero', content_key: 'title', content_value: 'How It All Started' },
  { page: 'team', section: 'hero', content_key: 'story_paragraph1', content_value: "Robert Strong has been booking himself and other talent for 30+ years, and has called Silicon Valley home for 20 of them. Over the decades, he built deep relationships with pioneers in the AI space—people like Daniel Kraft—and ended up living down the street from Peter Norvig in Palo Alto, where they'd walk their Taiwanese street dogs together." },
  { page: 'team', section: 'hero', content_key: 'story_paragraph2', content_value: "After ChatGPT launched and his friends in the AI space started getting flooded with speaking requests, Robert decided to turn it into an agency. With his decades of experience in talent booking and deep roots in Silicon Valley's tech community, he was uniquely positioned to build something special." },
  { page: 'team', section: 'hero', content_key: 'story_paragraph3', content_value: 'Today, Speak About AI has booked speakers everywhere from Silicon Valley to Singapore—helping organizations around the world bring the brightest minds and best speakers in artificial intelligence to their stages.' },

  // Team Page - Team Members (from components/team-members.tsx)
  { page: 'team', section: 'members', content_key: 'member1_name', content_value: 'Robert Strong' },
  { page: 'team', section: 'members', content_key: 'member1_title', content_value: 'CEO' },
  { page: 'team', section: 'members', content_key: 'member1_bio', content_value: "Speak About AI was founded by author, speaker, and entertainer Robert Strong and is a division of Strong Entertainment, LLC. With 30+ years of experience booking speakers and entertainers globally, Robert brings unparalleled expertise to the AI speaking circuit. He's also a world-renowned magician who's performed at the White House twice, on Penn & Teller Fool Us, and for every major tech company in Silicon Valley. His Amazon best-selling book 'Amaze & Delight: Secrets to Creating Magic in Business' showcases his unique approach to business entertainment." },
  { page: 'team', section: 'members', content_key: 'member1_linkedin', content_value: 'https://linkedin.com/in/robertstrong' },
  { page: 'team', section: 'members', content_key: 'member1_image', content_value: '/team/robert-strong-headshot.png' },

  // Home Page - Featured Speakers (from components/featured-speakers.tsx)
  { page: 'home', section: 'featured-speakers', content_key: 'title', content_value: 'Featured AI Keynote Speakers' },
  { page: 'home', section: 'featured-speakers', content_key: 'subtitle', content_value: 'World-class artificial intelligence experts, machine learning pioneers, and tech visionaries who are shaping the future of AI across every industry.' },
  { page: 'home', section: 'featured-speakers', content_key: 'cta_text', content_value: 'View All AI Speakers' },

  // Home Page - Booking CTA (from components/booking-cta.tsx)
  { page: 'home', section: 'booking-cta', content_key: 'title', content_value: 'Ready to Book Your AI Keynote Speaker?' },
  { page: 'home', section: 'booking-cta', content_key: 'subtitle', content_value: 'Connect with our expert team to find the perfect AI speaker for your event. We make the booking process seamless and efficient.' },
  { page: 'home', section: 'booking-cta', content_key: 'contact_info', content_value: 'Text or call us at +1 (415) 665-2442 on WhatsApp or reach out to human@speakabout.ai by email' },
  { page: 'home', section: 'booking-cta', content_key: 'primary_cta_text', content_value: 'Get Speaker Recommendations' },
  { page: 'home', section: 'booking-cta', content_key: 'primary_cta_link', content_value: '/contact?source=home_page_cta_main' },
  { page: 'home', section: 'booking-cta', content_key: 'secondary_cta_text', content_value: 'Explore All Speakers' },
  { page: 'home', section: 'booking-cta', content_key: 'secondary_cta_link', content_value: '/speakers' },
  { page: 'home', section: 'booking-cta', content_key: 'whatsapp_number', content_value: '+1 (415) 665-2442' },
  { page: 'home', section: 'booking-cta', content_key: 'whatsapp_link', content_value: 'https://wa.me/14156652442' },
  { page: 'home', section: 'booking-cta', content_key: 'email', content_value: 'human@speakabout.ai' },

  // Images - Home Page
  { page: 'home', section: 'images', content_key: 'hero_image', content_value: '/robert-strong-adam-cheyer-peter-norvig-on-stage-at-microsoft.jpg' },
  { page: 'home', section: 'images', content_key: 'hero_image_alt', content_value: 'Robert Strong, Adam Cheyer (Siri Co-Founder), and Peter Norvig (Google & Stanford AI Researcher) on stage at a Microsoft event' },

  // Images - Services Page
  { page: 'services', section: 'images', content_key: 'offering1_image', content_value: '/services/adam-cheyer-stadium.jpg' },
  { page: 'services', section: 'images', content_key: 'offering2_image', content_value: '/services/sharon-zhou-panel.jpg' },
  { page: 'services', section: 'images', content_key: 'offering3_image', content_value: '/services/allie-k-miller-fireside.jpg' },
  { page: 'services', section: 'images', content_key: 'offering4_image', content_value: '/services/tatyana-mamut-speaking.jpg' },
  { page: 'services', section: 'images', content_key: 'offering5_image', content_value: '/services/sharon-zhou-headshot.png' },
  { page: 'services', section: 'images', content_key: 'offering6_image', content_value: '/services/simon-pierro-youtube.jpg' },

  // Speakers Page - Hero
  { page: 'speakers', section: 'hero', content_key: 'title', content_value: 'All AI Keynote Speakers' },
  { page: 'speakers', section: 'hero', content_key: 'subtitle', content_value: 'Browse our complete directory of world-class artificial intelligence experts, tech visionaries, and industry practitioners.' },

  // Speakers Page - Filters
  { page: 'speakers', section: 'filters', content_key: 'search_placeholder', content_value: 'Search speakers by name, expertise, or industry...' },
  { page: 'speakers', section: 'filters', content_key: 'industry_label', content_value: 'Industry' },
  { page: 'speakers', section: 'filters', content_key: 'all_industries', content_value: 'All Industries' },
  { page: 'speakers', section: 'filters', content_key: 'fee_label', content_value: 'Fee Range' },
  { page: 'speakers', section: 'filters', content_key: 'all_fees', content_value: 'All Fee Ranges' },
  { page: 'speakers', section: 'filters', content_key: 'location_label', content_value: 'Location' },
  { page: 'speakers', section: 'filters', content_key: 'all_locations', content_value: 'All Locations' },
  { page: 'speakers', section: 'filters', content_key: 'showing_text', content_value: 'Showing {displayed} of {total} speakers' },

  // Speakers Page - Results
  { page: 'speakers', section: 'results', content_key: 'loading_text', content_value: 'Loading speakers...' },
  { page: 'speakers', section: 'results', content_key: 'no_results', content_value: 'No speakers found matching your criteria. Try adjusting your search or filters.' },
  { page: 'speakers', section: 'results', content_key: 'clear_filters', content_value: 'Clear Filters' },

  // Speakers Page - Buttons
  { page: 'speakers', section: 'buttons', content_key: 'load_more', content_value: 'Load More Speakers ({remaining} remaining)' },

  // Speakers Page - Meta
  { page: 'speakers', section: 'meta', content_key: 'title', content_value: 'AI Keynote Speakers | Browse All AI Speakers' },
  { page: 'speakers', section: 'meta', content_key: 'description', content_value: 'Browse our complete directory of AI keynote speakers. 70+ artificial intelligence experts including Siri co-founders, Stanford researchers, and tech pioneers.' },
  { page: 'speakers', section: 'meta', content_key: 'keywords', content_value: 'AI speakers, AI keynote speakers, artificial intelligence speakers, tech speakers, AI experts' },

  // Workshops Page - Hero
  { page: 'workshops', section: 'hero', content_key: 'title', content_value: 'AI Workshops' },
  { page: 'workshops', section: 'hero', content_key: 'subtitle', content_value: 'Discover hands-on AI workshops led by industry experts. Interactive training programs covering machine learning, generative AI, and practical implementation strategies for your team.' },

  // Workshops Page - Filters
  { page: 'workshops', section: 'filters', content_key: 'search_placeholder', content_value: 'Search workshops by name, topic, or instructor...' },
  { page: 'workshops', section: 'filters', content_key: 'show_filters', content_value: 'Show Filters' },
  { page: 'workshops', section: 'filters', content_key: 'hide_filters', content_value: 'Hide Filters' },
  { page: 'workshops', section: 'filters', content_key: 'format_label', content_value: 'Format' },
  { page: 'workshops', section: 'filters', content_key: 'all_formats', content_value: 'All Formats' },
  { page: 'workshops', section: 'filters', content_key: 'length_label', content_value: 'Length' },
  { page: 'workshops', section: 'filters', content_key: 'all_lengths', content_value: 'All Lengths' },
  { page: 'workshops', section: 'filters', content_key: 'short_length', content_value: 'Short (< 1 hour)' },
  { page: 'workshops', section: 'filters', content_key: 'medium_length', content_value: 'Medium (1-2 hours)' },
  { page: 'workshops', section: 'filters', content_key: 'long_length', content_value: 'Long (> 2 hours)' },
  { page: 'workshops', section: 'filters', content_key: 'location_label', content_value: 'Instructor Location' },
  { page: 'workshops', section: 'filters', content_key: 'all_locations', content_value: 'All Locations' },
  { page: 'workshops', section: 'filters', content_key: 'audience_label', content_value: 'Target Audience' },
  { page: 'workshops', section: 'filters', content_key: 'all_audiences', content_value: 'All Audiences' },
  { page: 'workshops', section: 'filters', content_key: 'showing_text', content_value: 'Showing {displayed} of {total} workshops' },
  { page: 'workshops', section: 'filters', content_key: 'clear_filters', content_value: 'Clear All Filters' },

  // Workshops Page - Results
  { page: 'workshops', section: 'results', content_key: 'loading_text', content_value: 'Loading workshops...' },
  { page: 'workshops', section: 'results', content_key: 'no_results', content_value: 'No workshops found matching your criteria.' },

  // Workshops Page - Buttons
  { page: 'workshops', section: 'buttons', content_key: 'inquire', content_value: 'Inquire About Workshop' },
  { page: 'workshops', section: 'buttons', content_key: 'view_details', content_value: 'View Details' },

  // Workshops Page - Meta
  { page: 'workshops', section: 'meta', content_key: 'title', content_value: 'AI Workshops | Hands-On AI Training Programs' },
  { page: 'workshops', section: 'meta', content_key: 'description', content_value: 'Discover hands-on AI workshops led by industry experts. Interactive training programs covering machine learning, generative AI, and practical implementation strategies.' },
  { page: 'workshops', section: 'meta', content_key: 'keywords', content_value: 'AI workshops, AI training, machine learning workshops, generative AI training, corporate AI training' },

  // Contact Page - Header
  { page: 'contact', section: 'header', content_key: 'keynote_title', content_value: 'Book an AI Keynote Speaker' },
  { page: 'contact', section: 'header', content_key: 'workshop_title', content_value: 'Book an AI Workshop' },
  { page: 'contact', section: 'header', content_key: 'keynote_subtitle', content_value: "Tell us about your event and we'll match you with the perfect AI expert" },
  { page: 'contact', section: 'header', content_key: 'workshop_subtitle', content_value: "Tell us about your training needs and we'll find the perfect AI workshop" },

  // Contact Page - Tabs
  { page: 'contact', section: 'tabs', content_key: 'keynote_label', content_value: 'Keynote Speaker' },
  { page: 'contact', section: 'tabs', content_key: 'workshop_label', content_value: 'Workshop' },

  // Contact Page - Form
  { page: 'contact', section: 'form', content_key: 'title', content_value: 'Event Information' },
  { page: 'contact', section: 'form', content_key: 'description', content_value: 'Please provide as much detail as possible about your event' },
  { page: 'contact', section: 'form', content_key: 'contact_section_title', content_value: 'Contact Information' },
  { page: 'contact', section: 'form', content_key: 'event_section_title', content_value: 'Event Details' },
  { page: 'contact', section: 'form', content_key: 'additional_section_title', content_value: 'Additional Information' },

  // Contact Page - Need Help
  { page: 'contact', section: 'help', content_key: 'title', content_value: 'Need Help?' },
  { page: 'contact', section: 'help', content_key: 'call_label', content_value: 'Call us directly' },
  { page: 'contact', section: 'help', content_key: 'phone', content_value: '+1 (415) 665-2442' },
  { page: 'contact', section: 'help', content_key: 'email_label', content_value: 'Email us' },
  { page: 'contact', section: 'help', content_key: 'email', content_value: 'human@speakabout.ai' },

  // Contact Page - Newsletter
  { page: 'contact', section: 'newsletter', content_key: 'title', content_value: 'Subscribe to our newsletter' },
  { page: 'contact', section: 'newsletter', content_key: 'description', content_value: 'Get exclusive AI speaker insights, event trends, and industry updates delivered to your inbox.' },

  // Contact Page - Success
  { page: 'contact', section: 'success', content_key: 'title', content_value: 'Request Submitted Successfully!' },
  { page: 'contact', section: 'success', content_key: 'message', content_value: "Thank you for your interest. We'll be in touch within 24 hours with personalized speaker recommendations for your event." },

  // Contact Page - Keynote Specific
  { page: 'contact', section: 'keynote', content_key: 'speaker_section_title', content_value: 'Speaker Preferences' },
  { page: 'contact', section: 'keynote', content_key: 'speaker_section_desc', content_value: 'Select one or more speakers you are interested in, or let us help you find the right fit.' },
  { page: 'contact', section: 'keynote', content_key: 'no_speaker_text', content_value: "I don't have a specific speaker in mind" },
  { page: 'contact', section: 'keynote', content_key: 'budget_section_title', content_value: 'Speaker Budget Range' },

  // Contact Page - Workshop Specific
  { page: 'contact', section: 'workshop', content_key: 'workshop_section_title', content_value: 'Workshop Selection' },
  { page: 'contact', section: 'workshop', content_key: 'workshop_section_desc', content_value: 'Select a workshop or let us help you find the right one.' },
  { page: 'contact', section: 'workshop', content_key: 'no_workshop_text', content_value: 'Help me find a workshop' },
  { page: 'contact', section: 'workshop', content_key: 'participants_title', content_value: 'Number of Participants' },
  { page: 'contact', section: 'workshop', content_key: 'skill_level_title', content_value: 'Participant Skill Level' },
  { page: 'contact', section: 'workshop', content_key: 'format_title', content_value: 'Preferred Format' },

  // Contact Page - Buttons
  { page: 'contact', section: 'buttons', content_key: 'submit', content_value: 'Submit Speaker Request' },

  // Contact Page - Meta
  { page: 'contact', section: 'meta', content_key: 'title', content_value: 'Book an AI Speaker | Contact Speak About AI' },
  { page: 'contact', section: 'meta', content_key: 'description', content_value: 'Request an AI keynote speaker or workshop for your event. Fill out our booking form and our team will match you with the perfect AI expert within 24 hours.' },
  { page: 'contact', section: 'meta', content_key: 'keywords', content_value: 'book AI speaker, AI speaker booking, request AI keynote, contact AI speaker bureau' },

  // Team Page - CTA
  { page: 'team', section: 'cta', content_key: 'title', content_value: 'Get In Touch' },
  { page: 'team', section: 'cta', content_key: 'subtitle', content_value: "Interested in working with Speak About AI or have questions about our services? We'd love to hear from you." },
  { page: 'team', section: 'cta', content_key: 'button_text', content_value: 'Email Us' },
  { page: 'team', section: 'cta', content_key: 'email', content_value: 'human@speakabout.ai' },

  // Footer - Company Info
  { page: 'footer', section: 'company', content_key: 'logo', content_value: '/speak-about-ai-light-logo.png' },
  { page: 'footer', section: 'company', content_key: 'logo_alt', content_value: 'Speak About AI' },
  { page: 'footer', section: 'company', content_key: 'description', content_value: "The world's only AI-exclusive speaker bureau, connecting organizations around the world with the most sought-after artificial intelligence experts and thought leaders." },
  { page: 'footer', section: 'company', content_key: 'phone', content_value: '+1 (415) 665-2442' },
  { page: 'footer', section: 'company', content_key: 'email', content_value: 'human@speakabout.ai' },

  // Footer - Quick Links
  { page: 'footer', section: 'quick-links', content_key: 'title', content_value: 'Quick Links' },
  { page: 'footer', section: 'quick-links', content_key: 'links', content_value: JSON.stringify([
    { text: 'All Speakers', url: '/speakers' },
    { text: 'Our Services', url: '/our-services' },
    { text: 'Our Team', url: '/our-team' },
    { text: 'Contact Us', url: '/contact' },
    { text: 'Blog', url: '/blog' },
    { text: 'Sitemap', url: '/sitemap.xml' }
  ]) },

  // Footer - Industries
  { page: 'footer', section: 'industries', content_key: 'title', content_value: 'Industries' },
  { page: 'footer', section: 'industries', content_key: 'links', content_value: JSON.stringify([
    { text: 'Healthcare AI', url: '/industries/healthcare-keynote-speakers' },
    { text: 'Technology & Enterprise', url: '/industries/technology-keynote-speakers' }
  ]) },

  // Footer - For Speakers
  { page: 'footer', section: 'for-speakers', content_key: 'title', content_value: 'For Speakers' },
  { page: 'footer', section: 'for-speakers', content_key: 'links', content_value: JSON.stringify([
    { text: 'Apply to Be a Speaker', url: '/apply' }
  ]) },

  // Footer - Bottom Bar
  { page: 'footer', section: 'bottom', content_key: 'copyright', content_value: '© 2026 Speak About AI. All rights reserved.' },
  { page: 'footer', section: 'bottom', content_key: 'linkedin_url', content_value: 'https://www.linkedin.com/company/speakabout-ai/' },
]

export async function GET(request: Request) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    const { searchParams } = new URL(request.url)
    const pageFilter = searchParams.get('page')

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS website_content (
        id SERIAL PRIMARY KEY,
        page VARCHAR(50) NOT NULL,
        section VARCHAR(100) NOT NULL,
        content_key VARCHAR(100) NOT NULL,
        content_value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(255),
        UNIQUE(page, section, content_key)
      )
    `

    // Ensure footer and contact defaults exist (only these since other pages already seeded)
    const defaultsToSeed = DEFAULT_CONTENT.filter(item => item.page === 'footer' || item.page === 'contact')
    for (const item of defaultsToSeed) {
      await sql`
        INSERT INTO website_content (page, section, content_key, content_value)
        VALUES (${item.page}, ${item.section}, ${item.content_key}, ${item.content_value})
        ON CONFLICT (page, section, content_key) DO NOTHING
      `
    }

    // Fetch content
    let content
    if (pageFilter) {
      content = await sql`
        SELECT * FROM website_content
        WHERE page = ${pageFilter}
        ORDER BY section, content_key
      `
    } else {
      content = await sql`
        SELECT * FROM website_content
        ORDER BY page, section, content_key
      `
    }

    return NextResponse.json(content, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Error fetching website content:', error)
    return NextResponse.json({ error: 'Failed to fetch website content' }, { status: 500 })
  }
}

// Helper to ensure history table exists
async function ensureHistoryTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS website_content_history (
      id SERIAL PRIMARY KEY,
      content_id INTEGER,
      page VARCHAR(50) NOT NULL,
      section VARCHAR(100) NOT NULL,
      content_key VARCHAR(100) NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      changed_by VARCHAR(255) DEFAULT 'admin',
      action VARCHAR(20) DEFAULT 'update'
    )
  `
}

// Helper to log content change to history
async function logContentChange(
  sql: ReturnType<typeof neon>,
  page: string,
  section: string,
  content_key: string,
  old_value: string | null,
  new_value: string,
  content_id?: number
) {
  // Only log if value actually changed
  if (old_value !== new_value) {
    await sql`
      INSERT INTO website_content_history (content_id, page, section, content_key, old_value, new_value, action)
      VALUES (${content_id || null}, ${page}, ${section}, ${content_key}, ${old_value}, ${new_value}, 'update')
    `
  }
}

export async function PUT(request: Request) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    const body = await request.json()

    // Ensure history table exists
    await ensureHistoryTable(sql)

    // Handle batch updates
    if (Array.isArray(body)) {
      const results = []
      for (const item of body) {
        const { page, section, content_key, content_value } = item

        // Get current value before update
        const current = await sql`
          SELECT id, content_value FROM website_content
          WHERE page = ${page} AND section = ${section} AND content_key = ${content_key}
        `
        const oldValue = current.length > 0 ? current[0].content_value : null

        const result = await sql`
          INSERT INTO website_content (page, section, content_key, content_value, updated_at, updated_by)
          VALUES (${page}, ${section}, ${content_key}, ${content_value}, CURRENT_TIMESTAMP, 'admin')
          ON CONFLICT (page, section, content_key)
          DO UPDATE SET
            content_value = ${content_value},
            updated_at = CURRENT_TIMESTAMP,
            updated_by = 'admin'
          RETURNING *
        `

        // Log the change
        if (result[0]) {
          await logContentChange(sql, page, section, content_key, oldValue, content_value, result[0].id)
          results.push(result[0])
        }
      }

      // Clear cache and revalidate pages after updates
      clearContentCache()
      revalidatePath('/', 'layout')
      revalidatePath('/services', 'layout')
      revalidatePath('/team', 'layout')
      revalidatePath('/speakers', 'layout')
      revalidatePath('/ai-workshops', 'layout')

      return NextResponse.json({ success: true, updated: results.length })
    }

    // Handle single update
    const { page, section, content_key, content_value } = body

    // Get current value before update
    const current = await sql`
      SELECT id, content_value FROM website_content
      WHERE page = ${page} AND section = ${section} AND content_key = ${content_key}
    `
    const oldValue = current.length > 0 ? current[0].content_value : null

    const result = await sql`
      INSERT INTO website_content (page, section, content_key, content_value, updated_at, updated_by)
      VALUES (${page}, ${section}, ${content_key}, ${content_value}, CURRENT_TIMESTAMP, 'admin')
      ON CONFLICT (page, section, content_key)
      DO UPDATE SET
        content_value = ${content_value},
        updated_at = CURRENT_TIMESTAMP,
        updated_by = 'admin'
      RETURNING *
    `

    // Log the change
    if (result[0]) {
      await logContentChange(sql, page, section, content_key, oldValue, content_value, result[0].id)
    }

    // Clear cache and revalidate pages after single update
    clearContentCache()
    revalidatePath('/', 'layout')
    revalidatePath('/services', 'layout')
    revalidatePath('/team', 'layout')
    revalidatePath('/speakers', 'layout')
    revalidatePath('/ai-workshops', 'layout')

    return NextResponse.json({ success: true, content: result[0] })
  } catch (error) {
    console.error('Error updating website content:', error)
    return NextResponse.json({ error: 'Failed to update website content' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    const body = await request.json()

    // If action is 'reseed', reset to defaults
    if (body.action === 'reseed') {
      // Clear existing content
      await sql`DELETE FROM website_content`

      // Reseed with defaults
      for (const item of DEFAULT_CONTENT) {
        await sql`
          INSERT INTO website_content (page, section, content_key, content_value)
          VALUES (${item.page}, ${item.section}, ${item.content_key}, ${item.content_value})
        `
      }

      return NextResponse.json({ success: true, message: 'Content reset to defaults' })
    }

    // Otherwise, add new content item
    const { page, section, content_key, content_value } = body

    const result = await sql`
      INSERT INTO website_content (page, section, content_key, content_value)
      VALUES (${page}, ${section}, ${content_key}, ${content_value})
      ON CONFLICT (page, section, content_key) DO NOTHING
      RETURNING *
    `

    return NextResponse.json({ success: true, content: result[0] })
  } catch (error) {
    console.error('Error creating website content:', error)
    return NextResponse.json({ error: 'Failed to create website content' }, { status: 500 })
  }
}

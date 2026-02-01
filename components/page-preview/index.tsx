"use client"

import { useState } from "react"
import { Award, MapPin, Globe, Shield, Clock, Users, Headphones, Target, DollarSign, Globe2, Check, Calendar, ArrowRight, Mic, GraduationCap } from "lucide-react"
import { EditableText, EditableImage, LogoListEditor, OfferingsListEditor, SimpleListEditor, TeamMembersListEditor, BudgetRangesListEditor, DeliveryOptionsListEditor, FooterLinkListEditor, type ServiceOffering, type TeamMember, type BudgetRange, type DeliveryOption, type FooterLink } from "@/components/editable-text"
import { Button } from "@/components/ui/button"

interface PagePreviewProps {
  page: "home" | "services" | "team" | "speakers" | "workshops" | "contact" | "footer"
  content: Record<string, string>
  originalContent: Record<string, string>
  onContentChange: (key: string, value: string) => void
  editorMode?: boolean
}

// Helper to check if content is modified
function isModified(key: string, content: Record<string, string>, originalContent: Record<string, string>): boolean {
  return content[key] !== originalContent[key]
}

// Home Page Hero Preview
function HomeHeroPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const badge = content['home.hero.badge'] || '#1 AI-Exclusive Speaker Bureau'
  const title = content['home.hero.title'] || 'Book an AI Speaker for Your Event'
  const subtitle = content['home.hero.subtitle'] || 'The #1 AI speaker bureau with exclusive access to 70+ AI pioneers'

  // Hero image from database
  const heroImage = content['home.images.hero_image'] || '/robert-strong-adam-cheyer-peter-norvig-on-stage-at-microsoft.jpg'
  const heroImageAlt = content['home.images.hero_image_alt'] || 'Robert Strong, Adam Cheyer, and Peter Norvig on stage'

  return (
    <section className="bg-gradient-to-br from-[#EAEAEE] to-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-[#1E68C6] bg-opacity-10 text-[#1E68C6] rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4 mr-2" />
              <EditableText
                value={badge}
                onChange={(v) => onContentChange('home.hero.badge', v)}
                isModified={isModified('home.hero.badge', content, originalContent)}
                editorMode={editorMode}
              />
            </div>

            {/* Main Headline */}
            <EditableText
              value={title}
              onChange={(v) => onContentChange('home.hero.title', v)}
              as="h1"
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black mb-4 leading-[1.1] font-neue-haas tracking-tight"
              isModified={isModified('home.hero.title', content, originalContent)}
              editorMode={editorMode}
            />

            {/* Subtitle */}
            <EditableText
              value={subtitle}
              onChange={(v) => onContentChange('home.hero.subtitle', v)}
              as="p"
              className="text-lg md:text-xl text-gray-800 mb-6 font-montserrat font-semibold leading-tight"
              multiline
              isModified={isModified('home.hero.subtitle', content, originalContent)}
              editorMode={editorMode}
            />

            {/* CTA Buttons (static preview) */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button variant="gold" size="lg" className="pointer-events-none opacity-80">
                Book Speaker Today
              </Button>
              <Button variant="default" size="lg" className="pointer-events-none opacity-80">
                Browse Speakers
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <p className="text-lg font-bold text-black font-neue-haas flex items-center gap-2 mb-2 sm:mb-0">
                <MapPin className="w-5 h-5 text-[#1E68C6]" />
                Silicon Valley Based
              </p>
              <p className="text-lg font-bold text-black font-neue-haas flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#1E68C6]" />
                Books Internationally
              </p>
            </div>
          </div>

          {/* Hero Image - Editable */}
          <div className="relative">
            <EditableImage
              src={heroImage}
              alt={heroImageAlt}
              onChange={(newSrc) => onContentChange('home.images.hero_image', newSrc)}
              onAltChange={(newAlt) => onContentChange('home.images.hero_image_alt', newAlt)}
              isModified={isModified('home.images.hero_image', content, originalContent)}
              editorMode={editorMode}
              className="w-full h-auto object-cover rounded-xl shadow-2xl"
              uploadFolder="hero"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Home Why Choose Us Preview
function HomeWhyChooseUsPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const sectionTitle = content['home.why-choose-us.section_title'] || 'Why Work with Speak About AI?'
  const sectionSubtitle = content['home.why-choose-us.section_subtitle'] || 'We book artificial intelligence keynote speakers for your organization\'s event who don\'t just talk about the future—they\'re the innovators building the tech.'

  const features = [
    {
      icon: Users,
      titleKey: 'feature1_title',
      descKey: 'feature1_description',
      defaultTitle: 'Access to Exclusive AI Pioneers',
      defaultDesc: 'Direct connections to the architects of modern AI—Siri co-founders, former Shazam executives, and the researchers who literally authored the AI textbooks.'
    },
    {
      icon: Shield,
      titleKey: 'feature2_title',
      descKey: 'feature2_description',
      defaultTitle: '24-Hour Response Guarantee',
      defaultDesc: 'Lightning-fast turnaround, guaranteed. From first inquiry to booking.'
    },
    {
      icon: Headphones,
      titleKey: 'feature3_title',
      descKey: 'feature3_description',
      defaultTitle: 'White-Glove Speaker Coordination',
      defaultDesc: 'We ensure seamless execution from booking to showtime.'
    },
    {
      icon: Target,
      titleKey: 'feature4_title',
      descKey: 'feature4_description',
      defaultTitle: 'We Help You Navigate The Noise',
      defaultDesc: 'Cut through the AI hype with our deep industry expertise and transparent guidance.'
    },
    {
      icon: Globe,
      titleKey: 'feature5_title',
      descKey: 'feature5_description',
      defaultTitle: 'Proven Stage Presence',
      defaultDesc: 'Our speakers command every venue with authority and authenticity.'
    },
    {
      icon: Clock,
      titleKey: 'feature6_title',
      descKey: 'feature6_description',
      defaultTitle: 'Actionable Industry Intelligence',
      defaultDesc: 'Tailored AI insights for your sector with concrete next steps.'
    },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <EditableText
            value={sectionTitle}
            onChange={(v) => onContentChange('home.why-choose-us.section_title', v)}
            as="h2"
            className="text-3xl font-bold text-gray-900 mb-4 font-neue-haas"
            isModified={isModified('home.why-choose-us.section_title', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={sectionSubtitle}
            onChange={(v) => onContentChange('home.why-choose-us.section_subtitle', v)}
            as="p"
            className="text-lg text-gray-600 max-w-3xl mx-auto font-montserrat"
            multiline
            isModified={isModified('home.why-choose-us.section_subtitle', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const titleKey = `home.why-choose-us.${feature.titleKey}`
            const descKey = `home.why-choose-us.${feature.descKey}`
            const title = content[titleKey] || feature.defaultTitle
            const description = content[descKey] || feature.defaultDesc

            return (
              <div
                key={index}
                className="group bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200"
              >
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E68C6] to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <EditableText
                    value={title}
                    onChange={(v) => onContentChange(titleKey, v)}
                    as="h3"
                    className="text-lg font-bold text-gray-900 font-neue-haas"
                    isModified={isModified(titleKey, content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
                <EditableText
                  value={description}
                  onChange={(v) => onContentChange(descKey, v)}
                  as="p"
                  className="text-gray-700 leading-relaxed font-montserrat text-sm"
                  multiline
                  isModified={isModified(descKey, content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Home Featured Speakers Preview
function HomeFeaturedSpeakersPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const title = content['home.featured-speakers.title'] || 'Featured AI Keynote Speakers'
  const subtitle = content['home.featured-speakers.subtitle'] || 'World-class artificial intelligence experts, machine learning pioneers, and tech visionaries who are shaping the future of AI across every industry.'
  const ctaText = content['home.featured-speakers.cta_text'] || 'View All AI Speakers'

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <EditableText
            value={title}
            onChange={(v) => onContentChange('home.featured-speakers.title', v)}
            as="h2"
            className="text-4xl font-bold text-black mb-4 font-neue-haas"
            isModified={isModified('home.featured-speakers.title', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={subtitle}
            onChange={(v) => onContentChange('home.featured-speakers.subtitle', v)}
            as="p"
            className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat"
            multiline
            isModified={isModified('home.featured-speakers.subtitle', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        {/* Speaker cards placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-6 h-64 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Speaker Card {i}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 italic mb-6">Speaker cards are loaded dynamically from the database</p>

        {/* CTA Button */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>CTA Button Text:</span>
            <EditableText
              value={ctaText}
              onChange={(v) => onContentChange('home.featured-speakers.cta_text', v)}
              className="font-semibold text-amber-600"
              isModified={isModified('home.featured-speakers.cta_text', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Default logos for preview (matches client-logos.tsx)
const defaultLogos = [
  { name: "Stanford University", src: "/logos/stanford-university-logo-1024x335-1.png" },
  { name: "Google", src: "/logos/Google_2015_logo.svg.png" },
  { name: "Amazon", src: "/logos/Amazon-Logo-2000.png" },
  { name: "Visa", src: "/logos/Visa_Inc._logo.svg" },
  { name: "Rio Innovation Week", src: "/logos/rio-innovation-week-new.png" },
  { name: "NICE", src: "/logos/nice-logo.png" },
  { name: "ST Engineering", src: "/logos/st-engineering-logo.png" },
  { name: "Government of Korea", src: "/logos/korea-government-logo.png" },
  { name: "Juniper Networks", src: "/logos/juniper-networks-logo.svg" },
  { name: "KPMG", src: "/logos/KPMG_logo.svg.png" },
]

// Home Client Logos Preview
function HomeClientLogosPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const title = content['home.client-logos.title'] || 'Trusted by Industry Leaders'
  const subtitle = content['home.client-logos.subtitle'] || 'Our speakers have worked with leading organizations around the world for their most important events.'
  const ctaText = content['home.client-logos.cta_text'] || 'View Past Clients & Events'
  const ctaLink = content['home.client-logos.cta_link'] || '/our-services#testimonials'

  // Parse logos from content or use defaults
  const logosJson = content['home.client-logos.logos']
  let logos = defaultLogos
  if (logosJson) {
    try {
      logos = JSON.parse(logosJson)
    } catch (e) {
      // Use defaults if JSON parsing fails
    }
  }

  const handleLogosChange = (newLogos: typeof defaultLogos) => {
    onContentChange('home.client-logos.logos', JSON.stringify(newLogos))
  }

  return (
    <section className="pt-4 pb-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-3">
          <EditableText
            value={title}
            onChange={(v) => onContentChange('home.client-logos.title', v)}
            as="h2"
            className="text-3xl font-bold text-gray-900 mb-2"
            isModified={isModified('home.client-logos.title', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={subtitle}
            onChange={(v) => onContentChange('home.client-logos.subtitle', v)}
            as="p"
            className="text-lg text-gray-600"
            multiline
            isModified={isModified('home.client-logos.subtitle', content, originalContent)}
            editorMode={editorMode}
          />
        </div>
        {/* Logo carousel preview - showing actual logos */}
        <div className="flex justify-center items-center gap-8 py-6 flex-wrap">
          {logos.map((logo, i) => (
            <img
              key={i}
              src={logo.src}
              alt={logo.name}
              className="h-12 w-auto object-contain opacity-70"
              title={logo.name}
            />
          ))}
        </div>

        {/* Logo Editor */}
        <div className="text-center mb-4">
          <LogoListEditor
            logos={logos}
            onChange={handleLogosChange}
            isModified={isModified('home.client-logos.logos', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>CTA Text:</span>
            <EditableText
              value={ctaText}
              onChange={(v) => onContentChange('home.client-logos.cta_text', v)}
              className="font-semibold text-amber-600"
              isModified={isModified('home.client-logos.cta_text', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
          <div className="text-xs text-gray-500">
            CTA Link:
            <EditableText
              value={ctaLink}
              onChange={(v) => onContentChange('home.client-logos.cta_link', v)}
              className="ml-1 text-blue-600"
              isModified={isModified('home.client-logos.cta_link', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Home Navigate The Noise Preview
function HomeNavigateTheNoisePreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const sectionTitle = content['home.navigate.section_title'] || 'Navigate the AI Speaker Landscape'
  const sectionSubtitle = content['home.navigate.section_subtitle'] || 'Clear guidance to help you make informed decisions faster'

  // Default values for lists
  const defaultBudgetRanges: BudgetRange[] = [
    { range: '$5k - $20k', description: 'Rising AI experts, academics, and tech consultants' },
    { range: '$20k - $50k', description: 'Industry leaders, published authors, and proven speakers' },
    { range: '$50k+', description: 'AI pioneers, tech founders, and household names' }
  ]

  const defaultAudienceTypes = [
    'Corporate & Enterprise',
    'Public Sector & Government',
    'Startups & Scale-ups',
    'Academic & Research',
    'Healthcare & Life Sciences',
    'Financial Services',
    'Technology Companies'
  ]

  const defaultDeliveryOptions: DeliveryOption[] = [
    { title: 'In-Person Events', description: 'Worldwide coverage with speaker coordination and booking support' },
    { title: 'Virtual Events', description: 'Professional virtual keynotes optimized for online engagement' },
    { title: 'Hybrid Format', description: 'Seamless blend of in-person and remote engagement for maximum reach' }
  ]

  // Parse JSON from content or use defaults
  let budgetRanges: BudgetRange[] = defaultBudgetRanges
  let audienceTypes: string[] = defaultAudienceTypes
  let deliveryOptions: DeliveryOption[] = defaultDeliveryOptions

  try {
    if (content['home.navigate.budget_ranges']) {
      budgetRanges = JSON.parse(content['home.navigate.budget_ranges'])
    }
  } catch (e) {}

  try {
    if (content['home.navigate.audience_types']) {
      audienceTypes = JSON.parse(content['home.navigate.audience_types'])
    }
  } catch (e) {}

  try {
    if (content['home.navigate.delivery_options']) {
      deliveryOptions = JSON.parse(content['home.navigate.delivery_options'])
    }
  } catch (e) {}

  const budgetTitle = content['home.navigate.budget_title'] || 'Budget Guidance'
  const audienceTitle = content['home.navigate.audience_title'] || 'Audience Types'
  const globalTitle = content['home.navigate.global_title'] || 'Global Delivery'

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <EditableText
            value={sectionTitle}
            onChange={(v) => onContentChange('home.navigate.section_title', v)}
            as="h2"
            className="text-4xl font-bold text-gray-900 mb-4 font-neue-haas"
            isModified={isModified('home.navigate.section_title', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={sectionSubtitle}
            onChange={(v) => onContentChange('home.navigate.section_subtitle', v)}
            as="p"
            className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat"
            multiline
            isModified={isModified('home.navigate.section_subtitle', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Budget Ranges Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-200">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1E68C6] to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <EditableText
                value={budgetTitle}
                onChange={(v) => onContentChange('home.navigate.budget_title', v)}
                as="h3"
                className="text-2xl font-bold text-gray-900 font-neue-haas"
                isModified={isModified('home.navigate.budget_title', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
            <div className="space-y-3">
              {budgetRanges.map((r, i) => (
                <div key={i} className="border-l-4 border-blue-600 pl-4">
                  <div className="font-bold text-gray-900 font-montserrat text-sm">{r.range}</div>
                  <div className="text-xs text-gray-600">{r.description}</div>
                </div>
              ))}
            </div>
            {editorMode && (
              <div className="mt-4 pt-4 border-t">
                <BudgetRangesListEditor
                  ranges={budgetRanges}
                  onChange={(newRanges) => onContentChange('home.navigate.budget_ranges', JSON.stringify(newRanges))}
                  isModified={isModified('home.navigate.budget_ranges', content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            )}
          </div>

          {/* Audience Types Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-amber-200">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <EditableText
                value={audienceTitle}
                onChange={(v) => onContentChange('home.navigate.audience_title', v)}
                as="h3"
                className="text-2xl font-bold text-gray-900 font-neue-haas"
                isModified={isModified('home.navigate.audience_title', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
            <div className="space-y-3">
              {audienceTypes.map((item, i) => (
                <div key={i} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-amber-600 mr-2" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            {editorMode && (
              <div className="mt-4 pt-4 border-t">
                <SimpleListEditor
                  items={audienceTypes}
                  onChange={(newItems) => onContentChange('home.navigate.audience_types', JSON.stringify(newItems))}
                  isModified={isModified('home.navigate.audience_types', content, originalContent)}
                  editorMode={editorMode}
                  title="Edit Audience Types"
                  buttonText={`Edit Audience Types (${audienceTypes.length})`}
                />
              </div>
            )}
          </div>

          {/* Global Delivery Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-green-200">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Globe2 className="w-8 h-8 text-white" />
              </div>
              <EditableText
                value={globalTitle}
                onChange={(v) => onContentChange('home.navigate.global_title', v)}
                as="h3"
                className="text-2xl font-bold text-gray-900 font-neue-haas"
                isModified={isModified('home.navigate.global_title', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
            <div className="space-y-3">
              {deliveryOptions.map((f, i) => (
                <div key={i}>
                  <div className="font-bold text-gray-900 text-sm flex items-center">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    {f.title}
                  </div>
                  <p className="text-xs text-gray-600 ml-6">{f.description}</p>
                </div>
              ))}
            </div>
            {editorMode && (
              <div className="mt-4 pt-4 border-t">
                <DeliveryOptionsListEditor
                  options={deliveryOptions}
                  onChange={(newOptions) => onContentChange('home.navigate.delivery_options', JSON.stringify(newOptions))}
                  isModified={isModified('home.navigate.delivery_options', content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// Home SEO Content Preview
function HomeSEOContentPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  // Using correct keys that match API defaults
  const mainHeading = content['home.seo-content.main_heading'] || 'AI Keynote Speakers: Transform Your Event with Leading AI Experts'
  const introParagraph = content['home.seo-content.intro_paragraph'] || 'Speak About AI is the premier AI keynote speakers bureau, representing over 70 of the world\'s most influential artificial intelligence speakers.'
  const whyHeading = content['home.seo-content.why_heading'] || 'Why Choose Our AI Speakers Bureau?'
  const whyParagraph = content['home.seo-content.why_paragraph'] || 'As a speaker bureau focused exclusively on artificial intelligence, we provide unparalleled expertise in matching your event with the perfect AI keynote speaker.'
  const industriesHeading = content['home.seo-content.industries_heading'] || 'Industries We Serve'
  const topicsHeading = content['home.seo-content.topics_heading'] || 'Popular AI Speaking Topics'

  // Default industries and topics
  const defaultIndustries = [
    'Technology & Software Companies',
    'Healthcare & Pharmaceutical',
    'Financial Services & Banking',
    'Manufacturing & Automotive',
    'Retail & E-commerce',
    'Education & Research Institutions'
  ]
  const defaultTopics = [
    'Generative AI & Large Language Models',
    'AI Strategy & Digital Transformation',
    'Machine Learning Applications',
    'AI Ethics & Responsible AI',
    'Future of Work with AI',
    'AI in Healthcare & Life Sciences'
  ]

  // Parse from JSON or use defaults
  const industriesJson = content['home.seo-content.industries_list']
  let industries = defaultIndustries
  if (industriesJson) {
    try { industries = JSON.parse(industriesJson) } catch (e) {}
  }

  const topicsJson = content['home.seo-content.topics_list']
  let topics = defaultTopics
  if (topicsJson) {
    try { topics = JSON.parse(topicsJson) } catch (e) {}
  }

  const bookHeading = content['home.seo-content.book_heading'] || 'Book an AI Speaker for Your Next Event'
  const bookParagraph = content['home.seo-content.book_paragraph'] || 'From keynote presentations at major conferences to executive briefings and workshop facilitation, our AI speakers bring cutting-edge insights and practical applications to every engagement.'
  const ctaButtonText = content['home.seo-content.cta_button_text'] || 'Book an AI Speaker Today'
  const closingParagraph = content['home.seo-content.closing_paragraph'] || 'Our clients include provincial governments, international conferences, Fortune 500 companies, leading universities, and innovative startups. When you book an AI keynote speaker through Speak About AI, you\'re partnering with the trusted leader in AI thought leadership.'

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <EditableText
            value={mainHeading}
            onChange={(v) => onContentChange('home.seo-content.main_heading', v)}
            as="h2"
            className="text-3xl font-bold text-black mb-6"
            isModified={isModified('home.seo-content.main_heading', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={introParagraph}
            onChange={(v) => onContentChange('home.seo-content.intro_paragraph', v)}
            as="p"
            className="text-lg text-gray-700 mb-4"
            multiline
            isModified={isModified('home.seo-content.intro_paragraph', content, originalContent)}
            editorMode={editorMode}
          />

          <EditableText
            value={whyHeading}
            onChange={(v) => onContentChange('home.seo-content.why_heading', v)}
            as="h3"
            className="text-2xl font-semibold text-black mt-8 mb-4"
            isModified={isModified('home.seo-content.why_heading', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={whyParagraph}
            onChange={(v) => onContentChange('home.seo-content.why_paragraph', v)}
            as="p"
            className="text-lg text-gray-700 mb-4"
            multiline
            isModified={isModified('home.seo-content.why_paragraph', content, originalContent)}
            editorMode={editorMode}
          />

          {/* Industries and Topics with editable titles and lists */}
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <EditableText
                value={industriesHeading}
                onChange={(v) => onContentChange('home.seo-content.industries_heading', v)}
                as="h3"
                className="text-xl font-semibold text-black mb-3"
                isModified={isModified('home.seo-content.industries_heading', content, originalContent)}
                editorMode={editorMode}
              />
              <ul className="space-y-2 text-gray-700 text-sm">
                {industries.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
              <div className="mt-3">
                <SimpleListEditor
                  items={industries}
                  onChange={(newItems) => onContentChange('home.seo-content.industries_list', JSON.stringify(newItems))}
                  isModified={isModified('home.seo-content.industries_list', content, originalContent)}
                  editorMode={editorMode}
                  title="Edit Industries"
                  buttonText="Edit Industries"
                />
              </div>
            </div>
            <div>
              <EditableText
                value={topicsHeading}
                onChange={(v) => onContentChange('home.seo-content.topics_heading', v)}
                as="h3"
                className="text-xl font-semibold text-black mb-3"
                isModified={isModified('home.seo-content.topics_heading', content, originalContent)}
                editorMode={editorMode}
              />
              <ul className="space-y-2 text-gray-700 text-sm">
                {topics.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
              <div className="mt-3">
                <SimpleListEditor
                  items={topics}
                  onChange={(newItems) => onContentChange('home.seo-content.topics_list', JSON.stringify(newItems))}
                  isModified={isModified('home.seo-content.topics_list', content, originalContent)}
                  editorMode={editorMode}
                  title="Edit Topics"
                  buttonText="Edit Topics"
                />
              </div>
            </div>
          </div>

          <EditableText
            value={bookHeading}
            onChange={(v) => onContentChange('home.seo-content.book_heading', v)}
            as="h3"
            className="text-2xl font-semibold text-black mt-8 mb-4"
            isModified={isModified('home.seo-content.book_heading', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={bookParagraph}
            onChange={(v) => onContentChange('home.seo-content.book_paragraph', v)}
            as="p"
            className="text-lg text-gray-700 mb-4"
            multiline
            isModified={isModified('home.seo-content.book_paragraph', content, originalContent)}
            editorMode={editorMode}
          />

          {/* CTA Button */}
          <div className="my-8 p-4 border border-dashed border-gray-300 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">CTA Button:</span>
              <EditableText
                value={ctaButtonText}
                onChange={(v) => onContentChange('home.seo-content.cta_button_text', v)}
                className="font-semibold text-amber-600"
                isModified={isModified('home.seo-content.cta_button_text', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
          </div>

          <EditableText
            value={closingParagraph}
            onChange={(v) => onContentChange('home.seo-content.closing_paragraph', v)}
            as="p"
            className="text-lg text-gray-700 mb-4"
            multiline
            isModified={isModified('home.seo-content.closing_paragraph', content, originalContent)}
            editorMode={editorMode}
          />
        </div>
      </div>
    </section>
  )
}

// Home FAQ Preview
function HomeFAQPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const sectionTitle = content['home.seo-faq.section_title'] || 'Frequently Asked Questions About Booking AI Speakers'

  const faqs = [
    { id: 'faq1', defaultQ: 'How do I book an AI keynote speaker?', defaultA: 'Simply browse our speakers, select your preferred AI expert, and contact us through our booking form. Our team will handle all logistics and ensure a seamless experience.' },
    { id: 'faq2', defaultQ: 'What makes Speak About AI different?', defaultA: 'We\'re the only speaker bureau focused exclusively on AI, giving us unmatched expertise in artificial intelligence thought leadership and deep relationships with top AI speakers.' },
    { id: 'faq3', defaultQ: 'Do you offer virtual AI keynote speakers?', defaultA: 'Yes, many of our AI speakers offer both in-person and virtual keynote presentations, ensuring global accessibility for your events.' },
    { id: 'faq4', defaultQ: 'What\'s the typical fee for an AI speaker?', defaultA: 'AI speaker fees typically range from $5K-$20K for emerging experts to $20K+ for industry leaders. Final pricing depends on format, location, date, and speaker requirements.' }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EditableText
          value={sectionTitle}
          onChange={(v) => onContentChange('home.seo-faq.section_title', v)}
          as="h2"
          className="text-3xl font-bold text-center text-black mb-12"
          isModified={isModified('home.seo-faq.section_title', content, originalContent)}
          editorMode={editorMode}
        />
        <div className="grid md:grid-cols-2 gap-8">
          {faqs.map((faq) => {
            const qKey = `home.seo-faq.${faq.id}_question`
            const aKey = `home.seo-faq.${faq.id}_answer`
            const question = content[qKey] || faq.defaultQ
            const answer = content[aKey] || faq.defaultA

            return (
              <div key={faq.id}>
                <EditableText
                  value={question}
                  onChange={(v) => onContentChange(qKey, v)}
                  as="h3"
                  className="text-xl font-semibold text-black mb-3"
                  isModified={isModified(qKey, content, originalContent)}
                  editorMode={editorMode}
                />
                <EditableText
                  value={answer}
                  onChange={(v) => onContentChange(aKey, v)}
                  as="p"
                  className="text-gray-700"
                  multiline
                  isModified={isModified(aKey, content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Home Booking CTA Preview
function HomeBookingCTAPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const title = content['home.booking-cta.title'] || 'Ready to Book Your AI Keynote Speaker?'
  const subtitle = content['home.booking-cta.subtitle'] || 'Connect with our expert team to find the perfect AI speaker for your event. We make the booking process seamless and efficient.'
  const primaryCtaText = content['home.booking-cta.primary_cta_text'] || 'Get Speaker Recommendations'
  const primaryCtaLink = content['home.booking-cta.primary_cta_link'] || '/contact?source=home_page_cta_main'
  const secondaryCtaText = content['home.booking-cta.secondary_cta_text'] || 'Explore All Speakers'
  const secondaryCtaLink = content['home.booking-cta.secondary_cta_link'] || '/speakers'
  const whatsappNumber = content['home.booking-cta.whatsapp_number'] || '+1 (415) 665-2442'
  const email = content['home.booking-cta.email'] || 'human@speakabout.ai'

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <EditableText
          value={title}
          onChange={(v) => onContentChange('home.booking-cta.title', v)}
          as="h2"
          className="text-4xl font-bold mb-6 font-neue-haas leading-tight"
          isModified={isModified('home.booking-cta.title', content, originalContent)}
          editorMode={editorMode}
        />
        <EditableText
          value={subtitle}
          onChange={(v) => onContentChange('home.booking-cta.subtitle', v)}
          as="p"
          className="text-xl mb-10 text-blue-100 max-w-2xl mx-auto font-montserrat"
          multiline
          isModified={isModified('home.booking-cta.subtitle', content, originalContent)}
          editorMode={editorMode}
        />

        {/* CTA Buttons with editable text */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
          <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-lg">
            <Calendar className="w-5 h-5 text-amber-300" />
            <EditableText
              value={primaryCtaText}
              onChange={(v) => onContentChange('home.booking-cta.primary_cta_text', v)}
              className="text-white font-semibold"
              isModified={isModified('home.booking-cta.primary_cta_text', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
            <EditableText
              value={secondaryCtaText}
              onChange={(v) => onContentChange('home.booking-cta.secondary_cta_text', v)}
              className="text-white font-semibold"
              isModified={isModified('home.booking-cta.secondary_cta_text', content, originalContent)}
              editorMode={editorMode}
            />
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* CTA Links */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 text-xs text-blue-300">
          <div className="flex items-center gap-1">
            <span>Primary Link:</span>
            <EditableText
              value={primaryCtaLink}
              onChange={(v) => onContentChange('home.booking-cta.primary_cta_link', v)}
              className="text-blue-200"
              isModified={isModified('home.booking-cta.primary_cta_link', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
          <div className="flex items-center gap-1">
            <span>Secondary Link:</span>
            <EditableText
              value={secondaryCtaLink}
              onChange={(v) => onContentChange('home.booking-cta.secondary_cta_link', v)}
              className="text-blue-200"
              isModified={isModified('home.booking-cta.secondary_cta_link', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-sm text-blue-200 font-montserrat space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span>WhatsApp:</span>
            <EditableText
              value={whatsappNumber}
              onChange={(v) => onContentChange('home.booking-cta.whatsapp_number', v)}
              className="font-semibold text-white"
              isModified={isModified('home.booking-cta.whatsapp_number', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>Email:</span>
            <EditableText
              value={email}
              onChange={(v) => onContentChange('home.booking-cta.email', v)}
              className="font-semibold text-white"
              isModified={isModified('home.booking-cta.email', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Services Hero Preview
function ServicesHeroPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const badge = content['services.hero.badge'] || 'What We Offer'
  const title = content['services.hero.title'] || 'Our Services'
  const subtitle = content['services.hero.subtitle'] || 'At Speak About AI, we connect you with world-class AI experts to amaze your attendees, educate your executives, and inspire innovation.'

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-16 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block mb-6">
          <span className="px-4 py-2 bg-[#1E68C6]/10 rounded-full text-[#1E68C6] text-sm font-montserrat font-medium">
            <EditableText
              value={badge}
              onChange={(v) => onContentChange('services.hero.badge', v)}
              isModified={isModified('services.hero.badge', content, originalContent)}
              editorMode={editorMode}
            />
          </span>
        </div>
        <EditableText
          value={title}
          onChange={(v) => onContentChange('services.hero.title', v)}
          as="h1"
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 font-neue-haas"
          isModified={isModified('services.hero.title', content, originalContent)}
          editorMode={editorMode}
        />
        <EditableText
          value={subtitle}
          onChange={(v) => onContentChange('services.hero.subtitle', v)}
          as="p"
          className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed font-montserrat"
          multiline
          isModified={isModified('services.hero.subtitle', content, originalContent)}
          editorMode={editorMode}
        />
      </div>
    </section>
  )
}

// Default offerings for preview
const defaultOfferings: ServiceOffering[] = [
  {
    id: 'offering1',
    image: '/services/adam-cheyer-stadium.jpg',
    title: 'Keynote Speeches',
    description: 'Inspire your audience with engaging and informative keynote speeches on the future of technology.'
  },
  {
    id: 'offering2',
    image: '/services/sharon-zhou-panel.jpg',
    title: 'Panel Discussions',
    description: 'Facilitate insightful and dynamic panel discussions on industry trends and challenges.'
  },
  {
    id: 'offering3',
    image: '/services/allie-k-miller-fireside.jpg',
    title: 'Fireside Chats',
    description: 'Create intimate and engaging conversations with industry leaders in a fireside chat format.'
  },
  {
    id: 'offering4',
    image: '/services/tatyana-mamut-speaking.jpg',
    title: 'Workshops',
    description: 'Provide hands-on learning experiences with interactive workshops tailored to your audience\'s needs.'
  },
  {
    id: 'offering5',
    image: '/services/sharon-zhou-headshot.png',
    title: 'Virtual Presentations',
    description: 'Reach a global audience with engaging and professional virtual presentations.'
  },
  {
    id: 'offering6',
    image: '/services/simon-pierro-youtube.jpg',
    title: 'Custom Video Content',
    description: 'Create compelling video content for marketing, training, and internal communications.'
  },
]

// Services Offerings Preview
function ServicesOfferingsPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  // Parse offerings from content or use defaults
  const offeringsJson = content['services.offerings.list']
  let offerings = defaultOfferings
  if (offeringsJson) {
    try {
      offerings = JSON.parse(offeringsJson)
    } catch (e) {
      // Use defaults if JSON parsing fails
    }
  }

  const handleOfferingsChange = (newOfferings: ServiceOffering[]) => {
    onContentChange('services.offerings.list', JSON.stringify(newOfferings))
  }

  return (
    <section className="bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Offerings Editor Button */}
        <div className="text-center mb-6">
          <OfferingsListEditor
            offerings={offerings}
            onChange={handleOfferingsChange}
            isModified={isModified('services.offerings.list', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering) => (
            <div key={offering.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative w-full aspect-[4/3] bg-gray-200">
                <img
                  src={offering.image}
                  alt={offering.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-2 font-neue-haas">
                  {offering.title}
                </h2>
                <p className="text-gray-700 font-montserrat text-sm">
                  {offering.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Services Process Preview
function ServicesProcessPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const sectionTitle = content['services.process.section_title'] || 'Our Process'
  const sectionSubtitle = content['services.process.section_subtitle'] || 'From initial consultation to final delivery, we ensure a seamless experience that brings world-class AI expertise to your event.'

  const steps = [
    { id: 'step1', defaultTitle: 'Contact Us', defaultDesc: 'Fill out our online form to request a free consultation. One of our team members will contact you within 24 hours to discuss your event needs.' },
    { id: 'step2', defaultTitle: 'Pick Your Speaker', defaultDesc: "Based on your event goals, audience, and budget, we'll provide a curated list of AI experts for you to consider." },
    { id: 'step3', defaultTitle: 'Enjoy Your Event', defaultDesc: "Once you've selected your speaker, we handle all the details—from booking to logistics to post-event follow-up." },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <EditableText
            value={sectionTitle}
            onChange={(v) => onContentChange('services.process.section_title', v)}
            as="h2"
            className="text-3xl font-bold text-gray-900 mb-4 font-neue-haas"
            isModified={isModified('services.process.section_title', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={sectionSubtitle}
            onChange={(v) => onContentChange('services.process.section_subtitle', v)}
            as="p"
            className="text-lg text-gray-600 max-w-3xl mx-auto font-montserrat"
            multiline
            isModified={isModified('services.process.section_subtitle', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const titleKey = `services.process.${step.id}_title`
            const descKey = `services.process.${step.id}_description`
            const title = content[titleKey] || step.defaultTitle
            const description = content[descKey] || step.defaultDesc

            return (
              <div key={step.id} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-[#1E68C6] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">{index + 1}</span>
                  </div>
                </div>
                <EditableText
                  value={title}
                  onChange={(v) => onContentChange(titleKey, v)}
                  as="h3"
                  className="text-xl font-bold text-gray-900 mb-3 font-neue-haas"
                  isModified={isModified(titleKey, content, originalContent)}
                  editorMode={editorMode}
                />
                <EditableText
                  value={description}
                  onChange={(v) => onContentChange(descKey, v)}
                  as="p"
                  className="text-gray-600 font-montserrat"
                  multiline
                  isModified={isModified(descKey, content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Services Events Preview
function ServicesEventsPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const sectionTitle = content['services.events.section_title'] || 'Our In-Person Events'
  const sectionSubtitle = content['services.events.section_subtitle'] || 'In addition to helping others find keynote speakers for their events, we also host our own event series in the Bay Area, showcasing the speakers on our roster.'
  const latestEventTitle = content['services.events.latest_event_title'] || 'Latest Event'
  const latestEventDescription = content['services.events.latest_event_description'] || 'Our last event, hosted at Microsoft HQ in Silicon Valley, featured speakers such as Adam Cheyer, Peter Norvig, Maya Ackerman, Murray Newlands, Jeremiah Owyang, Katie McMahon, Max Sills, and many more.'
  const latestEventCta = content['services.events.latest_event_cta'] || "Whether you're an event planner, an executive, or just interested in AI, these events are a great way to get an overview of the current AI landscape!"
  const eventImage = content['services.events.event_image'] || '/events/robert-strong-on-stage-at-microsoft.jpg'
  const newsletterTitle = content['services.events.newsletter_title'] || 'Stay Updated'
  const newsletterDescription = content['services.events.newsletter_description'] || 'Sign up with your email address to stay up to date on our upcoming events.'

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <EditableText
            value={sectionTitle}
            onChange={(v) => onContentChange('services.events.section_title', v)}
            as="h2"
            className="text-3xl font-bold text-gray-900 mb-4 font-neue-haas"
            isModified={isModified('services.events.section_title', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={sectionSubtitle}
            onChange={(v) => onContentChange('services.events.section_subtitle', v)}
            as="p"
            className="text-lg text-gray-600 max-w-3xl mx-auto font-montserrat"
            multiline
            isModified={isModified('services.events.section_subtitle', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <EditableText
              value={latestEventTitle}
              onChange={(v) => onContentChange('services.events.latest_event_title', v)}
              as="h3"
              className="text-2xl font-bold text-gray-900 mb-4 font-neue-haas"
              isModified={isModified('services.events.latest_event_title', content, originalContent)}
              editorMode={editorMode}
            />
            <EditableText
              value={latestEventDescription}
              onChange={(v) => onContentChange('services.events.latest_event_description', v)}
              as="p"
              className="text-gray-600 mb-6 font-montserrat"
              multiline
              isModified={isModified('services.events.latest_event_description', content, originalContent)}
              editorMode={editorMode}
            />
            <EditableImage
              src={eventImage}
              alt="Event photo"
              onChange={(newSrc) => onContentChange('services.events.event_image', newSrc)}
              isModified={isModified('services.events.event_image', content, originalContent)}
              editorMode={editorMode}
              className="w-full h-48 object-cover rounded-lg mb-4"
              uploadFolder="events"
            />
            <EditableText
              value={latestEventCta}
              onChange={(v) => onContentChange('services.events.latest_event_cta', v)}
              as="p"
              className="text-gray-600 font-montserrat"
              multiline
              isModified={isModified('services.events.latest_event_cta', content, originalContent)}
              editorMode={editorMode}
            />
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <EditableText
              value={newsletterTitle}
              onChange={(v) => onContentChange('services.events.newsletter_title', v)}
              as="h3"
              className="text-2xl font-bold text-gray-900 mb-4 font-neue-haas"
              isModified={isModified('services.events.newsletter_title', content, originalContent)}
              editorMode={editorMode}
            />
            <EditableText
              value={newsletterDescription}
              onChange={(v) => onContentChange('services.events.newsletter_description', v)}
              as="p"
              className="text-gray-600 mb-6 font-montserrat"
              multiline
              isModified={isModified('services.events.newsletter_description', content, originalContent)}
              editorMode={editorMode}
            />
            <div className="space-y-3 opacity-70">
              <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
              <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
              <div className="h-10 bg-[#1E68C6] rounded flex items-center justify-center text-white text-sm">Subscribe</div>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center italic">Newsletter form preview</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// Services FAQ Preview
function ServicesFAQPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const sectionTitle = content['services.faq.section_title'] || 'Frequently Asked Questions'

  const faqs = [
    { id: 'faq1', defaultQ: 'How long are typical speaking engagements?', defaultA: "The duration can vary based on your needs. Keynotes typically range from 30-60 minutes, while workshops can be half-day or full-day events. We're flexible and can adjust the format to fit your schedule." },
    { id: 'faq2', defaultQ: 'Can we book multiple services for a single event?', defaultA: 'Yes, many clients combine our services. For example, you might book a keynote speaker for a large session, followed by a smaller workshop or fireside chat. We can help you design a program that maximizes value for your audience.' },
    { id: 'faq3', defaultQ: 'Can your speakers create custom content for our event?', defaultA: 'Absolutely. Our speakers are happy to tailor their presentations to your specific needs, industry, and audience. This ensures that the content is relevant and valuable to your attendees.' },
    { id: 'faq4', defaultQ: 'How do you tailor your services to different industries?', defaultA: "Our diverse roster of AI experts allows us to match speakers and content to your specific industry. Whether you're in healthcare, finance, technology, or any other sector, we can provide relevant insights and applications of AI to your field." }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <EditableText
            value={sectionTitle}
            onChange={(v) => onContentChange('services.faq.section_title', v)}
            as="h2"
            className="text-3xl font-bold text-gray-900 mb-4 font-neue-haas"
            isModified={isModified('services.faq.section_title', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => {
            const qKey = `services.faq.${faq.id}_question`
            const aKey = `services.faq.${faq.id}_answer`
            const question = content[qKey] || faq.defaultQ
            const answer = content[aKey] || faq.defaultA

            return (
              <div key={faq.id} className="bg-gray-50 rounded-lg p-6">
                <EditableText
                  value={question}
                  onChange={(v) => onContentChange(qKey, v)}
                  as="h3"
                  className="text-lg font-semibold text-gray-900 mb-2 font-neue-haas"
                  isModified={isModified(qKey, content, originalContent)}
                  editorMode={editorMode}
                />
                <EditableText
                  value={answer}
                  onChange={(v) => onContentChange(aKey, v)}
                  as="p"
                  className="text-gray-600 font-montserrat"
                  multiline
                  isModified={isModified(aKey, content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Services Contact Preview
function ServicesContactPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const title = content['services.cta.title'] || 'Ready to Elevate Your Event?'
  const subtitle = content['services.cta.subtitle'] || 'Let us connect you with the perfect AI expert to inspire your audience and drive meaningful conversations about the future of artificial intelligence.'
  const buttonText = content['services.cta.button_text'] || 'Book Speaker Today'
  const stat1Value = content['services.cta.stat1_value'] || '24 Hours'
  const stat1Label = content['services.cta.stat1_label'] || 'Average Response Time'
  const stat2Value = content['services.cta.stat2_value'] || '67+'
  const stat2Label = content['services.cta.stat2_label'] || 'AI Experts Available'
  const stat3Value = content['services.cta.stat3_value'] || '500+'
  const stat3Label = content['services.cta.stat3_label'] || 'Successful Events'

  return (
    <section className="py-16 bg-[#1E68C6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <EditableText
          value={title}
          onChange={(v) => onContentChange('services.cta.title', v)}
          as="h2"
          className="text-3xl font-bold text-white mb-6 font-neue-haas"
          isModified={isModified('services.cta.title', content, originalContent)}
          editorMode={editorMode}
        />
        <EditableText
          value={subtitle}
          onChange={(v) => onContentChange('services.cta.subtitle', v)}
          as="p"
          className="text-lg text-white text-opacity-90 mb-10 max-w-3xl mx-auto font-montserrat"
          multiline
          isModified={isModified('services.cta.subtitle', content, originalContent)}
          editorMode={editorMode}
        />

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-3 rounded-lg">
            <EditableText
              value={buttonText}
              onChange={(v) => onContentChange('services.cta.button_text', v)}
              className="text-white font-semibold"
              isModified={isModified('services.cta.button_text', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <EditableText
              value={stat1Value}
              onChange={(v) => onContentChange('services.cta.stat1_value', v)}
              as="div"
              className="text-3xl font-bold text-white mb-2 font-neue-haas"
              isModified={isModified('services.cta.stat1_value', content, originalContent)}
              editorMode={editorMode}
            />
            <EditableText
              value={stat1Label}
              onChange={(v) => onContentChange('services.cta.stat1_label', v)}
              as="div"
              className="text-white text-opacity-90 font-montserrat"
              isModified={isModified('services.cta.stat1_label', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
          <div>
            <EditableText
              value={stat2Value}
              onChange={(v) => onContentChange('services.cta.stat2_value', v)}
              as="div"
              className="text-3xl font-bold text-white mb-2 font-neue-haas"
              isModified={isModified('services.cta.stat2_value', content, originalContent)}
              editorMode={editorMode}
            />
            <EditableText
              value={stat2Label}
              onChange={(v) => onContentChange('services.cta.stat2_label', v)}
              as="div"
              className="text-white text-opacity-90 font-montserrat"
              isModified={isModified('services.cta.stat2_label', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
          <div>
            <EditableText
              value={stat3Value}
              onChange={(v) => onContentChange('services.cta.stat3_value', v)}
              as="div"
              className="text-3xl font-bold text-white mb-2 font-neue-haas"
              isModified={isModified('services.cta.stat3_value', content, originalContent)}
              editorMode={editorMode}
            />
            <EditableText
              value={stat3Label}
              onChange={(v) => onContentChange('services.cta.stat3_label', v)}
              as="div"
              className="text-white text-opacity-90 font-montserrat"
              isModified={isModified('services.cta.stat3_label', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Team Hero Preview
function TeamHeroPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const badge = content['team.hero.badge'] || 'Our Story'
  const title = content['team.hero.title'] || 'How It All Started'
  const p1 = content['team.hero.story_paragraph1'] || 'Robert Strong has been booking himself and other talent for 30+ years, and has called Silicon Valley home for 20 of them.'
  const p2 = content['team.hero.story_paragraph2'] || 'After ChatGPT launched and his friends in the AI space started getting flooded with speaking requests, Robert decided to turn it into an agency.'
  const p3 = content['team.hero.story_paragraph3'] || 'Today, Speak About AI has booked speakers everywhere from Silicon Valley to Singapore.'

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-16 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-[#1E68C6]/10 rounded-full text-[#1E68C6] text-sm font-montserrat font-medium">
              <EditableText
                value={badge}
                onChange={(v) => onContentChange('team.hero.badge', v)}
                isModified={isModified('team.hero.badge', content, originalContent)}
                editorMode={editorMode}
              />
            </span>
          </div>
          <EditableText
            value={title}
            onChange={(v) => onContentChange('team.hero.title', v)}
            as="h1"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 font-neue-haas"
            isModified={isModified('team.hero.title', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          <EditableText
            value={p1}
            onChange={(v) => onContentChange('team.hero.story_paragraph1', v)}
            as="p"
            className="text-base text-gray-600 font-montserrat leading-relaxed"
            multiline
            isModified={isModified('team.hero.story_paragraph1', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={p2}
            onChange={(v) => onContentChange('team.hero.story_paragraph2', v)}
            as="p"
            className="text-base text-gray-600 font-montserrat leading-relaxed"
            multiline
            isModified={isModified('team.hero.story_paragraph2', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={p3}
            onChange={(v) => onContentChange('team.hero.story_paragraph3', v)}
            as="p"
            className="text-base text-gray-600 font-montserrat leading-relaxed"
            multiline
            isModified={isModified('team.hero.story_paragraph3', content, originalContent)}
            editorMode={editorMode}
          />
        </div>
      </div>
    </section>
  )
}

// Default team members for preview
const defaultTeamMembers: TeamMember[] = [
  {
    id: 'member1',
    name: 'Robert Strong',
    title: 'CEO',
    image: '/team/robert-strong-headshot.png',
    bio: "Speak About AI was founded by author, speaker, and entertainer Robert Strong and is a division of Strong Entertainment, LLC. With 30+ years of experience booking speakers and entertainers globally, Robert brings unparalleled expertise to the AI speaking circuit.",
    linkedin: 'https://linkedin.com/in/robertstrong',
  },
]

// Team Members Preview
function TeamMembersPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  // Parse members from content or use defaults
  const membersJson = content['team.members.list']
  let members = defaultTeamMembers
  if (membersJson) {
    try {
      members = JSON.parse(membersJson)
    } catch (e) {
      // Use defaults if JSON parsing fails
    }
  }

  const handleMembersChange = (newMembers: TeamMember[]) => {
    onContentChange('team.members.list', JSON.stringify(newMembers))
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center font-neue-haas">Meet the Team</h2>

        {/* Team Members Editor Button */}
        <div className="text-center mb-8">
          <TeamMembersListEditor
            members={members}
            onChange={handleMembersChange}
            isModified={isModified('team.members.list', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {members.map((member) => (
            <div key={member.id} className="bg-gray-50 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                  <img
                    src={member.image || '/placeholder.svg'}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 font-neue-haas">{member.name}</h3>
                  <p className="text-[#1E68C6] font-semibold mb-3 font-montserrat text-sm">{member.title}</p>
                  <p className="text-gray-600 leading-relaxed font-montserrat text-sm">{member.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Join Team / CTA Preview
function JoinTeamPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const title = content['team.cta.title'] || 'Get In Touch'
  const subtitle = content['team.cta.subtitle'] || "Interested in working with Speak About AI or have questions about our services? We'd love to hear from you."
  const buttonText = content['team.cta.button_text'] || 'Email Us'
  const email = content['team.cta.email'] || 'human@speakabout.ai'

  return (
    <section className="py-16 bg-[#1E68C6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <EditableText
          value={title}
          onChange={(v) => onContentChange('team.cta.title', v)}
          as="h2"
          className="text-2xl font-bold text-white mb-4 font-neue-haas"
          isModified={isModified('team.cta.title', content, originalContent)}
          editorMode={editorMode}
        />
        <EditableText
          value={subtitle}
          onChange={(v) => onContentChange('team.cta.subtitle', v)}
          as="p"
          className="text-lg text-white text-opacity-90 mb-6 max-w-3xl mx-auto font-montserrat"
          multiline
          isModified={isModified('team.cta.subtitle', content, originalContent)}
          editorMode={editorMode}
        />

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <EditableText
            value={buttonText}
            onChange={(v) => onContentChange('team.cta.button_text', v)}
            className="bg-amber-500 px-6 py-3 rounded-lg text-white font-semibold"
            isModified={isModified('team.cta.button_text', content, originalContent)}
            editorMode={editorMode}
          />
          <div className="text-white text-sm">
            Email: <EditableText
              value={email}
              onChange={(v) => onContentChange('team.cta.email', v)}
              className="underline"
              isModified={isModified('team.cta.email', content, originalContent)}
              editorMode={editorMode}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Speakers Directory Preview
function SpeakersDirectoryPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const heroTitle = content['speakers.hero.title'] || 'All AI Keynote Speakers'
  const heroSubtitle = content['speakers.hero.subtitle'] || 'Browse our complete directory of world-class artificial intelligence experts, tech visionaries, and industry practitioners.'
  const searchPlaceholder = content['speakers.filters.search_placeholder'] || 'Search speakers by name, expertise, or industry...'
  const allIndustries = content['speakers.filters.all_industries'] || 'All Industries'
  const allFees = content['speakers.filters.all_fees'] || 'All Fee Ranges'
  const allLocations = content['speakers.filters.all_locations'] || 'All Locations'
  const showingText = content['speakers.filters.showing_text'] || 'Showing {displayed} of {total} speakers'
  const loadingText = content['speakers.results.loading_text'] || 'Loading speakers...'
  const noResults = content['speakers.results.no_results'] || 'No speakers found matching your criteria. Try adjusting your search or filters.'
  const clearFilters = content['speakers.results.clear_filters'] || 'Clear Filters'
  const loadMore = content['speakers.buttons.load_more'] || 'Load More Speakers ({remaining} remaining)'

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#EAEAEE] to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <EditableText
              value={heroTitle}
              onChange={(v) => onContentChange('speakers.hero.title', v)}
              as="h1"
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-neue-haas"
              isModified={isModified('speakers.hero.title', content, originalContent)}
              editorMode={editorMode}
            />
            <EditableText
              value={heroSubtitle}
              onChange={(v) => onContentChange('speakers.hero.subtitle', v)}
              as="p"
              className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat"
              multiline
              isModified={isModified('speakers.hero.subtitle', content, originalContent)}
              editorMode={editorMode}
            />
          </div>

          {/* Search & Filters Preview */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="relative mb-4">
                <div className="flex items-center gap-2 border-2 border-[#1E68C6]/30 rounded px-3 py-2">
                  <span className="text-[#1E68C6] text-sm">🔍</span>
                  <EditableText
                    value={searchPlaceholder}
                    onChange={(v) => onContentChange('speakers.filters.search_placeholder', v)}
                    className="text-gray-400 text-sm"
                    isModified={isModified('speakers.filters.search_placeholder', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 block">Industry:</span>
                  <EditableText
                    value={allIndustries}
                    onChange={(v) => onContentChange('speakers.filters.all_industries', v)}
                    className="text-sm text-gray-700"
                    isModified={isModified('speakers.filters.all_industries', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
                <div className="border rounded px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 block">Fee Range:</span>
                  <EditableText
                    value={allFees}
                    onChange={(v) => onContentChange('speakers.filters.all_fees', v)}
                    className="text-sm text-gray-700"
                    isModified={isModified('speakers.filters.all_fees', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
                <div className="border rounded px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 block">Location:</span>
                  <EditableText
                    value={allLocations}
                    onChange={(v) => onContentChange('speakers.filters.all_locations', v)}
                    className="text-sm text-gray-700"
                    isModified={isModified('speakers.filters.all_locations', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <EditableText
                  value={showingText}
                  onChange={(v) => onContentChange('speakers.filters.showing_text', v)}
                  className="text-gray-600"
                  isModified={isModified('speakers.filters.showing_text', content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl p-4 h-72 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Speaker Card {i}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 italic mb-6">Speaker cards are loaded dynamically from the database</p>

          <div className="space-y-4">
            <div className="text-center">
              <span className="text-sm text-gray-500">Loading Text:</span>
              <EditableText
                value={loadingText}
                onChange={(v) => onContentChange('speakers.results.loading_text', v)}
                className="text-gray-600 ml-2"
                isModified={isModified('speakers.results.loading_text', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">No Results:</span>
              <EditableText
                value={noResults}
                onChange={(v) => onContentChange('speakers.results.no_results', v)}
                className="text-gray-600 ml-2"
                multiline
                isModified={isModified('speakers.results.no_results', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">Clear Filters Button:</span>
              <EditableText
                value={clearFilters}
                onChange={(v) => onContentChange('speakers.results.clear_filters', v)}
                className="text-blue-600 ml-2 font-semibold"
                isModified={isModified('speakers.results.clear_filters', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">Load More Button:</span>
              <EditableText
                value={loadMore}
                onChange={(v) => onContentChange('speakers.buttons.load_more', v)}
                className="text-blue-600 ml-2 font-semibold"
                isModified={isModified('speakers.buttons.load_more', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Workshops Directory Preview
function WorkshopsDirectoryPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const heroTitle = content['workshops.hero.title'] || 'AI Workshops'
  const heroSubtitle = content['workshops.hero.subtitle'] || 'Discover hands-on AI workshops led by industry experts. Interactive training programs covering machine learning, generative AI, and practical implementation strategies for your team.'
  const searchPlaceholder = content['workshops.filters.search_placeholder'] || 'Search workshops by name, topic, or instructor...'
  const showFilters = content['workshops.filters.show_filters'] || 'Show Filters'
  const hideFilters = content['workshops.filters.hide_filters'] || 'Hide Filters'
  const allFormats = content['workshops.filters.all_formats'] || 'All Formats'
  const allLengths = content['workshops.filters.all_lengths'] || 'All Lengths'
  const allLocations = content['workshops.filters.all_locations'] || 'All Locations'
  const allAudiences = content['workshops.filters.all_audiences'] || 'All Audiences'
  const showingText = content['workshops.filters.showing_text'] || 'Showing {displayed} of {total} workshops'
  const clearFilters = content['workshops.filters.clear_filters'] || 'Clear All Filters'
  const loadingText = content['workshops.results.loading_text'] || 'Loading workshops...'
  const noResults = content['workshops.results.no_results'] || 'No workshops found matching your criteria.'
  const inquireButton = content['workshops.buttons.inquire'] || 'Inquire About Workshop'
  const viewDetailsButton = content['workshops.buttons.view_details'] || 'View Details'

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#EAEAEE] to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <EditableText
              value={heroTitle}
              onChange={(v) => onContentChange('workshops.hero.title', v)}
              as="h1"
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-neue-haas"
              isModified={isModified('workshops.hero.title', content, originalContent)}
              editorMode={editorMode}
            />
            <EditableText
              value={heroSubtitle}
              onChange={(v) => onContentChange('workshops.hero.subtitle', v)}
              as="p"
              className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat"
              multiline
              isModified={isModified('workshops.hero.subtitle', content, originalContent)}
              editorMode={editorMode}
            />
          </div>

          {/* Search & Filters Preview */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 flex items-center gap-2 border-2 border-[#1E68C6]/30 rounded px-3 py-2">
                  <span className="text-[#1E68C6] text-sm">🔍</span>
                  <EditableText
                    value={searchPlaceholder}
                    onChange={(v) => onContentChange('workshops.filters.search_placeholder', v)}
                    className="text-gray-400 text-sm"
                    isModified={isModified('workshops.filters.search_placeholder', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
                <div className="flex items-center gap-2 border rounded px-3 py-2 bg-gray-50">
                  <span className="text-sm text-gray-600">Toggle Button:</span>
                  <EditableText
                    value={showFilters}
                    onChange={(v) => onContentChange('workshops.filters.show_filters', v)}
                    className="text-sm text-blue-600"
                    isModified={isModified('workshops.filters.show_filters', content, originalContent)}
                    editorMode={editorMode}
                  />
                  <span className="text-gray-400">/</span>
                  <EditableText
                    value={hideFilters}
                    onChange={(v) => onContentChange('workshops.filters.hide_filters', v)}
                    className="text-sm text-blue-600"
                    isModified={isModified('workshops.filters.hide_filters', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="border rounded px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 block">Format:</span>
                  <EditableText
                    value={allFormats}
                    onChange={(v) => onContentChange('workshops.filters.all_formats', v)}
                    className="text-sm text-gray-700"
                    isModified={isModified('workshops.filters.all_formats', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
                <div className="border rounded px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 block">Length:</span>
                  <EditableText
                    value={allLengths}
                    onChange={(v) => onContentChange('workshops.filters.all_lengths', v)}
                    className="text-sm text-gray-700"
                    isModified={isModified('workshops.filters.all_lengths', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
                <div className="border rounded px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 block">Location:</span>
                  <EditableText
                    value={allLocations}
                    onChange={(v) => onContentChange('workshops.filters.all_locations', v)}
                    className="text-sm text-gray-700"
                    isModified={isModified('workshops.filters.all_locations', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
                <div className="border rounded px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-500 block">Audience:</span>
                  <EditableText
                    value={allAudiences}
                    onChange={(v) => onContentChange('workshops.filters.all_audiences', v)}
                    className="text-sm text-gray-700"
                    isModified={isModified('workshops.filters.all_audiences', content, originalContent)}
                    editorMode={editorMode}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <EditableText
                  value={showingText}
                  onChange={(v) => onContentChange('workshops.filters.showing_text', v)}
                  className="text-gray-600"
                  isModified={isModified('workshops.filters.showing_text', content, originalContent)}
                  editorMode={editorMode}
                />
                <EditableText
                  value={clearFilters}
                  onChange={(v) => onContentChange('workshops.filters.clear_filters', v)}
                  className="text-blue-600"
                  isModified={isModified('workshops.filters.clear_filters', content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl overflow-hidden">
                <div className="h-40 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Workshop Image</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="flex gap-2 pt-2">
                    <div className="flex-1 bg-amber-500 text-white text-xs py-2 rounded text-center">
                      <EditableText
                        value={inquireButton}
                        onChange={(v) => onContentChange('workshops.buttons.inquire', v)}
                        className="text-white"
                        isModified={isModified('workshops.buttons.inquire', content, originalContent)}
                        editorMode={editorMode}
                      />
                    </div>
                    <div className="flex-1 bg-gray-200 text-gray-700 text-xs py-2 rounded text-center">
                      <EditableText
                        value={viewDetailsButton}
                        onChange={(v) => onContentChange('workshops.buttons.view_details', v)}
                        className="text-gray-700"
                        isModified={isModified('workshops.buttons.view_details', content, originalContent)}
                        editorMode={editorMode}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 italic mb-6">Workshop cards are loaded dynamically from the database</p>

          <div className="space-y-4">
            <div className="text-center">
              <span className="text-sm text-gray-500">Loading Text:</span>
              <EditableText
                value={loadingText}
                onChange={(v) => onContentChange('workshops.results.loading_text', v)}
                className="text-gray-600 ml-2"
                isModified={isModified('workshops.results.loading_text', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">No Results:</span>
              <EditableText
                value={noResults}
                onChange={(v) => onContentChange('workshops.results.no_results', v)}
                className="text-gray-600 ml-2"
                isModified={isModified('workshops.results.no_results', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Contact/Inquiries Page Preview Component
function ContactPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  const [activeMode, setActiveMode] = useState<'keynote' | 'workshop'>('keynote')

  // Header content
  const keynoteTitle = content['contact.header.keynote_title'] || 'Book an AI Keynote Speaker'
  const workshopTitle = content['contact.header.workshop_title'] || 'Book an AI Workshop'
  const keynoteSubtitle = content['contact.header.keynote_subtitle'] || "Tell us about your event and we'll match you with the perfect AI expert"
  const workshopSubtitle = content['contact.header.workshop_subtitle'] || "Tell us about your training needs and we'll find the perfect AI workshop"

  // Tab labels
  const keynoteTabLabel = content['contact.tabs.keynote_label'] || 'Keynote Speaker'
  const workshopTabLabel = content['contact.tabs.workshop_label'] || 'Workshop'

  // Form sections - shared
  const formTitle = content['contact.form.title'] || 'Event Information'
  const formDescription = content['contact.form.description'] || 'Please provide as much detail as possible about your event'
  const contactSectionTitle = content['contact.form.contact_section_title'] || 'Contact Information'
  const eventSectionTitle = content['contact.form.event_section_title'] || 'Event Details'
  const additionalSectionTitle = content['contact.form.additional_section_title'] || 'Additional Information'

  // Keynote-specific
  const speakerSectionTitle = content['contact.keynote.speaker_section_title'] || 'Speaker Preferences'
  const speakerSectionDesc = content['contact.keynote.speaker_section_desc'] || 'Select one or more speakers you are interested in, or let us help you find the right fit.'
  const noSpeakerText = content['contact.keynote.no_speaker_text'] || "I don't have a specific speaker in mind"
  const budgetSectionTitle = content['contact.keynote.budget_section_title'] || 'Speaker Budget Range'

  // Workshop-specific
  const workshopSectionTitle = content['contact.workshop.workshop_section_title'] || 'Workshop Selection'
  const workshopSectionDesc = content['contact.workshop.workshop_section_desc'] || 'Select a workshop or let us help you find the right one.'
  const noWorkshopText = content['contact.workshop.no_workshop_text'] || 'Help me find a workshop'
  const participantsSectionTitle = content['contact.workshop.participants_title'] || 'Number of Participants'
  const skillLevelTitle = content['contact.workshop.skill_level_title'] || 'Participant Skill Level'
  const formatTitle = content['contact.workshop.format_title'] || 'Preferred Format'

  // Need Help card
  const needHelpTitle = content['contact.help.title'] || 'Need Help?'
  const callLabel = content['contact.help.call_label'] || 'Call us directly'
  const phone = content['contact.help.phone'] || '+1 (415) 665-2442'
  const emailLabel = content['contact.help.email_label'] || 'Email us'
  const email = content['contact.help.email'] || 'human@speakabout.ai'

  // Newsletter opt-in
  const newsletterTitle = content['contact.newsletter.title'] || 'Subscribe to our newsletter'
  const newsletterDescription = content['contact.newsletter.description'] || 'Get exclusive AI speaker insights, event trends, and industry updates delivered to your inbox.'

  // Success message
  const successTitle = content['contact.success.title'] || 'Request Submitted Successfully!'
  const successMessage = content['contact.success.message'] || "Thank you for your interest. We'll be in touch within 24 hours with personalized speaker recommendations for your event."

  // Button text
  const submitButtonText = content['contact.buttons.submit'] || 'Submit Speaker Request'

  return (
    <div className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Mode Toggle - Editor Control */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Edit Form Content</h3>
              <p className="text-sm text-blue-700">Toggle between Keynote Speaker and Workshop forms to edit their specific content</p>
            </div>
            <div className="flex rounded-lg border border-blue-300 bg-white p-1">
              <button
                type="button"
                onClick={() => setActiveMode('keynote')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeMode === 'keynote'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Mic className="w-4 h-4" />
                Keynote Speaker
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('workshop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeMode === 'workshop'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Workshop
              </button>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="text-center space-y-4">
          <EditableText
            value={activeMode === 'keynote' ? keynoteTitle : workshopTitle}
            onChange={(v) => onContentChange(activeMode === 'keynote' ? 'contact.header.keynote_title' : 'contact.header.workshop_title', v)}
            as="h1"
            className="text-4xl font-bold text-gray-900"
            isModified={isModified(activeMode === 'keynote' ? 'contact.header.keynote_title' : 'contact.header.workshop_title', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={activeMode === 'keynote' ? keynoteSubtitle : workshopSubtitle}
            onChange={(v) => onContentChange(activeMode === 'keynote' ? 'contact.header.keynote_subtitle' : 'contact.header.workshop_subtitle', v)}
            as="p"
            className="text-lg text-gray-600"
            isModified={isModified(activeMode === 'keynote' ? 'contact.header.keynote_subtitle' : 'contact.header.workshop_subtitle', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        {/* Tab Labels */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border bg-gray-100 p-1">
            <div className={`flex items-center gap-2 px-6 py-3 rounded-md ${activeMode === 'keynote' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>
              <Mic className="w-4 h-4" />
              <EditableText
                value={keynoteTabLabel}
                onChange={(v) => onContentChange('contact.tabs.keynote_label', v)}
                className="font-medium"
                isModified={isModified('contact.tabs.keynote_label', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
            <div className={`flex items-center gap-2 px-6 py-3 rounded-md ${activeMode === 'workshop' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>
              <GraduationCap className="w-4 h-4" />
              <EditableText
                value={workshopTabLabel}
                onChange={(v) => onContentChange('contact.tabs.workshop_label', v)}
                className="font-medium"
                isModified={isModified('contact.tabs.workshop_label', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
          </div>
        </div>

        {/* Form Card Preview */}
        <div className="bg-white rounded-xl shadow-lg border p-6 space-y-6">
          {/* Form Header */}
          <div className="border-b pb-4">
            <EditableText
              value={formTitle}
              onChange={(v) => onContentChange('contact.form.title', v)}
              as="h2"
              className="text-2xl font-semibold text-gray-900 mb-2"
              isModified={isModified('contact.form.title', content, originalContent)}
              editorMode={editorMode}
            />
            <EditableText
              value={formDescription}
              onChange={(v) => onContentChange('contact.form.description', v)}
              as="p"
              className="text-gray-600"
              isModified={isModified('contact.form.description', content, originalContent)}
              editorMode={editorMode}
            />
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <EditableText
              value={contactSectionTitle}
              onChange={(v) => onContentChange('contact.form.contact_section_title', v)}
              as="h3"
              className="text-lg font-semibold text-gray-900"
              isModified={isModified('contact.form.contact_section_title', content, originalContent)}
              editorMode={editorMode}
            />
            <div className="grid md:grid-cols-2 gap-4 opacity-50">
              <div className="h-12 bg-gray-100 rounded border flex items-center px-3 text-gray-400 text-sm">Your Name</div>
              <div className="h-12 bg-gray-100 rounded border flex items-center px-3 text-gray-400 text-sm">Email Address</div>
              <div className="h-12 bg-gray-100 rounded border flex items-center px-3 text-gray-400 text-sm">Phone Number</div>
              <div className="h-12 bg-gray-100 rounded border flex items-center px-3 text-gray-400 text-sm">Organization Name</div>
            </div>
          </div>

          {/* Speaker/Workshop Selection - Mode Specific */}
          {activeMode === 'keynote' ? (
            <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-medium mb-2">
                <Mic className="w-4 h-4" />
                KEYNOTE SPEAKER SPECIFIC
              </div>
              <EditableText
                value={speakerSectionTitle}
                onChange={(v) => onContentChange('contact.keynote.speaker_section_title', v)}
                as="h3"
                className="text-lg font-semibold text-gray-900"
                isModified={isModified('contact.keynote.speaker_section_title', content, originalContent)}
                editorMode={editorMode}
              />
              <EditableText
                value={speakerSectionDesc}
                onChange={(v) => onContentChange('contact.keynote.speaker_section_desc', v)}
                as="p"
                className="text-sm text-gray-600"
                multiline
                isModified={isModified('contact.keynote.speaker_section_desc', content, originalContent)}
                editorMode={editorMode}
              />
              <div className="h-12 bg-white rounded border opacity-70 flex items-center px-3 text-gray-400 text-sm">
                Search speakers...
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 border rounded"></div>
                <EditableText
                  value={noSpeakerText}
                  onChange={(v) => onContentChange('contact.keynote.no_speaker_text', v)}
                  className="text-gray-700"
                  isModified={isModified('contact.keynote.no_speaker_text', content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-800 text-xs font-medium mb-2">
                <GraduationCap className="w-4 h-4" />
                WORKSHOP SPECIFIC
              </div>
              <EditableText
                value={workshopSectionTitle}
                onChange={(v) => onContentChange('contact.workshop.workshop_section_title', v)}
                as="h3"
                className="text-lg font-semibold text-gray-900"
                isModified={isModified('contact.workshop.workshop_section_title', content, originalContent)}
                editorMode={editorMode}
              />
              <EditableText
                value={workshopSectionDesc}
                onChange={(v) => onContentChange('contact.workshop.workshop_section_desc', v)}
                as="p"
                className="text-sm text-gray-600"
                multiline
                isModified={isModified('contact.workshop.workshop_section_desc', content, originalContent)}
                editorMode={editorMode}
              />
              <div className="h-12 bg-white rounded border opacity-70 flex items-center px-3 text-gray-400 text-sm">
                Search workshops...
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 border rounded"></div>
                <EditableText
                  value={noWorkshopText}
                  onChange={(v) => onContentChange('contact.workshop.no_workshop_text', v)}
                  className="text-gray-700"
                  isModified={isModified('contact.workshop.no_workshop_text', content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            </div>
          )}

          {/* Event Details Section */}
          <div className="space-y-4">
            <EditableText
              value={eventSectionTitle}
              onChange={(v) => onContentChange('contact.form.event_section_title', v)}
              as="h3"
              className="text-lg font-semibold text-gray-900"
              isModified={isModified('contact.form.event_section_title', content, originalContent)}
              editorMode={editorMode}
            />
            <div className="grid md:grid-cols-2 gap-4 opacity-50">
              <div className="h-12 bg-gray-100 rounded border flex items-center px-3 text-gray-400 text-sm">Event Date(s)</div>
              <div className="h-12 bg-gray-100 rounded border flex items-center px-3 text-gray-400 text-sm">Event Location</div>
            </div>
          </div>

          {/* Budget Section (Keynote) or Workshop Details (Workshop) */}
          {activeMode === 'keynote' ? (
            <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-medium mb-2">
                <DollarSign className="w-4 h-4" />
                KEYNOTE SPEAKER SPECIFIC
              </div>
              <EditableText
                value={budgetSectionTitle}
                onChange={(v) => onContentChange('contact.keynote.budget_section_title', v)}
                as="h3"
                className="text-lg font-semibold text-gray-900"
                isModified={isModified('contact.keynote.budget_section_title', content, originalContent)}
                editorMode={editorMode}
              />
              <div className="h-12 bg-white rounded border opacity-70 flex items-center px-3 text-gray-400 text-sm">
                Select your budget range
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-800 text-xs font-medium mb-2">
                <Users className="w-4 h-4" />
                WORKSHOP SPECIFIC
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <EditableText
                    value={participantsSectionTitle}
                    onChange={(v) => onContentChange('contact.workshop.participants_title', v)}
                    as="label"
                    className="text-sm font-medium text-gray-900"
                    isModified={isModified('contact.workshop.participants_title', content, originalContent)}
                    editorMode={editorMode}
                  />
                  <div className="h-10 bg-white rounded border opacity-70 flex items-center px-3 text-gray-400 text-xs">
                    Select...
                  </div>
                </div>
                <div className="space-y-2">
                  <EditableText
                    value={skillLevelTitle}
                    onChange={(v) => onContentChange('contact.workshop.skill_level_title', v)}
                    as="label"
                    className="text-sm font-medium text-gray-900"
                    isModified={isModified('contact.workshop.skill_level_title', content, originalContent)}
                    editorMode={editorMode}
                  />
                  <div className="h-10 bg-white rounded border opacity-70 flex items-center px-3 text-gray-400 text-xs">
                    Select...
                  </div>
                </div>
                <div className="space-y-2">
                  <EditableText
                    value={formatTitle}
                    onChange={(v) => onContentChange('contact.workshop.format_title', v)}
                    as="label"
                    className="text-sm font-medium text-gray-900"
                    isModified={isModified('contact.workshop.format_title', content, originalContent)}
                    editorMode={editorMode}
                  />
                  <div className="h-10 bg-white rounded border opacity-70 flex items-center px-3 text-gray-400 text-xs">
                    Select...
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info Section */}
          <div className="space-y-4">
            <EditableText
              value={additionalSectionTitle}
              onChange={(v) => onContentChange('contact.form.additional_section_title', v)}
              as="h3"
              className="text-lg font-semibold text-gray-900"
              isModified={isModified('contact.form.additional_section_title', content, originalContent)}
              editorMode={editorMode}
            />
            <div className="h-24 bg-gray-100 rounded border opacity-50"></div>
          </div>

          {/* Newsletter Opt-in Preview */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border rounded bg-white"></div>
              <EditableText
                value={newsletterTitle}
                onChange={(v) => onContentChange('contact.newsletter.title', v)}
                className="font-medium text-gray-900"
                isModified={isModified('contact.newsletter.title', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
            <EditableText
              value={newsletterDescription}
              onChange={(v) => onContentChange('contact.newsletter.description', v)}
              as="p"
              className="text-sm text-gray-600 ml-6"
              multiline
              isModified={isModified('contact.newsletter.description', content, originalContent)}
              editorMode={editorMode}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <div className="bg-blue-600 text-white py-3 px-6 rounded-lg text-center">
              <EditableText
                value={submitButtonText}
                onChange={(v) => onContentChange('contact.buttons.submit', v)}
                className="font-medium text-white"
                isModified={isModified('contact.buttons.submit', content, originalContent)}
                editorMode={editorMode}
              />
            </div>
          </div>
        </div>

        {/* Need Help Card */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <EditableText
            value={needHelpTitle}
            onChange={(v) => onContentChange('contact.help.title', v)}
            as="h3"
            className="text-lg font-semibold text-gray-900 mb-4"
            isModified={isModified('contact.help.title', content, originalContent)}
            editorMode={editorMode}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <span className="text-gray-400 text-xl">📞</span>
              <div>
                <EditableText
                  value={callLabel}
                  onChange={(v) => onContentChange('contact.help.call_label', v)}
                  as="p"
                  className="font-medium text-gray-900"
                  isModified={isModified('contact.help.call_label', content, originalContent)}
                  editorMode={editorMode}
                />
                <EditableText
                  value={phone}
                  onChange={(v) => onContentChange('contact.help.phone', v)}
                  className="text-blue-600"
                  isModified={isModified('contact.help.phone', content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-gray-400 text-xl">✉️</span>
              <div>
                <EditableText
                  value={emailLabel}
                  onChange={(v) => onContentChange('contact.help.email_label', v)}
                  as="p"
                  className="font-medium text-gray-900"
                  isModified={isModified('contact.help.email_label', content, originalContent)}
                  editorMode={editorMode}
                />
                <EditableText
                  value={email}
                  onChange={(v) => onContentChange('contact.help.email', v)}
                  className="text-blue-600"
                  isModified={isModified('contact.help.email', content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Success Message Preview */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
          <div className="text-green-600 text-4xl">✓</div>
          <EditableText
            value={successTitle}
            onChange={(v) => onContentChange('contact.success.title', v)}
            as="h2"
            className="text-2xl font-bold text-gray-900"
            isModified={isModified('contact.success.title', content, originalContent)}
            editorMode={editorMode}
          />
          <EditableText
            value={successMessage}
            onChange={(v) => onContentChange('contact.success.message', v)}
            as="p"
            className="text-gray-600"
            multiline
            isModified={isModified('contact.success.message', content, originalContent)}
            editorMode={editorMode}
          />
        </div>

        <p className="text-center text-xs text-gray-400 italic">Form fields and dropdown options are handled dynamically - text labels and titles shown here are editable</p>
      </div>
    </div>
  )
}

// Footer Preview Component
function FooterPreview({
  content,
  originalContent,
  onContentChange,
  editorMode = true
}: Omit<PagePreviewProps, 'page'>) {
  // Company Info
  const logo = content['footer.company.logo'] || '/speak-about-ai-light-logo.png'
  const logoAlt = content['footer.company.logo_alt'] || 'Speak About AI'
  const companyDescription = content['footer.company.description'] || "The world's only AI-exclusive speaker bureau, connecting organizations around the world with the most sought-after artificial intelligence experts and thought leaders."
  const phone = content['footer.company.phone'] || '+1 (415) 665-2442'
  const email = content['footer.company.email'] || 'human@speakabout.ai'

  // Quick Links - defaults
  const defaultQuickLinks: FooterLink[] = [
    { text: 'All Speakers', url: '/speakers' },
    { text: 'Our Services', url: '/our-services' },
    { text: 'Our Team', url: '/our-team' },
    { text: 'Contact Us', url: '/contact' },
    { text: 'Blog', url: '/blog' }
  ]
  const quickLinksTitle = content['footer.quick-links.title'] || 'Quick Links'
  const quickLinksJson = content['footer.quick-links.links']
  let quickLinks: FooterLink[] = defaultQuickLinks
  if (quickLinksJson) {
    try {
      const parsed = JSON.parse(quickLinksJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        quickLinks = parsed
      }
    } catch {
      // Keep defaults on parse error
    }
  }

  // Industries - defaults
  const defaultIndustriesLinks: FooterLink[] = [
    { text: 'Healthcare AI', url: '/industries/healthcare-keynote-speakers' },
    { text: 'Technology & Enterprise', url: '/industries/technology-keynote-speakers' }
  ]
  const industriesTitle = content['footer.industries.title'] || 'Industries'
  const industriesLinksJson = content['footer.industries.links']
  let industriesLinks: FooterLink[] = defaultIndustriesLinks
  if (industriesLinksJson) {
    try {
      const parsed = JSON.parse(industriesLinksJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        industriesLinks = parsed
      }
    } catch {
      // Keep defaults on parse error
    }
  }

  // For Speakers - defaults
  const defaultForSpeakersLinks: FooterLink[] = [
    { text: 'Apply to Be a Speaker', url: '/apply' }
  ]
  const forSpeakersTitle = content['footer.for-speakers.title'] || 'For Speakers'
  const forSpeakersLinksJson = content['footer.for-speakers.links']
  let forSpeakersLinks: FooterLink[] = defaultForSpeakersLinks
  if (forSpeakersLinksJson) {
    try {
      const parsed = JSON.parse(forSpeakersLinksJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        forSpeakersLinks = parsed
      }
    } catch {
      // Keep defaults on parse error
    }
  }

  // Bottom
  const copyright = content['footer.bottom.copyright'] || '© 2026 Speak About AI. All rights reserved.'

  return (
    <div className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <EditableImage
                src={logo}
                alt={logoAlt}
                onChange={(newSrc) => onContentChange('footer.company.logo', newSrc)}
                onAltChange={(newAlt) => onContentChange('footer.company.logo_alt', newAlt)}
                isModified={isModified('footer.company.logo', content, originalContent)}
                editorMode={editorMode}
                className="h-12 w-auto"
                uploadFolder="footer"
              />
            </div>
            <EditableText
              value={companyDescription}
              onChange={(v) => onContentChange('footer.company.description', v)}
              as="p"
              className="text-gray-300 mb-6 max-w-md"
              multiline
              isModified={isModified('footer.company.description', content, originalContent)}
              editorMode={editorMode}
            />
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="w-4 h-4 mr-3 text-blue-500 mt-1">📞</span>
                <EditableText
                  value={phone}
                  onChange={(v) => onContentChange('footer.company.phone', v)}
                  className="text-gray-300 whitespace-pre-line"
                  isModified={isModified('footer.company.phone', content, originalContent)}
                  editorMode={editorMode}
                  multiline={true}
                />
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 mr-3 text-blue-500">✉️</span>
                <EditableText
                  value={email}
                  onChange={(v) => onContentChange('footer.company.email', v)}
                  className="text-gray-300"
                  isModified={isModified('footer.company.email', content, originalContent)}
                  editorMode={editorMode}
                />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <EditableText
              value={quickLinksTitle}
              onChange={(v) => onContentChange('footer.quick-links.title', v)}
              as="h3"
              className="text-lg font-semibold mb-4"
              isModified={isModified('footer.quick-links.title', content, originalContent)}
              editorMode={editorMode}
            />
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <span className="text-gray-300">{link.text}</span>
                  <span className="text-gray-500 text-xs ml-2">→ {link.url}</span>
                </li>
              ))}
            </ul>
            <FooterLinkListEditor
              links={quickLinks}
              onChange={(newLinks) => onContentChange('footer.quick-links.links', JSON.stringify(newLinks))}
              isModified={isModified('footer.quick-links.links', content, originalContent)}
              editorMode={editorMode}
              title="Edit Quick Links"
            />
          </div>

          {/* Industries */}
          <div>
            <EditableText
              value={industriesTitle}
              onChange={(v) => onContentChange('footer.industries.title', v)}
              as="h3"
              className="text-lg font-semibold mb-4"
              isModified={isModified('footer.industries.title', content, originalContent)}
              editorMode={editorMode}
            />
            <ul className="space-y-2">
              {industriesLinks.map((link, index) => (
                <li key={index}>
                  <span className="text-gray-300">{link.text}</span>
                  <span className="text-gray-500 text-xs ml-2">→ {link.url}</span>
                </li>
              ))}
            </ul>
            <FooterLinkListEditor
              links={industriesLinks}
              onChange={(newLinks) => onContentChange('footer.industries.links', JSON.stringify(newLinks))}
              isModified={isModified('footer.industries.links', content, originalContent)}
              editorMode={editorMode}
              title="Edit Industries Links"
            />
          </div>

          {/* For Speakers */}
          <div>
            <EditableText
              value={forSpeakersTitle}
              onChange={(v) => onContentChange('footer.for-speakers.title', v)}
              as="h3"
              className="text-lg font-semibold mb-4"
              isModified={isModified('footer.for-speakers.title', content, originalContent)}
              editorMode={editorMode}
            />
            <ul className="space-y-2">
              {forSpeakersLinks.map((link, index) => (
                <li key={index}>
                  <span className="text-gray-300">{link.text}</span>
                  <span className="text-gray-500 text-xs ml-2">→ {link.url}</span>
                </li>
              ))}
            </ul>
            <FooterLinkListEditor
              links={forSpeakersLinks}
              onChange={(newLinks) => onContentChange('footer.for-speakers.links', JSON.stringify(newLinks))}
              isModified={isModified('footer.for-speakers.links', content, originalContent)}
              editorMode={editorMode}
              title="Edit For Speakers Links"
            />
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <EditableText
              value={copyright}
              onChange={(v) => onContentChange('footer.bottom.copyright', v)}
              className="text-gray-300 text-sm mb-4 md:mb-0"
              isModified={isModified('footer.bottom.copyright', content, originalContent)}
              editorMode={editorMode}
            />
            <div className="flex items-center space-x-6">
              <span className="text-gray-300 text-sm">Privacy Policy</span>
              <span className="text-gray-300 text-sm">Terms of Service</span>
              <div className="flex space-x-4">
                <span className="text-gray-300">LinkedIn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Page Preview Component
export function PagePreview({ page, content, originalContent, onContentChange, editorMode = true }: PagePreviewProps) {
  if (page === 'home') {
    return (
      <div className="space-y-0">
        <HomeHeroPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <HomeClientLogosPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <HomeFeaturedSpeakersPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <HomeWhyChooseUsPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <HomeNavigateTheNoisePreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <HomeSEOContentPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <HomeFAQPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <HomeBookingCTAPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
      </div>
    )
  }

  if (page === 'services') {
    return (
      <div className="space-y-0">
        <ServicesHeroPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <ServicesOfferingsPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <ServicesProcessPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <ServicesEventsPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <ServicesFAQPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <ServicesContactPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
      </div>
    )
  }

  if (page === 'team') {
    return (
      <div className="space-y-0">
        <TeamHeroPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <TeamMembersPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
        <JoinTeamPreview
          content={content}
          originalContent={originalContent}
          onContentChange={onContentChange}
          editorMode={editorMode}
        />
      </div>
    )
  }

  if (page === 'speakers') {
    return (
      <SpeakersDirectoryPreview
        content={content}
        originalContent={originalContent}
        onContentChange={onContentChange}
        editorMode={editorMode}
      />
    )
  }

  if (page === 'workshops') {
    return (
      <WorkshopsDirectoryPreview
        content={content}
        originalContent={originalContent}
        onContentChange={onContentChange}
        editorMode={editorMode}
      />
    )
  }

  if (page === 'contact') {
    return (
      <ContactPreview
        content={content}
        originalContent={originalContent}
        onContentChange={onContentChange}
        editorMode={editorMode}
      />
    )
  }

  if (page === 'footer') {
    return (
      <FooterPreview
        content={content}
        originalContent={originalContent}
        onContentChange={onContentChange}
        editorMode={editorMode}
      />
    )
  }

  return null
}

export default PagePreview

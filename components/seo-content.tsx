import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getPageContent, getFromContent } from "@/lib/website-content"

// Default content
const defaultIndustries = [
  "Technology & Software Companies",
  "Healthcare & Pharmaceutical",
  "Financial Services & Banking",
  "Manufacturing & Automotive",
  "Retail & E-commerce",
  "Education & Research Institutions"
]

const defaultTopics = [
  "Generative AI & Large Language Models",
  "AI Strategy & Digital Transformation",
  "Machine Learning Applications",
  "AI Ethics & Responsible AI",
  "Future of Work with AI",
  "AI in Healthcare & Life Sciences"
]

export default async function SEOContent() {
  // Fetch content from database
  const content = await getPageContent('home')

  // Using keys that match the database (home.seo-content.*)
  const title = getFromContent(content, 'home', 'seo-content', 'main_heading') || 'AI Keynote Speakers: Transform Your Event with Leading AI Experts'
  const intro = getFromContent(content, 'home', 'seo-content', 'intro_paragraph') || 'Speak About AI is the premier <strong>AI keynote speakers bureau</strong>, representing over 70 of the world\'s most influential <strong>artificial intelligence speakers</strong>. Our roster includes pioneering AI researchers, Silicon Valley executives, Siri co-founders, Stanford AI professors, and Fortune 500 AI leaders who deliver engaging keynotes on artificial intelligence, machine learning, and generative AI.'

  const whyTitle = getFromContent(content, 'home', 'seo-content', 'why_heading') || 'Why Choose Our AI Speakers Bureau?'
  const whyContent = getFromContent(content, 'home', 'seo-content', 'why_paragraph') || 'As a speaker bureau focused exclusively on artificial intelligence, we provide unparalleled expertise in matching your event with the perfect <strong>AI keynote speaker</strong>. Whether you need a generative AI expert, machine learning pioneer, or AI ethics thought leader, our curated selection of AI speakers delivers transformative insights that resonate with your audience.'

  const industriesTitle = getFromContent(content, 'home', 'seo-content', 'industries_heading') || 'Industries We Serve'
  const industriesJson = getFromContent(content, 'home', 'seo-content', 'industries_list')
  let industries = defaultIndustries
  if (industriesJson) {
    try { industries = JSON.parse(industriesJson) } catch (e) {}
  }

  const topicsTitle = getFromContent(content, 'home', 'seo-content', 'topics_heading') || 'Popular AI Speaking Topics'
  const topicsJson = getFromContent(content, 'home', 'seo-content', 'topics_list')
  let topics = defaultTopics
  if (topicsJson) {
    try { topics = JSON.parse(topicsJson) } catch (e) {}
  }

  const bookTitle = getFromContent(content, 'home', 'seo-content', 'book_heading') || 'Book an AI Speaker for Your Next Event'
  const bookContent = getFromContent(content, 'home', 'seo-content', 'book_paragraph') || 'From keynote presentations at major conferences to executive briefings and workshop facilitation, our AI speakers bring cutting-edge insights and practical applications to every engagement. Each speaker is carefully vetted for their expertise, presentation skills, and ability to translate complex AI concepts into actionable business strategies.'

  const ctaText = getFromContent(content, 'home', 'seo-content', 'cta_button_text') || 'Book an AI Speaker Today'
  const ctaLink = '/contact?source=book_ai_speaker_seo_section'

  const closingContent = getFromContent(content, 'home', 'seo-content', 'closing_paragraph') || 'Our clients include provincial governments, international conferences, Fortune 500 companies, leading universities, and innovative startups. When you book an AI keynote speaker through Speak About AI, you\'re partnering with the trusted leader in AI thought leadership.'

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-black mb-6">
            {title}
          </h2>
          <p className="text-lg text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: intro }} />

          <h3 className="text-2xl font-semibold text-black mt-8 mb-4">
            {whyTitle}
          </h3>
          <p className="text-lg text-gray-700 mb-4">
            <span dangerouslySetInnerHTML={{ __html: whyContent }} /> Browse our{" "}
            <Link href="/speakers" className="text-[#1E68C6] hover:underline font-semibold">full roster of AI experts</Link>.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="text-xl font-semibold text-black mb-3">
                {industriesTitle}
              </h3>
              <ul className="space-y-2 text-gray-700">
                {industries.map((industry, index) => (
                  <li key={index}>• {industry}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-black mb-3">
                {topicsTitle}
              </h3>
              <ul className="space-y-2 text-gray-700">
                {topics.map((topic, index) => (
                  <li key={index}>• {topic}</li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className="text-2xl font-semibold text-black mt-8 mb-4">
            {bookTitle}
          </h3>
          <p className="text-lg text-gray-700 mb-4">
            {bookContent}
          </p>

          <div className="flex justify-center my-8">
            <Button
              asChild
              variant="gold"
              size="lg"
              className="font-montserrat font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Link href={ctaLink}>
                {ctaText}
              </Link>
            </Button>
          </div>

          <p className="text-lg text-gray-700 mb-4">
            {closingContent}
          </p>
        </div>
      </div>
    </section>
  )
}

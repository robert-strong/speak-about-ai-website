import { getPageContent, getFromContent } from "@/lib/website-content"

export default async function TeamHero() {
  // Fetch content from database
  const content = await getPageContent('team')

  const badge = getFromContent(content, 'team', 'hero', 'badge') || 'Our Story'
  const title = getFromContent(content, 'team', 'hero', 'title') || 'How It All Started'
  const paragraph1 = getFromContent(content, 'team', 'hero', 'story_paragraph1') || "Robert Strong has been booking himself and other talent for 30+ years, and has called Silicon Valley home for 20 of them. Over the decades, he built deep relationships with pioneers in the AI space—people like Daniel Kraft—and ended up living down the street from Peter Norvig in Palo Alto, where they'd walk their Taiwanese street dogs together."
  const paragraph2 = getFromContent(content, 'team', 'hero', 'story_paragraph2') || "After ChatGPT launched and his friends in the AI space started getting flooded with speaking requests, Robert decided to turn it into an agency. With his decades of experience in talent booking and deep roots in Silicon Valley's tech community, he was uniquely positioned to build something special."
  const paragraph3 = getFromContent(content, 'team', 'hero', 'story_paragraph3') || "Today, Speak About AI has booked speakers everywhere from Silicon Valley to Singapore—helping organizations around the world bring the brightest minds and best speakers in artificial intelligence to their stages."

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-24 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-[#1E68C6]/10 rounded-full text-[#1E68C6] text-sm font-montserrat font-medium">
              {badge}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 font-neue-haas">{title}</h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-lg text-gray-600 font-montserrat leading-relaxed">
            {paragraph1}
          </p>
          <p className="text-lg text-gray-600 font-montserrat leading-relaxed">
            {paragraph2}
          </p>
          <p className="text-lg text-gray-600 font-montserrat leading-relaxed">
            {paragraph3}
          </p>
        </div>
      </div>
    </section>
  )
}

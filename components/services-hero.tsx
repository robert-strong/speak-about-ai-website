import { getPageContent, getFromContent } from "@/lib/website-content"

export default async function ServicesHero() {
  // Fetch content from database with revalidation
  const content = await getPageContent('services')
  const badge = getFromContent(content, 'services', 'hero', 'badge')
  const title = getFromContent(content, 'services', 'hero', 'title')
  const subtitle = getFromContent(content, 'services', 'hero', 'subtitle')

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-24 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block mb-6">
          <span className="px-4 py-2 bg-[#1E68C6]/10 rounded-full text-[#1E68C6] text-sm font-montserrat font-medium">
            {badge || 'What We Offer'}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 font-neue-haas">
          {title || 'Our Services'}
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-montserrat">
          {subtitle || 'At Speak About AI, we connect you with world-class AI experts to amaze your attendees, educate your executives, and inspire innovation. Our comprehensive range of services ensures you can leverage AI insights in the format that best suits your needs.'}
        </p>
      </div>
    </section>
  )
}

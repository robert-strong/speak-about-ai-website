export function BlogHero() {
  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-16 md:py-24 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 text-center">
        <div className="inline-block mb-6">
          <span className="px-4 py-2 bg-[#1E68C6]/10 rounded-full text-[#1E68C6] text-sm font-montserrat font-medium">
            Resources
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">AI Insights & Expertise</h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Stay updated with the latest in AI, keynote speaking trends, and industry analysis from Speak About AI.
        </p>
      </div>
    </section>
  )
}

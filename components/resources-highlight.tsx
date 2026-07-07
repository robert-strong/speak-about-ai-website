import Link from "next/link"
import { ArrowRight, BookOpen, Sparkles } from "lucide-react"

export default function ResourcesHighlight() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-neue-haas">
            AI Speaker Insights & Resources
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat">
            Expert guidance to help you find the perfect AI keynote speaker for your event
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Article */}
          <div className="lg:col-span-2">
            <Link
              href="/resources/top-11-ai-keynote-speakers-shaping-tomorrows-business-landscape-today"
              className="group block bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-gray-200 hover:border-[#1E68C6] h-full"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E68C6]/10 text-[#1E68C6] text-sm font-semibold font-montserrat">
                  <Sparkles className="w-4 h-4" />
                  Featured Article
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 font-neue-haas group-hover:text-[#1E68C6] transition-colors">
                Top 11 AI Keynote Speakers Shaping Tomorrow&apos;s Business Landscape Today
              </h3>
              <p className="text-gray-600 font-montserrat mb-6 leading-relaxed">
                Discover the architects, strategists, and innovators delivering actionable AI guidance. From Siri co-founders to Stanford researchers, these speakers bring real-world expertise to help your organization navigate the AI revolution.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 font-montserrat mb-1">Speaker Categories</div>
                  <div className="font-semibold text-gray-900 font-montserrat">4 Expert Tracks</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 font-montserrat mb-1">Featured Speakers</div>
                  <div className="font-semibold text-gray-900 font-montserrat">11 Industry Leaders</div>
                </div>
              </div>
              <div className="flex items-center text-[#1E68C6] font-semibold font-montserrat group-hover:gap-3 gap-2 transition-all">
                Read the Full Guide
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Resources CTA */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-[#1E68C6] to-blue-700 p-8 rounded-2xl shadow-xl h-full flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 font-neue-haas">
                  Explore All Resources
                </h3>
                <p className="text-blue-100 font-montserrat mb-6 leading-relaxed">
                  Browse our full library of guides, articles, and insights to make informed decisions about AI speakers for your next event.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-white font-montserrat text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    Speaker selection guides
                  </li>
                  <li className="flex items-center gap-2 text-white font-montserrat text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    Industry trend reports
                  </li>
                  <li className="flex items-center gap-2 text-white font-montserrat text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    Event planning tips
                  </li>
                </ul>
              </div>
              <Link
                href="/resources"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1E68C6] px-6 py-3 rounded-xl font-semibold font-montserrat hover:bg-blue-50 transition-colors"
              >
                View All Resources
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

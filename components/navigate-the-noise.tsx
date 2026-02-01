import { DollarSign, Users, Globe2, Check } from "lucide-react"
import { getPageContent, getFromContent } from "@/lib/website-content"

// Default content structure
const defaultBudgetRanges = [
  { range: "$5k - $20k", description: "Rising AI experts, academics, and tech consultants" },
  { range: "$20k - $50k", description: "Industry leaders, published authors, and proven speakers" },
  { range: "$50k+", description: "AI pioneers, tech founders, and household names" },
]

const defaultAudienceTypes = [
  "Corporate & Enterprise",
  "Public Sector & Government",
  "Startups & Scale-ups",
  "Academic & Research",
  "Healthcare & Life Sciences",
  "Financial Services",
  "Technology Companies"
]

const defaultDeliveryOptions = [
  { title: "In-Person Events", description: "Worldwide coverage with speaker coordination and booking support" },
  { title: "Virtual Events", description: "Professional virtual keynotes optimized for online engagement" },
  { title: "Hybrid Format", description: "Seamless blend of in-person and remote engagement for maximum reach" },
]

export default async function NavigateTheNoise() {
  // Fetch content from database
  const content = await getPageContent('home')
  const title = getFromContent(content, 'home', 'navigate', 'section_title') || 'Navigate the AI Speaker Landscape'
  const subtitle = getFromContent(content, 'home', 'navigate', 'section_subtitle') || 'Clear guidance to help you make informed decisions faster'

  // Budget section
  const budgetTitle = getFromContent(content, 'home', 'navigate', 'budget_title') || 'Budget Guidance'
  const budgetNote = getFromContent(content, 'home', 'navigate', 'budget_note') || 'Final fees vary by format, location, and date. Contact us for precise quotes.'
  const budgetRangesJson = getFromContent(content, 'home', 'navigate', 'budget_ranges')
  let budgetRanges = defaultBudgetRanges
  if (budgetRangesJson) {
    try { budgetRanges = JSON.parse(budgetRangesJson) } catch (e) {}
  }

  // Audience section
  const audienceTitle = getFromContent(content, 'home', 'navigate', 'audience_title') || 'Audience Types'
  const audienceTypesJson = getFromContent(content, 'home', 'navigate', 'audience_types')
  let audienceTypes = defaultAudienceTypes
  if (audienceTypesJson) {
    try { audienceTypes = JSON.parse(audienceTypesJson) } catch (e) {}
  }

  // Delivery section
  const deliveryTitle = getFromContent(content, 'home', 'navigate', 'global_title') || 'Global Delivery'
  const deliveryOptionsJson = getFromContent(content, 'home', 'navigate', 'delivery_options')
  let deliveryOptions = defaultDeliveryOptions
  if (deliveryOptionsJson) {
    try { deliveryOptions = JSON.parse(deliveryOptionsJson) } catch (e) {}
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-neue-haas">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Budget Ranges */}
          <div className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-blue-200 hover:border-[#1E68C6]">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1E68C6] to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 font-neue-haas group-hover:text-[#1E68C6] transition-colors">{budgetTitle}</h3>
            </div>
            <div className="space-y-4">
              {budgetRanges.map((budget, index) => (
                <div key={index} className="border-l-4 border-blue-600 pl-4">
                  <div className="font-bold text-gray-900 font-montserrat mb-1">{budget.range}</div>
                  <div className="text-sm text-gray-600 font-montserrat">{budget.description}</div>
                </div>
              ))}
              <p className="text-xs text-gray-500 font-montserrat italic mt-4">
                {budgetNote}
              </p>
            </div>
          </div>

          {/* Audience Types */}
          <div className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-amber-200 hover:border-amber-500">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 font-neue-haas group-hover:text-amber-600 transition-colors">{audienceTitle}</h3>
            </div>
            <div className="space-y-3">
              {audienceTypes.map((audience, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-montserrat">{audience}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Delivery */}
          <div className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-green-200 hover:border-green-600">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Globe2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 font-neue-haas group-hover:text-green-600 transition-colors">{deliveryTitle}</h3>
            </div>
            <div className="space-y-4">
              {deliveryOptions.map((option, index) => (
                <div key={index}>
                  <h4 className="font-bold text-gray-900 font-montserrat mb-2 flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    {option.title}
                  </h4>
                  <p className="text-sm text-gray-600 font-montserrat ml-7">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

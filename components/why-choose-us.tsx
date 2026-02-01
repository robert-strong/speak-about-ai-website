import { Shield, Clock, Users, Headphones, Target, Globe } from "lucide-react"
import { getPageContent, getFromContent } from "@/lib/website-content"

interface Feature {
  icon: any
  title: string
  description: string
  highlights?: string[]
}

// Default features with icon mappings
const defaultFeatures: Feature[] = [
  {
    icon: Users,
    title: "Access to Exclusive AI Pioneers",
    description:
      "Direct connections to the architects of modern AI—Siri co-founders, former Shazam executives, and the researchers who literally authored the AI textbooks.",
    highlights: [
      "Innovators who built products used by billions",
      "Stanford & MIT faculty and researchers",
      "Former executives from OpenAI, Google, Meta, Amazon"
    ]
  },
  {
    icon: Shield,
    title: "24-Hour Response Guarantee",
    description:
      "Lightning-fast turnaround, guaranteed. From first inquiry to booking:",
    highlights: [
      "Initial response: within 24 hours of inquiry",
      "Custom recommendations matched to your event needs",
      "Speaker availability check: we reach out to speakers immediately",
      "Contract finalization: 3-5 business days after speaker confirmation",
      "Typical booking timeline: 1-2 weeks for most engagements"
    ]
  },
  {
    icon: Headphones,
    title: "White-Glove Speaker Coordination",
    description:
      "We ensure seamless execution from booking to showtime:",
    highlights: [
      "Pre-event briefings: coordinate speaker prep calls with your team",
      "Technical checks: arrange and facilitate tech rehearsals",
      "On-site support: we attend events in-person where possible",
      "Multi-engagement coordination: ensure speaker availability for additional sessions",
      "Direct liaison: single point of contact throughout the entire process"
    ]
  },
  {
    icon: Target,
    title: "We Help You Navigate The Noise",
    description:
      "Cut through the AI hype with our deep industry expertise and transparent guidance:",
    highlights: [
      "Budget ranges: $5K-$20K (emerging experts) to $20K+ (industry leaders)",
      "Audience types: executives, engineers, entrepreneurs, medical professionals, public sector, academic institutions",
      "Global delivery: worldwide coverage + virtual/hybrid capabilities",
      "Custom recommendations within 24 hours of inquiry",
      "Our speakers tailor AI talk depth to your audience"
    ]
  },
  {
    icon: Globe,
    title: "Proven Stage Presence",
    description:
      "Our speakers command every venue with authority and authenticity:",
    highlights: [
      "Delivery styles: visionary storytellers, pragmatic operators, data-led strategists",
      "Venue experience: intimate boardrooms to 10,000+ stadium keynotes",
      "Context-aware messaging aligned to your audience & objectives",
      "Due diligence on sensitive topics (ethics, bias, job displacement)",
      "We brief speakers thoroughly to ensure appropriate tone & depth"
    ]
  },
  {
    icon: Clock,
    title: "Actionable Industry Intelligence",
    description:
      "Tailored AI insights for your sector with concrete next steps:",
    highlights: [
      "Proven frameworks & ROI-focused implementation strategies",
      "Real-world case studies: documented metrics from Fortune 500 deployments",
      "Immediate action: tactical roadmaps your team can execute Monday morning",
      "Industry examples: productivity improvements, accelerated rollouts, cost optimization strategies",
      "Post-event resources: slides, recordings, follow-up Q&A sessions"
    ]
  },
]

// Icon mapping for database-stored features
const iconMap: { [key: string]: any } = {
  Users,
  Shield,
  Headphones,
  Target,
  Globe,
  Clock
}

export default async function WhyChooseUs() {
  // Fetch content from database
  const content = await getPageContent('home')
  const title = getFromContent(content, 'home', 'why-choose-us', 'section_title') || 'Why Work with Speak About AI?'
  const subtitle = getFromContent(content, 'home', 'why-choose-us', 'section_subtitle') || "We book artificial intelligence keynote speakers for your organization's event who don't just talk about the future—they're the innovators building the tech."

  // Try to get features from database, otherwise use defaults
  const featuresJson = getFromContent(content, 'home', 'why-choose-us', 'features')
  let features = defaultFeatures
  if (featuresJson) {
    try {
      const dbFeatures = JSON.parse(featuresJson)
      // Map icon strings back to components
      features = dbFeatures.map((f: any) => ({
        ...f,
        icon: iconMap[f.icon] || Users
      }))
    } catch (e) {
      // Use defaults if JSON parsing fails
    }
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-neue-haas">{title}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-gray-200 hover:border-[#1E68C6]"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E68C6] to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-neue-haas group-hover:text-[#1E68C6] transition-colors">{feature.title}</h3>
              </div>
              <p className="text-gray-700 leading-relaxed font-montserrat mb-6 font-medium">{feature.description}</p>
              {feature.highlights && feature.highlights.length > 0 && (
                <ul className="space-y-2.5">
                  {feature.highlights.map((highlight, idx) => {
                    // Bold text before colons (e.g., "Budget ranges:", "Audience types:")
                    const parts = highlight.split(':')
                    if (parts.length > 1) {
                      return (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600 font-montserrat">
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1E68C6] mt-2"></span>
                          <span className="leading-relaxed">
                            <strong className="font-bold text-gray-900">{parts[0]}:</strong>
                            {parts.slice(1).join(':')}
                          </span>
                        </li>
                      )
                    }
                    return (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600 font-montserrat">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1E68C6] mt-2"></span>
                        <span className="leading-relaxed">{highlight}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

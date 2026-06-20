import type { Metadata } from "next"
import Link from "next/link"
import { getSpeakersForIndustryPage } from "@/lib/speakers-data"
import { SpeakerCard } from "@/components/speaker-card"
import { Button } from "@/components/ui/button"
import { Factory, Gauge, Layers, Eye, Bot, Truck } from "lucide-react"

const PAGE_URL = "https://speakabout.ai/industries/manufacturing-ai-speakers"

export const metadata: Metadata = {
  title: "Manufacturing AI Speakers | Industry 4.0 Keynote Experts",
  description:
    "Book manufacturing AI keynote speakers for industrial events. Experts in smart factories, Industry 4.0, predictive maintenance, robotics, and automation.",
  keywords:
    "manufacturing AI speakers, Industry 4.0 speakers, smart manufacturing experts, industrial automation speakers, predictive maintenance keynote, digital twin speakers",
  openGraph: {
    title: "Manufacturing AI Keynote Speakers | Speak About AI",
    description:
      "Book manufacturing AI keynote speakers for industrial events. Experts in smart factories, Industry 4.0, predictive maintenance, robotics, and automation.",
    type: "website",
    url: PAGE_URL,
  },
  alternates: { canonical: PAGE_URL },
}

const TOPICS = [
  {
    icon: <Factory className="w-8 h-8 text-[#1E68C6]" />,
    title: "Industry 4.0 & Smart Factories",
    description:
      "How connected machines, IoT sensors, and AI turn the factory floor into a self-optimizing operation.",
  },
  {
    icon: <Gauge className="w-8 h-8 text-[#1E68C6]" />,
    title: "Predictive Maintenance",
    description:
      "Machine learning that predicts equipment failure before it happens, cutting downtime and maintenance costs.",
  },
  {
    icon: <Layers className="w-8 h-8 text-[#1E68C6]" />,
    title: "Digital Twins & Simulation",
    description:
      "Virtual replicas of products and processes used to simulate, test, and optimize before committing to production.",
  },
  {
    icon: <Eye className="w-8 h-8 text-[#1E68C6]" />,
    title: "Computer Vision Quality Control",
    description:
      "AI-powered visual inspection that catches defects faster and more reliably than manual checks.",
  },
  {
    icon: <Bot className="w-8 h-8 text-[#1E68C6]" />,
    title: "Robotics & Automation",
    description:
      "Collaborative robots and intelligent automation reshaping how products are built and handled.",
  },
  {
    icon: <Truck className="w-8 h-8 text-[#1E68C6]" />,
    title: "Supply Chain Optimization",
    description:
      "AI-driven demand forecasting, inventory optimization, and resilient, responsive supply networks.",
  },
]

export default async function ManufacturingAISpeakersPage() {
  const speakers = await getSpeakersForIndustryPage("industrial")

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://speakabout.ai" },
          { "@type": "ListItem", position: 2, name: "Industries", item: "https://speakabout.ai/speakers" },
          { "@type": "ListItem", position: 3, name: "Manufacturing AI Speakers", item: PAGE_URL },
        ],
      },
      {
        "@type": "CollectionPage",
        name: "Manufacturing AI Keynote Speakers",
        url: PAGE_URL,
        description:
          "AI keynote speakers for the manufacturing industry — experts in Industry 4.0, smart factories, predictive maintenance, robotics, and automation.",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: speakers.length,
          itemListElement: speakers.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://speakabout.ai/speakers/${s.slug}`,
            name: s.name,
          })),
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Manufacturing AI
            <span className="block text-[#1E68C6]">Keynote Speakers</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Book world-class AI keynote speakers for manufacturing and industrial events — experts in Industry 4.0,
            smart factories, predictive maintenance, robotics, and supply chain intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#1E68C6] hover:bg-[#1557A5] text-white px-8 py-4 text-lg">
              <Link href="/contact?source=manufacturing_hero">Book a Manufacturing AI Speaker</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-[#1E68C6] text-[#1E68C6] hover:bg-[#1E68C6] hover:text-white px-8 py-4 text-lg bg-transparent"
            >
              <Link href="/speakers">Browse All Speakers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Speakers */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Featured AI Speakers for Manufacturing Events</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI experts help manufacturers modernize operations, adopt automation, and build the smart,
              resilient factory of the future. Each can tailor a keynote to your audience.
            </p>
          </div>

          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.slug}
                  speaker={speaker}
                  contactSource="manufacturing_industry_page"
                  maxTopicsToShow={3}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-6">
                We're curating manufacturing AI speakers for your event.
              </p>
              <Button asChild className="bg-[#1E68C6] hover:bg-[#1557A5] text-white">
                <Link href="/contact?source=manufacturing_no_speakers">Request Manufacturing AI Speakers</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Topics */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Manufacturing AI Keynote Topics</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From the connected factory floor to AI-driven supply chains, our speakers cover the technologies
              powering modern manufacturing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TOPICS.map((topic, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  {topic.icon}
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">{topic.title}</h3>
                </div>
                <p className="text-gray-600">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why book */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
            Why Book an AI Speaker for Your Manufacturing Event?
          </h2>
          <div className="space-y-5 text-lg text-gray-600 leading-relaxed">
            <p>
              Manufacturing is being rewritten by data. Sensors on every machine, computer vision on every line, and
              AI models that predict failures, optimize throughput, and design better products are turning the
              traditional factory into a smart, connected operation.
            </p>
            <p>
              The right AI keynote speaker helps your audience separate practical wins from buzzwords — showing where
              Industry 4.0 delivers real ROI today and how to build the workforce and infrastructure for what's next.
              Our speakers have deployed AI and automation at scale and translate it into clear guidance for plant
              managers, engineers, and executives.
            </p>
            <p>
              Whether you're running an industrial trade show, a Lean/Six Sigma conference, an OEM summit, or an
              internal transformation event, we'll match you with a speaker who makes AI concrete for your
              manufacturing audience.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-[#1E68C6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Build the Factory of the Future</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Book a manufacturing AI keynote speaker who can help your team adopt Industry 4.0, automation, and
            data-driven operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-[#1E68C6] hover:bg-gray-100 px-8 py-4 text-lg">
              <Link href="/contact?source=manufacturing_cta">Get Speaker Recommendations</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-[#1E68C6] px-8 py-4 text-lg bg-transparent"
            >
              <Link href="/speakers">Browse All Speakers</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

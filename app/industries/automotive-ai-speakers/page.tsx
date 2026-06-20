import type { Metadata } from "next"
import Link from "next/link"
import { getSpeakersForIndustryPage } from "@/lib/speakers-data"
import { SpeakerCard } from "@/components/speaker-card"
import { Button } from "@/components/ui/button"
import { Car, Factory, Gauge, Wifi, BatteryCharging, Cpu } from "lucide-react"

const PAGE_URL = "https://speakabout.ai/industries/automotive-ai-speakers"

export const metadata: Metadata = {
  title: "Automotive AI Speakers | Auto Industry Keynote Experts",
  description:
    "Book automotive AI keynote speakers for auto industry events. Experts in autonomous vehicles, connected cars, EV technology, and smart manufacturing.",
  keywords:
    "automotive AI speakers, auto industry keynote speakers, autonomous vehicle speakers, connected car experts, EV keynote speakers, automotive technology experts",
  openGraph: {
    title: "Automotive AI Keynote Speakers | Speak About AI",
    description:
      "Book automotive AI keynote speakers for auto industry events. Experts in autonomous vehicles, connected cars, EV technology, and smart manufacturing.",
    type: "website",
    url: PAGE_URL,
  },
  alternates: { canonical: PAGE_URL },
}

const TOPICS = [
  {
    icon: <Car className="w-8 h-8 text-[#1E68C6]" />,
    title: "Autonomous & Self-Driving Systems",
    description:
      "How AI perception, sensor fusion, and decision-making are advancing self-driving vehicles and ADAS toward full autonomy.",
  },
  {
    icon: <Cpu className="w-8 h-8 text-[#1E68C6]" />,
    title: "AI & Computer Vision (ADAS)",
    description:
      "Deep learning and computer vision powering driver-assistance, object detection, and in-cabin safety systems.",
  },
  {
    icon: <Wifi className="w-8 h-8 text-[#1E68C6]" />,
    title: "Connected Vehicles & IoT",
    description:
      "Data from connected cars enabling over-the-air updates, fleet intelligence, and new mobility services.",
  },
  {
    icon: <BatteryCharging className="w-8 h-8 text-[#1E68C6]" />,
    title: "EV & Battery Optimization",
    description:
      "Using AI to optimize battery management, range, charging networks, and the electrification roadmap.",
  },
  {
    icon: <Factory className="w-8 h-8 text-[#1E68C6]" />,
    title: "Smart Manufacturing & Robotics",
    description:
      "AI-driven automation, robotics, and digital twins transforming automotive production lines.",
  },
  {
    icon: <Gauge className="w-8 h-8 text-[#1E68C6]" />,
    title: "Predictive Maintenance",
    description:
      "Machine learning that anticipates component failures, reduces downtime, and improves vehicle reliability.",
  },
]

export default async function AutomotiveAISpeakersPage() {
  const speakers = await getSpeakersForIndustryPage("industrial")

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://speakabout.ai" },
          { "@type": "ListItem", position: 2, name: "Industries", item: "https://speakabout.ai/speakers" },
          { "@type": "ListItem", position: 3, name: "Automotive AI Speakers", item: PAGE_URL },
        ],
      },
      {
        "@type": "CollectionPage",
        name: "Automotive AI Keynote Speakers",
        url: PAGE_URL,
        description:
          "AI keynote speakers for the automotive industry — experts in autonomous vehicles, connected cars, EVs, and smart manufacturing.",
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
            Automotive AI
            <span className="block text-[#1E68C6]">Keynote Speakers</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Book world-class AI keynote speakers for automotive conferences and events — experts in autonomous
            driving, connected vehicles, EV technology, and AI-powered smart manufacturing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#1E68C6] hover:bg-[#1557A5] text-white px-8 py-4 text-lg">
              <Link href="/contact?source=automotive_hero">Book an Automotive AI Speaker</Link>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Featured AI Speakers for Automotive Events</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI experts help automotive leaders navigate autonomy, electrification, and the software-defined
              vehicle. Each can tailor a keynote to your audience and event.
            </p>
          </div>

          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.slug}
                  speaker={speaker}
                  contactSource="automotive_industry_page"
                  maxTopicsToShow={3}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-6">
                We're curating automotive AI speakers for your event.
              </p>
              <Button asChild className="bg-[#1E68C6] hover:bg-[#1557A5] text-white">
                <Link href="/contact?source=automotive_no_speakers">Request Automotive AI Speakers</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Topics */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Automotive AI Keynote Topics</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From self-driving systems to the AI-powered factory floor, our speakers cover the technologies
              reshaping the automotive industry.
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
            Why Book an AI Speaker for Your Automotive Event?
          </h2>
          <div className="space-y-5 text-lg text-gray-600 leading-relaxed">
            <p>
              The automotive industry is in the middle of its biggest transformation in a century. Artificial
              intelligence sits at the center of it — powering autonomous driving, electrifying powertrains,
              connecting vehicles to the cloud, and turning the factory floor into a data-driven operation.
            </p>
            <p>
              A great AI keynote speaker helps your audience cut through the hype and understand what's real today,
              what's coming next, and how to compete in an era where the car is becoming a software platform on
              wheels. Our speakers have built and deployed AI at leading technology and research organizations, and
              translate deep expertise into clear, actionable insight for executives, engineers, and dealers alike.
            </p>
            <p>
              Whether you're hosting an OEM summit, a supplier conference, a mobility expo, or an internal innovation
              day, we'll match you with a speaker who can make AI tangible for your automotive audience.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-[#1E68C6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Drive Your Event Forward with AI</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Book an automotive AI keynote speaker who can help your audience navigate autonomy, electrification, and
            the software-defined vehicle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-[#1E68C6] hover:bg-gray-100 px-8 py-4 text-lg">
              <Link href="/contact?source=automotive_cta">Get Speaker Recommendations</Link>
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

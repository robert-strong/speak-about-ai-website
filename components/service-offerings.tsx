import Image from "next/image"
import { getPageContent, getFromContent } from "@/lib/website-content"

// Service offering type
interface ServiceOffering {
  id: string
  image: string
  title: string
  description: string
}

// Default service data structure
const defaultServices: ServiceOffering[] = [
  {
    id: "offering1",
    image: "/services/adam-cheyer-stadium.jpg",
    title: "Keynote Speeches",
    description: "Inspire your audience with engaging and informative keynote speeches on the future of technology.",
  },
  {
    id: "offering2",
    image: "/services/sharon-zhou-panel.jpg",
    title: "Panel Discussions",
    description: "Facilitate insightful and dynamic panel discussions on industry trends and challenges.",
  },
  {
    id: "offering3",
    image: "/services/allie-k-miller-fireside.jpg",
    title: "Fireside Chats",
    description: "Create intimate and engaging conversations with industry leaders in a fireside chat format.",
  },
  {
    id: "offering4",
    image: "/services/tatyana-mamut-speaking.jpg",
    title: "Workshops",
    description: "Provide hands-on learning experiences with interactive workshops tailored to your audience's needs.",
  },
  {
    id: "offering5",
    image: "/services/sharon-zhou-headshot.png",
    title: "Virtual Presentations",
    description: "Reach a global audience with engaging and professional virtual presentations.",
  },
  {
    id: "offering6",
    image: "/services/simon-pierro-youtube.jpg",
    title: "Custom Video Content",
    description: "Create compelling video content for marketing, training, and internal communications.",
  },
]

export default async function ServiceOfferings() {
  // Fetch content from database
  const content = await getPageContent('services')

  // Try to get offerings from JSON list, fall back to defaults
  const offeringsJson = getFromContent(content, 'services', 'offerings', 'list')
  let services: ServiceOffering[] = defaultServices

  if (offeringsJson) {
    try {
      services = JSON.parse(offeringsJson)
    } catch (e) {
      // Use defaults if JSON parsing fails
    }
  }

  return (
    <section className="bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="relative w-full aspect-square sm:aspect-[4/5] md:aspect-[3/4] bg-gray-200">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 font-neue-haas">{service.title}</h2>
                <p className="text-gray-700 font-montserrat">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

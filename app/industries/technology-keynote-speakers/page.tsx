import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import TechnologyAISpeakersClientPage from "../technology-ai-keynote-speakers/TechnologyAISpeakersClientPage"
import Script from "next/script"

export const metadata: Metadata = {
  title: "Technology Keynote Speakers | AI & Tech Experts",
  description:
    "Book leading technology keynote speakers and AI experts for your 2025 tech conference. Silicon Valley executives, AI pioneers, and digital transformation leaders.",
  keywords:
    "technology keynote speakers, tech keynote speaker, AI keynote speaker, technology conference speakers, silicon valley speakers, enterprise technology speakers, digital transformation speakers, artificial intelligence experts, tech summit speakers, innovation keynote speakers",
  openGraph: {
    title: "Technology Keynote Speakers | AI & Tech Experts",
    description:
      "Book world-class technology keynote speakers. AI pioneers, Silicon Valley executives, and digital transformation experts for your tech event.",
    type: "website",
    url: "https://speakabout.ai/industries/technology-keynote-speakers",
  },
  alternates: {
    canonical: "https://speakabout.ai/industries/technology-keynote-speakers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

// Schema markup for the page
const pageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Technology Keynote Speakers",
  description: "Leading technology and AI keynote speakers for conferences and corporate events",
  url: "https://www.speakabout.ai/industries/technology-keynote-speakers",
  isPartOf: {
    "@type": "WebSite",
    name: "Speak About AI",
    url: "https://www.speakabout.ai"
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@id": "https://www.speakabout.ai",
          name: "Home"
        }
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@id": "https://www.speakabout.ai/industries",
          name: "Industries"
        }
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@id": "https://www.speakabout.ai/industries/technology-keynote-speakers",
          name: "Technology Keynote Speakers"
        }
      }
    ]
  }
}

export default async function TechnologyKeynoteSpeakersPage() {
  const speakers = await getSpeakersByIndustry("Technology")

  return (
    <>
      <Script
        id="page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageSchema),
        }}
      />
      
      {/* SEO-Rich Content Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-6">
            Technology Keynote Speakers for Your 2025 Event
          </h1>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-gray-700 mb-6">
              Book world-renowned technology keynote speakers who are shaping the future of AI, 
              digital transformation, and enterprise innovation. Our exclusive roster features 
              Silicon Valley executives, AI pioneers, cybersecurity experts, and technology 
              visionaries who deliver compelling insights for tech conferences, corporate summits, 
              and innovation forums.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 my-8">
              <div>
                <h2 className="text-2xl font-semibold text-black mb-4">
                  Technology Speaking Topics
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li>• Artificial Intelligence & Machine Learning</li>
                  <li>• Digital Transformation Strategies</li>
                  <li>• Cloud Computing & Infrastructure</li>
                  <li>• Cybersecurity & Data Privacy</li>
                  <li>• Emerging Technologies & Innovation</li>
                  <li>• Software Development & DevOps</li>
                  <li>• Blockchain & Distributed Systems</li>
                  <li>• Quantum Computing</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold text-black mb-4">
                  Perfect for These Events
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li>• Technology Conferences & Summits</li>
                  <li>• Developer Conferences</li>
                  <li>• CIO/CTO Leadership Forums</li>
                  <li>• Digital Transformation Workshops</li>
                  <li>• Innovation & R&D Events</li>
                  <li>• Startup & Entrepreneurship Events</li>
                  <li>• Corporate Tech Strategy Sessions</li>
                  <li>• University Tech Symposiums</li>
                </ul>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-black mt-8 mb-4">
              Why Book Technology Keynote Speakers Through Speak About AI?
            </h2>
            
            <p className="text-gray-700 mb-4">
              As the premier AI-exclusive speaker bureau, we specialize in connecting organizations 
              with technology thought leaders who understand the intersection of artificial intelligence, 
              enterprise technology, and business transformation. Our technology keynote speakers include:
            </p>
            
            <ul className="space-y-3 text-gray-700 mb-6">
              <li>
                <strong>Silicon Valley Executives:</strong> Current and former leaders from Google, 
                Microsoft, Amazon, Apple, and other tech giants who share insider perspectives on 
                technology trends and innovation strategies.
              </li>
              <li>
                <strong>AI Research Pioneers:</strong> Stanford professors, MIT researchers, and 
                leading academics who are advancing the frontiers of artificial intelligence and 
                machine learning.
              </li>
              <li>
                <strong>Startup Founders & Innovators:</strong> Successful entrepreneurs who have 
                built breakthrough technology companies and can inspire innovation in your organization.
              </li>
              <li>
                <strong>Industry Analysts & Futurists:</strong> Technology experts who provide 
                strategic insights on emerging trends, market dynamics, and the future of technology.
              </li>
            </ul>
            
            <div className="bg-blue-50 p-6 rounded-lg my-8">
              <h3 className="text-xl font-semibold text-black mb-3">
                Featured Technology Topics for 2025
              </h3>
              <p className="text-gray-700 mb-4">
                Stay ahead of the curve with keynote presentations on the most relevant technology 
                trends shaping business and society:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-black mb-2">Generative AI & LLMs</h4>
                  <p className="text-sm text-gray-600">
                    Understanding ChatGPT, Claude, and the generative AI revolution in enterprise
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-2">AI Governance & Ethics</h4>
                  <p className="text-sm text-gray-600">
                    Building responsible AI systems and navigating regulatory landscapes
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-2">Edge Computing & IoT</h4>
                  <p className="text-sm text-gray-600">
                    Distributed intelligence and the future of connected devices
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-2">Quantum & Next-Gen Computing</h4>
                  <p className="text-sm text-gray-600">
                    Preparing for the quantum advantage and computational breakthroughs
                  </p>
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-black mt-8 mb-4">
              Book Your Technology Keynote Speaker Today
            </h2>
            
            <p className="text-gray-700 mb-4">
              Whether you're hosting a major technology conference, planning a corporate innovation 
              summit, or organizing a developer event, our technology keynote speakers deliver 
              transformative insights that inspire action. With expertise spanning artificial 
              intelligence, cloud computing, cybersecurity, and emerging technologies, our speakers 
              help your audience understand and leverage technology for competitive advantage.
            </p>
            
            <p className="text-gray-700 mb-8">
              Browse our curated selection of technology keynote speakers below, or contact our 
              team for personalized recommendations based on your event objectives, audience, and 
              budget. Let us help you find the perfect technology expert to make your next event 
              unforgettable.
            </p>
          </div>
        </div>
      </section>
      
      {/* Speaker Grid Component */}
      <TechnologyAISpeakersClientPage speakers={speakers} />
    </>
  )
}

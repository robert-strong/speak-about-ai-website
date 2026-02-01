import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import ClientCaseStudies from "@/components/client-case-studies"

export const metadata: Metadata = {
  title: "Case Studies | Speak About AI",
  description:
    "Discover the global brands and organizations that trust Speak About AI for their most important events. From Fortune 500 companies to leading universities and government agencies.",
  keywords:
    "AI speaking bureau clients, corporate event partners, technology conference partners, enterprise AI events, Fortune 500 AI speakers",
  openGraph: {
    title: "Case Studies | Speak About AI",
    description:
      "Trusted by industry leaders worldwide including Google, Amazon, Stanford University, and more.",
    images: [
      {
        url: "/hero-image.jpg",
        width: 1200,
        height: 630,
        alt: "Speak About AI Case Studies",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: "https://speakabout.ai/case-studies",
  },
}

export default function CaseStudiesPage() {
  const partners = [
    {
      name: "Stanford University",
      src: "/logos/stanford-university-logo-1024x335-1.png",
      alt: "Stanford University logo",
      category: "Education",
      description: "Leading research university and innovation hub",
    },
    {
      name: "Google",
      src: "/logos/Google_2015_logo.svg.png",
      alt: "Google logo",
      category: "Technology",
      description: "Global technology leader",
    },
    {
      name: "Amazon",
      src: "/logos/Amazon-Logo-2000.png",
      alt: "Amazon logo",
      category: "E-commerce & Cloud",
      description: "E-commerce and cloud computing pioneer",
    },
    {
      name: "Visa",
      src: "/logos/Visa_Inc._logo.svg",
      alt: "Visa Inc. logo",
      category: "Financial Services",
      description: "Global payments technology company",
    },
    {
      name: "Rio Innovation Week",
      src: "/logos/rio-innovation-week-new.png",
      alt: "Rio Innovation Week - Leading innovation conference in Brazil",
      category: "Events & Conferences",
      description: "Leading innovation conference in Brazil",
    },
    {
      name: "NICE",
      src: "/logos/nice-logo.png",
      alt: "NICE - Cloud platform for customer experience and financial crime solutions",
      category: "Enterprise Software",
      description: "Cloud platform for customer experience solutions",
    },
    {
      name: "ST Engineering",
      src: "/logos/st-engineering-logo.png",
      alt: "ST Engineering - Global technology, defense and engineering group",
      category: "Defense & Engineering",
      description: "Global technology and engineering leader",
    },
    {
      name: "Juniper Networks",
      src: "/logos/juniper-networks-logo.svg",
      alt: "Juniper Networks - AI-driven enterprise networking solutions",
      category: "Networking",
      description: "AI-driven enterprise networking solutions",
    },
    {
      name: "KPMG",
      src: "/logos/KPMG_logo.svg.png",
      alt: "KPMG logo",
      category: "Professional Services",
      description: "Global professional services network",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center text-[#1E68C6] hover:text-blue-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 font-neue-haas">
            From <span className="text-[#1E68C6]">Singapore to Silicon Valley</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl font-montserrat">
            Our speakers have delivered keynotes at customer conferences, innovation forums, and executive briefings for technology leaders, financial institutions, and research universities across four continents.
          </p>
        </div>
      </section>

      {/* Client Case Studies */}
      <ClientCaseStudies />

      {/* Partners Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-neue-haas">
              Other Partners & Clients
            </h2>
            <p className="text-lg text-gray-600 font-montserrat">
              A selection of organizations our speakers have had the privilege to work with
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-[#1E68C6] transition-all duration-300 group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-full h-32 mb-6 flex items-center justify-center">
                    <Image
                      src={partner.src || "/placeholder.svg"}
                      alt={partner.alt}
                      width={300}
                      height={120}
                      className="w-auto h-full max-h-32 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-neue-haas">{partner.name}</h3>
                  <div className="inline-block px-3 py-1 bg-blue-100 text-[#1E68C6] text-xs font-semibold rounded-full mb-3">
                    {partner.category}
                  </div>
                  <p className="text-sm text-gray-600 font-montserrat">{partner.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#1E68C6] to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-neue-haas">
            Ready to Join These Industry Leaders?
          </h2>
          <p className="text-xl text-blue-100 mb-8 font-montserrat">
            Let's discuss how our AI speakers can deliver exceptional value for your next event
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="gold"
              size="lg"
              className="font-montserrat font-bold text-lg"
            >
              <Link href="/contact">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white text-[#1E68C6] hover:bg-gray-100 font-montserrat font-bold text-lg"
            >
              <Link href="/speakers">Browse Speakers</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

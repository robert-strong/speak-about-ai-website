import { Brain, BookOpen, Rocket } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function FounderNextGen() {
  const resources = [
    {
      icon: Brain,
      title: "Free AI GPTs for Events",
      description: "5 custom AI tools to help you plan better events, write better copy, and save time",
      link: "/blog",
      status: "Get Access",
    },
    {
      icon: BookOpen,
      title: "Event Planning Resources",
      description: "Guides, templates, and best practices for booking speakers and running successful events",
      link: "/blog",
      status: "Explore",
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-amber-100 text-gray-900 rounded-full text-sm font-medium mb-6 font-montserrat">
            <Rocket className="w-4 h-4 mr-2" />
            Resources for Event Professionals
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 font-neue-haas">
            Free Tools & Community for Event Planners
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat">
            We're building more than a speaker bureau—we're creating a community and toolkit to help event
            professionals thrive in this age of AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {resources.map((resource, index) => (
            <Link
              key={index}
              href={resource.link}
              className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-200 hover:shadow-2xl hover:border-[#1E68C6] hover:-translate-y-1 transition-all duration-300 group block"
            >
              <div className="flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E68C6] to-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                  <resource.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-neue-haas group-hover:text-[#1E68C6] transition-colors">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-6 flex-grow font-montserrat leading-relaxed">{resource.description}</p>
                <div className="mt-auto">
                  <Button
                    variant="gold"
                    size="lg"
                    className="font-montserrat font-bold shadow-xl hover:shadow-2xl transition-all duration-300 pointer-events-none w-full"
                  >
                    {resource.status} →
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

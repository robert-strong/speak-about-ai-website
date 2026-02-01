import { Sparkles, Award, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ExclusiveAccess() {
  const pioneers = [
    {
      icon: Award,
      title: "Siri Co-Founders",
      description: "The visionaries who created one of the world's first mainstream AI assistants",
    },
    {
      icon: Sparkles,
      title: "AI Textbook Authors",
      description: "Researchers who literally wrote the books used to teach AI at Stanford and MIT",
    },
    {
      icon: TrendingUp,
      title: "Billion-User Products",
      description: "Innovators who built AI technology now used by billions globally",
    },
  ]

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Very subtle dot pattern background */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, #1E68C6 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-[#1E68C6] bg-opacity-10 text-[#1E68C6] rounded-full text-sm font-medium mb-6 font-montserrat">
            <Sparkles className="w-4 h-4 mr-2" />
            Our Competitive Edge
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 font-neue-haas">
            Direct Access to AI's Architects
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-montserrat leading-relaxed">
            We represent the pioneers who built the AI technology shaping our world—exclusive connections you won't find
            anywhere else
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pioneers.map((pioneer, index) => (
            <div
              key={index}
              className="group bg-white p-8 rounded-xl border-2 border-gray-200 hover:border-[#1E68C6] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#1E68C6] transition-all duration-300">
                  <pioneer.icon className="w-8 h-8 text-[#1E68C6] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 font-neue-haas">{pioneer.title}</h3>
                <p className="text-gray-600 font-montserrat leading-relaxed">{pioneer.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            asChild
            variant="gold"
            size="lg"
            className="font-montserrat font-bold text-lg shadow-xl hover:shadow-2xl"
          >
            <Link href="/speakers">Explore Our Elite Roster</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

import { Users, Star, Heart, Lightbulb, Target, Zap } from "lucide-react"

export default function TeamValues() {
  const values = [
    {
      icon: Users,
      title: "Speaker & Client First Approach",
      description:
        "We prioritize both our speakers' needs and our clients' event goals, ensuring perfect alignment that creates exceptional value for all parties involved.",
    },
    {
      icon: Star,
      title: "AI Expertise",
      description:
        "Our team stays at the cutting edge of AI developments and actively uses AI in many of our own workflows, allowing us to provide informed guidance to both speakers and clients.",
    },
    {
      icon: Heart,
      title: "Passion for Events",
      description:
        "We believe in the power of live events to inspire, educate, and connect people around artificial intelligence.",
    },
    {
      icon: Lightbulb,
      title: "Thought Leadership",
      description:
        "We're committed to elevating AI discourse by connecting the brightest minds with the most influential stages.",
    },
    {
      icon: Target,
      title: "Perfect Matches",
      description:
        "We take pride in creating ideal speaker-event matches that exceed expectations for all parties involved.",
    },
    {
      icon: Zap,
      title: "Responsive Service",
      description:
        "Our 24-hour response time and dedicated account management ensure seamless experiences for speakers and clients alike.",
    },
  ]

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#1E68C6]/10 rounded-full text-[#1E68C6] text-sm font-montserrat font-medium mb-4">
            What Drives Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-neue-haas">Our Values</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto font-montserrat">
            The principles that guide our work and define our culture
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <div
              key={index}
              className="group bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 hover:border-[#1E68C6]/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E68C6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#1E68C6] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-neue-haas pt-2 group-hover:text-[#1E68C6] transition-colors duration-300">
                    {value.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed font-montserrat text-sm">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

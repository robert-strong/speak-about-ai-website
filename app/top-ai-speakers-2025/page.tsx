import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Top AI Speakers 2025 | Best AI Keynote Speakers", // 50 chars
  description:
    "Discover 2025's top AI keynote speakers. Book leading artificial intelligence experts, from Siri co-founders to Google execs, for your event.",
  keywords:
    "top AI speakers 2025, best AI keynote speakers, artificial intelligence speakers 2025, AI conference speakers, machine learning speakers",
}

export default function TopAISpeakers2025() {
  const topSpeakers = [
    {
      name: "Peter Norvig",
      title: "Former Head of Computational Science at NASA and Director of Research at Google",
      image: "/placeholder.svg?height=300&width=300",
      bio: "Distinguished computer scientist with profound contributions to AI and education.",
      fee: "$25-$50k",
      badge: "NASA & Google",
      slug: "peter-norvig",
    },
    {
      name: "Adam Cheyer",
      title: "Co-Founder of Siri",
      image: "/placeholder.svg?height=300&width=300",
      bio: "Pioneer in conversational AI and virtual assistant technology.",
      fee: "$50-$60k",
      badge: "Siri Co-Founder",
      slug: "adam-cheyer",
    },
    {
      name: "Cassie Kozyrkov",
      title: "Former Google Chief Decision Scientist",
      image: "/placeholder.svg?height=300&width=300",
      bio: "Expert in AI strategy and making AI accessible to business leaders.",
      fee: "$45k-$70k",
      badge: "Google Executive",
      slug: "cassie-kozyrkov",
    },
    {
      name: "Allie Miller",
      title: "Former Head of ML Business Development at Amazon",
      image: "/placeholder.svg?height=300&width=300",
      bio: "Former Amazon ML executive and youngest woman to work on IBM Watson.",
      fee: "$70k",
      badge: "Amazon Executive",
      slug: "allie-k-miller",
    },
    {
      name: "Rana el Kaliouby",
      title: "Co-Founder of Affectiva (Emotion AI)",
      image: "/placeholder.svg?height=300&width=300",
      bio: "Pioneer in Emotion AI and computer vision technology.",
      fee: "Please Inquire",
      badge: "Emotion AI Pioneer",
      slug: "rana-el-kaliouby",
    },
    {
      name: "Daniel Kraft",
      title: "Physician-Scientist & Digital Health Expert",
      image: "/placeholder.svg?height=300&width=300",
      bio: "Expert in the convergence of medicine and exponential technologies.",
      fee: "$35k-$60k",
      badge: "Healthcare AI",
      slug: "daniel-kraft",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Top AI Speakers 2025</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The definitive list of the world's most sought-after artificial intelligence keynote speakers. From industry
            pioneers to Fortune 500 executives, these are the voices shaping AI's future.
          </p>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/contact?source=top_speakers_2025_page">Book a Top Speaker</Link>
          </Button>
        </div>
      </section>

      {/* Speakers Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topSpeakers.map((speaker, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={speaker.image || "/placeholder.svg"}
                      alt={speaker.name}
                      className="w-full h-64 object-cover rounded-t-lg"
                    />
                    <Badge className="absolute top-4 left-4 bg-blue-600 text-white">{speaker.badge}</Badge>
                    <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded text-sm font-semibold text-gray-900">
                      {speaker.fee}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{speaker.name}</h3>
                    <p className="text-blue-600 font-semibold mb-3">{speaker.title}</p>
                    <p className="text-gray-600 text-sm mb-4">{speaker.bio}</p>

                    <div className="flex gap-2">
                      <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Link href={`/speakers/${speaker.slug}`}>View Profile</Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1 bg-transparent">
                        <Link
                          href={`/contact?source=top_speakers_2025_page&speakerName=${encodeURIComponent(speaker.name)}`}
                        >
                          Book Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

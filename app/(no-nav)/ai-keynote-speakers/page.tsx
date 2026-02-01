import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Brain, Users, TrendingUp, Award, Clock, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Hire AI Keynote Speakers | Book AI Experts", // 43 chars
  description:
    "Hire top AI keynote speakers for your event. Book artificial intelligence experts, machine learning specialists, and technology leaders. Get matched in 4 hours.",
  keywords:
    "hire AI speakers, book AI keynote speakers, AI experts for hire, artificial intelligence speakers, machine learning speakers",
  alternates: {
    canonical: "https://speakabout.ai/ai-keynote-speakers",
  },
}

export default function AIKeynoteSpeakersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Hire AI Keynote Speakers</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Book world-class artificial intelligence keynote speakers for your event. From Siri co-founders to Google
            executives, we connect you with the top AI minds in the industry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/contact?source=ai_keynote_speakers_hero">Book AI Speaker Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent">
              <Link href="/speakers">Browse All Speakers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose AI Speakers Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Hire AI Keynote Speakers?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI keynote speakers bring cutting-edge insights and real-world experience to help your audience understand
              and leverage artificial intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-12 h-12 text-blue-600" />,
                title: "Expert Knowledge",
                description:
                  "Our speakers are AI pioneers, researchers, and executives from top tech companies who've built the technologies shaping our future.",
              },
              {
                icon: <Users className="w-12 h-12 text-blue-600" />,
                title: "Engaging Presentations",
                description:
                  "Professional speakers who know how to make complex AI concepts accessible and engaging for any audience.",
              },
              {
                icon: <TrendingUp className="w-12 h-12 text-blue-600" />,
                title: "Future Insights",
                description:
                  "Get ahead of the curve with insights into AI trends, opportunities, and challenges that will impact your industry.",
              },
              {
                icon: <Award className="w-12 h-12 text-blue-600" />,
                title: "Proven Track Record",
                description:
                  "Our speakers have delivered keynotes at major conferences, Fortune 500 companies, and prestigious events worldwide.",
              },
              {
                icon: <Clock className="w-12 h-12 text-blue-600" />,
                title: "Fast Matching",
                description:
                  "Get matched with the perfect AI speaker for your event in just 4 hours with our expert curation service.",
              },
              {
                icon: <CheckCircle className="w-12 h-12 text-blue-600" />,
                title: "Full Service",
                description:
                  "We handle everything from speaker selection to logistics, ensuring a seamless experience for your event.",
              },
            ].map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex justify-center mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Book Your AI Keynote Speaker?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Tell us about your event and we'll match you with the perfect AI expert in just 4 hours.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            <Link href="/contact?source=ai_keynote_speakers_cta">Get Speaker Recommendations</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

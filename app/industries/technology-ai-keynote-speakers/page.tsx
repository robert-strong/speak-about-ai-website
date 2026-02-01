import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import { SpeakerCard } from "@/components/speaker-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  Brain,
  Cpu,
  Database,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Globe,
  Building2,
  Briefcase,
  Factory,
  Heart,
  DollarSign,
  GraduationCap,
  Smartphone,
  Car,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Technology AI Keynote Speakers | Tech Experts", // 47 chars
  description:
    "Book top technology keynote speakers & AI experts for corporate events & tech summits. Leading voices in enterprise AI and digital transformation.",
  keywords:
    "technology keynote speakers, tech keynote speaker, ai keynote speaker, enterprise technology speakers, digital transformation speakers, artificial intelligence experts",
  alternates: {
    canonical: "https://speakabout.ai/industries/technology-ai-keynote-speakers",
  },
}

export default async function TechnologyKeynoteSpeakersPage() {
  const speakers = await getSpeakersByIndustry("Technology")

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Technology Keynote Speakers</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Transform your next event with leading AI and technology experts who drive innovation, digital
              transformation, and enterprise success across Fortune 500 companies worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                <Link href="/contact?source=technology_speakers_page">Book Technology Speakers</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 bg-transparent"
              >
                <Link href="/speakers">View All Speakers</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Speakers Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Technology Speakers</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our technology keynote speakers are industry pioneers, C-suite executives, and thought leaders who have
              shaped the digital landscape at companies like Google, Microsoft, Amazon, and Tesla.
            </p>
          </div>

          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.id}
                  speaker={speaker}
                  maxTopics={3}
                  contactSource="technology_industry_page"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading technology speakers...</p>
            </div>
          )}
        </div>
      </section>

      {/* Topics Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Technology Speaking Topics</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our technology speakers cover the full spectrum of enterprise technology, from AI implementation to
              digital transformation strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Artificial Intelligence & Machine Learning",
                description: "Enterprise AI strategy, implementation, and ROI measurement",
              },
              {
                icon: Cpu,
                title: "Digital Transformation",
                description: "Technology modernization and organizational change management",
              },
              {
                icon: Database,
                title: "Cloud Computing & Infrastructure",
                description: "Cloud migration strategies, hybrid solutions, and scalability",
              },
              {
                icon: Shield,
                title: "Cybersecurity & Data Privacy",
                description: "Enterprise security frameworks and risk management",
              },
              {
                icon: Zap,
                title: "Automation & Process Optimization",
                description: "Workflow automation and operational efficiency",
              },
              {
                icon: TrendingUp,
                title: "Innovation & Emerging Technologies",
                description: "Future tech trends and competitive advantage strategies",
              },
              {
                icon: Users,
                title: "Technology Leadership",
                description: "Building high-performing tech teams and culture",
              },
              {
                icon: Globe,
                title: "Platform Strategy & APIs",
                description: "Building scalable technology platforms and ecosystems",
              },
              {
                icon: Smartphone,
                title: "Mobile & IoT Solutions",
                description: "Connected devices and mobile-first strategies",
              },
            ].map((topic, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <topic.icon className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{topic.title}</h3>
                  <p className="text-gray-600">{topic.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Industries We Serve</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our technology speakers have delivered transformational insights across diverse industries, helping
              organizations navigate digital disruption and technological advancement.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { icon: Building2, name: "Enterprise Software" },
              { icon: DollarSign, name: "Financial Technology" },
              { icon: Heart, name: "Healthcare Technology" },
              { icon: Factory, name: "Manufacturing & Industry 4.0" },
              { icon: Car, name: "Automotive & Transportation" },
              { icon: GraduationCap, name: "Education Technology" },
              { icon: Briefcase, name: "Professional Services" },
              { icon: Globe, name: "Telecommunications" },
              { icon: Zap, name: "Energy & Utilities" },
              { icon: Users, name: "Government & Public Sector" },
              { icon: TrendingUp, name: "Startups & Scale-ups" },
              { icon: Shield, name: "Cybersecurity Firms" },
            ].map((industry, index) => (
              <div key={index} className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <industry.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">{industry.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Next Technology Event?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Connect with our technology keynote speakers who have driven innovation at the world's leading tech
            companies and can inspire your audience to embrace the future of technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
              <Link href="/contact?source=technology_speakers_cta">Get Speaker Recommendations</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 bg-transparent"
            >
              <Link href="/speakers">Browse All Technology Speakers</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { SpeakerCard } from "@/components/speaker-card"
import {
  BrainCircuit,
  TrendingUp,
  Zap,
  Rocket,
  Users,
  UserCog,
  Presentation,
  Globe2,
  Network,
  Lightbulb,
  BarChartBig,
  ClipboardCheck,
  Building,
  Shield,
  DollarSign,
  School,
  Target,
  FlaskConical,
  Mountain,
  Award,
  ClipboardList,
  Verified,
  Mic,
  Settings2,
  MessageSquare,
  CalendarClock,
} from "lucide-react"

interface Speaker {
  [key: string]: any
}

interface TechnologyAISpeakersClientPageProps {
  speakers: Speaker[]
}

export default function TechnologyAISpeakersClientPage({ speakers }: TechnologyAISpeakersClientPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [])

  const technologyKeynoteSpeakingTopics = [
    {
      icon: BrainCircuit,
      title: "Artificial Intelligence & Machine Learning",
      description: "AI applications, machine learning solutions, and intelligent automation for business.",
    },
    {
      icon: TrendingUp,
      title: "Digital Transformation & Tech Strategy",
      description: "Technology modernization and AI-powered business transformation solutions.",
    },
    {
      icon: Zap,
      title: "Emerging Technologies",
      description: "Cutting-edge tech trends, breakthrough innovations, and the future of technology.",
    },
    {
      icon: Rocket,
      title: "Technology Innovation",
      description: "Tech breakthrough strategies, disruptive technologies, and innovation frameworks.",
    },
    {
      icon: Users,
      title: "Technology Leadership & Executive Strategy",
      description: "Strategic guidance for C-suite executives, board members, and technology decision-makers.",
    },
    {
      icon: UserCog,
      title: "Executive-Level AI Implementation",
      description: "AI strategy and adoption guidance tailored for executive teams and leadership.",
    },
    {
      icon: MessageSquare,
      title: "Technology for Non-Technical Executives",
      description: "Making complex technologies accessible and actionable for business leaders.",
    },
    {
      icon: CalendarClock,
      title: "Future of Technology",
      description: "Technology predictions, trends, and their impact on business and society.",
    },
    {
      icon: Network,
      title: "Tech-Enabled Business Models",
      description: "How technology transforms traditional business approaches.",
    },
  ]

  const topicsForExecutiveTeams = [
    {
      icon: BrainCircuit,
      title: "AI Strategy & Business Transformation",
      description:
        "Works for every executive audience. Speakers help leadership teams understand how AI creates competitive advantage, regardless of their technical background.",
    },
    {
      icon: ClipboardCheck,
      title: "Executive Technology Adoption",
      description:
        "Requires expert guidance. Many leadership teams struggle with technology investment decisions. Our speakers make complex technology assessments clear and actionable for executive decision-making.",
    },
    {
      icon: Lightbulb,
      title: "Innovation Leadership & Team Building",
      description:
        "Address key executive challenges. Speaker insights on leading technology teams and fostering innovation cultures help executives build stronger organizations.",
    },
    {
      icon: BarChartBig,
      title: "Technology Strategy for Business Growth",
      description:
        "Reshapes company approaches. Our speakers excel at explaining emerging tech trends and strategic frameworks in ways that help executives make confident technology investments, even when they lack deep technical expertise.",
    },
  ]

  const organizationsServed = [
    { icon: Users, name: "Executive Leadership Teams" },
    { icon: Shield, name: "Board of Directors & Advisors" },
    { icon: Presentation, name: "C-Suite Technology Conferences" },
    { icon: Building, name: "Fortune 500 Companies" },
    { icon: DollarSign, name: "Technology Investment Firms" },
    { icon: School, name: "Executive Education Programs" },
    { icon: Target, name: "Corporate Strategy Sessions" },
    { icon: FlaskConical, name: "Technology Innovation Labs" },
    { icon: Mountain, name: "Enterprise Leadership Retreats" },
    { icon: UserCog, name: "CEO & CTO Forums" },
    { icon: Award, name: "Executive Technology Summits" },
    { icon: ClipboardList, name: "Strategic Planning Sessions" },
  ]

  const whyChooseUsPoints = [
    {
      icon: Verified,
      title: "Proven Technology Expertise",
      description:
        "Our speakers are recognized leaders from prestigious institutions like Stanford, MIT, Silicon Valley companies, and leading technology organizations worldwide.",
    },
    {
      icon: Lightbulb,
      title: "Cutting-Edge Insights",
      description:
        "Stay ahead of technology trends with speakers who are actively shaping the future of AI, digital transformation, and emerging technologies.",
    },
    {
      icon: Mic,
      title: "Engaging Presentations",
      description:
        "Our technology speakers are skilled presenters who deliver compelling, actionable insights that resonate with diverse technology audiences.",
    },
    {
      icon: Settings2,
      title: "Customized Content",
      description:
        "We customize each presentation for your specific audience. This includes technology executives, software developers, and digital transformation leaders.",
    },
    {
      icon: Globe2,
      title: "Global Recognition",
      description: "Featured in leading technology publications, Silicon Valley media, and top tech industry journals.",
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#EAEAEE] to-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-[#1E68C6] bg-opacity-10 text-[#1E68C6] rounded-full text-sm font-medium mb-6 font-montserrat">
              Top Technology Keynote Speakers
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">
              Top Technology Keynote Speakers for Executive Teams
            </h2>
            <p className="text-lg md:text-xl text-black mb-10 max-w-4xl mx-auto">
              Transform your executive conference with leading technology keynote speakers specializing in artificial
              intelligence and digital transformation. Our experts make advanced technology approachable for any
              audience, from C-suite leaders to front-line teams across top companies worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 px-8 py-4 text-lg"
              >
                <Link href="/contact?source=technology_ai_speakers_hero_book">Book Technology Keynote Speakers</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-[#1E68C6] text-white border border-[#1E68C6] hover:bg-[#1A5AAD] hover:border-[#1A5AAD] transition-colors duration-300 px-8 py-4 text-lg"
              >
                <Link href="/speakers">View All Speakers</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Technology Keynote Speakers */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Featured Technology Keynote Speakers</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our technology keynote speakers are top tech leaders, AI researchers, and digital transformation experts.
              They lead innovation at cutting-edge companies, universities, and technology organizations. Many
              specialize in artificial intelligence applications and emerging technologies. Most importantly, they excel
              at making complex technology concepts clear and engaging for executive audiences at any technical level.
            </p>
          </div>
          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.slug}
                  speaker={speaker}
                  contactSource="technology_ai_speakers_featured"
                  maxTopicsToShow={3}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading technology keynote speakers...</p>
            </div>
          )}
        </div>
      </section>

      {/* Technology Keynote Speaking Topics */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Technology Keynote Speaking Topics</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our technology speakers cover the complete range of tech innovation, from artificial intelligence
              breakthroughs to digital transformation and the future of emerging technologies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {technologyKeynoteSpeakingTopics.map((topic, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 flex flex-col items-center text-center md:items-start md:text-left">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-0 md:mr-4 mb-4 md:mb-0 self-center md:self-start">
                    <topic.icon className="w-6 h-6 text-[#1E68C6]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{topic.title}</h3>
                  <p className="text-gray-600 text-sm">{topic.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Text Sections Container: What Makes Our Speakers Unique & Value of Expert Speakers */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
              What Makes Our Technology AI Keynote Speakers Unique
            </h2>
            <div className="prose prose-lg max-w-none text-blue-100 prose-headings:text-white prose-strong:text-white space-y-4">
              <p>
                As the only speaker bureau focused exclusively on AI expertise, we connect you with technology speakers
                who understand both business strategy and artificial intelligence implementation. Our speakers discuss
                technology trends while still actively building and deploying cutting-edge AI solutions.
              </p>
              <p>
                Our technology AI speakers combine technical credentials with business expertise. They understand how
                emerging technologies work, how to implement them effectively in business environments, and how to
                measure their impact on organizational success. This dual expertise makes them uniquely valuable for
                technology audiences navigating AI adoption.
              </p>
              <p>
                Real-world technology implementation experience sets our speakers apart. They've led AI initiatives at
                major tech companies, developed machine learning solutions for Silicon Valley startups, and guided
                organizations through digital transformation. Their insights come from hands-on experience, not
                theoretical knowledge.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
              The Value of Expert Technology Keynote Speakers
            </h2>
            <div className="prose prose-lg max-w-none text-blue-100 prose-headings:text-white prose-strong:text-white space-y-4">
              <p>
                Technology events require speakers who understand both the science and the business of innovation. The
                right technology keynote speaker can transform your conference from an ordinary gathering into a
                catalyst for real technological advancement in your organization.
              </p>
              <p>
                Technology conferences face unique challenges. Attendees range from front-line developers to C-suite
                executives. Content must be both technically accurate and practically applicable. Your audience expects
                insights they cannot find in tech blogs or online courses.
              </p>
              <p>
                The technology landscape changes rapidly. New frameworks emerge monthly. AI capabilities reshape
                business processes daily. Regulations shift technology economics constantly. Your speakers must stay
                current with these changes and help your audience navigate them successfully.
              </p>
              <p>
                ROI matters in technology speaking. The average tech conference costs $1,500 per attendee. Technology
                organizations expect measurable outcomes. They want speakers who deliver actionable insights that
                improve business processes, reduce costs, or enhance technological efficiency.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Technology Speaking Topics Perfect for Executive Teams */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Technology Speaking Topics Perfect for Executive Teams
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {topicsForExecutiveTeams.map((topic, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <topic.icon className="w-5 h-5 text-[#1E68C6]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{topic.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{topic.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Organizations We Serve */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Technology Organizations We Serve</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our technology keynote speakers have delivered executive-level insights across diverse organizations,
              helping leadership teams navigate innovation and digital transformation.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {organizationsServed.map((org, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-lg hover:bg-blue-50 transition-colors duration-300 flex flex-col items-center"
              >
                <org.icon className="w-10 h-10 text-[#1E68C6] mb-3" />
                <p className="text-sm font-medium text-gray-700">{org.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Our Technology Keynote Speakers? */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center">
            Why Choose Our Technology Keynote Speakers?
          </h2>
          <div className="space-y-8">
            {whyChooseUsPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <point.icon className="w-5 h-5 text-[#1E68C6]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{point.title}</h3>
                  <p className="text-gray-600">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Technology Event?</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Connect with our technology keynote speakers. Leading tech companies, Silicon Valley organizations, and
            technology events worldwide trust them to deliver cutting-edge insights on the future of artificial
            intelligence and emerging technologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 px-8 py-4 text-lg"
            >
              <Link href="/contact?source=technology_ai_speakers_cta_recommendations">
                Get Speaker Recommendations Today
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-[#1E68C6] transition-colors duration-300 px-8 py-4 text-lg bg-transparent"
            >
              <Link href="/contact?source=technology_ai_speakers_cta_contact">
                Contact us to discuss your technology event needs.
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final Paragraph */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-md text-gray-700 italic">
            Our AI speaker bureau connects executive teams with top technology keynote speakers. They excel at making
            advanced AI and emerging technologies accessible to any leadership audience. From Silicon Valley tech
            leaders to AI experts, our speakers inspire executives across all industries with clear, actionable
            technology insights.
          </p>
        </div>
      </section>
    </div>
  )
}

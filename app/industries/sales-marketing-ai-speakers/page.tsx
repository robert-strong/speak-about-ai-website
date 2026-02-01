import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import { SpeakerCard } from "@/components/speaker-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TrendingUp, Target, BarChart3, Users, MessageSquare, Zap, DollarSign, Heart, Brain } from "lucide-react"

export const metadata: Metadata = {
  title: "Sales & Marketing AI Speakers | Revenue Growth Experts", // 57 chars
  description:
    "Book sales & marketing AI keynote speakers who've driven billions in revenue. Experts for sales conferences, marketing events & corporate training.",
  keywords:
    "sales keynote speaker, marketing keynote speaker, AI sales speaker, marketing AI expert, revenue growth speaker, sales automation speaker, digital marketing speaker",
  openGraph: {
    title: "Sales & Marketing AI Keynote Speakers | Expert Revenue Growth Speakers",
    description:
      "Book sales & marketing AI keynote speakers who've driven billions in revenue. Experts for sales conferences, marketing events & corporate training.",
    type: "website",
  },
}

export default async function SalesMarketingAISpeakersPage() {
  const speakers = await getSpeakersByIndustry("Sales")

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Sales & Marketing AI
              <span className="block text-[#1E68C6]">Keynote Speakers</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Book world-class speakers who have driven billions in revenue growth through AI-powered sales and
              marketing strategies. Perfect for sales conferences, marketing events, and corporate training.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-[#1E68C6] hover:bg-[#1557A5] text-white px-8 py-4 text-lg">
                <Link href="/contact?source=sales_marketing_hero">Book Sales AI Speaker</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-[#1E68C6] text-[#1E68C6] hover:bg-[#1E68C6] hover:text-white px-8 py-4 text-lg bg-transparent"
              >
                <Link href="/contact?source=sales_marketing_hero">Book Marketing AI Speaker</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Speakers Grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Expert Sales & Marketing AI Speakers</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our speakers have generated billions in revenue and transformed sales and marketing operations at Fortune
              500 companies worldwide.
            </p>
          </div>

          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.slug}
                  speaker={speaker}
                  contactSource="sales_marketing_industry_page"
                  maxTopicsToShow={3}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-6">
                We're currently updating our sales and marketing AI speaker roster.
              </p>
              <Button asChild className="bg-[#1E68C6] hover:bg-[#1557A5] text-white">
                <Link href="/contact?source=sales_marketing_no_speakers">Request Sales & Marketing AI Speakers</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Topics Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Sales & Marketing AI Topics</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our speakers cover the full spectrum of AI applications in sales and marketing, from automation to
              predictive analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-[#1E68C6]" />,
                title: "Sales Automation & AI Tools",
                description:
                  "Streamline sales processes with AI-powered CRM systems, lead scoring, and automated follow-ups.",
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-[#1E68C6]" />,
                title: "Predictive Sales Analytics",
                description: "Leverage AI for sales forecasting, pipeline management, and revenue prediction.",
              },
              {
                icon: <Target className="w-8 h-8 text-[#1E68C6]" />,
                title: "Customer Segmentation & Targeting",
                description: "Use AI to identify high-value prospects and personalize outreach strategies.",
              },
              {
                icon: <MessageSquare className="w-8 h-8 text-[#1E68C6]" />,
                title: "Conversational AI & Chatbots",
                description: "Implement AI-powered chatbots and virtual assistants for customer engagement.",
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-[#1E68C6]" />,
                title: "Marketing Attribution & ROI",
                description: "Track and optimize marketing performance with AI-driven attribution models.",
              },
              {
                icon: <Brain className="w-8 h-8 text-[#1E68C6]" />,
                title: "Content Generation & Optimization",
                description: "Create and optimize marketing content using AI writing tools and personalization.",
              },
              {
                icon: <DollarSign className="w-8 h-8 text-[#1E68C6]" />,
                title: "Dynamic Pricing Strategies",
                description: "Implement AI-driven pricing models to maximize revenue and competitiveness.",
              },
              {
                icon: <Heart className="w-8 h-8 text-[#1E68C6]" />,
                title: "Customer Retention & Loyalty",
                description: "Use AI to predict churn, increase retention, and build customer loyalty programs.",
              },
              {
                icon: <Users className="w-8 h-8 text-[#1E68C6]" />,
                title: "Account-Based Marketing (ABM)",
                description: "Leverage AI for targeted account identification and personalized marketing campaigns.",
              },
            ].map((topic, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  {topic.icon}
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">{topic.title}</h3>
                </div>
                <p className="text-gray-600">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Industries We Serve</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our sales and marketing AI speakers have experience across diverse industries and business models.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              "SaaS & Technology",
              "E-commerce & Retail",
              "Financial Services",
              "Healthcare & Pharma",
              "Manufacturing",
              "Real Estate",
              "Professional Services",
              "Automotive",
              "Media & Entertainment",
              "Education & Training",
              "Hospitality & Travel",
              "Non-Profit Organizations",
            ].map((industry, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg text-center">
                <span className="text-[#1E68C6] font-semibold">{industry}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-[#1E68C6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Sales & Marketing Results?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Book a sales or marketing AI keynote speaker who can help your team leverage artificial intelligence to
            drive revenue growth, improve conversion rates, and stay ahead of the competition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-[#1E68C6] hover:bg-gray-100 px-8 py-4 text-lg">
              <Link href="/contact?source=sales_marketing_cta">Get Speaker Recommendations</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-[#1E68C6] px-8 py-4 text-lg bg-transparent"
            >
              <Link href="/speakers">Browse All Speakers</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

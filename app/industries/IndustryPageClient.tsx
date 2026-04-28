"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { SpeakerCard } from "@/components/speaker-card"
import {
  Brain,
  Laptop,
  TrendingUp,
  Sparkles,
  Lightbulb,
  Users,
  Cpu,
  Globe2,
  Building2,
  Presentation,
  GraduationCap,
  Briefcase,
  CheckCircle,
  Landmark,
  Factory,
  Car,
  ShoppingCart,
  DollarSign,
  LineChart,
  Target,
  Megaphone,
  Store,
  Truck,
  Zap,
  Shield,
  Cog,
  BarChart3,
  PieChart,
  Wallet,
  Building,
  Banknote,
  CreditCard,
  TrendingDown,
  Award,
  Rocket,
  Settings,
  UserCog,
  School,
  Vote,
  BookOpen,
  Scale,
  type LucideIcon,
} from "lucide-react"

interface Speaker {
  [key: string]: any
}

interface SpeakingTopic {
  title: string
  description: string
}

interface Industry {
  name: string
  slug: string
  badge: string
  headline: string
  description: string
  featuredTitle: string
  featuredDescription: string
  ctaTitle: string
  ctaDescription: string
  bookButtonText: string
  contactSource: string
  speakingTopics: SpeakingTopic[]
  organizationsServed: string[]
}

interface IndustryPageClientProps {
  speakers: Speaker[]
  industry: Industry
}

// Map topic titles to icons
const getTopicIcon = (title: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    // Financial Services
    "AI in Banking & Finance": DollarSign,
    "Digital Banking Transformation": Laptop,
    "Fintech Innovation": Sparkles,
    "AI-Powered Risk Management": Shield,
    "Investment & Wealth Tech": LineChart,
    "Future of Finance": TrendingUp,
    // Leadership & Business
    "AI Leadership & Strategy": Brain,
    "Executive Decision Making": Target,
    "Organizational Transformation": Users,
    "Innovation & Disruption": Rocket,
    "Future of Work": UserCog,
    "Strategic Consulting": Briefcase,
    // Sales, Marketing & Retail
    "AI-Powered Marketing": Megaphone,
    "Customer Experience & AI": Users,
    "E-Commerce Innovation": ShoppingCart,
    "Sales Automation & AI": Target,
    "Brand Strategy & AI": Award,
    "Digital Advertising": Globe2,
    // Industrial & Automotive
    "Industry 4.0 & Smart Manufacturing": Factory,
    "Autonomous Vehicles & Mobility": Car,
    "Supply Chain & Logistics AI": Truck,
    "Robotics & Automation": Cog,
    "Energy & Sustainability": Zap,
    "Quality & Safety AI": Shield,
    // Government & Education
    "AI Policy & Governance": Scale,
    "Digital Government": Landmark,
    "EdTech & AI in Learning": BookOpen,
    "Higher Education Innovation": GraduationCap,
    "Public Safety & Security": Shield,
    "Workforce Development": Users,
  }
  return iconMap[title] || Lightbulb
}

// Map organization names to icons
const getOrgIcon = (name: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    // Financial Services
    "Investment Banks": Building,
    "Commercial Banks": Banknote,
    "Asset Management Firms": PieChart,
    "Insurance Companies": Shield,
    "Fintech Startups": Rocket,
    "Hedge Funds": TrendingUp,
    "Private Equity Firms": Wallet,
    "Payment Processors": CreditCard,
    "Credit Unions": Building2,
    "Financial Regulators": Scale,
    "Wealth Management Firms": LineChart,
    "Cryptocurrency Exchanges": DollarSign,
    // Leadership & Business
    "Fortune 500 Companies": Building2,
    "Management Consulting Firms": Briefcase,
    "Executive Leadership Teams": Users,
    "Corporate Boards": Landmark,
    "Business Schools": GraduationCap,
    "Venture Capital Firms": TrendingUp,
    "Professional Associations": Users,
    "Industry Conferences": Presentation,
    "C-Suite Retreats": Award,
    "Strategy Summits": Target,
    "Leadership Development Programs": UserCog,
    // Sales, Marketing & Retail
    "Global Brands": Globe2,
    "Retail Chains": Store,
    "E-Commerce Companies": ShoppingCart,
    "Marketing Agencies": Megaphone,
    "CPG Companies": Store,
    "Sales Organizations": Target,
    "Advertising Agencies": Presentation,
    "MarTech Companies": Cpu,
    "Retail Associations": Users,
    "Commerce Conferences": Presentation,
    "Brand Summits": Award,
    "CMO Forums": Users,
    // Industrial & Automotive
    "Automotive Manufacturers": Car,
    "Industrial Equipment Companies": Factory,
    "Logistics & Transportation Firms": Truck,
    "Energy Companies": Zap,
    "Aerospace & Defense": Shield,
    "Supply Chain Organizations": Truck,
    "Manufacturing Associations": Factory,
    "Robotics Companies": Cog,
    "Automotive Suppliers": Car,
    "Industrial Conferences": Presentation,
    "Engineering Societies": Settings,
    "Operations Summits": BarChart3,
    // Government & Education
    "Federal Agencies": Landmark,
    "State & Local Government": Building2,
    "Universities & Colleges": GraduationCap,
    "K-12 School Districts": School,
    "Defense & Intelligence": Shield,
    "Policy Think Tanks": Lightbulb,
    "Educational Associations": BookOpen,
    "Government Contractors": Briefcase,
    "Nonprofit Organizations": Users,
    "Research Institutions": Brain,
    "International Organizations": Globe2,
    "Public Administration Conferences": Vote,
  }
  return iconMap[name] || Building2
}

export default function IndustryPageClient({ speakers, industry }: IndustryPageClientProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#EAEAEE] to-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-[#1E68C6] bg-opacity-10 text-[#1E68C6] rounded-full text-sm font-medium mb-6 font-montserrat">
              {industry.badge}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">
              {industry.headline}
            </h1>
            <p className="text-lg md:text-xl text-black mb-10 max-w-4xl mx-auto">
              {industry.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 px-8 py-4 text-lg"
              >
                <Link href={`/contact?source=${industry.contactSource}_hero_book`}>
                  {industry.bookButtonText}
                </Link>
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

      {/* Featured Speakers Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">{industry.featuredTitle}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {industry.featuredDescription}
            </p>
          </div>

          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.slug}
                  speaker={speaker}
                  contactSource={`${industry.contactSource}_featured`}
                  maxTopicsToShow={3}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading {industry.name.toLowerCase()} keynote speakers...</p>
            </div>
          )}
        </div>
      </section>

      {/* Speaking Topics */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {industry.name} Keynote Speaking Topics
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our {industry.name.toLowerCase()} speakers cover the full spectrum of industry innovation, from emerging
              technologies to strategic transformation and the future of the field.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industry.speakingTopics.map((topic, index) => {
              const IconComponent = getTopicIcon(topic.title)
              return (
                <Card key={index} className="bg-white hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 flex flex-col items-center text-center md:items-start md:text-left">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-0 md:mr-4 mb-4 md:mb-0 self-center md:self-start">
                      <IconComponent className="w-6 h-6 text-[#1E68C6]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{topic.title}</h3>
                    <p className="text-gray-600 text-sm">{topic.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Organizations Served */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {industry.name} Organizations We Serve
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our {industry.name.toLowerCase()} keynote speakers have delivered transformational insights across diverse
              organizations, helping them navigate industry innovation and digital transformation.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {industry.organizationsServed.map((org, index) => {
              const IconComponent = getOrgIcon(org)
              return (
                <div key={index} className="text-center p-4 rounded-lg hover:bg-blue-50 transition-colors duration-300">
                  <IconComponent className="w-10 h-10 text-[#1E68C6] mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">{org}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Our Speakers */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center">
            Why Choose Our {industry.name} Keynote Speakers?
          </h2>
          <div className="space-y-8">
            <div className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-[#1E68C6]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Proven Industry Expertise</h3>
                <p className="text-gray-600">
                  Our speakers lead major organizations and bring real-world experience from the front lines of {industry.name.toLowerCase()} innovation.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <TrendingUp className="w-5 h-5 text-[#1E68C6]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Cutting-Edge AI Insights</h3>
                <p className="text-gray-600">
                  Stay ahead of industry trends with speakers who are actively shaping the future of AI in {industry.name.toLowerCase()}.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Presentation className="w-5 h-5 text-[#1E68C6]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Engaging Presentations</h3>
                <p className="text-gray-600">
                  Our speakers deliver compelling, actionable insights that resonate with diverse {industry.name.toLowerCase()} audiences.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Globe2 className="w-5 h-5 text-[#1E68C6]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Global Recognition</h3>
                <p className="text-gray-600">
                  Featured in leading publications and trusted by top organizations worldwide for {industry.name.toLowerCase()} expertise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{industry.ctaTitle}</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            {industry.ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 px-8 py-4 text-lg"
            >
              <Link href={`/contact?source=${industry.contactSource}_cta_recommendations`}>
                Get Speaker Recommendations Today
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-[#1E68C6] transition-colors duration-300 px-8 py-4 text-lg"
            >
              <Link href={`/contact?source=${industry.contactSource}_cta_contact`}>Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final Paragraph */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-md text-gray-700 italic">
            Our speaker bureau specializes in connecting organizations with top {industry.name.toLowerCase()} keynote speakers who deliver
            insights on AI innovation, digital transformation, and the future of artificial intelligence in {industry.name.toLowerCase()}.
            From AI implementation experts to industry pioneers, our speakers inspire and educate professionals across all specialties.
          </p>
        </div>
      </section>
    </div>
  )
}

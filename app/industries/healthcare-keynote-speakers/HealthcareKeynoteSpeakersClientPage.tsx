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
  Dna,
  Lightbulb,
  FlaskConical,
  HeartHandshake,
  UserCheck,
  Users,
  Briefcase,
  Cpu,
  Globe2,
  Landmark,
  Building2,
  Hospital,
  Presentation,
  GraduationCap,
  Pill,
  Smartphone,
  Wrench,
  ShieldCheck,
  ClipboardList,
  ServerCog,
  CheckCircle,
  BarChart3,
  Users2,
  FileDigit,
  UserCog,
  HeartPulse,
  Network,
} from "lucide-react"

interface Speaker {
  [key: string]: any
}

interface HealthcareKeynoteSpeakersClientPageProps {
  speakers: Speaker[]
}

export default function HealthcareKeynoteSpeakersClientPage({ speakers }: HealthcareKeynoteSpeakersClientPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [])

  const speakingTopics = [
    {
      icon: Brain,
      title: "AI in Medical Practice",
      description:
        "Artificial intelligence for disease detection, medical imaging analysis, and clinical decision support.",
    },
    {
      icon: Laptop,
      title: "Digital Health & AI Transformation",
      description: "Healthcare system modernization and AI-powered patient care solutions.",
    },
    {
      icon: Sparkles,
      title: "Future of Healthcare",
      description: "Emerging trends, breakthrough treatments, and the evolution of medical practice.",
    },
    {
      icon: Dna,
      title: "AI-Powered Precision Medicine",
      description:
        "Personalized treatment plans using artificial intelligence, advanced diagnostics and genetic profiling.",
    },
    {
      icon: Lightbulb,
      title: "Healthcare Innovation",
      description: "Breakthrough technologies transforming patient outcomes and medical practice.",
    },
    {
      icon: HeartHandshake,
      title: "Patient Care Excellence",
      description: "Improving patient experiences and outcomes through innovative approaches.",
    },
    {
      icon: Users,
      title: "Healthcare Leadership",
      description: "Strategic guidance for healthcare executives and medical professionals.",
    },
    {
      icon: Cpu,
      title: "Medical AI Technology",
      description:
        "Cutting-edge artificial intelligence systems, machine learning diagnostics, and AI-powered medical devices.",
    },
    {
      icon: Landmark,
      title: "Healthcare Policy & Reform",
      description: "Healthcare system changes and policy implications for medical organizations.",
    },
  ]

  const organizationsServed = [
    { icon: Building2, name: "Hospital Systems" },
    { icon: Hospital, name: "Medical Centers" },
    { icon: Presentation, name: "Healthcare Conferences" },
    { icon: GraduationCap, name: "Medical Schools" },
    { icon: Pill, name: "Pharmaceutical Companies" },
    { icon: Briefcase, name: "Healthcare Consulting Firms" },
    { icon: Smartphone, name: "Digital Health Companies" },
    { icon: Wrench, name: "Medical Device Companies" },
    { icon: ShieldCheck, name: "Health Insurance Organizations" },
    { icon: FlaskConical, name: "Biotech Companies" },
    { icon: ClipboardList, name: "Clinical Research Organizations" },
    { icon: ServerCog, name: "Healthcare Technology Companies" },
  ]

  const whyChooseUsPoints = [
    {
      icon: CheckCircle,
      title: "Proven Healthcare Expertise",
      description:
        "Our speakers lead major institutions like Harvard Medical School, Stanford, Mayo Clinic, and top healthcare systems worldwide.",
    },
    {
      icon: TrendingUp,
      title: "Cutting-Edge Insights",
      description:
        "Stay ahead of healthcare trends with speakers who are actively shaping the future of medicine and patient care.",
    },
    {
      icon: Presentation,
      title: "Engaging Presentations",
      description:
        "Our healthcare speakers are skilled presenters who deliver compelling, actionable insights that resonate with diverse healthcare audiences.",
    },
    {
      icon: UserCog,
      title: "Customized Content",
      description:
        "We customize each presentation for your specific audience. This includes hospital executives, medical professionals, and healthcare technology leaders.",
    },
    {
      icon: Globe2,
      title: "Global Recognition",
      description:
        "Featured in leading healthcare publications like the New York Times, Harvard Medical School publications, and top medical journals.",
    },
  ]

  const topicsThatDriveResults = [
    {
      icon: HeartPulse,
      title: "Patient Safety & Quality Improvement",
      description:
        "Resonate with every healthcare audience. Speakers who share proven methods for reducing medical errors, improving patient satisfaction, or enhancing clinical outcomes provide immediate value.",
    },
    {
      icon: Brain,
      title: "Healthcare AI & Machine Learning Adoption",
      description:
        "Requires expert guidance. Speakers who provide practical AI implementation strategies help audiences avoid common technical and regulatory pitfalls.",
    },
    {
      icon: Users2,
      title: "Workforce Development",
      description:
        "Addresses critical healthcare staffing challenges. Insights on recruiting, training, and retaining professionals help build stronger teams.",
    },
    {
      icon: BarChart3,
      title: "Value-Based Care Models",
      description:
        "Reshape healthcare economics. Speakers explaining payment reforms, quality metrics, and population health management help organizations transition successfully.",
    },
  ]

  const industryTrends = [
    {
      icon: Network,
      title: "AI-Powered Healthcare Delivery",
      description:
        "Accelerates across all medical settings. Speakers who understand AI applications and their practical implementation provide tremendous value.",
    },
    {
      icon: UserCheck,
      title: "Healthcare Consumerism",
      description:
        "Changes patient expectations. Speakers addressing these evolving expectations help organizations improve patient satisfaction and loyalty.",
    },
    {
      icon: Users,
      title: "Healthcare Workforce Shortages",
      description:
        "Affect every medical specialty. Speakers who offer solutions to these workforce challenges attract large audiences.",
    },
    {
      icon: FileDigit,
      title: "Regulatory Compliance Requirements",
      description:
        "Continue expanding. Speakers who help organizations navigate these requirements provide essential guidance.",
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero Section - Styled like Home Hero */}
      <section className="bg-gradient-to-br from-[#EAEAEE] to-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-[#1E68C6] bg-opacity-10 text-[#1E68C6] rounded-full text-sm font-medium mb-6 font-montserrat">
              Healthcare AI Experts
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">
              Top Healthcare Keynote Speakers
            </h1>
            <p className="text-lg md:text-xl text-black mb-10 max-w-4xl mx-auto">
              Transform your medical conference with leading healthcare keynote speakers specializing in AI and digital
              health innovation. Our experts are changing patient care through artificial intelligence and emerging
              medical technologies. They work across top hospitals and healthcare systems worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 px-8 py-4 text-lg"
              >
                <Link href="/contact?source=healthcare_keynote_speakers_hero_book">
                  Book Healthcare Keynote Speakers
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

      {/* Featured Speakers Grid - Styled like Home Featured Speakers */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Featured Healthcare Keynote Speakers</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our healthcare keynote speakers are top medical professionals, researchers, and AI thought leaders. They
              lead healthcare innovation at top medical institutions, universities, and healthcare organizations. Many
              specialize in artificial intelligence applications in medicine and digital health transformation.
            </p>
          </div>

          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.slug}
                  speaker={speaker}
                  contactSource="healthcare_keynote_speakers_featured"
                  maxTopicsToShow={3}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading healthcare keynote speakers...</p>
            </div>
          )}
        </div>
      </section>

      {/* Healthcare Keynote Speaking Topics - Styled like Home Why Choose Us */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Healthcare Keynote Speaking Topics</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our healthcare speakers cover the full spectrum of medical innovation, from breakthrough treatments to
              healthcare system transformation and the future of patient care.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {speakingTopics.map((topic, index) => (
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

      {/* Healthcare Organizations We Serve - Consistent light gray background */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Healthcare Organizations We Serve</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our healthcare keynote speakers have delivered transformational insights across diverse medical
              organizations, helping them navigate healthcare innovation and industry transformation.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {organizationsServed.map((org, index) => (
              <div key={index} className="text-center p-4 rounded-lg hover:bg-blue-50 transition-colors duration-300">
                <org.icon className="w-10 h-10 text-[#1E68C6] mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">{org.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Our Healthcare Keynote Speakers? - Styled like Home Why Choose Us */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center">
            Why Choose Our Healthcare Keynote Speakers?
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

      {/* Text Sections Container - Styled like Home Booking CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* The Value of Expert Healthcare Keynote Speakers */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
              The Value of Expert Healthcare Keynote Speakers
            </h2>
            <div className="prose prose-lg max-w-none text-blue-100 prose-headings:text-white prose-strong:text-white space-y-4">
              <p>
                Healthcare events require speakers who understand both the science and the business of medicine. The
                right healthcare keynote speaker can transform your conference from an ordinary gathering into a
                catalyst for real change in your organization.
              </p>
              <p>
                Medical conferences face unique challenges. Attendees range from front-line nurses to C-suite
                executives. Content must be both scientifically accurate and practically applicable. Your audience
                expects insights they cannot find in medical journals or online courses.
              </p>
              <p>
                The healthcare landscape changes rapidly. New treatments emerge monthly. Technology reshapes patient
                care daily. Regulations shift healthcare economics constantly. Your speakers must stay current with
                these changes and help your audience navigate them successfully.
              </p>
              <p>
                ROI matters in healthcare speaking. The average medical conference costs $1,200 per attendee. Healthcare
                organizations expect measurable outcomes. They want speakers who deliver actionable insights that
                improve patient outcomes, reduce costs, or enhance operational efficiency.
              </p>
            </div>
          </section>

          {/* What Makes Our Healthcare AI Keynote Speakers Unique */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
              What Makes Our Healthcare AI Keynote Speakers Unique
            </h2>
            <div className="prose prose-lg max-w-none text-blue-100 prose-headings:text-white prose-strong:text-white space-y-4">
              <p>
                As the only speaker bureau focused exclusively on AI expertise, we connect you with healthcare speakers
                who understand both medical practice and artificial intelligence applications. Our speakers don&apos;t
                just talk about AI in theory—they actively implement machine learning solutions in clinical settings.
              </p>
              <p>
                Our healthcare AI speakers combine medical credentials with technical expertise. They understand how AI
                algorithms work, how to implement them safely in clinical workflows, and how to measure their impact on
                patient outcomes. This dual expertise makes them uniquely valuable for healthcare audiences navigating
                AI adoption.
              </p>
              <p>
                Real-world AI implementation experience sets our speakers apart. They&apos;ve led AI initiatives at
                major medical centers, developed machine learning diagnostic tools, and guided healthcare organizations
                through digital transformation. Their insights come from hands-on experience, not academic theory.
              </p>
            </div>
          </section>

          {/* What Makes Healthcare Keynote Speakers Effective */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
              What Makes Healthcare Keynote Speakers Effective
            </h2>
            <div className="prose prose-lg max-w-none text-blue-100 prose-headings:text-white prose-strong:text-white space-y-4">
              <p>
                Healthcare audiences respect speakers with active clinical practice or recent medical research
                experience. They want to hear from peers who understand their daily challenges, not just theoretical
                experts.
              </p>
              <p>
                Industry experience provides practical insights. The best healthcare speakers combine medical knowledge
                with business understanding. They know how hospitals operate, how medical groups make decisions, and how
                healthcare technology implementations actually work.
              </p>
              <p>
                Communication skills engage diverse audiences. Medical professionals think analytically. They appreciate
                data-driven presentations with clear methodologies. However, they also respond to compelling patient
                stories and real-world case studies that illustrate key concepts.
              </p>
              <p>
                Future focus drives innovation. Healthcare evolves constantly. Effective speakers help audiences
                anticipate changes, prepare for new technologies, and adapt their practices to emerging healthcare
                delivery models.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Healthcare Speaking Topics That Drive Results - Styled like Home Why Choose Us */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Healthcare Speaking Topics That Drive Results
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {topicsThatDriveResults.map((topic, index) => (
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

      {/* Healthcare Industry Trends Shaping Speaker Demand - Consistent light gray background */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Healthcare Industry Trends Shaping Speaker Demand
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {industryTrends.map((trend, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <trend.icon className="w-5 h-5 text-[#1E68C6]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{trend.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{trend.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Styled like Home Booking CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Healthcare Event?</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Connect with our healthcare keynote speakers. Leading medical institutions, hospitals, and healthcare
            organizations worldwide trust them to deliver cutting-edge insights on the future of medicine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 px-8 py-4 text-lg"
            >
              <Link href="/contact?source=healthcare_keynote_speakers_cta_recommendations">
                Get Speaker Recommendations Today
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-[#1E68C6] transition-colors duration-300 px-8 py-4 text-lg"
            >
              <Link href="/contact?source=healthcare_keynote_speakers_cta_contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final Paragraph - Consistent light gray background */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-md text-gray-700 italic">
            Our speaker bureau specializes in connecting organizations with top healthcare keynote speakers who deliver
            insights on medical AI innovation, patient care technology, and the future of artificial intelligence in
            healthcare. From AI implementation experts to digital health pioneers, our speakers inspire and educate
            healthcare professionals across all medical specialties.
          </p>
        </div>
      </section>
    </div>
  )
}

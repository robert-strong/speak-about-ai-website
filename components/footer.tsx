import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, Linkedin } from "lucide-react"
import { getPageContent, getFromContent } from "@/lib/website-content"

export default async function Footer() {
  // Fetch footer content from database
  const content = await getPageContent('footer')

  // Company Info
  const logo = getFromContent(content, 'footer', 'company', 'logo') || '/speak-about-ai-light-logo.png'
  const logoAlt = getFromContent(content, 'footer', 'company', 'logo_alt') || 'Speak About AI'
  const description = getFromContent(content, 'footer', 'company', 'description') || "The world's only AI-exclusive speaker bureau, connecting organizations around the world with the most sought-after artificial intelligence experts and thought leaders."
  const phone = getFromContent(content, 'footer', 'company', 'phone') || '+1 (415) 665-2442'
  const email = getFromContent(content, 'footer', 'company', 'email') || 'human@speakabout.ai'

  // Quick Links
  const quickLinksTitle = getFromContent(content, 'footer', 'quick-links', 'title') || 'Quick Links'
  const quickLinksJson = getFromContent(content, 'footer', 'quick-links', 'links')
  let quickLinks: { text: string; url: string }[] = []
  try {
    quickLinks = quickLinksJson ? JSON.parse(quickLinksJson) : []
  } catch {
    quickLinks = []
  }
  // Default quick links if empty
  if (quickLinks.length === 0) {
    quickLinks = [
      { text: 'All Speakers', url: '/speakers' },
      { text: 'Our Services', url: '/our-services' },
      { text: 'Our Team', url: '/our-team' },
      { text: 'Contact Us', url: '/contact' },
      { text: 'Blog', url: '/blog' }
    ]
  }

  // Industries
  const industriesTitle = getFromContent(content, 'footer', 'industries', 'title') || 'Industries'
  const industriesLinksJson = getFromContent(content, 'footer', 'industries', 'links')
  let industriesLinks: { text: string; url: string }[] = []
  try {
    industriesLinks = industriesLinksJson ? JSON.parse(industriesLinksJson) : []
  } catch {
    industriesLinks = []
  }
  // Default industries links if empty
  if (industriesLinks.length === 0) {
    industriesLinks = [
      { text: 'Healthcare AI', url: '/industries/healthcare-keynote-speakers' },
      { text: 'Technology & Enterprise', url: '/industries/technology-keynote-speakers' }
    ]
  }

  // For Speakers
  const forSpeakersTitle = getFromContent(content, 'footer', 'for-speakers', 'title') || 'For Speakers'
  const forSpeakersLinksJson = getFromContent(content, 'footer', 'for-speakers', 'links')
  let forSpeakersLinks: { text: string; url: string }[] = []
  try {
    forSpeakersLinks = forSpeakersLinksJson ? JSON.parse(forSpeakersLinksJson) : []
  } catch {
    forSpeakersLinks = []
  }
  // Default for speakers links if empty
  if (forSpeakersLinks.length === 0) {
    forSpeakersLinks = [
      { text: 'Apply to Be a Speaker', url: '/apply' }
    ]
  }

  // Bottom
  const copyright = getFromContent(content, 'footer', 'bottom', 'copyright') || '© 2026 Speak About AI. All rights reserved.'
  const linkedinUrl = getFromContent(content, 'footer', 'bottom', 'linkedin_url') || 'https://www.linkedin.com/company/speakabout-ai/'

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <Image
                src={logo}
                alt={logoAlt}
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-[#EAEAEE] mb-6 max-w-md">
              {description}
            </p>
            <div className="space-y-2">
              <div className="flex items-start">
                <Phone className="w-4 h-4 mr-3 mt-1 text-[#1E68C6]" />
                <span className="text-[#EAEAEE] whitespace-pre-line">{phone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-[#1E68C6]" />
                <span className="text-[#EAEAEE]">{email}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{quickLinksTitle}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.url} className="text-[#EAEAEE] hover:text-white">
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{industriesTitle}</h3>
            <ul className="space-y-2">
              {industriesLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.url}
                    scroll={false}
                    className="text-[#EAEAEE] hover:text-white"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Speakers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{forSpeakersTitle}</h3>
            <ul className="space-y-2">
              {forSpeakersLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.url} className="text-[#EAEAEE] hover:text-white">
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-[#EAEAEE] text-sm mb-4 md:mb-0">{copyright}</div>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-[#EAEAEE] hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-[#EAEAEE] hover:text-white text-sm">
                Terms of Service
              </Link>
              <div className="flex space-x-4">
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#EAEAEE] hover:text-white"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

import { Award, MapPin, Globe } from "lucide-react" // Added Globe
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button" // Import the Button component
import { getPageContent, getFromContent } from "@/lib/website-content"

export default async function Hero() {
  // Fetch content from database with revalidation
  const content = await getPageContent('home')
  const badge = getFromContent(content, 'home', 'hero', 'badge')
  const title = getFromContent(content, 'home', 'hero', 'title')
  const subtitle = getFromContent(content, 'home', 'hero', 'subtitle')

  // Hero image from database
  const heroImage = getFromContent(content, 'home', 'images', 'hero_image') || '/robert-strong-adam-cheyer-peter-norvig-on-stage-at-microsoft.jpg'
  const heroImageAlt = getFromContent(content, 'home', 'images', 'hero_image_alt') || 'Robert Strong, Adam Cheyer (Siri Co-Founder), and Peter Norvig (Google & Stanford AI Researcher) on stage at a Microsoft event'

  return (
    <section className="bg-gradient-to-br from-[#EAEAEE] to-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Content */}
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-[#1E68C6] bg-opacity-10 text-[#1E68C6] rounded-full text-sm font-medium mb-6 font-montserrat">
              <Award className="w-4 h-4 mr-2" />
              {badge || '#1 AI-Exclusive Speaker Bureau'}
            </div>

            {/* Main Headline - Optimized for SEO with bolder hierarchy and modern gradient */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-black mb-4 leading-[1.1] font-neue-haas tracking-tight">
              {title ? (
                <>
                  {title.includes('AI Speaker') ? (
                    <>
                      {title.split('AI Speaker')[0]}
                      <span className="bg-gradient-to-r from-[#1E68C6] via-blue-600 to-[#1E68C6] bg-clip-text text-transparent">AI Speaker</span>
                      {title.split('AI Speaker')[1]}
                    </>
                  ) : (
                    title
                  )}
                </>
              ) : (
                <>Book an <span className="bg-gradient-to-r from-[#1E68C6] via-blue-600 to-[#1E68C6] bg-clip-text text-transparent">AI Speaker</span> for Your Event</>
              )}
            </h1>

            <p className="text-xl md:text-2xl text-gray-800 mb-6 font-montserrat font-semibold leading-tight">
              {subtitle || 'The #1 AI speaker bureau with exclusive access to 70+ AI pioneers including Siri Co-Founders, OpenAI Staff, and Stanford Researchers'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              {/* "Book Speaker Today" button using the Button component with 'gold' variant */}
              <Button
                asChild // Use asChild to render the Link component as the button's child
                variant="gold"
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 font-montserrat"
              >
                <Link href="/contact" className="text-white no-underline">
                  Book Speaker Today
                </Link>
              </Button>
              {/* "Browse Speakers" button using the Button component with 'default' variant */}
              <Button
                asChild // Use asChild to render the Link component as the button's child
                variant="default" // The default variant is blue
                size="lg"
                className="font-montserrat"
              >
                <Link href="/speakers" className="text-white no-underline">
                  Browse Speakers
                </Link>
              </Button>
            </div>

            {/* Social Proof Stat */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                {" "}
                {/* Wrapper for layout */}
                <p className="text-xl font-bold text-black font-neue-haas flex items-center justify-start gap-2 mb-2 sm:mb-0">
                  {" "}
                  {/* Reduced text size from text-2xl to text-xl */}
                  <MapPin className="w-5 h-5 text-[#1E68C6]" /> {/* Adjusted icon size slightly */}
                  Silicon Valley Based
                </p>
                <p className="text-xl font-bold text-black font-neue-haas flex items-center justify-start gap-2">
                  {" "}
                  {/* Reduced text size */}
                  <Globe className="w-5 h-5 text-[#1E68C6]" /> {/* Added Globe icon and adjusted size */}
                  Books Internationally
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative">
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={heroImage}
                alt={heroImageAlt}
                width={700}
                height={467}
                className="w-full h-auto object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 700px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

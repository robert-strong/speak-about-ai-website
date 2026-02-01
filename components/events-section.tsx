"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Loader2 } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EventsSectionProps {
  sectionTitle?: string
  sectionSubtitle?: string
  latestEventTitle?: string
  latestEventDescription?: string
  latestEventCta?: string
  newsletterTitle?: string
  newsletterDescription?: string
  eventImage?: string
}

export default function EventsSection({
  sectionTitle,
  sectionSubtitle,
  latestEventTitle,
  latestEventDescription,
  latestEventCta,
  newsletterTitle,
  newsletterDescription,
  eventImage,
}: EventsSectionProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setEmail("")
        setName("")
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong. Please try again.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to subscribe. Please try again later.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-neue-haas">
            {sectionTitle || 'Our In-Person Events'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-montserrat">
            {sectionSubtitle || 'In addition to helping others find keynote speakers for their events, we also host our own event series in the Bay Area, showcasing the speakers on our roster.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <MapPin className="w-6 h-6 text-[#1E68C6] mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900 font-neue-haas">
                    {latestEventTitle || 'Latest Event'}
                  </h3>
                </div>
                <p className="text-gray-600 mb-6 font-montserrat">
                  {latestEventDescription || 'Our last event, hosted at Microsoft HQ in Silicon Valley, featured speakers such as Adam Cheyer, Peter Norvig, Maya Ackerman, Murray Newlands, Jeremiah Owyang, Katie McMahon, Max Sills, and many more.'}
                </p>
                <div className="mb-6">
                  <Image
                    src={eventImage || '/events/robert-strong-on-stage-at-microsoft.jpg'}
                    alt="AI speaker Robert Strong delivering keynote presentation at Microsoft HQ - Speak About AI bureau event"
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <p className="text-gray-600 font-montserrat">
                  {latestEventCta || "Whether you're an event planner, an executive, or just interested in AI, these events are a great way to get an overview of the current AI landscape!"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <div>
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <Calendar className="w-6 h-6 text-[#1E68C6] mr-3" />
                    <h3 className="text-2xl font-bold text-gray-900 font-neue-haas">
                      {newsletterTitle || 'Stay Updated'}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6 font-montserrat">
                    {newsletterDescription || 'Sign up with your email address to stay up to date on our upcoming events.'}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="Your Name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E68C6] focus:border-transparent"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Your Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E68C6] focus:border-transparent"
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#1E68C6] hover:bg-[#1557A7] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        'Subscribe to Newsletter'
                      )}
                    </Button>
                  </form>

                  {message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${
                      message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-4 text-center font-montserrat">We respect your privacy.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

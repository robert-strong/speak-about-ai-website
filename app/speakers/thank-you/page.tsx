import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SpeakerThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You for Your Application!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            We've received your speaker application and will review it carefully.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              What happens next?
            </h2>
            <ul className="text-left text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                We'll review your application over the next few weeks
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                If we'd like to move forward, we'll reach out to book a time to chat face-to-face
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                If after the meeting we both decide it's a fit, we'll work on building you a page on the website
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                We'll onboard you with our platform and start matching you with speaking opportunities
              </li>
            </ul>
          </div>
          
          <p className="text-gray-600 mb-8">
            In the meantime, feel free to reach out if you have any questions at{" "}
            <a href="mailto:speakers@speakaboutai.com" className="text-blue-600 hover:underline">
              speakers@speakaboutai.com
            </a>
          </p>
          
          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
            <Button asChild>
              <Link href="/about">Learn More About Us</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
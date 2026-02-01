import { Speaker } from "@/lib/speakers-data"

interface SpeakerSEOSectionProps {
  speaker: Speaker
}

export default function SpeakerSEOSection({ speaker }: SpeakerSEOSectionProps) {
  const isAdamCheyer = speaker.slug === 'adam-cheyer'
  
  // Special content for Adam Cheyer to improve rankings
  if (isAdamCheyer) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold mb-6">
              Book Adam Cheyer - Siri Co-Founder & AI Visionary
            </h2>
            
            <p className="text-lg mb-4">
              <strong>Adam Cheyer</strong> is one of the most influential AI pioneers of our time, best known as the 
              <strong> co-founder of Siri</strong>, the groundbreaking virtual assistant acquired by Apple. With over 
              30 years of experience in artificial intelligence, Adam has been at the forefront of conversational AI, 
              natural language processing, and intelligent assistants.
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
              Adam Cheyer's Speaking Topics
            </h3>
            <ul className="space-y-2 mb-6">
              <li>• <strong>The Future of AI Assistants</strong>: From Siri to the Next Generation</li>
              <li>• <strong>Building Conversational AI</strong>: Lessons from Siri and Viv Labs</li>
              <li>• <strong>AI Strategy for Enterprises</strong>: Implementation and Innovation</li>
              <li>• <strong>The Evolution of Human-Computer Interaction</strong></li>
              <li>• <strong>Entrepreneurship in AI</strong>: Building and Scaling AI Companies</li>
            </ul>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
              Career Highlights & Achievements
            </h3>
            <ul className="space-y-2 mb-6">
              <li>• <strong>Co-Founder of Siri</strong> (acquired by Apple for $200+ million)</li>
              <li>• <strong>VP of Engineering at Samsung</strong> - Led Bixby and AI initiatives</li>
              <li>• <strong>Founder of Viv Labs</strong> (acquired by Samsung)</li>
              <li>• <strong>Co-Founder of Sentient Technologies</strong> - Pioneering AI company</li>
              <li>• <strong>SRI International</strong> - Led the team that created Siri</li>
              <li>• <strong>50+ Patents</strong> in AI and natural language processing</li>
            </ul>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
              Book Adam Cheyer for Your Event
            </h3>
            <p className="text-lg mb-4">
              Adam Cheyer delivers inspiring keynote speeches that combine technical expertise with visionary insights 
              about the future of AI. His presentations are perfect for technology conferences, corporate events, 
              innovation summits, and executive briefings. Adam's speaking fee varies based on event type, location, 
              and requirements.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
              <p className="font-semibold text-blue-900">
                Featured Speaking Engagements:
              </p>
              <ul className="mt-2 text-blue-800">
                <li>• TED Talks on AI Innovation</li>
                <li>• Fortune 500 Executive Summits</li>
                <li>• Global AI Conferences</li>
                <li>• University Commencements</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Generic SEO section for other speakers
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold mb-6">
            Book {speaker.name} - Leading AI Keynote Speaker
          </h2>
          
          <p className="text-lg mb-4">
            <strong>{speaker.name}</strong> is a renowned expert in artificial intelligence and {speaker.expertise?.[0] || 'technology innovation'}. 
            {speaker.bio && ` ${speaker.bio.substring(0, 200)}...`}
          </p>

          {speaker.topics && speaker.topics.length > 0 && (
            <>
              <h3 className="text-2xl font-semibold mt-8 mb-4">
                {speaker.name}'s Keynote Topics
              </h3>
              <ul className="space-y-2 mb-6">
                {speaker.topics.slice(0, 6).map((topic, index) => (
                  <li key={index}>• <strong>{topic}</strong></li>
                ))}
              </ul>
            </>
          )}

          <h3 className="text-2xl font-semibold mt-8 mb-4">
            Why Book {speaker.name}?
          </h3>
          <p className="text-lg mb-4">
            {speaker.name} brings unparalleled expertise in {speaker.expertise?.join(', ') || 'AI and technology'}. 
            Perfect for conferences, corporate events, and innovation summits, {speaker.name} delivers 
            actionable insights that inspire and educate audiences worldwide.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
            <p className="font-semibold text-blue-900">
              Book {speaker.name} for Your Next Event
            </p>
            <p className="mt-2 text-blue-800">
              Contact Speak About AI to check availability and get pricing for {speaker.name}.
              We handle all logistics to ensure a seamless speaking engagement.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
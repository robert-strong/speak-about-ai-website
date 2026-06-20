import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Automotive AI Speakers | Auto Industry Experts",
  description:
    "Book automotive AI keynote speakers for auto industry events. Experts in autonomous vehicles and smart manufacturing.", // 119 chars
  keywords:
    "automotive AI speakers, auto industry keynote speakers, autonomous vehicle speakers, automotive technology experts",
  alternates: {
    canonical: "https://speakabout.ai/industries/automotive-ai-speakers",
  },
  // Placeholder page ("coming soon") — keep it out of the index until it has
  // real content so it doesn't drag on site-wide quality. Remove once built.
  robots: { index: false, follow: true },
}

export default function AutomotiveAISpeakersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Automotive AI Speakers</h1>
      <p>Content for Automotive AI Speakers coming soon!</p>
    </div>
  )
}

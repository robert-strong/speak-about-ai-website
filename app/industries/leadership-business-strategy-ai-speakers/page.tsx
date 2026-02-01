import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import LeadershipBusinessStrategyClientPage from "./LeadershipBusinessStrategyClientPage"

export const metadata: Metadata = {
  title: "Leadership AI Speakers | Business Strategy Experts", // 54 chars
  description:
    "Book leadership & business strategy AI keynote speakers for corporate events. Experts on AI transformation, digital leadership & strategic innovation.",
  keywords:
    "leadership keynote speaker, business keynote speaker, AI leadership speakers, business strategy speakers, corporate keynote speakers, executive speakers, digital transformation speakers",
  openGraph: {
    title: "Leadership & Business Strategy AI Keynote Speakers",
    description:
      "Book leadership & business strategy AI keynote speakers. Experts on AI transformation, digital leadership, and strategic innovation for your events.",
    type: "website",
  },
}

export default async function LeadershipBusinessStrategyPage() {
  const speakers = await getSpeakersByIndustry("leadership")

  return <LeadershipBusinessStrategyClientPage speakers={speakers} />
}

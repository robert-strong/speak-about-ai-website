import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import HealthcareKeynoteSpeakersClientPage from "./HealthcareKeynoteSpeakersClientPage"

export const metadata: Metadata = {
  title: "Healthcare AI Keynote Speakers | Medical Experts", // 50 chars
  description:
    "Book top healthcare AI keynote speakers for medical conferences. Experts in medical innovation, patient care, and AI in healthcare.",
  keywords: [
    "healthcare keynote speakers",
    "medical keynote speakers",
    "top healthcare speakers",
    "medical conference speakers",
    "healthcare innovation speakers",
    "digital health keynote",
    "patient care speakers",
    "healthcare technology speakers",
    "AI in healthcare speakers",
  ],
  alternates: {
    canonical: "https://speakabout.ai/industries/healthcare-keynote-speakers",
  },
}

export default async function HealthcareKeynoteSpeakersPage() {
  const healthcareSpeakers = await getSpeakersByIndustry("healthcare")

  return <HealthcareKeynoteSpeakersClientPage speakers={healthcareSpeakers} />
}

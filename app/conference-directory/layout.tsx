import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Event Conference Directory | Speak About AI",
    template: "%s | Conference Directory | Speak About AI",
  },
  description:
    "Browse event industry conferences and find speaking opportunities. Track call for proposals, deadlines, and connect with conference organizers.",
  keywords: [
    "event conferences",
    "speaking opportunities",
    "call for proposals",
    "CFP",
    "event industry",
    "conference directory",
    "MICE conferences",
    "event planning conferences"
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://speakabout.ai/conference-directory",
    siteName: "Speak About AI",
    title: "Event Conference Directory | Speak About AI",
    description:
      "Browse event industry conferences and find speaking opportunities. Track call for proposals, deadlines, and connect with conference organizers.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ConferenceDirectoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

import type { Metadata } from "next"
import type React from "react"

// Post-submission confirmation page: thin by design, so keep it out of the index.
export const metadata: Metadata = {
  title: "Application Received",
  robots: { index: false, follow: true },
}

export default function SpeakerThankYouLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

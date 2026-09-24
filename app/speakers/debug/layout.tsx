import type { Metadata } from "next"
import type React from "react"

// Internal debugging page. Keep it out of the index: it renders a
// "Loading speakers..." shell to crawlers, which Search Console treats as a
// Soft 404.
export const metadata: Metadata = {
  title: "Speakers Debug",
  robots: { index: false, follow: false },
}

export default function SpeakersDebugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from "next"
import type React from "react"

// The speaker application form is linked site-wide (footer) but was kept out
// of search via robots.txt. That produced "Indexed, though blocked by
// robots.txt" in Search Console because Google indexed the URL from links
// without being allowed to fetch it. A noindex tag is the correct signal:
// Google must be able to crawl the page to see it, so robots.txt no longer
// blocks /apply.
export const metadata: Metadata = {
  title: "Apply to Be a Speaker",
  description: "Apply to join the Speak About AI keynote speaker roster.",
  alternates: { canonical: "https://speakabout.ai/apply" },
  robots: { index: false, follow: true },
}

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

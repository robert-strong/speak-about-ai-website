import type { Metadata } from "next"
import type React from "react"

// Internal proposal preview tool. It renders a "Loading proposal..." shell to
// crawlers (Soft 404 in Search Console), so keep it out of the index.
export const metadata: Metadata = {
  title: "Proposal Preview",
  robots: { index: false, follow: false },
}

export default function ProposalPreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

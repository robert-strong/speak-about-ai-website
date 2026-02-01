import type React from "react"
import { Montserrat } from "next/font/google"
// Assuming globals.css is in the root of the app directory
import "../globals.css"
import type { Metadata } from "next"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

// Optional: Define metadata for this specific layout if needed.
// This will be merged with metadata from child pages.
export const metadata: Metadata = {
  // Example: title: "Special Landing Page Layout",
  // Add any specific metadata defaults for pages using this layout
}

export default function NoNavLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      {/* 
        No <head> tag here! Next.js manages the document head.
        This layout is specifically for pages that should NOT have the main navigation or footer.
      */}
      <body
        className={`${montserrat.className} antialiased bg-purple-500`} // Keeping the visual cue
      >
        {children}
      </body>
    </html>
  )
}

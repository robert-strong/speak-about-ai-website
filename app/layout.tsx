import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import TrackingScripts from "@/components/tracking-scripts"
import { ScrollToTopProvider } from "@/components/scroll-to-top-provider"
import { CookieConsent } from "@/components/cookie-consent"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Speak About AI - Premier AI Keynote Speakers Bureau",
    template: "%s | Speak About AI",
  },
  description:
    "Book world-class AI keynote speakers for your next event. Our expert speakers include AI pioneers, researchers, and industry leaders who deliver engaging presentations on artificial intelligence, machine learning, and the future of technology.",
  keywords: [
    "AI speakers",
    "keynote speakers",
    "artificial intelligence",
    "machine learning",
    "technology speakers",
    "AI experts",
    "conference speakers",
  ],
  authors: [{ name: "Speak About AI" }],
  creator: "Speak About AI",
  publisher: "Speak About AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://speakabout.ai"),
  alternates: {
    canonical: "https://speakabout.ai/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://speakabout.ai",
    siteName: "Speak About AI",
    title: "Speak About AI - Premier AI Keynote Speakers Bureau",
    description:
      "Book world-class AI keynote speakers for your next event. Our expert speakers include AI pioneers, researchers, and industry leaders.",
    images: [
      {
        url: "/new-ai-logo.png",
        width: 1200,
        height: 630,
        alt: "Speak About AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Speak About AI - Premier AI Keynote Speakers Bureau",
    description:
      "Book world-class AI keynote speakers for your next event. Our expert speakers include AI pioneers, researchers, and industry leaders.",
    images: ["/new-ai-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    'sitemap': 'https://speakabout.ai/sitemap.xml',
  },
  icons: {
    icon: [
      { url: "/new-ai-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/new-ai-logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/new-ai-logo.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/new-ai-logo.png",
  },
  manifest: "/site.webmanifest",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://images.ctfassets.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.ctfassets.net" />

        <link rel="icon" href="/new-ai-logo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/new-ai-logo.png" />
        <TrackingScripts />
        <script async src="/analytics.js"></script>
        {process.env.NODE_ENV === 'development' && (
          <script src="http://localhost:8097"></script>
        )}
      </head>
      <body className={inter.className}>
        <ScrollToTopProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <CookieConsent />
          <SpeedInsights />
        </ScrollToTopProvider>
      </body>
    </html>
  )
}

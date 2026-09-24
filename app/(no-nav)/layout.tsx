import type React from "react"

// Route-group layout. The root app/layout.tsx already renders <html>, <body>,
// the header and the footer. An earlier version of this file rendered its own
// <html>/<body> here, which nested a second document inside <main> on every
// page in this group and produced invalid HTML for crawlers.
export default function NoNavLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

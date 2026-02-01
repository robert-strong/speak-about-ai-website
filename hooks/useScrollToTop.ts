"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function useScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Check if there's a hash in the URL
    const hash = window.location.hash
    if (hash) {
      // Poll for the element since it might load asynchronously
      let attempts = 0
      const maxAttempts = 20 // Try for up to 2 seconds
      const interval = setInterval(() => {
        const element = document.querySelector(hash)
        if (element) {
          clearInterval(interval)
          element.scrollIntoView({ behavior: "smooth" })
        } else if (++attempts >= maxAttempts) {
          clearInterval(interval)
          // Element not found after timeout, scroll to top
          window.scrollTo(0, 0)
        }
      }, 100)
      return () => clearInterval(interval)
    }
    // No hash, scroll to top
    window.scrollTo(0, 0)
  }, [pathname])
}

"use client"

import { useEffect } from "react"

interface WorkshopAnalyticsTrackerProps {
  workshopId: string
  workshopTitle: string
  workshopSlug: string
  speakerName?: string | null
  speakerSlug?: string | null
  format?: string | null
  topics?: string[] | null
}

export default function WorkshopAnalyticsTracker({
  workshopId,
  workshopTitle,
  workshopSlug,
  speakerName,
  speakerSlug,
  format,
  topics
}: WorkshopAnalyticsTrackerProps) {
  useEffect(() => {
    // Check if Umami is available
    if (typeof window !== 'undefined' && (window as any).umami) {
      // Track the workshop page view event
      (window as any).umami.track('workshop-page-view', {
        workshop_id: workshopId,
        workshop_title: workshopTitle,
        workshop_slug: workshopSlug,
        speaker_name: speakerName || '',
        speaker_slug: speakerSlug || '',
        format: format || '',
        topics: topics?.join(', ') || ''
      })

      console.log('Tracked workshop page view:', workshopTitle)
    }
  }, [workshopId, workshopTitle, workshopSlug, speakerName, speakerSlug, format, topics])

  // This component renders nothing, it just tracks
  return null
}

// Helper function to track workshop CTA clicks
export function trackWorkshopCTAClick(
  workshopId: string,
  workshopTitle: string,
  workshopSlug: string,
  ctaSource: string
) {
  if (typeof window !== 'undefined' && (window as any).umami) {
    (window as any).umami.track('workshop-cta-click', {
      workshop_id: workshopId,
      workshop_title: workshopTitle,
      workshop_slug: workshopSlug,
      cta_source: ctaSource
    })
    console.log('Tracked workshop CTA click:', workshopTitle, 'from', ctaSource)
  }
}

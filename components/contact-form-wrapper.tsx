"use client"

import { useSearchParams } from "next/navigation"
import { CustomContactForm } from "./custom-contact-form"
import { Suspense } from "react"

export interface ContactPageContent {
  keynoteTitle: string
  workshopTitle: string
  keynoteSubtitle: string
  workshopSubtitle: string
  keynoteTabLabel: string
  workshopTabLabel: string
  formTitle: string
  formDescription: string
  contactSectionTitle: string
  eventSectionTitle: string
  additionalSectionTitle: string
  // Keynote-specific
  speakerSectionTitle: string
  speakerSectionDesc: string
  noSpeakerText: string
  budgetSectionTitle: string
  // Workshop-specific
  workshopSectionTitle: string
  workshopSectionDesc: string
  noWorkshopText: string
  participantsTitle: string
  skillLevelTitle: string
  formatTitle: string
  // Help
  needHelpTitle: string
  callLabel: string
  phone: string
  emailLabel: string
  email: string
  newsletterTitle: string
  newsletterDescription: string
  successTitle: string
  successMessage: string
  submitButtonText: string
}

function ContactFormContent({ content }: { content: ContactPageContent }) {
  const searchParams = useSearchParams()
  // Speaker profile pages and /top-ai-speakers link here with ?speaker=<name>;
  // older CTAs use ?speakerName=<name>. Accept both so the "Book this speaker"
  // button actually pre-selects the speaker in the form.
  const speakerName = searchParams.get("speakerName") || searchParams.get("speaker")
  const workshopId = searchParams.get("workshop")

  // Determine initial tab based on URL parameters
  const initialTab = workshopId ? "workshop" : "keynote"

  return (
    <CustomContactForm
      preselectedSpeaker={speakerName || undefined}
      preselectedWorkshopId={workshopId || undefined}
      initialTab={initialTab}
      content={content}
    />
  )
}

export function ContactFormWrapper({ content }: { content: ContactPageContent }) {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading contact form...</p>
      </div>
    }>
      <ContactFormContent content={content} />
    </Suspense>
  )
}
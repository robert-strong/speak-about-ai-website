import type { Metadata } from "next"
import { ContactFormWrapper } from "@/components/contact-form-wrapper"
import { getPageContent, getFromContent } from "@/lib/website-content"

// Force dynamic rendering to prevent hydration mismatches
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Contact AI Speaker Bureau | Speak About AI", // 43 chars
  description:
    "Contact Speak About AI to book top AI keynote speakers. Get personalized recommendations and check availability for your event. Reach out today.",
  keywords: "contact AI speakers, book AI keynote speakers, AI speaker availability, AI speaker bureau contact",
  alternates: {
    canonical: "https://speakabout.ai/contact",
  },
}

export default async function ContactPage() {
  // Fetch editable content from database
  const content = await getPageContent('contact')

  const pageContent = {
    // Header
    keynoteTitle: getFromContent(content, 'contact', 'header', 'keynote_title') || 'Book an AI Keynote Speaker',
    workshopTitle: getFromContent(content, 'contact', 'header', 'workshop_title') || 'Book an AI Workshop',
    keynoteSubtitle: getFromContent(content, 'contact', 'header', 'keynote_subtitle') || "Tell us about your event and we'll match you with the perfect AI expert",
    workshopSubtitle: getFromContent(content, 'contact', 'header', 'workshop_subtitle') || "Tell us about your training needs and we'll find the perfect AI workshop",
    // Tabs
    keynoteTabLabel: getFromContent(content, 'contact', 'tabs', 'keynote_label') || 'Keynote Speaker',
    workshopTabLabel: getFromContent(content, 'contact', 'tabs', 'workshop_label') || 'Workshop',
    // Form
    formTitle: getFromContent(content, 'contact', 'form', 'title') || 'Event Information',
    formDescription: getFromContent(content, 'contact', 'form', 'description') || 'Please provide as much detail as possible about your event',
    contactSectionTitle: getFromContent(content, 'contact', 'form', 'contact_section_title') || 'Contact Information',
    eventSectionTitle: getFromContent(content, 'contact', 'form', 'event_section_title') || 'Event Details',
    additionalSectionTitle: getFromContent(content, 'contact', 'form', 'additional_section_title') || 'Additional Information',
    // Keynote-specific
    speakerSectionTitle: getFromContent(content, 'contact', 'keynote', 'speaker_section_title') || 'Speaker Preferences',
    speakerSectionDesc: getFromContent(content, 'contact', 'keynote', 'speaker_section_desc') || 'Select one or more speakers you are interested in, or let us help you find the right fit.',
    noSpeakerText: getFromContent(content, 'contact', 'keynote', 'no_speaker_text') || "I don't have a specific speaker in mind",
    budgetSectionTitle: getFromContent(content, 'contact', 'keynote', 'budget_section_title') || 'Speaker Budget Range',
    // Workshop-specific
    workshopSectionTitle: getFromContent(content, 'contact', 'workshop', 'workshop_section_title') || 'Workshop Selection',
    workshopSectionDesc: getFromContent(content, 'contact', 'workshop', 'workshop_section_desc') || 'Select a workshop or let us help you find the right one.',
    noWorkshopText: getFromContent(content, 'contact', 'workshop', 'no_workshop_text') || 'Help me find a workshop',
    participantsTitle: getFromContent(content, 'contact', 'workshop', 'participants_title') || 'Number of Participants',
    skillLevelTitle: getFromContent(content, 'contact', 'workshop', 'skill_level_title') || 'Participant Skill Level',
    formatTitle: getFromContent(content, 'contact', 'workshop', 'format_title') || 'Preferred Format',
    // Help
    needHelpTitle: getFromContent(content, 'contact', 'help', 'title') || 'Need Help?',
    callLabel: getFromContent(content, 'contact', 'help', 'call_label') || 'Call us directly',
    phone: getFromContent(content, 'contact', 'help', 'phone') || '+1 (415) 665-2442',
    emailLabel: getFromContent(content, 'contact', 'help', 'email_label') || 'Email us',
    email: getFromContent(content, 'contact', 'help', 'email') || 'human@speakabout.ai',
    // Newsletter
    newsletterTitle: getFromContent(content, 'contact', 'newsletter', 'title') || 'Subscribe to our newsletter',
    newsletterDescription: getFromContent(content, 'contact', 'newsletter', 'description') || 'Get exclusive AI speaker insights, event trends, and industry updates delivered to your inbox.',
    // Success
    successTitle: getFromContent(content, 'contact', 'success', 'title') || 'Request Submitted Successfully!',
    successMessage: getFromContent(content, 'contact', 'success', 'message') || "Thank you for your interest. We'll be in touch within 24 hours with personalized speaker recommendations for your event.",
    // Button
    submitButtonText: getFromContent(content, 'contact', 'buttons', 'submit') || 'Submit Speaker Request',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <ContactFormWrapper content={pageContent} />
      </div>
    </div>
  )
}

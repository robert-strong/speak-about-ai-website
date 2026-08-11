import type { Speaker } from "./speakers-data"

export interface SpeakerFaq {
  question: string
  answer: string
}

// Extract plain topic names whether programs/topics are strings or objects
function getTopicNames(speaker: Speaker): string[] {
  const fromTopics = (speaker.topics || []).filter((t): t is string => typeof t === "string" && t.trim().length > 0)
  if (fromTopics.length > 0) return fromTopics
  return (speaker.expertise || []).filter((t): t is string => typeof t === "string" && t.trim().length > 0)
}

function joinNaturally(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

// Single source of truth for per-speaker FAQs: rendered as visible HTML on the
// profile page AND emitted as FAQPage JSON-LD, so the two can never drift apart.
// Every answer is built only from data we actually have on the speaker record.
export function getSpeakerFaqs(speaker: Speaker): SpeakerFaq[] {
  const faqs: SpeakerFaq[] = []
  const firstName = speaker.name.split(" ")[0]
  const hasFee = speaker.fee && speaker.fee.toLowerCase() !== "please inquire"

  faqs.push({
    question: `What is ${speaker.name}'s speaking fee?`,
    answer: hasFee
      ? `${speaker.name}'s speaking fee is typically ${speaker.fee}. Final pricing depends on the event's location, date, format (in-person or virtual), and specific requirements. Contact Speak About AI for an exact quote for your event.`
      : `${speaker.name}'s speaking fee is available upon request and depends on the event's location, date, format (in-person or virtual), and specific requirements. Contact Speak About AI for an exact quote for your event.`,
  })

  const topicNames = getTopicNames(speaker).slice(0, 5)
  if (topicNames.length > 0) {
    faqs.push({
      question: `What topics does ${speaker.name} speak about?`,
      answer: `${speaker.name} speaks about ${joinNaturally(topicNames)}. Each keynote is customized to the audience and event.`,
    })
  }

  if (speaker.industries && speaker.industries.length > 0) {
    faqs.push({
      question: `What kinds of audiences does ${speaker.name} speak to?`,
      answer: `${speaker.name} regularly speaks to audiences in ${joinNaturally(speaker.industries.slice(0, 5))}, and adapts each talk for both technical and non-technical audiences.`,
    })
  }

  faqs.push({
    question: `Is ${speaker.name} available for virtual events?`,
    answer: `Yes. ${speaker.name} is available for in-person keynotes as well as virtual presentations and webinars for distributed audiences.`,
  })

  if (speaker.location) {
    faqs.push({
      question: `Where is ${speaker.name} based, and does ${firstName} travel for events?`,
      answer: `${speaker.name} is based in ${speaker.location} and is available for speaking engagements worldwide.`,
    })
  }

  faqs.push({
    question: `How do I book ${speaker.name} for my event?`,
    answer: `${speaker.name} is booked through Speak About AI, the AI-exclusive keynote speaker bureau. Share your event date, location, audience, and budget via the contact form, and the team will confirm ${firstName}'s availability, provide exact pricing, and handle the contracting end to end.`,
  })

  return faqs
}

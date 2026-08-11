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
// Hand-authored FAQs (speaker.customFaqs) come first; generated ones fill in
// behind them, skipping any topic a custom FAQ already covers.
export function getSpeakerFaqs(speaker: Speaker): SpeakerFaq[] {
  const custom: SpeakerFaq[] = (speaker.customFaqs || []).filter(
    (f) => f && typeof f.question === "string" && f.question.trim() && typeof f.answer === "string" && f.answer.trim()
  )
  const generated = getGeneratedFaqs(speaker)

  // A generated FAQ is redundant if a custom question shares its key noun
  // (fee, topic, virtual, based/travel, book, audience/industr).
  const covers = (customQ: string, generatedQ: string) => {
    const keys = ["fee", "cost", "topic", "virtual", "based", "travel", "book", "audience", "industr"]
    const cq = customQ.toLowerCase()
    const gq = generatedQ.toLowerCase()
    return keys.some((k) => cq.includes(k) && gq.includes(k))
  }
  const filler = generated.filter((g) => !custom.some((c) => covers(c.question, g.question)))

  return [...custom, ...filler].slice(0, 8)
}

function getGeneratedFaqs(speaker: Speaker): SpeakerFaq[] {
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

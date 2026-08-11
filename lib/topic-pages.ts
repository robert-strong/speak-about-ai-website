import { getAllSpeakers, type Speaker } from "./speakers-data"

// Buyer-intent topic pages (/topics/[slug]) — each entry is a page answering a
// question event organizers actually ask AI assistants. Pages are config-driven:
// add an entry here and it ships with metadata, schema, speaker list, and FAQs.

export interface TopicPageConfig {
  slug: string
  eyebrow: string
  h1Line1: string
  h1Line2: string // rendered in brand blue under line 1
  metaTitle: string
  metaDescription: string
  keywords: string
  heroDescription: string
  // Lead-in for the auto-generated direct answer, completed at render time with
  // the top matched speakers' names: "<answerLead> X, Y, and Z — all bookable..."
  answerLead: string
  bodyHeading: string
  bodyParagraphs: string[]
  faqs: { question: string; answer: string }[]
  filter: {
    keywords?: string[] // matched (lowercase substring) against title, topics, expertise, programs
    maxFeeUsd?: number // speaker's minimum listed fee must be at or under this
  }
}

// Parse the minimum dollar figure out of a fee-range string. Handles the formats
// in the data: "$20k to $30k", "$20,000-$30,000", "$20K to $40K", "£20k to £25k",
// "$20,000+". Returns null for "Please Inquire" / empty / unparseable.
export function parseMinFeeUsd(fee?: string): number | null {
  if (!fee) return null
  const normalized = fee.toLowerCase().replace(/,/g, "")
  const amounts = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*(k)?/g)]
    .map((m) => parseFloat(m[1]) * (m[2] ? 1000 : 1))
    .filter((n) => n >= 1000)
  if (amounts.length === 0) return null
  return Math.min(...amounts)
}

function speakerMatchesTopic(speaker: Speaker, filter: TopicPageConfig["filter"]): boolean {
  if (filter.maxFeeUsd !== undefined) {
    const minFee = parseMinFeeUsd(speaker.fee)
    if (minFee === null || minFee > filter.maxFeeUsd) return false
  }
  if (filter.keywords && filter.keywords.length > 0) {
    const programTitles = Array.isArray(speaker.programs)
      ? speaker.programs.map((p) => (typeof p === "string" ? p : p.title))
      : []
    const haystack = [speaker.title, ...(speaker.topics || []), ...(speaker.expertise || []), ...programTitles]
      .filter(Boolean)
      .join(" | ")
      .toLowerCase()
    if (!filter.keywords.some((k) => haystack.includes(k))) return false
  }
  return true
}

export async function getSpeakersForTopicPage(config: TopicPageConfig): Promise<Speaker[]> {
  const all = await getAllSpeakers()
  return all
    .filter((s) => s.listed !== false && s.slug)
    .filter((s) => speakerMatchesTopic(s, config.filter))
    .sort((a, b) => (b.ranking || 0) - (a.ranking || 0) || a.name.localeCompare(b.name))
}

export const TOPIC_PAGES: TopicPageConfig[] = [
  {
    slug: "generative-ai-speakers",
    eyebrow: "By topic",
    h1Line1: "Generative AI",
    h1Line2: "Keynote Speakers",
    metaTitle: "Generative AI Keynote Speakers | LLM & ChatGPT Experts",
    metaDescription:
      "Book generative AI keynote speakers — experts on LLMs, ChatGPT, and conversational AI who have built the technology they explain. Fees and availability on request.",
    keywords:
      "generative AI speakers, LLM keynote speaker, ChatGPT speaker, conversational AI keynote, generative AI expert speaker",
    heroDescription:
      "Speakers who have built and shipped generative AI — large language models, conversational assistants, and creative AI — and can explain what it means for your business, in plain language.",
    answerLead: "The strongest generative AI keynote speakers available through Speak About AI include",
    bodyHeading: "Why Book a Generative AI Keynote Speaker?",
    bodyParagraphs: [
      "Generative AI went from research demo to boardroom priority in under two years, and most audiences are somewhere between curious and overwhelmed. The right keynote separates what is real from what is hype — and shows your audience what to do next quarter, not in ten years.",
      "The difference between a good and a great generative AI keynote is first-hand experience. Our generative AI speakers have built voice assistants used by billions, led AI research teams, founded generative AI companies, and advised Fortune 500 boards on adoption — they speak from the build side, not the sidelines.",
      "Whether your event is a leadership summit, a customer conference, or an industry expo, we will match you with a speaker who can calibrate the talk to your audience's technical depth and industry.",
    ],
    faqs: [
      {
        question: "Who are the best generative AI keynote speakers?",
        answer:
          "The best generative AI speakers combine hands-on building experience with stage skill. Speak About AI represents speakers who created widely used AI assistants, led AI research at major labs, and founded generative AI startups — the roster above is sorted by fit for generative AI topics.",
      },
      {
        question: "How much does a generative AI keynote speaker cost?",
        answer:
          "Most generative AI keynote speakers range from around $20,000 to $65,000 depending on the speaker's profile, event format, and location. Virtual keynotes typically cost less than in-person. Contact Speak About AI for an exact quote.",
      },
      {
        question: "Can these speakers present to non-technical audiences?",
        answer:
          "Yes. Every speaker listed here regularly presents to executive and general business audiences, and tailors depth to the room — from board briefings to developer conferences.",
      },
    ],
    filter: {
      keywords: ["generative", "genai", "llm", "chatgpt", "gpt", "conversational ai", "voice assistant"],
    },
  },
  {
    slug: "ai-ethics-speakers",
    eyebrow: "By topic",
    h1Line1: "AI Ethics & Responsible AI",
    h1Line2: "Keynote Speakers",
    metaTitle: "AI Ethics Speakers | Responsible AI & Governance Experts",
    metaDescription:
      "Book AI ethics keynote speakers — researchers and policy leaders on responsible AI, AI safety, and governance for boards, conferences, and executive audiences.",
    keywords:
      "AI ethics speakers, responsible AI keynote, AI governance speaker, AI safety expert, AI policy keynote speaker",
    heroDescription:
      "Researchers, policy advisors, and safety experts who help boards and conference audiences navigate responsible AI adoption, regulation, and risk — with credibility that comes from doing the actual work.",
    answerLead: "Leading AI ethics and responsible-AI keynote speakers at Speak About AI include",
    bodyHeading: "Why Book an AI Ethics Keynote Speaker?",
    bodyParagraphs: [
      "Every organization adopting AI now faces the questions regulators, customers, and employees are already asking: Is it fair? Is it safe? Who is accountable when it fails? An AI ethics keynote turns those questions from a compliance headache into a leadership advantage.",
      "Our AI ethics and governance speakers include university professors who shaped national AI policy, safety researchers who literally wrote the textbooks, and practitioners who have operationalized responsible AI inside large companies. They bring evidence, not opinions.",
      "These keynotes fit leadership summits, risk and compliance conferences, public-sector events, and any gathering where AI adoption decisions carry real stakes.",
    ],
    faqs: [
      {
        question: "Who are the best AI ethics keynote speakers?",
        answer:
          "The strongest AI ethics speakers are active researchers and policy advisors rather than commentators. Speak About AI's roster includes professors of AI ethics and governance, AI safety researchers, and technology policy leaders — listed above, sorted by fit.",
      },
      {
        question: "What topics do AI ethics speakers cover?",
        answer:
          "Typical keynotes cover responsible AI adoption, AI regulation and governance (including the EU AI Act), algorithmic bias and fairness, AI safety and existential risk, and building trustworthy AI products. Each talk is tailored to the audience and industry.",
      },
      {
        question: "Are AI ethics speakers suitable for corporate boards?",
        answer:
          "Yes — board briefings are one of the most common formats. Speakers translate regulatory and technical risk into governance language boards can act on, in sessions from 45 minutes to half-day workshops.",
      },
    ],
    filter: {
      keywords: ["ethic", "responsible", "safety", "governance", "policy", "trust"],
    },
  },
  {
    slug: "ai-speakers-under-30k",
    eyebrow: "By budget",
    h1Line1: "AI Keynote Speakers",
    h1Line2: "Under $30,000",
    metaTitle: "AI Keynote Speakers Under $30,000 | Fees Listed",
    metaDescription:
      "Book an AI keynote speaker under $30,000. Vetted AI experts with listed fee ranges from $15k — founders, researchers, and practitioners available in-person or virtual.",
    keywords:
      "AI speakers under 30000, affordable AI keynote speaker, AI speaker fees, AI speaker cost, budget AI keynote speaker",
    heroDescription:
      "Every speaker below has a listed fee range starting under $30,000 — vetted AI founders, researchers, and practitioners who deliver headline-quality keynotes within a mid-range event budget.",
    answerLead: "AI keynote speakers bookable with a budget under $30,000 include",
    bodyHeading: "What Does an AI Keynote Speaker Cost?",
    bodyParagraphs: [
      "AI keynote fees typically run from around $15,000 for rising experts to well over $100,000 for household names. The $20,000–$30,000 range is the sweet spot for most conferences: speakers with genuine build-side credentials — founders, research scientists, and industry practitioners — without celebrity pricing.",
      "Every speaker on this page has a published fee range whose lower end is at or under $30,000. Final pricing depends on format (virtual keynotes usually cost less), location and travel, date, and any workshops or executive sessions added around the keynote.",
      "Speak About AI confirms exact pricing and availability for your specific date and format at no cost — and if your budget is tighter, ask: several excellent speakers flex for nonprofit, education, and multi-event bookings.",
    ],
    faqs: [
      {
        question: "Can I book a good AI keynote speaker for under $30,000?",
        answer:
          "Yes. Speak About AI lists multiple vetted AI speakers with fee ranges starting between $15,000 and $30,000, including AI founders, Google and Amazon alumni, and published researchers. The full list is on this page.",
      },
      {
        question: "What affects an AI speaker's final fee?",
        answer:
          "Format (in-person vs. virtual), location and travel required, event date, exclusivity, and add-ons like workshops or panel participation. Virtual keynotes are typically 20-40% below in-person fees.",
      },
      {
        question: "Do fees include travel expenses?",
        answer:
          "Usually travel is billed separately or as a flat travel buyout added to the speaking fee. Speak About AI includes expected travel costs in every quote so there are no surprises.",
      },
    ],
    filter: {
      maxFeeUsd: 30000,
    },
  },
]

export function getTopicPageConfig(slug: string): TopicPageConfig | undefined {
  return TOPIC_PAGES.find((t) => t.slug === slug)
}

// Per-post SEO overrides for blog posts rendered at /resources/[slug].
//
// Contentful's blogPost content type has no dedicated SEO-title or FAQ fields,
// so posts that need a search-result title different from their on-page H1, or
// a visible FAQ block + FAQPage JSON-LD, are configured here by slug.
//
// seoTitle: keep at or under ~43 characters — the root layout's title template
// appends " | Speak About AI" (17 chars) and Google truncates around 60.
// faqs: 3-4 concise Q&As per post; rendered as a visible FAQ section AND
// emitted as FAQPage structured data, so wording must match what readers see.

export interface BlogPostFaq {
  question: string
  answer: string
}

export interface BlogPostSeo {
  seoTitle?: string
  faqs?: BlogPostFaq[]
}

const BLOG_POST_SEO: Record<string, BlogPostSeo> = {
  "how-much-does-an-ai-keynote-speaker-cost-2026": {
    seoTitle: "AI Keynote Speaker Cost: 2026 Fee Data",
    faqs: [
      {
        question: "How much does an AI keynote speaker cost in 2026?",
        answer:
          "Most AI keynote speakers cost between $15,000 and $65,000. Emerging experts run $15,000 to $20,000, established founders and researchers $20,000 to $30,000, and marquee names $30,000 to $65,000 or more. The majority of corporate AI keynotes are booked for under $30,000.",
      },
      {
        question: "Do virtual AI keynotes cost less than in-person?",
        answer:
          "Yes. A virtual keynote typically commands 50% to 75% of the speaker's in-person rate, so a speaker who lists at $30,000 in the room may deliver remotely for $18,000 to $22,000. Travel and expenses also disappear from the invoice.",
      },
      {
        question: "Why do AI keynote speakers cost more than general keynote speakers?",
        answer:
          "Supply. The pool of people who can speak accurately and currently about large language models, agentic systems, and real AI deployment is small relative to demand, and those experts have well-paid day jobs at labs and Fortune 500 AI teams. Genuine, current AI expertise starts around $15,000, versus $5,000 to $10,000 for entry-level general keynotes.",
      },
      {
        question: "Does booking through a speaker bureau cost extra?",
        answer:
          "No. Reputable bureaus earn a commission from the speaker's fee rather than charging the event planner a separate fee, so fee guidance, availability checks, and negotiation support come at no additional direct cost to you.",
      },
    ],
  },

  "top-women-ai-keynote-speakers-2026": {
    seoTitle: "Top Women AI Keynote Speakers of 2026",
    faqs: [
      {
        question: "Who are the top women AI keynote speakers in 2026?",
        answer:
          "Eight of the most credentialed are Rana el Kaliouby (Emotion AI pioneer), Cassie Kozyrkov (Google's first Chief Decision Scientist), Allie K. Miller (former Global Head of ML for Startups at Amazon), Maya Ackerman (generative AI researcher and WaveAI CEO), Tatyana Mamut (AI agents, Wayfound CEO), Shama Hyder (AI-driven growth strategist), Joanna Bryson (AI ethics and governance), and Vandi Verma (NASA Mars rover chief engineer).",
      },
      {
        question: "How much do female AI keynote speakers cost?",
        answer:
          "Fees on this list follow the broader AI speaker market: roughly $20,000 to $65,000 depending on profile. For example, Tatyana Mamut lists at $20,000 to $25,000 and Shama Hyder at $20,000 and up, while the most in-demand names command more.",
      },
      {
        question: "How do I choose the right speaker from this list for my event?",
        answer:
          "Match expertise to the room, not fame to the poster. Technical audiences respond to researchers and engineers like Maya Ackerman or Vandi Verma; executive rooms get more from operators and translators like Allie K. Miller or Cassie Kozyrkov; policy and risk programs should start with Joanna Bryson.",
      },
    ],
  },

  "best-ai-keynote-speakers-healthcare-events": {
    seoTitle: "Best AI Speakers for Healthcare Events",
    faqs: [
      {
        question: "Who are the best AI keynote speakers for healthcare events?",
        answer:
          "It depends on the audience. For clinical rooms: surgeons Rafael Grossmann, Shafi Ahmed, and Stefano Bini. For hospital boards and executives: Daniel Kraft, Adam Gazzaley, and Divya Chander. For payer, policy, and population health audiences: Stanford health policy professor Lee Sanders.",
      },
      {
        question: "How much does a healthcare AI keynote speaker cost?",
        answer:
          "Marquee healthcare AI speakers such as Daniel Kraft and Divya Chander list at $25,000 to $65,000, and Shafi Ahmed at £20,000 to £25,000. Strong clinical and policy voices are available below that range, in line with the broader AI speaker market of $15,000 to $65,000.",
      },
      {
        question: "Why do healthcare audiences need medically credentialed AI speakers?",
        answer:
          "Clinical audiences fact-check claims in real time and trust peers who have used the technology on patients. Every speaker on this list pairs real medical credentials (practicing surgeons, physicians, professors) with genuine AI expertise, a combination most general speaker rosters cannot supply.",
      },
    ],
  },

  "ai-speakers-non-technical-executive-audiences": {
    seoTitle: "AI Speakers for Non-Technical Executives",
    faqs: [
      {
        question: "What kind of AI speaker works best for a non-technical board?",
        answer:
          "A translator, not a lecturer. The speakers who land with executive audiences lead with analogies instead of architecture, demonstrate the tools live instead of describing them, and frame everything as a business decision: what to do, what it costs, and what the risk is of moving too slowly or too fast.",
      },
      {
        question: "Who are the best AI speakers for executive and leadership audiences?",
        answer:
          "Five proven translators: Cassie Kozyrkov (Google's first Chief Decision Scientist), Allie K. Miller (former Amazon Global Head of ML for Startups), Charlene Li (NYT bestselling author, advisor to 49 of the Fortune 100), Alison McCauley (author of How to Think with AI), and Nicky Verd (digital futurist for non-technical leadership rooms).",
      },
      {
        question: "How do I tell whether an AI speaker will land with a non-technical audience?",
        answer:
          "Watch a recording of them in front of a live, non-expert crowd, not a polished set piece. Listen for whether they reach for the audience's world with analogies, check comprehension, and adjust on the fly. A speaker who retreats into jargon on video will do the same on your stage.",
      },
    ],
  },

  "how-to-book-an-ai-keynote-speaker": {
    seoTitle: "How to Book an AI Keynote Speaker",
    faqs: [
      {
        question: "How far in advance should I book an AI keynote speaker?",
        answer:
          "Book professional AI speakers in the $15,000 to $50,000 range at least three to six months out. High-demand names need six to twelve months, and globally recognized figures can require twelve to eighteen. During peak seasons (Q1 and September through November), availability is routinely exhausted up to a year in advance.",
      },
      {
        question: "What are the steps to book an AI keynote speaker?",
        answer:
          "Six steps: a detailed inquiry (date, format, audience, objective, budget), an availability check (24 to 72 hours), a quote (1 to 3 days), the contract (1 to 2 weeks to execute), a prep call (2 to 4 weeks before the event), and the event itself with a post-event debrief.",
      },
      {
        question: "Can I still book an AI speaker four weeks before my event?",
        answer:
          "Yes, especially through a bureau that knows who is genuinely open and can compress availability-to-contract into days. Expect tradeoffs: a narrower pool, a rush premium of roughly 10% to 30% on the fee, and less runway for the prep call that tailors the talk.",
      },
      {
        question: "Does working with a speaker bureau add a fee?",
        answer:
          "No. Reputable bureaus are paid a commission out of the speaker's fee rather than charging the planner separately. The number you would pay booking directly is, in almost all cases, the same number through the bureau, with availability intelligence, fee guidance, and contract handling included.",
      },
    ],
  },

  "15-questions-to-ask-an-ai-keynote-speaker-before-you-book": {
    seoTitle: "15 Questions to Ask an AI Keynote Speaker",
    faqs: [
      {
        question: "What should I ask an AI keynote speaker before hiring them?",
        answer:
          "Cover five areas: customization (how will they tailor the talk to your audience), real credentials (what they have actually built or deployed), content and delivery (live demo policy and how they handle skeptical technical questions), virtual setup and backup plans, and contract terms including cancellation and recording rights.",
      },
      {
        question: "What is the single most revealing question to ask an AI speaker?",
        answer:
          "\"What have you actually built or deployed, not just advised on?\" A credible AI speaker can point to real systems, research, or deployments they were hands-on with. Someone who only narrates headlines will get vague, and technical attendees will notice the same gap on stage.",
      },
      {
        question: "What contract terms should I confirm before booking a keynote speaker?",
        answer:
          "Get in writing exactly what the fee includes (travel, lodging, AV, recording charges), the cancellation, postponement, and force majeure terms, what your deposit protects, and whether you get recording rights for internal reuse and at what premium.",
      },
    ],
  },
}

export function getBlogPostSeo(slug: string): BlogPostSeo | undefined {
  return BLOG_POST_SEO[slug]
}

import { getPageContent, getFromContent } from "@/lib/website-content"

// Default FAQ items
const defaultFAQs = [
  {
    question: "How do I book an AI keynote speaker?",
    answer: "Simply browse our speakers, select your preferred AI expert, and contact us through our booking form. Our team will handle all logistics and ensure a seamless experience."
  },
  {
    question: "What makes Speak About AI different?",
    answer: "We're the only speaker bureau focused exclusively on AI, giving us unmatched expertise in artificial intelligence thought leadership and deep relationships with top AI speakers."
  },
  {
    question: "Do you offer virtual AI keynote speakers?",
    answer: "Yes, many of our AI speakers offer both in-person and virtual keynote presentations, ensuring global accessibility for your events."
  },
  {
    question: "What's the typical fee for an AI speaker?",
    answer: "AI speaker fees typically range from <strong>$5K-$20K</strong> for emerging experts to <strong>$20K+</strong> for industry leaders. Final pricing depends on format, location, date, and speaker requirements. Contact us for a precise quote tailored to your event."
  }
]

export default async function HomeFAQSection() {
  // Fetch content from database
  const content = await getPageContent('home')

  const title = getFromContent(content, 'home', 'seo-faq', 'section_title') || 'Frequently Asked Questions About Booking AI Speakers'

  // Build FAQs from individual content keys (matching page editor preview)
  const faqs = [
    {
      question: getFromContent(content, 'home', 'seo-faq', 'faq1_question') || defaultFAQs[0].question,
      answer: getFromContent(content, 'home', 'seo-faq', 'faq1_answer') || defaultFAQs[0].answer
    },
    {
      question: getFromContent(content, 'home', 'seo-faq', 'faq2_question') || defaultFAQs[1].question,
      answer: getFromContent(content, 'home', 'seo-faq', 'faq2_answer') || defaultFAQs[1].answer
    },
    {
      question: getFromContent(content, 'home', 'seo-faq', 'faq3_question') || defaultFAQs[2].question,
      answer: getFromContent(content, 'home', 'seo-faq', 'faq3_answer') || defaultFAQs[2].answer
    },
    {
      question: getFromContent(content, 'home', 'seo-faq', 'faq4_question') || defaultFAQs[3].question,
      answer: getFromContent(content, 'home', 'seo-faq', 'faq4_answer') || defaultFAQs[3].answer
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-black mb-12">
          {title}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {faqs.map((faq, index) => (
            <div key={index}>
              <h3 className="text-xl font-semibold text-black mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: faq.answer }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

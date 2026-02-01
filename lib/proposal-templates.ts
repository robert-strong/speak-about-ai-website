import type { Service, Deliverable, PaymentMilestone } from "./proposals-db"

export interface ProposalTemplate {
  id: string
  name: string
  description: string
  category: "keynote" | "workshop" | "virtual" | "multi-day" | "custom"
  defaultData: {
    title?: string
    executive_summary?: string
    services: Service[]
    deliverables: Deliverable[]
    payment_schedule: PaymentMilestone[]
    payment_terms?: string
    why_us?: string
    terms_conditions?: string
  }
}

export const proposalTemplates: ProposalTemplate[] = [
  {
    id: "keynote-standard",
    name: "Standard Keynote",
    description: "Single keynote presentation with standard terms",
    category: "keynote",
    defaultData: {
      title: "Keynote Speaking Engagement Proposal",
      executive_summary: "We are pleased to present this proposal for a keynote presentation at your upcoming event. Our speaker will deliver an engaging and insightful presentation tailored to your audience's needs and objectives.",
      services: [
        {
          name: "Keynote Presentation",
          description: "60-minute keynote address on AI and its transformative impact",
          price: 15000,
          included: true
        },
        {
          name: "Q&A Session",
          description: "15-minute interactive Q&A following the keynote",
          price: 0,
          included: true
        },
        {
          name: "Pre-event Consultation",
          description: "Virtual meeting to align on objectives and customize content",
          price: 0,
          included: true
        }
      ],
      deliverables: [
        {
          name: "Customized Presentation",
          description: "Tailored content specific to your industry and audience",
          timeline: "1 week before event"
        },
        {
          name: "Speaker Bio & Headshot",
          description: "Professional bio and high-resolution photo for promotional use",
          timeline: "Upon contract signing"
        },
        {
          name: "Presentation Slides",
          description: "PDF version of presentation slides for attendees",
          timeline: "Within 24 hours after event"
        }
      ],
      payment_schedule: [
        {
          amount: 0,
          percentage: 50,
          due_date: "Upon contract signing",
          description: "Initial deposit"
        },
        {
          amount: 0,
          percentage: 50,
          due_date: "Within 30 days after event",
          description: "Final payment"
        }
      ],
      payment_terms: "Payment is due according to the schedule outlined above. Invoices will be sent electronically. A 1.5% monthly late fee applies to overdue balances.",
      why_us: "Speak About AI brings unparalleled expertise in artificial intelligence and its practical applications across industries. Our speakers are recognized thought leaders who combine deep technical knowledge with exceptional presentation skills. We pride ourselves on delivering actionable insights that inspire and empower audiences to embrace AI-driven transformation.",
      terms_conditions: "This proposal is valid for 30 days from the date of issue. Travel expenses (if applicable) will be billed separately at cost. Cancellation within 30 days of the event will incur a 50% fee. Force majeure events will be handled on a case-by-case basis."
    }
  },
  {
    id: "workshop-halfday",
    name: "Half-Day Workshop",
    description: "Interactive workshop with hands-on activities",
    category: "workshop",
    defaultData: {
      title: "AI Workshop Proposal",
      executive_summary: "This proposal outlines an interactive half-day workshop designed to provide your team with practical, hands-on experience in leveraging AI for business transformation.",
      services: [
        {
          name: "Half-Day Workshop",
          description: "4-hour interactive workshop with hands-on exercises",
          price: 25000,
          included: true
        },
        {
          name: "Workshop Materials",
          description: "Comprehensive workbooks and digital resources for all participants",
          price: 0,
          included: true
        },
        {
          name: "Pre-workshop Survey",
          description: "Assessment to customize content to participant needs",
          price: 0,
          included: true
        },
        {
          name: "Post-workshop Support",
          description: "30 days of email support for implementation questions",
          price: 0,
          included: true
        }
      ],
      deliverables: [
        {
          name: "Custom Workshop Curriculum",
          description: "Tailored content based on pre-workshop survey results",
          timeline: "1 week before workshop"
        },
        {
          name: "Participant Workbooks",
          description: "Printed and digital workbooks for all attendees",
          timeline: "Day of workshop"
        },
        {
          name: "Resource Library Access",
          description: "6-month access to online resources and templates",
          timeline: "Within 48 hours after workshop"
        },
        {
          name: "Workshop Recording",
          description: "Video recording of the session for future reference",
          timeline: "Within 1 week after workshop"
        }
      ],
      payment_schedule: [
        {
          amount: 0,
          percentage: 50,
          due_date: "Upon contract signing",
          description: "Initial deposit"
        },
        {
          amount: 0,
          percentage: 50,
          due_date: "Within 30 days after workshop",
          description: "Final payment"
        }
      ],
      payment_terms: "Payment is due according to the schedule outlined above. Workshop materials and setup are included in the fee. Maximum 30 participants for optimal interaction.",
      why_us: "Our workshops are designed for maximum impact and practical application. We combine cutting-edge AI knowledge with proven adult learning methodologies to ensure participants leave with actionable skills they can implement immediately.",
      terms_conditions: "Minimum 15 participants required. Maximum 30 participants for optimal learning experience. Client to provide venue, AV equipment, and catering. Cancellation within 30 days incurs a 50% fee."
    }
  },
  {
    id: "virtual-keynote",
    name: "Virtual Keynote",
    description: "Online keynote presentation with virtual engagement",
    category: "virtual",
    defaultData: {
      title: "Virtual Keynote Presentation Proposal",
      executive_summary: "We are excited to offer a dynamic virtual keynote presentation that will engage and inspire your remote audience with cutting-edge insights on AI transformation.",
      services: [
        {
          name: "Virtual Keynote Presentation",
          description: "45-minute live virtual keynote via your preferred platform",
          price: 10000,
          included: true
        },
        {
          name: "Interactive Q&A",
          description: "15-minute moderated Q&A session",
          price: 0,
          included: true
        },
        {
          name: "Technical Rehearsal",
          description: "Pre-event tech check and rehearsal",
          price: 0,
          included: true
        },
        {
          name: "Recording Rights",
          description: "Permission to record and share the presentation",
          price: 2500,
          included: false
        }
      ],
      deliverables: [
        {
          name: "Platform Setup Support",
          description: "Assistance with virtual platform configuration",
          timeline: "1 week before event"
        },
        {
          name: "Digital Presentation Kit",
          description: "Speaker bio, headshot, and promotional materials",
          timeline: "Upon contract signing"
        },
        {
          name: "Interactive Polls/Surveys",
          description: "Engagement tools integrated into the presentation",
          timeline: "During presentation"
        },
        {
          name: "Follow-up Resources",
          description: "Curated resources and presentation slides",
          timeline: "Within 24 hours after event"
        }
      ],
      payment_schedule: [
        {
          amount: 0,
          percentage: 100,
          due_date: "Within 30 days after event",
          description: "Full payment"
        }
      ],
      payment_terms: "Full payment due within 30 days after the event. No travel expenses required for virtual presentations.",
      why_us: "We have perfected the art of virtual presentation, using advanced engagement techniques to create an experience that rivals in-person events. Our speakers are experts at connecting with remote audiences and delivering value through the screen.",
      terms_conditions: "Client responsible for virtual platform and technical support. Speaker will use professional audio/video equipment and stable internet connection. Recording rights available for additional fee."
    }
  },
  {
    id: "multi-day-conference",
    name: "Multi-Day Conference",
    description: "Multiple sessions across conference days",
    category: "multi-day",
    defaultData: {
      title: "Conference Speaking Engagement Proposal",
      executive_summary: "We are thrilled to propose a comprehensive speaking package for your multi-day conference, including keynote presentations, workshop sessions, and panel participation.",
      services: [
        {
          name: "Opening Keynote",
          description: "60-minute opening keynote to set the conference tone",
          price: 20000,
          included: true
        },
        {
          name: "Breakout Workshop",
          description: "90-minute deep-dive workshop session",
          price: 10000,
          included: true
        },
        {
          name: "Panel Participation",
          description: "Participation in one expert panel discussion",
          price: 5000,
          included: true
        },
        {
          name: "Meet & Greet Session",
          description: "1-hour networking session with attendees",
          price: 0,
          included: true
        },
        {
          name: "Closing Remarks",
          description: "15-minute closing ceremony participation",
          price: 0,
          included: false
        }
      ],
      deliverables: [
        {
          name: "Conference Materials",
          description: "All presentation materials and handouts",
          timeline: "2 weeks before conference"
        },
        {
          name: "Promotional Assets",
          description: "Video trailer, bio, and marketing materials",
          timeline: "6 weeks before conference"
        },
        {
          name: "Social Media Promotion",
          description: "Pre and during conference social media support",
          timeline: "Starting 4 weeks before"
        },
        {
          name: "Post-Conference Report",
          description: "Key insights and recommendations from the event",
          timeline: "Within 2 weeks after conference"
        }
      ],
      payment_schedule: [
        {
          amount: 0,
          percentage: 33,
          due_date: "Upon contract signing",
          description: "Initial deposit"
        },
        {
          amount: 0,
          percentage: 33,
          due_date: "30 days before conference",
          description: "Second payment"
        },
        {
          amount: 0,
          percentage: 34,
          due_date: "Within 30 days after conference",
          description: "Final payment"
        }
      ],
      payment_terms: "Payment schedule accommodates the extended engagement period. Travel and accommodation expenses billed separately at cost plus 10% coordination fee.",
      why_us: "Our speakers excel at multi-day engagements, maintaining energy and providing consistent value throughout the conference. We understand how to pace content across multiple touchpoints for maximum impact.",
      terms_conditions: "Minimum 2-day engagement. Maximum 4 sessions per day. Client provides all logistics support including transportation between venues. Speaker retains right to promote participation."
    }
  },
  {
    id: "custom-engagement",
    name: "Custom Engagement",
    description: "Fully customizable proposal template",
    category: "custom",
    defaultData: {
      title: "Custom Speaking Engagement Proposal",
      executive_summary: "This proposal is tailored to meet your specific requirements and objectives.",
      services: [
        {
          name: "Custom Service 1",
          description: "Description to be customized",
          price: 0,
          included: true
        }
      ],
      deliverables: [
        {
          name: "Custom Deliverable 1",
          description: "Description to be customized",
          timeline: "To be determined"
        }
      ],
      payment_schedule: [
        {
          amount: 0,
          percentage: 50,
          due_date: "Upon contract signing",
          description: "Initial deposit"
        },
        {
          amount: 0,
          percentage: 50,
          due_date: "Within 30 days after event",
          description: "Final payment"
        }
      ],
      payment_terms: "To be customized based on engagement specifics.",
      why_us: "We excel at creating custom solutions that perfectly match your unique needs and objectives.",
      terms_conditions: "Terms to be customized based on engagement requirements."
    }
  }
]

export function getTemplateById(id: string): ProposalTemplate | undefined {
  return proposalTemplates.find(template => template.id === id)
}

export function getTemplatesByCategory(category: ProposalTemplate["category"]): ProposalTemplate[] {
  return proposalTemplates.filter(template => template.category === category)
}
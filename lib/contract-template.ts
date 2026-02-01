import type { Deal } from "./deals-db"

export interface ContractData extends Deal {
  contract_number: string
  speaker_name?: string
  speaker_email?: string
  speaker_fee?: number
  payment_terms?: string
  additional_terms?: string
  
  // Virtual event fields
  event_platform?: string
  event_timezone?: string
  presentation_duration?: string
  recording_usage?: string
  recording_permission?: string
  recording_distribution?: string
  recording_usage_period?: string
  governing_law?: string
  
  // Travel fields
  travel_required?: boolean
  flight_required?: boolean
  flight_class?: string
  hotel_required?: boolean
  hotel_dates?: string
  airport_transfers?: string
  local_transportation?: string
  travel_stipend?: number
  travel_stipend_coverage?: string
}

export interface ContractTemplate {
  version: string
  title: string
  sections: ContractSection[]
}

export interface ContractSection {
  id: string
  title: string
  content: string
  required: boolean
}

export const VIRTUAL_EVENT_TEMPLATE: ContractTemplate = {
  version: "v1.0-virtual",
  title: "Virtual Speaker Engagement Agreement",
  sections: [
    {
      id: "parties",
      title: "Parties",
      content: `This Virtual Speaker Engagement Agreement ("Agreement") is entered into on {{contract_date}} between:

**Client:** {{client_name}} ({{client_company}})
**Email:** {{client_email}}
**Phone:** {{client_phone}}

**Speaker:** {{speaker_name}}
**Email:** {{speaker_email}}

**Event Details:**
- **Event Title:** {{event_title}}
- **Event Date:** {{event_date}}
- **Platform:** {{event_platform}}
- **Event Type:** Virtual Presentation
- **Expected Attendees:** {{attendee_count}}
- **Time Zone:** {{event_timezone}}`,
      required: true
    },
    {
      id: "services",
      title: "Services to be Provided",
      content: `The Speaker agrees to provide the following services:

1. **Virtual Presentation:** Deliver a virtual presentation/keynote via the designated platform
2. **Duration:** {{presentation_duration}} presentation plus Q&A
3. **Technical Requirements:** Ensure reliable internet connection and appropriate audio/video setup
4. **Format:** Virtual presentation with screen sharing capabilities
5. **Recording:** Agreement to allow recording for {{recording_usage}}

**Virtual Platform Requirements:**
- Test connection prior to event
- Professional background/virtual background
- High-quality audio and video equipment
- Backup internet connection if possible`,
      required: true
    },
    {
      id: "compensation",
      title: "Compensation and Payment Terms",
      content: `**Speaker Fee:** $\{{deal_value}} USD

**Payment Terms:**
{{payment_terms}}

**Virtual Event Considerations:**
- No travel expenses required
- Fee includes all preparation and presentation time
- Technical setup is Speaker's responsibility

**Total Contract Value:** $\{{deal_value}} USD`,
      required: true
    },
    {
      id: "technical_requirements",
      title: "Technical Requirements and Obligations",
      content: `**Speaker Technical Obligations:**
1. Maintain stable internet connection (minimum 10 Mbps upload)
2. Use professional-grade microphone and camera
3. Ensure quiet, professional environment
4. Test platform functionality before event
5. Have backup plan for technical failures

**Client Technical Obligations:**
1. Provide platform access and credentials
2. Arrange technical rehearsal if requested
3. Provide technical support contact
4. Manage attendee access and platform settings
5. Handle recording and distribution (if applicable)`,
      required: true
    },
    {
      id: "virtual_cancellation",
      title: "Cancellation and Technical Failure Policy",
      content: `**Standard Cancellation:**
- More than 14 days before event: Full refund minus 10% processing fee
- 7-14 days before event: 50% of speaker fee retained
- Less than 7 days before event: Full speaker fee retained

**Technical Failure:**
- If Speaker experiences technical failure preventing presentation: Full refund
- If Client's platform fails: Full speaker fee paid, option to reschedule
- Both parties must attempt reasonable troubleshooting before cancellation

**Force Majeure:**
Including but not limited to internet outages, platform failures, or other technical impediments beyond reasonable control.`,
      required: true
    }
  ]
}

export const IN_PERSON_EVENT_TEMPLATE: ContractTemplate = {
  version: "v1.0-inperson",
  title: "In-Person Speaker Engagement Agreement",
  sections: [
    {
      id: "parties",
      title: "Parties",
      content: `This Speaker Engagement Agreement ("Agreement") is entered into on {{contract_date}} between:

**Client:** {{client_name}} ({{client_company}})
**Address:** {{event_location}}
**Email:** {{client_email}}
**Phone:** {{client_phone}}

**Speaker:** {{speaker_name}}
**Email:** {{speaker_email}}

**Event Details:**
- **Event Title:** {{event_title}}
- **Event Date:** {{event_date}}
- **Event Location:** {{event_location}}
- **Event Type:** {{event_type}}
- **Expected Attendees:** {{attendee_count}}`,
      required: true
    },
    {
      id: "services",
      title: "Services to be Provided",
      content: `The Speaker agrees to provide the following services:

1. **Speaking Engagement:** Deliver a presentation/keynote on AI-related topics as mutually agreed upon
2. **Duration:** Standard presentation duration unless otherwise specified
3. **Format:** {{event_type}} format as appropriate for the venue and audience
4. **Preparation:** Reasonable preparation time and materials as needed for the engagement

**Specific Requirements:**
- Presentation tailored to audience of {{attendee_count}} attendees
- Topic focus aligned with {{event_type}} format
- Professional presentation materials and setup`,
      required: true
    },
    {
      id: "compensation",
      title: "Compensation and Payment Terms",
      content: `**Speaker Fee:** $\{{deal_value}} USD

**Payment Terms:**
{{payment_terms}}

**Expenses:**
- Travel expenses (if applicable) to be discussed separately
- Accommodation (if required) as per mutual agreement
- Other reasonable expenses with prior approval

**Total Contract Value:** $\{{deal_value}} USD`,
      required: true
    },
    {
      id: "obligations",
      title: "Speaker Obligations",
      content: `The Speaker agrees to:

1. **Preparation:** Adequately prepare for the presentation based on agreed topics and audience
2. **Punctuality:** Arrive at the venue with sufficient time for setup and sound checks
3. **Professionalism:** Maintain professional standards throughout the engagement
4. **Materials:** Provide presentation materials in advance if requested
5. **Availability:** Be available for reasonable Q&A session following the presentation
6. **Confidentiality:** Maintain confidentiality of any proprietary information shared`,
      required: true
    },
    {
      id: "client_obligations",
      title: "Client Obligations",
      content: `The Client agrees to:

1. **Venue:** Provide appropriate venue with necessary AV equipment
2. **Payment:** Make payment according to agreed terms
3. **Information:** Provide relevant event details and audience information
4. **Support:** Ensure adequate technical support during the event
5. **Promotion:** Handle event promotion and attendee management
6. **Communication:** Maintain clear communication regarding event logistics`,
      required: true
    },
    {
      id: "cancellation",
      title: "Cancellation Policy",
      content: `**Cancellation by Client:**
- More than 30 days before event: Full refund minus 10% processing fee
- 15-30 days before event: 50% of speaker fee retained
- Less than 15 days before event: Full speaker fee retained

**Cancellation by Speaker:**
- Speaker may cancel due to illness, emergency, or force majeure
- Reasonable notice must be provided
- Client entitled to full refund if alternative speaker not provided

**Force Majeure:**
Neither party shall be liable for delays or failures due to circumstances beyond their reasonable control.`,
      required: true
    },
    {
      id: "travel_arrangements",
      title: "Travel and Accommodation",
      content: `**Travel Arrangements:**
{{travel_details}}

**Flight Details:**
- Flight Required: {{flight_required}}
- Booking Responsibility: {{flight_booking_responsibility}}
- Class of Travel: {{flight_class}}

**Accommodation:**
- Hotel Required: {{hotel_required}}
- Hotel Arrangements: {{hotel_arrangements}}
- Check-in/Check-out: {{hotel_dates}}

**Ground Transportation:**
- Airport Transfers: {{airport_transfers}}
- Local Transportation: {{local_transportation}}

**Travel Stipend:**
- Amount: $\{{travel_stipend}} USD
- Covers: {{travel_stipend_coverage}}`,
      required: true
    },
    {
      id: "intellectual_property",
      title: "Intellectual Property",
      content: `**Speaker's IP:** Speaker retains all rights to their presentation materials, methodologies, and intellectual property.

**Usage Rights:** Client may record the presentation for internal use only, subject to prior written consent.

**Attribution:** Any use of Speaker's materials must include proper attribution.

**Confidentiality:** Both parties agree to maintain confidentiality of proprietary information shared during the engagement.`,
      required: true
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      content: `Each party's liability under this Agreement shall be limited to the total amount paid under this Agreement.

Neither party shall be liable for any indirect, incidental, or consequential damages.

Both parties agree to maintain appropriate insurance coverage for their respective activities.

**Travel Insurance:** Speaker agrees to maintain appropriate travel insurance for international engagements.`,
      required: true
    },
    {
      id: "general_terms",
      title: "General Terms",
      content: `**Governing Law:** This Agreement shall be governed by the laws of the jurisdiction where the event takes place.

**Entire Agreement:** This Agreement constitutes the entire agreement between the parties.

**Amendments:** Any modifications must be in writing and signed by both parties.

**Severability:** If any provision is deemed invalid, the remainder shall remain in effect.

**Assignment:** Neither party may assign this Agreement without written consent.

**Additional Terms:**
{{additional_terms}}`,
      required: true
    },
    {
      id: "signatures",
      title: "Electronic Signatures",
      content: `By signing below, both parties agree to the terms and conditions set forth in this Agreement.

This Agreement may be executed electronically, and electronic signatures shall be deemed equivalent to original signatures.

**Contract Number:** {{contract_number}}
**Generated Date:** {{contract_date}}

**CLIENT SIGNATURE:**
_________________________________
{{client_name}}
{{client_company}}
Date: ________________

**SPEAKER SIGNATURE:**
_________________________________
{{speaker_name}}
Date: ________________`,
      required: true
    }
  ]
}

// Add remaining sections to virtual template
VIRTUAL_EVENT_TEMPLATE.sections.push(
  {
    id: "intellectual_property",
    title: "Intellectual Property and Recording",
    content: `**Speaker's IP:** Speaker retains all rights to their presentation materials and content.

**Recording Rights:** 
- Recording permission: {{recording_permission}}
- Distribution rights: {{recording_distribution}}
- Usage period: {{recording_usage_period}}

**Platform Content:** Any materials shared via screen share remain property of Speaker.

**Attribution:** Client agrees to provide proper attribution in all uses of recorded content.`,
    required: true
  },
  {
    id: "general_terms",
    title: "General Terms",
    content: `**Governing Law:** This Agreement shall be governed by the laws of {{governing_law}}.

**Time Zone:** All times referenced are in {{event_timezone}} unless otherwise specified.

**Platform Terms:** Both parties agree to abide by the terms of service of the chosen platform.

**Entire Agreement:** This constitutes the entire agreement between the parties.

**Additional Terms:**
{{additional_terms}}`,
    required: true
  },
  {
    id: "signatures",
    title: "Electronic Signatures",
    content: `By signing below, both parties agree to the terms and conditions set forth in this Virtual Speaker Engagement Agreement.

**Contract Number:** {{contract_number}}
**Generated Date:** {{contract_date}}

**CLIENT SIGNATURE:**
_________________________________
{{client_name}}
{{client_company}}
Date: ________________

**SPEAKER SIGNATURE:**
_________________________________
{{speaker_name}}
Date: ________________`,
    required: true
  }
)

export const DEFAULT_CONTRACT_TEMPLATE = IN_PERSON_EVENT_TEMPLATE

export function selectContractTemplate(eventType: string): ContractTemplate {
  if (eventType === 'virtual' || eventType === 'webinar' || eventType === 'online') {
    return VIRTUAL_EVENT_TEMPLATE
  }
  return IN_PERSON_EVENT_TEMPLATE
}

export function generateContractContent(contractData: ContractData, template?: ContractTemplate): string {
  // Select appropriate template if not provided
  if (!template) {
    template = selectContractTemplate(contractData.event_type || 'in-person')
  }

  // Create template variables for substitution
  const isVirtual = contractData.event_type === 'virtual'
  const templateVars: Record<string, string> = {
    contract_number: contractData.contract_number,
    contract_date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    
    // Client information
    client_name: contractData.client_name,
    client_email: contractData.client_email,
    client_phone: contractData.client_phone || 'N/A',
    client_company: contractData.company || contractData.client_name,
    
    // Event information  
    event_title: contractData.event_title,
    event_date: new Date(contractData.event_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    event_location: contractData.event_location,
    event_type: contractData.event_type || 'Speaking Engagement',
    attendee_count: contractData.attendee_count?.toString() || 'TBD',
    
    // Speaker information
    speaker_name: contractData.speaker_name || contractData.speaker_requested || 'TBD',
    speaker_email: contractData.speaker_email || 'TBD',
    speaker_fee: contractData.speaker_fee?.toLocaleString('en-US') || contractData.deal_value.toLocaleString('en-US'),
    
    // Financial terms
    deal_value: contractData.deal_value.toLocaleString('en-US'),
    payment_terms: contractData.payment_terms || 'Payment due within 30 days of event completion',
    
    // Additional terms
    additional_terms: contractData.additional_terms || 'No additional terms specified'
  }

  // Add virtual-specific variables
  if (isVirtual) {
    Object.assign(templateVars, {
      event_platform: contractData.event_platform || 'Zoom/Teams/Platform TBD',
      event_timezone: contractData.event_timezone || 'PST',
      presentation_duration: contractData.presentation_duration || '60 minutes',
      recording_usage: contractData.recording_usage || 'internal purposes only',
      recording_permission: contractData.recording_permission || 'Granted for internal use',
      recording_distribution: contractData.recording_distribution || 'Internal only',
      recording_usage_period: contractData.recording_usage_period || '1 year',
      governing_law: contractData.governing_law || 'California, USA'
    })
  } else {
    // Add in-person specific variables
    Object.assign(templateVars, {
      travel_details: contractData.travel_required ? 'Travel arrangements required as detailed below' : 'No travel required',
      flight_required: contractData.flight_required ? 'Yes' : 'No',
      flight_booking_responsibility: contractData.flight_required ? 'Client to book and pay directly' : 'N/A',
      flight_class: contractData.flight_class || 'Economy/Business as agreed',
      hotel_required: contractData.hotel_required ? 'Yes' : 'No',
      hotel_arrangements: contractData.hotel_required ? 'Client to book and pay directly' : 'N/A',
      hotel_dates: contractData.hotel_dates || 'Night before and night of event',
      airport_transfers: contractData.airport_transfers || 'Provided by Client',
      local_transportation: contractData.local_transportation || 'Provided by Client',
      travel_stipend: contractData.travel_stipend?.toLocaleString('en-US') || '0',
      travel_stipend_coverage: contractData.travel_stipend_coverage || 'Meals and incidentals'
    })
  }

  // Generate the complete contract content
  let contractContent = `# ${template.title}\n\n`
  
  template.sections.forEach((section) => {
    contractContent += `## ${section.title}\n\n`
    
    // Replace template variables in section content
    let sectionContent = section.content
    Object.entries(templateVars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      sectionContent = sectionContent.replace(regex, value)
    })
    
    contractContent += sectionContent + '\n\n'
  })
  
  return contractContent
}

export function generateContractHTML(contractData: ContractData, template?: ContractTemplate): string {
  const markdownContent = generateContractContent(contractData, template)
  
  // Convert markdown to HTML (simple conversion)
  let htmlContent = markdownContent
    .replace(/^# (.+)$/gm, '<h1 class="contract-title">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="section-title">$1</h2>')
    .replace(/^\*\*(.+):\*\*(.+)$/gm, '<div class="contract-item"><strong>$1:</strong>$2</div>')
    .replace(/^\*\*(.+)\*\*$/gm, '<div class="contract-header"><strong>$1</strong></div>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
  
  // Wrap in proper HTML structure with styling
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract - ${contractData.contract_number}</title>
    <style>
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
        }
        
        .contract-title {
            text-align: center;
            color: #1E68C6;
            border-bottom: 3px solid #1E68C6;
            padding-bottom: 20px;
            margin-bottom: 40px;
            font-size: 28px;
        }
        
        .section-title {
            color: #1E68C6;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 10px;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 20px;
        }
        
        .contract-item {
            margin: 10px 0;
            padding: 5px 0;
        }
        
        .contract-header {
            font-weight: bold;
            margin: 15px 0 10px 0;
            color: #2c3e50;
        }
        
        p {
            margin: 12px 0;
            text-align: justify;
        }
        
        li {
            margin: 8px 0;
            margin-left: 20px;
        }
        
        .signature-section {
            margin-top: 60px;
            border-top: 2px solid #1E68C6;
            padding-top: 40px;
        }
        
        .signature-block {
            margin: 40px 0;
            padding: 20px;
            border: 1px solid #ddd;
            background: #f9f9f9;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            width: 300px;
            height: 50px;
            margin: 20px 0;
            display: inline-block;
        }
        
        @media print {
            body { margin: 0; padding: 20px; }
            .signature-block { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`
}

export function validateContractData(contractData: Partial<ContractData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields validation
  if (!contractData.client_name) errors.push('Client name is required')
  if (!contractData.client_email) errors.push('Client email is required')
  if (!contractData.event_title) errors.push('Event title is required')
  if (!contractData.event_date) errors.push('Event date is required')
  if (!contractData.event_location) errors.push('Event location is required')
  if (!contractData.deal_value || contractData.deal_value <= 0) errors.push('Deal value must be greater than 0')
  
  // Email validation
  if (contractData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractData.client_email)) {
    errors.push('Valid client email is required')
  }
  
  if (contractData.speaker_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractData.speaker_email)) {
    errors.push('Valid speaker email is required')
  }
  
  // Date validation
  if (contractData.event_date) {
    const eventDate = new Date(contractData.event_date)
    if (eventDate < new Date()) {
      errors.push('Event date cannot be in the past')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
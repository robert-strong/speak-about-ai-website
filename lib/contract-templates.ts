export interface ContractTemplate {
  id: string
  name: string
  type: 'speaker_agreement' | 'client_speaker' | 'workshop' | 'consulting' | 'custom'
  category: 'internal' | 'external'
  description: string
  sections: ContractSection[]
  variables: ContractVariable[]
}

export interface ContractSection {
  id: string
  title: string
  order: number
  content: string
  isEditable: boolean
  variables?: string[]
}

export interface ContractVariable {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'email' | 'currency' | 'select' | 'textarea'
  required: boolean
  defaultValue?: any
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export const defaultContractTemplates: ContractTemplate[] = [
  {
    id: 'standard-speaker-agreement',
    name: 'Speaker/Client/Agent Agreement',
    type: 'client_speaker',
    category: 'external',
    description: 'Standard three-party agreement between Speaker, Client, and Agent',
    sections: [
      {
        id: 'header',
        title: 'SPEAKER/CLIENT/AGENT AGREEMENT',
        order: 1,
        content: `SPEAKER/CLIENT/AGENT AGREEMENT

This agreement is entered into by and between
a) Speak About AI, a division of Strong Entertainment, LLC ("Agent" for the "Speaker"),
b) {{speaker_name}} ("Speaker"), and
c) {{client_contact_name}} ("Client") for the purposes of engaging the Speaker for:

**Contract details:**
**Event Reference:** {{event_reference}}
**Client & Name of Event:** {{client_company}} / {{event_title}}
**Date(s)/Time(s):** {{event_date}}
**Location(s):** {{event_location}}
**The fee and any other consideration payable to the Agent:** \${{deal_value}} USD
**Travel:** {{travel_details}}
**For that fee, the Speaker will provide:**
{{deliverables}}`,
        isEditable: false,
        variables: ['speaker_name', 'client_contact_name', 'event_reference', 'client_company', 'event_title', 'event_date', 'event_location', 'deal_value', 'travel_details', 'deliverables']
      },
      {
        id: 'taxation',
        title: '2. Taxation',
        order: 2,
        content: `**2. Taxation** - The Speaker agrees to act as an independent contractor under the terms of this agreement and assumes all responsibility for Social Security, State, and Federal Income Tax, etc., as governed by the laws of the federal government of the United States and the Speaker's state of residence. The Client is not responsible for any additional expenses or costs.`,
        isEditable: false,
        variables: []
      },
      {
        id: 'payment',
        title: '3. Deposit and Payment',
        order: 3,
        content: `**3. Deposit and Payment** - A {{deposit_percent}}% Deposit is due at the time of execution/signing of this agreement. An additional {{mid_payment_percent}}% is due {{mid_payment_date}}, and the remaining {{balance_percent}}% Balance Payment is due by {{balance_due_date}}. All parties enter into this agreement in good faith. However, cancellation by the client shall make the client liable for the amount of the 50% deposit. If the contract is canceled by the Speaker, the Speaker and the Agent will refund all payments made.`,
        isEditable: true,
        variables: ['deposit_percent', 'mid_payment_percent', 'mid_payment_date', 'balance_percent', 'balance_due_date']
      },
      {
        id: 'recording-rights',
        title: '4. Permission to Photograph and Record',
        order: 4,
        content: `**4. Permission to Photograph and Record** - Any use of the Speaker's name, likeness, presentation content, or Recordings (as that term is defined in this section) for commercial purposes (and the section below marked "Permissible Use" is not considered to be commercial purposes) is expressly prohibited. No Trademark license is granted.

**Permissible Use:** All parties agree that the client may use the recorded video footage (the "Recording") of the Speaker for this Event. The Client may, without further fee or payment, use the Speaker's name and likeness for up to twelve months after the talk is delivered in marketing and promotion, but that does not suggest Speaker affiliation or endorsement. For example, the Client may share short snippets (up to 5-minute clips) from or about the event and talk that reference or include the Speaker. However, those snippets may not suggest endorsement by the speaker of the Client's products or the Client itself. The Recording in its entirety may be shared internally and with Event attendees via a private link for the 12 months after the initial airing date of {{event_date}}. The Client agrees that they will not use the Recording for the purpose of training artificial intelligence models or digital twins of the Speaker.`,
        isEditable: false,
        variables: ['event_date']
      },
      {
        id: 'cancellation',
        title: '5. Cancellation',
        order: 5,
        content: `**5. Cancellation** - This contract is binding and may be canceled only if:

a) there is a mutual agreement between the parties; or
b) by force majeure; or
c) If the Speaker is delayed by airline delay/cancellation, accident due to travel, or incapacitated due to illness; or
d) An immediate family member is stricken by serious injury, illness, or death.`,
        isEditable: false,
        variables: []
      },
      {
        id: 'liability',
        title: '6. Limitation of Liability',
        order: 6,
        content: `**6. Limitation of Liability**

**6.1 EXCLUSION OF CERTAIN DAMAGES.** NOTWITHSTANDING ANYTHING TO THE CONTRARY IN THIS AGREEMENT AND TO THE FULLEST EXTENT PERMITTED UNDER APPLICABLE LAWS, IN NO EVENT WILL EITHER PARTY BE LIABLE TO THE OTHER PARTY OR TO ANY THIRD PARTY UNDER ANY TORT, CONTRACT, NEGLIGENCE, STRICT LIABILITY, OR OTHER LEGAL OR EQUITABLE THEORY FOR (1) INDIRECT, INCIDENTAL, CONSEQUENTIAL, EXEMPLARY, REPUTATIONAL, SPECIAL OR PUNITIVE DAMAGES OF ANY KIND; (2) COSTS OF PROCUREMENT, COVER, OR SUBSTITUTE SERVICES; (3) LOSS OF USE OR CORRUPTION OF DATA, CONTENT OR INFORMATION; OR (4) LOSS OF BUSINESS OPPORTUNITIES, REVENUES, PROFITS, GOODWILL, OR SAVINGS, EVEN IF THE PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH LOSS OR DAMAGES OR SUCH OR LOSS DAMAGES COULD HAVE BEEN REASONABLY FORESEEN.

**6.2 LIMITATION OF LIABILITY.** NEITHER PARTY SHALL BE LIABLE FOR CUMULATIVE, AGGREGATE DAMAGES THAT EXCEED THE AMOUNT ACTUALLY PAID OR PAYABLE BY CLIENT TO SPEAKER OR AGENCY FOR THE APPLICABLE SERVICES.`,
        isEditable: false,
        variables: []
      },
      {
        id: 'miscellaneous',
        title: '7. Miscellaneous',
        order: 7,
        content: `**7. Miscellaneous** - This agreement represents the entire understanding between all parties, and supersedes all prior negotiations, representations, and agreements made by or between parties. No alterations, amendments, or modifications to any of the terms and conditions of this agreement shall be valid unless made in writing and signed by each party. Any controversy, dispute, or claim shall be resolved at the request of any party to this Agreement by final and binding arbitration administered by Judicial Arbitration & Mediation Services, Inc., and judgment upon any award rendered by the arbitrator may be entered by any State or Federal Court having jurisdiction thereof. This Agreement shall be governed by California law without reference to its conflicts of law principles. Any such arbitration shall occur exclusively in the County of Santa Clara, California.`,
        isEditable: false,
        variables: []
      },
      {
        id: 'signatures',
        title: 'Signatures',
        order: 8,
        content: `Date:_________ Client Signature:__________________________ Title:_____________________ Company:______________

Date:_________ Agent Signature:__________________________ Title:_____________________ Company:________________`,
        isEditable: false,
        variables: ['client_signer_name', 'client_signer_title', 'client_signer_company', 'agent_signer_name', 'agent_signer_title']
      }
    ],
    variables: [
      // Parties
      { key: 'speaker_name', label: 'Speaker Name', type: 'text', required: true },
      { key: 'client_contact_name', label: 'Client Contact Name', type: 'text', required: true },
      { key: 'client_company', label: 'Client Company', type: 'text', required: true },
      { key: 'client_email', label: 'Client Email', type: 'email', required: true },
      { key: 'speaker_email', label: 'Speaker Email', type: 'email', required: false },

      // Event Details
      { key: 'event_reference', label: 'Event Reference #', type: 'text', required: false },
      { key: 'event_title', label: 'Name of Event', type: 'text', required: true },
      { key: 'event_date', label: 'Event Date(s)/Time(s)', type: 'text', required: true },
      { key: 'event_location', label: 'Event Location(s)', type: 'text', required: true },

      // Financial
      { key: 'deal_value', label: 'Fee (Deal Value)', type: 'currency', required: true },
      { key: 'speaker_fee', label: 'Speaker Fee', type: 'currency', required: false },
      { key: 'travel_details', label: 'Travel Arrangements', type: 'textarea', required: false, defaultValue: '$2,500 flight buyout, 2 nights at a 4+ star hotel, meals, and event city ground transportation' },
      { key: 'deliverables', label: 'Speaker Deliverables', type: 'textarea', required: true, defaultValue: '- A 30-minute content alignment meeting a month or so before the event.\n- A short tech-check the day before or day of your talk.\n- A 60-minute keynote/workshop in person.' },

      // Payment Schedule
      { key: 'deposit_percent', label: 'Deposit %', type: 'number', required: true, defaultValue: 20 },
      { key: 'mid_payment_percent', label: 'Mid-Payment %', type: 'number', required: true, defaultValue: 30 },
      { key: 'mid_payment_date', label: 'Mid-Payment Due Date', type: 'text', required: true },
      { key: 'balance_percent', label: 'Balance %', type: 'number', required: true, defaultValue: 50 },
      { key: 'balance_due_date', label: 'Balance Due Date', type: 'text', required: true },

      // Signatures
      { key: 'client_signer_name', label: 'Client Signer Name', type: 'text', required: false },
      { key: 'client_signer_title', label: 'Client Signer Title', type: 'text', required: false },
      { key: 'client_signer_company', label: 'Client Signer Company', type: 'text', required: false },
      { key: 'agent_signer_name', label: 'Agent Signer Name', type: 'text', required: false, defaultValue: 'Robert Strong' },
      { key: 'agent_signer_title', label: 'Agent Signer Title', type: 'text', required: false, defaultValue: 'Owner' }
    ]
  },
  {
    id: 'workshop-agreement',
    name: 'Workshop Agreement',
    type: 'workshop',
    category: 'external',
    description: 'Agreement for workshop facilitation and training sessions',
    sections: [],
    variables: []
  }
]

export function processTemplate(template: ContractTemplate, values: Record<string, any>): string {
  let processedContent = ''

  template.sections
    .sort((a, b) => a.order - b.order)
    .forEach(section => {
      let sectionContent = section.content

      // Replace all variables with their values
      const allVariableKeys = template.variables.map(v => v.key)
      allVariableKeys.forEach(variable => {
        const value = values[variable] || `[${variable}]`
        const regex = new RegExp(`{{${variable}}}`, 'g')
        sectionContent = sectionContent.replace(regex, value)
      })

      processedContent += sectionContent + '\n\n'
    })

  return processedContent
}

export function validateTemplateValues(
  template: ContractTemplate,
  values: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  template.variables.forEach(variable => {
    const value = values[variable.key]

    if (variable.required && !value) {
      errors.push(`${variable.label} is required`)
    }

    if (value && variable.validation) {
      if (variable.type === 'number' || variable.type === 'currency') {
        const numValue = parseFloat(value)
        if (variable.validation.min && numValue < variable.validation.min) {
          errors.push(`${variable.label} must be at least ${variable.validation.min}`)
        }
        if (variable.validation.max && numValue > variable.validation.max) {
          errors.push(`${variable.label} must be at most ${variable.validation.max}`)
        }
      }

      if (variable.validation.pattern) {
        const regex = new RegExp(variable.validation.pattern)
        if (!regex.test(value)) {
          errors.push(`${variable.label} format is invalid`)
        }
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

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
    name: 'Standard Speaking Engagement Agreement',
    type: 'client_speaker',
    category: 'external',
    description: 'Complete contract for speaking engagements between client and speaker',
    sections: [
      {
        id: 'header',
        title: 'Agreement Header',
        order: 1,
        content: `SPEAKING ENGAGEMENT AGREEMENT

This Speaking Engagement Agreement ("Agreement") is entered into as of {{agreement_date}} ("Effective Date") between:

**CLIENT:**
{{client_company}}
{{client_address}}
Contact: {{client_contact_name}}
Email: {{client_email}}
Phone: {{client_phone}}

**SPEAKER:**
{{speaker_name}}
{{speaker_address}}
Email: {{speaker_email}}
Phone: {{speaker_phone}}

**AGENCY (if applicable):**
Speak About AI, LLC
Contact: {{agency_contact}}
Email: {{agency_email}}`,
        isEditable: false,
        variables: ['agreement_date', 'client_company', 'client_address', 'client_contact_name', 'client_email', 'client_phone', 'speaker_name', 'speaker_address', 'speaker_email', 'speaker_phone', 'agency_contact', 'agency_email']
      },
      {
        id: 'event-details',
        title: 'Event Details',
        order: 2,
        content: `## 1. ENGAGEMENT DETAILS

The Speaker agrees to provide speaking services for the following event:

**Event Name:** {{event_title}}
**Event Date(s):** {{event_date}}
**Event Time:** {{event_time}}
**Duration:** {{presentation_duration}}
**Event Location:** {{event_location}}
**Venue:** {{venue_name}}
**Expected Attendance:** {{attendee_count}} attendees
**Event Type:** {{event_type}}

**Presentation Details:**
- **Topic/Title:** {{presentation_title}}
- **Format:** {{presentation_format}}
- **Description:** {{presentation_description}}

**Additional Requirements:**
{{additional_requirements}}`,
        isEditable: true,
        variables: ['event_title', 'event_date', 'event_time', 'presentation_duration', 'event_location', 'venue_name', 'attendee_count', 'event_type', 'presentation_title', 'presentation_format', 'presentation_description', 'additional_requirements']
      },
      {
        id: 'compensation',
        title: 'Compensation',
        order: 3,
        content: `## 2. COMPENSATION

**Speaking Fee:** {{speaker_fee}} USD
**Payment Terms:** {{payment_terms}}

**Additional Compensation:**
{{additional_compensation}}

**Expenses:**
The Client agrees to reimburse the following pre-approved expenses:
{{expense_coverage}}

All expenses must be submitted with receipts within {{expense_submission_deadline}} days after the event.`,
        isEditable: true,
        variables: ['speaker_fee', 'payment_terms', 'additional_compensation', 'expense_coverage', 'expense_submission_deadline']
      },
      {
        id: 'travel-accommodation',
        title: 'Travel & Accommodation',
        order: 4,
        content: `## 3. TRAVEL & ACCOMMODATION

{{travel_arrangements}}

**Travel Cost Arrangement:** {{travel_cost_type}}

**Travel Buyout:**
- **Buyout Amount:** {{travel_buyout_amount}} USD
- **Buyout Covers:** {{travel_buyout_includes}}

**Client-Covered Items:**
{{client_covers_items}}

**Travel Details:**
- **Departure City:** {{departure_city}}
- **Arrival Requirements:** {{arrival_requirements}}
- **Ground Transportation:** {{ground_transportation}}

**Accommodation:**
- **Hotel:** {{hotel_arrangements}}
- **Check-in Date:** {{checkin_date}}
- **Check-out Date:** {{checkout_date}}

**Meals & Per Diem:**
{{meal_arrangements}}`,
        isEditable: true,
        variables: ['travel_arrangements', 'travel_cost_type', 'travel_buyout_amount', 'travel_buyout_includes', 'client_covers_items', 'departure_city', 'arrival_requirements', 'ground_transportation', 'hotel_arrangements', 'checkin_date', 'checkout_date', 'meal_arrangements']
      },
      {
        id: 'speaker-obligations',
        title: 'Speaker Obligations',
        order: 5,
        content: `## 4. SPEAKER OBLIGATIONS

The Speaker agrees to:

a) Arrive at the venue at least {{arrival_buffer}} minutes before the scheduled presentation time
b) Provide a professional presentation on the agreed topic
c) Participate in the following additional activities (if applicable):
   {{additional_activities}}
d) Provide the following materials by {{materials_deadline}}:
   - Professional biography ({{bio_length}} words)
   - High-resolution headshot
   - Presentation title and description
   - Audio/visual requirements
   {{additional_materials}}
e) Maintain professional conduct throughout the engagement
f) Not promote competing products or services without prior written consent`,
        isEditable: true,
        variables: ['arrival_buffer', 'additional_activities', 'materials_deadline', 'bio_length', 'additional_materials']
      },
      {
        id: 'client-obligations',
        title: 'Client Obligations',
        order: 6,
        content: `## 5. CLIENT OBLIGATIONS

The Client agrees to:

a) Provide the following equipment and technical support:
   {{technical_requirements}}
b) Ensure appropriate venue setup including:
   - Stage/speaking area
   - Lighting
   - Sound system
   - {{venue_requirements}}
c) Provide event schedule and logistics information at least {{info_deadline}} days before the event
d) Handle event promotion and attendee registration
e) Provide on-site support and point of contact
f) Process payment according to the terms specified in Section 2`,
        isEditable: true,
        variables: ['technical_requirements', 'venue_requirements', 'info_deadline']
      },
      {
        id: 'intellectual-property',
        title: 'Intellectual Property',
        order: 7,
        content: `## 6. INTELLECTUAL PROPERTY & RECORDING RIGHTS

**Content Ownership:**
The Speaker retains all rights to their presentation content, materials, and intellectual property.

**Recording Rights:**
{{recording_rights}}

**Marketing Use:**
{{marketing_rights}}

**Materials Distribution:**
{{distribution_rights}}`,
        isEditable: true,
        variables: ['recording_rights', 'marketing_rights', 'distribution_rights']
      },
      {
        id: 'cancellation',
        title: 'Cancellation Policy',
        order: 8,
        content: `## 7. CANCELLATION POLICY

**By Client:**
- More than {{cancellation_period_1}} days before event: {{cancellation_fee_1}}% of speaking fee
- {{cancellation_period_2}} to {{cancellation_period_1}} days before event: {{cancellation_fee_2}}% of speaking fee
- Less than {{cancellation_period_2}} days before event: {{cancellation_fee_3}}% of speaking fee

**By Speaker:**
The Speaker may cancel only due to illness, emergency, or Act of God. The Speaker will make reasonable efforts to provide a qualified replacement speaker.

**Force Majeure:**
Neither party shall be liable for failure to perform due to causes beyond their reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, pandemic, government restrictions, or other emergencies.`,
        isEditable: true,
        variables: ['cancellation_period_1', 'cancellation_period_2', 'cancellation_fee_1', 'cancellation_fee_2', 'cancellation_fee_3']
      },
      {
        id: 'confidentiality',
        title: 'Confidentiality',
        order: 9,
        content: `## 8. CONFIDENTIALITY

Both parties agree to maintain confidentiality regarding:
- Proprietary information shared during the engagement
- Financial terms of this agreement (unless disclosure is required by law)
- {{additional_confidentiality}}

This confidentiality obligation survives termination of this agreement.`,
        isEditable: true,
        variables: ['additional_confidentiality']
      },
      {
        id: 'liability-indemnification',
        title: 'Liability & Indemnification',
        order: 10,
        content: `## 9. LIABILITY & INDEMNIFICATION

**Limitation of Liability:**
Neither party shall be liable for indirect, incidental, special, or consequential damages arising from this agreement.

**Indemnification:**
Each party agrees to indemnify and hold harmless the other party from claims arising from their own negligence or willful misconduct.

**Insurance:**
{{insurance_requirements}}`,
        isEditable: true,
        variables: ['insurance_requirements']
      },
      {
        id: 'general-provisions',
        title: 'General Provisions',
        order: 11,
        content: `## 10. GENERAL PROVISIONS

**Governing Law:** This Agreement shall be governed by the laws of {{governing_state}}.

**Entire Agreement:** This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.

**Amendments:** Any amendments to this Agreement must be in writing and signed by both parties.

**Severability:** If any provision is found to be unenforceable, the remaining provisions shall continue in full force and effect.

**Notice:** All notices shall be sent to the addresses listed above via email with confirmation of receipt.

**Assignment:** Neither party may assign this Agreement without the prior written consent of the other party.`,
        isEditable: false,
        variables: ['governing_state']
      },
      {
        id: 'signatures',
        title: 'Signatures',
        order: 12,
        content: `## SIGNATURES

By signing below, the parties acknowledge they have read, understood, and agree to be bound by the terms of this Agreement.

**CLIENT:**

_________________________________
Signature

{{client_signer_name}}
Name

{{client_signer_title}}
Title

Date: {{client_signature_date}}

**SPEAKER:**

_________________________________
Signature

{{speaker_name}}
Name

Date: {{speaker_signature_date}}

**AGENCY (if applicable):**

_________________________________
Signature

{{agency_signer_name}}
Name

{{agency_signer_title}}
Title

Date: {{agency_signature_date}}`,
        isEditable: false,
        variables: ['client_signer_name', 'client_signer_title', 'client_signature_date', 'speaker_name', 'speaker_signature_date', 'agency_signer_name', 'agency_signer_title', 'agency_signature_date']
      }
    ],
    variables: [
      // Basic Information
      { key: 'agreement_date', label: 'Agreement Date', type: 'date', required: true },
      { key: 'client_company', label: 'Client Company', type: 'text', required: true },
      { key: 'client_address', label: 'Client Address', type: 'textarea', required: true },
      { key: 'client_contact_name', label: 'Client Contact Name', type: 'text', required: true },
      { key: 'client_email', label: 'Client Email', type: 'email', required: true },
      { key: 'client_phone', label: 'Client Phone', type: 'text', required: false },
      { key: 'speaker_name', label: 'Speaker Name', type: 'text', required: true },
      { key: 'speaker_address', label: 'Speaker Address', type: 'textarea', required: false },
      { key: 'speaker_email', label: 'Speaker Email', type: 'email', required: true },
      { key: 'speaker_phone', label: 'Speaker Phone', type: 'text', required: false },
      { key: 'agency_contact', label: 'Agency Contact', type: 'text', required: false, defaultValue: 'Contract Team' },
      { key: 'agency_email', label: 'Agency Email', type: 'email', required: false, defaultValue: 'contracts@speakaboutai.com' },
      
      // Event Details
      { key: 'event_title', label: 'Event Title', type: 'text', required: true },
      { key: 'event_date', label: 'Event Date', type: 'date', required: true },
      { key: 'event_time', label: 'Event Time', type: 'text', required: true },
      { key: 'presentation_duration', label: 'Presentation Duration', type: 'text', required: true, defaultValue: '60 minutes' },
      { key: 'event_location', label: 'Event Location', type: 'text', required: true },
      { key: 'venue_name', label: 'Venue Name', type: 'text', required: false },
      { key: 'attendee_count', label: 'Expected Attendance', type: 'number', required: true },
      { 
        key: 'event_type', 
        label: 'Event Type', 
        type: 'select', 
        required: true,
        options: [
          { value: 'conference', label: 'Conference' },
          { value: 'workshop', label: 'Workshop' },
          { value: 'keynote', label: 'Keynote' },
          { value: 'panel', label: 'Panel Discussion' },
          { value: 'webinar', label: 'Webinar' },
          { value: 'corporate', label: 'Corporate Event' },
          { value: 'other', label: 'Other' }
        ]
      },
      { key: 'presentation_title', label: 'Presentation Title', type: 'text', required: true },
      { 
        key: 'presentation_format', 
        label: 'Presentation Format', 
        type: 'select', 
        required: true,
        options: [
          { value: 'keynote', label: 'Keynote Presentation' },
          { value: 'workshop', label: 'Interactive Workshop' },
          { value: 'panel', label: 'Panel Discussion' },
          { value: 'fireside', label: 'Fireside Chat' },
          { value: 'training', label: 'Training Session' }
        ]
      },
      { key: 'presentation_description', label: 'Presentation Description', type: 'textarea', required: true },
      { key: 'additional_requirements', label: 'Additional Requirements', type: 'textarea', required: false },
      
      // Compensation
      { key: 'speaker_fee', label: 'Speaking Fee', type: 'currency', required: true },
      { 
        key: 'payment_terms', 
        label: 'Payment Terms', 
        type: 'select', 
        required: true,
        options: [
          { value: 'net30', label: 'Net 30 days after event' },
          { value: 'net15', label: 'Net 15 days after event' },
          { value: '50_50', label: '50% deposit, 50% after event' },
          { value: 'upon_receipt', label: 'Due upon receipt' },
          { value: 'custom', label: 'Custom terms' }
        ],
        defaultValue: 'net30'
      },
      { key: 'additional_compensation', label: 'Additional Compensation', type: 'textarea', required: false },
      { key: 'expense_coverage', label: 'Expense Coverage', type: 'textarea', required: false, defaultValue: 'Travel, accommodation, and meals as pre-approved' },
      { key: 'expense_submission_deadline', label: 'Expense Submission Deadline (days)', type: 'number', required: true, defaultValue: 30 },
      
      // Travel & Accommodation
      {
        key: 'travel_arrangements',
        label: 'Travel Arrangements',
        type: 'select',
        required: true,
        options: [
          { value: 'client_books', label: 'Client books and pays directly' },
          { value: 'speaker_books', label: 'Speaker books, client reimburses' },
          { value: 'no_travel', label: 'No travel required' },
          { value: 'virtual', label: 'Virtual event' }
        ]
      },
      {
        key: 'travel_cost_type',
        label: 'Travel Cost Type',
        type: 'select',
        required: true,
        options: [
          { value: 'buyout', label: 'Travel Buyout (fixed amount to speaker)' },
          { value: 'client_covered', label: 'Client Covers All Travel' },
          { value: 'split', label: 'Split (buyout + client covers some items)' },
          { value: 'speaker_covered', label: 'Speaker Covers (included in fee)' },
          { value: 'no_travel', label: 'No Travel Required' }
        ],
        defaultValue: 'client_covered'
      },
      { key: 'travel_buyout_amount', label: 'Travel Buyout Amount', type: 'currency', required: false },
      { key: 'travel_buyout_includes', label: 'Buyout Includes', type: 'textarea', required: false, defaultValue: 'Airfare, ground transportation, hotel, and meals' },
      { key: 'client_covers_items', label: 'Client Covers Items', type: 'textarea', required: false, defaultValue: 'The client will directly book and pay for:\n- Round-trip airfare (business class for flights over 4 hours)\n- Hotel accommodations (4-star or equivalent)\n- Ground transportation to/from airport and venue\n- Meals during the engagement' },
      { key: 'departure_city', label: 'Departure City', type: 'text', required: false },
      { key: 'arrival_requirements', label: 'Arrival Requirements', type: 'text', required: false, defaultValue: 'Arrive day before event' },
      { key: 'ground_transportation', label: 'Ground Transportation', type: 'text', required: false, defaultValue: 'Provided by client' },
      { key: 'hotel_arrangements', label: 'Hotel Arrangements', type: 'text', required: false },
      { key: 'checkin_date', label: 'Check-in Date', type: 'date', required: false },
      { key: 'checkout_date', label: 'Check-out Date', type: 'date', required: false },
      { key: 'meal_arrangements', label: 'Meal Arrangements', type: 'textarea', required: false },
      
      // Speaker Obligations
      { key: 'arrival_buffer', label: 'Arrival Buffer (minutes)', type: 'number', required: true, defaultValue: 60 },
      { key: 'additional_activities', label: 'Additional Activities', type: 'textarea', required: false, defaultValue: 'Q&A session, meet and greet' },
      { key: 'materials_deadline', label: 'Materials Deadline', type: 'date', required: true },
      { key: 'bio_length', label: 'Bio Length (words)', type: 'number', required: true, defaultValue: 150 },
      { key: 'additional_materials', label: 'Additional Materials', type: 'textarea', required: false },
      
      // Client Obligations
      { key: 'technical_requirements', label: 'Technical Requirements', type: 'textarea', required: true, defaultValue: 'Microphone, projector, screen, clicker' },
      { key: 'venue_requirements', label: 'Additional Venue Requirements', type: 'textarea', required: false },
      { key: 'info_deadline', label: 'Information Deadline (days before)', type: 'number', required: true, defaultValue: 14 },
      
      // Intellectual Property
      { 
        key: 'recording_rights', 
        label: 'Recording Rights', 
        type: 'select',
        required: true,
        options: [
          { value: 'no_recording', label: 'No recording permitted' },
          { value: 'audio_only', label: 'Audio recording permitted' },
          { value: 'video_internal', label: 'Video recording for internal use only' },
          { value: 'video_full', label: 'Full video recording and distribution rights' },
          { value: 'custom', label: 'Custom recording terms' }
        ],
        defaultValue: 'no_recording'
      },
      { key: 'marketing_rights', label: 'Marketing Rights', type: 'textarea', required: false, defaultValue: 'Client may use Speaker name and photo for event promotion' },
      { key: 'distribution_rights', label: 'Materials Distribution', type: 'textarea', required: false, defaultValue: 'Presentation materials may be shared with attendees only' },
      
      // Cancellation
      { key: 'cancellation_period_1', label: 'Cancellation Period 1 (days)', type: 'number', required: true, defaultValue: 30 },
      { key: 'cancellation_period_2', label: 'Cancellation Period 2 (days)', type: 'number', required: true, defaultValue: 14 },
      { key: 'cancellation_fee_1', label: 'Cancellation Fee 1 (%)', type: 'number', required: true, defaultValue: 25 },
      { key: 'cancellation_fee_2', label: 'Cancellation Fee 2 (%)', type: 'number', required: true, defaultValue: 50 },
      { key: 'cancellation_fee_3', label: 'Cancellation Fee 3 (%)', type: 'number', required: true, defaultValue: 100 },
      
      // Other
      { key: 'additional_confidentiality', label: 'Additional Confidentiality Terms', type: 'textarea', required: false },
      { key: 'insurance_requirements', label: 'Insurance Requirements', type: 'textarea', required: false, defaultValue: 'Each party maintains appropriate liability insurance' },
      { key: 'governing_state', label: 'Governing State', type: 'text', required: true, defaultValue: 'California' },
      
      // Signatures
      { key: 'client_signer_name', label: 'Client Signer Name', type: 'text', required: true },
      { key: 'client_signer_title', label: 'Client Signer Title', type: 'text', required: true },
      { key: 'client_signature_date', label: 'Client Signature Date', type: 'date', required: false },
      { key: 'speaker_signature_date', label: 'Speaker Signature Date', type: 'date', required: false },
      { key: 'agency_signer_name', label: 'Agency Signer Name', type: 'text', required: false },
      { key: 'agency_signer_title', label: 'Agency Signer Title', type: 'text', required: false },
      { key: 'agency_signature_date', label: 'Agency Signature Date', type: 'date', required: false }
    ]
  },
  {
    id: 'workshop-agreement',
    name: 'Workshop Agreement',
    type: 'workshop',
    category: 'external',
    description: 'Agreement for workshop facilitation and training sessions',
    sections: [
      // Workshop-specific sections would go here
    ],
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
      section.variables?.forEach(variable => {
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
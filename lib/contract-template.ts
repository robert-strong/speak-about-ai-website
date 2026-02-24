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

  // New fields for updated template
  travel_details?: string
  deliverables?: string
  deposit_percent?: number
  mid_payment_percent?: number
  mid_payment_date?: string
  balance_percent?: number
  balance_due_date?: string
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

export function generateContractContent(contractData: ContractData, template?: ContractTemplate): string {
  // Not used anymore — HTML is generated directly
  return ''
}

export function generateContractHTML(contractData: ContractData): string {
  const speakerName = contractData.speaker_name || contractData.speaker_requested || 'TBD'
  const clientName = contractData.client_name || 'TBD'
  const clientCompany = contractData.company || contractData.client_name || ''
  const eventTitle = contractData.event_title || 'TBD'
  const eventDate = contractData.event_date
    ? new Date(contractData.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBD'
  const eventLocation = contractData.event_location || 'TBD'
  const dealValue = contractData.deal_value
    ? Number(contractData.deal_value).toLocaleString('en-US')
    : '0'
  const travelDetails = contractData.travel_details || contractData.travel_stipend
    ? `$${(contractData.travel_stipend || 0).toLocaleString('en-US')} flight buyout`
    : 'To be determined'
  const deliverables = contractData.deliverables || '- Speaking engagement as agreed upon'
  const depositPercent = contractData.deposit_percent || 20
  const midPaymentPercent = contractData.mid_payment_percent || 30
  const midPaymentDate = contractData.mid_payment_date || 'TBD'
  const balancePercent = contractData.balance_percent || 50
  const balanceDueDate = contractData.balance_due_date || eventDate
  const eventReference = contractData.contract_number || ''

  // Format deliverables as HTML list items
  const deliverablesHtml = deliverables
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const cleaned = line.replace(/^[-*]\s*/, '').trim()
      return cleaned ? `<li>${cleaned}</li>` : ''
    })
    .filter(Boolean)
    .join('\n          ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Speaker Agreement - ${eventReference}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0.5in 0.75in; }
      .no-print { display: none; }
      .page-footer { position: fixed; bottom: 0.3in; left: 0; right: 0; text-align: center; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in 1in;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 18pt;
      font-weight: bold;
      color: #000;
      margin: 0;
      flex: 1;
    }
    .header-logo {
      width: 180px;
      height: auto;
      margin-left: 20px;
    }
    .intro {
      margin-bottom: 8px;
    }
    .intro p {
      margin: 4px 0 4px 0;
    }
    .party-item {
      margin-left: 20px;
    }
    .party-name {
      color: #2563eb;
      font-weight: bold;
    }
    .contract-details {
      margin: 16px 0;
    }
    .contract-details .label {
      font-weight: bold;
    }
    .contract-details .value {
      color: #2563eb;
    }
    .detail-row {
      margin: 4px 0 4px 8px;
    }
    .deliverables-header {
      font-weight: bold;
      margin: 8px 0 4px 8px;
    }
    .deliverables-list {
      margin: 4px 0 4px 24px;
      padding-left: 0;
    }
    .deliverables-list li {
      margin: 2px 0;
      color: #2563eb;
      font-weight: bold;
    }
    .section {
      margin: 20px 0;
    }
    .section-title {
      font-weight: bold;
    }
    .section-body {
      text-align: justify;
    }
    .payment-highlight {
      color: #2563eb;
      font-weight: bold;
    }
    .uppercase-section {
      text-transform: uppercase;
      font-weight: bold;
      text-align: justify;
    }
    .signature-section {
      margin-top: 40px;
    }
    .signature-block {
      margin: 30px 0;
      display: flex;
      gap: 20px;
      align-items: baseline;
    }
    .sig-field {
      display: inline-block;
    }
    .sig-label {
      font-size: 9pt;
      color: #666;
    }
    .sig-line {
      border-bottom: 1px solid #333;
      min-width: 180px;
      display: inline-block;
      margin: 0 4px;
    }
    .sig-date { min-width: 100px; }
    .sig-signature { min-width: 200px; }
    .sig-title-field { min-width: 140px; }
    .sig-company { min-width: 120px; }
    .page-footer {
      margin-top: 40px;
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      color: #333;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="header-title">SPEAKER/CLIENT/AGENT AGREEMENT</h1>
    <img src="/speak-about-ai-logo.png" alt="Speak About AI" class="header-logo" />
  </div>

  <div class="intro">
    <p>This agreement is entered into by and between</p>
    <p class="party-item">a) <span class="party-name">Speak About AI</span>, a division of Strong Entertainment, LLC ("Agent" for the "Speaker"),</p>
    <p class="party-item">b) <span class="party-name">${speakerName}</span> ("Speaker"), and</p>
    <p class="party-item">c) <span class="party-name">${clientName}</span> ("Client") for the purposes of engaging the Speaker for:</p>
  </div>

  <div class="contract-details">
    <p style="font-weight: bold;">Contract details:</p>
    <div class="detail-row"><span class="label">Event Reference:</span> <span class="value">${eventReference}</span></div>
    <div class="detail-row"><span class="label">Client & Name of Event:</span> <span class="value">${clientCompany}${clientCompany && eventTitle ? ' / ' : ''}${eventTitle}</span></div>
    <div class="detail-row"><span class="label">Date(s)/Time(s):</span> <span class="value">Event on ${eventDate}</span></div>
    <div class="detail-row"><span class="label">Location(s):</span> <span class="value">${eventLocation}</span></div>
    <div class="detail-row"><span class="label">The fee and any other consideration payable to the Agent:</span> <span class="value">$${dealValue} USD</span></div>
    <div class="detail-row"><span class="label">Travel:</span> <span class="value">${typeof travelDetails === 'string' ? travelDetails : 'To be determined'}</span></div>
    <p class="deliverables-header">For that fee, the Speaker will provide:</p>
    <ul class="deliverables-list">
      ${deliverablesHtml}
    </ul>
  </div>

  <div class="section">
    <p class="section-body"><span class="section-title">2. Taxation</span> - The Speaker agrees to act as an independent contractor under the terms of this agreement and assumes all responsibility for Social Security, State, and Federal Income Tax, etc., as governed by the laws of the federal government of the United States and the Speaker's state of residence. The Client is not responsible for any additional expenses or costs.</p>
  </div>

  <div class="section">
    <p class="section-body"><span class="section-title">3. Deposit and Payment</span> - A <span class="payment-highlight">${depositPercent}% Deposit is due at the time of execution/signing of this agreement. An additional ${midPaymentPercent}% is due ${midPaymentDate}, and the remaining ${balancePercent}% Balance Payment is due by ${balanceDueDate}</span>. All parties enter into this agreement in good faith. However, cancellation by the client shall make the client liable for the amount of the 50% deposit. If the contract is canceled by the Speaker, the Speaker and the Agent will refund all payments made.</p>
  </div>

  <div class="section">
    <p class="section-body"><span class="section-title">4. Permission to Photograph and Record</span> - Any use of the Speaker's name, likeness, presentation content, or Recordings (as that term is defined in this section) for commercial purposes (and the section below marked "Permissible Use" is not considered to be commercial purposes) is expressly prohibited. No Trademark license is granted.</p>

    <p class="section-body"><span class="section-title">Permissible Use:</span> All parties agree that the client may use the recorded video footage (the "Recording") of the Speaker for this Event. The Client may, without further fee or payment, use the Speaker's name and likeness for up to twelve months after the talk is delivered in marketing and promotion, but that does not suggest Speaker affiliation or endorsement. For example, the Client may share short snippets (up to 5-minute clips) from or about the event and talk that reference or include the Speaker. However, those snippets may not suggest endorsement by the speaker of the Client's products or the Client itself. The Recording in its entirety may be shared internally and with Event attendees via a private link for the 12 months after the initial airing date of <span class="payment-highlight">${eventDate}</span>. The Client agrees that they will not use the Recording for the purpose of training artificial intelligence models or digital twins of the Speaker.</p>
  </div>

  <div class="page-footer">
    Speak About AI is a division of Strong Entertainment, LLC, 651 Homer Avenue, Palo Alto, CA 94301
  </div>

  <div class="section" style="margin-top: 30px;">
    <p class="section-body"><span class="section-title">5. Cancellation</span> - This contract is binding and may be canceled only if:</p>
    <div style="margin-left: 20px;">
      <p>a) there is a mutual agreement between the parties; or</p>
      <p>b) by force majeure; or</p>
      <p>c) If the Speaker is delayed by airline delay/cancellation, accident due to travel, or incapacitated due to illness; or</p>
      <p>d) An immediate family member is stricken by serious injury, illness, or death.</p>
    </div>
  </div>

  <div class="section">
    <p class="section-title">6. Limitation of Liability</p>
    <p class="uppercase-section">6.1 EXCLUSION OF CERTAIN DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY IN THIS AGREEMENT AND TO THE FULLEST EXTENT PERMITTED UNDER APPLICABLE LAWS, IN NO EVENT WILL EITHER PARTY BE LIABLE TO THE OTHER PARTY OR TO ANY THIRD PARTY UNDER ANY TORT, CONTRACT, NEGLIGENCE, STRICT LIABILITY, OR OTHER LEGAL OR EQUITABLE THEORY FOR</p>
    <p class="uppercase-section">(1) INDIRECT, INCIDENTAL, CONSEQUENTIAL, EXEMPLARY, REPUTATIONAL, SPECIAL OR PUNITIVE DAMAGES OF ANY KIND; (2) COSTS OF PROCUREMENT, COVER, OR SUBSTITUTE SERVICES;</p>
    <p class="uppercase-section">(3) LOSS OF USE OR CORRUPTION OF DATA, CONTENT OR INFORMATION; OR</p>
    <p class="uppercase-section">(4) LOSS OF BUSINESS OPPORTUNITIES, REVENUES, PROFITS, GOODWILL, OR SAVINGS, EVEN IF THE PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH LOSS OR DAMAGES OR SUCH OR LOSS DAMAGES COULD HAVE BEEN REASONABLY FORESEEN.</p>
    <p class="uppercase-section">6.2 LIMITATION OF LIABILITY. NEITHER PARTY SHALL BE LIABLE FOR CUMULATIVE, AGGREGATE DAMAGES THAT EXCEED THE AMOUNT ACTUALLY PAID OR PAYABLE BY CLIENT TO SPEAKER OR AGENCY FOR THE APPLICABLE SERVICES.</p>
  </div>

  <div class="section">
    <p class="section-body"><span class="section-title">7. Miscellaneous</span> - This agreement represents the entire understanding between all parties, and supersedes all prior negotiations, representations, and agreements made by or between parties. No alterations, amendments, or modifications to any of the terms and conditions of this agreement shall be valid unless made in writing and signed by each party. Any controversy, dispute, or claim shall be resolved at the request of any party to this Agreement by final and binding arbitration administered by Judicial Arbitration & Mediation Services, Inc., and judgment upon any award rendered by the arbitrator may be entered by any State or Federal Court having jurisdiction thereof. This Agreement shall be governed by California law without reference to its conflicts of law principles. Any such arbitration shall occur exclusively in the County of Santa Clara, California.</p>
  </div>

  <div class="signature-section">
    <div class="signature-block">
      <span class="sig-field">Date:<span class="sig-line sig-date">&nbsp;</span></span>
      <span class="sig-field">Client Signature:<span class="sig-line sig-signature">&nbsp;</span></span>
      <span class="sig-field">Title:<span class="sig-line sig-title-field">&nbsp;</span></span>
      <span class="sig-field">Company:<span class="sig-line sig-company">&nbsp;</span></span>
    </div>
    <div class="signature-block">
      <span class="sig-field">Date:<span class="sig-line sig-date">&nbsp;</span></span>
      <span class="sig-field">Agent Signature:<span class="sig-line sig-signature">&nbsp;</span></span>
      <span class="sig-field">Title:<span class="sig-line sig-title-field">&nbsp;</span></span>
      <span class="sig-field">Company:<span class="sig-line sig-company">&nbsp;</span></span>
    </div>
  </div>

  <div class="page-footer">
    Speak About AI is a division of Strong Entertainment, LLC, 651 Homer Avenue, Palo Alto, CA 94301
  </div>

  <div class="no-print" style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 4px;">
      Print Contract
    </button>
  </div>
</body>
</html>`
}

export function validateContractData(contractData: Partial<ContractData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!contractData.client_name) errors.push('Client name is required')
  if (!contractData.client_email) errors.push('Client email is required')
  if (!contractData.event_title) errors.push('Event title is required')
  if (!contractData.event_date) errors.push('Event date is required')
  if (!contractData.event_location) errors.push('Event location is required')
  if (!contractData.deal_value || contractData.deal_value <= 0) errors.push('Deal value must be greater than 0')

  if (contractData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractData.client_email)) {
    errors.push('Valid client email is required')
  }

  if (contractData.speaker_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractData.speaker_email)) {
    errors.push('Valid speaker email is required')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

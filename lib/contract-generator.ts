export interface ContractData {
  // Event Reference
  eventReference: string
  
  // Parties
  speakerName: string
  clientName: string
  clientCompany: string
  
  // Event Details
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  
  // Financial Terms
  speakerFee: number
  travelStipend?: number
  accommodation?: string
  depositPercentage: number // Usually 50%
  paymentTerms: string // e.g., "net-30"
  
  // Speaker Deliverables
  keynoteTitle: string
  keynoteDuration: string // e.g., "40-minute"
  qaSessionDuration?: string // e.g., "20-minute"
  arrivalTime?: string
  departureTime?: string
  techCheckRequired: boolean
  virtualAlignmentMeeting: boolean
  
  // Recording Rights
  recordingPermitted: boolean
  recordingUsagePeriod?: number // months
  internalSharingAllowed: boolean
  externalSharingAllowed: boolean
  snippetSharingAllowed: boolean
  snippetMaxDuration?: number // minutes
  
  // Additional Terms
  additionalTerms?: string
  specialRequirements?: string
}

export function generateContractHTML(data: ContractData): string {
  const contractNumber = data.eventReference || `#${Date.now()}`
  const depositAmount = (data.speakerFee * data.depositPercentage) / 100
  const balanceAmount = data.speakerFee - depositAmount
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Speaker/Client/Agent Agreement - ${contractNumber}</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none;
      }
      .page-break {
        page-break-before: always;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, 'Helvetica Neue', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      position: relative;
    }
    
    .logo {
      position: absolute;
      right: 0;
      top: 0;
      width: 120px;
    }
    
    h1 {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .parties {
      margin-bottom: 25px;
      line-height: 1.8;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
      margin-top: 15px;
    }
    
    .highlight {
      color: #0066cc;
      font-weight: 600;
    }
    
    .contract-details {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    
    .contract-details p {
      margin-bottom: 5px;
    }
    
    .deliverables {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    
    .deliverables li {
      margin-bottom: 5px;
      list-style-type: disc;
    }
    
    .sub-deliverables {
      margin-left: 40px;
      margin-top: 5px;
    }
    
    .sub-deliverables li {
      list-style-type: circle;
      margin-bottom: 3px;
    }
    
    .signature-section {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    
    .signature-block {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    
    .signature-line {
      width: 45%;
    }
    
    .signature-line input {
      border: none;
      border-bottom: 1px solid #000;
      width: 100%;
      margin-bottom: 5px;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 9pt;
      color: #666;
    }
    
    .terms-section {
      margin-top: 20px;
      font-size: 10pt;
    }
    
    .terms-section h3 {
      font-size: 12pt;
      margin-top: 15px;
      margin-bottom: 10px;
    }
    
    .legal-text {
      font-size: 9pt;
      line-height: 1.4;
    }
    
    strong {
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <svg class="logo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" fill="#0066cc"/>
      <text x="100" y="90" text-anchor="middle" fill="white" font-size="48" font-weight="bold">AI</text>
      <text x="100" y="120" text-anchor="middle" fill="white" font-size="16">Speak About</text>
    </svg>
    <h1>SPEAKER/CLIENT/AGENT AGREEMENT</h1>
  </div>

  <div class="parties">
    This agreement is entered into by and between<br>
    <div style="margin-left: 20px; margin-top: 10px;">
      a) <strong>Speak About AI</strong>, a division of Strong Entertainment, LLC ("Agent" for the Speaker),<br>
      b) <strong class="highlight">${data.speakerName}</strong> ("Speaker"), and<br>
      c) <strong class="highlight">${data.clientCompany}</strong> ("Client") for the purposes of engaging the Speaker for:
    </div>
  </div>

  <div class="section">
    <div class="section-title">1. Contract details:</div>
    <div class="contract-details">
      <p><strong>Event Reference:</strong> <span class="highlight">${contractNumber}</span></p>
      <p><strong>Client & Name of Event:</strong> <span class="highlight">${data.clientCompany} / ${data.eventTitle}</span> ("Event")</p>
      <p><strong>Date(s)/Time(s):</strong> <span class="highlight">${data.eventDate} ${data.eventTime ? `from ${data.eventTime}` : ''}</span></p>
      <p><strong>Location(s):</strong> <span class="highlight">${data.eventLocation}</span></p>
      <p><strong>The fee and any other consideration payable to the Agent:</strong> <span class="highlight">$${data.speakerFee.toLocaleString()} USD</span></p>
      ${data.travelStipend || data.accommodation ? `
      <p><strong>Travel:</strong> <span class="highlight">${data.travelStipend ? `Travel stipend of $${data.travelStipend.toLocaleString()}` : ''}${data.travelStipend && data.accommodation ? ', plus ' : ''}${data.accommodation || ''}</span></p>
      ` : ''}
    </div>
    
    <p style="margin-top: 15px;"><strong>For that fee, the Speaker will provide:</strong></p>
    <ul class="deliverables">
      <li>A <strong>${data.keynoteDuration}</strong> keynote on the topic of, "<strong class="highlight">${data.keynoteTitle}</strong>"</li>
      ${data.qaSessionDuration ? `<li>A <strong>${data.qaSessionDuration}</strong> Q&A</li>` : ''}
      <li>Attendance at the main event:
        <ul class="sub-deliverables">
          ${data.arrivalTime ? `<li>${data.arrivalTime} - Speaker Arrival/Load-in ${data.techCheckRequired ? '(Tech check TBD)' : ''}</li>` : ''}
          <li>Speaker's Keynote (Exact time TBD)</li>
          ${data.qaSessionDuration ? '<li>Speaker\'s Q&A</li>' : ''}
          ${data.departureTime ? `<li>${data.departureTime}: Speaker's departure from venue (Confirmed)</li>` : ''}
        </ul>
      </li>
      ${data.virtualAlignmentMeeting ? '<li>The Speaker will also attend one 30-minute virtual alignment meeting before the event' + (data.techCheckRequired ? ', and a tech-check if requested' : '') + '.</li>' : ''}
    </ul>
  </div>

  <div class="section terms-section">
    <h3>2. Taxation</h3>
    <p>The Speaker agrees to act as an independent contractor under the terms of this agreement and assumes all responsibility for Social Security, State, and Federal Income Tax, etc., as governed by the laws of the federal government of the United States and the Speaker's state of residence. The Client is not responsible for any additional expenses or costs.</p>

    <h3>3. Deposit and Payment</h3>
    <p>A <strong>${data.depositPercentage}% Deposit</strong> is due at the time of execution/signing of this agreement. The ${100 - data.depositPercentage}% Balance Payment is due ${data.paymentTerms} days from the Client's receipt of invoice by the Agent. If this contract is executed within 45 days of the event, the client will receive one invoice combining the deposit and balance. This agreement is entered into in good faith by all parties. However, cancellation by the client shall make the client liable for the amount of the ${data.depositPercentage}% deposit. If the contract is canceled by the Speaker, the Speaker and the Agent will refund all payments made.</p>

    <h3>4. Permission to Photograph and Record</h3>
    <p>Any use of the Speaker's name, likeness, presentation content, or Recordings (as that term is defined in this section) for commercial purposes (and the section below marked "Permissible Use" is not considered to be commercial purposes) is expressly prohibited. No Trademark license is granted.</p>
    
    ${data.recordingPermitted ? `
    <p style="margin-top: 10px;"><strong>Permissible Use:</strong> All parties agree that the client may use the recorded video footage (the "Recording") of the Speaker for this Event. The Client may, without further fee or payment, use the Speaker's name and likeness for up to ${data.recordingUsagePeriod || 12} months after the talk is delivered in marketing and promotion, but that does not suggest Speaker affiliation or endorsement.</p>
    
    <p style="margin-top: 10px;">For example, the Client may share short snippets (up to ${data.snippetMaxDuration || 5}-minute clips) from or about the event and talk that reference or include the Speaker. However, those snippets may not suggest endorsement by the speaker of the Client's products or the Client itself. The Recording in its entirety may be shared ${data.internalSharingAllowed ? 'internally and' : ''} ${data.externalSharingAllowed ? 'with Event attendees' : ''} via a private link for the ${data.recordingUsagePeriod || 12} months after the initial airing date of ${data.eventDate}. The Client agrees that they will not use the Recording for the purpose of training artificial intelligence models or digital twins of the Speaker.</p>
    ` : ''}
  </div>

  <div class="footer">
    Speak About AI is a division of Strong Entertainment, LLC, 651 Homer Avenue, Palo Alto, CA 94301
  </div>

  <div class="page-break"></div>

  <div class="section terms-section">
    <h3>5. Cancellation</h3>
    <p>This contract is binding and may be canceled only if:</p>
    <ul style="margin-left: 20px; margin-top: 10px;">
      <li>a) there is a mutual agreement between the parties; or</li>
      <li>b) by force majeure; or</li>
      <li>c) If the Speaker is delayed by airline delay/cancellation, accident due to travel, or incapacitated due to illness; or</li>
      <li>d) An immediate family member is stricken by serious injury, illness, or death.</li>
    </ul>

    <h3>6. Limitation of Liability</h3>
    <div class="legal-text">
      <p><strong>6.1 EXCLUSION OF CERTAIN DAMAGES.</strong> NOTWITHSTANDING ANYTHING TO THE CONTRARY IN THIS AGREEMENT AND TO THE FULLEST EXTENT PERMITTED UNDER APPLICABLE LAWS, IN NO EVENT WILL EITHER PARTY BE LIABLE TO THE OTHER PARTY OR TO ANY THIRD PARTY UNDER ANY TORT, CONTRACT, NEGLIGENCE, STRICT LIABILITY, OR OTHER LEGAL OR EQUITABLE THEORY FOR</p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li>(1) INDIRECT, INCIDENTAL, CONSEQUENTIAL, EXEMPLARY, REPUTATIONAL, SPECIAL OR PUNITIVE DAMAGES OF ANY KIND;</li>
        <li>(2) COSTS OF PROCUREMENT, COVER, OR SUBSTITUTE SERVICES;</li>
        <li>(3) LOSS OF USE OR CORRUPTION OF DATA, CONTENT OR INFORMATION; OR</li>
        <li>(4) LOSS OF BUSINESS OPPORTUNITIES, REVENUES, PROFITS, GOODWILL, OR SAVINGS, EVEN IF THE PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH LOSS OR DAMAGES OR SUCH OR LOSS DAMAGES COULD HAVE BEEN REASONABLY FORESEEN.</li>
      </ul>
      
      <p style="margin-top: 15px;"><strong>6.2 LIMITATION OF LIABILITY.</strong> NEITHER PARTY SHALL BE LIABLE FOR CUMULATIVE, AGGREGATE DAMAGES THAT EXCEED THE AMOUNT ACTUALLY PAID OR PAYABLE BY CLIENT TO SPEAKER OR AGENCY FOR THE APPLICABLE SERVICES.</p>
    </div>

    <h3>7. Miscellaneous</h3>
    <p>This agreement represents the entire understanding between all parties, and supersedes all prior negotiations, representations, and agreements made by or between parties. No alterations, amendments, or modifications to any of the terms and conditions of this agreement shall be valid unless made in writing and signed by each party. Any controversy, dispute, or claim shall be resolved at the request of any party to this Agreement by final and binding arbitration administered by Judicial Arbitration & Mediation Services, Inc., and judgment upon any award rendered by the arbitrator may be entered by any State or Federal Court having jurisdiction thereof. This Agreement shall be governed by California law without reference to its conflicts of law principles. Any such arbitration shall occur exclusively in the County of Santa Clara, California.</p>
  </div>

  <div class="signature-section">
    <div class="signature-block">
      <div class="signature-line">
        <p>Date: _____________</p>
        <p>Client Signature: _____________________________</p>
        <p>Title: _____________________________</p>
        <p>Company: ${data.clientCompany}</p>
      </div>
    </div>
    
    <div class="signature-block">
      <div class="signature-line">
        <p>Date: _____________</p>
        <p>Agent Signature: _____________________________</p>
        <p>Title: _____________________________</p>
        <p>Company: Speak About AI</p>
      </div>
    </div>
  </div>

  <div class="footer" style="margin-top: 50px;">
    Speak About AI is a division of Strong Entertainment, LLC, 651 Homer Avenue, Palo Alto, CA 94301
  </div>
</body>
</html>
  `
}

export function extractContractData(deal: any, contract: any): ContractData {
  return {
    eventReference: contract.contract_number || `#${Date.now()}`,
    speakerName: contract.speaker_name || deal?.speaker_requested || '',
    clientName: contract.client_name || deal?.client_name || '',
    clientCompany: contract.client_company || deal?.company || '',
    eventTitle: contract.event_title || deal?.event_title || '',
    eventDate: contract.event_date ? new Date(contract.event_date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : '',
    eventTime: '10:00 am to 12:30 pm', // Default, should be customizable
    eventLocation: contract.event_location || deal?.event_location || '',
    speakerFee: parseFloat(contract.fee_amount || deal?.deal_value || 0),
    travelStipend: deal?.travel_stipend || 0,
    accommodation: deal?.hotel_required ? 'one-night accommodation at a 4-star hotel' : '',
    depositPercentage: 50,
    paymentTerms: contract.payment_terms === 'Net 30' ? 'net-30' : contract.payment_terms === 'Net 15' ? 'net-15' : 'due upon receipt',
    keynoteTitle: 'The Future of AI', // Should be customizable
    keynoteDuration: '40-minute',
    qaSessionDuration: '20-minute',
    arrivalTime: '10:00 am',
    departureTime: '12:30 pm',
    techCheckRequired: true,
    virtualAlignmentMeeting: true,
    recordingPermitted: true,
    recordingUsagePeriod: 12,
    internalSharingAllowed: true,
    externalSharingAllowed: true,
    snippetSharingAllowed: true,
    snippetMaxDuration: 5,
    additionalTerms: contract.terms,
    specialRequirements: contract.special_requirements
  }
}
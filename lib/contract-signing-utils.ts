import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

// Sections that require initials (sections 2-7 of the contract)
export const INITIAL_REQUIRED_SECTIONS = [
  { id: "section-2", label: "Taxation", number: 2 },
  { id: "section-3", label: "Deposit and Payment", number: 3 },
  { id: "section-4", label: "Permission to Photograph and Record", number: 4 },
  { id: "section-5", label: "Cancellation", number: 5 },
  { id: "section-6", label: "Limitation of Liability", number: 6 },
  { id: "section-7", label: "Miscellaneous", number: 7 },
]

/**
 * Validate that all required sections have been initialed
 */
export function validateInitialsComplete(
  initials: Array<{ section_id: string; signer_type: string }>,
  signerType: string
): { complete: boolean; missing: string[] } {
  const signerInitials = initials.filter(i => i.signer_type === signerType)
  const initialedSections = new Set(signerInitials.map(i => i.section_id))
  const missing = INITIAL_REQUIRED_SECTIONS
    .filter(s => !initialedSections.has(s.id))
    .map(s => s.label)

  return {
    complete: missing.length === 0,
    missing,
  }
}

/**
 * Compute SHA-256 hash for document integrity
 */
export function computeDocumentHash(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex")
}

/**
 * Generate the final signed contract HTML with embedded signatures and initials
 */
export function generateSignedContractHTML(
  contractData: {
    contractNumber: string
    eventTitle: string
    eventDate: string
    eventLocation: string
    speakerName: string
    clientName: string
    clientCompany: string
    dealValue: number
    travelDetails: string
    deliverables: string
    depositPercent: number
    midPaymentPercent: number
    midPaymentDate: string
    balancePercent: number
    balanceDueDate: string
    eventReference: string
  },
  signatures: Array<{
    signer_type: string
    signer_name: string
    signer_title: string
    signature_data: string
    signed_at: string
  }>,
  initials: Array<{
    section_id: string
    signer_type: string
    initial_data: string
  }>
): string {
  const clientSig = signatures.find(s => s.signer_type === "client")
  const speakerSig = signatures.find(s => s.signer_type === "speaker")
  const cd = contractData

  function getInitialImg(sectionId: string, signerType: string): string {
    const initial = initials.find(i => i.section_id === sectionId && i.signer_type === signerType)
    if (!initial) return ""
    return `<img src="${initial.initial_data}" style="height:20px;vertical-align:middle;margin-left:8px;" alt="Initials" />`
  }

  function renderSectionInitials(sectionId: string): string {
    const clientInitial = getInitialImg(sectionId, "client")
    const speakerInitial = getInitialImg(sectionId, "speaker")
    if (!clientInitial && !speakerInitial) return ""
    return `<div style="margin-top:4px;font-size:9pt;color:#666;">Initialed: ${clientInitial} ${speakerInitial}</div>`
  }

  const deliverablesHtml = cd.deliverables
    .split("\n")
    .filter((l: string) => l.trim())
    .map((line: string) => `<li style="color:#2563eb;font-weight:bold;margin:2px 0;">${line.replace(/^[-*]\s*/, "").trim()}</li>`)
    .join("")

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Signed Contract - ${cd.contractNumber}</title>
<style>
  body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; margin: 0; padding: 0.75in 1in; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .header h1 { font-size: 18pt; font-weight: bold; margin: 0; }
  .section { margin: 20px 0; }
  .section p { text-align: justify; }
  .blue { color: #2563eb; font-weight: bold; }
  .footer { text-align: center; font-size: 9pt; font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 40px; }
  .sig-block { margin-bottom: 30px; display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .sig-line { border-bottom: 1px solid #333; display: inline-block; min-width: 120px; padding: 0 4px; }
  .signed-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: bold; margin-left: 8px; }
</style>
</head>
<body>
  <div class="header">
    <h1>SPEAKER/CLIENT/AGENT AGREEMENT</h1>
    <div style="text-align:right;font-size:9pt;color:#666;">
      <div>Contract #${cd.contractNumber}</div>
      <div class="signed-badge">FULLY EXECUTED</div>
    </div>
  </div>

  <div style="margin-bottom:8px;">
    <p style="margin:4px 0;">This agreement is entered into by and between</p>
    <p style="margin:4px 0 4px 20px;">a) <span class="blue">Speak About AI</span>, a division of Strong Entertainment, LLC ("Agent" for the "Speaker"),</p>
    <p style="margin:4px 0 4px 20px;">b) <span class="blue">${cd.speakerName}</span> ("Speaker"), and</p>
    <p style="margin:4px 0 4px 20px;">c) <span class="blue">${cd.clientName}</span> ("Client") for the purposes of engaging the Speaker for:</p>
  </div>

  <div style="margin:16px 0;">
    <p style="font-weight:bold;">Contract details:</p>
    <div style="margin-left:8px;">
      <p style="margin:4px 0;"><strong>Event Reference:</strong> <span class="blue">${cd.eventReference}</span></p>
      <p style="margin:4px 0;"><strong>Client & Name of Event:</strong> <span class="blue">${cd.clientCompany}${cd.clientCompany && cd.eventTitle ? " / " : ""}${cd.eventTitle}</span></p>
      <p style="margin:4px 0;"><strong>Date(s)/Time(s):</strong> <span class="blue">Event on ${cd.eventDate}</span></p>
      <p style="margin:4px 0;"><strong>Location(s):</strong> <span class="blue">${cd.eventLocation}</span></p>
      <p style="margin:4px 0;"><strong>The fee and any other consideration payable to the Agent:</strong> <span class="blue">$${cd.dealValue.toLocaleString("en-US")} USD</span></p>
      <p style="margin:4px 0;"><strong>Travel:</strong> <span class="blue">${cd.travelDetails}</span></p>
      <p style="font-weight:bold;margin:8px 0 4px 0;">For that fee, the Speaker will provide:</p>
      <ul style="margin:4px 0 4px 24px;padding-left:0;">${deliverablesHtml}</ul>
    </div>
  </div>

  <div class="section">
    <p><strong>2. Taxation</strong> - The Speaker agrees to act as an independent contractor under the terms of this agreement and assumes all responsibility for Social Security, State, and Federal Income Tax, etc., as governed by the laws of the federal government of the United States and the Speaker's state of residence. The Client is not responsible for any additional expenses or costs.</p>
    ${renderSectionInitials("section-2")}
  </div>

  <div class="section">
    <p><strong>3. Deposit and Payment</strong> - A <span class="blue">${cd.depositPercent}% Deposit is due at the time of execution/signing of this agreement. An additional ${cd.midPaymentPercent}% is due ${cd.midPaymentDate}, and the remaining ${cd.balancePercent}% Balance Payment is due by ${cd.balanceDueDate}</span>. All parties enter into this agreement in good faith. However, cancellation by the client shall make the client liable for the amount of the 50% deposit. If the contract is canceled by the Speaker, the Speaker and the Agent will refund all payments made.</p>
    ${renderSectionInitials("section-3")}
  </div>

  <div class="section">
    <p><strong>4. Permission to Photograph and Record</strong> - Any use of the Speaker's name, likeness, presentation content, or Recordings (as that term is defined in this section) for commercial purposes (and the section below marked "Permissible Use" is not considered to be commercial purposes) is expressly prohibited. No Trademark license is granted.</p>
    <p style="margin-top:12px;"><strong>Permissible Use:</strong> All parties agree that the client may use the recorded video footage (the "Recording") of the Speaker for this Event. The Client may, without further fee or payment, use the Speaker's name and likeness for up to twelve months after the talk is delivered in marketing and promotion, but that does not suggest Speaker affiliation or endorsement. For example, the Client may share short snippets (up to 5-minute clips) from or about the event and talk that reference or include the Speaker. However, those snippets may not suggest endorsement by the speaker of the Client's products or the Client itself. The Recording in its entirety may be shared internally and with Event attendees via a private link for the 12 months after the initial airing date of <span class="blue">${cd.eventDate}</span>. The Client agrees that they will not use the Recording for the purpose of training artificial intelligence models or digital twins of the Speaker.</p>
    ${renderSectionInitials("section-4")}
  </div>

  <div class="footer">
    Speak About AI is a division of Strong Entertainment, LLC, 651 Homer Avenue, Palo Alto, CA 94301
  </div>

  <div class="section" style="margin-top:30px;">
    <p><strong>5. Cancellation</strong> - This contract is binding and may be canceled only if:</p>
    <div style="margin-left:20px;">
      <p>a) there is a mutual agreement between the parties; or</p>
      <p>b) by force majeure; or</p>
      <p>c) If the Speaker is delayed by airline delay/cancellation, accident due to travel, or incapacitated due to illness; or</p>
      <p>d) An immediate family member is stricken by serious injury, illness, or death.</p>
    </div>
    ${renderSectionInitials("section-5")}
  </div>

  <div class="section">
    <p style="font-weight:bold;">6. Limitation of Liability</p>
    <p style="text-transform:uppercase;font-weight:bold;">6.1 EXCLUSION OF CERTAIN DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY IN THIS AGREEMENT AND TO THE FULLEST EXTENT PERMITTED UNDER APPLICABLE LAWS, IN NO EVENT WILL EITHER PARTY BE LIABLE TO THE OTHER PARTY OR TO ANY THIRD PARTY UNDER ANY TORT, CONTRACT, NEGLIGENCE, STRICT LIABILITY, OR OTHER LEGAL OR EQUITABLE THEORY FOR (1) INDIRECT, INCIDENTAL, CONSEQUENTIAL, EXEMPLARY, REPUTATIONAL, SPECIAL OR PUNITIVE DAMAGES OF ANY KIND; (2) COSTS OF PROCUREMENT, COVER, OR SUBSTITUTE SERVICES; (3) LOSS OF USE OR CORRUPTION OF DATA, CONTENT OR INFORMATION; OR (4) LOSS OF BUSINESS OPPORTUNITIES, REVENUES, PROFITS, GOODWILL, OR SAVINGS, EVEN IF THE PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH LOSS OR DAMAGES OR SUCH OR LOSS DAMAGES COULD HAVE BEEN REASONABLY FORESEEN.</p>
    <p style="text-transform:uppercase;font-weight:bold;margin-top:12px;">6.2 LIMITATION OF LIABILITY. NEITHER PARTY SHALL BE LIABLE FOR CUMULATIVE, AGGREGATE DAMAGES THAT EXCEED THE AMOUNT ACTUALLY PAID OR PAYABLE BY CLIENT TO SPEAKER OR AGENCY FOR THE APPLICABLE SERVICES.</p>
    ${renderSectionInitials("section-6")}
  </div>

  <div class="section">
    <p><strong>7. Miscellaneous</strong> - This agreement represents the entire understanding between all parties, and supersedes all prior negotiations, representations, and agreements made by or between parties. No alterations, amendments, or modifications to any of the terms and conditions of this agreement shall be valid unless made in writing and signed by each party. Any controversy, dispute, or claim shall be resolved at the request of any party to this Agreement by final and binding arbitration administered by Judicial Arbitration & Mediation Services, Inc., and judgment upon any award rendered by the arbitrator may be entered by any State or Federal Court having jurisdiction thereof. This Agreement shall be governed by California law without reference to its conflicts of law principles. Any such arbitration shall occur exclusively in the County of Santa Clara, California.</p>
    ${renderSectionInitials("section-7")}
  </div>

  <div style="margin-top:40px;">
    <div class="sig-block">
      <span>Date: <span class="sig-line">${clientSig ? new Date(clientSig.signed_at).toLocaleDateString() : ""}</span></span>
      <span>Client Signature: <span class="sig-line" style="min-width:200px;">
        ${clientSig?.signature_data ? `<img src="${clientSig.signature_data}" style="height:40px;vertical-align:bottom;" alt="Client Signature" />` : ""}
      </span></span>
      <span>Title: <span class="sig-line">${clientSig?.signer_title || ""}</span></span>
      <span>Company: <span class="sig-line">${cd.clientCompany}</span></span>
    </div>

    <div class="sig-block">
      <span>Date: <span class="sig-line">${speakerSig ? new Date(speakerSig.signed_at).toLocaleDateString() : ""}</span></span>
      <span>Agent Signature: <span class="sig-line" style="min-width:200px;">
        ${speakerSig?.signature_data ? `<img src="${speakerSig.signature_data}" style="height:40px;vertical-align:bottom;" alt="Agent Signature" />` : ""}
      </span></span>
      <span>Title: <span class="sig-line">${speakerSig?.signer_title || ""}</span></span>
      <span>Company: <span class="sig-line">${speakerSig ? "Speak About AI" : ""}</span></span>
    </div>
  </div>

  <div class="footer">
    Speak About AI is a division of Strong Entertainment, LLC, 651 Homer Avenue, Palo Alto, CA 94301
  </div>

  <div style="margin-top:20px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:9pt;color:#166534;">
    <strong>Document Integrity:</strong> This is a digitally signed document. All signatures and initials were captured electronically with IP address and timestamp verification.
  </div>
</body>
</html>`
}

/**
 * Log a signing action to the audit trail
 */
export async function logSigningAudit(
  contractId: number,
  action: string,
  signerType: string | null,
  signerEmail: string | null,
  ipAddress: string | null,
  userAgent: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    await sql`
      INSERT INTO contract_signing_audit (
        contract_id, action, signer_type, signer_email,
        ip_address, user_agent, metadata
      ) VALUES (
        ${contractId}, ${action}, ${signerType}, ${signerEmail},
        ${ipAddress}, ${userAgent}, ${JSON.stringify(metadata || {})}::jsonb
      )
    `
  } catch (error) {
    console.error("Failed to log signing audit:", error)
  }
}

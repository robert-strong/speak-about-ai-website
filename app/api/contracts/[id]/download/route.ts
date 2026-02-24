import { NextRequest, NextResponse } from "next/server"
import { getContractById } from "@/lib/contracts-db"
import { processTemplate, defaultContractTemplates } from "@/lib/contract-templates"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contractId = parseInt(id)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const contract = await getContractById(contractId)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Parse contract_data
    let contractValues: Record<string, any> = {}
    if (contract.contract_data) {
      try {
        contractValues = typeof contract.contract_data === 'string'
          ? JSON.parse(contract.contract_data)
          : contract.contract_data
      } catch (e) {
        console.warn("Failed to parse contract_data:", e)
      }
    }

    // Fill in values from contract columns if not in contract_data
    if (!contractValues.speaker_name && contract.speaker_name) contractValues.speaker_name = contract.speaker_name
    if (!contractValues.client_contact_name && contract.client_name) contractValues.client_contact_name = contract.client_name
    if (!contractValues.client_company && contract.client_company) contractValues.client_company = contract.client_company
    if (!contractValues.client_email && contract.client_email) contractValues.client_email = contract.client_email
    if (!contractValues.event_title && contract.event_title) contractValues.event_title = contract.event_title
    if (!contractValues.event_date && contract.event_date) {
      contractValues.event_date = new Date(contract.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    if (!contractValues.event_location && contract.event_location) contractValues.event_location = contract.event_location
    if (!contractValues.deal_value && contract.fee_amount) contractValues.deal_value = Number(contract.fee_amount).toLocaleString('en-US')
    if (!contractValues.event_reference) contractValues.event_reference = contract.contract_number

    // Get the template
    const template = defaultContractTemplates.find(
      t => t.id === (contract.template_id || 'standard-speaker-agreement')
    )

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Process the template with contract data
    const contractContent = processTemplate(template, contractValues)

    // Generate HTML document matching the PDF style
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contract.title || 'Contract'} - ${contract.contract_number}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0.5in 0.75in; }
      .no-print { display: none; }
    }
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
      margin: 0;
    }
    .header-logo {
      width: 180px;
      height: auto;
    }
    p { margin: 8px 0; text-align: justify; }
    strong { font-weight: bold; }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
    ${contract.status !== 'fully_executed' ? '.draft-badge { display: inline-block; padding: 2px 8px; background: #ffc107; color: white; font-size: 10px; border-radius: 3px; margin-left: 10px; }' : ''}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="header-title">
        ${contract.contract_number}
        ${contract.status !== 'fully_executed' ? '<span class="draft-badge">DRAFT</span>' : ''}
      </h1>
    </div>
    <img src="/speak-about-ai-logo.png" alt="Speak About AI" class="header-logo" />
  </div>

  ${contractContent.split('\n').map((line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('SPEAKER/CLIENT/AGENT AGREEMENT')) {
      return `<h2 style="font-size: 16pt; margin-bottom: 16px;">${trimmed}</h2>`
    }
    // Bold items like **Label:** value
    if (trimmed.startsWith('**') && trimmed.includes(':**')) {
      return `<p>${trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`
    }
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return `<p><strong>${trimmed.replace(/\*\*/g, '')}</strong></p>`
    }
    if (trimmed.includes('**')) {
      return `<p>${trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`
    }
    if (trimmed.startsWith('- ')) {
      return `<ul style="margin: 2px 0 2px 20px;"><li>${trimmed.replace('- ', '')}</li></ul>`
    }
    return `<p>${trimmed}</p>`
  }).join('\n')}

  <div class="footer">
    Speak About AI is a division of Strong Entertainment, LLC, 651 Homer Avenue, Palo Alto, CA 94301
  </div>

  <div class="no-print" style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 4px;">
      Print Contract
    </button>
  </div>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${contract.contract_number}.html"`
      }
    })
  } catch (error) {
    console.error("Error downloading contract:", error)
    return NextResponse.json(
      { error: "Failed to download contract" },
      { status: 500 }
    )
  }
}

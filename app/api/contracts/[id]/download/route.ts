import { NextRequest, NextResponse } from "next/server"
import { getContractById } from "@/lib/contracts-db"
import { processTemplate, defaultContractTemplates } from "@/lib/contract-templates"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = parseInt(params.id)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const contract = await getContractById(contractId)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Get the template
    const template = defaultContractTemplates.find(
      t => t.id === (contract.template_id || 'standard-speaker-agreement')
    )

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Process the template with contract data
    const contractContent = processTemplate(template, contract.metadata || {})

    // Generate HTML document
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contract.title || 'Contract'} - ${contract.contract_number}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: white;
    }
    h1 {
      font-size: 24px;
      text-align: center;
      margin-bottom: 30px;
      text-transform: uppercase;
    }
    h2 {
      font-size: 18px;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    h3 {
      font-size: 16px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    p, li {
      text-align: justify;
      margin-bottom: 10px;
    }
    .contract-header {
      margin-bottom: 30px;
    }
    .party-info {
      margin-bottom: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-left: 3px solid #333;
    }
    .signature-section {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    .signature-line {
      margin-top: 40px;
      border-bottom: 1px solid #333;
      width: 300px;
      display: inline-block;
    }
    .signature-block {
      margin-bottom: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    .page-break {
      page-break-before: always;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      background: #ffc107;
      color: white;
      font-size: 12px;
      border-radius: 3px;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="contract-header">
    <p style="text-align: right;">
      Contract #: <strong>${contract.contract_number}</strong><br>
      Date: <strong>${new Date().toLocaleDateString()}</strong>
      ${contract.status !== 'fully_executed' ? '<span class="status-badge">DRAFT</span>' : ''}
    </p>
  </div>
  
  ${contractContent.split('\n').map(line => {
    if (line.startsWith('## ')) {
      return `<h2>${line.replace('## ', '')}</h2>`
    } else if (line.startsWith('### ')) {
      return `<h3>${line.replace('### ', '')}</h3>`
    } else if (line.startsWith('**') && line.endsWith('**')) {
      return `<p><strong>${line.replace(/\*\*/g, '')}</strong></p>`
    } else if (line.includes('**')) {
      return `<p>${line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`
    } else if (line.startsWith('- ')) {
      return `<ul><li>${line.replace('- ', '')}</li></ul>`
    } else if (line.trim() === '') {
      return ''
    } else {
      return `<p>${line}</p>`
    }
  }).join('\n')}
  
  <div class="no-print" style="text-align: center; margin-top: 50px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
      Print Contract
    </button>
  </div>
</body>
</html>
    `

    // Return HTML as response with PDF download headers
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
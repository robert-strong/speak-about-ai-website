import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"
import * as fs from 'fs'
import * as path from 'path'

const sql = neon(process.env.DATABASE_URL!)

// Embed logo as base64 for reliable PDF rendering
function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'speak-about-ai-logo.png')
    const logoBuffer = fs.readFileSync(logoPath)
    return `data:image/png;base64,${logoBuffer.toString('base64')}`
  } catch (error) {
    console.error('Error loading logo:', error)
    // Fallback to URL
    return 'https://www.speakabout.ai/speak-about-ai-logo.png'
  }
}

function generateInvoiceHTML(invoice: any): string {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Use base64 embedded logo for reliable PDF rendering
  const logoUrl = getLogoBase64()

  // Build line item description
  const lineItemDescription = `${invoice.speaker_name || invoice.requested_speaker_name || 'Speaker'} ${invoice.program_type || 'Talk'} for ${invoice.event_name || invoice.project_title || 'Event'}`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #333;
          line-height: 1.5;
          padding: 40px;
          font-size: 14px;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }
        .logo-section img {
          height: 60px;
        }
        .invoice-title-section {
          text-align: right;
        }
        .invoice-title {
          font-size: 36px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
        }
        .invoice-number-header {
          font-size: 16px;
          color: #666;
        }
        .company-line {
          margin: 20px 0;
          font-size: 13px;
          color: #333;
        }
        .info-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .pay-to-section, .billed-to-section {
          font-size: 13px;
          line-height: 1.6;
        }
        .pay-to-section {
          max-width: 280px;
        }
        .section-label {
          font-weight: normal;
          color: #333;
          margin-bottom: 8px;
        }
        .section-content strong {
          font-weight: 600;
        }
        .dates-section {
          text-align: right;
        }
        .date-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          min-width: 200px;
        }
        .date-label {
          color: #666;
        }
        .date-value {
          font-weight: 500;
          text-align: right;
        }
        .balance-due-row {
          background: #f5f5f5;
          padding: 8px 12px;
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
        }
        .balance-due-label {
          font-weight: 600;
        }
        .balance-due-value {
          font-weight: 700;
          font-size: 16px;
        }
        .invoice-table {
          width: 100%;
          margin: 30px 0;
          border-collapse: collapse;
        }
        .invoice-table th {
          background: #4a5568;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 500;
        }
        .invoice-table th:nth-child(2),
        .invoice-table th:nth-child(3),
        .invoice-table th:nth-child(4) {
          text-align: center;
          width: 100px;
        }
        .invoice-table th:last-child {
          text-align: right;
        }
        .invoice-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }
        .invoice-table td:nth-child(2),
        .invoice-table td:nth-child(3) {
          text-align: center;
        }
        .invoice-table td:last-child {
          text-align: right;
          font-weight: 500;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin: 20px 0;
        }
        .totals-box {
          width: 250px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .totals-row:last-child {
          font-weight: 600;
          font-size: 16px;
          border-bottom: none;
        }
        .notes-section, .terms-section {
          margin-top: 30px;
        }
        .notes-section h4, .terms-section h4 {
          font-size: 13px;
          font-weight: 500;
          color: #333;
          margin-bottom: 8px;
        }
        .notes-section p, .terms-section p {
          font-size: 13px;
          color: #555;
          line-height: 1.6;
        }
        @media print {
          body { padding: 20px; }
          .invoice-container { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header with Logo and Invoice Title -->
        <div class="header">
          <div class="logo-section">
            <img src="${logoUrl}" alt="Speak About AI" />
          </div>
          <div class="invoice-title-section">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number-header"># ${invoice.invoice_number.replace('INV-', '')}</div>
          </div>
        </div>

        <!-- Company Line -->
        <div class="company-line">
          <strong>Speak About AI</strong> (A Division of Strong Entertainment, LLC)
        </div>

        <!-- Info Grid: Pay To, Billed To, and Dates -->
        <div class="info-grid">
          <div class="pay-to-section">
            <div class="section-label">Pay To:</div>
            <div class="section-content">
              ${invoice.banking_info?.account_name ? `<strong>Name:</strong> Robert Strong<br>` : ''}
              <strong>Business:</strong> Strong Entertainment, LLC<br>
              <strong>Address:</strong> 651 Homer Ave, Palo Alto, CA 94301<br>
              ${invoice.banking_info?.account_number ? `<strong>Account Number:</strong> ${invoice.banking_info.account_number}<br>` : ''}
              ${invoice.banking_info?.routing_number ? `<strong>Routing Number:</strong> ${invoice.banking_info.routing_number}<br>` : ''}
              <strong>Email:</strong> human@speakabout.ai<br>
              <strong>Phone:</strong> (1) 415-665-2442<br>
              <strong>EIN:</strong> 84-4432163
            </div>
          </div>

          <div class="billed-to-section">
            <div class="section-label">Billed To:</div>
            <div class="section-content">
              <strong>Name:</strong> ${invoice.client_name || 'N/A'}<br>
              <strong>Business:</strong> ${invoice.company || invoice.client_company || 'N/A'}
            </div>
          </div>

          <div class="dates-section">
            <div class="date-row">
              <span class="date-label">Date:</span>
              <span class="date-value">${formatDate(invoice.issue_date)}</span>
            </div>
            <div class="date-row">
              <span class="date-label">Due Date:</span>
              <span class="date-value">${formatDate(invoice.due_date)}</span>
            </div>
            ${invoice.po_number ? `
            <div class="date-row">
              <span class="date-label">PO Number:</span>
              <span class="date-value">${invoice.po_number}</span>
            </div>
            ` : ''}
            <div class="balance-due-row">
              <span class="balance-due-label">Balance Due:</span>
              <span class="balance-due-value">${formatCurrency(parseFloat(invoice.amount))}</span>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Fee</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${lineItemDescription}</td>
              <td>1</td>
              <td>${formatCurrency(parseFloat(invoice.amount))}</td>
              <td>${formatCurrency(parseFloat(invoice.amount))}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(parseFloat(invoice.amount))}</span>
            </div>
            <div class="totals-row">
              <span>Tax (0%):</span>
              <span>$0.00</span>
            </div>
            <div class="totals-row">
              <span>Total:</span>
              <span>${formatCurrency(parseFloat(invoice.amount))}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        ${(invoice.notes || invoice.description || invoice.deliverables) ? `
        <div class="notes-section">
          <h4>Notes:</h4>
          <p>${invoice.notes || invoice.description || `Payment for ${invoice.program_length || 60}-minute ${invoice.program_type || 'talk'} by ${invoice.speaker_name || 'speaker'} on the topic of ${invoice.program_topic || 'AI'}${invoice.event_date ? ` for event on ${formatDate(invoice.event_date)}` : ''}.`}</p>
        </div>
        ` : `
        <div class="notes-section">
          <h4>Notes:</h4>
          <p>Payment for ${invoice.program_length || 60}-minute ${invoice.program_type || 'talk'} by ${invoice.speaker_name || invoice.requested_speaker_name || 'speaker'} on the topic of ${invoice.program_topic || 'AI'}${invoice.event_date ? ` for event on ${formatDate(invoice.event_date)}` : ''}.</p>
        </div>
        `}

        <!-- Terms -->
        <div class="terms-section">
          <h4>Terms:</h4>
          <p>Please pay using ACH by ${formatDate(invoice.due_date)}.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const invoiceId = parseInt(id)
    
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 })
    }

    // Fetch invoice with project and speaker details
    const [invoice] = await sql`
      SELECT
        i.*,
        p.project_name as project_title,
        p.event_date,
        p.event_location,
        p.event_type,
        p.event_name,
        p.requested_speaker_name,
        p.program_topic,
        p.program_type,
        p.audience_size,
        p.program_start_time,
        p.program_length,
        p.qa_length,
        p.av_requirements,
        p.recording_allowed,
        p.tech_rehearsal_date,
        p.deliverables,
        p.description as project_description,
        p.purchase_order_number,
        s.name as speaker_name,
        s.title as speaker_title
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN speakers s ON p.speaker_id = s.id
      WHERE i.id = ${invoiceId}
    `

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Parse overrides from notes if they exist
    let overrides: any = {}
    let plainNotes = invoice.notes
    
    if (invoice.notes) {
      try {
        const notesData = JSON.parse(invoice.notes)
        if (typeof notesData === 'object' && notesData.overrides) {
          overrides = notesData.overrides
          plainNotes = notesData.text || ''
        }
      } catch (e) {
        // Notes might be plain text, that's okay
        plainNotes = invoice.notes
      }
    }

    // Fetch banking configuration securely
    let bankingInfo = {}
    
    // Check if environment variables are set
    const hasEnvVars = !!(
      process.env.ENTITY_NAME || 
      process.env.BANK_NAME || 
      process.env.ACCOUNT_NUMBER || 
      process.env.ROUTING_NUMBER
    )
    
    // Always try to set banking info from environment variables
    bankingInfo = {
      bank_name: process.env.BANK_NAME || '',
      account_name: process.env.ENTITY_NAME || '',
      entity_address: process.env.ENTITY_ADDRESS || '',
      account_number: process.env.ACCOUNT_NUMBER || '',  // Show full account number
      routing_number: process.env.ROUTING_NUMBER || '',  // Show full routing number
      swift_code: process.env.SWIFT_CODE || '',
      bank_address: process.env.BANK_ADDRESS || '',
      currency_type: process.env.CURRENCY_TYPE || 'USD',
      wire_instructions: process.env.BANK_WIRE_INSTRUCTIONS || (process.env.SWIFT_CODE ? `Please use SWIFT code ${process.env.SWIFT_CODE} for international transfers` : ''),
      ach_instructions: process.env.BANK_ACH_INSTRUCTIONS || 'For ACH transfers, use the routing and account numbers provided above'
    }
    
    
    // Only try database if we don't have valid banking info yet
    const needsDatabase = !(bankingInfo.account_name || bankingInfo.bank_name || bankingInfo.account_number)
    if (needsDatabase) {
      // No env vars found, checking database
      // Fallback to database (using safe view with masked sensitive data)
      try {
        const bankingConfigs = await sql`
          SELECT config_key, value FROM banking_info_safe
          WHERE config_key IN (
            'bank_name', 'account_name', 'account_number', 'routing_number',
            'swift_code', 'bank_address', 'wire_instructions', 'ach_instructions',
            'entity_name', 'entity_address'
          )
        `
        
        
        if (bankingConfigs.length > 0) {
          const dbBankingInfo = {}
          bankingConfigs.forEach(config => {
            // Map entity_name to account_name for consistency
            if (config.config_key === 'entity_name') {
              dbBankingInfo['account_name'] = config.value
            } else if (config.config_key === 'account_name' && !dbBankingInfo['account_name']) {
              dbBankingInfo['account_name'] = config.value
            } else {
              dbBankingInfo[config.config_key] = config.value
            }
          })
          // Use database values if env vars are not set
          bankingInfo = dbBankingInfo
        }
      } catch (error) {
        console.error('Error fetching banking config from database:', error)
      }
    }

    // Get payment terms
    const paymentTerms = invoice.invoice_type === 'deposit' 
      ? (process.env.INVOICE_DEPOSIT_TERMS || 'Net 30 days from issue date')
      : (process.env.INVOICE_FINAL_TERMS || 'Due on event date')

    // Merge overrides with invoice data
    const invoiceWithOverrides = {
      ...invoice,
      notes: plainNotes,
      event_name: overrides.event_name || invoice.event_name,
      speaker_name: overrides.speaker_name || invoice.speaker_name || invoice.requested_speaker_name,
      program_topic: overrides.program_topic || invoice.program_topic,
      program_type: overrides.program_type || invoice.program_type,
      program_length: overrides.program_length || invoice.program_length,
      qa_length: overrides.qa_length || invoice.qa_length,
      audience_size: overrides.audience_size || invoice.audience_size,
      deliverables: overrides.deliverables || invoice.deliverables,
      po_number: overrides.po_number || invoice.po_number || invoice.purchase_order_number,
      banking_info: bankingInfo,
      payment_terms: paymentTerms
    }

    // Generate HTML
    const html = generateInvoiceHTML(invoiceWithOverrides)

    // Return HTML with appropriate headers for PDF generation
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      }
    })

  } catch (error) {
    console.error("Error generating invoice PDF:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate invoice PDF",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
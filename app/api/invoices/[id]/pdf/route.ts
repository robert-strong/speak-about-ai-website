import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

function generateInvoiceHTML(invoice: any): string {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Use absolute URL for logo from the actual website
  const logoUrl = 'https://www.speakabout.ai/speak-about-ai-logo.png'

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
          line-height: 1.6;
          padding: 40px;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .company-info h1 {
          color: #1e40af;
          font-size: 32px;
          margin-bottom: 8px;
        }
        .company-info p {
          color: #6b7280;
          font-size: 14px;
        }
        .invoice-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 24px;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h2 {
          font-size: 20px;
          color: #111827;
          margin-bottom: 8px;
        }
        .invoice-details p {
          color: #6b7280;
          font-size: 14px;
          margin: 4px 0;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
        }
        .status-draft { background: #f3f4f6; color: #6b7280; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        .billing-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin: 40px 0;
        }
        .billing-section h3 {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .billing-section p {
          color: #111827;
          margin: 4px 0;
        }
        .invoice-table {
          width: 100%;
          margin: 40px 0;
        }
        .invoice-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .invoice-table th {
          background: #f9fafb;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #e5e7eb;
        }
        .invoice-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .invoice-table .amount {
          text-align: right;
          font-weight: 600;
        }
        .invoice-summary {
          margin-top: 40px;
          display: flex;
          justify-content: flex-end;
        }
        .summary-box {
          width: 300px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .summary-row.total {
          border-top: 2px solid #e5e7eb;
          margin-top: 8px;
          padding-top: 16px;
          font-size: 20px;
          font-weight: bold;
          color: #1e40af;
        }
        .notes-section {
          margin-top: 40px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .notes-section h3 {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .notes-section p {
          color: #4b5563;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
        }
        @media print {
          body { padding: 0; }
          .invoice-container { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-info">
            <img src="${logoUrl}" alt="Speak About AI" style="height: 50px; margin-bottom: 12px;" />
            <p>AI Keynote Speaker Bureau</p>
            <p>human@speakabout.ai</p>
          </div>
          <div class="invoice-details">
            <div class="invoice-badge">INVOICE</div>
            <h2>${invoice.invoice_number}</h2>
            <p>Issue Date: ${formatDate(invoice.issue_date)}</p>
            <p>Due Date: ${formatDate(invoice.due_date)}</p>
            ${invoice.payment_date ? `<p>Paid: ${formatDate(invoice.payment_date)}</p>` : ''}
            <div class="status-badge status-${invoice.status}">
              ${invoice.status.toUpperCase()}
            </div>
          </div>
        </div>

        <div class="billing-info">
          <div class="billing-section">
            <h3>Bill To</h3>
            <p><strong>${invoice.client_name}</strong></p>
            ${invoice.company ? `<p>${invoice.company}</p>` : ''}
            <p>${invoice.client_email}</p>
          </div>
          <div class="billing-section">
            <h3>Project Details</h3>
            ${invoice.project_title ? `<p><strong>${invoice.project_title}</strong></p>` : ''}
            ${invoice.event_date ? `<p>Event Date: ${formatDate(invoice.event_date)}</p>` : ''}
            ${invoice.event_location ? `<p>Location: ${invoice.event_location}</p>` : ''}
          </div>
        </div>

        <div class="invoice-table">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${invoice.speaker_name || invoice.requested_speaker_name || 'Professional Speaker'} - Keynote Presentation</strong><br>
                  <div style="margin-top: 8px; line-height: 1.6;">
                    <strong>Event:</strong> ${invoice.event_name || invoice.project_title}<br>
                    <strong>Topic:</strong> ${invoice.program_topic || 'AI and Innovation'}<br>
                    <strong>Format:</strong> ${invoice.program_type || 'Keynote Presentation'}<br>
                    <strong>Duration:</strong> ${invoice.program_length || 60} minutes${invoice.qa_length ? ` (includes ${invoice.qa_length} min Q&A)` : ''}<br>
                    <strong>Audience:</strong> ${invoice.audience_size || 'TBD'} attendees<br>
                    <br>
                    <strong>Deliverables:</strong><br>
                    ${invoice.deliverables ? 
                      invoice.deliverables
                        .split('\n')
                        .filter(item => item.trim())
                        .map(item => {
                          // Clean up the item - remove existing bullet points and trim
                          const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim()
                          return cleanItem ? `• ${cleanItem}<br>` : ''
                        })
                        .join('') :
                      `• Pre-event consultation and content customization<br>
                       • ${invoice.program_length || 60}-minute ${invoice.program_type || 'keynote presentation'}<br>
                       ${invoice.qa_length ? `• ${invoice.qa_length}-minute Q&A session<br>` : ''}
                       ${invoice.tech_rehearsal_date ? '• Technical rehearsal and sound check<br>' : ''}
                       ${invoice.recording_allowed ? '• Permission for event recording<br>' : ''}
                       • Professional presentation delivery<br>
                       • Post-event follow-up (as requested)<br>`
                    }
                  </div>
                </td>
                <td class="amount" style="vertical-align: top; padding-top: 24px;">${formatCurrency(parseFloat(invoice.amount))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="invoice-summary">
          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${formatCurrency(parseFloat(invoice.amount))}</span>
            </div>
            <div class="summary-row total">
              <span>Total Due</span>
              <span>${formatCurrency(parseFloat(invoice.amount))}</span>
            </div>
          </div>
        </div>

        ${invoice.notes ? `
        <div class="notes-section">
          <h3>Notes</h3>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}

        <div class="footer" style="margin-top: 40px;">
          ${(invoice.banking_info && (invoice.banking_info.account_name || invoice.banking_info.bank_name || invoice.banking_info.account_number)) ? `
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="font-size: 14px; color: #6b7280; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Payment Information</h3>
            <div style="color: #111827; line-height: 1.8;">
              ${invoice.banking_info.account_name ? `
              <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <strong style="color: #4b5563;">Beneficiary Information</strong><br>
                <strong>Entity Name:</strong> ${invoice.banking_info.account_name}<br>
                ${invoice.banking_info.entity_address ? `<strong>Entity Address:</strong> ${invoice.banking_info.entity_address}<br>` : ''}
              </div>` : ''}
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #4b5563;">Banking Details</strong><br>
                ${invoice.banking_info.bank_name ? `<strong>Bank Name:</strong> ${invoice.banking_info.bank_name}<br>` : ''}
                ${invoice.banking_info.bank_address ? `<strong>Bank Address:</strong> ${invoice.banking_info.bank_address}<br>` : ''}
                ${invoice.banking_info.account_number ? `<strong>Account Number:</strong> ${invoice.banking_info.account_number}<br>` : ''}
                ${invoice.banking_info.routing_number ? `<strong>Routing Number (ABA):</strong> ${invoice.banking_info.routing_number}<br>` : ''}
                ${invoice.banking_info.swift_code ? `<strong>SWIFT/BIC Code:</strong> ${invoice.banking_info.swift_code}<br>` : ''}
                ${invoice.banking_info.currency_type ? `<strong>Currency:</strong> ${invoice.banking_info.currency_type}<br>` : ''}
              </div>
              
              ${invoice.banking_info.wire_instructions || invoice.banking_info.ach_instructions ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                <strong style="color: #4b5563;">Transfer Instructions</strong><br>
                ${invoice.banking_info.wire_instructions ? `<strong>Wire:</strong> ${invoice.banking_info.wire_instructions}<br>` : ''}
                ${invoice.banking_info.ach_instructions ? `<strong>ACH:</strong> ${invoice.banking_info.ach_instructions}` : ''}
              </div>` : ''}
            </div>
          </div>
          ` : `
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">Payment Information</h3>
            <p style="color: #6b7280;">Banking details not configured. Please contact us for payment information.</p>
          </div>
          `}
          <p>Thank you for your business!</p>
          <p>Payment terms: ${invoice.payment_terms || (invoice.invoice_type === 'deposit' ? 'Net 30 days from issue date' : 'Due on event date')}</p>
          <p>Please reference invoice number ${invoice.invoice_number} with your payment</p>
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
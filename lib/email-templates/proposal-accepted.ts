export function getProposalAcceptedEmailTemplate(data: {
  proposalNumber: string
  proposalTitle: string
  clientName: string
  clientCompany?: string
  acceptedBy: string
  acceptedByTitle?: string
  acceptanceNotes?: string
  eventDate?: string
  totalAmount: number
}) {
  return {
    subject: `🎉 Proposal Accepted! - ${data.proposalNumber}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proposal Accepted</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background-color: #10b981;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .celebration {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .content {
            padding: 40px 30px;
          }
          .success-box {
            background-color: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-box {
            background-color: #f3f4f6;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .next-steps {
            background-color: #eff6ff;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .next-steps h3 {
            color: #1e40af;
            margin-top: 0;
          }
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="celebration">🎉</div>
            <h1>Proposal Accepted!</h1>
          </div>
          
          <div class="content">
            <div class="success-box">
              <h2 style="margin-top: 0; color: #059669;">Great News!</h2>
              <p style="margin-bottom: 0;">
                <strong>${data.clientName}${data.clientCompany ? ` from ${data.clientCompany}` : ''}</strong> has accepted your proposal!
              </p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Acceptance Details</h3>
              <div class="info-row">
                <span class="info-label">Proposal:</span>
                <span>${data.proposalTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reference:</span>
                <span>${data.proposalNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Accepted By:</span>
                <span>${data.acceptedBy}${data.acceptedByTitle ? `, ${data.acceptedByTitle}` : ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contract Value:</span>
                <span>$${data.totalAmount.toLocaleString()}</span>
              </div>
              ${data.eventDate ? `
              <div class="info-row">
                <span class="info-label">Event Date:</span>
                <span>${new Date(data.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              ` : ''}
            </div>
            
            ${data.acceptanceNotes ? `
            <div class="info-box">
              <h3 style="margin-top: 0;">Client Notes</h3>
              <p style="margin-bottom: 0;">${data.acceptanceNotes}</p>
            </div>
            ` : ''}
            
            <div class="next-steps">
              <h3>Next Steps</h3>
              <ol style="margin-bottom: 0;">
                <li>Create a project in the system</li>
                <li>Generate and send the contract for signatures</li>
                <li>Send the initial invoice</li>
                <li>Schedule a kickoff meeting with the client</li>
                <li>Coordinate with the speaker(s)</li>
              </ol>
            </div>
            
            <p>Log in to your admin dashboard to manage this project and complete the next steps.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from your Speak About AI CRM system.</p>
            <p style="margin-top: 20px; font-size: 12px;">
              © ${new Date().getFullYear()} Speak About AI. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
🎉 PROPOSAL ACCEPTED!

Great news! ${data.clientName}${data.clientCompany ? ` from ${data.clientCompany}` : ''} has accepted your proposal!

Acceptance Details:
- Proposal: ${data.proposalTitle}
- Reference: ${data.proposalNumber}
- Accepted By: ${data.acceptedBy}${data.acceptedByTitle ? `, ${data.acceptedByTitle}` : ''}
- Contract Value: $${data.totalAmount.toLocaleString()}
${data.eventDate ? `- Event Date: ${new Date(data.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}

${data.acceptanceNotes ? `Client Notes:\n${data.acceptanceNotes}\n` : ''}

Next Steps:
1. Create a project in the system
2. Generate and send the contract for signatures
3. Send the initial invoice
4. Schedule a kickoff meeting with the client
5. Coordinate with the speaker(s)

Log in to your admin dashboard to manage this project and complete the next steps.

This is an automated notification from your Speak About AI CRM system.
    `.trim()
  }
}
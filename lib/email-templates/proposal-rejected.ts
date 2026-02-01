export function getProposalRejectedEmailTemplate(data: {
  proposalNumber: string
  proposalTitle: string
  clientName: string
  clientCompany?: string
  rejectedBy: string
  rejectionReason?: string
  totalAmount: number
}) {
  return {
    subject: `Proposal Feedback Received - ${data.proposalNumber}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proposal Feedback</title>
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
            background-color: #6b7280;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
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
          .feedback-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .feedback-box h3 {
            color: #d97706;
            margin-top: 0;
          }
          .suggestions {
            background-color: #eff6ff;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .suggestions h3 {
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
            <h1>Proposal Feedback Received</h1>
          </div>
          
          <div class="content">
            <p>We've received feedback on your proposal from <strong>${data.clientName}${data.clientCompany ? ` at ${data.clientCompany}` : ''}</strong>.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Proposal Details</h3>
              <div class="info-row">
                <span class="info-label">Proposal:</span>
                <span>${data.proposalTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reference:</span>
                <span>${data.proposalNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Value:</span>
                <span>$${data.totalAmount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Feedback From:</span>
                <span>${data.rejectedBy}</span>
              </div>
            </div>
            
            ${data.rejectionReason ? `
            <div class="feedback-box">
              <h3>Client Feedback</h3>
              <p style="margin-bottom: 0;">${data.rejectionReason}</p>
            </div>
            ` : ''}
            
            <div class="suggestions">
              <h3>Suggested Next Steps</h3>
              <ul style="margin-bottom: 0;">
                <li>Review the client's feedback carefully</li>
                <li>Consider adjusting the proposal based on their concerns</li>
                <li>Follow up with the client to understand their needs better</li>
                <li>Update the deal status in your CRM</li>
                <li>Document lessons learned for future proposals</li>
              </ul>
            </div>
            
            <p>Remember, feedback is valuable for improving future proposals. This may be an opportunity to re-engage with a revised offer that better meets their needs.</p>
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
PROPOSAL FEEDBACK RECEIVED

We've received feedback on your proposal from ${data.clientName}${data.clientCompany ? ` at ${data.clientCompany}` : ''}.

Proposal Details:
- Proposal: ${data.proposalTitle}
- Reference: ${data.proposalNumber}
- Value: $${data.totalAmount.toLocaleString()}
- Feedback From: ${data.rejectedBy}

${data.rejectionReason ? `Client Feedback:\n${data.rejectionReason}\n` : ''}

Suggested Next Steps:
- Review the client's feedback carefully
- Consider adjusting the proposal based on their concerns
- Follow up with the client to understand their needs better
- Update the deal status in your CRM
- Document lessons learned for future proposals

Remember, feedback is valuable for improving future proposals. This may be an opportunity to re-engage with a revised offer that better meets their needs.

This is an automated notification from your Speak About AI CRM system.
    `.trim()
  }
}
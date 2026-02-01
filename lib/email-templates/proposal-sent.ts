export function getProposalSentEmailTemplate(data: {
  clientName: string
  clientCompany?: string
  proposalTitle: string
  proposalNumber: string
  proposalLink: string
  validUntil?: string
  senderName?: string
  senderTitle?: string
}) {
  return {
    subject: `Your Proposal from Speak About AI - ${data.proposalNumber}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Proposal from Speak About AI</title>
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
            background-color: #2563eb;
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
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white !important;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
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
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .footer a {
            color: #2563eb;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            body {
              padding: 0;
            }
            .content {
              padding: 30px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Proposal is Ready</h1>
          </div>
          
          <div class="content">
            <p>Dear ${data.clientName},</p>
            
            <p>Thank you for considering Speak About AI for your upcoming event. We're excited to share our proposal with you.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Proposal:</span>
                <span>${data.proposalTitle}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reference:</span>
                <span>${data.proposalNumber}</span>
              </div>
              ${data.clientCompany ? `
              <div class="info-row">
                <span class="info-label">Organization:</span>
                <span>${data.clientCompany}</span>
              </div>
              ` : ''}
              ${data.validUntil ? `
              <div class="info-row">
                <span class="info-label">Valid Until:</span>
                <span>${new Date(data.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              ` : ''}
            </div>
            
            <p>We've carefully crafted this proposal based on your requirements and look forward to the opportunity to work with you.</p>
            
            <div style="text-align: center;">
              <a href="${data.proposalLink}" class="button">View Proposal</a>
            </div>
            
            <p>The proposal includes:</p>
            <ul>
              <li>Detailed speaker information and expertise</li>
              <li>Comprehensive service overview</li>
              <li>Clear investment details and payment terms</li>
              <li>Relevant testimonials from past clients</li>
            </ul>
            
            <p>If you have any questions or would like to discuss the proposal further, please don't hesitate to reach out. We're here to help make your event a success.</p>
            
            ${data.senderName ? `
            <p>Best regards,</p>
            <p>
              <strong>${data.senderName}</strong><br>
              ${data.senderTitle || 'Speak About AI Team'}
            </p>
            ` : `
            <p>Best regards,<br>
            The Speak About AI Team</p>
            `}
          </div>
          
          <div class="footer">
            <p>This proposal is confidential and intended solely for ${data.clientName}${data.clientCompany ? ` at ${data.clientCompany}` : ''}.</p>
            <p>
              <a href="${data.proposalLink}">View Proposal Online</a> | 
              <a href="mailto:hello@speakaboutai.com">Contact Us</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px;">
              © ${new Date().getFullYear()} Speak About AI. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Dear ${data.clientName},

Thank you for considering Speak About AI for your upcoming event. We're excited to share our proposal with you.

Proposal Details:
- Title: ${data.proposalTitle}
- Reference: ${data.proposalNumber}
${data.clientCompany ? `- Organization: ${data.clientCompany}` : ''}
${data.validUntil ? `- Valid Until: ${new Date(data.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}

View your proposal here: ${data.proposalLink}

The proposal includes:
- Detailed speaker information and expertise
- Comprehensive service overview
- Clear investment details and payment terms
- Relevant testimonials from past clients

If you have any questions or would like to discuss the proposal further, please don't hesitate to reach out.

Best regards,
${data.senderName ? `${data.senderName}\n${data.senderTitle || 'Speak About AI Team'}` : 'The Speak About AI Team'}

This proposal is confidential and intended solely for ${data.clientName}${data.clientCompany ? ` at ${data.clientCompany}` : ''}.
    `.trim()
  }
}
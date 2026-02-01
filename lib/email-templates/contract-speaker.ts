export interface ContractSpeakerEmailData {
  speakerName: string
  contractNumber: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  speakerFee: number
  signingLink: string
}

export function generateSpeakerContractEmail(data: ContractSpeakerEmailData): { subject: string; html: string; text: string } {
  const subject = `Action Required: Contract ${data.contractNumber} - ${data.eventTitle}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Ready for Signature</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: white; padding: 30px; border: 1px solid #e9ecef; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
    .details { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; color: #1e293b;">Contract Ready for Your Signature</h1>
    </div>
    <div class="content">
      <p>Dear ${data.speakerName},</p>
      
      <p>We're excited to move forward with your speaking engagement! Your contract is now ready for review and signature.</p>
      
      <div class="details">
        <h3 style="margin-top: 0;">Engagement Details:</h3>
        <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${data.eventLocation}</p>
        <p style="margin: 5px 0;"><strong>Speaker Fee:</strong> $${data.speakerFee.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Contract #:</strong> ${data.contractNumber}</p>
      </div>
      
      <p>Please review and sign the contract at your earliest convenience:</p>
      
      <div style="text-align: center;">
        <a href="${data.signingLink}" class="button">Review & Sign Contract</a>
      </div>
      
      <p>You can also access this contract anytime by logging into your speaker portal.</p>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Click the button above to review the contract</li>
        <li>Read through all terms and conditions</li>
        <li>Provide your digital signature</li>
        <li>Receive a copy of the fully executed contract once all parties have signed</li>
      </ol>
      
      <p>If you have any questions about the contract terms, please don't hesitate to reach out.</p>
      
      <p>Best regards,<br>
      The Speak About AI Team</p>
    </div>
    <div class="footer">
      <p>Speak About AI | 651 Homer Avenue, Palo Alto, CA 94301<br>
      This link will expire in 30 days. If you need a new link, please contact us.</p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Contract Ready for Your Signature

Dear ${data.speakerName},

We're excited to move forward with your speaking engagement! Your contract is now ready for review and signature.

Engagement Details:
- Event: ${data.eventTitle}
- Date: ${data.eventDate}
- Location: ${data.eventLocation}
- Speaker Fee: $${data.speakerFee.toLocaleString()}
- Contract #: ${data.contractNumber}

Please review and sign the contract at your earliest convenience:
${data.signingLink}

You can also access this contract anytime by logging into your speaker portal.

Next Steps:
1. Click the link above to review the contract
2. Read through all terms and conditions
3. Provide your digital signature
4. Receive a copy of the fully executed contract once all parties have signed

If you have any questions about the contract terms, please don't hesitate to reach out.

Best regards,
The Speak About AI Team

--
Speak About AI | 651 Homer Avenue, Palo Alto, CA 94301
This link will expire in 30 days. If you need a new link, please contact us.
  `
  
  return { subject, html, text }
}
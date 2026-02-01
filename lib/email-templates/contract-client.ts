export interface ContractClientEmailData {
  signerName: string
  clientCompany: string
  speakerName: string
  contractNumber: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  totalAmount: number
  signingLink: string
  ccEmails?: string[]
}

export function generateClientContractEmail(data: ContractClientEmailData): { subject: string; html: string; text: string } {
  const subject = `Action Required: Speaker Agreement ${data.contractNumber} - ${data.eventTitle}`
  
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
    .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; color: #1e293b;">Speaker Agreement Ready for Signature</h1>
    </div>
    <div class="content">
      <p>Dear ${data.signerName},</p>
      
      <p>The speaker agreement for your upcoming event with <strong>${data.speakerName}</strong> is ready for your review and signature.</p>
      
      <div class="details">
        <h3 style="margin-top: 0;">Event Details:</h3>
        <p style="margin: 5px 0;"><strong>Company:</strong> ${data.clientCompany}</p>
        <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
        <p style="margin: 5px 0;"><strong>Speaker:</strong> ${data.speakerName}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${data.eventLocation}</p>
        <p style="margin: 5px 0;"><strong>Total Investment:</strong> $${data.totalAmount.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Contract #:</strong> ${data.contractNumber}</p>
      </div>
      
      <div class="warning">
        <strong>Important:</strong> This signing link is unique to you and should not be shared. You do not need an account to sign this agreement.
      </div>
      
      <div style="text-align: center;">
        <a href="${data.signingLink}" class="button">Review & Sign Agreement</a>
      </div>
      
      <p><strong>What happens next:</strong></p>
      <ol>
        <li>Click the button above to review the agreement</li>
        <li>Verify your email address</li>
        <li>Review all terms and conditions</li>
        <li>Provide your digital signature and title</li>
        <li>Receive a fully executed copy once all parties have signed</li>
      </ol>
      
      <p>The speaker has already reviewed and signed this agreement. Your signature will complete the contract execution process.</p>
      
      <p>If you have any questions or concerns about this agreement, please contact us immediately.</p>
      
      <p>Thank you for choosing Speak About AI for your event needs.</p>
      
      <p>Best regards,<br>
      Robert Strong<br>
      CEO, Speak About AI</p>
    </div>
    <div class="footer">
      <p>Speak About AI | 651 Homer Avenue, Palo Alto, CA 94301<br>
      Phone: +1 (415) 665-2442 | Email: info@speakaboutai.com</p>
      <p style="font-size: 12px;">This signing link will expire in 30 days. ${data.ccEmails && data.ccEmails.length > 0 ? `CC: ${data.ccEmails.join(', ')}` : ''}</p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Speaker Agreement Ready for Signature

Dear ${data.signerName},

The speaker agreement for your upcoming event with ${data.speakerName} is ready for your review and signature.

Event Details:
- Company: ${data.clientCompany}
- Event: ${data.eventTitle}
- Speaker: ${data.speakerName}
- Date: ${data.eventDate}
- Location: ${data.eventLocation}
- Total Investment: $${data.totalAmount.toLocaleString()}
- Contract #: ${data.contractNumber}

Important: This signing link is unique to you and should not be shared. You do not need an account to sign this agreement.

Review & Sign Agreement: ${data.signingLink}

What happens next:
1. Click the link above to review the agreement
2. Verify your email address
3. Review all terms and conditions
4. Provide your digital signature and title
5. Receive a fully executed copy once all parties have signed

The speaker has already reviewed and signed this agreement. Your signature will complete the contract execution process.

If you have any questions or concerns about this agreement, please contact us immediately.

Thank you for choosing Speak About AI for your event needs.

Best regards,
Robert Strong
CEO, Speak About AI

--
Speak About AI | 651 Homer Avenue, Palo Alto, CA 94301
Phone: +1 (415) 665-2442 | Email: info@speakaboutai.com
This signing link will expire in 30 days. ${data.ccEmails && data.ccEmails.length > 0 ? `CC: ${data.ccEmails.join(', ')}` : ''}
  `
  
  return { subject, html, text }
}
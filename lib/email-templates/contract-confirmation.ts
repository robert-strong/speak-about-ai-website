export interface ContractConfirmationEmailData {
  recipientName: string
  contractNumber: string
  eventTitle: string
  eventDate: string
  signedAt: string
  contractPdfUrl: string
  isFullyExecuted: boolean
}

export function generateContractConfirmationEmail(data: ContractConfirmationEmailData): { subject: string; html: string; text: string } {
  const subject = `Contract ${data.contractNumber} - ${data.isFullyExecuted ? 'Fully Executed' : 'Signature Received'}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Signature Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; color: white; }
    .content { background-color: white; padding: 30px; border: 1px solid #e9ecef; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
    .success-box { background-color: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✓ Signature Confirmed</h1>
    </div>
    <div class="content">
      <p>Dear ${data.recipientName},</p>
      
      <div class="success-box">
        <p style="margin: 0;"><strong>Success!</strong> Your signature has been recorded for Contract ${data.contractNumber}.</p>
        <p style="margin: 10px 0 0 0;">Signed on: ${data.signedAt}</p>
      </div>
      
      ${data.isFullyExecuted ? `
      <p><strong>This contract is now fully executed!</strong> All required parties have signed, and the agreement is now in effect.</p>
      ` : `
      <p>Thank you for signing the contract. We're now waiting for the other party to complete their signature. You'll receive another notification once the contract is fully executed.</p>
      `}
      
      <p>Contract Details:</p>
      <ul>
        <li><strong>Event:</strong> ${data.eventTitle}</li>
        <li><strong>Date:</strong> ${data.eventDate}</li>
        <li><strong>Contract Number:</strong> ${data.contractNumber}</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${data.contractPdfUrl}" class="button">Download Contract PDF</a>
      </div>
      
      <p>Please save this contract for your records. You can also access it anytime through your portal.</p>
      
      ${data.isFullyExecuted ? `
      <p><strong>What's Next?</strong></p>
      <ul>
        <li>You'll receive event preparation materials closer to the event date</li>
        <li>Our team will reach out to coordinate logistics</li>
        <li>Invoice and payment instructions will be sent according to the contract terms</li>
      </ul>
      ` : ''}
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>
      The Speak About AI Team</p>
    </div>
    <div class="footer">
      <p>Speak About AI | 651 Homer Avenue, Palo Alto, CA 94301<br>
      Phone: +1 (415) 665-2442 | Email: info@speakaboutai.com</p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Signature Confirmed

Dear ${data.recipientName},

Success! Your signature has been recorded for Contract ${data.contractNumber}.
Signed on: ${data.signedAt}

${data.isFullyExecuted ? 
'This contract is now fully executed! All required parties have signed, and the agreement is now in effect.' : 
'Thank you for signing the contract. We\'re now waiting for the other party to complete their signature. You\'ll receive another notification once the contract is fully executed.'}

Contract Details:
- Event: ${data.eventTitle}
- Date: ${data.eventDate}
- Contract Number: ${data.contractNumber}

Download Contract PDF: ${data.contractPdfUrl}

Please save this contract for your records. You can also access it anytime through your portal.

${data.isFullyExecuted ? `
What's Next?
- You'll receive event preparation materials closer to the event date
- Our team will reach out to coordinate logistics
- Invoice and payment instructions will be sent according to the contract terms
` : ''}

If you have any questions, please don't hesitate to contact us.

Best regards,
The Speak About AI Team

--
Speak About AI | 651 Homer Avenue, Palo Alto, CA 94301
Phone: +1 (415) 665-2442 | Email: info@speakaboutai.com
  `
  
  return { subject, html, text }
}
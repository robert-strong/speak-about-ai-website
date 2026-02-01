import nodemailer from 'nodemailer'
import type { Contract } from './contracts-db'

// Email configuration
const createTransporter = () => {
  // This should be configured with your SMTP settings
  // For now, using a basic configuration that should work with most email providers
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export function generateContractSigningEmail(
  contract: Contract,
  signerType: 'client' | 'speaker',
  signingLink: string
): EmailTemplate {
  const signerName = signerType === 'client' ? contract.client_name : contract.speaker_name
  const signerEmail = signerType === 'client' ? contract.client_email : contract.speaker_email
  const companyName = "Speak About AI"
  
  const subject = `Contract Signature Required - ${contract.event_title}`
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract Signature Required</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: linear-gradient(135deg, #1E68C6, #2563eb); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .content { 
            background: #ffffff; 
            padding: 30px; 
            border: 1px solid #e5e7eb; 
            border-top: none; 
        }
        .footer { 
            background: #f9fafb; 
            padding: 20px; 
            text-align: center; 
            font-size: 14px; 
            color: #6b7280; 
            border: 1px solid #e5e7eb; 
            border-top: none; 
            border-radius: 0 0 8px 8px; 
        }
        .button { 
            display: inline-block; 
            padding: 16px 32px; 
            background: #1E68C6; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(30, 104, 198, 0.3);
        }
        .button:hover { 
            background: #1d4ed8; 
        }
        .contract-info { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #1E68C6; 
        }
        .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 8px 0; 
            padding: 8px 0; 
            border-bottom: 1px solid #e5e7eb; 
        }
        .info-row:last-child { 
            border-bottom: none; 
        }
        .label { 
            font-weight: 600; 
            color: #4b5563; 
        }
        .value { 
            color: #1f2937; 
        }
        .warning { 
            background: #fef3c7; 
            border: 1px solid #f59e0b; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 20px 0; 
        }
        .security-note { 
            font-size: 12px; 
            color: #6b7280; 
            margin-top: 20px; 
            padding: 15px; 
            background: #f9fafb; 
            border-radius: 6px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">Contract Signature Required</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Digital signature requested for ${contract.event_title}</p>
    </div>
    
    <div class="content">
        <p>Dear ${signerName},</p>
        
        <p>You have been requested to review and digitally sign a contract for the following engagement:</p>
        
        <div class="contract-info">
            <div class="info-row">
                <span class="label">Contract:</span>
                <span class="value">${contract.contract_number}</span>
            </div>
            <div class="info-row">
                <span class="label">Event:</span>
                <span class="value">${contract.event_title}</span>
            </div>
            <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">${new Date(contract.event_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
            </div>
            <div class="info-row">
                <span class="label">Client:</span>
                <span class="value">${contract.client_name}</span>
            </div>
            ${contract.speaker_name ? `
            <div class="info-row">
                <span class="label">Speaker:</span>
                <span class="value">${contract.speaker_name}</span>
            </div>
            ` : ''}
            <div class="info-row">
                <span class="label">Contract Value:</span>
                <span class="value">$${contract.total_amount.toLocaleString()}</span>
            </div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Action Required:</strong> Please review the contract terms carefully and provide your digital signature to proceed with this engagement.
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${signingLink}" class="button">Review & Sign Contract</a>
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ol>
            <li>Click the button above to access the secure signing portal</li>
            <li>Review all contract terms and conditions</li>
            <li>Provide your digital signature using our secure signature pad</li>
            <li>Receive confirmation once all parties have signed</li>
        </ol>
        
        <div class="security-note">
            <strong>Security Note:</strong> This link is secure and unique to you. Do not share this link with others. 
            The contract expires in 90 days from generation. If you have any questions about this contract, 
            please contact us immediately.
        </div>
    </div>
    
    <div class="footer">
        <p><strong>${companyName}</strong></p>
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>If you need assistance, please contact our support team.</p>
    </div>
</body>
</html>`

  const text = `
Contract Signature Required - ${contract.event_title}

Dear ${signerName},

You have been requested to review and digitally sign a contract for the following engagement:

Contract: ${contract.contract_number}
Event: ${contract.event_title}  
Date: ${new Date(contract.event_date).toLocaleDateString()}
Client: ${contract.client_name}
${contract.speaker_name ? `Speaker: ${contract.speaker_name}` : ''}
Contract Value: $${contract.total_amount.toLocaleString()}

Please click the following link to review and sign the contract:
${signingLink}

What happens next:
1. Click the link above to access the secure signing portal
2. Review all contract terms and conditions
3. Provide your digital signature using our secure signature pad
4. Receive confirmation once all parties have signed

Security Note: This link is secure and unique to you. Do not share this link with others. The contract expires in 90 days from generation.

Best regards,
${companyName}

This is an automated message. Please do not reply to this email.
`

  return { subject, html, text }
}

export function generateContractCompletionEmail(contract: Contract): EmailTemplate {
  const companyName = "Speak About AI"
  
  const subject = `Contract Fully Executed - ${contract.event_title}`
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract Fully Executed</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .content { 
            background: #ffffff; 
            padding: 30px; 
            border: 1px solid #e5e7eb; 
            border-top: none; 
        }
        .footer { 
            background: #f9fafb; 
            padding: 20px; 
            text-align: center; 
            font-size: 14px; 
            color: #6b7280; 
            border: 1px solid #e5e7eb; 
            border-top: none; 
            border-radius: 0 0 8px 8px; 
        }
        .success-badge { 
            background: #dcfce7; 
            color: #16a34a; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; 
            margin: 20px 0; 
            border: 1px solid #bbf7d0; 
        }
        .contract-info { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #10b981; 
        }
        .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 8px 0; 
            padding: 8px 0; 
            border-bottom: 1px solid #e5e7eb; 
        }
        .info-row:last-child { 
            border-bottom: none; 
        }
        .label { 
            font-weight: 600; 
            color: #4b5563; 
        }
        .value { 
            color: #1f2937; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">✅ Contract Fully Executed</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">All parties have signed the contract</p>
    </div>
    
    <div class="content">
        <div class="success-badge">
            <strong>🎉 Congratulations!</strong> The contract for ${contract.event_title} has been fully executed with all required signatures.
        </div>
        
        <div class="contract-info">
            <div class="info-row">
                <span class="label">Contract:</span>
                <span class="value">${contract.contract_number}</span>
            </div>
            <div class="info-row">
                <span class="label">Event:</span>
                <span class="value">${contract.event_title}</span>
            </div>
            <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">${new Date(contract.event_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
            </div>
            <div class="info-row">
                <span class="label">Client:</span>
                <span class="value">${contract.client_name}</span>
            </div>
            ${contract.speaker_name ? `
            <div class="info-row">
                <span class="label">Speaker:</span>
                <span class="value">${contract.speaker_name}</span>
            </div>
            ` : ''}
            <div class="info-row">
                <span class="label">Contract Value:</span>
                <span class="value">$${contract.total_amount.toLocaleString()}</span>
            </div>
            <div class="info-row">
                <span class="label">Completed:</span>
                <span class="value">${contract.completed_at ? new Date(contract.completed_at).toLocaleDateString() : 'Just now'}</span>
            </div>
        </div>
        
        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>All parties will receive a copy of the fully executed contract</li>
            <li>Event planning and coordination can now proceed</li>
            <li>Payment terms as outlined in the contract will be implemented</li>
            <li>Any questions should be directed to the appropriate contact person</li>
        </ul>
        
        <p>Thank you for using our digital contract system. We wish you a successful event!</p>
    </div>
    
    <div class="footer">
        <p><strong>${companyName}</strong></p>
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>`

  const text = `
Contract Fully Executed - ${contract.event_title}

Congratulations! The contract for ${contract.event_title} has been fully executed with all required signatures.

Contract Details:
- Contract: ${contract.contract_number}
- Event: ${contract.event_title}
- Date: ${new Date(contract.event_date).toLocaleDateString()}
- Client: ${contract.client_name}
${contract.speaker_name ? `- Speaker: ${contract.speaker_name}` : ''}
- Contract Value: $${contract.total_amount.toLocaleString()}
- Completed: ${contract.completed_at ? new Date(contract.completed_at).toLocaleDateString() : 'Just now'}

Next Steps:
- All parties will receive a copy of the fully executed contract
- Event planning and coordination can now proceed
- Payment terms as outlined in the contract will be implemented
- Any questions should be directed to the appropriate contact person

Thank you for using our digital contract system. We wish you a successful event!

Best regards,
${companyName}
`

  return { subject, html, text }
}

export async function sendContractSigningEmail(
  contract: Contract,
  signerType: 'client' | 'speaker',
  signingLink: string
): Promise<boolean> {
  // Check if email is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email not configured - skipping contract signing email')
    return false
  }

  try {
    const transporter = createTransporter()
    const emailTemplate = generateContractSigningEmail(contract, signerType, signingLink)
    const recipientEmail = signerType === 'client' ? contract.client_email : contract.speaker_email
    
    if (!recipientEmail) {
      console.error(`No email address for ${signerType}`)
      return false
    }

    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Speak About AI'}" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    })

    console.log(`Contract signing email sent to ${signerType}: ${recipientEmail}`)
    return true
  } catch (error) {
    console.error('Error sending contract signing email:', error)
    return false
  }
}

export async function sendContractCompletionEmail(contract: Contract): Promise<boolean> {
  // Check if email is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email not configured - skipping contract completion email')
    return false
  }

  try {
    const transporter = createTransporter()
    const emailTemplate = generateContractCompletionEmail(contract)
    
    // Send to both client and speaker
    const recipients = [contract.client_email]
    if (contract.speaker_email) {
      recipients.push(contract.speaker_email)
    }

    for (const email of recipients) {
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || 'Speak About AI'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      })
    }

    console.log('Contract completion emails sent to all parties')
    return true
  } catch (error) {
    console.error('Error sending contract completion email:', error)
    return false
  }
}
import { generateSpeakerContractEmail } from "./email-templates/contract-speaker"
import { generateClientContractEmail } from "./email-templates/contract-client"
import { generateContractConfirmationEmail } from "./email-templates/contract-confirmation"

// For now, we'll log emails to console. In production, integrate with SendGrid, AWS SES, etc.
async function sendEmail(to: string, subject: string, html: string, text: string, cc?: string[]) {
  console.log("=== EMAIL SEND REQUEST ===")
  console.log("To:", to)
  console.log("CC:", cc?.join(", ") || "None")
  console.log("Subject:", subject)
  console.log("Text Preview:", text.substring(0, 200) + "...")
  console.log("========================")
  
  // TODO: Implement actual email sending
  // Example with SendGrid:
  // const msg = {
  //   to,
  //   cc,
  //   from: 'contracts@speakaboutai.com',
  //   subject,
  //   text,
  //   html,
  // }
  // await sgMail.send(msg)
  
  return true
}

export async function sendSpeakerContractEmail(data: {
  speakerEmail: string
  speakerName: string
  contractNumber: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  speakerFee: number
  contractId: number
  signingToken: string
}) {
  const signingLink = `${process.env.NEXT_PUBLIC_APP_URL}/speaker/contracts/${data.contractId}?token=${data.signingToken}`
  
  const emailData = {
    speakerName: data.speakerName,
    contractNumber: data.contractNumber,
    eventTitle: data.eventTitle,
    eventDate: new Date(data.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    eventLocation: data.eventLocation,
    speakerFee: data.speakerFee,
    signingLink
  }
  
  const { subject, html, text } = generateSpeakerContractEmail(emailData)
  
  return sendEmail(data.speakerEmail, subject, html, text)
}

export async function sendClientContractEmail(data: {
  signerEmail: string
  signerName: string
  clientCompany: string
  speakerName: string
  contractNumber: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  totalAmount: number
  contractId: number
  signingToken: string
  ccEmails?: string[]
}) {
  const signingLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign/contract/${data.contractId}?token=${data.signingToken}`
  
  const emailData = {
    signerName: data.signerName,
    clientCompany: data.clientCompany,
    speakerName: data.speakerName,
    contractNumber: data.contractNumber,
    eventTitle: data.eventTitle,
    eventDate: new Date(data.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    eventLocation: data.eventLocation,
    totalAmount: data.totalAmount,
    signingLink,
    ccEmails: data.ccEmails
  }
  
  const { subject, html, text } = generateClientContractEmail(emailData)
  
  return sendEmail(data.signerEmail, subject, html, text, data.ccEmails)
}

export async function sendContractConfirmationEmail(data: {
  recipientEmail: string
  recipientName: string
  contractNumber: string
  eventTitle: string
  eventDate: string
  isFullyExecuted: boolean
}) {
  const contractPdfUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/contracts/${data.contractNumber}/pdf`
  
  const emailData = {
    recipientName: data.recipientName,
    contractNumber: data.contractNumber,
    eventTitle: data.eventTitle,
    eventDate: new Date(data.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    signedAt: new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }),
    contractPdfUrl,
    isFullyExecuted: data.isFullyExecuted
  }
  
  const { subject, html, text } = generateContractConfirmationEmail(emailData)
  
  return sendEmail(data.recipientEmail, subject, html, text)
}

// Add missing export for backward compatibility
export async function sendContractSignedNotification(data: any) {
  console.log("Contract signed notification:", data)
  // This is handled by the unified email service now
  return true
}
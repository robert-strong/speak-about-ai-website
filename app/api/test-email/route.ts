import { NextResponse } from 'next/server'
import { generateAdminEmailHtml, generateAdminEmailText, generateClientConfirmationHtml, generateClientConfirmationText } from '@/lib/email-service-new'

export async function GET() {
  // Test data
  const testDeal = {
    id: 1,
    clientName: 'Test User',
    clientEmail: 'test@example.com',
    phone: '555-1234',
    company: 'Test Corp',
    organizationName: 'Test Corp',
    eventTitle: 'AI Keynote Speaking Engagement',
    eventDate: '2025-10-15',
    eventLocation: 'San Francisco, CA',
    dealValue: 37500,
    eventBudget: '25k-50k',
    status: 'lead' as const,
    priority: 'high' as const,
    specificSpeaker: 'Sam Altman, Dario Amodei',
    additionalInfo: 'Looking for an engaging speaker on AI ethics and future of work.',
    wishlistSpeakers: [
      { id: 1, name: 'Sam Altman' },
      { id: 2, name: 'Dario Amodei' }
    ],
    source: 'website_form',
    notes: null,
    createdAt: new Date().toISOString()
  }

  const testFormData = {
    clientName: 'Test User',
    clientEmail: 'test@example.com',
    phone: '555-1234',
    organizationName: 'Test Corp',
    specificSpeaker: 'Sam Altman, Dario Amodei',
    eventDate: '2025-10-15',
    eventLocation: 'San Francisco, CA',
    eventBudget: '25k-50k',
    additionalInfo: 'Looking for an engaging speaker on AI ethics and future of work.',
    wishlistSpeakers: [
      { id: 1, name: 'Sam Altman' },
      { id: 2, name: 'Dario Amodei' }
    ]
  }

  try {
    // Generate email templates
    const adminHtml = generateAdminEmailHtml(testDeal, testFormData)
    const adminText = generateAdminEmailText(testDeal, testFormData)
    const clientHtml = generateClientConfirmationHtml(testDeal, testFormData)
    const clientText = generateClientConfirmationText(testDeal, testFormData)

    // Return preview of all email templates
    return NextResponse.json({
      success: true,
      message: 'Email templates generated successfully',
      preview: {
        admin: {
          subject: `New Speaker Inquiry: ${testDeal.clientName} - ${testDeal.organizationName}`,
          htmlPreview: adminHtml.substring(0, 500) + '...',
          textPreview: adminText.substring(0, 500) + '...'
        },
        client: {
          subject: 'Thank you for your speaker inquiry - Speak About AI',
          htmlPreview: clientHtml.substring(0, 500) + '...',
          textPreview: clientText.substring(0, 500) + '...'
        }
      },
      note: 'To send actual emails, install Resend: npm install resend'
    })
  } catch (error) {
    console.error('Error generating email templates:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate email templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
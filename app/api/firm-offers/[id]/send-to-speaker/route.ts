import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { sendEmail } from '@/lib/email'

const sql = neon(process.env.DATABASE_URL!)

// POST: Send firm offer to speaker for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { speaker_email, speaker_name } = body

    if (!speaker_email) {
      return NextResponse.json(
        { error: 'Speaker email is required' },
        { status: 400 }
      )
    }

    // Get the firm offer - using LEFT JOINs to work with both proposal-based and standalone offers
    const [firmOffer] = await sql`
      SELECT fo.*,
             p.title as proposal_title,
             p.client_name as proposal_client_name,
             p.event_title as proposal_event_title,
             p.event_date as proposal_event_date,
             p.speakers,
             d.event_title as deal_event_title,
             d.company as deal_company,
             d.client_name as deal_client_name,
             d.event_date as deal_event_date,
             d.event_location as deal_event_location
      FROM firm_offers fo
      LEFT JOIN proposals p ON p.id = fo.proposal_id
      LEFT JOIN deals d ON d.firm_offer_id = fo.id
      WHERE fo.id = ${id}
    `

    if (!firmOffer) {
      return NextResponse.json(
        { error: 'Firm offer not found' },
        { status: 404 }
      )
    }

    // Update status to sent_to_speaker
    await sql`
      UPDATE firm_offers
      SET status = 'sent_to_speaker',
          sent_to_speaker_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // Generate the speaker review URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'
    const speakerReviewUrl = `${baseUrl}/speaker-review/${firmOffer.speaker_access_token}`

    // Extract event details from various sources
    const eventOverview = firmOffer.event_overview || {}
    const financialDetails = firmOffer.financial_details || {}
    const speakerProgram = firmOffer.speaker_program || {}

    const eventName = eventOverview.event_name ||
                      firmOffer.deal_event_title ||
                      firmOffer.proposal_event_title ||
                      'Upcoming Event'
    const companyName = eventOverview.company_name ||
                        firmOffer.deal_company ||
                        firmOffer.proposal_client_name ||
                        'Client'
    const eventDate = eventOverview.event_date ||
                      firmOffer.deal_event_date ||
                      firmOffer.proposal_event_date
    const eventLocation = eventOverview.event_location ||
                          firmOffer.deal_event_location ||
                          'TBD'
    const speakerFee = financialDetails.speaker_fee
      ? `$${financialDetails.speaker_fee.toLocaleString()}`
      : 'As discussed'
    const programType = speakerProgram.program_type || 'Speaking Engagement'
    const displayName = speaker_name || speakerProgram.speaker_name || 'Speaker'

    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'TBD'

    // Send email to speaker
    const emailSent = await sendEmail({
      to: speaker_email,
      subject: `Firm Offer for Review: ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .event-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .event-card h2 { color: #1f2937; margin-top: 0; font-size: 18px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #6b7280; font-size: 14px; }
            .detail-value { font-weight: 600; color: #1f2937; }
            .fee-highlight { background: #ecfdf5; border: 2px solid #10b981; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .fee-highlight .label { color: #059669; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .fee-highlight .amount { font-size: 28px; font-weight: bold; color: #047857; }
            .cta-button { display: block; background: #f59e0b; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 16px; margin: 25px 0; }
            .cta-button:hover { background: #d97706; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Firm Offer Ready for Review</h1>
            </div>
            <div class="content">
              <p>Hi ${displayName},</p>
              <p>We're pleased to present a firm offer for your consideration. Please review the details below and let us know if you can confirm this engagement.</p>

              <div class="event-card">
                <h2>${eventName}</h2>
                <div class="detail-row">
                  <span class="detail-label">Organization</span>
                  <span class="detail-value">${companyName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Event Date</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location</span>
                  <span class="detail-value">${eventLocation}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Program Type</span>
                  <span class="detail-value">${programType}</span>
                </div>
              </div>

              <div class="fee-highlight">
                <div class="label">Speaker Fee</div>
                <div class="amount">${speakerFee}</div>
              </div>

              <p>Click the button below to review the complete offer details, including event schedule, travel arrangements, and technical requirements.</p>

              <a href="${speakerReviewUrl}" class="cta-button">Review Full Offer Details</a>

              <p style="color: #6b7280; font-size: 14px;">After reviewing, you'll be able to confirm or decline the engagement directly from the page.</p>
            </div>
            <div class="footer">
              <p>Speak About AI<br>
              Connecting audiences with inspiring AI speakers</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Firm Offer Ready for Review

Hi ${displayName},

We're pleased to present a firm offer for your consideration.

Event: ${eventName}
Organization: ${companyName}
Date: ${formattedDate}
Location: ${eventLocation}
Program Type: ${programType}
Speaker Fee: ${speakerFee}

Please review the complete offer details here: ${speakerReviewUrl}

After reviewing, you'll be able to confirm or decline the engagement.

Best regards,
Speak About AI Team
      `
    })

    if (!emailSent) {
      console.warn('Email may not have been sent, but status was updated')
    }

    return NextResponse.json({
      success: true,
      message: 'Firm offer sent to speaker',
      speaker_review_url: speakerReviewUrl,
      firm_offer_id: id
    })
  } catch (error) {
    console.error('Error sending firm offer to speaker:', error)
    return NextResponse.json(
      { error: 'Failed to send firm offer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

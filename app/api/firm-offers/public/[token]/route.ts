import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendEmail } from "@/lib/email"

const sql = neon(process.env.DATABASE_URL!)

// Get firm offer by token (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const result = await sql`
      SELECT * FROM firm_offers WHERE speaker_access_token = ${token}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Firm offer not found" }, { status: 404 })
    }

    // Update viewed status
    await sql`
      UPDATE firm_offers
      SET speaker_viewed_at = COALESCE(speaker_viewed_at, NOW()),
          status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END
      WHERE speaker_access_token = ${token}
    `

    // Flatten JSONB data for easier frontend consumption
    const offer = result[0]
    const flatData = {
      id: offer.id,
      status: offer.status,
      speaker_access_token: offer.speaker_access_token,
      // Flatten event_overview
      event_classification: offer.event_overview?.event_classification || 'travel',
      company_name: offer.event_overview?.company_name || '',
      end_client_name: offer.event_overview?.end_client_name || '',
      event_name: offer.event_overview?.event_name || '',
      event_date: offer.event_overview?.event_date || '',
      event_location: offer.event_overview?.event_location || '',
      event_website: offer.event_overview?.event_website || '',
      billing_contact_name: offer.event_overview?.billing_contact?.name || '',
      billing_contact_title: offer.event_overview?.billing_contact?.title || '',
      billing_contact_email: offer.event_overview?.billing_contact?.email || '',
      billing_contact_phone: offer.event_overview?.billing_contact?.phone || '',
      billing_address: offer.event_overview?.billing_contact?.address || '',
      logistics_contact_name: offer.event_overview?.logistics_contact?.name || '',
      logistics_contact_email: offer.event_overview?.logistics_contact?.email || '',
      logistics_contact_phone: offer.event_overview?.logistics_contact?.phone || '',
      // Flatten speaker_program
      speaker_name: offer.speaker_program?.speaker_name || '',
      program_topic: offer.speaker_program?.program_topic || '',
      program_type: offer.speaker_program?.program_type || 'keynote',
      audience_size: offer.speaker_program?.audience_size || null,
      audience_demographics: offer.speaker_program?.audience_demographics || '',
      speaker_attire: offer.speaker_program?.speaker_attire || 'business_casual',
      // Flatten event_schedule
      event_start_time: offer.event_schedule?.event_start_time || '',
      event_end_time: offer.event_schedule?.event_end_time || '',
      speaker_arrival_time: offer.event_schedule?.speaker_arrival_time || '',
      program_start_time: offer.event_schedule?.program_start_time || '',
      program_length_minutes: offer.event_schedule?.program_length_minutes || null,
      qa_length_minutes: offer.event_schedule?.qa_length_minutes || null,
      timezone: offer.event_schedule?.timezone || 'America/Los_Angeles',
      detailed_timeline: offer.event_schedule?.detailed_timeline || '',
      // Flatten technical_requirements
      recording_allowed: offer.technical_requirements?.recording_allowed || false,
      recording_purpose: offer.technical_requirements?.recording_purpose || '',
      live_streaming: offer.technical_requirements?.live_streaming || false,
      photography_allowed: offer.technical_requirements?.photography_allowed || false,
      // Flatten travel_accommodation
      fly_in_date: offer.travel_accommodation?.fly_in_date || '',
      fly_out_date: offer.travel_accommodation?.fly_out_date || '',
      nearest_airport: offer.travel_accommodation?.nearest_airport || '',
      airport_transport_provided: offer.travel_accommodation?.airport_transport_provided || false,
      hotel_name: offer.travel_accommodation?.hotel_name || '',
      hotel_dates_needed: offer.travel_accommodation?.hotel_dates_needed || '',
      meals_provided: offer.travel_accommodation?.meals_provided || '',
      dietary_requirements: offer.travel_accommodation?.dietary_requirements || '',
      // Flatten additional_info
      venue_name: offer.additional_info?.venue_name || '',
      venue_address: offer.additional_info?.venue_address || '',
      venue_contact_name: offer.additional_info?.venue_contact_name || '',
      venue_contact_email: offer.additional_info?.venue_contact_email || '',
      venue_contact_phone: offer.additional_info?.venue_contact_phone || '',
      green_room_available: offer.additional_info?.green_room_available || false,
      special_requests: offer.additional_info?.special_requests || '',
      // Flatten financial_details
      speaker_fee: offer.financial_details?.speaker_fee || null,
      travel_expenses_type: offer.financial_details?.travel_expenses_type || 'flat_buyout',
      travel_expenses_amount: offer.financial_details?.travel_expenses_amount || null,
      payment_terms: offer.financial_details?.payment_terms || 'net_30',
      // Flatten confirmation
      prep_call_requested: offer.confirmation?.prep_call_requested || false,
      additional_notes: offer.confirmation?.additional_notes || '',
      // Timestamps
      created_at: offer.created_at,
      updated_at: offer.updated_at
    }

    return NextResponse.json(flatData)
  } catch (error) {
    console.error("Error fetching firm offer:", error)
    return NextResponse.json({ error: "Failed to fetch firm offer" }, { status: 500 })
  }
}

// Update firm offer by token (public - for recipient to fill in)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const data = await request.json()

    // Check if firm offer exists
    const existing = await sql`SELECT id, status FROM firm_offers WHERE speaker_access_token = ${token}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Firm offer not found" }, { status: 404 })
    }

    // Build JSONB objects
    const eventOverview = {
      event_classification: data.event_classification || 'travel',
      company_name: data.company_name || '',
      end_client_name: data.end_client_name || '',
      event_name: data.event_name || '',
      event_date: data.event_date || '',
      event_location: data.event_location || '',
      event_website: data.event_website || '',
      billing_contact: {
        name: data.billing_contact_name || '',
        title: data.billing_contact_title || '',
        email: data.billing_contact_email || '',
        phone: data.billing_contact_phone || '',
        address: data.billing_address || ''
      },
      logistics_contact: {
        name: data.logistics_contact_name || '',
        email: data.logistics_contact_email || '',
        phone: data.logistics_contact_phone || ''
      }
    }

    const speakerProgram = {
      speaker_name: data.speaker_name || '',
      program_topic: data.program_topic || '',
      program_type: data.program_type || 'keynote',
      audience_size: data.audience_size ? parseInt(data.audience_size) : null,
      audience_demographics: data.audience_demographics || '',
      speaker_attire: data.speaker_attire || 'business_casual'
    }

    const eventSchedule = {
      event_start_time: data.event_start_time || '',
      event_end_time: data.event_end_time || '',
      speaker_arrival_time: data.speaker_arrival_time || '',
      program_start_time: data.program_start_time || '',
      program_length_minutes: data.program_length_minutes ? parseInt(data.program_length_minutes) : null,
      qa_length_minutes: data.qa_length_minutes ? parseInt(data.qa_length_minutes) : null,
      timezone: data.timezone || 'America/Los_Angeles',
      detailed_timeline: data.detailed_timeline || ''
    }

    const technicalRequirements = {
      recording_allowed: data.recording_allowed || false,
      recording_purpose: data.recording_purpose || '',
      live_streaming: data.live_streaming || false,
      photography_allowed: data.photography_allowed || false
    }

    const travelAccommodation = {
      fly_in_date: data.fly_in_date || '',
      fly_out_date: data.fly_out_date || '',
      nearest_airport: data.nearest_airport || '',
      airport_transport_provided: data.airport_transport_provided || false,
      hotel_name: data.hotel_name || '',
      hotel_dates_needed: data.hotel_dates_needed || '',
      meals_provided: data.meals_provided || '',
      dietary_requirements: data.dietary_requirements || ''
    }

    const additionalInfo = {
      venue_name: data.venue_name || '',
      venue_address: data.venue_address || '',
      venue_contact_name: data.venue_contact_name || '',
      venue_contact_email: data.venue_contact_email || '',
      venue_contact_phone: data.venue_contact_phone || '',
      green_room_available: data.green_room_available || false,
      special_requests: data.special_requests || ''
    }

    const financialDetails = {
      speaker_fee: data.speaker_fee ? parseFloat(data.speaker_fee) : null,
      travel_expenses_type: data.travel_expenses_type || 'flat_buyout',
      travel_expenses_amount: data.travel_expenses_amount ? parseFloat(data.travel_expenses_amount) : null,
      payment_terms: data.payment_terms || 'net_30'
    }

    const confirmation = {
      prep_call_requested: data.prep_call_requested || false,
      additional_notes: data.additional_notes || data.special_requests || ''
    }

    // Check if all required fields are filled
    const isComplete = !!(
      data.company_name &&
      data.event_name &&
      data.event_date &&
      data.billing_contact_name &&
      data.billing_contact_email &&
      data.logistics_contact_name &&
      data.logistics_contact_email &&
      data.speaker_name &&
      data.program_topic &&
      data.speaker_fee
    )

    const wasComplete = existing[0].status === 'completed'
    const newStatus = isComplete ? 'completed' : 'viewed'

    const result = await sql`
      UPDATE firm_offers SET
        event_overview = ${JSON.stringify(eventOverview)},
        speaker_program = ${JSON.stringify(speakerProgram)},
        event_schedule = ${JSON.stringify(eventSchedule)},
        technical_requirements = ${JSON.stringify(technicalRequirements)},
        travel_accommodation = ${JSON.stringify(travelAccommodation)},
        additional_info = ${JSON.stringify(additionalInfo)},
        financial_details = ${JSON.stringify(financialDetails)},
        confirmation = ${JSON.stringify(confirmation)},
        status = ${newStatus},
        speaker_response_at = ${isComplete && !wasComplete ? sql`NOW()` : sql`speaker_response_at`},
        updated_at = NOW()
      WHERE speaker_access_token = ${token}
      RETURNING *
    `

    // Send email notification when first completed
    if (isComplete && !wasComplete) {
      await sendCompletionNotification(result[0])
    }

    // Return flattened data
    return NextResponse.json({
      ...data,
      id: result[0].id,
      status: newStatus
    })
  } catch (error) {
    console.error("Error updating firm offer:", error)
    return NextResponse.json({ error: "Failed to update firm offer" }, { status: 500 })
  }
}

async function sendCompletionNotification(firmOffer: any) {
  try {
    const overview = firmOffer.event_overview || {}
    const program = firmOffer.speaker_program || {}
    const financial = firmOffer.financial_details || {}
    const schedule = firmOffer.event_schedule || {}
    const travel = firmOffer.travel_accommodation || {}

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'
    const adminEmail = process.env.ADMIN_EMAIL || 'noah@speakabout.ai'

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Firm Offer Completed!</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
            A client has completed their firm offer sheet. Here are the details:
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
            <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Event Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Company:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${overview.company_name || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Event Name:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${overview.event_name || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Event Date:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${overview.event_date ? new Date(overview.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Location:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${overview.event_location || 'TBD'}</td></tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
            <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Speaker & Program</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Speaker:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${program.speaker_name || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Topic:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${program.program_topic || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Program Type:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${program.program_type || 'Keynote'}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Audience Size:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${program.audience_size || 'TBD'}</td></tr>
            </table>
          </div>

          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; border: 1px solid #16a34a; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #166534; margin: 0 0 16px 0;">Financial Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #166534; width: 140px;">Speaker Fee:</td><td style="padding: 8px 0; font-weight: 700; color: #166534; font-size: 20px;">$${parseFloat(financial.speaker_fee || 0).toLocaleString()}</td></tr>
              ${financial.travel_expenses_amount ? `<tr><td style="padding: 8px 0; color: #166534;">Travel Budget:</td><td style="padding: 8px 0; font-weight: 600; color: #166534;">$${parseFloat(financial.travel_expenses_amount).toLocaleString()}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #166534;">Payment Terms:</td><td style="padding: 8px 0; font-weight: 600; color: #166534;">${financial.payment_terms?.replace(/_/g, ' ').toUpperCase() || 'Net 30'}</td></tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px 0; border-bottom: 2px solid #8b5cf6; padding-bottom: 8px;">Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Billing Contact:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${overview.billing_contact?.name || 'N/A'} (${overview.billing_contact?.email || 'N/A'})</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Logistics Contact:</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${overview.logistics_contact?.name || 'N/A'} (${overview.logistics_contact?.email || 'N/A'})</td></tr>
            </table>
          </div>

          <div style="text-align: center;">
            <a href="${baseUrl}/admin/firm-offers/${firmOffer.id}"
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              View Full Details
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            This notification was sent from Speak About AI
          </p>
        </div>
      </div>
    `

    const textContent = `
Firm Offer Completed!

A client has completed their firm offer sheet.

EVENT DETAILS
Company: ${overview.company_name || 'N/A'}
Event Name: ${overview.event_name || 'N/A'}
Event Date: ${overview.event_date ? new Date(overview.event_date).toLocaleDateString() : 'TBD'}
Location: ${overview.event_location || 'TBD'}

SPEAKER & PROGRAM
Speaker: ${program.speaker_name || 'N/A'}
Topic: ${program.program_topic || 'N/A'}
Program Type: ${program.program_type || 'Keynote'}

FINANCIAL DETAILS
Speaker Fee: $${parseFloat(financial.speaker_fee || 0).toLocaleString()}
${financial.travel_expenses_amount ? `Travel Budget: $${parseFloat(financial.travel_expenses_amount).toLocaleString()}` : ''}
Payment Terms: ${financial.payment_terms?.replace(/_/g, ' ').toUpperCase() || 'Net 30'}

View full details: ${baseUrl}/admin/firm-offers/${firmOffer.id}
    `

    await sendEmail({
      to: adminEmail,
      subject: `Firm Offer Completed: ${overview.event_name || overview.company_name || 'New Event'}`,
      html: htmlContent,
      text: textContent
    })

    console.log('Firm offer completion notification sent to:', adminEmail)
  } catch (error) {
    console.error("Error sending completion notification:", error)
  }
}

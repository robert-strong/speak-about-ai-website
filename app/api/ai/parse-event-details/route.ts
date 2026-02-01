import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'Anthropic API key not configured'
      }, { status: 500 })
    }

    const systemPrompt = `You are an AI assistant that extracts event and speaker booking details from text.
Extract the following information if present:

EVENT OVERVIEW:
- company_name: The company or organization booking the speaker
- end_client_name: The end client if different from company (e.g., if an agency is booking)
- event_name: The name of the event
- event_date: The date of the event (format as YYYY-MM-DD if possible)
- event_location: Full venue name and address
- event_website: Event website URL if provided
- event_type: One of "virtual", "local", or "travel"

BILLING CONTACT:
- billing_contact_name: Billing contact person's name
- billing_contact_title: Billing contact's job title
- billing_contact_email: Billing contact's email
- billing_contact_phone: Billing contact's phone number
- billing_address: Full billing address

LOGISTICS CONTACT:
- logistics_contact_name: Logistics contact person's name (if different from billing)
- logistics_contact_email: Logistics contact's email
- logistics_contact_phone: Logistics contact's phone number

VENUE DETAILS:
- venue_name: The name of the venue (e.g., "Linwood Country Club")
- venue_address: The full address of the venue
- venue_contact_name: Venue contact person's name
- venue_contact_email: Venue contact's email
- venue_contact_phone: Venue contact's phone number

SPEAKER & PROGRAM:
- speaker_name: The speaker being requested
- program_topic: The topic or theme of the presentation
- program_type: One of "keynote", "workshop", "fireside_chat", "panel_discussion", "breakout_session", or "emcee"
- audience_size: Expected number of attendees (as a number)
- audience_demographics: Description of the audience (e.g., "Board members, C-suite executives, medical staff")
- speaker_attire: Dress code (e.g., "business", "business_casual", "casual")

SCHEDULE:
- event_start_time: Event start time (HH:MM format)
- event_end_time: Event end time (HH:MM format)
- speaker_arrival_time: When speaker should arrive at venue (HH:MM format)
- program_start_time: Speaker program start time (HH:MM format)
- program_length_minutes: Duration of the program in minutes (as a number)
- qa_length_minutes: Duration of Q&A in minutes (as a number)
- speaker_departure_time: When speaker can depart (HH:MM format)
- timezone: Time zone (default to "America/New_York" for East Coast, "America/Los_Angeles" for West Coast)
- detailed_timeline: Full event agenda with specific times (e.g., "11:30am - Arrive, 12:00pm - Lunch, 1:00pm - Presentation")

TECHNICAL REQUIREMENTS:
- av_requirements: AV needs (microphone type, projector, screen, lighting, etc.)
- recording_allowed: Whether recording is permitted (true/false)
- recording_purpose: Purpose of recording if allowed
- photography_allowed: Whether photography is permitted (true/false)
- live_streaming: Whether event will be live streamed (true/false)
- tech_rehearsal_time: Date/time for tech rehearsal or sound check

TRAVEL & ACCOMMODATION:
- fly_in_date: Date to fly in (format as YYYY-MM-DD)
- fly_out_date: Date to fly out (format as YYYY-MM-DD)
- nearest_airport: Airport code or name (e.g., "PHL" or "Philadelphia")
- airport_transport_provided: Whether client provides airport transportation (true/false)
- hotel_transport_provided: Whether client provides hotel to venue transportation (true/false)
- hotel_required: Whether hotel accommodation is needed (true/false)
- hotel_name: Hotel name if mentioned
- hotel_dates_needed: Hotel dates as text (e.g., "October 14-15, 2026")

ADDITIONAL INFO:
- green_room_available: Whether a green room or holding area is available (true/false)
- meet_and_greet: Details about meet & greet opportunities (e.g., "after presentation at lunch")
- marketing_promotion: Marketing/promotion details or restrictions
- press_media: Press or media interview details
- special_requests: Any special requests or considerations
- guest_list_notes: Notes about guest list (e.g., "speaker will be invited to lunch")

FINANCIAL DETAILS:
- speaker_fee: The speaker fee (as a number, no currency symbols)
- travel_expenses_amount: Travel buyout or expense amount (as a number, no currency symbols)
- travel_expenses_type: One of "flat_buyout", "actual_expenses", "client_books", or "included"
- payment_terms: Payment terms (e.g., "50_50" for 50% deposit/50% before event, "net_30", "upon_completion")
- payment_notes: Additional payment details

PREP CALL:
- prep_call_date: Date for prep call (format as YYYY-MM-DD if possible)
- prep_call_time: Time for prep call (HH:MM format)

ADDITIONAL ENGAGEMENTS:
- additional_engagements: Whether there are additional engagement opportunities beyond the main presentation (true/false)

OTHER:
- notes: Any additional relevant details not captured above

Return ONLY a valid JSON object with these fields. Use null for missing values. Do not include any explanation or markdown.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Extract event and booking details from this text:\n\n${text}`
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      return NextResponse.json({ error: 'Failed to parse with AI' }, { status: 500 })
    }

    const result = await response.json()
    const content = result.content?.[0]?.text

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Parse the JSON response
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanContent)
      return NextResponse.json(parsed)
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

  } catch (error) {
    console.error('Parse event details error:', error)
    return NextResponse.json({
      error: 'Failed to parse event details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

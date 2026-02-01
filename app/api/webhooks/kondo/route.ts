import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const payload = await request.json()

    const { event, data } = payload

    // Validate webhook
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.KONDO_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    console.log('Kondo webhook received:', event.type, data.contact_first_name, data.contact_last_name)

    // Extract labels
    const labels = data.kondo_labels?.map((l: any) => l.kondo_label_name) || []

    // Upsert Kondo contact
    const contactResult = await sql`
      INSERT INTO kondo_contacts (
        kondo_id,
        first_name,
        last_name,
        email,
        linkedin_url,
        linkedin_uid,
        headline,
        location,
        picture_url,
        conversation_status,
        conversation_state,
        latest_message,
        latest_message_at,
        kondo_url,
        kondo_note,
        labels,
        raw_data,
        created_at,
        updated_at
      ) VALUES (
        ${data.contact_linkedin_uid},
        ${data.contact_first_name},
        ${data.contact_last_name},
        ${event.email},
        ${data.contact_linkedin_url},
        ${data.contact_linkedin_uid},
        ${data.contact_headline},
        ${data.contact_location},
        ${data.contact_picture},
        ${data.conversation_status},
        ${data.conversation_state},
        ${data.conversation_latest_content},
        ${data.conversation_latest_timestamp ? new Date(data.conversation_latest_timestamp) : null},
        ${data.kondo_url},
        ${data.kondo_note},
        ${JSON.stringify(data.kondo_labels)},
        ${JSON.stringify(payload)},
        NOW(),
        NOW()
      )
      ON CONFLICT (kondo_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        linkedin_url = EXCLUDED.linkedin_url,
        headline = EXCLUDED.headline,
        location = EXCLUDED.location,
        picture_url = EXCLUDED.picture_url,
        conversation_status = EXCLUDED.conversation_status,
        conversation_state = EXCLUDED.conversation_state,
        latest_message = EXCLUDED.latest_message,
        latest_message_at = EXCLUDED.latest_message_at,
        kondo_url = EXCLUDED.kondo_url,
        kondo_note = EXCLUDED.kondo_note,
        labels = EXCLUDED.labels,
        raw_data = EXCLUDED.raw_data,
        updated_at = NOW()
      RETURNING id
    `

    // Check if this contact is an SQL (should create a lead)
    const isSQL = labels.includes('SQL')
    let leadCreated = false

    if (isSQL) {
      const company = data.contact_headline?.split(' at ')[1]?.trim() || null
      const kondoContactId = contactResult[0].id

      // Check if lead already exists for this contact
      const existingLead = await sql`
        SELECT id FROM leads
        WHERE email = ${event.email}
        LIMIT 1
      `

      if (existingLead.length > 0) {
        // Update existing lead
        await sql`
          UPDATE leads SET
            name = ${data.contact_first_name + ' ' + data.contact_last_name},
            company = ${company},
            title = ${data.contact_headline},
            linkedin_url = ${data.contact_linkedin_url},
            kondo_contact_id = ${kondoContactId},
            notes = COALESCE(notes, '') || E'\n\nKondo Update (' || NOW() || '): ' || ${data.conversation_latest_content || 'No message'},
            last_contact_date = ${data.conversation_latest_timestamp ? new Date(data.conversation_latest_timestamp) : new Date()},
            next_follow_up_date = ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)},
            updated_at = NOW()
          WHERE id = ${existingLead[0].id}
        `
      } else {
        // Create new lead
        const result = await sql`
          INSERT INTO leads (
            name,
            email,
            company,
            title,
            linkedin_url,
            source,
            status,
            priority,
            notes,
            last_contact_date,
            next_follow_up_date,
            kondo_contact_id,
            created_at,
            updated_at
          ) VALUES (
            ${data.contact_first_name + ' ' + data.contact_last_name},
            ${event.email},
            ${company},
            ${data.contact_headline},
            ${data.contact_linkedin_url},
            'kondo_linkedin',
            'new',
            'high',
            ${data.conversation_latest_content || 'SQL contact from Kondo LinkedIn integration'},
            ${data.conversation_latest_timestamp ? new Date(data.conversation_latest_timestamp) : new Date()},
            ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)},
            ${kondoContactId},
            NOW(),
            NOW()
          )
          RETURNING id
        `
        leadCreated = true
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      leadCreated,
      isSQL
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    console.error('Kondo webhook error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}

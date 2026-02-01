import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'

const sql = neon(process.env.DATABASE_URL!)

// Helper to verify client token
function verifyClientToken(request: NextRequest): { clientId: number; email: string } | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    if (decoded.type !== 'client' || !decoded.clientId) {
      return null
    }
    return { clientId: decoded.clientId, email: decoded.email }
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = verifyClientToken(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clients = await sql`
      SELECT
        id,
        name,
        email,
        phone,
        company,
        title,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        timezone,
        preferred_contact_method,
        internal_info,
        portal_enabled,
        is_active,
        last_login,
        created_at,
        updated_at
      FROM clients
      WHERE id = ${auth.clientId}
      LIMIT 1
    `

    if (clients.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const client = clients[0]

    // Parse internal info
    const internalInfo = client.internal_info || {}

    const profile = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      company: client.company || '',
      title: client.title || '',
      address: {
        line1: client.address_line1 || '',
        line2: client.address_line2 || '',
        city: client.city || '',
        state: client.state || '',
        postal_code: client.postal_code || '',
        country: client.country || ''
      },
      timezone: client.timezone || '',
      preferred_contact_method: client.preferred_contact_method || 'email',
      billing_contact: internalInfo.billing_contact || {},
      logistics_contact: internalInfo.logistics_contact || {},
      notes: internalInfo.notes || '',
      portal_enabled: client.portal_enabled,
      is_active: client.is_active,
      last_login: client.last_login,
      created_at: client.created_at,
      updated_at: client.updated_at
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('Error fetching client profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyClientToken(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Prepare internal info
    const internalInfo = {
      billing_contact: data.billing_contact || null,
      logistics_contact: data.logistics_contact || null,
      notes: data.notes || null
    }

    // Update client
    const result = await sql`
      UPDATE clients
      SET
        name = ${data.name || null},
        phone = ${data.phone || null},
        company = ${data.company || null},
        title = ${data.title || null},
        address_line1 = ${data.address?.line1 || null},
        address_line2 = ${data.address?.line2 || null},
        city = ${data.address?.city || null},
        state = ${data.address?.state || null},
        postal_code = ${data.address?.postal_code || null},
        country = ${data.address?.country || null},
        timezone = ${data.timezone || null},
        preferred_contact_method = ${data.preferred_contact_method || 'email'},
        internal_info = ${JSON.stringify(internalInfo)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${auth.clientId}
      RETURNING id, name, email, company, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      client: result[0]
    })

  } catch (error) {
    console.error('Error updating client profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// GET all contacts or filtered contacts
export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'internal', 'external', or null for all
    const search = searchParams.get('search');
    const active = searchParams.get('active') !== 'false'; // Default to true
    
    // Build query based on filters
    let contacts;
    
    if (type && search) {
      const searchPattern = `%${search}%`;
      contacts = await sql`
        SELECT * FROM contacts
        WHERE is_active = ${active}
        AND type = ${type}
        AND (
          LOWER(first_name) LIKE LOWER(${searchPattern}) OR
          LOWER(last_name) LIKE LOWER(${searchPattern}) OR
          LOWER(email) LIKE LOWER(${searchPattern}) OR
          LOWER(company) LIKE LOWER(${searchPattern})
        )
        ORDER BY type, last_name, first_name
      `;
    } else if (type) {
      contacts = await sql`
        SELECT * FROM contacts
        WHERE is_active = ${active}
        AND type = ${type}
        ORDER BY type, last_name, first_name
      `;
    } else if (search) {
      const searchPattern = `%${search}%`;
      contacts = await sql`
        SELECT * FROM contacts
        WHERE is_active = ${active}
        AND (
          LOWER(first_name) LIKE LOWER(${searchPattern}) OR
          LOWER(last_name) LIKE LOWER(${searchPattern}) OR
          LOWER(email) LIKE LOWER(${searchPattern}) OR
          LOWER(company) LIKE LOWER(${searchPattern})
        )
        ORDER BY type, last_name, first_name
      `;
    } else {
      contacts = await sql`
        SELECT * FROM contacts
        WHERE is_active = ${active}
        ORDER BY type, last_name, first_name
      `;
    }
    
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST create new contact
export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    const {
      type,
      first_name,
      last_name,
      email,
      phone,
      mobile,
      company,
      job_title,
      department,
      linkedin_url,
      twitter_handle,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      timezone,
      preferred_contact_method,
      tags,
      notes
    } = body;
    
    // Validate required fields
    if (!type || !first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: type, first_name, last_name, email' },
        { status: 400 }
      );
    }
    
    // Validate type
    if (!['internal', 'external'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "internal" or "external"' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      INSERT INTO contacts (
        type,
        first_name,
        last_name,
        email,
        phone,
        mobile,
        company,
        job_title,
        department,
        linkedin_url,
        twitter_handle,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        timezone,
        preferred_contact_method,
        tags,
        notes
      ) VALUES (
        ${type},
        ${first_name},
        ${last_name},
        ${email},
        ${phone || null},
        ${mobile || null},
        ${company || null},
        ${job_title || null},
        ${department || null},
        ${linkedin_url || null},
        ${twitter_handle || null},
        ${address_line1 || null},
        ${address_line2 || null},
        ${city || null},
        ${state || null},
        ${postal_code || null},
        ${country || null},
        ${timezone || null},
        ${preferred_contact_method || null},
        ${tags || []},
        ${notes || null}
      )
      RETURNING *
    `;
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
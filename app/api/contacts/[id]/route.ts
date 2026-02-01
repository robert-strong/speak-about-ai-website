import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// GET single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { id } = await params;
    const contactId = parseInt(id);
    
    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      );
    }
    
    const contacts = await sql`
      SELECT * FROM contacts WHERE id = ${contactId}
    `;
    
    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    // Also fetch related deals
    const deals = await sql`
      SELECT 
        d.*,
        dc.role,
        dc.is_primary,
        dc.notes as contact_notes
      FROM deals d
      JOIN deal_contacts dc ON d.id = dc.deal_id
      WHERE dc.contact_id = ${contactId}
      ORDER BY d.created_at DESC
    `;
    
    return NextResponse.json({
      ...contacts[0],
      deals
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

// PUT update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { id } = await params;
    const contactId = parseInt(id);
    const body = await request.json();
    
    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      );
    }
    
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
      notes,
      is_active
    } = body;
    
    const result = await sql`
      UPDATE contacts SET
        type = COALESCE(${type}, type),
        first_name = COALESCE(${first_name}, first_name),
        last_name = COALESCE(${last_name}, last_name),
        email = COALESCE(${email}, email),
        phone = ${phone},
        mobile = ${mobile},
        company = ${company},
        job_title = ${job_title},
        department = ${department},
        linkedin_url = ${linkedin_url},
        twitter_handle = ${twitter_handle},
        address_line1 = ${address_line1},
        address_line2 = ${address_line2},
        city = ${city},
        state = ${state},
        postal_code = ${postal_code},
        country = ${country},
        timezone = ${timezone},
        preferred_contact_method = ${preferred_contact_method},
        tags = COALESCE(${tags}, tags),
        notes = ${notes},
        is_active = COALESCE(${is_active}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${contactId}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating contact:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A contact with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE contact (soft delete by setting is_active = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { id } = await params;
    const contactId = parseInt(id);
    
    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID' },
        { status: 400 }
      );
    }
    
    // Soft delete by setting is_active to false
    const result = await sql`
      UPDATE contacts 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${contactId}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Contact deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
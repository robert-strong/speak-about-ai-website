import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// GET all contacts for a deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { id } = await params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return NextResponse.json(
        { error: 'Invalid deal ID' },
        { status: 400 }
      );
    }
    
    const contacts = await sql`
      SELECT 
        c.*,
        dc.role,
        dc.is_primary,
        dc.notes as relationship_notes,
        dc.created_at as linked_at
      FROM contacts c
      JOIN deal_contacts dc ON c.id = dc.contact_id
      WHERE dc.deal_id = ${dealId}
      ORDER BY dc.is_primary DESC, c.last_name, c.first_name
    `;
    
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching deal contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deal contacts' },
      { status: 500 }
    );
  }
}

// POST link a contact to a deal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { id } = await params;
    const dealId = parseInt(id);
    const body = await request.json();
    
    if (isNaN(dealId)) {
      return NextResponse.json(
        { error: 'Invalid deal ID' },
        { status: 400 }
      );
    }
    
    const { contact_id, role = 'contact', is_primary = false, notes } = body;
    
    if (!contact_id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }
    
    // If setting as primary, unset other primary contacts for this deal
    if (is_primary) {
      await sql`
        UPDATE deal_contacts 
        SET is_primary = false 
        WHERE deal_id = ${dealId}
      `;
    }
    
    // Link the contact to the deal
    const result = await sql`
      INSERT INTO deal_contacts (deal_id, contact_id, role, is_primary, notes)
      VALUES (${dealId}, ${contact_id}, ${role}, ${is_primary}, ${notes || null})
      ON CONFLICT (deal_id, contact_id) 
      DO UPDATE SET 
        role = EXCLUDED.role,
        is_primary = EXCLUDED.is_primary,
        notes = EXCLUDED.notes
      RETURNING *
    `;
    
    // Fetch the full contact details
    const contact = await sql`
      SELECT 
        c.*,
        dc.role,
        dc.is_primary,
        dc.notes as relationship_notes
      FROM contacts c
      JOIN deal_contacts dc ON c.id = dc.contact_id
      WHERE dc.deal_id = ${dealId} AND dc.contact_id = ${contact_id}
    `;
    
    return NextResponse.json(contact[0], { status: 201 });
  } catch (error) {
    console.error('Error linking contact to deal:', error);
    return NextResponse.json(
      { error: 'Failed to link contact to deal' },
      { status: 500 }
    );
  }
}

// DELETE unlink a contact from a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { id } = await params;
    const dealId = parseInt(id);
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get('contact_id');
    
    if (isNaN(dealId) || !contactId) {
      return NextResponse.json(
        { error: 'Invalid deal ID or contact ID' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      DELETE FROM deal_contacts 
      WHERE deal_id = ${dealId} AND contact_id = ${parseInt(contactId)}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Contact link not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Contact unlinked from deal successfully' 
    });
  } catch (error) {
    console.error('Error unlinking contact from deal:', error);
    return NextResponse.json(
      { error: 'Failed to unlink contact from deal' },
      { status: 500 }
    );
  }
}
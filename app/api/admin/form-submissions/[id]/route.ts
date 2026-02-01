import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const { id } = await params
    const body = await request.json()
    const { status, admin_notes } = body
    
    const sql = neon(databaseUrl)
    
    // Build update query dynamically based on provided fields
    const updates = []
    const values = []
    let valueIndex = 1
    
    if (status !== undefined) {
      updates.push(`status = $${valueIndex}`)
      values.push(status)
      valueIndex++
    }
    
    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${valueIndex}`)
      values.push(admin_notes)
      valueIndex++
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    
    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    
    // Add id as the last parameter
    values.push(parseInt(id))
    
    const query = `
      UPDATE form_submissions 
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `
    
    const [updatedSubmission] = await sql(query, values)
    
    return NextResponse.json(updatedSubmission)
  } catch (error) {
    console.error('Error updating form submission:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const { id } = await params
    const sql = neon(databaseUrl)
    
    const [submission] = await sql`
      SELECT * FROM form_submissions 
      WHERE id = ${parseInt(id)}
    `
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    
    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error fetching form submission:', error)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const { id } = await params
    const resourceId = parseInt(id)

    console.log('DELETE request - Raw ID param:', id)
    console.log('DELETE request - Parsed resourceId:', resourceId)

    if (isNaN(resourceId)) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 })
    }

    const sql = neon(databaseUrl)

    // First, check what resources exist
    const existingResources = await sql`
      SELECT id, subject FROM landing_page_resources
    `
    console.log('Existing resources in database:', existingResources.map(r => ({ id: r.id, subject: r.subject })))

    // Delete the resource
    const result = await sql`
      DELETE FROM landing_page_resources
      WHERE id = ${resourceId}
      RETURNING *
    `

    console.log('DELETE result:', result)

    if (result.length === 0) {
      console.log('Resource not found with ID:', resourceId)
      return NextResponse.json({ error: 'Resource not found', requestedId: resourceId, existingIds: existingResources.map(r => r.id) }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Resource deleted successfully',
      resource: result[0]
    })
  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
  }
}
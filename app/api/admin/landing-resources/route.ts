import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    
    // First, ensure the table exists
    await sql`
      CREATE TABLE IF NOT EXISTS landing_page_resources (
        id SERIAL PRIMARY KEY,
        url_patterns TEXT[],
        title_patterns TEXT[],
        subject VARCHAR(255) NOT NULL,
        resource_content TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        times_used INTEGER DEFAULT 0,
        last_used_at TIMESTAMP WITH TIME ZONE
      )
    `

    // Fetch all resources
    const resources = await sql`
      SELECT * FROM landing_page_resources 
      WHERE is_active = true 
      ORDER BY priority DESC, created_at DESC
    `
    
    // If no resources in database, auto-import from config
    if (resources.length === 0) {
      const { emailResources } = await import('@/lib/email-resources-config')

      // Insert each config resource into the database
      const insertedResources = []
      for (const resource of emailResources) {
        const result = await sql`
          INSERT INTO landing_page_resources (
            url_patterns,
            title_patterns,
            subject,
            resource_content,
            priority,
            is_active,
            created_by
          ) VALUES (
            ${resource.urlPatterns || []},
            ${resource.titlePatterns || []},
            ${resource.subject || ''},
            ${resource.resourceContent || ''},
            0,
            true,
            'auto-import'
          )
          RETURNING *
        `
        if (result[0]) {
          insertedResources.push(result[0])
        }
      }

      return NextResponse.json(insertedResources)
    }
    
    // Ensure all fields have proper defaults
    const sanitizedResources = resources.map(resource => ({
      ...resource,
      url_patterns: resource.url_patterns || [],
      title_patterns: resource.title_patterns || [],
      subject: resource.subject || '',
      resource_content: resource.resource_content || ''
    }))

    console.log('GET returning resources with IDs:', sanitizedResources.map(r => ({ id: r.id, subject: r.subject })))

    return NextResponse.json(sanitizedResources, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    const newResource = await request.json()
    
    // Insert the new resource
    const result = await sql`
      INSERT INTO landing_page_resources (
        url_patterns,
        title_patterns,
        subject,
        resource_content,
        priority,
        is_active,
        created_by
      ) VALUES (
        ${newResource.urlPatterns || []},
        ${newResource.titlePatterns || []},
        ${newResource.subject},
        ${newResource.resourceContent},
        ${newResource.priority || 0},
        ${newResource.isActive !== false},
        'admin'
      )
      RETURNING *
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Resource added successfully',
      resource: result[0]
    })
  } catch (error) {
    console.error('Error adding resource:', error)
    return NextResponse.json({ error: 'Failed to add resource' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    const { resource, id } = await request.json()
    
    let result
    if (id) {
      // Update existing resource
      result = await sql`
        UPDATE landing_page_resources 
        SET 
          url_patterns = ${resource.urlPatterns || []},
          title_patterns = ${resource.titlePatterns || []},
          subject = ${resource.subject},
          resource_content = ${resource.resourceContent},
          priority = ${resource.priority || 0},
          is_active = ${resource.isActive !== false},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        // If no resource found with that ID, insert as new
        result = await sql`
          INSERT INTO landing_page_resources (
            url_patterns,
            title_patterns,
            subject,
            resource_content,
            priority,
            is_active,
            created_by
          ) VALUES (
            ${resource.urlPatterns || []},
            ${resource.titlePatterns || []},
            ${resource.subject},
            ${resource.resourceContent},
            ${resource.priority || 0},
            ${resource.isActive !== false},
            'admin'
          )
          RETURNING *
        `
      }
    } else {
      // Insert as new if no ID provided
      result = await sql`
        INSERT INTO landing_page_resources (
          url_patterns,
          title_patterns,
          subject,
          resource_content,
          priority,
          is_active,
          created_by
        ) VALUES (
          ${resource.urlPatterns || []},
          ${resource.titlePatterns || []},
          ${resource.subject},
          ${resource.resourceContent},
          ${resource.priority || 0},
          ${resource.isActive !== false},
          'admin'
        )
        RETURNING *
      `
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Resource updated successfully',
      resource: result[0]
    })
  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
  }
}
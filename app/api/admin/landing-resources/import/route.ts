import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { emailResources } from '@/lib/email-resources-config'

export async function POST() {
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

    // Import all resources from config
    const results = []
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
          ${resource.subject},
          ${resource.resourceContent},
          0,
          true,
          'import'
        )
        ON CONFLICT DO NOTHING
        RETURNING *
      `
      if (result.length > 0) {
        results.push(result[0])
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Imported ${results.length} resources from config`,
      resources: results
    })
  } catch (error) {
    console.error('Error importing resources:', error)
    return NextResponse.json({ error: 'Failed to import resources' }, { status: 500 })
  }
}
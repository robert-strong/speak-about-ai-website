import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    
    const result = await sql`
      SELECT 
        id,
        project_name,
        client_name,
        client_email,
        client_phone,
        company,
        event_date,
        event_location,
        event_type,
        attendee_count,
        requested_speaker_name,
        speaker_bio,
        speaker_fee,
        speaker_presentation_title,
        speaker_av_requirements,
        venue_name,
        venue_address,
        venue_contact,
        contact_person,
        travel_required,
        accommodation_required,
        av_requirements,
        project_details,
        details_completion_percentage,
        has_critical_missing_info
      FROM projects 
      WHERE id = ${projectId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = result[0]
    console.log('Found project:', {
      id: project.id,
      name: project.project_name,
      client_name: project.client_name,
      event_date: project.event_date,
      requested_speaker_name: project.requested_speaker_name,
      venue_name: project.venue_name,
      contact_person: project.contact_person,
      has_project_details: !!project.project_details,
      details_keys: project.project_details ? Object.keys(project.project_details) : []
    })
    
    // Try to find a matching deal for additional data
    let dealData = null
    if (project.client_email || project.company) {
      try {
        // Build query conditionally to handle null values
        let whereClause = []
        let queryParams = []
        
        if (project.client_email) {
          whereClause.push(`client_email = $1`)
          queryParams.push(project.client_email)
        }
        
        if (project.company) {
          if (whereClause.length > 0) {
            whereClause.push(`OR company = $${queryParams.length + 1}`)
          } else {
            whereClause.push(`company = $1`)
          }
          queryParams.push(project.company)
        }
        
        // Only query if we have conditions
        if (whereClause.length > 0) {
          const dealQuery = `
            SELECT 
              organization_name,
              specific_speaker,
              event_budget,
              additional_info,
              wishlist_speakers,
              travel_required,
              travel_stipend,
              flight_required,
              hotel_required,
              travel_notes,
              notes
            FROM deals 
            WHERE (${whereClause.join(' ')})
            ORDER BY created_at DESC
            LIMIT 1
          `
          
          console.log('Deal query:', dealQuery, 'Params:', queryParams)
          // Skip deal lookup for now to isolate the issue
          // const dealResult = await sql(dealQuery, queryParams)
          // if (dealResult.length > 0) {
          //   dealData = dealResult[0]
          // }
        }
      } catch (error) {
        console.log('Error querying deal:', error)
      }
    }
    
    // Merge existing project data with project_details
    // This pre-populates fields from the main projects table and deal data if available
    const existingDetails = project.project_details || {}
    
    const mergedDetails = {
      ...existingDetails,
      overview: {
        ...(existingDetails.overview || {}),
        speaker_name: existingDetails.overview?.speaker_name || project.requested_speaker_name || '',
        company_name: existingDetails.overview?.company_name || project.company || '',
        event_location: existingDetails.overview?.event_location || project.event_location || '',
        event_date: existingDetails.overview?.event_date || project.event_date || '',
      },
      contacts: {
        ...(existingDetails.contacts || {}),
        on_site: {
          ...(existingDetails.contacts?.on_site || {}),
          name: existingDetails.contacts?.on_site?.name || project.contact_person || project.client_name || '',
          email: existingDetails.contacts?.on_site?.email || project.client_email || '',
          cell_phone: existingDetails.contacts?.on_site?.cell_phone || project.client_phone || '',
          company: existingDetails.contacts?.on_site?.company || project.company || '',
        }
      },
      event_details: {
        ...(existingDetails.event_details || {}),
        event_title: existingDetails.event_details?.event_title || project.project_name || '',
        event_type: existingDetails.event_details?.event_type || project.event_type || '',
      },
      audience: {
        ...(existingDetails.audience || {}),
        expected_size: existingDetails.audience?.expected_size || project.attendee_count || 0,
      },
      venue: {
        ...(existingDetails.venue || {}),
        name: existingDetails.venue?.name || project.venue_name || '',
        address: existingDetails.venue?.address || project.venue_address || '',
        venue_contact: {
          ...(existingDetails.venue?.venue_contact || {}),
          name: existingDetails.venue?.venue_contact?.name || project.venue_contact || '',
        }
      },
      speaker_requirements: {
        ...(existingDetails.speaker_requirements || {}),
        introduction: {
          ...(existingDetails.speaker_requirements?.introduction || {}),
          text: existingDetails.speaker_requirements?.introduction?.text || project.speaker_bio || '',
        },
        av_needs: {
          ...(existingDetails.speaker_requirements?.av_needs || {}),
          presentation_notes: existingDetails.speaker_requirements?.av_needs?.presentation_notes || 
                            project.speaker_av_requirements || project.av_requirements || '',
        },
        presentation: {
          ...(existingDetails.speaker_requirements?.presentation || {}),
        }
      },
      travel: {
        ...(existingDetails.travel || {}),
        hotel: {
          ...(existingDetails.travel?.hotel || {}),
          additional_info: existingDetails.travel?.hotel?.additional_info || '',
        },
        flights: {
          ...(existingDetails.travel?.flights || {}),
          notes: existingDetails.travel?.flights?.notes || 
                dealData?.travel_notes || '',
        },
        ground_transportation: {
          ...(existingDetails.travel?.ground_transportation || {}),
          details: existingDetails.travel?.ground_transportation?.details ||
                  (dealData?.travel_notes ? `Travel budget: $${dealData?.travel_stipend || 0}` : ''),
        }
      }
    }
    
    console.log('Merged details:', {
      has_overview: !!mergedDetails.overview,
      overview_speaker: mergedDetails.overview?.speaker_name,
      overview_company: mergedDetails.overview?.company_name,
      contacts_name: mergedDetails.contacts?.on_site?.name,
      event_title: mergedDetails.event_details?.event_title,
    })

    return NextResponse.json({
      projectId: result[0].id,
      projectName: result[0].project_name,
      details: mergedDetails || {}
    })
  } catch (error) {
    console.error('Error fetching project details - Full error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      projectId: params.id
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch project details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const details = await request.json()

    // Calculate completion percentage
    let totalFields = 0
    let completedFields = 0

    function countFields(obj: any) {
      for (const key in obj) {
        if (obj[key] !== undefined && obj[key] !== null) {
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            countFields(obj[key])
          } else {
            totalFields++
            if (obj[key] && obj[key] !== '') {
              completedFields++
            }
          }
        }
      }
    }

    countFields(details)
    const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

    // Check for critical missing fields
    const criticalFields = [
      'overview.speaker_name',
      'overview.company_name',
      'overview.event_location',
      'overview.event_date',
      'venue.name',
      'venue.address',
      'contacts.on_site',
      'audience.expected_size',
      'event_details.event_title'
    ]

    let hasCriticalMissing = false
    for (const fieldPath of criticalFields) {
      const keys = fieldPath.split('.')
      let current: any = details
      let isMissing = false
      
      for (const key of keys) {
        if (!current || !current[key]) {
          isMissing = true
          break
        }
        current = current[key]
      }
      
      if (isMissing) {
        hasCriticalMissing = true
        break
      }
    }

    // Update the project with details and completion tracking
    const result = await sql`
      UPDATE projects 
      SET 
        project_details = ${JSON.stringify(details)}::jsonb,
        details_completion_percentage = ${completionPercentage},
        has_critical_missing_info = ${hasCriticalMissing},
        updated_at = NOW()
      WHERE id = ${projectId}
      RETURNING id, project_name, project_details, details_completion_percentage, has_critical_missing_info
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      projectId: result[0].id,
      completionPercentage: result[0].details_completion_percentage,
      hasCriticalMissing: result[0].has_critical_missing_info
    })
  } catch (error) {
    console.error('Error updating project details:', error)
    return NextResponse.json(
      { error: 'Failed to update project details' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const { path, value } = await request.json()

    // Update a specific field in the project details
    const result = await sql`
      UPDATE projects 
      SET 
        project_details = jsonb_set(
          COALESCE(project_details, '{}'::jsonb),
          ${`{${path.split('.').join(',')}}}`},
          ${JSON.stringify(value)}::jsonb,
          true
        ),
        updated_at = NOW()
      WHERE id = ${projectId}
      RETURNING id, project_details
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Recalculate completion after update
    const details = result[0].project_details
    let totalFields = 0
    let completedFields = 0

    function countFields(obj: any) {
      for (const key in obj) {
        if (obj[key] !== undefined && obj[key] !== null) {
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            countFields(obj[key])
          } else {
            totalFields++
            if (obj[key] && obj[key] !== '') {
              completedFields++
            }
          }
        }
      }
    }

    countFields(details)
    const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

    // Update completion percentage
    await sql`
      UPDATE projects 
      SET details_completion_percentage = ${completionPercentage}
      WHERE id = ${projectId}
    `

    return NextResponse.json({
      success: true,
      projectId: result[0].id,
      completionPercentage
    })
  } catch (error) {
    console.error('Error updating project detail field:', error)
    return NextResponse.json(
      { error: 'Failed to update project detail field' },
      { status: 500 }
    )
  }
}
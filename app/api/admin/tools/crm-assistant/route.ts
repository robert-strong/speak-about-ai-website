import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'

const getSqlClient = () => {
  if (!process.env.DATABASE_URL) {
    console.log('CRM Assistant: No DATABASE_URL found')
    return null
  }
  try {
    return neon(process.env.DATABASE_URL)
  } catch (error) {
    console.error('Failed to initialize Neon client for CRM assistant:', error)
    return null
  }
}

// Define available tools for Claude
const tools = [
  {
    name: "get_deals",
    description: "Get a list of deals with optional filters",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: lead, qualified, proposal, negotiation, won, lost" },
        limit: { type: "number", description: "Maximum number of results" }
      }
    }
  },
  {
    name: "update_deal_status",
    description: "Update the status of a deal",
    input_schema: {
      type: "object",
      properties: {
        deal_id: { type: "number", description: "ID of the deal to update", required: true },
        status: { type: "string", description: "New status: lead, qualified, proposal, negotiation, won, lost", required: true }
      },
      required: ["deal_id", "status"]
    }
  },
  {
    name: "delete_deal",
    description: "Delete a deal",
    input_schema: {
      type: "object",
      properties: {
        deal_id: { type: "number", description: "ID of the deal to delete", required: true }
      },
      required: ["deal_id"]
    }
  },
  {
    name: "create_deal",
    description: "Create a new deal",
    input_schema: {
      type: "object",
      properties: {
        client_name: { type: "string", required: true },
        client_email: { type: "string", required: true },
        company: { type: "string", required: true },
        event_title: { type: "string", required: true },
        event_date: { type: "string", required: true },
        event_location: { type: "string", required: true },
        event_type: { type: "string", required: true },
        attendee_count: { type: "number", required: true },
        budget_range: { type: "string", required: true },
        deal_value: { type: "number", required: true },
        status: { type: "string", required: true },
        priority: { type: "string", required: true },
        source: { type: "string", required: true },
        notes: { type: "string" },
        last_contact: { type: "string", required: true }
      },
      required: ["client_name", "client_email", "company", "event_title", "event_date", "event_location", "event_type", "attendee_count", "budget_range", "deal_value", "status", "priority", "source", "last_contact"]
    }
  },
  {
    name: "get_projects",
    description: "Get a list of projects with optional filters",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        limit: { type: "number", description: "Maximum number of results" }
      }
    }
  },
  {
    name: "update_project_status",
    description: "Update the status of a project",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "number", description: "ID of the project to update", required: true },
        status: { type: "string", description: "New status", required: true }
      },
      required: ["project_id", "status"]
    }
  },
  {
    name: "delete_project",
    description: "Delete a project",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "number", description: "ID of the project to delete", required: true }
      },
      required: ["project_id"]
    }
  },
  {
    name: "get_speakers",
    description: "Search for speakers by expertise, topic, or location",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for speaker name, topic, or expertise" },
        limit: { type: "number", description: "Maximum number of results" }
      }
    }
  }
]

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }

    // Check for Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.'
      }, { status: 500 })
    }

    // Get SQL client
    const sql = getSqlClient()
    if (!sql) {
      return NextResponse.json({
        error: 'Database connection failed'
      }, { status: 500 })
    }

    // Parse request body
    const body = await request.json()
    const { message, conversation } = body

    if (!message) {
      return NextResponse.json({
        error: 'Message is required'
      }, { status: 400 })
    }

    // Build conversation history
    const conversationHistory = conversation?.slice(-10).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })) || []

    // Initial Claude API call with tools
    let response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        tools,
        system: `You are an AI assistant for Speak About AI, helping manage speakers, deals, and projects.

You can:
- Query and recommend speakers by expertise
- View, create, update, and delete deals
- View, update, and delete projects
- Change deal/project status
- Get summaries of pipeline and workload

When users ask to perform actions (create, update, delete, change status), use the available tools.
When answering questions, be helpful, specific, and use formatted lists.`,
        messages: [
          ...conversationHistory,
          {
            role: 'user',
            content: message
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Anthropic API error:', error)
      return NextResponse.json({
        error: `Failed to get AI response: ${error.error?.message || 'Unknown error'}`
      }, { status: 500 })
    }

    let data = await response.json()

    // Handle tool calls
    while (data.stop_reason === 'tool_use') {
      const toolUseBlock = data.content.find((block: any) => block.type === 'tool_use')

      if (!toolUseBlock) break

      const toolName = toolUseBlock.name
      const toolInput = toolUseBlock.input

      console.log(`Executing tool: ${toolName}`, toolInput)

      // Execute the tool
      const toolResult = await executeTool(sql, toolName, toolInput)

      // Continue conversation with tool result
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2048,
          tools,
          system: `You are an AI assistant for Speak About AI, helping manage speakers, deals, and projects.`,
          messages: [
            ...conversationHistory,
            {
              role: 'user',
              content: message
            },
            {
              role: 'assistant',
              content: data.content
            },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUseBlock.id,
                  content: JSON.stringify(toolResult)
                }
              ]
            }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Anthropic API error on tool result:', error)
        break
      }

      data = await response.json()
    }

    // Extract final text response
    const textBlocks = data.content.filter((block: any) => block.type === 'text')
    const aiResponse = textBlocks.map((block: any) => block.text).join('\n\n') || 'I apologize, but I encountered an error processing your request.'

    return NextResponse.json({
      response: aiResponse
    })

  } catch (error) {
    console.error('CRM Assistant error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

async function executeTool(sql: any, toolName: string, input: any) {
  try {
    switch (toolName) {
      case 'get_deals':
        return await getDeals(sql, input)

      case 'update_deal_status':
        return await updateDealStatus(sql, input)

      case 'delete_deal':
        return await deleteDeal(sql, input)

      case 'create_deal':
        return await createDeal(sql, input)

      case 'get_projects':
        return await getProjects(sql, input)

      case 'update_project_status':
        return await updateProjectStatus(sql, input)

      case 'delete_project':
        return await deleteProject(sql, input)

      case 'get_speakers':
        return await getSpeakers(sql, input)

      default:
        return { error: `Unknown tool: ${toolName}` }
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error)
    return { error: error instanceof Error ? error.message : 'Tool execution failed' }
  }
}

async function getDeals(sql: any, input: any) {
  const { status, limit = 20 } = input

  let query
  if (status) {
    query = await sql`
      SELECT * FROM deals
      WHERE status = ${status}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  } else {
    query = await sql`
      SELECT * FROM deals
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  }

  return { deals: query, count: query.length }
}

async function updateDealStatus(sql: any, input: any) {
  const { deal_id, status } = input

  const result = await sql`
    UPDATE deals
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${deal_id}
    RETURNING *
  `

  return result.length > 0
    ? { success: true, deal: result[0] }
    : { success: false, error: 'Deal not found' }
}

async function deleteDeal(sql: any, input: any) {
  const { deal_id } = input

  const result = await sql`
    DELETE FROM deals
    WHERE id = ${deal_id}
    RETURNING id
  `

  return result.length > 0
    ? { success: true, message: `Deal #${deal_id} deleted successfully` }
    : { success: false, error: 'Deal not found' }
}

async function createDeal(sql: any, input: any) {
  const result = await sql`
    INSERT INTO deals (
      client_name, client_email, company, event_title, event_date,
      event_location, event_type, attendee_count, budget_range,
      deal_value, status, priority, source, notes, last_contact
    )
    VALUES (
      ${input.client_name}, ${input.client_email}, ${input.company},
      ${input.event_title}, ${input.event_date}, ${input.event_location},
      ${input.event_type}, ${input.attendee_count}, ${input.budget_range},
      ${input.deal_value}, ${input.status}, ${input.priority},
      ${input.source}, ${input.notes || ''}, ${input.last_contact}
    )
    RETURNING *
  `

  return { success: true, deal: result[0] }
}

async function getProjects(sql: any, input: any) {
  const { status, limit = 20 } = input

  let query
  if (status) {
    query = await sql`
      SELECT * FROM projects
      WHERE status = ${status}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  } else {
    query = await sql`
      SELECT * FROM projects
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  }

  return { projects: query, count: query.length }
}

async function updateProjectStatus(sql: any, input: any) {
  const { project_id, status } = input

  const result = await sql`
    UPDATE projects
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${project_id}
    RETURNING *
  `

  return result.length > 0
    ? { success: true, project: result[0] }
    : { success: false, error: 'Project not found' }
}

async function deleteProject(sql: any, input: any) {
  const { project_id } = input

  const result = await sql`
    DELETE FROM projects
    WHERE id = ${project_id}
    RETURNING id
  `

  return result.length > 0
    ? { success: true, message: `Project #${project_id} deleted successfully` }
    : { success: false, error: 'Project not found' }
}

async function getSpeakers(sql: any, input: any) {
  const { query: searchQuery, limit = 15 } = input

  if (!searchQuery) {
    const speakers = await sql`
      SELECT id, name, title, location, topics, short_bio, speaking_fee_range
      FROM speakers
      WHERE active = true
      ORDER BY featured DESC, ranking DESC
      LIMIT ${limit}
    `
    return { speakers, count: speakers.length }
  }

  const searchTerm = `%${searchQuery}%`

  const speakers = await sql`
    SELECT id, name, title, location, topics, short_bio, speaking_fee_range
    FROM speakers
    WHERE active = true
      AND (
        LOWER(name) LIKE ${searchTerm}
        OR LOWER(title) LIKE ${searchTerm}
        OR LOWER(bio) LIKE ${searchTerm}
        OR LOWER(short_bio) LIKE ${searchTerm}
        OR LOWER(location) LIKE ${searchTerm}
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(topics) topic
          WHERE LOWER(topic) LIKE ${searchTerm}
        )
      )
    ORDER BY featured DESC, ranking DESC
    LIMIT ${limit}
  `

  return { speakers, count: speakers.length }
}

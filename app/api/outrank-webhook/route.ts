import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'contentful-management'
import { documentToHtmlString } from '@contentful/rich-text-html-renderer'
import { Document, BLOCKS, MARKS, INLINES } from '@contentful/rich-text-types'
import { neon } from '@neondatabase/serverless'

// Type definitions for the webhook payload
interface OutrankArticle {
  id: string
  title: string
  content_markdown: string
  content_html: string
  meta_description?: string
  created_at: string
  image_url?: string
  slug: string
  tags?: string[]
  author?: string
}

interface OutrankWebhookPayload {
  event_type: string
  timestamp: string
  data: {
    articles: OutrankArticle[]
  }
}

// Helper function to validate required fields
function validateArticle(article: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!article.title || typeof article.title !== 'string') {
    errors.push('Missing or invalid title')
  }
  if (!article.slug || typeof article.slug !== 'string') {
    errors.push('Missing or invalid slug')
  }
  if (!article.content_html && !article.content_markdown) {
    errors.push('Missing content (neither HTML nor Markdown provided)')
  }
  if (!article.created_at) {
    errors.push('Missing created_at timestamp')
  }
  
  return { valid: errors.length === 0, errors }
}

// Convert HTML to Contentful Rich Text format
function htmlToRichText(html: string): Document {
  // This is a simplified conversion - you may want to use a proper HTML to Rich Text converter
  // For now, we'll create a basic rich text document with the HTML as a paragraph
  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [
      {
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: [
          {
            nodeType: 'text',
            value: html.replace(/<[^>]*>/g, ''), // Strip HTML tags for now
            marks: [],
            data: {}
          }
        ]
      }
    ]
  }
}

// Helper function to parse inline markdown (bold, italic, links)
function parseInlineMarkdown(text: string): any[] {
  const nodes: any[] = []
  let remaining = text
  
  while (remaining.length > 0) {
    // Check for bold text (improved to handle nested content)
    const boldMatch = remaining.match(/\*\*((?:[^*]|\*(?!\*))+)\*\*/)
    // Check for italic (single asterisk, but not part of bold)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/)
    // Check for links
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    // Check for inline code
    const codeMatch = remaining.match(/`([^`]+)`/)
    
    // Find the earliest match
    let earliestMatch: any = null
    let earliestIndex = remaining.length
    
    if (boldMatch && boldMatch.index !== undefined && boldMatch.index < earliestIndex) {
      earliestMatch = { type: 'bold', match: boldMatch }
      earliestIndex = boldMatch.index
    }
    if (italicMatch && italicMatch.index !== undefined && italicMatch.index < earliestIndex) {
      earliestMatch = { type: 'italic', match: italicMatch }
      earliestIndex = italicMatch.index
    }
    if (linkMatch && linkMatch.index !== undefined && linkMatch.index < earliestIndex) {
      earliestMatch = { type: 'link', match: linkMatch }
      earliestIndex = linkMatch.index
    }
    if (codeMatch && codeMatch.index !== undefined && codeMatch.index < earliestIndex) {
      earliestMatch = { type: 'code', match: codeMatch }
      earliestIndex = codeMatch.index
    }
    
    if (earliestMatch) {
      // Add text before the match
      if (earliestIndex > 0) {
        nodes.push({
          nodeType: 'text',
          value: remaining.substring(0, earliestIndex),
          marks: [],
          data: {}
        })
      }
      
      // Add the matched element
      if (earliestMatch.type === 'bold') {
        nodes.push({
          nodeType: 'text',
          value: earliestMatch.match[1],
          marks: [{ type: MARKS.BOLD }],
          data: {}
        })
        remaining = remaining.substring(earliestIndex + earliestMatch.match[0].length)
      } else if (earliestMatch.type === 'italic') {
        nodes.push({
          nodeType: 'text',
          value: earliestMatch.match[1],
          marks: [{ type: MARKS.ITALIC }],
          data: {}
        })
        remaining = remaining.substring(earliestIndex + earliestMatch.match[0].length)
      } else if (earliestMatch.type === 'code') {
        nodes.push({
          nodeType: 'text',
          value: earliestMatch.match[1],
          marks: [{ type: MARKS.CODE }],
          data: {}
        })
        remaining = remaining.substring(earliestIndex + earliestMatch.match[0].length)
      } else if (earliestMatch.type === 'link') {
        nodes.push({
          nodeType: INLINES.HYPERLINK,
          data: { uri: earliestMatch.match[2] },
          content: [{
            nodeType: 'text',
            value: earliestMatch.match[1],
            marks: [],
            data: {}
          }]
        })
        remaining = remaining.substring(earliestIndex + earliestMatch.match[0].length)
      }
    } else {
      // No more matches, add the remaining text
      nodes.push({
        nodeType: 'text',
        value: remaining,
        marks: [],
        data: {}
      })
      break
    }
  }
  
  return nodes.length > 0 ? nodes : [{
    nodeType: 'text',
    value: text,
    marks: [],
    data: {}
  }]
}

// Convert markdown to Contentful Rich Text format
function markdownToRichText(markdown: string): Document {
  const lines = markdown.split('\n')
  const content: any[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeader = false
  let inList = false
  let listItems: string[] = []
  let inCodeBlock = false
  let codeLines: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Handle horizontal rules (*** or ---)
    if (line.trim() === '***' || line.trim() === '---' || line.trim() === '___') {
      content.push({
        nodeType: BLOCKS.HR,
        data: {},
        content: []
      })
      continue
    }
    
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        content.push({
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [{
            nodeType: 'text',
            value: codeLines.join('\n'),
            marks: [{ type: MARKS.CODE }],
            data: {}
          }]
        })
        codeLines = []
        inCodeBlock = false
      } else {
        // Start code block
        inCodeBlock = true
      }
      continue
    }
    
    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }
    
    // Handle tables - improved detection
    if (line.includes('|')) {
      // Check if it's a separator line
      if (line.trim().match(/^\|?[\s-:|]+\|?$/)) {
        // This is a table separator, indicates header row above
        if (inTable && tableRows.length > 0) {
          tableHeader = true
        }
        continue
      }
      
      // Parse table row
      const cells = line.split('|').map(cell => cell.trim())
      
      // Remove empty first/last elements if line starts/ends with |
      if (cells[0] === '') cells.shift()
      if (cells[cells.length - 1] === '') cells.pop()
      
      if (cells.length > 0) {
        if (!inTable) {
          inTable = true
          tableHeader = false
        }
        tableRows.push(cells)
      }
    } else if (inTable && tableRows.length > 0) {
      // End of table, convert to a formatted structure
      if (tableHeader && tableRows.length > 1) {
        // First row is header
        const headers = tableRows[0]
        const dataRows = tableRows.slice(1)
        
        // Add table header
        content.push({
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [{
            nodeType: 'text',
            value: headers.join(' | '),
            marks: [{ type: MARKS.BOLD }],
            data: {}
          }]
        })
        
        // Add data rows
        dataRows.forEach(row => {
          content.push({
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: parseInlineMarkdown(row.join(' | '))
          })
        })
      } else {
        // No header distinction, treat all as regular rows
        tableRows.forEach((row, index) => {
          content.push({
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: index === 0 
              ? [{
                  nodeType: 'text',
                  value: row.join(' | '),
                  marks: [{ type: MARKS.BOLD }],
                  data: {}
                }]
              : parseInlineMarkdown(row.join(' | '))
          })
        })
      }
      
      inTable = false
      tableRows = []
      tableHeader = false
    }
    
    // Handle list items
    if (line.match(/^[-*]\s+/)) {
      const listText = line.replace(/^[-*]\s+/, '')
      listItems.push(listText)
      inList = true
      continue
    } else if (inList && listItems.length > 0 && !line.match(/^[-*]\s+/)) {
      // End of list
      content.push({
        nodeType: BLOCKS.UL_LIST,
        data: {},
        content: listItems.map(item => ({
          nodeType: BLOCKS.LIST_ITEM,
          data: {},
          content: [{
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: parseInlineMarkdown(item)
          }]
        }))
      })
      inList = false
      listItems = []
    }
    
    // Handle numbered lists
    if (line.match(/^\d+\.\s+/)) {
      const listText = line.replace(/^\d+\.\s+/, '')
      listItems.push(listText)
      inList = true
      continue
    }
    
    // Handle headings
    if (line.startsWith('######')) {
      content.push({
        nodeType: BLOCKS.HEADING_6,
        data: {},
        content: parseInlineMarkdown(line.substring(6).trim())
      })
    } else if (line.startsWith('#####')) {
      content.push({
        nodeType: BLOCKS.HEADING_5,
        data: {},
        content: parseInlineMarkdown(line.substring(5).trim())
      })
    } else if (line.startsWith('####')) {
      content.push({
        nodeType: BLOCKS.HEADING_4,
        data: {},
        content: parseInlineMarkdown(line.substring(4).trim())
      })
    } else if (line.startsWith('###')) {
      content.push({
        nodeType: BLOCKS.HEADING_3,
        data: {},
        content: parseInlineMarkdown(line.substring(3).trim())
      })
    } else if (line.startsWith('##')) {
      content.push({
        nodeType: BLOCKS.HEADING_2,
        data: {},
        content: parseInlineMarkdown(line.substring(2).trim())
      })
    } else if (line.startsWith('#')) {
      content.push({
        nodeType: BLOCKS.HEADING_1,
        data: {},
        content: parseInlineMarkdown(line.substring(1).trim())
      })
    } else if (line.trim()) {
      // Regular paragraph with inline markdown parsing
      content.push({
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: parseInlineMarkdown(line)
      })
    }
  }
  
  // Handle any remaining list items
  if (inList && listItems.length > 0) {
    content.push({
      nodeType: BLOCKS.UL_LIST,
      data: {},
      content: listItems.map(item => ({
        nodeType: BLOCKS.LIST_ITEM,
        data: {},
        content: [{
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: parseInlineMarkdown(item)
        }]
      }))
    })
  }
  
  // Handle any remaining table rows
  if (inTable && tableRows.length > 0) {
    tableRows.forEach(row => {
      content.push({
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: [{
          nodeType: 'text',
          value: row.join(' | '),
          marks: [],
          data: {}
        }]
      })
    })
  }
  
  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: content.length > 0 ? content : [{
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [{
        nodeType: 'text',
        value: markdown,
        marks: [],
        data: {}
      }]
    }]
  }
}

export async function POST(request: NextRequest) {
  console.log('=== Outrank Webhook Received ===')
  const startTime = Date.now()
  let responseStatus = 200
  let responseBody: any = {}
  let errorMessage: string | null = null
  
  // Collect request data for logging
  const requestHeaders: any = {}
  request.headers.forEach((value, key) => {
    // Don't log sensitive auth tokens in full
    if (key.toLowerCase() === 'authorization') {
      requestHeaders[key] = value.substring(0, 20) + '...'
    } else {
      requestHeaders[key] = value
    }
  })
  
  const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  let requestBody: any = {}
  
  try {
    // Clone request to read body for logging
    const clonedRequest = request.clone()
    requestBody = await clonedRequest.json()
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.OUTRANK_WEBHOOK_SECRET
    
    if (!expectedSecret) {
      console.error('OUTRANK_WEBHOOK_SECRET not configured')
      responseStatus = 500
      errorMessage = 'Webhook secret not configured'
      responseBody = { error: errorMessage }
      throw new Error(errorMessage)
    }
    
    // Handle both "Bearer TOKEN" and "Bearer Bearer TOKEN" formats
    // (Outrank might be adding "Bearer" when we already include it)
    const validAuth1 = `Bearer ${expectedSecret}`
    const validAuth2 = `Bearer Bearer ${expectedSecret}` // Handle double Bearer prefix
    
    if (!authHeader || (authHeader !== validAuth1 && authHeader !== validAuth2)) {
      console.error('Invalid authorization header')
      console.error('Expected:', validAuth1, 'or', validAuth2)
      console.error('Received:', authHeader?.substring(0, 30) + '...')
      responseStatus = 401
      errorMessage = 'Unauthorized - Invalid token or format'
      responseBody = { error: errorMessage }
      throw new Error(errorMessage)
    }
    
    // Use the already parsed payload
    const payload: OutrankWebhookPayload = requestBody
    console.log(`Event Type: ${payload.event_type}`)
    console.log(`Timestamp: ${payload.timestamp}`)
    
    if (!payload.data?.articles || !Array.isArray(payload.data.articles)) {
      console.error('Invalid payload structure')
      responseStatus = 400
      errorMessage = 'Invalid payload structure'
      responseBody = { error: errorMessage }
      throw new Error(errorMessage)
    }
    
    // Initialize Contentful Management Client
    const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN
    if (!managementToken) {
      console.error('CONTENTFUL_MANAGEMENT_TOKEN not configured')
      responseStatus = 500
      errorMessage = 'Contentful management token not configured'
      responseBody = { error: errorMessage }
      throw new Error(errorMessage)
    }
    
    const client = createClient({
      accessToken: managementToken
    })
    
    const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID!)
    const environment = await space.getEnvironment('master')
    
    // Find Noah Cheyer's author entry
    let noahAuthorId: string | null = null
    try {
      const authorEntries = await environment.getEntries({
        content_type: 'author',
        'fields.name': 'Noah Cheyer',
        limit: 1
      })
      
      if (authorEntries.items.length > 0) {
        noahAuthorId = authorEntries.items[0].sys.id
        console.log(`Found Noah Cheyer author entry: ${noahAuthorId}`)
      } else {
        console.log('Noah Cheyer author entry not found, will create articles without author')
      }
    } catch (error) {
      console.error('Error finding Noah Cheyer author:', error)
    }
    
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as any[]
    }
    
    // Process each article
    for (const article of payload.data.articles) {
      console.log(`Processing article: ${article.title} (${article.slug})`)
      
      // Validate article
      const validation = validateArticle(article)
      if (!validation.valid) {
        console.error(`Validation failed for article ${article.id}:`, validation.errors)
        results.errors.push({ article_id: article.id, errors: validation.errors })
        results.failed++
        continue
      }
      
      try {
        // Check if blog post already exists by slug
        const existingEntries = await environment.getEntries({
          content_type: 'blogPost',
          'fields.slug': article.slug,
          limit: 1
        })
        
        // Convert content to Rich Text format
        const richTextContent = article.content_markdown 
          ? markdownToRichText(article.content_markdown)
          : htmlToRichText(article.content_html)
        
        // Prepare the entry data
        const entryData: any = {
          fields: {
            title: {
              'en-US': article.title
            },
            slug: {
              'en-US': article.slug
            },
            content: {
              'en-US': richTextContent
            },
            excerpt: {
              'en-US': article.meta_description || article.content_markdown?.substring(0, 160) || ''
            },
            publishedDate: {
              // Convert to ISO 8601 format without microseconds for Contentful
              'en-US': new Date(article.created_at).toISOString()
            }
            // Note: Add these fields to your Contentful blogPost content type if needed:
            // featured: { 'en-US': false }
            // outrank_id: { 'en-US': article.id }
          }
        }
        
        // Add Noah Cheyer as author if found
        if (noahAuthorId) {
          entryData.fields.author = {
            'en-US': {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: noahAuthorId
              }
            }
          }
        }
        
        // Add featured image if provided by Outrank
        if (article.image_url) {
          // First, we need to create an asset in Contentful for the image
          console.log(`Creating image asset for: ${article.image_url}`)
          try {
            const asset = await environment.createAsset({
              fields: {
                title: {
                  'en-US': article.title
                },
                description: {
                  'en-US': article.meta_description || article.title
                },
                file: {
                  'en-US': {
                    contentType: 'image/jpeg', // Default to JPEG, could parse from URL
                    fileName: article.slug + '.jpg',
                    upload: article.image_url
                  }
                }
              }
            })
            
            // Process the asset
            await asset.processForAllLocales()
            
            // Wait for processing to complete
            let processedAsset = await environment.getAsset(asset.sys.id)
            let attempts = 0
            while (processedAsset.fields.file['en-US'].url === undefined && attempts < 10) {
              await new Promise(resolve => setTimeout(resolve, 1000))
              processedAsset = await environment.getAsset(asset.sys.id)
              attempts++
            }
            
            // Publish the asset
            await processedAsset.publish()
            
            // Add reference to the asset in the blog post
            entryData.fields.featuredImage = {
              'en-US': {
                sys: {
                  type: 'Link',
                  linkType: 'Asset',
                  id: asset.sys.id
                }
              }
            }
            
            console.log(`Image asset created and linked: ${asset.sys.id}`)
          } catch (imageError) {
            console.error(`Failed to create image asset for ${article.image_url}:`, imageError)
            // Continue without image if it fails
          }
        }
        
        let entry
        
        if (existingEntries.items.length > 0) {
          // Update existing entry
          console.log(`Updating existing entry for slug: ${article.slug}`)
          entry = existingEntries.items[0]
          
          // Update fields
          Object.keys(entryData.fields).forEach(key => {
            entry.fields[key] = entryData.fields[key]
          })
          
          entry = await entry.update()
          results.updated++
        } else {
          // Create new entry
          console.log(`Creating new entry for slug: ${article.slug}`)
          entry = await environment.createEntry('blogPost', entryData)
          results.created++
        }
        
        // Publish the entry
        await entry.publish()
        console.log(`Successfully published: ${article.title}`)
        
        results.processed++
        
      } catch (error) {
        console.error(`Failed to process article ${article.id}:`, error)
        results.errors.push({
          article_id: article.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        results.failed++
      }
    }
    
    console.log('=== Webhook Processing Complete ===')
    console.log(`Processed: ${results.processed}`)
    console.log(`Created: ${results.created}`)
    console.log(`Updated: ${results.updated}`)
    console.log(`Failed: ${results.failed}`)
    
    responseBody = {
      success: true,
      message: `Processed ${results.processed} articles successfully`,
      details: results
    }
    
    return NextResponse.json(responseBody)
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    responseStatus = 500
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    responseBody = { 
      error: 'Failed to process webhook',
      details: errorMessage
    }
    
    return NextResponse.json(responseBody, { status: responseStatus })
  } finally {
    // Log the webhook call
    const processingTime = Date.now() - startTime
    
    try {
      const sql = neon(process.env.DATABASE_URL!)
      await sql`
        INSERT INTO webhook_logs (
          webhook_type,
          request_method,
          request_headers,
          request_body,
          response_status,
          response_body,
          error_message,
          ip_address,
          user_agent,
          processing_time_ms
        ) VALUES (
          'outrank',
          'POST',
          ${JSON.stringify(requestHeaders)},
          ${JSON.stringify(requestBody)},
          ${responseStatus},
          ${JSON.stringify(responseBody)},
          ${errorMessage},
          ${ipAddress},
          ${userAgent},
          ${processingTime}
        )
      `
    } catch (logError) {
      console.error('Failed to log webhook call:', logError)
    }
  }
}
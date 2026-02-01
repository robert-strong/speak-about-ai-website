import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { createClient } from 'contentful-management'
import { BLOCKS, MARKS, INLINES, Document } from '@contentful/rich-text-types'

// Helper function to parse inline markdown (bold, italic, links)
function parseInlineMarkdown(text: string): any[] {
  const nodes: any[] = []
  let remaining = text

  while (remaining.length > 0) {
    // Check for bold text
    const boldMatch = remaining.match(/\*\*((?:[^*]|\*(?!\*))+)\*\*/)
    // Check for italic
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
  let inList = false
  let listItems: string[] = []
  let listType: 'ul' | 'ol' = 'ul'
  let inCodeBlock = false
  let codeLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Handle horizontal rules
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
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    // Handle unordered list items
    if (line.match(/^[-*]\s+/)) {
      const listText = line.replace(/^[-*]\s+/, '')
      listItems.push(listText)
      inList = true
      listType = 'ul'
      continue
    }

    // Handle ordered list items
    if (line.match(/^\d+\.\s+/)) {
      const listText = line.replace(/^\d+\.\s+/, '')
      listItems.push(listText)
      inList = true
      listType = 'ol'
      continue
    }

    // End list if we have items and hit a non-list line
    if (inList && listItems.length > 0) {
      content.push({
        nodeType: listType === 'ul' ? BLOCKS.UL_LIST : BLOCKS.OL_LIST,
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
    } else if (line.startsWith('>')) {
      // Blockquote
      content.push({
        nodeType: BLOCKS.QUOTE,
        data: {},
        content: [{
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: parseInlineMarkdown(line.substring(1).trim())
        }]
      })
    } else if (line.trim() !== '') {
      // Regular paragraph
      content.push({
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: parseInlineMarkdown(line)
      })
    }
  }

  // Flush remaining list
  if (inList && listItems.length > 0) {
    content.push({
      nodeType: listType === 'ul' ? BLOCKS.UL_LIST : BLOCKS.OL_LIST,
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

  // Ensure we have at least one content block
  if (content.length === 0) {
    content.push({
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [{
        nodeType: 'text',
        value: '',
        marks: [],
        data: {}
      }]
    })
  }

  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content
  }
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }

    // Check for Contentful Management Token
    if (!process.env.CONTENTFUL_MANAGEMENT_TOKEN || !process.env.CONTENTFUL_SPACE_ID) {
      return NextResponse.json({
        error: 'Contentful credentials not configured'
      }, { status: 500 })
    }

    // Parse request body
    const body = await request.json()
    const { content, imageUrl } = body

    if (!content) {
      return NextResponse.json({
        error: 'Content is required'
      }, { status: 400 })
    }

    // Extract title from markdown content (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : 'Untitled Article'
    const slug = generateSlug(title)

    // Remove title from content body for the main content
    const contentBody = content.replace(/^#\s+.+$/m, '').trim()

    // Extract excerpt (first paragraph or first 160 chars)
    const excerptMatch = contentBody.match(/^[^#\n].+$/m)
    const excerpt = excerptMatch ? excerptMatch[0].substring(0, 160) : contentBody.substring(0, 160)

    // Convert markdown to Rich Text
    const richTextContent = markdownToRichText(contentBody)

    // Initialize Contentful Management client
    const client = createClient({
      accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN
    })

    // Get space and environment
    const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID)
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
      }
    } catch (error) {
      console.error('Error finding Noah Cheyer author:', error)
    }

    // Prepare entry data
    const entryData: any = {
      fields: {
        title: {
          'en-US': title
        },
        slug: {
          'en-US': slug
        },
        content: {
          'en-US': richTextContent
        },
        excerpt: {
          'en-US': excerpt
        },
        publishedDate: {
          'en-US': new Date().toISOString()
        }
      }
    }

    // Add author if found
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

    // Add featured image if provided
    if (imageUrl) {
      console.log(`Creating image asset for: ${imageUrl}`)
      try {
        // Determine content type from URL
        const extension = imageUrl.split('.').pop()?.toLowerCase().split('?')[0] || 'jpg'
        const contentTypeMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp'
        }
        const contentType = contentTypeMap[extension] || 'image/jpeg'

        const asset = await environment.createAsset({
          fields: {
            title: {
              'en-US': title
            },
            description: {
              'en-US': excerpt
            },
            file: {
              'en-US': {
                contentType,
                fileName: slug + '.' + extension,
                upload: imageUrl
              }
            }
          }
        })

        // Process the asset
        await asset.processForAllLocales()

        // Wait for processing to complete
        let processedAsset = await environment.getAsset(asset.sys.id)
        let attempts = 0
        while (processedAsset.fields.file?.['en-US']?.url === undefined && attempts < 10) {
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
        console.error(`Failed to create image asset for ${imageUrl}:`, imageError)
        // Continue without image if it fails
      }
    }

    // Create a new blog post entry as draft
    const entry = await environment.createEntry('blogPost', entryData)

    // Return success with entry details
    return NextResponse.json({
      success: true,
      entryId: entry.sys.id,
      url: `https://app.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/entries/${entry.sys.id}`,
      message: 'Article created as draft in Contentful'
    })

  } catch (error) {
    console.error('Push to Contentful error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to push to Contentful'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'
import * as cheerio from 'cheerio'

const getSqlClient = () => {
  if (!process.env.DATABASE_URL) {
    console.log('Content preview: No DATABASE_URL found')
    return null
  }
  try {
    return neon(process.env.DATABASE_URL)
  } catch (error) {
    console.error('Failed to initialize Neon client:', error)
    return null
  }
}

// Location keywords mapping to database patterns
const LOCATION_KEYWORDS: Record<string, string[]> = {
  'new york': ['new york', 'nyc', 'manhattan', 'brooklyn'],
  'san francisco': ['san francisco', 'sf', 'bay area', 'silicon valley'],
  'los angeles': ['los angeles', 'la', 'hollywood'],
  'chicago': ['chicago'],
  'boston': ['boston', 'massachusetts'],
  'seattle': ['seattle', 'washington'],
  'austin': ['austin', 'texas'],
  'miami': ['miami', 'florida'],
  'atlanta': ['atlanta', 'georgia'],
  'denver': ['denver', 'colorado'],
  'london': ['london', 'uk', 'united kingdom'],
  'toronto': ['toronto', 'canada'],
  'berlin': ['berlin', 'germany'],
  'paris': ['paris', 'france'],
  'dublin': ['dublin', 'ireland'],
  'detroit': ['detroit', 'michigan'],
  'philadelphia': ['philadelphia', 'philly'],
  'washington dc': ['washington', 'dc', 'washington dc'],
  'puerto rico': ['puerto rico'],
  'europe': ['europe', 'european'],
}

// Extract location from content
function extractLocation(content: string): string | null {
  const contentLower = content.toLowerCase()
  for (const [location, keywords] of Object.entries(LOCATION_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(contentLower)) {
        return location
      }
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }

    const body = await request.json()
    const { semrush_url, location_filter, search_query } = body

    // If this is a search request (no semrush_url)
    if (!semrush_url && (location_filter || search_query)) {
      const sql = getSqlClient()
      if (!sql) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
      }

      // Search speakers
      let speakers
      if (location_filter && search_query) {
        const locationSearch = `%${location_filter}%`
        const querySearch = `%${search_query}%`
        speakers = await sql`
          SELECT id, name, bio, short_bio, one_liner, title, topics, industries, website, slug, location
          FROM speakers
          WHERE listed = true
            AND LOWER(location) LIKE ${locationSearch}
            AND (
              LOWER(name) LIKE ${querySearch}
              OR LOWER(title) LIKE ${querySearch}
              OR LOWER(bio) LIKE ${querySearch}
              OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(topics) t WHERE LOWER(t) LIKE ${querySearch})
            )
          ORDER BY featured DESC, ranking DESC
          LIMIT 30
        `
      } else if (location_filter) {
        const locationSearch = `%${location_filter}%`
        speakers = await sql`
          SELECT id, name, bio, short_bio, one_liner, title, topics, industries, website, slug, location
          FROM speakers
          WHERE listed = true AND LOWER(location) LIKE ${locationSearch}
          ORDER BY featured DESC, ranking DESC
          LIMIT 30
        `
      } else if (search_query) {
        const querySearch = `%${search_query}%`
        speakers = await sql`
          SELECT id, name, bio, short_bio, one_liner, title, topics, industries, website, slug, location
          FROM speakers
          WHERE listed = true
            AND (
              LOWER(name) LIKE ${querySearch}
              OR LOWER(title) LIKE ${querySearch}
              OR LOWER(bio) LIKE ${querySearch}
              OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(topics) t WHERE LOWER(t) LIKE ${querySearch})
            )
          ORDER BY featured DESC, ranking DESC
          LIMIT 30
        `
      } else {
        speakers = []
      }

      const formattedSpeakers = speakers.map((s: any) => ({
        id: s.id,
        name: s.name,
        title: s.title || '',
        bio: s.short_bio || s.one_liner || (s.bio ? s.bio.substring(0, 200) : ''),
        topics: Array.isArray(s.topics) ? s.topics.join(', ') : '',
        location: s.location || '',
        website: `https://speakabout.ai/speakers/${s.slug}`,
        slug: s.slug
      }))

      // Search blog posts from Contentful
      let blogPosts: any[] = []
      if (search_query) {
        try {
          const contentful = require('contentful')
          if (process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_ACCESS_TOKEN) {
            const client = contentful.createClient({
              space: process.env.CONTENTFUL_SPACE_ID,
              accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
            })

            const entries = await client.getEntries({
              content_type: 'blogPost',
              limit: 30,
              order: '-sys.createdAt',
              query: search_query
            })

            blogPosts = entries.items.map((item: any) => ({
              title: item.fields.title,
              slug: item.fields.slug,
              url: `https://speakabout.ai/blog/${item.fields.slug}`
            }))
          }
        } catch (error) {
          console.log('Could not search Contentful posts:', error)
        }
      }

      return NextResponse.json({
        speakers: formattedSpeakers,
        blogPosts,
        searchMode: true
      })
    }

    if (!semrush_url) {
      return NextResponse.json({ error: 'Semrush URL is required' }, { status: 400 })
    }

    // Fetch article from Semrush URL
    let title = ''
    let content = ''
    let images: string[] = []

    try {
      const response = await fetch(semrush_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract title
      title = $('h1').first().text().trim() || $('title').text().trim() || 'Untitled Article'

      // Extract main content
      const contentHtml = $('article').html() || $('main').html() || $('body').html() || ''
      content = $('<div>').html(contentHtml).text().trim()

      // Extract images
      $('img').each((_, elem) => {
        const src = $(elem).attr('src')
        if (src && src.startsWith('http')) {
          images.push(src)
        }
      })
    } catch (error) {
      console.error('Error fetching Semrush article:', error)
      return NextResponse.json({
        error: 'Failed to fetch article from Semrush URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    // Extract location from content
    const detectedLocation = extractLocation(content)
    console.log('Detected location:', detectedLocation)

    // Get SQL client
    const sql = getSqlClient()
    let allSpeakers: any[] = []

    if (sql) {
      try {
        // Fetch all listed speakers for AI analysis
        allSpeakers = await sql`
          SELECT
            id, name, bio, short_bio, one_liner, title, topics, industries, website, slug, location
          FROM speakers
          WHERE listed = true
          ORDER BY featured DESC, ranking DESC
          LIMIT 50
        `
        console.log(`Fetched ${allSpeakers.length} speakers for AI analysis`)
      } catch (sqlError) {
        console.error('SQL query error:', sqlError)
      }
    }

    // Use AI to select the most relevant speakers
    let selectedSpeakers: any[] = []

    if (process.env.ANTHROPIC_API_KEY && allSpeakers.length > 0) {
      try {
        // Build speaker context for AI
        const speakerContext = allSpeakers.map((s, i) =>
          `${i + 1}. ${s.name} (ID: ${s.id})
   Title: ${s.title || 'N/A'}
   Location: ${s.location || 'N/A'}
   Bio: ${s.short_bio || s.one_liner || (s.bio ? s.bio.substring(0, 150) : 'N/A')}
   Topics: ${Array.isArray(s.topics) ? s.topics.join(', ') : 'N/A'}`
        ).join('\n\n')

        const aiPrompt = `You are analyzing an article to select the most relevant AI speakers to feature.

ARTICLE TITLE: ${title}

ARTICLE CONTENT (first 2000 chars):
${content.substring(0, 2000)}

${detectedLocation ? `DETECTED LOCATION: ${detectedLocation} - PRIORITIZE speakers from this location!` : ''}

AVAILABLE SPEAKERS:
${speakerContext}

YOUR TASK:
1. Analyze the article topic, themes, and any location mentioned
2. Select 5-8 speakers whose expertise BEST matches the article content
3. ${detectedLocation ? `IMPORTANT: Speakers from ${detectedLocation} should be included first if their expertise is relevant` : 'Select based on topic relevance'}
4. Consider: topic match, expertise depth, location (if article is location-specific)

Return ONLY a JSON array of speaker IDs in order of relevance, like: [164, 45, 23, 78, 12]

IMPORTANT: Only return the JSON array, nothing else.`

        const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 200,
            messages: [{ role: 'user', content: aiPrompt }]
          })
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const aiText = aiData.content[0]?.text || ''
          console.log('AI response:', aiText)

          // Parse the JSON array of IDs
          const idMatch = aiText.match(/\[[\d,\s]+\]/)
          if (idMatch) {
            const selectedIds: number[] = JSON.parse(idMatch[0])
            console.log('AI selected speaker IDs:', selectedIds)

            // Get the selected speakers in the AI-suggested order
            selectedSpeakers = selectedIds
              .map(id => allSpeakers.find(s => s.id === id))
              .filter(Boolean)
              .slice(0, 8)
          }
        } else {
          console.error('AI API error:', await aiResponse.text())
        }
      } catch (aiError) {
        console.error('AI selection error:', aiError)
      }
    }

    // Fallback to keyword matching if AI selection failed
    if (selectedSpeakers.length === 0) {
      console.log('Falling back to keyword matching')
      // Simple fallback - just return top ranked speakers
      selectedSpeakers = allSpeakers.slice(0, 8)
    }

    // Format speakers for response
    const formattedSpeakers = selectedSpeakers.map(s => ({
      id: s.id,
      name: s.name,
      title: s.title || '',
      bio: s.short_bio || s.one_liner || (s.bio ? s.bio.substring(0, 200) : ''),
      topics: Array.isArray(s.topics) ? s.topics.join(', ') : '',
      location: s.location || '',
      locationMatch: detectedLocation ? s.location?.toLowerCase().includes(detectedLocation) : false,
      website: `https://speakabout.ai/speakers/${s.slug}`,
      slug: s.slug
    }))

    // Fetch existing blog posts from Contentful
    let blogPosts: any[] = []
    try {
      const contentful = require('contentful')
      if (process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_ACCESS_TOKEN) {
        const client = contentful.createClient({
          space: process.env.CONTENTFUL_SPACE_ID,
          accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
        })

        const entries = await client.getEntries({
          content_type: 'blogPost',
          limit: 15,
          order: '-sys.createdAt'
        })

        blogPosts = entries.items.map((item: any) => ({
          title: item.fields.title,
          slug: item.fields.slug,
          url: `https://speakabout.ai/blog/${item.fields.slug}`
        }))
      }
    } catch (error) {
      console.log('Could not fetch Contentful posts:', error)
    }

    return NextResponse.json({
      title,
      content: content.substring(0, 2000),
      speakers: formattedSpeakers,
      blogPosts,
      images,
      detectedLocation,
      aiPowered: selectedSpeakers.length > 0 && process.env.ANTHROPIC_API_KEY ? true : false
    })

  } catch (error) {
    console.error('Content preview error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { matchContentToSpeakers, quickMatch, extractKeywords } from '@/lib/keyword-matcher'

/**
 * POST /api/admin/tools/keyword-match
 *
 * Match article content to relevant speakers and workshops
 *
 * Body:
 * - content: string (required) - The article content to analyze
 * - mode: 'full' | 'quick' (optional, default: 'quick') - Analysis mode
 * - maxSpeakers: number (optional) - Max speakers to return
 * - maxWorkshops: number (optional) - Max workshops to return
 * - minScore: number (optional) - Minimum relevance score threshold
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, mode = 'quick', maxSpeakers, maxWorkshops, minScore } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: 'Content must be at least 50 characters for meaningful analysis' },
        { status: 400 }
      )
    }

    // Extract keywords first for debugging/visibility
    const extractedKeywords = extractKeywords(content)

    if (mode === 'quick') {
      const result = await quickMatch(content)
      return NextResponse.json({
        success: true,
        mode: 'quick',
        extractedKeywords: extractedKeywords.slice(0, 20), // Top 20 for visibility
        ...result
      })
    }

    // Full mode
    const result = await matchContentToSpeakers(content, {
      maxSpeakers: maxSpeakers || 10,
      maxWorkshops: maxWorkshops || 5,
      minScore: minScore || 2
    })

    // Transform for API response (don't expose full speaker objects)
    const response = {
      success: true,
      mode: 'full',
      extractedKeywords,
      speakers: result.speakers.map(m => ({
        name: m.speaker.name,
        slug: m.speaker.slug,
        title: m.speaker.title,
        image: m.speaker.image,
        score: Math.round(m.score * 10) / 10,
        hasWorkshops: m.hasWorkshops,
        workshopCount: m.workshopCount,
        matchedKeywords: m.matchedKeywords
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 5)
          .map(k => ({
            keyword: k.keyword,
            matchedIn: k.matchedIn,
            score: Math.round(k.relevanceScore * 10) / 10
          })),
        speakerUrl: `/speakers/${m.speaker.slug}`
      })),
      workshops: result.workshops.map(m => ({
        title: m.workshop.title,
        slug: m.workshop.slug,
        speakerName: m.speakerName,
        shortDescription: m.workshop.short_description,
        score: Math.round(m.score * 10) / 10,
        matchedKeywords: m.matchedKeywords
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 5)
          .map(k => ({
            keyword: k.keyword,
            matchedIn: k.matchedIn,
            score: Math.round(k.relevanceScore * 10) / 10
          })),
        workshopUrl: `/ai-workshops/${m.workshop.slug}`
      })),
      suggestions: result.suggestedMentions
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Keyword match error:', error)
    return NextResponse.json(
      { error: 'Failed to process keyword matching', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/tools/keyword-match
 *
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/tools/keyword-match',
    method: 'POST',
    description: 'Match article content to relevant speakers and workshops for SEO optimization',
    body: {
      content: {
        type: 'string',
        required: true,
        description: 'The article/blog post content to analyze'
      },
      mode: {
        type: 'string',
        enum: ['quick', 'full'],
        default: 'quick',
        description: 'Quick mode returns simplified results, full mode returns detailed analysis'
      },
      maxSpeakers: {
        type: 'number',
        default: 10,
        description: 'Maximum number of speakers to return (full mode only)'
      },
      maxWorkshops: {
        type: 'number',
        default: 5,
        description: 'Maximum number of workshops to return (full mode only)'
      },
      minScore: {
        type: 'number',
        default: 2,
        description: 'Minimum relevance score threshold (full mode only)'
      }
    },
    response: {
      success: 'boolean',
      mode: 'string',
      extractedKeywords: 'string[] - Keywords extracted from content',
      topSpeakers: 'Array of matched speakers with relevance scores',
      topWorkshops: 'Array of matched workshops with relevance scores',
      suggestions: 'string[] - Formatted suggestions for blog content'
    },
    example: {
      request: {
        content: 'This article discusses ChatGPT and AI automation workflows for enterprise productivity...',
        mode: 'quick'
      }
    }
  })
}

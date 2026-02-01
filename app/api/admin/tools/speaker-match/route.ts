import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'

const getSqlClient = () => {
  if (!process.env.DATABASE_URL) {
    return null
  }
  try {
    return neon(process.env.DATABASE_URL)
  } catch (error) {
    console.error('Failed to initialize Neon client:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }

    const sql = getSqlClient()
    if (!sql) {
      return NextResponse.json({
        error: 'Database connection failed'
      }, { status: 500 })
    }

    const { dealId, criteria } = await request.json()

    if (!dealId && !criteria) {
      return NextResponse.json({
        error: 'Either dealId or criteria is required'
      }, { status: 400 })
    }

    // Fetch deal details if dealId provided
    let dealCriteria = criteria
    if (dealId) {
      const deals = await sql`
        SELECT * FROM deals WHERE id = ${dealId}
      `
      if (deals.length === 0) {
        return NextResponse.json({
          error: 'Deal not found'
        }, { status: 404 })
      }
      const deal = deals[0]
      dealCriteria = {
        event_type: deal.event_type,
        event_location: deal.event_location,
        budget: deal.deal_value,
        attendee_count: deal.attendee_count,
        topics: deal.speaker_requested ? [deal.speaker_requested] : [],
        ...criteria
      }
    }

    // Fetch all active speakers
    const speakers = await sql`
      SELECT
        id, name, email, slug, title, bio, short_bio, one_liner,
        location, topics, industries, speaking_fee_range,
        headshot_url, featured, active, ranking,
        website, linkedin, twitter
      FROM speakers
      WHERE active = true
      ORDER BY ranking DESC
      LIMIT 50
    `

    // Score each speaker using AI
    const scoredSpeakers = await Promise.all(
      speakers.map(async (speaker) => {
        const score = await calculateMatchScore(speaker, dealCriteria)
        return {
          ...speaker,
          match_score: score.score,
          match_reasons: score.reasons
        }
      })
    )

    // Sort by match score
    scoredSpeakers.sort((a, b) => b.match_score - a.match_score)

    // Return top 10
    return NextResponse.json({
      speakers: scoredSpeakers.slice(0, 10),
      total: scoredSpeakers.length
    })

  } catch (error) {
    console.error('Error in speaker matching:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

async function calculateMatchScore(
  speaker: any,
  criteria: {
    event_type?: string
    event_location?: string
    budget?: number
    attendee_count?: number
    topics?: string[]
    main_theme?: string
    session_format?: string
  }
): Promise<{ score: number; reasons: string[] }> {
  let score = 0
  const reasons: string[] = []
  const maxScore = 100

  // Topic/expertise match (40 points)
  if (criteria.topics && criteria.topics.length > 0 && speaker.topics) {
    const speakerTopics = Array.isArray(speaker.topics)
      ? speaker.topics
      : (typeof speaker.topics === 'string' ? JSON.parse(speaker.topics) : [])

    const matchingTopics = criteria.topics.filter(topic =>
      speakerTopics.some((st: string) =>
        st.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(st.toLowerCase())
      )
    )

    if (matchingTopics.length > 0) {
      const topicScore = Math.min(40, matchingTopics.length * 20)
      score += topicScore
      reasons.push(`Expert in ${matchingTopics.join(", ")}`)
    }
  }

  // Budget fit (25 points)
  if (criteria.budget && speaker.speaking_fee_range) {
    const feeRange = speaker.speaking_fee_range
    const feeMatch = feeRange.match(/\$?([\d,]+)/)
    if (feeMatch) {
      const minFee = parseInt(feeMatch[1].replace(/,/g, ''))
      if (minFee <= criteria.budget) {
        const budgetScore = Math.min(25, 25 - ((minFee / criteria.budget) * 10))
        score += budgetScore
        reasons.push(`Fee within budget (${feeRange})`)
      } else {
        score += 5 // Still give some points for transparency
      }
    }
  }

  // Location match (15 points)
  if (criteria.event_location && speaker.location) {
    const eventLocation = criteria.event_location.toLowerCase()
    const speakerLocation = speaker.location.toLowerCase()

    // Check if same city or nearby
    if (speakerLocation.includes(eventLocation) || eventLocation.includes(speakerLocation)) {
      score += 15
      reasons.push(`Based in ${speaker.location} (no travel costs)`)
    } else if (
      (eventLocation.includes('san francisco') && speakerLocation.includes('california')) ||
      (eventLocation.includes('new york') && speakerLocation.includes('ny'))
    ) {
      score += 10
      reasons.push(`Close proximity to event location`)
    }
  }

  // Ranking/credibility (10 points)
  if (speaker.ranking) {
    const rankingScore = Math.min(10, speaker.ranking / 10)
    score += rankingScore
  }

  // Featured speaker bonus (5 points)
  if (speaker.featured) {
    score += 5
    reasons.push(`Featured speaker with proven track record`)
  }

  // Audience size match (5 points)
  if (criteria.attendee_count) {
    // Speakers with experience at similar-sized events score higher
    // This is a simplified version - could be enhanced with actual event history
    score += 5
  }

  // Normalize score to 0-100
  score = Math.min(maxScore, Math.max(0, score))

  // If score is high but no reasons, add a generic one
  if (score > 60 && reasons.length === 0) {
    reasons.push(`Highly ranked speaker in our database`)
  }

  return { score: Math.round(score), reasons }
}

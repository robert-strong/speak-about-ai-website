import { NextResponse } from 'next/server'
import {
  getDomainOverview,
  getOrganicKeywords,
  getOrganicCompetitors,
  getKeywordSuggestions,
} from '@/lib/semrush'

export async function GET() {
  try {
    const domain = 'speakabout.ai'

    console.log('Fetching Semrush data for', domain)

    // Fetch all data in parallel
    const [overview, keywords, competitors] = await Promise.all([
      getDomainOverview(domain),
      getOrganicKeywords(domain, 'us', 1000, 0), // Get top 1000 keywords
      getOrganicCompetitors(domain, 'us', 20),
    ])

    console.log('Overview:', overview)
    console.log('Keywords count:', keywords.length)
    console.log('Competitors count:', competitors.length)

    // Analyze keywords for opportunities
    const analysis = analyzeKeywords(keywords)

    return NextResponse.json({
      overview,
      keywords: keywords.slice(0, 100), // Return top 100 for display
      competitors,
      analysis,
      totalKeywords: keywords.length,
    })
  } catch (error) {
    console.error('Semrush API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Semrush data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function analyzeKeywords(keywords: any[]) {
  // Low hanging fruit: Keywords ranking 4-20 (page 1-2)
  const lowHangingFruit = keywords
    .filter((kw) => {
      const position = parseInt(kw.Position || kw.Po || 0)
      return position >= 4 && position <= 20
    })
    .sort((a, b) => parseInt(b['Search Volume'] || b.Nq || 0) - parseInt(a['Search Volume'] || a.Nq || 0)) // Sort by search volume
    .slice(0, 50)

  // High value keywords: High volume, low position
  const highValueOpportunities = keywords
    .filter((kw) => {
      const position = parseInt(kw.Position || kw.Po || 0)
      const volume = parseInt(kw['Search Volume'] || kw.Nq || 0)
      return position >= 11 && position <= 30 && volume >= 100
    })
    .sort((a, b) => parseInt(b['Search Volume'] || b.Nq || 0) - parseInt(a['Search Volume'] || a.Nq || 0))
    .slice(0, 30)

  // Top performing keywords
  const topKeywords = keywords
    .filter((kw) => parseInt(kw.Position || kw.Po || 0) <= 3)
    .sort((a, b) => parseInt(b['Search Volume'] || b.Nq || 0) - parseInt(a['Search Volume'] || a.Nq || 0))
    .slice(0, 20)

  // Keywords by position range
  const positionRanges = {
    top3: keywords.filter((kw) => parseInt(kw.Position || kw.Po || 0) <= 3).length,
    top10: keywords.filter((kw) => parseInt(kw.Position || kw.Po || 0) <= 10).length,
    top20: keywords.filter((kw) => parseInt(kw.Position || kw.Po || 0) <= 20).length,
    top50: keywords.filter((kw) => parseInt(kw.Position || kw.Po || 0) <= 50).length,
    top100: keywords.filter((kw) => parseInt(kw.Position || kw.Po || 0) <= 100).length,
  }

  // Keyword topics (extract common themes)
  const topics = extractTopics(keywords)

  return {
    lowHangingFruit,
    highValueOpportunities,
    topKeywords,
    positionRanges,
    topics,
    totalVolume: keywords.reduce((sum, kw) => sum + parseInt(kw['Search Volume'] || kw.Nq || 0), 0),
  }
}

function extractTopics(keywords: any[]) {
  const topicMap: Record<string, { count: number; volume: number; keywords: string[] }> = {}

  // Common speaker-related terms
  const topics = [
    'ai speaker',
    'keynote speaker',
    'motivational speaker',
    'technology speaker',
    'business speaker',
    'conference speaker',
    'virtual speaker',
    'speaker bureau',
    'book speaker',
    'hire speaker',
  ]

  keywords.forEach((kw) => {
    const phraseField = kw.Keyword || kw.Ph
    if (!phraseField || typeof phraseField !== 'string') return

    const phrase = phraseField.toLowerCase()
    const volume = parseInt(kw['Search Volume'] || kw.Nq || 0)

    topics.forEach((topic) => {
      if (phrase.includes(topic)) {
        if (!topicMap[topic]) {
          topicMap[topic] = { count: 0, volume: 0, keywords: [] }
        }
        topicMap[topic].count++
        topicMap[topic].volume += volume
        if (topicMap[topic].keywords.length < 10) {
          topicMap[topic].keywords.push(phrase)
        }
      }
    })
  })

  return Object.entries(topicMap)
    .map(([topic, data]) => ({ topic, ...data }))
    .sort((a, b) => b.volume - a.volume)
}

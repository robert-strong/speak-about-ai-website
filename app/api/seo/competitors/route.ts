import { NextResponse } from 'next/server'
import {
  getOrganicCompetitors,
  getDomainOverview,
  getKeywordGap,
  getOrganicKeywords,
} from '@/lib/semrush'

export async function GET() {
  try {
    const domain = 'speakabout.ai'

    console.log('Fetching competitor data for', domain)

    // Get top competitors
    const competitors = await getOrganicCompetitors(domain, 'us', 10)

    console.log('Found competitors:', competitors.length)

    // Analyze top 3 competitors in detail
    const topCompetitors = competitors.slice(0, 3)

    const competitorAnalysis = await Promise.all(
      topCompetitors.map(async (comp) => {
        const competitorDomain = comp.Dn || comp.Domain

        try {
          console.log(`Analyzing competitor: ${competitorDomain}`)

          const [overview, keywords, keywordGap] = await Promise.all([
            getDomainOverview(competitorDomain).catch(e => {
              console.error(`Failed to get overview for ${competitorDomain}:`, e.message)
              return null
            }),
            getOrganicKeywords(competitorDomain, 'us', 50, 0).catch(e => {
              console.error(`Failed to get keywords for ${competitorDomain}:`, e.message)
              return []
            }),
            getKeywordGap(domain, competitorDomain, 'us', 50).catch(e => {
              console.error(`Failed to get keyword gap for ${competitorDomain}:`, e.message)
              return []
            }),
          ])

          console.log(`${competitorDomain} - Overview:`, overview ? 'Found' : 'null', 'Keywords:', keywords.length)

          // Analyze their top keywords
          const topKeywords = keywords
            .filter(kw => parseInt(kw.Po || kw.Position) <= 10)
            .sort((a, b) => parseInt(b.Nq || b['Search Volume'] || 0) - parseInt(a.Nq || a['Search Volume'] || 0))
            .slice(0, 10)

          // Find their best performing keywords (top 3 with high volume)
          const bestKeywords = keywords
            .filter(kw => {
              const pos = parseInt(kw.Po || kw.Position)
              const vol = parseInt(kw.Nq || kw['Search Volume'] || 0)
              return pos <= 3 && vol >= 50
            })
            .sort((a, b) => parseInt(b.Nq || b['Search Volume'] || 0) - parseInt(a.Nq || a['Search Volume'] || 0))
            .slice(0, 10)

          return {
            domain: competitorDomain,
            competitiveness: comp.Cr || comp['Competitor Relevance'],
            commonKeywords: comp.Np || comp['Common Keywords'],
            overview,
            topKeywords,
            bestKeywords,
            keywordGap: keywordGap.slice(0, 20), // Top 20 opportunities
            totalKeywords: keywords.length,
          }
        } catch (error) {
          console.error(`Error analyzing competitor ${competitorDomain}:`, error)
          return {
            domain: competitorDomain,
            competitiveness: comp.Cr || comp['Competitor Relevance'],
            commonKeywords: comp.Np || comp['Common Keywords'],
            error: 'Failed to analyze competitor',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    // Generate tactical recommendations
    const recommendations = generateRecommendations(competitorAnalysis)

    return NextResponse.json({
      competitors,
      detailedAnalysis: competitorAnalysis,
      recommendations,
    })
  } catch (error) {
    console.error('Competitor analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch competitor data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function generateRecommendations(competitors: any[]) {
  const recommendations: any[] = []

  competitors.forEach((comp) => {
    if (comp.error) return

    // Recommendation 1: Keyword gaps
    if (comp.keywordGap && comp.keywordGap.length > 0) {
      const highVolumeGaps = comp.keywordGap
        .filter((kw: any) => parseInt(kw.Nq || kw['Search Volume'] || 0) >= 100)
        .slice(0, 5)

      if (highVolumeGaps.length > 0) {
        recommendations.push({
          type: 'keyword_gap',
          priority: 'high',
          competitor: comp.domain,
          title: `Target ${highVolumeGaps.length} high-volume keywords that ${comp.domain} ranks for`,
          keywords: highVolumeGaps.map((kw: any) => ({
            keyword: kw.Ph || kw.Keyword,
            volume: kw.Nq || kw['Search Volume'],
            position: kw.Po || kw.Position,
          })),
          action: `Create content targeting these keywords where ${comp.domain} is currently ranking but you're not.`,
        })
      }
    }

    // Recommendation 2: Learn from their best keywords
    if (comp.bestKeywords && comp.bestKeywords.length > 0) {
      recommendations.push({
        type: 'learn_from_competitor',
        priority: 'medium',
        competitor: comp.domain,
        title: `Analyze ${comp.domain}'s top-performing content`,
        keywords: comp.bestKeywords.slice(0, 5).map((kw: any) => ({
          keyword: kw.Ph || kw.Keyword,
          volume: kw.Nq || kw['Search Volume'],
          position: kw.Po || kw.Position,
        })),
        action: `Study their content strategy for these high-ranking keywords and identify what makes their pages successful.`,
      })
    }

    // Recommendation 3: Traffic comparison
    if (comp.overview) {
      const theirTraffic = parseInt(comp.overview['Organic Traffic'] || comp.overview.Ot || 0)
      const theirKeywords = parseInt(comp.overview['Organic Keywords'] || comp.overview.Or || 0)

      if (theirTraffic > 500) {
        recommendations.push({
          type: 'traffic_benchmark',
          priority: 'medium',
          competitor: comp.domain,
          title: `${comp.domain} has ${theirTraffic.toLocaleString()} monthly visits`,
          metrics: {
            traffic: theirTraffic,
            keywords: theirKeywords,
          },
          action: `Analyze their site structure and content strategy to understand how they're driving ${theirTraffic} visits with ${theirKeywords} keywords.`,
        })
      }
    }
  })

  // General recommendations
  recommendations.push({
    type: 'content_strategy',
    priority: 'high',
    title: 'Create comprehensive speaker comparison pages',
    action: `Competitors likely have comparison and "vs" pages. Create pages like "Best AI Speakers for [Industry]" or "Top 10 AI Keynote Speakers 2025".`,
  })

  recommendations.push({
    type: 'content_strategy',
    priority: 'high',
    title: 'Build speaker category pages',
    action: `Create dedicated pages for speaker categories: "Machine Learning Speakers", "ChatGPT Speakers", "AI Ethics Speakers", "Generative AI Speakers".`,
  })

  recommendations.push({
    type: 'technical_seo',
    priority: 'medium',
    title: 'Improve internal linking structure',
    action: `Add contextual links from blog posts to speaker pages and vice versa. Create topic clusters around main themes.`,
  })

  return recommendations
}

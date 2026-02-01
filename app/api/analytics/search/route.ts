import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Initialize database connection
let sql: any = null
try {
  if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL)
  }
} catch (error) {
  console.error('Failed to initialize search analytics database:', error)
}

// Store search data in memory if database is not available
const inMemorySearchData: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, resultCount, industry, page, speakerResults } = body

    // Skip tracking for admin users
    const isAdmin = request.cookies.get('adminLoggedIn')?.value === 'true'
    if (isAdmin) {
      return NextResponse.json({ success: true, skipped: 'admin' })
    }

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const searchData = {
      query: query.toLowerCase().trim(),
      result_count: resultCount || 0,
      industry_filter: industry || 'all',
      page_path: page || '/speakers',
      speaker_results: speakerResults ? JSON.stringify(speakerResults) : null,
      created_at: new Date().toISOString()
    }

    // Try to store in database
    if (sql) {
      try {
        await sql`
          INSERT INTO search_analytics (
            query, result_count, industry_filter, page_path, speaker_results, created_at
          ) VALUES (
            ${searchData.query}, 
            ${searchData.result_count}, 
            ${searchData.industry_filter}, 
            ${searchData.page_path},
            ${searchData.speaker_results},
            ${searchData.created_at}
          )
        `
      } catch (dbError: any) {
        console.error('Database error:', dbError)
        
        // If table doesn't exist, try to create it
        if (dbError.message?.includes('does not exist')) {
          try {
            await sql`
              CREATE TABLE IF NOT EXISTS search_analytics (
                id SERIAL PRIMARY KEY,
                query TEXT NOT NULL,
                result_count INTEGER DEFAULT 0,
                industry_filter TEXT,
                page_path TEXT,
                speaker_results JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `
            
            // Retry insert
            await sql`
              INSERT INTO search_analytics (
                query, result_count, industry_filter, page_path, speaker_results, created_at
              ) VALUES (
                ${searchData.query}, 
                ${searchData.result_count}, 
                ${searchData.industry_filter}, 
                ${searchData.page_path},
                ${searchData.speaker_results},
                ${searchData.created_at}
              )
            `
          } catch (createError) {
            console.error('Failed to create search_analytics table:', createError)
            // Fall back to in-memory storage
            inMemorySearchData.push(searchData)
          }
        } else {
          // Fall back to in-memory storage
          inMemorySearchData.push(searchData)
        }
      }
    } else {
      // No database, use in-memory storage
      inMemorySearchData.push(searchData)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking search:', error)
    return NextResponse.json(
      { error: 'Failed to track search' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('x-admin-request')
    if (authHeader !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    let searchAnalytics = {
      totalSearches: 0,
      uniqueQueries: 0,
      avgResultCount: 0,
      zeroResultQueries: [],
      topQueries: [],
      searchesByIndustry: [],
      searchTrends: [],
      recentSearches: [],
      topSearchedSpeakers: []
    }

    if (sql) {
      try {
        // Get total searches and unique queries
        const stats = await sql`
          SELECT 
            COUNT(*) as total_searches,
            COUNT(DISTINCT query) as unique_queries,
            ROUND(AVG(result_count)) as avg_result_count
          FROM search_analytics
          WHERE created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
        `

        // Get top queries
        const topQueries = await sql`
          SELECT 
            query,
            COUNT(*) as search_count,
            ROUND(AVG(result_count)) as avg_results
          FROM search_analytics
          WHERE created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
          GROUP BY query
          ORDER BY search_count DESC
          LIMIT 20
        `

        // Get queries with zero results
        const zeroResults = await sql`
          SELECT 
            query,
            COUNT(*) as search_count
          FROM search_analytics
          WHERE created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
            AND result_count = 0
          GROUP BY query
          ORDER BY search_count DESC
          LIMIT 10
        `

        // Get searches by industry filter
        const byIndustry = await sql`
          SELECT 
            industry_filter,
            COUNT(*) as search_count
          FROM search_analytics
          WHERE created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
          GROUP BY industry_filter
          ORDER BY search_count DESC
        `

        // Get daily search trends
        const trends = await sql`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as searches,
            COUNT(DISTINCT query) as unique_queries
          FROM search_analytics
          WHERE created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `

        // Get recent searches
        const recent = await sql`
          SELECT 
            query,
            result_count,
            industry_filter,
            created_at
          FROM search_analytics
          WHERE created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
          ORDER BY created_at DESC
          LIMIT 50
        `

        // Get most searched speakers
        const speakerAppearances = await sql`
          SELECT 
            speaker_results
          FROM search_analytics
          WHERE created_at >= ${startDate.toISOString()}
            AND created_at <= ${endDate.toISOString()}
            AND speaker_results IS NOT NULL
            AND result_count > 0
        `

        // Process speaker appearances
        const speakerCounts: Record<string, { name: string, slug: string, count: number }> = {}
        
        for (const row of speakerAppearances) {
          if (row.speaker_results) {
            try {
              const speakers = typeof row.speaker_results === 'string' 
                ? JSON.parse(row.speaker_results) 
                : row.speaker_results
              
              if (Array.isArray(speakers)) {
                for (const speaker of speakers) {
                  const key = speaker.slug || speaker.name
                  if (key) {
                    if (!speakerCounts[key]) {
                      speakerCounts[key] = {
                        name: speaker.name,
                        slug: speaker.slug,
                        count: 0
                      }
                    }
                    speakerCounts[key].count++
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing speaker results:', e)
            }
          }
        }

        const topSearchedSpeakers = Object.values(speakerCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        searchAnalytics = {
          totalSearches: stats[0]?.total_searches || 0,
          uniqueQueries: stats[0]?.unique_queries || 0,
          avgResultCount: Math.round(stats[0]?.avg_result_count || 0),
          zeroResultQueries: zeroResults || [],
          topQueries: topQueries || [],
          searchesByIndustry: byIndustry || [],
          searchTrends: trends || [],
          recentSearches: recent || [],
          topSearchedSpeakers: topSearchedSpeakers
        }
      } catch (dbError) {
        console.error('Error fetching search analytics:', dbError)
        
        // Fall back to in-memory data
        const filteredData = inMemorySearchData.filter(s => {
          const searchDate = new Date(s.created_at)
          return searchDate >= startDate && searchDate <= endDate
        })

        // Calculate stats from in-memory data
        const uniqueQueriesSet = new Set(filteredData.map(s => s.query))
        const queryGroups = filteredData.reduce((acc: any, search) => {
          if (!acc[search.query]) {
            acc[search.query] = { count: 0, totalResults: 0 }
          }
          acc[search.query].count++
          acc[search.query].totalResults += search.result_count
          return acc
        }, {})

        const topQueriesArray = Object.entries(queryGroups)
          .map(([query, data]: [string, any]) => ({
            query,
            search_count: data.count,
            avg_results: Math.round(data.totalResults / data.count)
          }))
          .sort((a, b) => b.search_count - a.search_count)
          .slice(0, 20)

        searchAnalytics = {
          totalSearches: filteredData.length,
          uniqueQueries: uniqueQueriesSet.size,
          avgResultCount: filteredData.length > 0 
            ? Math.round(filteredData.reduce((sum, s) => sum + s.result_count, 0) / filteredData.length)
            : 0,
          zeroResultQueries: filteredData
            .filter(s => s.result_count === 0)
            .reduce((acc: any[], search) => {
              const existing = acc.find(q => q.query === search.query)
              if (existing) {
                existing.search_count++
              } else {
                acc.push({ query: search.query, search_count: 1 })
              }
              return acc
            }, [])
            .sort((a, b) => b.search_count - a.search_count)
            .slice(0, 10),
          topQueries: topQueriesArray,
          searchesByIndustry: Object.entries(
            filteredData.reduce((acc: any, search) => {
              if (!acc[search.industry_filter]) acc[search.industry_filter] = 0
              acc[search.industry_filter]++
              return acc
            }, {})
          ).map(([industry_filter, search_count]) => ({ industry_filter, search_count })),
          searchTrends: [],
          recentSearches: filteredData.slice(-50).reverse()
        }
      }
    } else {
      // Use in-memory data only
      const filteredData = inMemorySearchData.filter(s => {
        const searchDate = new Date(s.created_at)
        return searchDate >= startDate && searchDate <= endDate
      })

      searchAnalytics.totalSearches = filteredData.length
      searchAnalytics.recentSearches = filteredData.slice(-50).reverse()
    }

    return NextResponse.json({
      success: true,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      },
      analytics: searchAnalytics
    })
  } catch (error) {
    console.error('Error fetching search analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search analytics' },
      { status: 500 }
    )
  }
}
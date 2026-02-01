import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'COMPETITOR_SEO_ANALYSIS.json')

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Action plan not found. Run competitor analysis first.' }, { status: 404 })
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const rawData = JSON.parse(fileContent)

    // Transform snake_case keys to camelCase for UI compatibility
    const critical = rawData.page_production_list?.critical || []
    const highPriority = rawData.page_production_list?.high_priority || []
    const mediumPriority = rawData.page_production_list?.medium_priority || []
    const longTerm = rawData.page_production_list?.long_term || []

    const transformedData = {
      yourDomain: rawData.your_domain,
      competitorAnalysis: rawData.competitors,
      actionPlan: rawData.action_plan,
      pageList: {
        total: critical.length + highPriority.length + mediumPriority.length + longTerm.length,
        critical,
        highPriority,
        mediumPriority,
        longTerm
      },
      summary: rawData.summary,
      generatedAt: rawData.generated_at
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error reading action plan:', error)
    return NextResponse.json({ error: 'Failed to load action plan' }, { status: 500 })
  }
}

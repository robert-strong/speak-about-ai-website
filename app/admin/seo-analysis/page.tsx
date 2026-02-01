'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Target, Award, Search, BarChart3, CheckSquare, ListTodo, FileText } from 'lucide-react'

interface KeywordData {
  Keyword: string
  Position: string
  'Search Volume': string
  CPC: string
  Url: string
  'Traffic (%)': string
  Competition: string
  Ph?: string
  Po?: string
  Nq?: string
}

interface CompetitorAnalysis {
  domain: string
  error?: boolean
  overview?: {
    'Organic Traffic'?: string
    'Organic Keywords'?: string
    'Organic Cost'?: string
    Ot?: string
    Or?: string
    Oc?: string
  }
  bestKeywords?: KeywordData[]
  keywordGap?: KeywordData[]
}

interface SEORecommendation {
  title: string
  action: string
  priority: 'high' | 'medium' | 'low'
  competitor?: string
  keywords?: Array<{ keyword: string; volume: string; position?: string }>
  metrics?: { traffic: number; keywords: number }
}

interface CompetitorData {
  recommendations?: SEORecommendation[]
  detailedAnalysis?: CompetitorAnalysis[]
}

interface PageListItem {
  title: string
  urlSlug: string
  intent: string
}

interface ActionPlanPhase {
  phase: string
  priority: string
  trafficGoal: string
  actions: Array<{ action: string; tasks: string[] }>
}

interface ActionPlanData {
  yourDomain?: {
    overview?: { Ot?: number; Or?: number }
  }
  competitorAnalysis?: Array<{ overview?: { Ot?: string } }>
  actionPlan?: ActionPlanPhase[]
  pageList?: {
    total: number
    critical?: PageListItem[]
    highPriority?: PageListItem[]
    mediumPriority?: PageListItem[]
  }
}

interface SemrushData {
  overview: {
    Domain: string
    Rank: string
    'Organic Keywords': string
    'Organic Traffic': string
    'Organic Cost': string
    'Adwords Keywords': string
    'Adwords Traffic': string
  }
  keywords: KeywordData[]
  analysis: {
    lowHangingFruit: KeywordData[]
    highValueOpportunities: KeywordData[]
    topKeywords: KeywordData[]
    positionRanges: {
      top3: number
      top10: number
      top20: number
      top50: number
      top100: number
    }
    topics: Array<{
      topic: string
      count: number
      volume: number
      keywords: string[]
    }>
    totalVolume: number
  }
  totalKeywords: number
}

export default function SEOAnalysisPage() {
  const [data, setData] = useState<SemrushData | null>(null)
  const [competitorData, setCompetitorData] = useState<CompetitorData | null>(null)
  const [actionPlan, setActionPlan] = useState<ActionPlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [competitorLoading, setCompetitorLoading] = useState(true)
  const [actionPlanLoading, setActionPlanLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch main SEO data
    fetch('/api/seo/analyze')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setData(data)
        }
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load SEO data')
        setLoading(false)
      })

    // Fetch competitor data
    fetch('/api/seo/competitors')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCompetitorData(data)
        }
        setCompetitorLoading(false)
      })
      .catch(err => {
        console.error('Failed to load competitor data:', err)
        setCompetitorLoading(false)
      })

    // Fetch action plan data
    fetch('/api/seo/action-plan')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setActionPlan(data)
        }
        setActionPlanLoading(false)
      })
      .catch(err => {
        console.error('Failed to load action plan:', err)
        setActionPlanLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Error Loading SEO Data</CardTitle>
              <CardDescription className="text-red-700">{error || 'Unknown error'}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  const { overview, analysis, totalKeywords } = data

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SEO Analysis Dashboard</h1>
          <p className="text-gray-600">Powered by Semrush API · Data for speakabout.ai</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Domain Rank</CardDescription>
              <CardTitle className="text-3xl">{parseInt(overview.Rank).toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Global ranking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Organic Keywords</CardDescription>
              <CardTitle className="text-3xl">{overview['Organic Keywords']}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Total ranking keywords</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Monthly Traffic</CardDescription>
              <CardTitle className="text-3xl">{overview['Organic Traffic']}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Estimated visits/month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Traffic Value</CardDescription>
              <CardTitle className="text-3xl">${overview['Organic Cost']}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Estimated monthly value</p>
            </CardContent>
          </Card>
        </div>

        {/* Position Ranges */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Keyword Position Distribution
            </CardTitle>
            <CardDescription>Number of keywords in each position range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{analysis.positionRanges.top3}</div>
                <div className="text-sm text-gray-600">Top 3</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{analysis.positionRanges.top10}</div>
                <div className="text-sm text-gray-600">Top 10</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{analysis.positionRanges.top20}</div>
                <div className="text-sm text-gray-600">Top 20</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{analysis.positionRanges.top50}</div>
                <div className="text-sm text-gray-600">Top 50</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{analysis.positionRanges.top100}</div>
                <div className="text-sm text-gray-600">Top 100</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="action-plan">Action Plan</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="low-hanging">Low-Hanging Fruit</TabsTrigger>
            <TabsTrigger value="high-value">High-Value</TabsTrigger>
            <TabsTrigger value="top-keywords">Top Keywords</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            {competitorLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Analyzing competitors and generating recommendations...</p>
                  </div>
                </CardContent>
              </Card>
            ) : competitorData?.recommendations ? (
              <div className="space-y-4">
                {competitorData.recommendations.map((rec: any, i: number) => (
                  <Card key={i} className={rec.priority === 'high' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-blue-500'}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{rec.title}</CardTitle>
                          {rec.competitor && (
                            <CardDescription className="mt-1">
                              Based on analysis of {rec.competitor}
                            </CardDescription>
                          )}
                        </div>
                        <Badge className={rec.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
                          {rec.priority === 'high' ? '🔥 High Priority' : '📊 Medium Priority'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{rec.action}</p>

                      {rec.keywords && rec.keywords.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-sm text-gray-900 mb-2">Target Keywords:</h4>
                          <div className="space-y-2">
                            {rec.keywords.map((kw: any, j: number) => (
                              <div key={j} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                <span className="font-medium">{kw.keyword}</span>
                                <div className="flex gap-3 text-sm text-gray-600">
                                  <span>{parseInt(kw.volume).toLocaleString()} searches/mo</span>
                                  {kw.position && <span>Competitor: #{kw.position}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {rec.metrics && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-sm text-gray-600">Monthly Traffic</div>
                            <div className="text-2xl font-bold text-blue-900">{rec.metrics.traffic.toLocaleString()}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <div className="text-sm text-gray-600">Total Keywords</div>
                            <div className="text-2xl font-bold text-green-900">{rec.metrics.keywords.toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">No recommendations available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Action Plan Tab */}
          <TabsContent value="action-plan">
            {actionPlanLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading action plan...</p>
                  </div>
                </CardContent>
              </Card>
            ) : actionPlan ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Current Traffic</p>
                        <p className="text-2xl font-bold">{actionPlan.yourDomain?.overview?.Ot || 0}</p>
                        <p className="text-xs text-gray-500">visits/month</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Current Keywords</p>
                        <p className="text-2xl font-bold">{actionPlan.yourDomain?.overview?.Or || 0}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Traffic Potential</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Math.round(actionPlan.competitorAnalysis?.reduce((sum: number, c: any) => sum + parseInt(c.overview?.Ot || 0), 0) / actionPlan.competitorAnalysis?.length || 0)}
                        </p>
                        <p className="text-xs text-gray-500">avg competitor</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Pages to Create</p>
                        <p className="text-2xl font-bold text-blue-600">{actionPlan.pageList?.total || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Plan Phases */}
                {actionPlan.actionPlan?.map((phase: any, i: number) => (
                  <Card key={i} className={i === 0 ? 'border-l-4 border-l-orange-500' : ''}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ListTodo className="w-5 h-5" />
                        {phase.phase}
                      </CardTitle>
                      <CardDescription>
                        {phase.priority} Priority · Goal: {phase.trafficGoal}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {phase.actions.map((action: any, j: number) => (
                          <div key={j} className="border-l-4 border-gray-200 pl-4">
                            <h4 className="font-semibold text-lg mb-3">{action.action}</h4>
                            <div className="space-y-2">
                              {action.tasks.map((task: string, k: number) => (
                                <div key={k} className="flex items-start gap-2">
                                  <CheckSquare className="w-4 h-4 mt-1 text-gray-400" />
                                  <p className="text-sm text-gray-700">{task}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Page Production List */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      Page Production List
                    </CardTitle>
                    <CardDescription>
                      {actionPlan.pageList?.total || 0} pages to create · Prioritized by impact
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Critical Pages */}
                      {actionPlan.pageList?.critical?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-red-100 text-red-800">CRITICAL</Badge>
                            <p className="text-sm text-gray-600">{actionPlan.pageList.critical.length} pages</p>
                          </div>
                          <div className="space-y-2">
                            {actionPlan.pageList.critical.map((page: any, i: number) => (
                              <div key={i} className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">{page.title}</p>
                                    <p className="text-xs text-gray-600 mt-1">{page.urlSlug}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">{page.intent}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* High Priority Pages */}
                      {actionPlan.pageList?.highPriority?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-orange-100 text-orange-800">HIGH PRIORITY</Badge>
                            <p className="text-sm text-gray-600">{actionPlan.pageList.highPriority.length} pages</p>
                          </div>
                          <div className="space-y-2">
                            {actionPlan.pageList.highPriority.map((page: any, i: number) => (
                              <div key={i} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">{page.title}</p>
                                    <p className="text-xs text-gray-600 mt-1">{page.urlSlug}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">{page.intent}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medium Priority Pages */}
                      {actionPlan.pageList?.mediumPriority?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-blue-100 text-blue-800">MEDIUM PRIORITY</Badge>
                            <p className="text-sm text-gray-600">{actionPlan.pageList.mediumPriority.length} pages</p>
                          </div>
                          <div className="space-y-2">
                            {actionPlan.pageList.mediumPriority.map((page: any, i: number) => (
                              <div key={i} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">{page.title}</p>
                                    <p className="text-xs text-gray-600 mt-1">{page.urlSlug}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">{page.intent}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">No action plan available. Run competitor analysis to generate one.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors">
            {competitorLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Analyzing competitors...</p>
                  </div>
                </CardContent>
              </Card>
            ) : competitorData?.detailedAnalysis ? (
              <div className="space-y-6">
                {competitorData.detailedAnalysis.map((comp: any, i: number) => (
                  comp.error ? (
                    <Card key={i} className="border-red-200">
                      <CardHeader>
                        <CardTitle>{comp.domain}</CardTitle>
                        <CardDescription className="text-red-600">Failed to analyze competitor</CardDescription>
                      </CardHeader>
                    </Card>
                  ) : (
                    <Card key={i}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl">{comp.domain}</CardTitle>
                            <CardDescription>Competitive Analysis</CardDescription>
                          </div>
                          <Badge variant="outline">#{i + 1} Competitor</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Overview Stats */}
                        {comp.overview && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded">
                              <div className="text-sm text-gray-600">Monthly Traffic</div>
                              <div className="text-2xl font-bold">{comp.overview['Organic Traffic'] || comp.overview.Ot}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                              <div className="text-sm text-gray-600">Total Keywords</div>
                              <div className="text-2xl font-bold">{comp.overview['Organic Keywords'] || comp.overview.Or}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                              <div className="text-sm text-gray-600">Traffic Value</div>
                              <div className="text-2xl font-bold">${comp.overview['Organic Cost'] || comp.overview.Oc}</div>
                            </div>
                          </div>
                        )}

                        {/* Their best keywords */}
                        {comp.bestKeywords && comp.bestKeywords.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3">🏆 Their Top Performing Keywords (Position 1-3)</h4>
                            <div className="space-y-2">
                              {comp.bestKeywords.slice(0, 5).map((kw: any, j: number) => (
                                <div key={j} className="flex items-center justify-between bg-green-50 p-3 rounded">
                                  <span className="font-medium">{kw.Ph || kw.Keyword}</span>
                                  <div className="flex gap-3 text-sm">
                                    <Badge className="bg-green-600">#{kw.Po || kw.Position}</Badge>
                                    <span className="text-gray-600">{parseInt(kw.Nq || kw['Search Volume'] || 0).toLocaleString()} searches/mo</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Keyword gaps - opportunities */}
                        {comp.keywordGap && comp.keywordGap.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3">💡 Keywords They Rank For (That You Don't)</h4>
                            <div className="space-y-2">
                              {comp.keywordGap.slice(0, 10).map((kw: any, j: number) => (
                                <div key={j} className="flex items-center justify-between bg-orange-50 p-3 rounded">
                                  <span className="font-medium">{kw.Ph || kw.Keyword}</span>
                                  <div className="flex gap-3 text-sm">
                                    <span className="text-gray-600">Their position: #{kw.Po || kw.Position}</span>
                                    <span className="text-gray-600">{parseInt(kw.Nq || kw['Search Volume'] || 0).toLocaleString()} searches/mo</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">No competitor data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Low-Hanging Fruit */}
          <TabsContent value="low-hanging">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Low-Hanging Fruit (Position 4-20)
                </CardTitle>
                <CardDescription>
                  {analysis.lowHangingFruit.length} keywords on page 1-2 that can be optimized to reach top 3
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.lowHangingFruit.slice(0, 20).map((kw, i) => (
                    <div key={i} className="flex items-start justify-between border-b pb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{kw.Keyword}</span>
                          <Badge variant="outline">Position {kw.Position}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{kw.Url}</div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-600">
                            <Search className="w-4 h-4 inline mr-1" />
                            {parseInt(kw['Search Volume']).toLocaleString()} searches/mo
                          </span>
                          {parseFloat(kw.CPC) > 0 && (
                            <span className="text-gray-600">CPC: ${kw.CPC}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-orange-100 text-orange-800">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Quick Win
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* High-Value Opportunities */}
          <TabsContent value="high-value">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  High-Value Opportunities (Position 11-30, Volume 100+)
                </CardTitle>
                <CardDescription>
                  {analysis.highValueOpportunities.length} high-volume keywords on page 2-3
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.highValueOpportunities.map((kw, i) => (
                    <div key={i} className="flex items-start justify-between border-b pb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{kw.Keyword}</span>
                          <Badge variant="outline">Position {kw.Position}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{kw.Url}</div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-600">
                            <Search className="w-4 h-4 inline mr-1" />
                            {parseInt(kw['Search Volume']).toLocaleString()} searches/mo
                          </span>
                          {parseFloat(kw.CPC) > 0 && (
                            <span className="text-gray-600">CPC: ${kw.CPC}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">
                          High Volume
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Keywords */}
          <TabsContent value="top-keywords">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-500" />
                  Top Performing Keywords (Position 1-3)
                </CardTitle>
                <CardDescription>
                  {analysis.topKeywords.length} keywords ranking in top 3 positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.topKeywords.map((kw, i) => (
                    <div key={i} className="flex items-start justify-between border-b pb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{kw.Keyword}</span>
                          <Badge className="bg-green-100 text-green-800">
                            #{kw.Position}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{kw.Url}</div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-600">
                            <Search className="w-4 h-4 inline mr-1" />
                            {parseInt(kw['Search Volume']).toLocaleString()} searches/mo
                          </span>
                          {parseFloat(kw.CPC) > 0 && (
                            <span className="text-gray-600">CPC: ${kw.CPC}</span>
                          )}
                          <span className="text-green-600 font-medium">
                            {kw['Traffic (%)']}% of traffic
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topics */}
          <TabsContent value="topics">
            <Card>
              <CardHeader>
                <CardTitle>Keyword Topics</CardTitle>
                <CardDescription>Common themes across your ranking keywords</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.topics.map((topic, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg capitalize">{topic.topic}</h3>
                        <Badge>{topic.count} keywords</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Total search volume: {topic.volume.toLocaleString()}/month
                      </div>
                      <div className="space-y-1">
                        {topic.keywords.slice(0, 5).map((kw, j) => (
                          <div key={j} className="text-sm text-gray-700">• {kw}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

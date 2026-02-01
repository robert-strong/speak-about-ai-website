'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  FunnelChart, Funnel, LabelList, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ComposedChart, Area, Cell, PieChart, Pie,
  Treemap, Sankey
} from 'recharts'
import {
  TrendingUp, TrendingDown, Search, Eye, MousePointer, Globe,
  RefreshCw, AlertCircle, BarChart3, Zap, Target, Users,
  ArrowRight, CheckCircle, XCircle, Info, Activity, Filter,
  Lightbulb, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface IntegratedAnalyticsProps {
  timeRange?: string
}

interface SearchPerformanceTotals {
  impressions: number
  clicks: number
  ctr?: number
  position?: number
}

interface UserBehaviorData {
  pageViews: number
  uniqueVisitors: number
  bounceRate?: number
  avgSessionDuration?: number
}

interface CorrelationItem {
  searchClicks: number
  actualVisits: number
  url: string
  searchCTR: number
  conversionRate: number
}

interface LandingPagePerformance {
  page: string
  impressions: number
  clicks: number
  visits: number
  bounceRate?: number
}

interface IntegratedAnalyticsData {
  searchPerformance: {
    totals: SearchPerformanceTotals
    topQueries?: Array<{ query: string; clicks: number; impressions: number }>
    topPages?: Array<{ page: string; clicks: number; impressions: number }>
  }
  userBehavior: UserBehaviorData
  correlations: {
    searchToVisit: CorrelationItem[]
    landingPagePerformance: LandingPagePerformance[]
  }
}

export default function IntegratedAnalyticsDashboard({ timeRange = '7' }: IntegratedAnalyticsProps) {
  const [data, setData] = useState<IntegratedAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('overview')

  useEffect(() => {
    fetchIntegratedData()
  }, [timeRange])

  const fetchIntegratedData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/integrated-analytics?days=${timeRange}`, {
        headers: { 'x-admin-request': 'true' }
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch integrated analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>Unable to load integrated analytics data.</AlertDescription>
      </Alert>
    )
  }

  // Prepare funnel data
  const funnelData = [
    {
      name: 'Search Impressions',
      value: data.searchPerformance.totals.impressions || 0,
      fill: '#3B82F6'
    },
    {
      name: 'Search Clicks',
      value: data.searchPerformance.totals.clicks || 0,
      fill: '#10B981'
    },
    {
      name: 'Site Visits',
      value: data.userBehavior.pageViews || 0,
      fill: '#8B5CF6'
    },
    {
      name: 'Unique Visitors',
      value: data.userBehavior.uniqueVisitors || 0,
      fill: '#F59E0B'
    }
  ]

  // Prepare correlation scatter data
  const correlationData = data.correlations.searchToVisit.map((item: CorrelationItem) => ({
    searchClicks: item.searchClicks,
    actualVisits: item.actualVisits,
    url: item.url,
    ctr: item.searchCTR,
    conversionRate: item.conversionRate
  }))

  // Prepare landing page performance data
  const landingPageData = data.correlations.landingPagePerformance.slice(0, 10)

  // Calculate key metrics
  const searchToClickRate = data.searchPerformance.totals.impressions > 0
    ? ((data.searchPerformance.totals.clicks / data.searchPerformance.totals.impressions) * 100).toFixed(2)
    : '0'
  
  const clickToVisitRate = data.searchPerformance.totals.clicks > 0
    ? ((data.userBehavior.pageViews / data.searchPerformance.totals.clicks) * 100).toFixed(2)
    : '0'

  const visitorEngagement = data.userBehavior.uniqueVisitors > 0
    ? (data.userBehavior.pageViews / data.userBehavior.uniqueVisitors).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Key Insights Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Search → Click</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{searchToClickRate}%</span>
              {parseFloat(searchToClickRate) > 3 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">CTR from search results</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click → Visit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{clickToVisitRate}%</span>
              {parseFloat(clickToVisitRate) > 80 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Conversion to site visits</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Visitor Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{visitorEngagement}</span>
              <span className="text-sm text-muted-foreground">pages/user</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg pages per visitor</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{data.userBehavior.bounceRate}%</span>
              {data.userBehavior.bounceRate < 40 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Single page sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="correlation">Correlations</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search vs Behavior Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Search Performance vs User Behavior</CardTitle>
                <CardDescription>How search visibility translates to actual traffic</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={landingPageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="url" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="searchClicks" fill="#3B82F6" name="Search Clicks" />
                    <Line yAxisId="right" type="monotone" dataKey="actualVisits" stroke="#10B981" name="Actual Visits" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content Performance Matrix</CardTitle>
                <CardDescription>Pages ranked by combined search and user metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {landingPageData.slice(0, 5).map((page: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{page.url}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            <Search className="inline h-3 w-3 mr-1" />
                            {page.searchClicks} clicks
                          </span>
                          <span className="text-xs text-muted-foreground">
                            <Users className="inline h-3 w-3 mr-1" />
                            {page.actualVisits} visits
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={page.conversionRate > 75 ? "default" : "secondary"}>
                          {page.conversionRate.toFixed(0)}% conv
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Search Query Performance Distribution</CardTitle>
              <CardDescription>Top queries driving traffic to your site</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <Treemap
                  data={data.searchPerformance.queries.slice(0, 20).map((q: any) => ({
                    name: q.keys?.[0] || 'Unknown',
                    size: q.clicks || 0,
                    impressions: q.impressions || 0,
                    ctr: ((q.ctr || 0) * 100).toFixed(2)
                  }))}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  fill="#3B82F6"
                >
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow border">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">Clicks: {data.size}</p>
                            <p className="text-sm">Impressions: {data.impressions}</p>
                            <p className="text-sm">CTR: {data.ctr}%</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </Treemap>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search to Engagement Funnel</CardTitle>
              <CardDescription>Visualize the user journey from search to site engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
              
              {/* Conversion Rates Between Steps */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Impressions → Clicks</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {((data.searchPerformance.totals.ctr || 0) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Clicks → Visits</p>
                  <p className="text-2xl font-bold text-green-600">
                    {clickToVisitRate}%
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Visits → Engaged</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(100 - data.userBehavior.bounceRate).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Correlation Tab */}
        <TabsContent value="correlation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Clicks vs Actual Visits</CardTitle>
                <CardDescription>Correlation between search performance and site traffic</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="searchClicks" name="Search Clicks" />
                    <YAxis dataKey="actualVisits" name="Actual Visits" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter 
                      name="Pages" 
                      data={correlationData} 
                      fill="#8B5CF6"
                    >
                      {correlationData.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.conversionRate > 75 ? '#10B981' : entry.conversionRate > 50 ? '#F59E0B' : '#EF4444'} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Efficiency by Position</CardTitle>
                <CardDescription>How search ranking affects click-to-visit conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={data.correlations.searchToVisit
                      .filter((item: any) => item.searchPosition < 20)
                      .sort((a: any, b: any) => a.searchPosition - b.searchPosition)
                      .slice(0, 10)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="searchPosition" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversionRate" fill="#3B82F6" name="Conversion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {/* High Impact Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI-Powered Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* High Impressions Low Traffic */}
              {data.insights.highImpressionsLowTraffic.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    Pages with Untapped Potential
                  </h3>
                  <div className="space-y-2">
                    {data.insights.highImpressionsLowTraffic.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.url}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.impressions} impressions • {(item.ctr * 100).toFixed(2)}% CTR • Position {item.position.toFixed(1)}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-orange-500" />
                        </div>
                        <Alert className="mt-2 border-orange-200">
                          <Info className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            {item.recommendation}
                          </AlertDescription>
                        </Alert>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* High Traffic Low Search */}
              {data.insights.highTrafficLowSearch.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    Popular Pages Missing from Search
                  </h3>
                  <div className="space-y-2">
                    {data.insights.highTrafficLowSearch.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.url}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.visits} visits but not appearing in search results
                            </p>
                          </div>
                          <Target className="h-4 w-4 text-blue-500" />
                        </div>
                        <Alert className="mt-2 border-blue-200">
                          <Info className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            {item.recommendation}
                          </AlertDescription>
                        </Alert>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversion Opportunities */}
              {data.insights.conversionOpportunities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Quick Win Opportunities
                  </h3>
                  <div className="space-y-2">
                    {data.insights.conversionOpportunities.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.url}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Current conversion: {item.currentConversion.toFixed(0)}% • Position {item.searchPosition.toFixed(1)}
                            </p>
                          </div>
                          <Badge className="bg-green-600">{item.potential}</Badge>
                        </div>
                        <Alert className="mt-2 border-green-200">
                          <CheckCircle className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            {item.recommendation}
                          </AlertDescription>
                        </Alert>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
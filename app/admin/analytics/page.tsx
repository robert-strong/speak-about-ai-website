"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  Users,
  Eye,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  Calendar,
  MousePointer,
  Clock,
  Loader2,
  Search,
  XCircle,
  Filter,
  Mail
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { formatDateTimePST, getPSTTimezoneLabel } from "@/lib/date-utils"
import dynamic from 'next/dynamic'

// Dynamically import the dashboards to avoid SSR issues with recharts
const SearchConsoleDashboard = dynamic(
  () => import('@/components/search-console-dashboard'),
  { ssr: false }
)

const IntegratedAnalyticsDashboard = dynamic(
  () => import('@/components/integrated-analytics-dashboard'),
  { ssr: false }
)


interface AnalyticsData {
  totalPageViews: number
  uniqueVisitors: number
  bounceRate: number
  avgSessionDuration: number
  topPages: Array<{ page: string; views: number }>
  topReferrers: Array<{ referrer: string; count: number }>
  deviceBreakdown: Array<{ device: string; count: number }>
  browserBreakdown?: Array<{ browser: string; count: number }>
  countryBreakdown?: Array<{ country: string; count: number }>
  dailyStats: Array<{
    date: string
    page_views: number
    unique_visitors: number
    bounce_rate: number
  }>
  recentEvents: Array<{
    event_name: string
    page_path: string
    created_at: string
    metadata: any
  }>
  totalSessions?: number
  averageTime?: number
  period?: {
    start: string
    end: string
    days: number
  }
}

interface SearchAnalytics {
  totalSearches: number
  uniqueQueries: number
  avgResultCount: number
  zeroResultQueries: Array<{ query: string; search_count: number }>
  topQueries: Array<{ query: string; search_count: number; avg_results: number }>
  searchesByIndustry: Array<{ industry_filter: string; search_count: number }>
  searchTrends: Array<{ date: string; searches: number; unique_queries: number }>
  recentSearches: Array<{ query: string; result_count: number; industry_filter: string; created_at: string }>
  topSearchedSpeakers: Array<{ name: string; slug: string; count: number }>
}


export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadAnalytics()
  }, [router, timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Load website analytics and search analytics in parallel
      const [websiteResponse, searchResponse] = await Promise.all([
        fetch(`/api/analytics/umami?days=${timeRange}`, {
          headers: { 'x-admin-request': 'true' }
        }),
        fetch(`/api/analytics/search?days=${timeRange}`, {
          headers: { 'x-admin-request': 'true' }
        })
      ])
      
      if (websiteResponse.ok) {
        const data = await websiteResponse.json()
        setAnalytics(data)
      } else {
        // Fallback to legacy analytics API
        const fallbackResponse = await fetch(`/api/analytics?days=${timeRange}`)
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json()
          setAnalytics(data)
        } else {
          const errorData = await websiteResponse.json()
          toast({
            title: "Analytics Setup Required",
            description: "Please ensure Umami Analytics is properly configured",
            variant: "destructive"
          })
        }
      }
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        setSearchAnalytics(searchData.analytics)
      } else {
        console.error('Failed to load search analytics')
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-gray-600">
                {analytics?.period ? 'Powered by Umami Analytics' : 'Analytics Dashboard'} - Track visitor behavior, search patterns, and website performance
              </p>
              <p className="text-sm text-gray-500 mt-1">All times displayed in {getPSTTimezoneLabel()}</p>
            </div>
            <div className="flex gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadAnalytics} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Website Overview
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "search"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Search Analytics
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "directory"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Directory Analytics
            </button>
            <button
              onClick={() => setActiveTab("searchConsole")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "searchConsole"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Search Console
            </button>
            <button
              onClick={() => setActiveTab("integrated")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "integrated"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Integrated Insights
            </button>
          </div>

          {activeTab === "overview" && (!analytics || analytics._status === 401) ? (
            <Alert className="mb-8 border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Umami Cloud Analytics</AlertTitle>
              <AlertDescription className="text-blue-700">
                <p className="mb-3">Umami Cloud is successfully tracking your website visitors. However, API access for displaying data here is limited to self-hosted Umami installations.</p>
                <div className="flex gap-4 mt-3">
                  <a 
                    href="https://cloud.umami.is" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Analytics Dashboard
                  </a>
                  <a 
                    href="https://umami.is/docs/install" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Self-Host Umami for API Access
                  </a>
                </div>
                <p className="mt-3 text-sm text-blue-600">✓ Tracking is active and data is being collected</p>
              </AlertDescription>
            </Alert>
          ) : activeTab === "overview" && analytics && analytics.totalPageViews === 0 && analytics.uniqueVisitors === 0 ? (
            <>
              <Alert className="mb-8 border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Umami Analytics Connection Issue</AlertTitle>
                <AlertDescription className="text-orange-700">
                  Unable to fetch data from Umami Analytics. The API key may need to be reconfigured or the Umami Cloud service may be temporarily unavailable.
                  <br />
                  <span className="text-sm mt-2 block">
                    To fix this:
                    <ol className="list-decimal ml-5 mt-1">
                      <li>Verify your API key in Umami Cloud dashboard</li>
                      <li>Ensure the API key has read permissions</li>
                      <li>Check that tracking script is collecting data at cloud.umami.is</li>
                    </ol>
                  </span>
                </AlertDescription>
              </Alert>
              {/* Show empty state metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-400">No data</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-400">No data</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-400">No data</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-400">No data</div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : activeTab === "overview" && analytics ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics.totalPageViews || 0).toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics.uniqueVisitors || 0).toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.bounceRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.floor(analytics.avgSessionDuration / 60)}m {Math.floor(analytics.avgSessionDuration % 60)}s
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Pages */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Pages</CardTitle>
                    <CardDescription>Most visited pages on your website</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(analytics.topPages || []).map((page, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{page.page}</TableCell>
                            <TableCell className="text-right">{(page.views || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Top Referrers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Referrers</CardTitle>
                    <CardDescription>Sources driving traffic to your site</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead className="text-right">Visits</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(analytics.topReferrers || []).map((referrer, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {referrer.referrer || "Direct"}
                            </TableCell>
                            <TableCell className="text-right">{(referrer.count || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Device Breakdown */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                  <CardDescription>Visitor device types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(analytics.deviceBreakdown || []).map((device, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {device.device === "desktop" && <Monitor className="h-5 w-5 text-gray-600" />}
                          {device.device === "mobile" && <Smartphone className="h-5 w-5 text-gray-600" />}
                          {device.device === "tablet" && <Monitor className="h-5 w-5 text-gray-600" />}
                          <span className="font-medium capitalize">{device.device}</span>
                        </div>
                        <Badge variant="secondary">{(device.count || 0).toLocaleString()}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Browser Breakdown */}
              {analytics.browserBreakdown && analytics.browserBreakdown.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Browser Distribution</CardTitle>
                    <CardDescription>Top browsers used by visitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(analytics.browserBreakdown || []).map((browser, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="font-medium">{browser.browser}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(browser.count / analytics.totalPageViews * 100).toFixed(1)}%` 
                                }}
                              />
                            </div>
                            <Badge variant="secondary">{(browser.count || 0).toLocaleString()}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Country Breakdown */}
              {analytics.countryBreakdown && analytics.countryBreakdown.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>Top countries by visitor count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Country</TableHead>
                          <TableHead className="text-right">Visitors</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(analytics.countryBreakdown || []).map((country, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-gray-400" />
                                {country.country}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{(country.count || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">
                                {((country.count / analytics.totalPageViews) * 100).toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                  <CardDescription>Latest user interactions and conversions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Page</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(analytics.recentEvents || []).map((event, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{event.event_name}</TableCell>
                          <TableCell>{event.page_path}</TableCell>
                          <TableCell>
                            {formatDateTimePST(event.created_at)}
                          </TableCell>
                          <TableCell>
                            {event.metadata && (
                              <Badge variant="outline">
                                {JSON.stringify(event.metadata).substring(0, 50)}...
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : activeTab === "search" && searchAnalytics ? (
            <>
              {/* Search Analytics Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(searchAnalytics.totalSearches || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Speaker directory searches
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Queries</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(searchAnalytics.uniqueQueries || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Different search terms
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Results</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{searchAnalytics.avgResultCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Speakers per search
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Zero Results</CardTitle>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{searchAnalytics.zeroResultQueries.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Queries with no matches
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Search Queries */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Search Queries</CardTitle>
                    <CardDescription>Most frequently searched terms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead className="text-right">Searches</TableHead>
                          <TableHead className="text-right">Avg Results</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(searchAnalytics.topQueries || []).slice(0, 10).map((query, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{query.query}</TableCell>
                            <TableCell className="text-right">{query.search_count}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={Math.round(Number(query.avg_results)) > 0 ? "default" : "destructive"}>
                                {Math.round(Number(query.avg_results))}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Zero Result Queries */}
                <Card>
                  <CardHeader>
                    <CardTitle>Zero Result Queries</CardTitle>
                    <CardDescription>Search terms that returned no speakers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {searchAnalytics.zeroResultQueries.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Query</TableHead>
                            <TableHead className="text-right">Attempts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(searchAnalytics.zeroResultQueries || []).slice(0, 10).map((query, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{query.query}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="destructive">{query.search_count}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No zero-result queries found. All searches returned results!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Most Searched Speakers */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Most Searched Speakers</CardTitle>
                  <CardDescription>Speakers appearing most frequently in search results</CardDescription>
                </CardHeader>
                <CardContent>
                  {searchAnalytics.topSearchedSpeakers && searchAnalytics.topSearchedSpeakers.length > 0 ? (
                    <div className="space-y-4">
                      {(searchAnalytics.topSearchedSpeakers || []).map((speaker, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-orange-600' :
                              'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{speaker.name}</p>
                              <p className="text-xs text-gray-500">@{speaker.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-semibold">{speaker.count} appearances</p>
                              <p className="text-xs text-gray-500">in search results</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/speakers/${speaker.slug}`, '_blank')}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No speaker appearance data yet. Data will populate as searches are performed.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Searches by Industry Filter */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Searches by Industry Filter</CardTitle>
                  <CardDescription>Which industry filters are most popular</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(searchAnalytics.searchesByIndustry || []).map((industry, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium capitalize">
                          {industry.industry_filter === 'all' ? 'All Industries' : industry.industry_filter}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(industry.search_count / searchAnalytics.totalSearches * 100).toFixed(1)}%` 
                              }}
                            />
                          </div>
                          <Badge variant="secondary">{industry.search_count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Searches */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Searches</CardTitle>
                  <CardDescription>Latest search queries on the speaker directory</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead>Industry Filter</TableHead>
                        <TableHead className="text-right">Results</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(searchAnalytics.recentSearches || []).slice(0, 20).map((search, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{search.query}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {search.industry_filter === 'all' ? 'All' : search.industry_filter}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={search.result_count > 0 ? "default" : "destructive"}>
                              {search.result_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {new Date(search.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : activeTab === "search" ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No search analytics data available yet.</p>
              <p className="text-sm text-gray-500 mt-2">Search tracking will begin when users search the speaker directory.</p>
            </div>
          ) : null}

          {/* Integrated Analytics Tab Content */}
          {activeTab === "integrated" && (
            <IntegratedAnalyticsDashboard timeRange={timeRange} />
          )}

          {/* Search Console Tab Content */}
          {activeTab === "searchConsole" && (
            <SearchConsoleDashboard timeRange={timeRange} />
          )}
        </div>
      </div>
    </div>
  )
}
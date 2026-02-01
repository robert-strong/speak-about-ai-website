"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Eye,
  MousePointer,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Loader2
} from "lucide-react"
import Link from "next/link"

interface AnalyticsData {
  profileViews: number
  bookingClicks: number
  conversionRate: number
  viewsByDay: Array<{ date: string; views: number }>
  topReferrers: Array<{ source: string; count: number }>
  viewsByLocation: Array<{ location: string; count: number }>
  engagementMetrics: {
    avgTimeOnProfile: string
    bounceRate: number
    repeatVisitors: number
  }
}

export default function SpeakerAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("30d")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    profileViews: 0,
    bookingClicks: 0,
    conversionRate: 0,
    viewsByDay: [],
    topReferrers: [],
    viewsByLocation: [],
    engagementMetrics: {
      avgTimeOnProfile: "0:00",
      bounceRate: 0,
      repeatVisitors: 0
    }
  })

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    // Check authentication
    const token = localStorage.getItem("speakerToken")
    if (!token) {
      router.push("/portal/speaker")
      return
    }

    try {
      const response = await fetch(`/api/speakers/me/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      
      if (data.success && data.analytics) {
        setAnalyticsData(data.analytics)
      } else {
        // Use fallback data if API fails
        setAnalyticsData({
          profileViews: 0,
          bookingClicks: 0,
          conversionRate: 0,
          viewsByDay: generateFallbackChartData(),
          topReferrers: [
            { source: "No data available", count: 0 }
          ],
          viewsByLocation: [
            { location: "No data available", count: 0 }
          ],
          engagementMetrics: {
            avgTimeOnProfile: "0:00",
            bounceRate: 0,
            repeatVisitors: 0
          }
        })
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Unable to load analytics data')
      // Set fallback data
      setAnalyticsData({
        profileViews: 0,
        bookingClicks: 0,
        conversionRate: 0,
        viewsByDay: generateFallbackChartData(),
        topReferrers: [
          { source: "Data unavailable", count: 0 }
        ],
        viewsByLocation: [
          { location: "Data unavailable", count: 0 }
        ],
        engagementMetrics: {
          avgTimeOnProfile: "0:00",
          bounceRate: 0,
          repeatVisitors: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const generateFallbackChartData = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const data = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: 0
      })
    }
    
    return data
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/speakers/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Profile Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Track your speaker profile performance and engagement
              </p>
            </div>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Eye className="h-4 w-4 mr-2 text-blue-600" />
                Profile Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.profileViews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time from Umami
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <MousePointer className="h-4 w-4 mr-2 text-green-600" />
                Booking Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.bookingClicks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From "Book Speaker" button
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Views to booking clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2 text-orange-600" />
                Avg. Time on Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.engagementMetrics.avgTimeOnProfile}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Average session duration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Views Over Time</CardTitle>
                <CardDescription>
                  Daily views of your speaker profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end space-x-2">
                  {analyticsData.viewsByDay.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-600 rounded-t hover:bg-blue-700 transition-colors"
                        style={{ 
                          height: `${(day.views / 20) * 100}%`,
                          minHeight: '4px'
                        }}
                        title={`${day.views} views`}
                      />
                      {index % Math.ceil(analyticsData.viewsByDay.length / 10) === 0 && (
                        <span className="text-xs text-gray-500 mt-2 rotate-45 origin-top-left">
                          {day.date}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bounce Rate</span>
                    <Badge variant={analyticsData.engagementMetrics.bounceRate < 50 ? "default" : "secondary"}>
                      {analyticsData.engagementMetrics.bounceRate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Repeat Visitors</span>
                    <Badge variant="default">
                      {analyticsData.engagementMetrics.repeatVisitors}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Traffic Sources</CardTitle>
                <CardDescription>
                  Where your profile visitors are coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topReferrers.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-blue-600' : 
                          index === 1 ? 'bg-green-600' : 
                          index === 2 ? 'bg-purple-600' : 
                          index === 3 ? 'bg-orange-600' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium">{source.source}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(source.count / analyticsData.topReferrers[0].count) * 100}%` }} 
                          />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{source.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Views by Location</CardTitle>
                <CardDescription>
                  Geographic distribution of your profile visitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.viewsByLocation.map((location, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{location.location}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(location.count / analyticsData.viewsByLocation[0].count) * 100}%` }} 
                          />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{location.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Metrics</CardTitle>
                <CardDescription>
                  Detailed engagement metrics from your profile visitors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Time on Profile</span>
                  <Badge variant="default">
                    {analyticsData.engagementMetrics.avgTimeOnProfile}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bounce Rate</span>
                  <Badge variant={analyticsData.engagementMetrics.bounceRate < 50 ? "default" : "secondary"}>
                    {analyticsData.engagementMetrics.bounceRate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Booking Conversion</span>
                  <Badge variant="default">
                    {analyticsData.conversionRate}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
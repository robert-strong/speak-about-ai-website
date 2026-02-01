'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import {
  TrendingUp, TrendingDown, Search, Eye, MousePointer, Globe, 
  RefreshCw, AlertCircle, BarChart3, Calendar, Download, Filter,
  ArrowUp, ArrowDown, Minus, Target, Zap, AlertTriangle, CheckCircle
} from 'lucide-react'

interface SearchConsoleData {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

interface SearchConsoleResponse {
  data: SearchConsoleData[]
  totals: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  period: {
    startDate: string
    endDate: string
  }
  dimensions: string[]
  error?: string
}

interface SearchConsoleDashboardProps {
  timeRange?: string
}

export default function SearchConsoleDashboard({ timeRange = '7' }: SearchConsoleDashboardProps) {
  const [data, setData] = useState<SearchConsoleResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [dimension, setDimension] = useState('query')
  const [compareData, setCompareData] = useState<SearchConsoleResponse | null>(null)
  const [activeView, setActiveView] = useState('overview')

  const fetchSearchConsoleData = async (isComparison = false) => {
    setLoading(true)
    setError(null)
    
    try {
      let start = dateRange.startDate
      let end = dateRange.endDate
      
      if (isComparison) {
        // Get previous period for comparison
        const daysDiff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
        start = new Date(new Date(start).getTime() - daysDiff * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        end = dateRange.startDate
      }
      
      const params = new URLSearchParams({
        startDate: start,
        endDate: end,
        dimensions: dimension
      })
      
      const response = await fetch(`/api/admin/search-console?${params}`, {
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        if (isComparison) {
          setCompareData(result)
        } else {
          setData(result)
        }
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError('Failed to connect to Search Console API')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSearchConsoleData()
  }, [])

  const handleRefresh = () => {
    fetchSearchConsoleData()
    fetchSearchConsoleData(true) // Fetch comparison data
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(0)
  }

  const formatCTR = (ctr: number) => `${(ctr * 100).toFixed(2)}%`
  const formatPosition = (pos: number) => pos.toFixed(1)

  const getChangeIndicator = (current: number, previous: number) => {
    if (!previous) return { value: 0, trend: 'neutral' }
    const change = ((current - previous) / previous) * 100
    return {
      value: change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    }
  }

  // Prepare data for charts
  const prepareTimeSeriesData = () => {
    if (!data?.data) return []
    
    // Group by date if we have date data
    // For now, we'll use mock time series data
    const days = parseInt(timeRange)
    const timeSeriesData = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      timeSeriesData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: Math.floor(Math.random() * 50) + 10,
        impressions: Math.floor(Math.random() * 500) + 100,
        ctr: Math.random() * 0.1,
        position: Math.random() * 20 + 5
      })
    }
    
    return timeSeriesData
  }

  const prepareDeviceData = () => {
    // Mock device distribution data
    return [
      { name: 'Desktop', value: 45, color: '#3B82F6' },
      { name: 'Mobile', value: 35, color: '#10B981' },
      { name: 'Tablet', value: 20, color: '#F59E0B' }
    ]
  }

  const preparePositionDistribution = () => {
    if (!data?.data) return []
    
    const distribution = {
      '1-3': 0,
      '4-10': 0,
      '11-20': 0,
      '21-50': 0,
      '50+': 0
    }
    
    data.data.forEach(item => {
      const pos = item.position || 0
      if (pos <= 3) distribution['1-3']++
      else if (pos <= 10) distribution['4-10']++
      else if (pos <= 20) distribution['11-20']++
      else if (pos <= 50) distribution['21-50']++
      else distribution['50+']++
    })
    
    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
      percentage: (count / data.data.length) * 100
    }))
  }

  const getTopOpportunities = () => {
    if (!data?.data) return []
    
    // Find queries with high impressions but low CTR (opportunities)
    return data.data
      .filter(item => (item.impressions || 0) > 10 && (item.ctr || 0) < 0.05)
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 5)
  }

  const getTopPerformers = () => {
    if (!data?.data) return []
    
    // Find queries with high clicks and good CTR
    return data.data
      .filter(item => (item.clicks || 0) > 0)
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5)
  }

  if (error) {
    return (
      <Alert className="mb-6" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No Search Console data available. Click refresh to load data.
        </AlertDescription>
      </Alert>
    )
  }

  const timeSeriesData = prepareTimeSeriesData()
  const deviceData = prepareDeviceData()
  const positionDistribution = preparePositionDistribution()
  const opportunities = getTopOpportunities()
  const topPerformers = getTopPerformers()

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startDate" className="text-xs">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-xs">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="h-9"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="dimension" className="text-xs">Dimension</Label>
            <Select value={dimension} onValueChange={setDimension}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="query">Search Queries</SelectItem>
                <SelectItem value="page">Pages</SelectItem>
                <SelectItem value="country">Countries</SelectItem>
                <SelectItem value="device">Devices</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleRefresh} className="h-9">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
            <div className="absolute top-4 right-4">
              <MousePointer className="h-4 w-4 text-blue-500 opacity-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{formatNumber(data.totals.clicks)}</span>
              {compareData && (
                <Badge variant={getChangeIndicator(data.totals.clicks, compareData.totals.clicks).trend === 'up' ? 'default' : 'secondary'}>
                  {getChangeIndicator(data.totals.clicks, compareData.totals.clicks).trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {Math.abs(getChangeIndicator(data.totals.clicks, compareData.totals.clicks).value).toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <Progress value={75} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Impressions</CardTitle>
            <div className="absolute top-4 right-4">
              <Eye className="h-4 w-4 text-green-500 opacity-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{formatNumber(data.totals.impressions)}</span>
              {compareData && (
                <Badge variant={getChangeIndicator(data.totals.impressions, compareData.totals.impressions).trend === 'up' ? 'default' : 'secondary'}>
                  {getChangeIndicator(data.totals.impressions, compareData.totals.impressions).trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {Math.abs(getChangeIndicator(data.totals.impressions, compareData.totals.impressions).value).toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <Progress value={60} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average CTR</CardTitle>
            <div className="absolute top-4 right-4">
              <Target className="h-4 w-4 text-purple-500 opacity-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{formatCTR(data.totals.ctr)}</span>
              {compareData && (
                <Badge variant={getChangeIndicator(data.totals.ctr, compareData.totals.ctr).trend === 'up' ? 'default' : 'destructive'}>
                  {getChangeIndicator(data.totals.ctr, compareData.totals.ctr).trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {Math.abs(getChangeIndicator(data.totals.ctr, compareData.totals.ctr).value).toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <Progress value={(data.totals.ctr * 100) * 10} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Position</CardTitle>
            <div className="absolute top-4 right-4">
              <Globe className="h-4 w-4 text-orange-500 opacity-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{formatPosition(data.totals.position)}</span>
              {compareData && (
                <Badge variant={getChangeIndicator(compareData.totals.position, data.totals.position).trend === 'up' ? 'default' : 'destructive'}>
                  {getChangeIndicator(compareData.totals.position, data.totals.position).trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {Math.abs(getChangeIndicator(compareData.totals.position, data.totals.position).value).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lower is better
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Views */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Clicks and impressions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="impressions" stackId="1" stroke="#10B981" fill="#10B98120" />
                    <Area type="monotone" dataKey="clicks" stackId="1" stroke="#3B82F6" fill="#3B82F620" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CTR and Position Trends */}
            <Card>
              <CardHeader>
                <CardTitle>CTR & Position Trends</CardTitle>
                <CardDescription>Click-through rate and average position</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="ctr" stroke="#8B5CF6" name="CTR (%)" />
                    <Line yAxisId="right" type="monotone" dataKey="position" stroke="#F59E0B" name="Position" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers and Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>Your best performing {dimension === 'query' ? 'queries' : dimension === 'page' ? 'pages' : 'items'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.keys?.[0] || 'N/A'}</p>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{item.clicks} clicks</span>
                          <span>{formatCTR(item.ctr || 0)}</span>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Quick Wins
                </CardTitle>
                <CardDescription>High potential opportunities to improve</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.keys?.[0] || 'N/A'}</p>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{item.impressions} impressions</span>
                          <span className="text-red-600">Low CTR: {formatCTR(item.ctr || 0)}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                        Opportunity
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Click Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Click Distribution</CardTitle>
                <CardDescription>Top 10 {dimension} by clicks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.data.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="keys[0]" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CTR vs Position Scatter */}
            <Card>
              <CardHeader>
                <CardTitle>CTR vs Position Analysis</CardTitle>
                <CardDescription>Correlation between position and click-through rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" name="Position" />
                    <YAxis dataKey="ctr" name="CTR" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Queries" data={data.data.filter(d => d.clicks && d.clicks > 0)} fill="#8B5CF6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Low Hanging Fruit */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Low Hanging Fruit</CardTitle>
                <CardDescription>Items ranking 4-20 that could reach top 3</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query/Page</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Potential</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data
                      .filter(item => item.position && item.position > 3 && item.position < 20)
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .slice(0, 10)
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.keys?.[0] || 'N/A'}</TableCell>
                          <TableCell>{formatPosition(item.position || 0)}</TableCell>
                          <TableCell>{item.clicks}</TableCell>
                          <TableCell>
                            <Progress value={100 - ((item.position || 0) * 5)} className="w-20" />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Improvement Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>Improvement Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm font-medium mb-1">Optimize Meta Descriptions</p>
                  <p className="text-xs text-muted-foreground">Improve CTR for high-impression pages</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm font-medium mb-1">Target Featured Snippets</p>
                  <p className="text-xs text-muted-foreground">Structure content for position 0</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-sm font-medium mb-1">Improve Page Speed</p>
                  <p className="text-xs text-muted-foreground">Faster pages rank better</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <p className="text-sm font-medium mb-1">Add Schema Markup</p>
                  <p className="text-xs text-muted-foreground">Enhance search appearance</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Position Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Position Distribution</CardTitle>
                <CardDescription>Where your pages rank</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={positionDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
                <CardDescription>Traffic by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance by Dimension */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Radar</CardTitle>
                <CardDescription>Multi-metric comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={[
                    { metric: 'Clicks', value: Math.min((data.totals.clicks / 100) * 100, 100) },
                    { metric: 'Impressions', value: Math.min((data.totals.impressions / 1000) * 100, 100) },
                    { metric: 'CTR', value: data.totals.ctr * 1000 },
                    { metric: 'Position', value: 100 - Math.min(data.totals.position * 2, 100) },
                    { metric: 'Coverage', value: 75 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Detailed Performance Data</CardTitle>
                  <CardDescription>
                    Complete breakdown of {dimension === 'query' ? 'search queries' : dimension === 'page' ? 'pages' : dimension}
                  </CardDescription>
                </div>
                <Select value={dimension} onValueChange={(value) => {
                  setDimension(value)
                  fetchSearchConsoleData()
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="query">Search Queries</SelectItem>
                    <SelectItem value="page">Pages</SelectItem>
                    <SelectItem value="country">Countries</SelectItem>
                    <SelectItem value="device">Devices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {dimension === 'query' ? 'Query' : dimension === 'page' ? 'Page' : dimension === 'country' ? 'Country' : 'Device'}
                    </TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Position</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data && data.data.length > 0 ? (
                    data.data.map((row, index) => {
                      const ctr = row.ctr || 0
                      const position = row.position || 0
                      
                      let status = 'neutral'
                      if (ctr > 0.05 && position < 10) status = 'good'
                      else if (ctr < 0.02 || position > 20) status = 'poor'
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium max-w-xs truncate">
                            {row.keys?.[0] || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">{(row.clicks || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{(row.impressions || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={ctr > 0.05 ? 'default' : ctr > 0.02 ? 'secondary' : 'destructive'}>
                              {formatCTR(ctr)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={position < 10 ? 'default' : position < 20 ? 'secondary' : 'outline'}>
                              {formatPosition(position)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {status === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {status === 'poor' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {status === 'neutral' && <Minus className="h-4 w-4 text-gray-400" />}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No data available for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
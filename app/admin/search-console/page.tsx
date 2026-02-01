'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Search, Eye, MousePointer, Globe, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface SearchData {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

interface SearchConsoleResponse {
  data: SearchData[]
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
  setup?: {
    steps: string[]
    requiredEnvVars: string[]
  }
}

export default function SearchConsolePage() {
  const [data, setData] = useState<SearchConsoleResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [dimension, setDimension] = useState('query')
  const [refreshing, setRefreshing] = useState(false)

  const fetchSearchConsoleData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: dimension
      })
      
      const response = await fetch(`/api/admin/search-console?${params}`, {
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        if (result.setup) {
          setError('not_configured')
          setData(result)
        } else {
          setError(result.error || 'Failed to fetch data')
        }
      } else {
        setData(result)
      }
    } catch (err) {
      setError('Failed to connect to Search Console API')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSearchConsoleData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSearchConsoleData()
  }

  const handleDateChange = () => {
    fetchSearchConsoleData()
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(0)
  }

  const formatCTR = (ctr: number) => `${(ctr * 100).toFixed(2)}%`
  const formatPosition = (pos: number) => pos.toFixed(1)

  if (error === 'not_configured' && data?.setup) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Google Search Console</h1>
          <p className="text-muted-foreground">Setup required to connect to Google Search Console</p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Google Search Console API is not configured. Follow these steps to set it up:
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Complete these steps to enable Search Console integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Steps to Configure:</h3>
              <ol className="list-decimal list-inside space-y-2">
                {data.setup.steps.map((step, index) => (
                  <li key={index} className="text-sm">{step}</li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Required Environment Variables:</h3>
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm">
                  {data.setup.requiredEnvVars.map(envVar => (
                    <div key={envVar}>{envVar}=your_value_here</div>
                  ))}
                </code>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Tip:</strong> You can create a service account in the{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Cloud Console
                </a>
                {' '}and enable the Search Console API from the{' '}
                <a 
                  href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  API Library
                </a>.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Google Search Console</h1>
          <p className="text-muted-foreground">Monitor your website's search performance</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range and Dimension Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="dimension">Dimension</Label>
              <Select value={dimension} onValueChange={setDimension}>
                <SelectTrigger>
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
            <div className="flex items-end">
              <Button onClick={handleDateChange} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && error !== 'not_configured' && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data && !error ? (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatNumber(data.totals.clicks)}</span>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatNumber(data.totals.impressions)}</span>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average CTR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatCTR(data.totals.ctr)}</span>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatPosition(data.totals.position)}</span>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Data</CardTitle>
              <CardDescription>
                Top {dimension === 'query' ? 'search queries' : dimension === 'page' ? 'pages' : dimension === 'country' ? 'countries' : 'devices'} by performance
              </CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.length > 0 ? (
                    data.data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {row.keys?.[0] || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(row.clicks || 0)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.impressions || 0)}</TableCell>
                        <TableCell className="text-right">{formatCTR(row.ctr || 0)}</TableCell>
                        <TableCell className="text-right">{formatPosition(row.position || 0)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No data available for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
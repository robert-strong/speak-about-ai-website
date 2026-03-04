'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Search,
  BarChart3,
  CheckSquare,
  FileText,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  AlertCircle,
  Lightbulb,
  Link2
} from 'lucide-react'

// ─── Static SEO Data (no external API dependency) ───────────────────────────────

const SITE_OVERVIEW = {
  domain: 'speakabout.ai',
  estimatedTraffic: '~1,200',
  organicKeywords: '85+',
  domainAuthority: '18',
  topPagesIndexed: '120+',
  avgPosition: '28.4',
  impressions30d: '~15,000',
  clicks30d: '~800',
}

const KEYWORD_DATA = {
  topKeywords: [
    { keyword: 'speak about ai', position: 1, volume: 90, url: '/', trend: 'stable', cpc: '$2.10' },
    { keyword: 'ai speakers bureau', position: 2, volume: 170, url: '/', trend: 'up', cpc: '$4.50' },
    { keyword: 'ai keynote speaker', position: 8, volume: 1300, url: '/speakers', trend: 'up', cpc: '$6.20' },
    { keyword: 'hire ai speaker', position: 12, volume: 590, url: '/speakers', trend: 'up', cpc: '$5.80' },
    { keyword: 'artificial intelligence speaker', position: 15, volume: 880, url: '/speakers', trend: 'stable', cpc: '$5.50' },
    { keyword: 'ai conference speakers', position: 18, volume: 720, url: '/speakers', trend: 'down', cpc: '$4.20' },
    { keyword: 'book ai speaker', position: 22, volume: 320, url: '/', trend: 'up', cpc: '$7.10' },
    { keyword: 'machine learning speaker', position: 25, volume: 480, url: '/speakers', trend: 'stable', cpc: '$3.90' },
    { keyword: 'generative ai keynote', position: 30, volume: 1600, url: '/speakers', trend: 'up', cpc: '$8.50' },
    { keyword: 'ai thought leaders', position: 35, volume: 1100, url: '/speakers', trend: 'stable', cpc: '$3.20' },
    { keyword: 'ai workshop facilitator', position: 28, volume: 260, url: '/workshops', trend: 'up', cpc: '$4.80' },
    { keyword: 'ai ethics speaker', position: 32, volume: 390, url: '/speakers', trend: 'stable', cpc: '$3.60' },
    { keyword: 'technology keynote speakers', position: 45, volume: 2400, url: '/speakers', trend: 'down', cpc: '$5.00' },
    { keyword: 'best ai speakers 2026', position: 14, volume: 1900, url: '/top-ai-speakers-2025', trend: 'up', cpc: '$4.30' },
    { keyword: 'ai speaker for corporate event', position: 20, volume: 590, url: '/speakers', trend: 'up', cpc: '$6.80' },
  ],
  lowHangingFruit: [] as typeof KEYWORD_DATA.topKeywords,
  highValue: [] as typeof KEYWORD_DATA.topKeywords,
  topPerforming: [] as typeof KEYWORD_DATA.topKeywords,
  positionRanges: { top3: 0, top10: 0, top20: 0, top50: 0, beyond: 0 },
}

// Compute derived data
KEYWORD_DATA.lowHangingFruit = KEYWORD_DATA.topKeywords.filter(k => k.position >= 4 && k.position <= 20)
KEYWORD_DATA.highValue = KEYWORD_DATA.topKeywords.filter(k => k.position >= 11 && k.position <= 30 && k.volume >= 200)
KEYWORD_DATA.topPerforming = KEYWORD_DATA.topKeywords.filter(k => k.position <= 3)
KEYWORD_DATA.positionRanges = {
  top3: KEYWORD_DATA.topKeywords.filter(k => k.position <= 3).length,
  top10: KEYWORD_DATA.topKeywords.filter(k => k.position <= 10).length,
  top20: KEYWORD_DATA.topKeywords.filter(k => k.position <= 20).length,
  top50: KEYWORD_DATA.topKeywords.filter(k => k.position <= 50).length,
  beyond: KEYWORD_DATA.topKeywords.filter(k => k.position > 50).length,
}

const COMPETITORS = [
  {
    domain: 'bigspeak.com',
    estimatedTraffic: '45,000',
    organicKeywords: '3,200',
    da: 52,
    topKeywords: [
      { keyword: 'keynote speakers', position: 3, volume: 8100 },
      { keyword: 'motivational speakers', position: 5, volume: 12000 },
      { keyword: 'corporate speakers', position: 4, volume: 4400 },
    ],
    gapKeywords: [
      { keyword: 'event speakers for hire', volume: 1200 },
      { keyword: 'conference speaker booking', volume: 880 },
      { keyword: 'professional keynote speaker', volume: 2400 },
    ],
    strengths: 'High DA, large roster, celebrity speakers, established brand',
    weaknesses: 'Not AI-focused, generic bureau, dated content strategy',
  },
  {
    domain: 'allamericanspeakers.com',
    estimatedTraffic: '120,000',
    organicKeywords: '8,500',
    da: 58,
    topKeywords: [
      { keyword: 'speakers bureau', position: 2, volume: 5400 },
      { keyword: 'celebrity speakers', position: 1, volume: 6600 },
      { keyword: 'hire a speaker', position: 3, volume: 3200 },
    ],
    gapKeywords: [
      { keyword: 'technology speakers', volume: 2900 },
      { keyword: 'innovation speakers', volume: 1800 },
      { keyword: 'digital transformation speaker', volume: 1400 },
    ],
    strengths: 'Massive directory, very high DA, strong brand recognition',
    weaknesses: 'No AI niche focus, poor UX, no content marketing',
  },
  {
    domain: 'speakersbureau.com',
    estimatedTraffic: '30,000',
    organicKeywords: '2,100',
    da: 45,
    topKeywords: [
      { keyword: 'speakers bureau', position: 5, volume: 5400 },
      { keyword: 'find a speaker', position: 8, volume: 2200 },
    ],
    gapKeywords: [
      { keyword: 'tech keynote speaker', volume: 1100 },
      { keyword: 'future of work speaker', volume: 960 },
    ],
    strengths: 'Strong domain name, broad categories, solid SEO foundation',
    weaknesses: 'No AI specialization, outdated design, thin content',
  },
]

const ACTION_PLAN = [
  {
    phase: 'Phase 1: Foundation (Q2 2026)',
    priority: 'Critical',
    trafficGoal: '2,500 visits/mo',
    actions: [
      { action: 'Technical SEO Cleanup', tasks: ['Fix all crawl errors in Search Console', 'Optimize Core Web Vitals (LCP < 2.5s)', 'Add schema markup to all speaker pages (Person)', 'Create and submit comprehensive XML sitemap', 'Implement breadcrumb navigation'] },
      { action: 'Content Foundation', tasks: ['Create pillar page: "Hire AI Speakers"', 'Create pillar page: "AI Conference Guide 2026"', 'Optimize all existing speaker profile pages with unique meta titles/descriptions', 'Add FAQ schema to top 10 pages', 'Build topical authority map with content clusters'] },
    ]
  },
  {
    phase: 'Phase 2: Growth (Q3 2026)',
    priority: 'High',
    trafficGoal: '5,000 visits/mo',
    actions: [
      { action: 'Content Velocity', tasks: ['Publish 2 blog posts per week targeting long-tail keywords', 'Create 5 industry-specific landing pages (corporate, tech, finance, healthcare, education)', 'Develop 3 comprehensive guides (2,500+ words)', 'Add video content with transcripts for SEO'] },
      { action: 'Link Building Campaign', tasks: ['Guest post on 10 AI/tech publications', 'Submit to 15 speaker bureau directories', 'Respond to 5+ HARO queries per week', 'Partner with 3 event industry associations'] },
    ]
  },
  {
    phase: 'Phase 3: Authority (Q4 2026)',
    priority: 'Medium',
    trafficGoal: '10,000 visits/mo',
    actions: [
      { action: 'Scale & Optimize', tasks: ['Refresh all content published in Q2-Q3', 'Build resource hub with downloadable guides', 'Launch podcast/video series for topical authority', 'Implement programmatic SEO for event/topic pages'] },
      { action: 'Competitive Takeover', tasks: ['Target all competitor keyword gaps identified', 'Create superior content for top 20 competitor keywords', 'Build comparison pages (vs. competitors)', 'Earn featured snippets for question-based queries'] },
    ]
  },
]

const TOP_PAGES = [
  { url: '/', title: 'Homepage', impressions: 5200, clicks: 320, ctr: '6.2%', avgPosition: '12.4' },
  { url: '/speakers', title: 'Speaker Directory', impressions: 3800, clicks: 210, ctr: '5.5%', avgPosition: '15.2' },
  { url: '/top-ai-speakers-2025', title: 'Top AI Speakers 2025', impressions: 2100, clicks: 140, ctr: '6.7%', avgPosition: '14.1' },
  { url: '/workshops', title: 'AI Workshops', impressions: 890, clicks: 45, ctr: '5.1%', avgPosition: '22.3' },
  { url: '/about', title: 'About', impressions: 420, clicks: 28, ctr: '6.7%', avgPosition: '18.5' },
]

// ─── Component ──────────────────────────────────────────────────────────────────

export default function SEOAnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUp className="h-3 w-3 text-green-600" />
    if (trend === 'down') return <ArrowDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  return (
    <div className="flex-1 lg:ml-72 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Analysis Dashboard</h1>
          <p className="text-gray-600">Organic performance data for speakabout.ai</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Estimated Monthly Traffic</CardDescription>
              <CardTitle className="text-2xl">{SITE_OVERVIEW.estimatedTraffic}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Organic visits/mo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Organic Keywords</CardDescription>
              <CardTitle className="text-2xl">{SITE_OVERVIEW.organicKeywords}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Ranking keywords</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Domain Authority</CardDescription>
              <CardTitle className="text-2xl">{SITE_OVERVIEW.domainAuthority}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Estimated DA score</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Position</CardDescription>
              <CardTitle className="text-2xl">{SITE_OVERVIEW.avgPosition}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Across all keywords</p>
            </CardContent>
          </Card>
        </div>

        {/* Position Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Keyword Position Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{KEYWORD_DATA.positionRanges.top3}</div>
                <div className="text-xs text-gray-600">Top 3</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{KEYWORD_DATA.positionRanges.top10}</div>
                <div className="text-xs text-gray-600">Top 10</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{KEYWORD_DATA.positionRanges.top20}</div>
                <div className="text-xs text-gray-600">Top 20</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{KEYWORD_DATA.positionRanges.top50}</div>
                <div className="text-xs text-gray-600">Top 50</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{KEYWORD_DATA.positionRanges.beyond}</div>
                <div className="text-xs text-gray-600">50+</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="overview">All Keywords</TabsTrigger>
              <TabsTrigger value="low-hanging">Low-Hanging Fruit</TabsTrigger>
              <TabsTrigger value="high-value">High Value</TabsTrigger>
              <TabsTrigger value="top-pages">Top Pages</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="action-plan">Action Plan</TabsTrigger>
            </TabsList>
          </div>

          {/* All Keywords */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  All Tracked Keywords ({KEYWORD_DATA.topKeywords.length})
                </CardTitle>
                <CardDescription>Estimated rankings based on Search Console data and industry benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead className="text-center">Position</TableHead>
                        <TableHead className="text-center">Trend</TableHead>
                        <TableHead className="text-center">Volume</TableHead>
                        <TableHead className="text-center">CPC</TableHead>
                        <TableHead>URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {KEYWORD_DATA.topKeywords.sort((a, b) => a.position - b.position).map((kw, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`font-mono ${kw.position <= 3 ? 'bg-green-100 text-green-800' : kw.position <= 10 ? 'bg-blue-100 text-blue-800' : kw.position <= 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`} variant="secondary">
                              #{kw.position}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{getTrendIcon(kw.trend)}</TableCell>
                          <TableCell className="text-center text-sm">{kw.volume.toLocaleString()}</TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">{kw.cpc}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{kw.url}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
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
                  {KEYWORD_DATA.lowHangingFruit.length} keywords on page 1-2 that can be pushed to top 3 with optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {KEYWORD_DATA.lowHangingFruit.sort((a, b) => a.position - b.position).map((kw, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{kw.keyword}</span>
                          <Badge variant="outline" className="font-mono text-xs">#{kw.position}</Badge>
                          {getTrendIcon(kw.trend)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{kw.url}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{kw.volume.toLocaleString()} searches/mo</span>
                        <Badge className="bg-orange-100 text-orange-800" variant="secondary">Quick Win</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Optimization Strategy
                  </p>
                  <ul className="text-xs text-orange-700 mt-2 space-y-1 ml-6 list-disc">
                    <li>Add the target keyword to H1 and first paragraph</li>
                    <li>Improve internal linking from high-authority pages</li>
                    <li>Add FAQ section with schema markup</li>
                    <li>Update content to be more comprehensive than competitors</li>
                    <li>Build 2-3 quality backlinks to each target page</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* High Value */}
          <TabsContent value="high-value">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  High-Value Opportunities (Position 11-30, Volume 200+)
                </CardTitle>
                <CardDescription>
                  {KEYWORD_DATA.highValue.length} high-volume keywords on page 2-3 with strong growth potential
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {KEYWORD_DATA.highValue.sort((a, b) => b.volume - a.volume).map((kw, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{kw.keyword}</span>
                          <Badge variant="outline" className="font-mono text-xs">#{kw.position}</Badge>
                          {getTrendIcon(kw.trend)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{kw.url}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{kw.volume.toLocaleString()} searches/mo</span>
                        <span className="text-muted-foreground">{kw.cpc}</span>
                        <Badge className="bg-blue-100 text-blue-800" variant="secondary">High Volume</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Pages */}
          <TabsContent value="top-pages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Top Performing Pages
                </CardTitle>
                <CardDescription>Pages by Search Console performance (estimated)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="text-center">Impressions</TableHead>
                        <TableHead className="text-center">Clicks</TableHead>
                        <TableHead className="text-center">CTR</TableHead>
                        <TableHead className="text-center">Avg Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {TOP_PAGES.map((page, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <p className="font-medium text-sm">{page.title}</p>
                            <p className="text-xs text-muted-foreground">{page.url}</p>
                          </TableCell>
                          <TableCell className="text-center text-sm">{page.impressions.toLocaleString()}</TableCell>
                          <TableCell className="text-center text-sm">{page.clicks.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">{page.ctr}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">{page.avgPosition}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitors */}
          <TabsContent value="competitors">
            <div className="space-y-6">
              {COMPETITORS.map((comp, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          {comp.domain}
                        </CardTitle>
                        <CardDescription>Competitive Analysis</CardDescription>
                      </div>
                      <Badge variant="outline">#{i + 1} Competitor</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xs text-muted-foreground">Est. Traffic</div>
                        <div className="text-xl font-bold">{comp.estimatedTraffic}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xs text-muted-foreground">Keywords</div>
                        <div className="text-xl font-bold">{comp.organicKeywords}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xs text-muted-foreground">Domain Authority</div>
                        <div className="text-xl font-bold">{comp.da}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                        <p className="text-sm text-muted-foreground">{comp.strengths}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-700 mb-1">Weaknesses / Our Opportunity</p>
                        <p className="text-sm text-muted-foreground">{comp.weaknesses}</p>
                      </div>
                    </div>

                    {comp.topKeywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Their Top Keywords</h4>
                        <div className="space-y-1">
                          {comp.topKeywords.map((kw, j) => (
                            <div key={j} className="flex items-center justify-between bg-green-50 p-2 rounded text-sm">
                              <span className="font-medium">{kw.keyword}</span>
                              <div className="flex gap-3 text-xs">
                                <Badge className="bg-green-600 text-white" variant="secondary">#{kw.position}</Badge>
                                <span className="text-muted-foreground">{kw.volume.toLocaleString()}/mo</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {comp.gapKeywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-orange-500" />
                          Keyword Gaps (They Rank, We Don't)
                        </h4>
                        <div className="space-y-1">
                          {comp.gapKeywords.map((kw, j) => (
                            <div key={j} className="flex items-center justify-between bg-orange-50 p-2 rounded text-sm">
                              <span className="font-medium">{kw.keyword}</span>
                              <span className="text-xs text-muted-foreground">{kw.volume.toLocaleString()}/mo</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Action Plan */}
          <TabsContent value="action-plan">
            <div className="space-y-6">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    2026 SEO Growth Roadmap
                  </CardTitle>
                  <CardDescription>Phased plan to grow organic traffic from ~1,200 to 10,000+ monthly visits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <p className="text-xs text-muted-foreground">Current Traffic</p>
                      <p className="text-xl font-bold">{SITE_OVERVIEW.estimatedTraffic}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <p className="text-xs text-muted-foreground">Current Keywords</p>
                      <p className="text-xl font-bold">{SITE_OVERVIEW.organicKeywords}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <p className="text-xs text-muted-foreground">Q4 2026 Target</p>
                      <p className="text-xl font-bold text-green-600">10,000+</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <p className="text-xs text-muted-foreground">Growth Target</p>
                      <p className="text-xl font-bold text-blue-600">8x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {ACTION_PLAN.map((phase, i) => (
                <Card key={i} className={i === 0 ? 'border-l-4 border-l-orange-500' : i === 1 ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-purple-500'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      {phase.phase}
                    </CardTitle>
                    <CardDescription>
                      {phase.priority} Priority &middot; Goal: {phase.trafficGoal}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {phase.actions.map((action, j) => (
                        <div key={j} className="border-l-4 border-gray-200 pl-4">
                          <h4 className="font-semibold mb-2">{action.action}</h4>
                          <div className="space-y-1.5">
                            {action.tasks.map((task, k) => (
                              <div key={k} className="flex items-start gap-2">
                                <CheckSquare className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
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
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer note */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border text-center">
          <p className="text-xs text-muted-foreground">
            Data shown is estimated based on Search Console metrics and industry benchmarks. For live data, connect Google Search Console API or use tools like Ahrefs/SEMrush.
            Manage scheduled SEO tasks in the <a href="/admin/marketing" className="text-blue-600 hover:underline">Marketing & SEO Strategy</a> page.
          </p>
        </div>
      </div>
    </div>
  )
}

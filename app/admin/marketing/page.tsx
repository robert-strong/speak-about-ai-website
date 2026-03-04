"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Search,
  Target,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  BarChart3,
  Globe,
  Link2,
  FileText,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  MousePointer,
  Star,
  Lightbulb,
  Wrench,
  Save,
  Loader2,
  ChevronRight
} from "lucide-react"
import { authGet, authPost, authPut, authDelete } from "@/lib/auth-fetch"
import { useToast } from "@/hooks/use-toast"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SEOTask {
  id: string
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'recurring'
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'one_time'
  due_date?: string
  completed_date?: string
  assigned_to?: string
  notes?: string
}

interface TrackedKeyword {
  id: string
  keyword: string
  current_rank?: number
  previous_rank?: number
  target_rank: number
  search_volume?: number
  difficulty?: string
  page_url?: string
  category: string
  last_checked?: string
}

interface ContentPlan {
  id: string
  title: string
  content_type: 'blog' | 'landing_page' | 'case_study' | 'guide' | 'infographic' | 'video'
  target_keyword: string
  secondary_keywords: string[]
  status: 'idea' | 'planned' | 'in_progress' | 'published' | 'needs_update'
  publish_date?: string
  url?: string
  word_count_target?: number
  notes?: string
}

interface Competitor {
  id: string
  name: string
  domain: string
  notes?: string
  strengths?: string
  weaknesses?: string
}

interface BacklinkTarget {
  id: string
  domain: string
  type: 'guest_post' | 'directory' | 'partnership' | 'pr' | 'social' | 'forum'
  status: 'prospect' | 'outreach_sent' | 'in_progress' | 'acquired' | 'rejected'
  contact_info?: string
  da_score?: number
  notes?: string
}

// ─── Default Data ───────────────────────────────────────────────────────────────

const DEFAULT_SEO_TASKS: SEOTask[] = [
  // Daily
  { id: '1', title: 'Monitor Google Search Console for errors', description: 'Check for crawl errors, indexing issues, and manual actions', category: 'Technical SEO', priority: 'high', status: 'recurring', frequency: 'daily' },
  { id: '2', title: 'Review site uptime and page speed', description: 'Use Google PageSpeed Insights or GTmetrix to monitor performance', category: 'Technical SEO', priority: 'medium', status: 'recurring', frequency: 'daily' },
  // Weekly
  { id: '3', title: 'Publish new blog post or content piece', description: 'Produce evergreen or trending content targeting priority keywords', category: 'Content', priority: 'high', status: 'recurring', frequency: 'weekly' },
  { id: '4', title: 'Share content on social media channels', description: 'Post blog articles, case studies, and speaker spotlights to LinkedIn, X, and Facebook', category: 'Distribution', priority: 'medium', status: 'recurring', frequency: 'weekly' },
  { id: '5', title: 'Check keyword rankings for top 20 targets', description: 'Track position changes for primary keyword targets', category: 'Keywords', priority: 'high', status: 'recurring', frequency: 'weekly' },
  { id: '6', title: 'Internal linking audit on new content', description: 'Add internal links from new posts to pillar pages and vice versa', category: 'On-Page SEO', priority: 'medium', status: 'recurring', frequency: 'weekly' },
  // Biweekly
  { id: '7', title: 'Outreach for backlink opportunities', description: 'Send 5-10 outreach emails for guest posts, partnerships, or link placements', category: 'Link Building', priority: 'high', status: 'recurring', frequency: 'biweekly' },
  { id: '8', title: 'Update/refresh older content', description: 'Refresh stats, add new sections, update dates on existing content', category: 'Content', priority: 'medium', status: 'recurring', frequency: 'biweekly' },
  // Monthly
  { id: '9', title: 'Full technical SEO audit', description: 'Run Screaming Frog or Sitebulb crawl, fix broken links, missing meta, etc.', category: 'Technical SEO', priority: 'high', status: 'recurring', frequency: 'monthly' },
  { id: '10', title: 'Competitor analysis update', description: 'Check competitor rankings, new content, and backlink growth', category: 'Analysis', priority: 'medium', status: 'recurring', frequency: 'monthly' },
  { id: '11', title: 'Google Ads campaign optimization', description: 'Review ad performance, adjust bids, pause underperformers, test new ad copy', category: 'Paid Ads', priority: 'high', status: 'recurring', frequency: 'monthly' },
  { id: '12', title: 'Review and optimize meta titles/descriptions', description: 'Check CTR in Search Console, rewrite underperforming metas', category: 'On-Page SEO', priority: 'medium', status: 'recurring', frequency: 'monthly' },
  { id: '13', title: 'Schema markup review', description: 'Ensure all pages have proper structured data (Organization, Person, FAQ, etc.)', category: 'Technical SEO', priority: 'medium', status: 'recurring', frequency: 'monthly' },
  { id: '14', title: 'Newsletter send with latest content', description: 'Compile best recent content into monthly newsletter', category: 'Distribution', priority: 'medium', status: 'recurring', frequency: 'monthly' },
  // Quarterly
  { id: '15', title: 'Comprehensive keyword research refresh', description: 'Discover new keyword opportunities, evaluate long-tails, update targets', category: 'Keywords', priority: 'high', status: 'recurring', frequency: 'quarterly' },
  { id: '16', title: 'Content gap analysis', description: 'Compare content coverage vs. competitors, identify missing topics', category: 'Analysis', priority: 'high', status: 'recurring', frequency: 'quarterly' },
  { id: '17', title: 'Core Web Vitals audit', description: 'Run Lighthouse, check LCP/FID/CLS, fix performance issues', category: 'Technical SEO', priority: 'high', status: 'recurring', frequency: 'quarterly' },
  { id: '18', title: 'Review and update Google Ads strategy', description: 'Evaluate campaign structure, budgets, and targeting for next quarter', category: 'Paid Ads', priority: 'high', status: 'recurring', frequency: 'quarterly' },
  { id: '19', title: 'Backlink profile audit', description: 'Review all backlinks, disavow toxic links, analyze link velocity', category: 'Link Building', priority: 'medium', status: 'recurring', frequency: 'quarterly' },
  { id: '20', title: 'Review site architecture and navigation', description: 'Ensure logical URL hierarchy, breadcrumbs, sitemap optimization', category: 'Technical SEO', priority: 'medium', status: 'recurring', frequency: 'quarterly' },
  // One-time / 2026 priorities
  { id: '21', title: 'Set up AI Overview optimization', description: 'Structure content for Google AI Overviews (SGE) with concise answers, FAQ schema, and authoritative sourcing', category: 'Content', priority: 'high', status: 'pending', frequency: 'one_time', due_date: '2026-04-01' },
  { id: '22', title: 'Create pillar page: "Hire AI Speakers"', description: 'Long-form guide targeting primary commercial keyword with internal links to all speaker profiles', category: 'Content', priority: 'high', status: 'pending', frequency: 'one_time', due_date: '2026-04-15' },
  { id: '23', title: 'Create pillar page: "AI Conference Guide 2026"', description: 'Comprehensive guide to AI conferences with speaker booking angle', category: 'Content', priority: 'high', status: 'pending', frequency: 'one_time', due_date: '2026-05-01' },
  { id: '24', title: 'Implement hreflang for international targeting', description: 'If targeting international audiences, add hreflang tags for key pages', category: 'Technical SEO', priority: 'low', status: 'pending', frequency: 'one_time', due_date: '2026-06-01' },
  { id: '25', title: 'Build topical authority map', description: 'Map all content into topic clusters: AI speakers, AI events, AI topics, speaker booking', category: 'Content', priority: 'high', status: 'pending', frequency: 'one_time', due_date: '2026-04-01' },
]

const DEFAULT_KEYWORDS: TrackedKeyword[] = [
  { id: '1', keyword: 'AI speakers for events', target_rank: 1, search_volume: 880, difficulty: 'Medium', category: 'Primary' },
  { id: '2', keyword: 'hire AI speaker', target_rank: 1, search_volume: 590, difficulty: 'Medium', category: 'Primary' },
  { id: '3', keyword: 'artificial intelligence keynote speaker', target_rank: 3, search_volume: 1300, difficulty: 'High', category: 'Primary' },
  { id: '4', keyword: 'AI conference speakers', target_rank: 3, search_volume: 720, difficulty: 'Medium', category: 'Primary' },
  { id: '5', keyword: 'book AI speaker', target_rank: 1, search_volume: 320, difficulty: 'Low', category: 'Commercial' },
  { id: '6', keyword: 'AI keynote speaker bureau', target_rank: 1, search_volume: 170, difficulty: 'Low', category: 'Commercial' },
  { id: '7', keyword: 'machine learning speaker', target_rank: 5, search_volume: 480, difficulty: 'Medium', category: 'Topic' },
  { id: '8', keyword: 'generative AI speaker', target_rank: 3, search_volume: 1600, difficulty: 'High', category: 'Topic' },
  { id: '9', keyword: 'AI ethics speaker', target_rank: 5, search_volume: 390, difficulty: 'Medium', category: 'Topic' },
  { id: '10', keyword: 'AI speakers near me', target_rank: 1, search_volume: 210, difficulty: 'Low', category: 'Local' },
  { id: '11', keyword: 'best AI speakers 2026', target_rank: 1, search_volume: 1900, difficulty: 'High', category: 'Evergreen' },
  { id: '12', keyword: 'AI speaker for corporate event', target_rank: 3, search_volume: 590, difficulty: 'Medium', category: 'Commercial' },
  { id: '13', keyword: 'technology keynote speakers', target_rank: 5, search_volume: 2400, difficulty: 'High', category: 'Broad' },
  { id: '14', keyword: 'AI workshop facilitator', target_rank: 3, search_volume: 260, difficulty: 'Low', category: 'Commercial' },
  { id: '15', keyword: 'AI thought leaders', target_rank: 5, search_volume: 1100, difficulty: 'High', category: 'Brand' },
]

const DEFAULT_CONTENT_PLAN: ContentPlan[] = [
  { id: '1', title: 'Top 20 AI Speakers to Book in 2026', content_type: 'blog', target_keyword: 'best AI speakers 2026', secondary_keywords: ['top AI keynote speakers', 'AI speakers list'], status: 'planned', publish_date: '2026-04-01', word_count_target: 3000 },
  { id: '2', title: 'How to Choose the Right AI Speaker for Your Event', content_type: 'guide', target_keyword: 'hire AI speaker', secondary_keywords: ['book AI speaker', 'AI speaker selection'], status: 'planned', publish_date: '2026-04-15', word_count_target: 2500 },
  { id: '3', title: 'AI Conference Guide 2026: Everything You Need to Know', content_type: 'landing_page', target_keyword: 'AI conferences 2026', secondary_keywords: ['AI events', 'AI summit'], status: 'idea', publish_date: '2026-05-01', word_count_target: 4000 },
  { id: '4', title: 'The Rise of Generative AI: What Event Planners Need to Know', content_type: 'blog', target_keyword: 'generative AI speaker', secondary_keywords: ['GenAI events', 'AI trends'], status: 'idea', publish_date: '2026-05-15', word_count_target: 2000 },
  { id: '5', title: 'Case Study: How AI Speakers Transformed Our Annual Conference', content_type: 'case_study', target_keyword: 'AI speaker for corporate event', secondary_keywords: ['AI keynote impact'], status: 'idea', publish_date: '2026-06-01', word_count_target: 1500 },
  { id: '6', title: '5 AI Topics Every Conference Should Cover in 2026', content_type: 'blog', target_keyword: 'AI conference topics', secondary_keywords: ['AI speaking topics', 'AI event themes'], status: 'idea', publish_date: '2026-06-15', word_count_target: 2000 },
  { id: '7', title: 'Interactive AI Workshops: A Guide for Event Organizers', content_type: 'guide', target_keyword: 'AI workshop facilitator', secondary_keywords: ['AI workshop for events'], status: 'idea', publish_date: '2026-07-01', word_count_target: 2500 },
  { id: '8', title: 'AI Ethics in the Workplace: Speaker Topics That Resonate', content_type: 'blog', target_keyword: 'AI ethics speaker', secondary_keywords: ['responsible AI speaker'], status: 'idea', publish_date: '2026-07-15', word_count_target: 2000 },
]

const DEFAULT_COMPETITORS: Competitor[] = [
  { id: '1', name: 'BigSpeak', domain: 'bigspeak.com', strengths: 'Large roster, established brand, strong SEO', weaknesses: 'Not AI-focused, generic speaker bureau' },
  { id: '2', name: 'All American Speakers', domain: 'allamericanspeakers.com', strengths: 'Massive directory, celebrity speakers', weaknesses: 'Poor UX, not niche-specific' },
  { id: '3', name: 'Keynote Speaker Agency', domain: 'keynotespeakeragency.com', strengths: 'Good content marketing, blog', weaknesses: 'Limited AI-specific content' },
  { id: '4', name: 'Speakers Bureau', domain: 'speakersbureau.com', strengths: 'Strong domain authority, broad categories', weaknesses: 'No AI specialization, dated design' },
]

const RECOMMENDED_TOOLS = [
  { name: 'Google Search Console', category: 'Analytics', description: 'Free. Monitor search performance, indexing, and technical issues', url: 'https://search.google.com/search-console', priority: 'Essential', free: true },
  { name: 'Google Analytics 4', category: 'Analytics', description: 'Free. Track traffic, user behavior, conversions', url: 'https://analytics.google.com', priority: 'Essential', free: true },
  { name: 'Google Ads', category: 'Paid Ads', description: 'PPC campaigns for high-intent keywords', url: 'https://ads.google.com', priority: 'Essential', free: false },
  { name: 'Ahrefs', category: 'SEO Suite', description: 'Keyword research, backlink analysis, site audit, rank tracking. Best-in-class backlink database', url: 'https://ahrefs.com', priority: 'Recommended', free: false },
  { name: 'SEMrush', category: 'SEO Suite', description: 'All-in-one: keyword research, competitor analysis, site audit, position tracking, content optimization', url: 'https://semrush.com', priority: 'Recommended', free: false },
  { name: 'Screaming Frog', category: 'Technical SEO', description: 'Website crawler for technical SEO audits (free up to 500 URLs)', url: 'https://screamingfrog.co.uk', priority: 'Recommended', free: true },
  { name: 'Surfer SEO', category: 'Content', description: 'Content optimization tool. Analyzes top-ranking pages and provides optimization scores', url: 'https://surferseo.com', priority: 'Nice-to-have', free: false },
  { name: 'Clearscope', category: 'Content', description: 'AI content optimization. Helps produce comprehensive, SEO-optimized content', url: 'https://clearscope.io', priority: 'Nice-to-have', free: false },
  { name: 'Google PageSpeed Insights', category: 'Performance', description: 'Free. Core Web Vitals and page speed analysis', url: 'https://pagespeed.web.dev', priority: 'Essential', free: true },
  { name: 'Google Keyword Planner', category: 'Keywords', description: 'Free with Google Ads account. Search volume and keyword ideas', url: 'https://ads.google.com/home/tools/keyword-planner/', priority: 'Essential', free: true },
  { name: 'AnswerThePublic', category: 'Keywords', description: 'Visual keyword research tool for question-based content ideas', url: 'https://answerthepublic.com', priority: 'Nice-to-have', free: true },
  { name: 'Schema Markup Validator', category: 'Technical SEO', description: 'Free. Validate structured data on your pages', url: 'https://validator.schema.org', priority: 'Essential', free: true },
  { name: 'Yoast/RankMath', category: 'On-Page SEO', description: 'WordPress plugins (if applicable) for on-page SEO optimization', url: 'https://yoast.com', priority: 'If applicable', free: true },
  { name: 'BuzzSumo', category: 'Content', description: 'Content research and influencer discovery. Find trending topics and top-performing content', url: 'https://buzzsumo.com', priority: 'Nice-to-have', free: false },
  { name: 'Hotjar', category: 'UX Analytics', description: 'Heatmaps, session recordings, and feedback. Understand how users interact with your site', url: 'https://hotjar.com', priority: 'Recommended', free: true },
]

const ON_PAGE_CHECKLIST = [
  { category: 'Title Tags', items: ['Under 60 characters', 'Primary keyword near start', 'Unique per page', 'Compelling for CTR'] },
  { category: 'Meta Descriptions', items: ['Under 155 characters', 'Includes primary keyword', 'Clear call-to-action', 'Unique per page'] },
  { category: 'Headings', items: ['One H1 per page with keyword', 'Logical H2/H3 hierarchy', 'Keywords in subheadings naturally', 'Descriptive and scannable'] },
  { category: 'Content', items: ['Min 1,500 words for pillar pages', 'Target keyword in first 100 words', 'LSI/related keywords included', 'Original and valuable content', 'Updated publication date'] },
  { category: 'Internal Links', items: ['3-5 internal links per post', 'Descriptive anchor text', 'Link to pillar pages from clusters', 'No orphan pages'] },
  { category: 'Images', items: ['Descriptive alt text with keywords', 'Compressed file sizes (<200KB)', 'WebP format where possible', 'Lazy loading enabled'] },
  { category: 'URL Structure', items: ['Short and descriptive', 'Contains target keyword', 'Hyphens between words', 'No special characters or IDs'] },
  { category: 'Schema Markup', items: ['Organization schema on homepage', 'Person schema on speaker pages', 'FAQ schema where applicable', 'BreadcrumbList on all pages'] },
]

// ─── Component ──────────────────────────────────────────────────────────────────

export default function MarketingSEOPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [tasks, setTasks] = useState<SEOTask[]>(DEFAULT_SEO_TASKS)
  const [keywords, setKeywords] = useState<TrackedKeyword[]>(DEFAULT_KEYWORDS)
  const [contentPlan, setContentPlan] = useState<ContentPlan[]>(DEFAULT_CONTENT_PLAN)
  const [competitors, setCompetitors] = useState<Competitor[]>(DEFAULT_COMPETITORS)
  const [taskFilter, setTaskFilter] = useState<string>("all")
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>("all")
  const [keywordCategoryFilter, setKeywordCategoryFilter] = useState<string>("all")
  const [contentStatusFilter, setContentStatusFilter] = useState<string>("all")
  const [saving, setSaving] = useState(false)

  // Persist data to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('seo_marketing_data')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.tasks) setTasks(data.tasks)
        if (data.keywords) setKeywords(data.keywords)
        if (data.contentPlan) setContentPlan(data.contentPlan)
        if (data.competitors) setCompetitors(data.competitors)
      } catch {}
    }
  }, [])

  const saveData = useCallback(() => {
    setSaving(true)
    localStorage.setItem('seo_marketing_data', JSON.stringify({ tasks, keywords, contentPlan, competitors }))
    setTimeout(() => {
      setSaving(false)
      toast({ title: "Saved", description: "Marketing data saved locally" })
    }, 300)
  }, [tasks, keywords, contentPlan, competitors, toast])

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      if (t.status === 'completed') return { ...t, status: t.frequency && t.frequency !== 'one_time' ? 'recurring' : 'pending', completed_date: undefined }
      return { ...t, status: 'completed', completed_date: new Date().toISOString().split('T')[0] }
    }))
  }

  const updateTaskStatus = (taskId: string, status: SEOTask['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  // Dashboard stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const highPriorityPending = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length
  const recurringTasks = tasks.filter(t => t.status === 'recurring').length
  const avgKeywordTarget = keywords.length > 0 ? Math.round(keywords.reduce((s, k) => s + k.target_rank, 0) / keywords.length) : 0
  const publishedContent = contentPlan.filter(c => c.status === 'published').length

  // Filtered data
  const filteredTasks = tasks.filter(t => {
    if (taskFilter !== 'all' && t.frequency !== taskFilter) return false
    if (taskCategoryFilter !== 'all' && t.category !== taskCategoryFilter) return false
    return true
  })
  const filteredKeywords = keywords.filter(k => keywordCategoryFilter === 'all' || k.category === keywordCategoryFilter)
  const filteredContent = contentPlan.filter(c => contentStatusFilter === 'all' || c.status === contentStatusFilter)

  const taskCategories = Array.from(new Set(tasks.map(t => t.category)))
  const keywordCategories = Array.from(new Set(keywords.map(k => k.category)))

  const getRankChange = (kw: TrackedKeyword) => {
    if (!kw.previous_rank || !kw.current_rank) return null
    const diff = kw.previous_rank - kw.current_rank
    if (diff > 0) return { direction: 'up', value: diff }
    if (diff < 0) return { direction: 'down', value: Math.abs(diff) }
    return { direction: 'same', value: 0 }
  }

  return (
    <div className="flex-1 lg:ml-72 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Marketing & SEO Strategy</h1>
            <p className="text-gray-600">2026 Evergreen Marketing Plan for Maximum Traffic</p>
          </div>
          <Button onClick={saveData} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Progress
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto mb-6">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="tasks">Scheduled Tasks</TabsTrigger>
              <TabsTrigger value="keywords">Keyword Tracker</TabsTrigger>
              <TabsTrigger value="content">Content Plan</TabsTrigger>
              <TabsTrigger value="onpage">On-Page SEO</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
              <TabsTrigger value="tools">Tools & Resources</TabsTrigger>
            </TabsList>
          </div>

          {/* ─── Dashboard ─── */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold">{totalTasks}</div>
                  <div className="text-xs text-muted-foreground">Total Tasks</div>
                </Card>
                <Card className="p-4 border-green-200 bg-green-50">
                  <div className="text-2xl font-bold text-green-700">{completedTasks}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </Card>
                <Card className="p-4 border-red-200 bg-red-50">
                  <div className="text-2xl font-bold text-red-700">{highPriorityPending}</div>
                  <div className="text-xs text-muted-foreground">High Priority Pending</div>
                </Card>
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <div className="text-2xl font-bold text-blue-700">{recurringTasks}</div>
                  <div className="text-xs text-muted-foreground">Recurring Tasks</div>
                </Card>
                <Card className="p-4 border-purple-200 bg-purple-50">
                  <div className="text-2xl font-bold text-purple-700">{keywords.length}</div>
                  <div className="text-xs text-muted-foreground">Tracked Keywords</div>
                </Card>
                <Card className="p-4 border-amber-200 bg-amber-50">
                  <div className="text-2xl font-bold text-amber-700">{contentPlan.length}</div>
                  <div className="text-xs text-muted-foreground">Content Pieces</div>
                </Card>
              </div>

              {/* 2026 Strategy Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    2026 SEO & Marketing Strategy
                  </CardTitle>
                  <CardDescription>Evergreen plan to maximize organic traffic to speakabout.ai</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Core Objectives</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> Rank #1 for "AI speakers for events" and "hire AI speaker"</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> Top 3 for all commercial intent keywords</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> Build topical authority in AI speaking niche</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> Grow organic traffic 200% year-over-year</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> Optimize for Google AI Overviews (SGE)</li>
                        <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> Achieve 50+ quality backlinks by EOY</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Key Pillars</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">Content & Topical Authority</p>
                            <p className="text-xs text-muted-foreground">Weekly publishing, pillar pages, content clusters</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                          <Wrench className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">Technical SEO Excellence</p>
                            <p className="text-xs text-muted-foreground">Core Web Vitals, schema, crawlability</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                          <Link2 className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-sm">Link Building & Authority</p>
                            <p className="text-xs text-muted-foreground">Guest posts, PR, partnerships, directories</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                          <Zap className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium text-sm">Paid Ads (Google Ads)</p>
                            <p className="text-xs text-muted-foreground">High-intent keyword campaigns, remarketing</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Upcoming & High Priority Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tasks.filter(t => t.status !== 'completed' && t.priority === 'high').slice(0, 8).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleTaskStatus(task.id)} className="shrink-0">
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 hover:border-green-500" />
                          </button>
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.frequency && (
                            <Badge variant="outline" className="text-xs capitalize">{task.frequency.replace('_', ' ')}</Badge>
                          )}
                          <Badge className={task.priority === 'high' ? 'bg-red-100 text-red-800' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'} variant="secondary">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="mt-3 text-sm w-full" onClick={() => setActiveTab("tasks")}>
                    View All Tasks <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Scheduled Tasks ─── */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SEO & Marketing Task Schedule</CardTitle>
                    <CardDescription>Recurring and one-time tasks to maximize traffic</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={taskFilter} onValueChange={setTaskFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Frequencies</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Biweekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="one_time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={taskCategoryFilter} onValueChange={setTaskCategoryFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {taskCategories.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map(task => (
                        <TableRow key={task.id} className={task.status === 'completed' ? 'opacity-50' : ''}>
                          <TableCell>
                            <button onClick={() => toggleTaskStatus(task.id)} className="shrink-0">
                              {task.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300 hover:border-green-500" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{task.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs capitalize">{(task.frequency || 'one_time').replace('_', ' ')}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={task.priority === 'high' ? 'bg-red-100 text-red-800' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'} variant="secondary">
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {task.due_date || '-'}
                          </TableCell>
                          <TableCell>
                            <Select value={task.status} onValueChange={(v) => updateTaskStatus(task.id, v as SEOTask['status'])}>
                              <SelectTrigger className="h-7 text-xs w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="recurring">Recurring</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Keyword Tracker ─── */}
          <TabsContent value="keywords">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Keyword Rank Tracker
                    </CardTitle>
                    <CardDescription>Track rankings for target keywords (update manually or connect to API)</CardDescription>
                  </div>
                  <Select value={keywordCategoryFilter} onValueChange={setKeywordCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {keywordCategories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead className="text-center">Current Rank</TableHead>
                        <TableHead className="text-center">Change</TableHead>
                        <TableHead className="text-center">Target</TableHead>
                        <TableHead className="text-center">Volume</TableHead>
                        <TableHead className="text-center">Difficulty</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKeywords.map(kw => {
                        const change = getRankChange(kw)
                        return (
                          <TableRow key={kw.id}>
                            <TableCell className="font-medium text-sm">{kw.keyword}</TableCell>
                            <TableCell className="text-center">
                              {kw.current_rank ? (
                                <Badge variant="outline" className="font-mono">{kw.current_rank}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not tracked</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {change ? (
                                <span className={`flex items-center justify-center gap-1 text-xs font-medium ${change.direction === 'up' ? 'text-green-600' : change.direction === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                                  {change.direction === 'up' && <ArrowUp className="h-3 w-3" />}
                                  {change.direction === 'down' && <ArrowDown className="h-3 w-3" />}
                                  {change.direction === 'same' && <Minus className="h-3 w-3" />}
                                  {change.value > 0 && change.value}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-blue-100 text-blue-800 font-mono" variant="secondary">{kw.target_rank}</Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {kw.search_volume ? kw.search_volume.toLocaleString() : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {kw.difficulty && (
                                <Badge variant="secondary" className={`text-xs ${kw.difficulty === 'High' ? 'bg-red-100 text-red-800' : kw.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                  {kw.difficulty}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{kw.category}</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Pro Tip: Connect SEMrush or Ahrefs API
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    For automated rank tracking, integrate the SEMrush Position Tracking API or Ahrefs Rank Tracker API to auto-populate current rankings and historical data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Content Plan ─── */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Content Calendar & Plan
                    </CardTitle>
                    <CardDescription>Planned content targeting priority keywords</CardDescription>
                  </div>
                  <Select value={contentStatusFilter} onValueChange={setContentStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="needs_update">Needs Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Target Keyword</TableHead>
                        <TableHead>Publish Date</TableHead>
                        <TableHead>Words</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="text-sm font-medium">{item.title}</p>
                            {item.secondary_keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.secondary_keywords.map((kw, i) => (
                                  <span key={i} className="text-[10px] text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded">{kw}</span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{item.content_type.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{item.target_keyword}</TableCell>
                          <TableCell className="text-sm">{item.publish_date || '-'}</TableCell>
                          <TableCell className="text-sm">{item.word_count_target?.toLocaleString() || '-'}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${
                              item.status === 'published' ? 'bg-green-100 text-green-800' :
                              item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              item.status === 'planned' ? 'bg-purple-100 text-purple-800' :
                              item.status === 'needs_update' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`} variant="secondary">
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── On-Page SEO Checklist ─── */}
          <TabsContent value="onpage">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ON_PAGE_CHECKLIST.map(section => (
                <Card key={section.category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{section.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ─── Competitors ─── */}
          <TabsContent value="competitors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Competitor Analysis
                </CardTitle>
                <CardDescription>Monitor competitor SEO strategies and identify opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitors.map(comp => (
                    <div key={comp.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{comp.name}</h3>
                          <a href={`https://${comp.domain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {comp.domain}
                          </a>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                          <p className="text-sm text-muted-foreground">{comp.strengths || 'Not analyzed yet'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-700 mb-1">Weaknesses / Opportunities</p>
                          <p className="text-sm text-muted-foreground">{comp.weaknesses || 'Not analyzed yet'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Competitor Analysis Workflow
                  </p>
                  <ul className="text-xs text-amber-700 mt-2 space-y-1 ml-6 list-disc">
                    <li>Run monthly SEMrush/Ahrefs competitor audit on each domain</li>
                    <li>Track their new content, backlinks, and keyword movements</li>
                    <li>Identify content gaps — topics they rank for that you don't</li>
                    <li>Analyze their top-performing pages for content strategy ideas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Backlinks ─── */}
          <TabsContent value="backlinks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Link Building Strategy
                </CardTitle>
                <CardDescription>Track backlink opportunities and outreach progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Strategy Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Guest Posting
                      </h4>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>Target AI/tech publications</li>
                        <li>Event industry blogs</li>
                        <li>Forbes, Entrepreneur, Inc.</li>
                        <li>Medium AI publications</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        Directories & Listings
                      </h4>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>Speaker bureau directories</li>
                        <li>Event industry associations</li>
                        <li>AI/tech company listings</li>
                        <li>Business directories (BBB, etc.)</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-purple-600" />
                        PR & Partnerships
                      </h4>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>HARO / Connectively responses</li>
                        <li>Podcast guest appearances</li>
                        <li>Conference sponsorships</li>
                        <li>Speaker profile cross-links</li>
                      </ul>
                    </div>
                  </div>

                  {/* Monthly Targets */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Monthly Backlink Targets</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-700">5</p>
                        <p className="text-xs text-blue-600">Guest Posts / Outreach</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-700">3</p>
                        <p className="text-xs text-blue-600">Directory Submissions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-700">2</p>
                        <p className="text-xs text-blue-600">HARO Responses</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-700">1</p>
                        <p className="text-xs text-blue-600">Partnership Link</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tools & Resources ─── */}
          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Recommended SEO & Marketing Tools
                </CardTitle>
                <CardDescription>Tools to replicate SEMrush functionality and maximize SEO performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tool</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {RECOMMENDED_TOOLS.map((tool, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{tool.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{tool.category}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs">{tool.description}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${
                              tool.priority === 'Essential' ? 'bg-red-100 text-red-800' :
                              tool.priority === 'Recommended' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`} variant="secondary">
                              {tool.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tool.free ? "secondary" : "outline"} className={`text-xs ${tool.free ? 'bg-green-100 text-green-800' : ''}`}>
                              {tool.free ? 'Free' : 'Paid'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <a href={tool.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-7">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Stack Recommendation */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Recommended Stack (Replaces SEMrush)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                    <div>
                      <p className="font-medium mb-1">Free Stack:</p>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>Google Search Console (rankings, indexing)</li>
                        <li>Google Analytics 4 (traffic, conversions)</li>
                        <li>Google Keyword Planner (keyword research)</li>
                        <li>Screaming Frog free (technical audits)</li>
                        <li>PageSpeed Insights (Core Web Vitals)</li>
                        <li>Schema Validator (structured data)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Premium Addition (pick one):</p>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li><strong>Ahrefs Lite ($129/mo)</strong> — Best for backlink analysis, content explorer</li>
                        <li><strong>SEMrush Pro ($139/mo)</strong> — Best all-in-one with position tracking, site audit</li>
                        <li><strong>Surfer SEO ($89/mo)</strong> — Best for content optimization scoring</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Google Ads Integration */}
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Google Ads Integration
                  </h4>
                  <p className="text-xs text-orange-700 mb-2">
                    Your Google Ads campaigns are managed in the dedicated Google Ads tab. Key integration points:
                  </p>
                  <ul className="text-xs text-orange-700 space-y-1 ml-4 list-disc">
                    <li>Use keyword data from this tracker to inform ad group targeting</li>
                    <li>Align ad copy with content plan topics for consistent messaging</li>
                    <li>Use Search Console data to identify high-CTR organic terms for paid amplification</li>
                    <li>Run remarketing campaigns targeting blog readers and landing page visitors</li>
                  </ul>
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => window.location.href = '/admin/google-ads'}>
                    <Zap className="h-3 w-3 mr-1" />
                    Go to Google Ads Manager
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

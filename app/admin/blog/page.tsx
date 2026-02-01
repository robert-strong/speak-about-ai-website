'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Link as LinkIcon,
  Download,
  Upload,
  RefreshCw,
  Settings,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Webhook,
  Shield,
  Activity,
  TrendingUp,
  BarChart3,
  Users,
  MessageSquare,
  Loader2,
  CheckSquare,
  Square,
  Send,
  Globe,
  Database
} from 'lucide-react'
import { formatDateTimePST, getPSTTimezoneLabel } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'

interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  meta_description: string
  featured_image_url: string
  published_date: string
  tags: string[]
  status: string
  created_at: string
  updated_at: string
  outrank_id?: string
  source?: string
}

interface OutrankConfig {
  webhook_url: string
  webhook_secret: string
  last_sync: string | null
  auto_publish: boolean
  sync_status: 'connected' | 'disconnected' | 'error'
  total_synced: number
}

interface WebhookLog {
  id: number
  event_type: string
  status: 'success' | 'error' | 'pending'
  payload?: Record<string, unknown>
  response?: Record<string, unknown>
  error_message?: string
  created_at: string
}

export default function AdminBlogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPosts, setSelectedPosts] = useState<number[]>([])
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isNewPost, setIsNewPost] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  
  // Outrank configuration state
  const [outrank, setOutrank] = useState<OutrankConfig>({
    webhook_url: '',
    webhook_secret: '',
    last_sync: null,
    auto_publish: true,
    sync_status: 'disconnected',
    total_synced: 0
  })
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  
  // Webhook logs state
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsStatusFilter, setLogsStatusFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    views: 0,
    engagement: 0
  })

  useEffect(() => {
    // Check if logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    const sessionToken = localStorage.getItem('adminSessionToken')
    
    if (!isLoggedIn || !sessionToken) {
      router.push('/admin')
      return
    }
    
    fetchBlogPosts()
    fetchOutrankConfig()
    fetchStats()
  }, [statusFilter, router])

  const fetchBlogPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/admin/blog?${params}`, {
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load blog posts',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOutrankConfig = async () => {
    try {
      const response = await fetch('/api/admin/blog/outrank-config', {
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setOutrank(data)
      }
    } catch (error) {
      console.error('Error fetching Outrank config:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/blog/stats', {
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching blog stats:', error)
    }
  }

  const handleSavePost = async () => {
    if (!editingPost) return
    
    try {
      const url = isNewPost 
        ? '/api/admin/blog' 
        : `/api/admin/blog/${editingPost.id}`
      
      const response = await fetch(url, {
        method: isNewPost ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify(editingPost)
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Blog post ${isNewPost ? 'created' : 'updated'} successfully`
        })
        setEditingPost(null)
        setIsNewPost(false)
        fetchBlogPosts()
      }
    } catch (error) {
      console.error('Error saving blog post:', error)
      toast({
        title: 'Error',
        description: 'Failed to save blog post',
        variant: 'destructive'
      })
    }
  }

  const handleDeletePost = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return
    
    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Blog post deleted successfully'
        })
        fetchBlogPosts()
      }
    } catch (error) {
      console.error('Error deleting blog post:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete blog post',
        variant: 'destructive'
      })
    }
  }

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedPosts.length === 0) {
      toast({
        title: 'No posts selected',
        description: 'Please select posts to perform bulk action',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const response = await fetch('/api/admin/blog/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify({
          ids: selectedPosts,
          action
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Bulk ${action} completed successfully`
        })
        setSelectedPosts([])
        fetchBlogPosts()
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive'
      })
    }
  }

  const saveOutrankConfig = async () => {
    try {
      setSavingConfig(true)
      const response = await fetch('/api/admin/blog/outrank-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify(outrank)
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Outrank configuration saved successfully'
        })
        fetchOutrankConfig()
      }
    } catch (error) {
      console.error('Error saving Outrank config:', error)
      toast({
        title: 'Error',
        description: 'Failed to save Outrank configuration',
        variant: 'destructive'
      })
    } finally {
      setSavingConfig(false)
    }
  }

  const fetchWebhookLogs = async () => {
    try {
      setLogsLoading(true)
      const params = logsStatusFilter !== 'all' ? `?status=${logsStatusFilter}` : ''
      const response = await fetch(`/api/admin/webhook-logs${params}`, {
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWebhookLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch webhook logs',
        variant: 'destructive'
      })
    } finally {
      setLogsLoading(false)
    }
  }
  
  const createWebhookLogsTable = async () => {
    try {
      const response = await fetch('/api/admin/webhook-logs/migrate', {
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Webhook logs table created successfully'
        })
        fetchWebhookLogs()
      }
    } catch (error) {
      console.error('Failed to create webhook logs table:', error)
      toast({
        title: 'Error',
        description: 'Failed to create webhook logs table',
        variant: 'destructive'
      })
    }
  }

  const testWebhook = async () => {
    try {
      setTestingWebhook(true)
      const response = await fetch('/api/admin/blog/test-webhook', {
        method: 'POST',
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        toast({
          title: 'Webhook Test',
          description: result.message || 'Webhook test completed'
        })
      }
    } catch (error) {
      console.error('Error testing webhook:', error)
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive'
      })
    } finally {
      setTestingWebhook(false)
    }
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
                <p className="mt-2 text-gray-600">
                  Manage your blog content and Outrank integration
                </p>
                <p className="text-sm text-gray-500 mt-1">All times displayed in {getPSTTimezoneLabel()}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={fetchBlogPosts}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => {
                  setEditingPost({
                    id: 0,
                    title: '',
                    slug: '',
                    content: '',
                    meta_description: '',
                    featured_image_url: '',
                    published_date: new Date().toISOString(),
                    tags: [],
                    status: 'draft',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  setIsNewPost(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Posts</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Published</p>
                      <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Drafts</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Archived</p>
                      <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
                    </div>
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Views</p>
                      <p className="text-2xl font-bold">{stats.views.toLocaleString()}</p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Engagement</p>
                      <p className="text-2xl font-bold">{stats.engagement}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">
                <Globe className="h-4 w-4 mr-2" />
                Contentful Posts
              </TabsTrigger>
              <TabsTrigger value="outrank">
                <Webhook className="h-4 w-4 mr-2" />
                Outrank Integration
              </TabsTrigger>
              <TabsTrigger value="monitoring">
                <Activity className="h-4 w-4 mr-2" />
                Webhook Monitor
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Contentful Blog Posts</CardTitle>
                      <CardDescription>Blog content is managed in Contentful CMS</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search posts..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 w-64"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedPosts.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                              Bulk Actions ({selectedPosts.length})
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleBulkAction('publish')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                              <FileText className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleBulkAction('delete')}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Contentful Notice */}
                  <Alert className="mb-6 border-blue-200 bg-blue-50">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">Content Managed in Contentful</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Blog posts are stored and managed in Contentful CMS. Click the button below to open Contentful and manage your content.
                      Use the Outrank Integration tab to sync articles from Outrank to Contentful.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Globe className="h-16 w-16 text-blue-400" />
                    <h3 className="text-lg font-semibold">Manage Posts in Contentful</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      Your blog posts are managed in Contentful CMS for better content management, versioning, and collaboration.
                    </p>
                    <Button
                      onClick={() => window.open('https://app.contentful.com', '_blank')}
                      className="mt-4"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Contentful Dashboard
                    </Button>
                  </div>
                  
                  {false && ( (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={selectedPosts.length === filteredPosts.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPosts(filteredPosts.map(p => p.id))
                                } else {
                                  setSelectedPosts([])
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Published</TableHead>
                          <TableHead>Tags</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedPosts.includes(post.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPosts([...selectedPosts, post.id])
                                  } else {
                                    setSelectedPosts(selectedPosts.filter(id => id !== post.id))
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{post.title}</p>
                                <p className="text-sm text-gray-500">{post.slug}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                post.status === 'published' ? 'default' :
                                post.status === 'draft' ? 'secondary' :
                                'outline'
                              }>
                                {post.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {post.source === 'outrank' ? (
                                <Badge variant="outline" className="bg-purple-50">
                                  <LinkIcon className="h-3 w-3 mr-1" />
                                  Outrank
                                </Badge>
                              ) : (
                                <Badge variant="outline">Manual</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDateTimePST(post.published_date)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {post.tags.slice(0, 2).map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {post.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{post.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setEditingPost(post)
                                    setIsNewPost(false)
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`)
                                    toast({
                                      title: 'Link copied',
                                      description: 'Blog post URL copied to clipboard'
                                    })
                                  }}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outrank Integration Tab */}
            <TabsContent value="outrank" className="mt-6">
              <div className="grid gap-6">
                {/* Connection Status */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Outrank Connection</CardTitle>
                        <CardDescription>Configure your Outrank webhook integration</CardDescription>
                      </div>
                      <Badge variant={
                        outrank.sync_status === 'connected' ? 'default' :
                        outrank.sync_status === 'error' ? 'destructive' :
                        'secondary'
                      }>
                        {outrank.sync_status === 'connected' && <CheckCircle className="h-4 w-4 mr-1" />}
                        {outrank.sync_status === 'error' && <XCircle className="h-4 w-4 mr-1" />}
                        {outrank.sync_status === 'disconnected' && <AlertTriangle className="h-4 w-4 mr-1" />}
                        {outrank.sync_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Last Sync</span>
                          <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold">
                          {outrank.last_sync ? formatDateTimePST(outrank.last_sync) : 'Never'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Total Synced</span>
                          <FileText className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold">{outrank.total_synced} articles</p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Auto-Publish</span>
                          <Activity className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={outrank.auto_publish}
                            onCheckedChange={(checked) => setOutrank({...outrank, auto_publish: checked})}
                          />
                          <span className="text-sm font-semibold">
                            {outrank.auto_publish ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Webhook Configuration</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="webhook-url">Webhook URL</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              id="webhook-url"
                              value={typeof window !== 'undefined' ? `${window.location.origin}/api/outrank-webhook` : '/api/outrank-webhook'}
                              readOnly
                              className="flex-1 bg-gray-50"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  navigator.clipboard.writeText(`${window.location.origin}/api/outrank-webhook`)
                                  toast({
                                    title: 'Copied',
                                    description: 'Webhook URL copied to clipboard'
                                  })
                                }
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Add this URL to your Outrank webhook settings
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="webhook-secret">Webhook Secret</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              id="webhook-secret"
                              type="password"
                              placeholder="Enter your webhook secret token"
                              value={outrank.webhook_secret}
                              onChange={(e) => setOutrank({...outrank, webhook_secret: e.target.value})}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const token = btoa(Math.random().toString(36).substr(2))
                                setOutrank({...outrank, webhook_secret: token})
                                toast({
                                  title: 'Generated',
                                  description: 'New webhook secret generated'
                                })
                              }}
                            >
                              Generate
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Use this as the Bearer token in Outrank's Authorization header
                          </p>
                        </div>
                        
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertTitle>Security Note</AlertTitle>
                          <AlertDescription>
                            Keep your webhook secret secure. It authenticates requests from Outrank.
                            Configure it as: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer [your-secret]</code>
                          </AlertDescription>
                        </Alert>
                        
                        <Alert className="border-blue-200 bg-blue-50">
                          <Globe className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-900">Contentful Integration</AlertTitle>
                          <AlertDescription className="text-blue-700">
                            Articles from Outrank will be automatically synced to your Contentful CMS.
                            Make sure your blogPost content type has an <code className="bg-blue-100 px-1 rounded">outrank_id</code> field (Text, unique) to track articles.
                            The CONTENTFUL_MANAGEMENT_TOKEN environment variable must be configured.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex gap-3">
                          <Button onClick={saveOutrankConfig} disabled={savingConfig}>
                            {savingConfig && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Configuration
                          </Button>
                          <Button variant="outline" onClick={testWebhook} disabled={testingWebhook}>
                            {testingWebhook && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Test Webhook
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Sync Activity</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">3 articles synced</p>
                              <p className="text-xs text-gray-500">2 hours ago</p>
                            </div>
                          </div>
                          <Badge variant="outline">Success</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            <div>
                              <p className="text-sm font-medium">1 article updated (duplicate slug)</p>
                              <p className="text-xs text-gray-500">5 hours ago</p>
                            </div>
                          </div>
                          <Badge variant="outline">Warning</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Setup Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Setup Instructions</CardTitle>
                    <CardDescription>How to configure Outrank to send articles to your blog</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">1</span>
                        <div>
                          <p className="font-medium">Configure Webhook in Outrank</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Go to Outrank Settings → Webhooks → Add New Webhook
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">2</span>
                        <div>
                          <p className="font-medium">Add Webhook URL</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Copy the webhook URL above and paste it in Outrank
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">3</span>
                        <div>
                          <p className="font-medium">Set Authorization Header</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Add header: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer [your-secret]</code>
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">4</span>
                        <div>
                          <p className="font-medium">Select Events</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Enable "Article Published" event in Outrank webhook settings
                          </p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">5</span>
                        <div>
                          <p className="font-medium">Test Connection</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Use the "Test Webhook" button above to verify the connection
                          </p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Webhook Monitoring Tab */}
            <TabsContent value="monitoring" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Webhook Call Monitoring</CardTitle>
                      <CardDescription>Monitor incoming webhook calls from Outrank</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={createWebhookLogsTable}
                        size="sm"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Initialize Logs
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={fetchWebhookLogs}
                        disabled={logsLoading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status Filter */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={logsStatusFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setLogsStatusFilter('all')
                        fetchWebhookLogs()
                      }}
                    >
                      All Calls
                    </Button>
                    <Button
                      variant={logsStatusFilter === '200' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setLogsStatusFilter('200')
                        fetchWebhookLogs()
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      Success (200)
                    </Button>
                    <Button
                      variant={logsStatusFilter === '401' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setLogsStatusFilter('401')
                        fetchWebhookLogs()
                      }}
                    >
                      <Shield className="h-4 w-4 mr-1 text-yellow-500" />
                      Unauthorized (401)
                    </Button>
                    <Button
                      variant={logsStatusFilter === '500' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setLogsStatusFilter('500')
                        fetchWebhookLogs()
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1 text-red-500" />
                      Error (500)
                    </Button>
                  </div>

                  {/* Webhook Logs Table */}
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : webhookLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No webhook calls logged yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Webhook calls from Outrank will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {webhookLogs.map((log) => (
                        <div 
                          key={log.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedLog(log)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={
                                  log.response_status === 200 ? 'default' :
                                  log.response_status === 401 ? 'secondary' :
                                  'destructive'
                                }>
                                  {log.response_status}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {log.processing_time_ms}ms
                                </span>
                              </div>
                              
                              <div className="text-sm">
                                <p className="font-medium">
                                  {log.request_body?.event_type || 'Unknown Event'}
                                </p>
                                {log.request_body?.data?.articles && (
                                  <p className="text-gray-500">
                                    Articles: {log.request_body.data.articles.length}
                                  </p>
                                )}
                                {log.error_message && (
                                  <p className="text-red-500 text-xs mt-1">
                                    Error: {log.error_message}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                <span>IP: {log.ip_address}</span>
                                <span>User Agent: {log.user_agent?.substring(0, 50)}...</span>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLog(log)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Log Details Dialog */}
              {selectedLog && (
                <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Webhook Call Details</DialogTitle>
                      <DialogDescription>
                        {new Date(selectedLog.created_at).toLocaleString()} - Status: {selectedLog.response_status}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Request Headers</h4>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.request_headers, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Request Body</h4>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.request_body, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Response</h4>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.response_body, null, 2)}
                        </pre>
                      </div>
                      
                      {selectedLog.error_message && (
                        <div>
                          <h4 className="font-semibold mb-2 text-red-600">Error</h4>
                          <pre className="bg-red-50 p-2 rounded text-xs text-red-600">
                            {selectedLog.error_message}
                          </pre>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Blog Analytics</CardTitle>
                    <CardDescription>Performance metrics for your blog content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Analytics coming soon</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Track views, engagement, and performance metrics
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Post Dialog */}
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isNewPost ? 'Create New Post' : 'Edit Post'}</DialogTitle>
              <DialogDescription>
                {isNewPost ? 'Create a new blog post' : 'Edit your blog post details'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                  placeholder="Enter post title"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={editingPost.slug}
                  onChange={(e) => setEditingPost({...editingPost, slug: e.target.value})}
                  placeholder="post-url-slug"
                />
              </div>
              
              <div>
                <Label htmlFor="meta">Meta Description</Label>
                <Textarea
                  id="meta"
                  value={editingPost.meta_description}
                  onChange={(e) => setEditingPost({...editingPost, meta_description: e.target.value})}
                  placeholder="SEO meta description"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="image">Featured Image URL</Label>
                <Input
                  id="image"
                  value={editingPost.featured_image_url}
                  onChange={(e) => setEditingPost({...editingPost, featured_image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content (HTML)</Label>
                <Textarea
                  id="content"
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                  placeholder="Blog post content in HTML"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={editingPost.tags.join(', ')}
                  onChange={(e) => setEditingPost({
                    ...editingPost, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                  placeholder="AI, Technology, Innovation"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={editingPost.status} 
                    onValueChange={(value) => setEditingPost({...editingPost, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date">Publish Date</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={editingPost.published_date.slice(0, 16)}
                    onChange={(e) => setEditingPost({
                      ...editingPost, 
                      published_date: new Date(e.target.value).toISOString()
                    })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPost(null)}>
                Cancel
              </Button>
              <Button onClick={handleSavePost}>
                {isNewPost ? 'Create Post' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Archive,
  RotateCcw,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BlogQueueItem, QueueStatus, QueueStats } from '@/lib/blog-queue-db'
import { QueueItemsTable } from './QueueItemsTable'
import { QueueItemDialog } from './QueueItemDialog'
import { BriefsPromptEditor } from './BriefsPromptEditor'
import { WorkflowTriggerCard } from './WorkflowTriggerCard'

const DEFAULT_BRIEFS_PROMPT = `You are generating fresh blog post briefs for Speak About AI...`

export function BlogQueueTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<BlogQueueItem[]>([])
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [editingItem, setEditingItem] = useState<BlogQueueItem | null>(null)
  const [isNewItem, setIsNewItem] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/blog-queue?${params}`, {
        headers: { 'x-admin-request': 'true' }
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching queue items:', error)
      toast({
        title: 'Error',
        description: 'Failed to load queue items',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchTerm, toast])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/blog-queue/stats', {
        headers: { 'x-admin-request': 'true' }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/blog-queue/settings', {
        headers: { 'x-admin-request': 'true' }
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || {})
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  useEffect(() => {
    fetchItems()
    fetchStats()
    fetchSettings()
  }, [fetchItems])

  const handleSaveItem = async (data: Partial<BlogQueueItem>) => {
    const url = isNewItem
      ? '/api/admin/blog-queue'
      : `/api/admin/blog-queue/${editingItem?.id}`

    const response = await fetch(url, {
      method: isNewItem ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-request': 'true'
      },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      toast({
        title: 'Success',
        description: `Item ${isNewItem ? 'created' : 'updated'} successfully`
      })
      fetchItems()
      fetchStats()
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save item')
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/admin/blog-queue/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-request': 'true' }
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Item deleted' })
        setSelectedIds(prev => prev.filter(i => i !== id))
        fetchItems()
        fetchStats()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive'
      })
    }
  }

  const handleRequeue = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/blog-queue/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify({ status: 'queued', error_message: null })
      })

      if (response.ok) {
        toast({ title: 'Success', description: 'Item re-queued' })
        fetchItems()
        fetchStats()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to re-queue item',
        variant: 'destructive'
      })
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select items to perform this action',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/admin/blog-queue/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify({ ids: selectedIds, action })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: `${data.affected} items updated`
        })
        setSelectedIds([])
        fetchItems()
        fetchStats()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive'
      })
    }
  }

  const handleSaveSettings = async (newSettings: Record<string, string>) => {
    const response = await fetch('/api/admin/blog-queue/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-request': 'true'
      },
      body: JSON.stringify({ settings: newSettings })
    })

    if (response.ok) {
      toast({ title: 'Success', description: 'Settings saved' })
      setSettings(prev => ({ ...prev, ...newSettings }))
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save settings')
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Queued</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.queued || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Processing</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.processing || 0}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Drafted</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.drafted || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-2xl font-bold text-green-600">{stats?.created || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Error</p>
                <p className="text-2xl font-bold text-red-600">{stats?.error || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Triggers */}
      <WorkflowTriggerCard />

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Blog Queue</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search briefs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="drafted">Drafted</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              {selectedIds.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Bulk Actions ({selectedIds.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('queue')}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Re-queue
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                      <Archive className="h-4 w-4 mr-2" />
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
              <Button variant="outline" onClick={fetchItems}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => {
                setEditingItem(null)
                setIsNewItem(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <QueueItemsTable
            items={items}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={(item) => {
              setEditingItem(item)
              setIsNewItem(false)
            }}
            onDelete={handleDeleteItem}
            onRequeue={handleRequeue}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Settings Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pipeline Settings</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </Button>
      </div>

      {showSettings && (
        <BriefsPromptEditor
          prompt={settings.briefs_prompt || DEFAULT_BRIEFS_PROMPT}
          ctaRatio={settings.cta_ratio || '0.6'}
          onSave={handleSaveSettings}
          defaultPrompt={DEFAULT_BRIEFS_PROMPT}
        />
      )}

      {/* Edit Dialog */}
      <QueueItemDialog
        item={editingItem}
        isNew={isNewItem}
        open={isNewItem || editingItem !== null}
        onClose={() => {
          setEditingItem(null)
          setIsNewItem(false)
        }}
        onSave={handleSaveItem}
      />
    </div>
  )
}

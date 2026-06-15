'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BlogQueueItem, QueueStatus, BlogCategory } from '@/lib/blog-queue-db'
import { Loader2 } from 'lucide-react'

interface QueueItemDialogProps {
  item: BlogQueueItem | null
  isNew: boolean
  open: boolean
  onClose: () => void
  onSave: (item: Partial<BlogQueueItem>) => Promise<void>
}

const statusOptions: QueueStatus[] = ['queued', 'processing', 'drafted', 'created', 'error', 'archived']
const categoryOptions: BlogCategory[] = ['AI Speakers', 'Event Planning', 'Industry Insights', 'Speaker Spotlight', 'Company News']

export function QueueItemDialog({
  item,
  isNew,
  open,
  onClose,
  onSave
}: QueueItemDialogProps) {
  const [formData, setFormData] = useState<Partial<BlogQueueItem>>({})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        tags: item.tags || [],
        speakers: item.speakers || []
      })
    } else if (isNew) {
      setFormData({
        status: 'queued',
        brief: '',
        author_id: '1VbdoaPazuvwGFuLwaZR6O'
      })
    }
    setActiveTab('basic')
  }, [item, isNew, open])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof BlogQueueItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add Queue Item' : 'Edit Queue Item'}</DialogTitle>
          <DialogDescription>
            {isNew ? 'Create a new item in the blog queue' : `Edit item #${item?.id}`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Media & SEO</TabsTrigger>
            <TabsTrigger value="publishing">Publishing</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateField('status', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brief">Brief *</Label>
              <Textarea
                id="brief"
                value={formData.brief || ''}
                onChange={(e) => updateField('brief', e.target.value)}
                placeholder="Detailed brief for article generation..."
                rows={6}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                The original prompt/brief for the article. Required.
              </p>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Article title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug || ''}
                onChange={(e) => updateField('slug', e.target.value)}
                placeholder="article-url-slug"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category || ''}
                onValueChange={(value) => updateField('category', value || null)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt || ''}
                onChange={(e) => updateField('excerpt', e.target.value)}
                placeholder="Brief summary for listing pages..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="body_content">Body Content (Markdown)</Label>
              <Textarea
                id="body_content"
                value={formData.body_content || ''}
                onChange={(e) => updateField('body_content', e.target.value)}
                placeholder="Full article content in markdown..."
                rows={12}
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="body_path">Body Path (for Python scripts)</Label>
              <Input
                id="body_path"
                value={formData.body_path || ''}
                onChange={(e) => updateField('body_path', e.target.value)}
                placeholder="drafts/article-slug.md"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Local file path used by Python scripts
              </p>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description || ''}
                onChange={(e) => updateField('meta_description', e.target.value)}
                placeholder="SEO meta description (145-160 chars)..."
                rows={2}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.meta_description?.length || 0} / 160 characters
              </p>
            </div>

            <div>
              <Label htmlFor="image_prompt">Image Prompt</Label>
              <Textarea
                id="image_prompt"
                value={formData.image_prompt || ''}
                onChange={(e) => updateField('image_prompt', e.target.value)}
                placeholder="Visual description for hero image generation..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="hero_image_url">Hero Image URL</Label>
              <Input
                id="hero_image_url"
                value={formData.hero_image_url || ''}
                onChange={(e) => updateField('hero_image_url', e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
              {formData.hero_image_url && (
                <div className="mt-2">
                  <img
                    src={formData.hero_image_url}
                    alt="Hero preview"
                    className="max-h-32 rounded border"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                placeholder="AI, keynote, event planning"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="seo_keywords">SEO Keywords (comma-separated)</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords || ''}
                onChange={(e) => updateField('seo_keywords', e.target.value)}
                placeholder="AI keynote speaker, corporate events, AI expert"
                className="mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="publishing" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="published_date">Published Date</Label>
              <Input
                id="published_date"
                type="datetime-local"
                value={formData.published_date ? formData.published_date.slice(0, 16) : ''}
                onChange={(e) => updateField('published_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="display_title">Display Title (optional)</Label>
              <Input
                id="display_title"
                value={formData.display_title || ''}
                onChange={(e) => updateField('display_title', e.target.value)}
                placeholder="Alternative title for display"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="speakers">Speakers (comma-separated IDs)</Label>
              <Input
                id="speakers"
                value={formData.speakers?.join(', ') || ''}
                onChange={(e) => updateField('speakers', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                placeholder="speaker-id-1, speaker-id-2"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="author_id">Author ID</Label>
              <Input
                id="author_id"
                value={formData.author_id || ''}
                onChange={(e) => updateField('author_id', e.target.value)}
                placeholder="1VbdoaPazuvwGFuLwaZR6O"
                className="mt-1"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Contentful Output</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contentful_entry_id">Entry ID</Label>
                  <Input
                    id="contentful_entry_id"
                    value={formData.contentful_entry_id || ''}
                    onChange={(e) => updateField('contentful_entry_id', e.target.value)}
                    className="mt-1"
                    disabled={isNew}
                  />
                </div>
                <div>
                  <Label htmlFor="contentful_entry_url">Entry URL</Label>
                  <Input
                    id="contentful_entry_url"
                    value={formData.contentful_entry_url || ''}
                    onChange={(e) => updateField('contentful_entry_url', e.target.value)}
                    className="mt-1"
                    disabled={isNew}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Processing Info</h4>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              {formData.error_message && (
                <div className="mt-2">
                  <Label className="text-red-600">Error Message</Label>
                  <pre className="mt-1 p-2 bg-red-50 text-red-600 text-xs rounded overflow-x-auto">
                    {formData.error_message}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.brief}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isNew ? 'Create' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

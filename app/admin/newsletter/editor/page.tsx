'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Mail, 
  Send, 
  Save, 
  Eye, 
  Clock,
  Users,
  ArrowLeft,
  Code,
  Type,
  Image,
  Link,
  List,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Trash2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  FileText,
  Sparkles
} from 'lucide-react'

interface Newsletter {
  id?: number
  title: string
  subject: string
  preheader: string
  content: string
  html_content: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent'
  template: string
  scheduled_for?: string
  sent_at?: string
  recipient_count?: number
  created_at?: string
  updated_at?: string
}

interface NewsletterSubscriber {
  id: number
  email: string
  name: string | null
  company: string | null
  status: string
}

interface NewsletterTemplate {
  id: number
  name: string
  description: string | null
  html_template: string
  text_template: string | null
  variables: string[]
}

function NewsletterEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const newsletterId = searchParams.get('id')
  const shouldSend = searchParams.get('send') === 'true'
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([])
  const [selectedTab, setSelectedTab] = useState('editor')
  const [showPreview, setShowPreview] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  
  const [newsletter, setNewsletter] = useState<Newsletter>({
    title: '',
    subject: '',
    preheader: '',
    content: '',
    html_content: '',
    status: 'draft',
    template: 'default'
  })

  // Rich text editor state
  const [selectedText, setSelectedText] = useState('')
  const [editorHistory, setEditorHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    // Check if logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/admin')
      return
    }

    fetchSubscribers()
    fetchTemplates()
    
    if (newsletterId && newsletterId !== 'new') {
      fetchNewsletter(newsletterId).then(() => {
        if (shouldSend) {
          setShowSendDialog(true)
        }
      })
    } else {
      // Generate default content for new newsletter
      generateDefaultContent()
    }
  }, [newsletterId, router])

  const fetchNewsletter = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/newsletters/${id}`, {
        headers: { 'x-admin-request': 'true' }
      })
      if (response.ok) {
        const data = await response.json()
        setNewsletter(data)
      }
    } catch (error) {
      console.error('Error fetching newsletter:', error)
      toast({
        title: 'Error',
        description: 'Failed to load newsletter',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/newsletter?status=active', {
        headers: { 'x-admin-request': 'true' }
      })
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.signups || [])
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/newsletter-templates', {
        headers: { 'x-admin-request': 'true' }
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const loadTemplate = (template: NewsletterTemplate) => {
    // Check if template is from visual editor (stored as JSON)
    let htmlContent = template.html_template
    
    try {
      const parsedTemplate = JSON.parse(template.html_template)
      if (parsedTemplate.blocks && parsedTemplate.globalStyles) {
        // Generate HTML from visual editor template
        htmlContent = generateHtmlFromVisualTemplate(parsedTemplate)
      }
    } catch {
      // Use raw HTML if not JSON
      htmlContent = template.html_template
    }
    
    setNewsletter(prev => ({
      ...prev,
      html_content: htmlContent,
      content: template.text_template || '',
      template: template.name
    }))
    setShowTemplateSelector(false)
    toast({
      title: 'Template Loaded',
      description: `${template.name} template has been applied`
    })
  }
  
  const generateHtmlFromVisualTemplate = (template: any) => {
    let html = `<div style="font-family: ${template.globalStyles.fontFamily}; color: ${template.globalStyles.textColor}; max-width: 600px; margin: 0 auto;">`
    
    template.blocks.forEach((block: any) => {
      switch (block.type) {
        case 'header':
          html += `<div style="background-color: ${block.styles.backgroundColor}; padding: ${block.styles.padding}; text-align: ${block.styles.textAlign};">
            <h1 style="margin: 0; font-size: ${block.styles.logoSize}; color: ${template.globalStyles.textColor};">${block.content.logo}</h1>
            <p style="margin: 5px 0 0 0; font-size: ${block.styles.taglineSize}; color: ${template.globalStyles.textColor}; opacity: 0.8;">${block.content.tagline}</p>
          </div>`
          break
        case 'text':
          html += `<div style="padding: ${block.styles.padding}; text-align: ${block.styles.textAlign};">
            <p style="font-size: ${block.styles.fontSize}; line-height: ${block.styles.lineHeight}; margin: 0;">${block.content.text}</p>
          </div>`
          break
        case 'button':
          html += `<div style="text-align: ${block.styles.textAlign}; padding: 20px;">
            <a href="${block.content.url}" style="display: inline-block; background-color: ${block.styles.backgroundColor}; color: ${block.styles.color}; padding: ${block.styles.padding}; border-radius: ${block.styles.borderRadius}; text-decoration: none; font-size: ${block.styles.fontSize};">${block.content.text}</a>
          </div>`
          break
        case 'image':
          html += `<div style="text-align: ${block.styles.alignment}; padding: ${block.styles.padding};">
            <img src="${block.content.url}" alt="${block.content.alt}" style="max-width: ${block.styles.width}; height: auto;">
          </div>`
          break
        case 'divider':
          html += `<hr style="border: none; border-top: ${block.styles.borderWidth} solid ${block.styles.borderColor}; margin: ${block.styles.margin};">`
          break
        case 'footer':
          html += `<div style="background-color: ${block.styles.backgroundColor}; padding: ${block.styles.padding}; text-align: ${block.styles.textAlign};">
            <p style="margin: 0; font-size: ${block.styles.fontSize}; color: ${block.styles.color};">
              ${block.content.company}<br>
              ${block.content.address}
              ${block.content.unsubscribe ? '<br><a href="{{unsubscribe_url}}" style="color: ' + block.styles.color + ';">Unsubscribe</a>' : ''}
            </p>
          </div>`
          break
      }
    })
    
    html += '</div>'
    return html
  }

  const generateDefaultContent = () => {
    const defaultHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; font-size: 28px; margin: 0;">Speak About AI</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Your Weekly AI Speaking Insights</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 10px 0; font-size: 24px;">Welcome to Our Newsletter!</h2>
          <p style="margin: 0; opacity: 0.95;">Stay updated with the latest in AI speaking engagements and industry insights.</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e293b; font-size: 20px; margin-bottom: 15px;">📢 Featured Speakers</h3>
          <p style="color: #475569; line-height: 1.6;">
            Discover our exceptional AI speakers who are shaping the conversation around artificial intelligence, 
            innovation, and the future of technology.
          </p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e293b; font-size: 20px; margin-bottom: 15px;">🎯 Upcoming Events</h3>
          <p style="color: #475569; line-height: 1.6;">
            Don't miss these upcoming speaking opportunities and events where our speakers will be presenting.
          </p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e293b; font-size: 20px; margin-bottom: 15px;">💡 Industry Insights</h3>
          <p style="color: #475569; line-height: 1.6;">
            The latest trends and developments in AI that are shaping keynote topics and audience interests.
          </p>
        </div>
        
        <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            © 2024 Speak About AI. All rights reserved.<br>
            <a href="https://speakabout.ai" style="color: #667eea; text-decoration: none;">Visit our website</a> | 
            <a href="{{unsubscribe_url}}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `
    
    setNewsletter(prev => ({
      ...prev,
      html_content: defaultHtml,
      content: 'Welcome to our newsletter! Stay updated with the latest in AI speaking engagements.'
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const url = newsletter.id 
        ? `/api/admin/newsletters/${newsletter.id}`
        : '/api/admin/newsletters'
      
      const method = newsletter.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify(newsletter)
      })
      
      if (response.ok) {
        const data = await response.json()
        setNewsletter(data)
        toast({
          title: 'Success',
          description: 'Newsletter saved successfully'
        })
        
        if (!newsletter.id && data.id) {
          router.push(`/admin/newsletter/editor?id=${data.id}`)
        }
      } else {
        throw new Error('Failed to save newsletter')
      }
    } catch (error) {
      console.error('Error saving newsletter:', error)
      toast({
        title: 'Error',
        description: 'Failed to save newsletter',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive'
      })
      return
    }

    try {
      setSending(true)
      const response = await fetch('/api/admin/newsletters/send-test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify({
          ...newsletter,
          test_email: testEmail
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Test email sent to ${testEmail}`
        })
        setTestEmail('')
      } else {
        throw new Error('Failed to send test email')
      }
    } catch (error) {
      console.error('Error sending test:', error)
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const handleSendNewsletter = async () => {
    if (!newsletter.id) {
      toast({
        title: 'Error',
        description: 'Please save the newsletter first',
        variant: 'destructive'
      })
      return
    }

    if (subscribers.length === 0) {
      toast({
        title: 'Error',
        description: 'No active subscribers found',
        variant: 'destructive'
      })
      return
    }

    try {
      setSending(true)
      const response = await fetch(`/api/admin/newsletters/${newsletter.id}/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify({
          recipient_list: subscribers.map(s => ({
            email: s.email,
            name: s.name
          }))
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Newsletter sent to ${subscribers.length} subscribers`
        })
        setNewsletter(prev => ({ ...prev, status: 'sent' }))
        router.push('/admin/newsletter')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send newsletter')
      }
    } catch (error) {
      console.error('Error sending newsletter:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send newsletter',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const insertHtmlElement = (tag: string, className?: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const element = document.createElement(tag)
    if (className) element.className = className
    
    if (tag === 'a') {
      const url = prompt('Enter URL:')
      if (!url) return
      element.setAttribute('href', url)
      element.setAttribute('style', 'color: #667eea; text-decoration: none;')
    }
    
    if (tag === 'img') {
      const src = prompt('Enter image URL:')
      if (!src) return
      element.setAttribute('src', src)
      element.setAttribute('style', 'max-width: 100%; height: auto;')
    }
    
    if (selection.toString()) {
      element.textContent = selection.toString()
      range.deleteContents()
    } else if (tag !== 'img') {
      element.textContent = tag === 'h1' ? 'Heading 1' : 
                           tag === 'h2' ? 'Heading 2' : 
                           tag === 'h3' ? 'Heading 3' : 
                           tag === 'p' ? 'Paragraph text' : 
                           'Text'
    }
    
    range.insertNode(element)
    
    // Update the newsletter content
    const editorDiv = document.getElementById('html-editor')
    if (editorDiv) {
      setNewsletter(prev => ({ ...prev, html_content: editorDiv.innerHTML }))
    }
  }

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    const editorDiv = document.getElementById('html-editor')
    if (editorDiv) {
      setNewsletter(prev => ({ ...prev, html_content: editorDiv.innerHTML }))
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/newsletter')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Newsletter Editor</h1>
                <p className="text-gray-600 mt-1">
                  Create and send newsletters to your subscribers
                </p>
              </div>
            </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={newsletter.status === 'sent' ? 'default' : 'secondary'}>
              {newsletter.status}
            </Badge>
            {newsletter.created_at && (
              <span className="text-sm text-gray-500">
                Created {new Date(newsletter.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-3 gap-6">
            {/* Editor Section */}
            <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Internal Title</Label>
                  <Input
                    id="title"
                    value={newsletter.title}
                    onChange={(e) => setNewsletter(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., January 2024 Newsletter"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={newsletter.subject}
                    onChange={(e) => setNewsletter(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., 🚀 AI Speaking Insights - January Edition"
                  />
                </div>
                
                <div>
                  <Label htmlFor="preheader">Preheader Text</Label>
                  <Input
                    id="preheader"
                    value={newsletter.preheader}
                    onChange={(e) => setNewsletter(prev => ({ ...prev, preheader: e.target.value }))}
                    placeholder="Preview text that appears after subject"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This appears next to the subject in most email clients
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Content Editor</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTab('editor')}
                    >
                      <Type className="h-4 w-4 mr-1" />
                      Visual
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTab('html')}
                    >
                      <Code className="h-4 w-4 mr-1" />
                      HTML
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsContent value="editor">
                    {/* Toolbar */}
                    <div className="border rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlElement('h1')}
                      >
                        H1
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlElement('h2')}
                      >
                        H2
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlElement('h3')}
                      >
                        H3
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlElement('p')}
                      >
                        P
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('bold')}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('italic')}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('underline')}
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlElement('a')}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHtmlElement('img')}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('insertUnorderedList')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('justifyLeft')}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('justifyCenter')}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => formatText('justifyRight')}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Editor */}
                    <div
                      id="html-editor"
                      className="border border-t-0 rounded-b-lg p-4 min-h-[400px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      contentEditable
                      dangerouslySetInnerHTML={{ __html: newsletter.html_content }}
                      onInput={(e) => {
                        const target = e.target as HTMLDivElement
                        setNewsletter(prev => ({ ...prev, html_content: target.innerHTML }))
                      }}
                    />
                  </TabsContent>
                  
                  <TabsContent value="html">
                    <Textarea
                      value={newsletter.html_content}
                      onChange={(e) => setNewsletter(prev => ({ ...prev, html_content: e.target.value }))}
                      className="font-mono text-sm min-h-[500px]"
                      placeholder="Enter HTML content..."
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

            {/* Sidebar */}
            <div className="space-y-6">
            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Choose Template
                </Button>
                
                {showTemplateSelector && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => loadTemplate(template)}
                      >
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        {template.description && (
                          <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.slice(0, 3).map((variable) => (
                            <Badge key={variable} variant="secondary" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No templates available.{' '}
                        <button
                          onClick={() => router.push('/admin/newsletter/templates/visual-editor')}
                          className="text-blue-600 hover:underline"
                        >
                          Create one
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Draft
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                
                <div className="pt-3 border-t">
                  <Label htmlFor="test-email">Send Test Email</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSendTest}
                      disabled={sending || !testEmail}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleSendNewsletter}
                    disabled={sending || !newsletter.subject || !newsletter.html_content}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send to {subscribers.length} Subscribers
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Newsletter will be sent immediately to all active subscribers
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Subscribers</span>
                    <Badge>{subscribers.length}</Badge>
                  </div>
                  {newsletter.sent_at && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Sent At</span>
                        <span className="text-sm">
                          {new Date(newsletter.sent_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Opens</span>
                        <span className="text-sm">{newsletter.open_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Clicks</span>
                        <span className="text-sm">{newsletter.click_count || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={generateDefaultContent}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Default Template
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    navigator.clipboard.writeText(newsletter.html_content)
                    toast({
                      title: 'Copied',
                      description: 'HTML content copied to clipboard'
                    })
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy HTML
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Newsletter Preview</DialogTitle>
              <DialogDescription>
                This is how your newsletter will appear to recipients
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg p-4 bg-white">
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-gray-500">Subject:</p>
                <p className="font-medium">{newsletter.subject || 'No subject'}</p>
                {newsletter.preheader && (
                  <p className="text-sm text-gray-500 mt-1">{newsletter.preheader}</p>
                )}
              </div>
              <div dangerouslySetInnerHTML={{ __html: newsletter.html_content }} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Newsletter</DialogTitle>
              <DialogDescription>
                This will send the newsletter to all {subscribers.length} active subscribers immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Newsletter Details</span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Subject:</strong> {newsletter.subject}</p>
                  <p><strong>Recipients:</strong> {subscribers.length} active subscribers</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSendDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleSendNewsletter()
                    setShowSendDialog(false)
                  }}
                  disabled={sending || !newsletter.subject || !newsletter.html_content}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to avoid SSG issues with useSearchParams
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function NewsletterEditor() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewsletterEditorContent />
    </Suspense>
  )
}
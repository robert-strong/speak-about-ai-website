'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft,
  Save,
  Eye,
  Code,
  Type,
  Plus,
  X,
  Loader2,
  FileText,
  Palette
} from 'lucide-react'

interface NewsletterTemplate {
  id?: number
  name: string
  description: string
  html_template: string
  text_template: string
  default_styles: string
  variables: string[]
  thumbnail_url: string
}

function TemplateEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const templateId = searchParams.get('id')
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [newVariable, setNewVariable] = useState('')
  
  const [template, setTemplate] = useState<NewsletterTemplate>({
    name: '',
    description: '',
    html_template: '',
    text_template: '',
    default_styles: '',
    variables: [],
    thumbnail_url: ''
  })

  useEffect(() => {
    // Check if logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/admin')
      return
    }

    if (templateId && templateId !== 'new') {
      fetchTemplate(templateId)
    } else {
      generateDefaultTemplate()
    }
  }, [templateId, router])

  const fetchTemplate = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/newsletter-templates/${id}`, {
        headers: { 'x-admin-request': 'true' }
      })
      if (response.ok) {
        const data = await response.json()
        setTemplate({
          ...data,
          variables: Array.isArray(data.variables) ? data.variables : []
        })
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateDefaultTemplate = () => {
    setTemplate({
      name: 'New Template',
      description: '',
      html_template: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      background: #f8f9fa; 
      padding: 20px; 
      text-align: center; 
      border-radius: 8px; 
    }
    .content { 
      padding: 20px 0; 
    }
    .footer { 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
      border-top: 1px solid #eee; 
      padding-top: 20px; 
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{newsletter_title}}</h1>
  </div>
  
  <div class="content">
    <p>Hello {{name}},</p>
    
    <p>{{content}}</p>
    
    <p>Best regards,<br>The Speak About AI Team</p>
  </div>
  
  <div class="footer">
    <p>You're receiving this because you subscribed to our newsletter.</p>
    <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
  </div>
</body>
</html>`,
      text_template: `Hello {{name}},

{{content}}

Best regards,
The Speak About AI Team

---
You're receiving this because you subscribed to our newsletter.
Unsubscribe: {{unsubscribe_url}}`,
      default_styles: '',
      variables: ['subject', 'newsletter_title', 'name', 'content', 'unsubscribe_url'],
      thumbnail_url: ''
    })
  }

  const handleSave = async () => {
    if (!template.name.trim()) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        variant: 'destructive'
      })
      return
    }

    if (!template.html_template.trim()) {
      toast({
        title: 'Error',
        description: 'HTML template is required',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      const url = templateId && templateId !== 'new' 
        ? `/api/admin/newsletter-templates/${templateId}` 
        : '/api/admin/newsletter-templates'
      
      const method = templateId && templateId !== 'new' ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify(template)
      })
      
      if (response.ok) {
        const savedTemplate = await response.json()
        setTemplate(savedTemplate)
        
        toast({
          title: 'Success',
          description: `Template ${templateId && templateId !== 'new' ? 'updated' : 'created'} successfully`
        })
        
        if (!templateId || templateId === 'new') {
          router.push(`/admin/newsletter/templates/editor?id=${savedTemplate.id}`)
        }
      } else {
        throw new Error('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const addVariable = () => {
    if (newVariable.trim() && !template.variables.includes(newVariable.trim())) {
      setTemplate(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()]
      }))
      setNewVariable('')
    }
  }

  const removeVariable = (variableToRemove: string) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variableToRemove)
    }))
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
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/newsletter/templates')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Template Editor</h1>
                <p className="text-gray-600 mt-1">
                  {templateId && templateId !== 'new' ? 'Edit' : 'Create'} newsletter template
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Template
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-3 gap-6">
            {/* Editor Section */}
            <div className="col-span-2 space-y-6">
              {/* Template Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={template.name}
                      onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Newsletter Template"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={template.description}
                      onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this template..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Template Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="html">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="html">
                        <Code className="h-4 w-4 mr-2" />
                        HTML
                      </TabsTrigger>
                      <TabsTrigger value="text">
                        <Type className="h-4 w-4 mr-2" />
                        Text
                      </TabsTrigger>
                      <TabsTrigger value="styles">
                        <Palette className="h-4 w-4 mr-2" />
                        Styles
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="html" className="mt-4">
                      <div>
                        <Label>HTML Template</Label>
                        <Textarea
                          value={template.html_template}
                          onChange={(e) => setTemplate(prev => ({ ...prev, html_template: e.target.value }))}
                          placeholder="Enter HTML template..."
                          className="font-mono text-sm min-h-[400px] mt-2"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="text" className="mt-4">
                      <div>
                        <Label>Text Template (Fallback)</Label>
                        <Textarea
                          value={template.text_template}
                          onChange={(e) => setTemplate(prev => ({ ...prev, text_template: e.target.value }))}
                          placeholder="Enter plain text template..."
                          className="font-mono text-sm min-h-[400px] mt-2"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="styles" className="mt-4">
                      <div>
                        <Label>Default Styles (CSS)</Label>
                        <Textarea
                          value={template.default_styles}
                          onChange={(e) => setTemplate(prev => ({ ...prev, default_styles: e.target.value }))}
                          placeholder="Enter additional CSS styles..."
                          className="font-mono text-sm min-h-[400px] mt-2"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Variables */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Variables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Add Variable</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newVariable}
                        onChange={(e) => setNewVariable(e.target.value)}
                        placeholder="variable_name"
                        onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                      />
                      <Button size="sm" onClick={addVariable}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Available Variables</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="flex items-center gap-1">
                          <span>{`{{${variable}}}`}</span>
                          <button
                            onClick={() => removeVariable(variable)}
                            className="hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    {template.variables.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">No variables defined</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              {showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-white max-h-80 overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: template.html_template }} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to avoid SSG issues with useSearchParams
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function TemplateEditor() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateEditorContent />
    </Suspense>
  )
}
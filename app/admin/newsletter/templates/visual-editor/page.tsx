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
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Type,
  Image,
  Square,
  Minus,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Plus,
  Trash2,
  Move,
  Settings,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Link,
  Heading1,
  Heading2,
  FileText,
  MousePointer,
  Layers,
  ChevronUp,
  ChevronDown,
  Copy,
  Grid,
  Columns,
  Star
} from 'lucide-react'

// Block types
type BlockType = 'header' | 'text' | 'button' | 'image' | 'divider' | 'social' | 'spacer' | 'columns' | 'footer'

interface Block {
  id: string
  type: BlockType
  content: any
  styles: any
}

interface Template {
  id?: number
  name: string
  description: string
  blocks: Block[]
  globalStyles: {
    fontFamily: string
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
  }
}

// Block Templates
const BLOCK_TEMPLATES = {
  header: {
    type: 'header',
    content: {
      logo: 'Speak About AI',
      tagline: 'Your AI Speaking Insights'
    },
    styles: {
      backgroundColor: '#ffffff',
      textAlign: 'center',
      padding: '30px',
      logoSize: '32px',
      taglineSize: '14px'
    }
  },
  text: {
    type: 'text',
    content: {
      text: 'Enter your text content here. You can format it with bold, italic, and more.'
    },
    styles: {
      fontSize: '16px',
      lineHeight: '1.6',
      padding: '20px',
      textAlign: 'left'
    }
  },
  button: {
    type: 'button',
    content: {
      text: 'Click Here',
      url: 'https://example.com'
    },
    styles: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '6px',
      textAlign: 'center',
      fontSize: '16px'
    }
  },
  image: {
    type: 'image',
    content: {
      url: 'https://via.placeholder.com/600x300',
      alt: 'Image description'
    },
    styles: {
      width: '100%',
      padding: '20px',
      alignment: 'center'
    }
  },
  divider: {
    type: 'divider',
    content: {},
    styles: {
      borderColor: '#e5e7eb',
      borderWidth: '1px',
      margin: '20px'
    }
  },
  social: {
    type: 'social',
    content: {
      facebook: 'https://facebook.com',
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com'
    },
    styles: {
      iconSize: '24px',
      iconColor: '#6b7280',
      spacing: '12px',
      alignment: 'center',
      padding: '20px'
    }
  },
  spacer: {
    type: 'spacer',
    content: {
      height: '30px'
    },
    styles: {}
  },
  columns: {
    type: 'columns',
    content: {
      columns: [
        { text: 'Column 1 content' },
        { text: 'Column 2 content' }
      ]
    },
    styles: {
      padding: '20px',
      gap: '20px'
    }
  },
  footer: {
    type: 'footer',
    content: {
      company: 'Speak About AI',
      address: '© 2024 All rights reserved',
      unsubscribe: true
    },
    styles: {
      backgroundColor: '#f9fafb',
      textAlign: 'center',
      padding: '30px',
      fontSize: '12px',
      color: '#6b7280'
    }
  }
}

function VisualTemplateEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const templateId = searchParams.get('id')
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  
  const [template, setTemplate] = useState<Template>({
    name: 'New Template',
    description: '',
    blocks: [],
    globalStyles: {
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    }
  })

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/admin')
      return
    }

    if (templateId && templateId !== 'new') {
      fetchTemplate(templateId)
    } else {
      // Start with a basic template
      setTemplate(prev => ({
        ...prev,
        blocks: [
          { ...BLOCK_TEMPLATES.header, id: generateId() },
          { ...BLOCK_TEMPLATES.text, id: generateId() },
          { ...BLOCK_TEMPLATES.button, id: generateId() },
          { ...BLOCK_TEMPLATES.footer, id: generateId() }
        ]
      }))
    }
  }, [templateId, router])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const fetchTemplate = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/newsletter-templates/${id}`, {
        headers: { 'x-admin-request': 'true' }
      })
      if (response.ok) {
        const data = await response.json()
        // Parse the stored template data
        const parsedTemplate = JSON.parse(data.html_template)
        setTemplate({
          name: data.name,
          description: data.description || '',
          blocks: parsedTemplate.blocks || [],
          globalStyles: parsedTemplate.globalStyles || template.globalStyles
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

  const addBlock = (type: BlockType) => {
    const newBlock = {
      ...BLOCK_TEMPLATES[type],
      id: generateId()
    }
    setTemplate(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }))
    setSelectedBlock(newBlock.id)
  }

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    }))
  }

  const deleteBlock = (blockId: string) => {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }))
    setSelectedBlock(null)
  }

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    setTemplate(prev => {
      const index = prev.blocks.findIndex(b => b.id === blockId)
      if (index === -1) return prev
      
      const newBlocks = [...prev.blocks]
      if (direction === 'up' && index > 0) {
        [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]]
      } else if (direction === 'down' && index < newBlocks.length - 1) {
        [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]
      }
      
      return { ...prev, blocks: newBlocks }
    })
  }

  const duplicateBlock = (blockId: string) => {
    const block = template.blocks.find(b => b.id === blockId)
    if (!block) return
    
    const newBlock = { ...block, id: generateId() }
    const index = template.blocks.findIndex(b => b.id === blockId)
    
    setTemplate(prev => ({
      ...prev,
      blocks: [
        ...prev.blocks.slice(0, index + 1),
        newBlock,
        ...prev.blocks.slice(index + 1)
      ]
    }))
  }

  const generateHtml = () => {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: ${template.globalStyles.fontFamily};
      color: ${template.globalStyles.textColor};
      background-color: ${template.globalStyles.backgroundColor};
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
    }
    a { color: ${template.globalStyles.primaryColor}; }
  </style>
</head>
<body>
  <div class="container">`

    template.blocks.forEach(block => {
      html += generateBlockHtml(block)
    })

    html += `
  </div>
</body>
</html>`
    return html
  }

  const generateBlockHtml = (block: Block): string => {
    switch (block.type) {
      case 'header':
        return `
          <div style="background-color: ${block.styles.backgroundColor}; padding: ${block.styles.padding}; text-align: ${block.styles.textAlign};">
            <h1 style="margin: 0; font-size: ${block.styles.logoSize}; color: ${template.globalStyles.textColor};">${block.content.logo}</h1>
            <p style="margin: 5px 0 0 0; font-size: ${block.styles.taglineSize}; color: ${template.globalStyles.textColor}; opacity: 0.8;">${block.content.tagline}</p>
          </div>`
      
      case 'text':
        return `
          <div style="padding: ${block.styles.padding}; text-align: ${block.styles.textAlign};">
            <p style="font-size: ${block.styles.fontSize}; line-height: ${block.styles.lineHeight}; margin: 0;">${block.content.text}</p>
          </div>`
      
      case 'button':
        return `
          <div style="text-align: ${block.styles.textAlign}; padding: 20px;">
            <a href="${block.content.url}" style="display: inline-block; background-color: ${block.styles.backgroundColor}; color: ${block.styles.color}; padding: ${block.styles.padding}; border-radius: ${block.styles.borderRadius}; text-decoration: none; font-size: ${block.styles.fontSize};">${block.content.text}</a>
          </div>`
      
      case 'image':
        return `
          <div style="text-align: ${block.styles.alignment}; padding: ${block.styles.padding};">
            <img src="${block.content.url}" alt="${block.content.alt}" style="max-width: ${block.styles.width}; height: auto;">
          </div>`
      
      case 'divider':
        return `<hr style="border: none; border-top: ${block.styles.borderWidth} solid ${block.styles.borderColor}; margin: ${block.styles.margin};">`
      
      case 'spacer':
        return `<div style="height: ${block.content.height};"></div>`
      
      case 'social':
        return `
          <div style="text-align: ${block.styles.alignment}; padding: ${block.styles.padding};">
            ${block.content.facebook ? `<a href="${block.content.facebook}" style="margin: 0 ${block.styles.spacing};"><img src="https://img.icons8.com/color/48/facebook.png" width="${block.styles.iconSize}" height="${block.styles.iconSize}"></a>` : ''}
            ${block.content.twitter ? `<a href="${block.content.twitter}" style="margin: 0 ${block.styles.spacing};"><img src="https://img.icons8.com/color/48/twitter.png" width="${block.styles.iconSize}" height="${block.styles.iconSize}"></a>` : ''}
            ${block.content.linkedin ? `<a href="${block.content.linkedin}" style="margin: 0 ${block.styles.spacing};"><img src="https://img.icons8.com/color/48/linkedin.png" width="${block.styles.iconSize}" height="${block.styles.iconSize}"></a>` : ''}
            ${block.content.instagram ? `<a href="${block.content.instagram}" style="margin: 0 ${block.styles.spacing};"><img src="https://img.icons8.com/color/48/instagram.png" width="${block.styles.iconSize}" height="${block.styles.iconSize}"></a>` : ''}
          </div>`
      
      case 'columns':
        return `
          <div style="display: table; width: 100%; padding: ${block.styles.padding};">
            ${block.content.columns.map((col: any) => `
              <div style="display: table-cell; padding: 0 ${block.styles.gap};">
                <p>${col.text}</p>
              </div>
            `).join('')}
          </div>`
      
      case 'footer':
        return `
          <div style="background-color: ${block.styles.backgroundColor}; padding: ${block.styles.padding}; text-align: ${block.styles.textAlign};">
            <p style="margin: 0; font-size: ${block.styles.fontSize}; color: ${block.styles.color};">
              ${block.content.company}<br>
              ${block.content.address}
              ${block.content.unsubscribe ? '<br><a href="{{unsubscribe_url}}" style="color: ' + block.styles.color + ';">Unsubscribe</a>' : ''}
            </p>
          </div>`
      
      default:
        return ''
    }
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

    try {
      setSaving(true)
      
      // Store the template data as JSON in html_template
      const templateData = JSON.stringify({
        blocks: template.blocks,
        globalStyles: template.globalStyles
      })
      
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
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          html_template: templateData,
          text_template: '',
          variables: ['unsubscribe_url'],
          default_styles: ''
        })
      })
      
      if (response.ok) {
        const savedTemplate = await response.json()
        toast({
          title: 'Success',
          description: 'Template saved successfully'
        })
        
        if (!templateId || templateId === 'new') {
          router.push(`/admin/newsletter/templates/visual-editor?id=${savedTemplate.id}`)
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

  const renderBlockEditor = () => {
    const block = template.blocks.find(b => b.id === selectedBlock)
    if (!block) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edit {block.type}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {block.type === 'header' && (
            <>
              <div>
                <Label>Logo/Title</Label>
                <Input
                  value={block.content.logo}
                  onChange={(e) => updateBlock(block.id, {
                    content: { ...block.content, logo: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={block.content.tagline}
                  onChange={(e) => updateBlock(block.id, {
                    content: { ...block.content, tagline: e.target.value }
                  })}
                />
              </div>
            </>
          )}

          {block.type === 'text' && (
            <div>
              <Label>Content</Label>
              <Textarea
                value={block.content.text}
                onChange={(e) => updateBlock(block.id, {
                  content: { ...block.content, text: e.target.value }
                })}
                rows={4}
              />
            </div>
          )}

          {block.type === 'button' && (
            <>
              <div>
                <Label>Button Text</Label>
                <Input
                  value={block.content.text}
                  onChange={(e) => updateBlock(block.id, {
                    content: { ...block.content, text: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Link URL</Label>
                <Input
                  value={block.content.url}
                  onChange={(e) => updateBlock(block.id, {
                    content: { ...block.content, url: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Background Color</Label>
                <Input
                  type="color"
                  value={block.styles.backgroundColor}
                  onChange={(e) => updateBlock(block.id, {
                    styles: { ...block.styles, backgroundColor: e.target.value }
                  })}
                />
              </div>
            </>
          )}

          {block.type === 'image' && (
            <>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={block.content.url}
                  onChange={(e) => updateBlock(block.id, {
                    content: { ...block.content, url: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Alt Text</Label>
                <Input
                  value={block.content.alt}
                  onChange={(e) => updateBlock(block.id, {
                    content: { ...block.content, alt: e.target.value }
                  })}
                />
              </div>
            </>
          )}

          {/* Alignment for most blocks */}
          {['header', 'text', 'button', 'image', 'social', 'footer'].includes(block.type) && (
            <div>
              <Label>Alignment</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant={block.styles.textAlign === 'left' ? 'default' : 'outline'}
                  onClick={() => updateBlock(block.id, {
                    styles: { ...block.styles, textAlign: 'left' }
                  })}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={block.styles.textAlign === 'center' ? 'default' : 'outline'}
                  onClick={() => updateBlock(block.id, {
                    styles: { ...block.styles, textAlign: 'center' }
                  })}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={block.styles.textAlign === 'right' ? 'default' : 'outline'}
                  onClick={() => updateBlock(block.id, {
                    styles: { ...block.styles, textAlign: 'right' }
                  })}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => duplicateBlock(block.id)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => moveBlock(block.id, 'up')}
              disabled={template.blocks[0]?.id === block.id}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => moveBlock(block.id, 'down')}
              disabled={template.blocks[template.blocks.length - 1]?.id === block.id}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteBlock(block.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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
                onClick={() => router.push('/admin/newsletter/templates')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Visual Template Editor</h1>
                <p className="text-gray-600 mt-1">
                  Create beautiful email templates without coding
                </p>
              </div>
            </div>
            
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

          {/* Main Editor */}
          <div className="grid grid-cols-4 gap-6">
            {/* Left Sidebar - Block Library */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Blocks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('header')}
                  >
                    <Heading1 className="h-4 w-4 mr-2" />
                    Header
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('text')}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('button')}
                  >
                    <MousePointer className="h-4 w-4 mr-2" />
                    Button
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('image')}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('divider')}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Divider
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('spacer')}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Spacer
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('columns')}
                  >
                    <Columns className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('social')}
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Social Links
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('footer')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Footer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Center - Visual Preview */}
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Template Preview</CardTitle>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Template Name"
                        value={template.name}
                        onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                        className="w-48"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg bg-white p-4 min-h-[600px]">
                    {template.blocks.length === 0 ? (
                      <div className="text-center py-20 text-gray-400">
                        <Layers className="mx-auto h-12 w-12 mb-4" />
                        <p>Start by adding content blocks from the left</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {template.blocks.map(block => (
                          <div
                            key={block.id}
                            className={`border-2 rounded cursor-pointer transition-colors ${
                              selectedBlock === block.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedBlock(block.id)}
                          >
                            <div dangerouslySetInnerHTML={{ __html: generateBlockHtml(block) }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="space-y-4">
              {/* Global Styles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Primary Color</Label>
                    <Input
                      type="color"
                      value={template.globalStyles.primaryColor}
                      onChange={(e) => setTemplate(prev => ({
                        ...prev,
                        globalStyles: { ...prev.globalStyles, primaryColor: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={template.globalStyles.backgroundColor}
                      onChange={(e) => setTemplate(prev => ({
                        ...prev,
                        globalStyles: { ...prev.globalStyles, backgroundColor: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={template.globalStyles.textColor}
                      onChange={(e) => setTemplate(prev => ({
                        ...prev,
                        globalStyles: { ...prev.globalStyles, textColor: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Font</Label>
                    <Select
                      value={template.globalStyles.fontFamily}
                      onValueChange={(value) => setTemplate(prev => ({
                        ...prev,
                        globalStyles: { ...prev.globalStyles, fontFamily: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                        <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                        <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Block Properties */}
              {selectedBlock && renderBlockEditor()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function VisualTemplateEditor() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VisualTemplateEditorContent />
    </Suspense>
  )
}
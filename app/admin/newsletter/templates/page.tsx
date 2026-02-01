'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye,
  ArrowLeft,
  FileText,
  Palette,
  Code
} from 'lucide-react'

interface NewsletterTemplate {
  id: number
  name: string
  description: string | null
  html_template: string
  text_template: string | null
  default_styles: string | null
  variables: string[]
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export default function NewsletterTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Check if logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    const sessionToken = localStorage.getItem('adminSessionToken')
    
    if (!isLoggedIn || !sessionToken) {
      router.push('/admin')
      return
    }
    
    fetchTemplates()
  }, [router])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/newsletter-templates', {
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/admin/newsletter-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-request': 'true'
        }
      })
      
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id))
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleDuplicateTemplate = async (template: NewsletterTemplate) => {
    try {
      const response = await fetch('/api/admin/newsletter-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          html_template: template.html_template,
          text_template: template.text_template,
          default_styles: template.default_styles,
          variables: template.variables,
          thumbnail_url: template.thumbnail_url
        })
      })
      
      if (response.ok) {
        const newTemplate = await response.json()
        setTemplates(prev => [newTemplate, ...prev])
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
                onClick={() => router.push('/admin/newsletter')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Newsletter
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Newsletter Templates</h1>
                <p className="text-gray-600 mt-1">Create and manage reusable newsletter templates</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/admin/newsletter/templates/visual-editor')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </CardContent>
          </Card>

          {/* Templates Grid */}
          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'No templates match your search.' : 'Get started by creating your first template.'}
                </p>
                <Button
                  onClick={() => router.push('/admin/newsletter/templates/visual-editor')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Template Preview */}
                    <div className="mb-4 border rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Preview</span>
                      </div>
                      <div 
                        className="text-xs bg-white border rounded p-2 max-h-20 overflow-hidden"
                        dangerouslySetInnerHTML={{ 
                          __html: template.html_template.substring(0, 200) + '...' 
                        }}
                      />
                    </div>

                    {/* Variables */}
                    {template.variables && template.variables.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Palette className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Variables</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.variables.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Template Info */}
                    <div className="text-xs text-gray-500 mb-4">
                      Created {formatDate(template.created_at)}
                      {template.updated_at !== template.created_at && (
                        <span> • Updated {formatDate(template.updated_at)}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/newsletter/templates/visual-editor?id=${template.id}`)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
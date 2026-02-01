"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AdminSidebar } from "@/components/admin-sidebar"
import { 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  X,
  Link,
  FileText,
  Mail,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface EmailResource {
  id?: string
  urlPatterns: string[]
  titlePatterns: string[]
  subject: string
  resourceContent: string
  isActive?: boolean
}

export default function LandingResourcesPage() {
  const router = useRouter()
  const [resources, setResources] = useState<EmailResource[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EmailResource | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    fetchResources()
  }, [router])

  const fetchResources = async () => {
    setLoading(true)
    try {
      // Add cache-busting parameter to prevent stale data
      const response = await fetch(`/api/admin/landing-resources?_t=${Date.now()}`, {
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        // Transform database format to component format
        const transformedData = data.map((item: any) => ({
          id: item.id,
          urlPatterns: item.url_patterns || item.urlPatterns || [],
          titlePatterns: item.title_patterns || item.titlePatterns || [],
          subject: item.subject,
          resourceContent: item.resource_content || item.resourceContent,
          isActive: item.is_active !== undefined ? item.is_active : item.isActive
        }))
        setResources(transformedData)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveResource = async (resource: EmailResource, index: number) => {
    try {
      // Use the resource's database ID if available
      const resourceId = resources[index]?.id
      const response = await fetch('/api/admin/landing-resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resource, 
          id: resourceId 
        })
      })
      
      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Resource saved successfully!' })
        await fetchResources()
        setEditingIndex(null)
        setEditForm(null)
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to save resource' })
      }
    } catch (error) {
      console.error('Error saving resource:', error)
      setSaveStatus({ type: 'error', message: 'Error saving resource' })
    }
  }

  const deleteResource = async (index: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    
    try {
      // Use the resource's database ID if available
      const resourceId = resources[index]?.id
      if (!resourceId) {
        setSaveStatus({ type: 'error', message: 'Cannot delete unsaved resource' })
        return
      }
      console.log('Deleting resource with ID:', resourceId)
      const response = await fetch(`/api/admin/landing-resources/${resourceId}`, {
        method: 'DELETE'
      })

      console.log('Delete response status:', response.status)

      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Resource deleted successfully!' })
        await fetchResources()
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        const responseText = await response.text()
        console.error('Delete failed - Status:', response.status, 'Body:', responseText)
        let errorMessage = 'Failed to delete resource'
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = responseText || errorMessage
        }
        setSaveStatus({ type: 'error', message: errorMessage })
      }
    } catch (error) {
      console.error('Error deleting resource:', error)
      setSaveStatus({ type: 'error', message: 'Error deleting resource' })
    }
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditForm({ ...resources[index] })
    setShowNewForm(false)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditForm(null)
    setShowNewForm(false)
  }

  const addNewResource = () => {
    const newResource: EmailResource = {
      urlPatterns: [],
      titlePatterns: [],
      subject: '',
      resourceContent: '',
      isActive: true
    }
    setEditForm(newResource)
    setShowNewForm(true)
    setEditingIndex(null)
  }

  const importFromConfig = async () => {
    try {
      const response = await fetch('/api/admin/landing-resources/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSaveStatus({ type: 'success', message: data.message })
        await fetchResources()
        setTimeout(() => setSaveStatus(null), 3000)
      }
    } catch (error) {
      console.error('Error importing resources:', error)
      setSaveStatus({ type: 'error', message: 'Error importing resources' })
    }
  }

  const saveNewResource = async () => {
    if (!editForm) return
    
    try {
      const response = await fetch('/api/admin/landing-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Resource added successfully!' })
        await fetchResources()
        setShowNewForm(false)
        setEditForm(null)
        setTimeout(() => setSaveStatus(null), 3000)
      }
    } catch (error) {
      console.error('Error adding resource:', error)
      setSaveStatus({ type: 'error', message: 'Error adding resource' })
    }
  }

  const ResourceForm = ({ resource, onSave, onCancel }: { 
    resource: EmailResource, 
    onSave: () => void, 
    onCancel: () => void 
  }) => (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="pt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">URL Patterns (comma-separated)</label>
          <Input
            value={editForm?.urlPatterns?.join(', ') || ''}
            onChange={(e) => setEditForm({
              ...editForm!,
              urlPatterns: e.target.value.split(',').map(p => p.trim()).filter(p => p)
            })}
            placeholder="ai-tools-for-event-planners, event-tools"
          />
          <p className="text-xs text-gray-500 mt-1">URLs containing these patterns will match</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Title Patterns (comma-separated)</label>
          <Input
            value={editForm?.titlePatterns?.join(', ') || ''}
            onChange={(e) => setEditForm({
              ...editForm!,
              titlePatterns: e.target.value.split(',').map(p => p.trim()).filter(p => p)
            })}
            placeholder="ai tools, event planning"
          />
          <p className="text-xs text-gray-500 mt-1">Page titles containing these patterns will match</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email Subject</label>
          <Input
            value={editForm?.subject || ''}
            onChange={(e) => setEditForm({ ...editForm!, subject: e.target.value })}
            placeholder="Your 5 Essential AI Tools for Event Planning"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Resource Content (HTML)</label>
          <Textarea
            value={editForm?.resourceContent || ''}
            onChange={(e) => setEditForm({ ...editForm!, resourceContent: e.target.value })}
            placeholder="<h3>Your Resources</h3>..."
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">HTML content for the email resources section</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Landing Page Resources</h1>
              <p className="text-gray-600 mt-1">Manage email resources sent for each landing page</p>
            </div>
        <div className="flex gap-2">
          {resources.length === 0 && (
            <Button onClick={importFromConfig} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Import from Config
            </Button>
          )}
          <Button onClick={addNewResource} disabled={showNewForm}>
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </div>
      </div>

      {saveStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          saveStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {saveStatus.message}
        </div>
      )}

      {/* Instructions Card */}
      <Card className="mb-6 bg-blue-50/50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            How Resource Matching Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-3">
            When someone submits a form on a landing page, the system automatically sends them the matching resources based on:
          </p>
          <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
            <li><strong>URL Patterns:</strong> Matches if the page URL contains any of the patterns</li>
            <li><strong>Title Patterns:</strong> Matches if the page title contains any of the patterns (case-insensitive)</li>
            <li><strong>Priority:</strong> First matching resource is used, so order matters</li>
            <li><strong>Default:</strong> If no match, a generic thank you email is sent</li>
          </ul>
        </CardContent>
      </Card>

      {/* New Resource Form */}
      {showNewForm && editForm && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Resource</h2>
          <ResourceForm 
            resource={editForm}
            onSave={saveNewResource}
            onCancel={cancelEdit}
          />
        </div>
      )}

      {/* Resources List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">Loading resources...</p>
            </CardContent>
          </Card>
        ) : resources.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">No resources configured yet</p>
            </CardContent>
          </Card>
        ) : (
          resources.map((resource, index) => (
            <div key={index}>
              {editingIndex === index && editForm ? (
                <ResourceForm 
                  resource={editForm}
                  onSave={() => saveResource(editForm, index)}
                  onCancel={cancelEdit}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Mail className="w-5 h-5 text-gray-600" />
                          {resource.subject || 'No subject set'}
                        </CardTitle>
                        <div className="mt-2 space-y-1">
                          {resource.urlPatterns && resource.urlPatterns.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Link className="w-4 h-4 text-gray-500" />
                              <div className="flex flex-wrap gap-1">
                                {resource.urlPatterns.map((pattern, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {pattern}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {resource.titlePatterns && resource.titlePatterns.length > 0 && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <div className="flex flex-wrap gap-1">
                                {resource.titlePatterns.map((pattern, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {pattern}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => startEdit(index)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteResource(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Preview:</p>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: resource.resourceContent ? 
                            (resource.resourceContent.substring(0, 200) + '...') : 
                            '<p class="text-gray-500">No content preview available</p>'
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))
        )}
      </div>
        </div>
      </div>
    </div>
  )
}
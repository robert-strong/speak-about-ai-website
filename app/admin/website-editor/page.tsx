"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminSidebar } from "@/components/admin-sidebar"
import { PagePreview } from "@/components/page-preview"
import {
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Home,
  Briefcase,
  Users,
  Edit2,
  Info,
  Loader2,
  ExternalLink,
  Mic,
  BookOpen,
  LayoutGrid,
  Mail
} from "lucide-react"
import { EditHistoryPanel } from "@/components/edit-history-panel"
import { authPut, authPost } from "@/lib/auth-fetch"

interface ContentItem {
  id: number
  page: string
  section: string
  content_key: string
  content_value: string
  updated_at: string
}

export default function WebsiteEditorPage() {
  const router = useRouter()
  const [content, setContent] = useState<ContentItem[]>([])
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [originalContent, setOriginalContent] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "services" | "team" | "speakers" | "workshops" | "contact" | "footer">("home")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    fetchContent()
  }, [router])

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = Object.keys(editedContent).some(
      key => editedContent[key] !== originalContent[key]
    )
    setHasUnsavedChanges(hasChanges)
  }, [editedContent, originalContent])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/website-content?_t=${Date.now()}`, {
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        setContent(data)
        const initial: Record<string, string> = {}
        data.forEach((item: ContentItem) => {
          const key = `${item.page}.${item.section}.${item.content_key}`
          initial[key] = item.content_value
        })
        setEditedContent(initial)
        setOriginalContent(initial)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      setSaveStatus({ type: 'error', message: 'Failed to load content' })
    } finally {
      setLoading(false)
    }
  }

  const handleContentChange = useCallback((key: string, value: string) => {
    setEditedContent(prev => ({ ...prev, [key]: value }))
  }, [])

  const saveAllChanges = async () => {
    setSaving(true)
    try {
      // Collect all changed content
      const updates = Object.entries(editedContent)
        .filter(([key, value]) => value !== originalContent[key])
        .map(([key, value]) => {
          const [page, section, ...contentKeyParts] = key.split('.')
          const content_key = contentKeyParts.join('.')
          return { page, section, content_key, content_value: value }
        })

      if (updates.length === 0) {
        setSaveStatus({ type: 'success', message: 'No changes to save' })
        setTimeout(() => setSaveStatus(null), 3000)
        setSaving(false)
        return
      }

      const response = await authPut('/api/admin/website-content', updates)

      if (response.ok) {
        setSaveStatus({ type: 'success', message: `Saved ${updates.length} change${updates.length > 1 ? 's' : ''} - now live on the site!` })
        await fetchContent()
        setTimeout(() => setSaveStatus(null), 4000)
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to save changes' })
      }
    } catch (error) {
      console.error('Error saving content:', error)
      setSaveStatus({ type: 'error', message: 'Error saving changes' })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all content to defaults? This cannot be undone.')) return

    setSaving(true)
    try {
      const response = await authPost('/api/admin/website-content', { action: 'reseed' })

      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Content reset to defaults!' })
        await fetchContent()
        setTimeout(() => setSaveStatus(null), 3000)
      }
    } catch (error) {
      console.error('Error resetting content:', error)
      setSaveStatus({ type: 'error', message: 'Error resetting content' })
    } finally {
      setSaving(false)
    }
  }

  const discardChanges = () => {
    if (!confirm('Discard all unsaved changes?')) return
    setEditedContent({ ...originalContent })
  }

  const getPageUrl = (page: string) => {
    if (page === 'home') return '/'
    if (page === 'services') return '/services'
    if (page === 'team') return '/our-team'
    if (page === 'speakers') return '/speakers'
    if (page === 'workshops') return '/ai-workshops'
    if (page === 'contact') return '/contact'
    if (page === 'footer') return '/'
    return '/'
  }

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>

      <div className="flex-1 ml-72 min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Page Editor</h1>
                  <p className="text-sm text-gray-500">Click on any text to edit it directly</p>
                </div>
                {hasUnsavedChanges && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    Unsaved changes
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <EditHistoryPanel
                  activePage={activeTab}
                  onRollback={fetchContent}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getPageUrl(activeTab), '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Live
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={discardChanges}
                  disabled={!hasUnsavedChanges || saving}
                >
                  Discard
                </Button>
                <Button
                  onClick={saveAllChanges}
                  disabled={!hasUnsavedChanges || saving}
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Publish Changes
                </Button>
              </div>
            </div>

            {/* Status Message */}
            {saveStatus && (
              <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
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
          </div>
        </div>

        {/* Page Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-[1600px] mx-auto px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="h-14 w-full justify-start gap-2 bg-transparent border-0 p-0 overflow-x-auto flex-nowrap">
                <TabsTrigger
                  value="home"
                  className="h-12 px-4 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-t-lg border-b-2 data-[state=active]:border-blue-600 border-transparent"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home Page
                </TabsTrigger>
                <TabsTrigger
                  value="services"
                  className="h-12 px-4 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-t-lg border-b-2 data-[state=active]:border-blue-600 border-transparent"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Services
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="h-12 px-4 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-t-lg border-b-2 data-[state=active]:border-blue-600 border-transparent"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Our Team
                </TabsTrigger>
                <TabsTrigger
                  value="speakers"
                  className="h-12 px-4 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-t-lg border-b-2 data-[state=active]:border-blue-600 border-transparent"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Speakers
                </TabsTrigger>
                <TabsTrigger
                  value="workshops"
                  className="h-12 px-4 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-t-lg border-b-2 data-[state=active]:border-blue-600 border-transparent"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Workshops
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="h-12 px-4 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-t-lg border-b-2 data-[state=active]:border-blue-600 border-transparent"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Inquiries
                </TabsTrigger>
                <TabsTrigger
                  value="footer"
                  className="h-12 px-4 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-t-lg border-b-2 data-[state=active]:border-blue-600 border-transparent"
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Footer
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Instructions Banner */}
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-[1600px] mx-auto px-6 py-3">
            <div className="flex items-center gap-3 text-sm text-blue-800">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>How to edit:</strong> Click on any text with a{' '}
                <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 rounded text-xs font-medium">
                  blue hover outline
                </span>
                {' '}to edit it. Modified content shows an{' '}
                <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                  amber highlight
                </span>.
                {' '}Click <strong>Publish Changes</strong> to make edits live.
              </span>
            </div>
          </div>
        </div>

        {/* Page Preview Content */}
        <div className="py-8">
          <div className="max-w-[1400px] mx-auto px-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-500">Loading content...</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                {/* Preview Header */}
                <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 ml-3">
                    <div className="bg-gray-700 rounded px-3 py-1 text-xs text-gray-300 font-mono max-w-md">
                      speakabout.ai{getPageUrl(activeTab)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editor Mode</span>
                  </div>
                </div>

                {/* Page Preview */}
                <div>
                  <PagePreview
                    page={activeTab}
                    content={editedContent}
                    originalContent={originalContent}
                    onContentChange={handleContentChange}
                    editorMode={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-white py-4">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefaults}
                disabled={saving}
                className="text-gray-500 hover:text-red-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All to Defaults
              </Button>

              <div className="text-sm text-gray-500">
                {Object.keys(editedContent).filter(k => editedContent[k] !== originalContent[k]).length} unsaved change(s)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

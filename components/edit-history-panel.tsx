"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  History,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Check,
  AlertCircle
} from "lucide-react"

interface HistoryEntry {
  id: number
  content_id: number | null
  page: string
  section: string
  content_key: string
  old_value: string | null
  new_value: string
  changed_at: string
  changed_by: string
  action: string
}

interface EditHistoryPanelProps {
  activePage?: string
  onRollback?: () => void
}

export function EditHistoryPanel({ activePage, onRollback }: EditHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [rollingBack, setRollingBack] = useState<number | null>(null)
  const [rollbackStatus, setRollbackStatus] = useState<{ id: number; success: boolean; message: string } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const url = activePage
        ? `/api/admin/content-history?page=${activePage}&limit=50`
        : `/api/admin/content-history?limit=50`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchHistory()
    }
  }, [isOpen, activePage])

  const handleRollback = async (historyId: number) => {
    if (!confirm('Are you sure you want to rollback to this previous version?')) return

    setRollingBack(historyId)
    setRollbackStatus(null)
    try {
      const response = await fetch('/api/admin/content-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId })
      })

      if (response.ok) {
        setRollbackStatus({ id: historyId, success: true, message: 'Rollback successful!' })
        // Refresh history
        fetchHistory()
        // Notify parent to refresh content
        onRollback?.()
        setTimeout(() => setRollbackStatus(null), 3000)
      } else {
        const data = await response.json()
        setRollbackStatus({ id: historyId, success: false, message: data.error || 'Rollback failed' })
      }
    } catch (error) {
      setRollbackStatus({ id: historyId, success: false, message: 'Rollback failed' })
    } finally {
      setRollingBack(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const truncateValue = (value: string | null, maxLength: number = 50) => {
    if (!value) return '(empty)'
    if (value.length <= maxLength) return value
    return value.substring(0, maxLength) + '...'
  }

  const getActionBadge = (action: string) => {
    const colors = {
      update: 'bg-blue-100 text-blue-700',
      create: 'bg-green-100 text-green-700',
      rollback: 'bg-amber-100 text-amber-700',
      delete: 'bg-red-100 text-red-700'
    }
    return colors[action as keyof typeof colors] || colors.update
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          Edit History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Edit History
          </SheetTitle>
          <SheetDescription>
            View recent changes and rollback to previous versions.
            {activePage && (
              <span className="block mt-1 text-blue-600">
                Showing history for: <strong>{activePage}</strong> page
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No edit history yet</p>
              <p className="text-sm mt-1">Changes will appear here after you make edits</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 mb-4">
                {total} total change{total !== 1 ? 's' : ''}
              </div>

              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg overflow-hidden bg-white shadow-sm"
                >
                  {/* Header */}
                  <div
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${getActionBadge(entry.action)}`}>
                            {entry.action}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(entry.changed_at)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {entry.section}.{entry.content_key}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {entry.page} page
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {expandedId === entry.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedId === entry.id && (
                    <div className="px-4 pb-4 border-t bg-gray-50">
                      <div className="pt-3 space-y-3">
                        {/* Value Change Display */}
                        <div className="flex items-start gap-2 text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 mb-1">Previous Value:</div>
                            <div className="p-2 bg-red-50 border border-red-200 rounded text-gray-700 break-words text-xs font-mono">
                              {truncateValue(entry.old_value, 200)}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 mt-6 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 mb-1">New Value:</div>
                            <div className="p-2 bg-green-50 border border-green-200 rounded text-gray-700 break-words text-xs font-mono">
                              {truncateValue(entry.new_value, 200)}
                            </div>
                          </div>
                        </div>

                        {/* Rollback Button */}
                        {entry.old_value && entry.action !== 'rollback' && (
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRollback(entry.id)
                              }}
                              disabled={rollingBack === entry.id}
                            >
                              {rollingBack === entry.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Rolling back...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3 h-3" />
                                  Rollback to Previous Value
                                </>
                              )}
                            </Button>

                            {/* Status Message */}
                            {rollbackStatus?.id === entry.id && (
                              <div className={`mt-2 p-2 rounded text-xs flex items-center gap-1.5 ${
                                rollbackStatus.success
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                {rollbackStatus.success ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <AlertCircle className="w-3 h-3" />
                                )}
                                {rollbackStatus.message}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

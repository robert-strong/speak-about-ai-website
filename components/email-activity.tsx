"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Send, Inbox, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

interface EmailThread {
  id: number
  gmail_message_id: string
  gmail_thread_id: string
  subject: string
  from_email: string
  to_email: string
  cc_emails: string[]
  body_snippet: string
  body_full: string
  direction: "inbound" | "outbound"
  is_read: boolean
  received_at: string
  labels: string[]
  created_at: string
}

interface EmailActivityProps {
  leadId?: number
  dealId?: number
}

export function EmailActivity({ leadId, dealId }: EmailActivityProps) {
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEmails, setExpandedEmails] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadEmailThreads()
  }, [leadId, dealId])

  const loadEmailThreads = async () => {
    if (!leadId && !dealId) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (leadId) params.set('lead_id', leadId.toString())
      if (dealId) params.set('deal_id', dealId.toString())

      const response = await fetch(`/api/email-threads?${params}`)
      const data = await response.json()

      if (data.success) {
        setThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Error loading email threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (emailId: number) => {
    const newExpanded = new Set(expandedEmails)
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId)
    } else {
      newExpanded.add(emailId)
    }
    setExpandedEmails(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getDirectionIcon = (direction: string) => {
    return direction === 'outbound' ? (
      <Send className="w-4 h-4 text-blue-600" />
    ) : (
      <Inbox className="w-4 h-4 text-green-600" />
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading email threads...</p>
        </CardContent>
      </Card>
    )
  }

  if (threads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No email activity yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Activity
          <Badge variant="secondary">{threads.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {threads.map((thread) => {
            const isExpanded = expandedEmails.has(thread.id)

            return (
              <div
                key={thread.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getDirectionIcon(thread.direction)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold truncate">
                        {thread.subject || "(no subject)"}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(thread.received_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={
                          thread.direction === "outbound"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }
                      >
                        {thread.direction === "outbound" ? "Sent" : "Received"}
                      </Badge>
                      {!thread.is_read && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Unread
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">From:</span> {thread.from_email}
                      </div>
                      <div>
                        <span className="font-medium">To:</span> {thread.to_email}
                      </div>
                      {thread.cc_emails && thread.cc_emails.length > 0 && (
                        <div>
                          <span className="font-medium">Cc:</span> {thread.cc_emails.join(', ')}
                        </div>
                      )}
                    </div>

                    {!isExpanded && (
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {thread.body_snippet}
                      </p>
                    )}

                    {isExpanded && (
                      <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap max-h-96 overflow-y-auto bg-white p-3 rounded border">
                        {thread.body_full || thread.body_snippet}
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(thread.id)}
                      className="text-xs h-7"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Show full email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

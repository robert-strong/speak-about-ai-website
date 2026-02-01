"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, RefreshCw, Calendar, ExternalLink, Linkedin, AlertCircle, CheckSquare, Mail, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { AdminSidebar } from "@/components/admin-sidebar"
import { EmailActivity } from "@/components/email-activity"

interface Lead {
  id: number
  name: string
  email: string
  company: string
  title: string
  linkedin_url: string
  phone: string
  source: string
  status: string
  priority: string
  notes: string
  last_contact_date: string
  next_follow_up_date: string
  picture_url: string
  conversation_status: string
  latest_message: string
  created_at: string
  updated_at: string
  pending_tasks_count: number
  overdue_tasks_count: number
  email_thread_count: number
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEmailLeads, setExpandedEmailLeads] = useState<Set<number>>(new Set())

  const loadLeads = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/leads')
      const data = await response.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-purple-100 text-purple-800',
      'qualified': 'bg-green-100 text-green-800',
      'unqualified': 'bg-gray-100 text-gray-800',
      'nurture': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-orange-100 text-orange-800',
      'low': 'bg-yellow-100 text-yellow-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const isOverdue = (date: string) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const toggleEmailExpanded = (leadId: number) => {
    const newExpanded = new Set(expandedEmailLeads)
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId)
    } else {
      newExpanded.add(leadId)
    }
    setExpandedEmailLeads(newExpanded)
  }

  const newLeads = leads.filter(l => l.status === 'new')
  const contactedLeads = leads.filter(l => l.status === 'contacted')
  const overdueLeads = leads.filter(l => l.next_follow_up_date && isOverdue(l.next_follow_up_date))

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:block lg:fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 p-4 sm:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
                Sales Leads
              </h1>
              <p className="text-sm sm:text-base text-gray-600">SQL contacts from LinkedIn outreach</p>
            </div>
            <Button onClick={loadLeads} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold">{leads.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">New</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{newLeads.length}</p>
                <p className="text-xs text-gray-500 mt-1">Need first contact</p>
              </CardContent>
            </Card>
            <Card className={overdueLeads.length > 0 ? 'border-red-200' : ''}>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:gap-2">
                  {overdueLeads.length > 0 && <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />}
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl sm:text-3xl font-bold ${overdueLeads.length > 0 ? 'text-red-600' : ''}`}>
                  {overdueLeads.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Need attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{contactedLeads.length}</p>
                <p className="text-xs text-gray-500 mt-1">Being nurtured</p>
              </CardContent>
            </Card>
          </div>

          {/* Leads List */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                  <p className="text-gray-600">Loading leads...</p>
                </CardContent>
              </Card>
            ) : leads.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No leads yet. SQL contacts from Kondo will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              leads.map((lead) => (
                <Card key={lead.id} className={`hover:shadow-lg transition-shadow ${isOverdue(lead.next_follow_up_date) ? 'border-red-300 bg-red-50/30' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      {lead.picture_url && (
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={lead.picture_url} alt={lead.name} />
                          <AvatarFallback>
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {/* Lead Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                              {lead.name}
                              {isOverdue(lead.next_follow_up_date) && (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">{lead.title}</p>
                            {lead.company && (
                              <p className="text-sm text-gray-500 mt-1">{lead.company}</p>
                            )}
                            {lead.email && (
                              <p className="text-sm text-blue-600 mt-1">{lead.email}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {lead.linkedin_url && (
                              <Link href={lead.linkedin_url} target="_blank">
                                <Button size="sm" variant="outline">
                                  <Linkedin className="w-4 h-4 mr-2" />
                                  LinkedIn
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                          <Badge className={getPriorityColor(lead.priority)}>
                            {lead.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            Source: {lead.source.replace('_', ' ')}
                          </Badge>
                          {lead.pending_tasks_count > 0 && (
                            <Link href={`/admin/tasks?lead_id=${lead.id}`}>
                              <Badge className={lead.overdue_tasks_count > 0 ? "bg-red-100 text-red-800 cursor-pointer hover:bg-red-200" : "bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"}>
                                <CheckSquare className="w-3 h-3 mr-1" />
                                {lead.pending_tasks_count} task{lead.pending_tasks_count !== 1 ? 's' : ''}
                                {lead.overdue_tasks_count > 0 && ` (${lead.overdue_tasks_count} overdue)`}
                              </Badge>
                            </Link>
                          )}
                          {lead.email_thread_count > 0 && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <Mail className="w-3 h-3 mr-1" />
                              {lead.email_thread_count} email{lead.email_thread_count !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        {/* Latest Message */}
                        {lead.latest_message && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-700 line-clamp-2">{lead.latest_message}</p>
                          </div>
                        )}

                        {/* Notes */}
                        {lead.notes && (
                          <div className="bg-blue-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-700">{lead.notes}</p>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="flex gap-4 text-sm text-gray-600 mb-3">
                          {lead.last_contact_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Last contact: {new Date(lead.last_contact_date).toLocaleDateString()}
                            </div>
                          )}
                          {lead.next_follow_up_date && (
                            <div className={`flex items-center gap-2 ${isOverdue(lead.next_follow_up_date) ? 'text-red-600 font-semibold' : ''}`}>
                              <Calendar className="w-4 h-4" />
                              Next follow-up: {new Date(lead.next_follow_up_date).toLocaleDateString()}
                              {isOverdue(lead.next_follow_up_date) && ' (OVERDUE)'}
                            </div>
                          )}
                        </div>

                        {/* Email Activity Toggle */}
                        <div className="border-t pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleEmailExpanded(lead.id)}
                            className="w-full"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            {expandedEmailLeads.has(lead.id) ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-2" />
                                Hide Email Activity
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                Show Email Activity
                              </>
                            )}
                          </Button>

                          {expandedEmailLeads.has(lead.id) && (
                            <div className="mt-3">
                              <EmailActivity leadId={lead.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

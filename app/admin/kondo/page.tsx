"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ExternalLink, Linkedin, RefreshCw, Users } from "lucide-react"
import Link from "next/link"
import { AdminSidebar } from "@/components/admin-sidebar"

interface KondoContact {
  id: number
  first_name: string
  last_name: string
  email: string
  headline: string
  location: string
  picture_url: string
  conversation_status: string
  conversation_state: string
  latest_message: string
  latest_message_at: string
  kondo_url: string
  linkedin_url: string
  labels: Array<{ kondo_label_name: string }>
  updated_at: string
}

export default function KondoContactsPage() {
  const [contacts, setContacts] = useState<KondoContact[]>([])
  const [loading, setLoading] = useState(true)

  const loadContacts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/kondo/contacts')
      const data = await response.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'waiting_for_their_reply': 'bg-blue-100 text-blue-800',
      'waiting_for_your_reply': 'bg-orange-100 text-orange-800',
      'archived': 'bg-gray-100 text-gray-800',
      'in_inbox': 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getLabelColor = (label: string) => {
    const colors: Record<string, string> = {
      'SQL': 'bg-purple-100 text-purple-800',
      'MQL - High': 'bg-red-100 text-red-800',
      'MQL - Medium': 'bg-orange-100 text-orange-800',
      'MQL - Low': 'bg-yellow-100 text-yellow-800',
      'Client': 'bg-green-100 text-green-800',
      'Partner': 'bg-blue-100 text-blue-800',
      'Speaker': 'bg-indigo-100 text-indigo-800'
    }
    return colors[label] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Users className="w-10 h-10 text-blue-600" />
                Kondo LinkedIn Contacts
              </h1>
              <p className="text-gray-600">LinkedIn contacts synced from Kondo</p>
            </div>
            <Button onClick={loadContacts} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats - Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{contacts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">SQLs (Leads)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">
                  {contacts.filter(c => c.labels?.some(l => l.kondo_label_name === 'SQL')).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Added to CRM as leads</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total MQLs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">
                  {contacts.filter(c => c.labels?.some(l => l.kondo_label_name?.startsWith('MQL'))).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Marketing qualified</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {contacts.filter(c => c.labels?.some(l => l.kondo_label_name === 'Client')).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* MQL Funnel */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">MQL Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-red-900">MQL - High Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-red-600">
                    {contacts.filter(c => c.labels?.some(l => l.kondo_label_name === 'MQL - High')).length}
                  </p>
                  <p className="text-xs text-red-700 mt-2">Hot prospects - prioritize outreach</p>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-900">MQL - Medium Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-orange-600">
                    {contacts.filter(c => c.labels?.some(l => l.kondo_label_name === 'MQL - Medium')).length}
                  </p>
                  <p className="text-xs text-orange-700 mt-2">Warm leads - regular follow-up</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-yellow-900">MQL - Low Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-yellow-600">
                    {contacts.filter(c => c.labels?.some(l => l.kondo_label_name === 'MQL - Low')).length}
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">Nurture over time</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contacts List */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Loading contacts...</p>
                </CardContent>
              </Card>
            ) : contacts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No contacts found. Contacts will appear here when synced from Kondo.</p>
                </CardContent>
              </Card>
            ) : (
              contacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={contact.picture_url} alt={`${contact.first_name} ${contact.last_name}`} />
                        <AvatarFallback>
                          {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      {/* Contact Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-semibold">
                              {contact.first_name} {contact.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">{contact.headline}</p>
                            {contact.location && (
                              <p className="text-sm text-gray-500 mt-1">{contact.location}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {contact.linkedin_url && (
                              <Link href={contact.linkedin_url} target="_blank">
                                <Button size="sm" variant="outline">
                                  <Linkedin className="w-4 h-4 mr-2" />
                                  LinkedIn
                                </Button>
                              </Link>
                            )}
                            {contact.kondo_url && (
                              <Link href={contact.kondo_url} target="_blank">
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Kondo
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Labels */}
                        {contact.labels && contact.labels.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {contact.labels.slice(0, 6).map((label, i) => (
                              <Badge key={i} className={getLabelColor(label.kondo_label_name)}>
                                {label.kondo_label_name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Latest Message */}
                        {contact.latest_message && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-700 line-clamp-2">{contact.latest_message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(contact.latest_message_at).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {/* Status */}
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(contact.conversation_status)}>
                            {contact.conversation_status?.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Updated: {new Date(contact.updated_at).toLocaleDateString()}
                          </Badge>
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

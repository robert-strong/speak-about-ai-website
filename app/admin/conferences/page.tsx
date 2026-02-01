"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Search,
  Edit,
  Eye,
  MapPin,
  Building2,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  ExternalLink,
  Mail
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin-sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { AddConferenceDialog } from "@/components/add-conference-dialog"

interface Conference {
  id: number
  name: string
  slug: string
  organization?: string
  location?: string
  start_date?: string
  date_display?: string
  cfp_open: boolean
  cfp_deadline_display?: string
  status: string
  category?: {
    name: string
    icon?: string
  }
  featured: boolean
  verified: boolean
  published: boolean
  contact_email?: string
  website_url?: string
  created_at: string
}

export default function AdminConferencesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cfpFilter, setCfpFilter] = useState("all")
  const [publishedFilter, setPublishedFilter] = useState("all")

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check-auth")
      if (!response.ok) {
        router.push("/admin")
        return
      }
      loadConferences()
    } catch (error) {
      router.push("/admin")
    }
  }

  const loadConferences = async () => {
    try {
      const response = await fetch("/api/conferences")
      const data = await response.json()

      if (response.ok) {
        setConferences(data.conferences || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load conferences",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading conferences:", error)
      toast({
        title: "Error",
        description: "Failed to load conferences",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredConferences = conferences.filter(conf => {
    const matchesSearch =
      conf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conf.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conf.location?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || conf.status === statusFilter
    const matchesCfp = cfpFilter === "all" ||
      (cfpFilter === "open" && conf.cfp_open) ||
      (cfpFilter === "closed" && !conf.cfp_open)
    const matchesPublished = publishedFilter === "all" ||
      (publishedFilter === "published" && conf.published) ||
      (publishedFilter === "draft" && !conf.published)

    return matchesSearch && matchesStatus && matchesCfp && matchesPublished
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'to_do':
        return <Badge variant="secondary">To Do</Badge>
      case 'passed_watch':
        return <Badge variant="outline">Passed/Watch</Badge>
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>
      case 'attending':
        return <Badge className="bg-blue-600">Attending</Badge>
      case 'speaking':
        return <Badge className="bg-green-600">Speaking</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                Conference Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage event industry conferences and speaking opportunities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.push("/conference-directory")}>
                <Eye className="h-4 w-4 mr-2" />
                View Directory
              </Button>
              <AddConferenceDialog onSuccess={loadConferences} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conferences</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conferences.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CFP Open</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conferences.filter(c => c.cfp_open).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <Eye className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conferences.filter(c => c.published).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Featured</CardTitle>
                <Building2 className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conferences.filter(c => c.featured).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search conferences..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="to_do">To Do</SelectItem>
                    <SelectItem value="passed_watch">Passed/Watch</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="attending">Attending</SelectItem>
                    <SelectItem value="speaking">Speaking</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={cfpFilter} onValueChange={setCfpFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="CFP Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All CFP</SelectItem>
                    <SelectItem value="open">CFP Open</SelectItem>
                    <SelectItem value="closed">CFP Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Published" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Conferences Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading conferences...</p>
                </div>
              ) : filteredConferences.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No conferences found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conference</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>CFP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConferences.map((conference) => (
                      <TableRow key={conference.id}>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="font-medium">{conference.name}</div>
                              {conference.category && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {conference.category.icon} {conference.category.name}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {conference.featured && (
                                  <Badge variant="secondary" className="text-xs">Featured</Badge>
                                )}
                                {conference.verified && (
                                  <Badge variant="outline" className="text-xs">Verified</Badge>
                                )}
                                {!conference.published && (
                                  <Badge variant="destructive" className="text-xs">Draft</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{conference.organization || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {conference.date_display || conference.start_date || 'TBA'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center gap-1">
                            {conference.location && (
                              <>
                                <MapPin className="h-3 w-3" />
                                {conference.location}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {conference.cfp_open ? (
                            <div>
                              <Badge className="bg-green-600 mb-1">Open</Badge>
                              {conference.cfp_deadline_display && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {conference.cfp_deadline_display}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline">Closed</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(conference.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/conferences/${conference.id}/edit`)}
                              title="Edit conference"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/conference-directory/conferences/${conference.slug}`)}
                              title="View conference"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {conference.website_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(conference.website_url, '_blank')}
                                title="Visit website"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            {conference.contact_email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = `mailto:${conference.contact_email}`}
                                title="Email contact"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

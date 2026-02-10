"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Download,
  Users,
  BarChart3,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Linkedin,
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"

interface Prospect {
  name: string
  email: string
  phone: string
  company: string
  linkedin: string
  source: "Deal" | "Form Submission" | "Newsletter" | "WhatsApp"
  relationship: string
  deal_value: number | null
  date: string
  status: string
  source_id: number
}

interface Stats {
  total: number
  deals: number
  form_submissions: number
  newsletter: number
  whatsapp: number
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [stats, setStats] = useState<Stats>({
    total: 0,
    deals: 0,
    form_submissions: 0,
    newsletter: 0,
    whatsapp: 0,
  })

  useEffect(() => {
    fetchProspects()
  }, [])

  const fetchProspects = async () => {
    try {
      const response = await fetch("/api/admin/prospects")
      if (response.ok) {
        const data = await response.json()
        setProspects(data.prospects || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Error fetching prospects:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProspects = prospects.filter((p) => {
    // Tab filter
    if (activeTab !== "all") {
      const sourceMap: Record<string, string> = {
        deals: "Deal",
        form_submissions: "Form Submission",
        newsletter: "Newsletter",
        whatsapp: "WhatsApp",
      }
      if (p.source !== sourceMap[activeTab]) return false
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.company.toLowerCase().includes(term) ||
        p.relationship.toLowerCase().includes(term)
      )
    }

    return true
  })

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "Deal":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <BarChart3 className="h-3 w-3 mr-1" />
            Deal
          </Badge>
        )
      case "Form Submission":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <FileText className="h-3 w-3 mr-1" />
            Form
          </Badge>
        )
      case "Newsletter":
        return (
          <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">
            <Mail className="h-3 w-3 mr-1" />
            Newsletter
          </Badge>
        )
      case "WhatsApp":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <MessageSquare className="h-3 w-3 mr-1" />
            WhatsApp
          </Badge>
        )
      default:
        return <Badge variant="secondary">{source}</Badge>
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "LinkedIn",
      "Source",
      "Relationship",
      "Deal Value",
      "Date",
      "Status",
    ]
    const csvData = filteredProspects.map((p) => [
      p.name,
      p.email,
      p.phone,
      p.company,
      p.linkedin,
      p.source,
      p.relationship,
      p.deal_value != null ? p.deal_value.toString() : "",
      p.date ? new Date(p.date).toLocaleDateString() : "",
      p.status,
    ])

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `prospects-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:block lg:fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      <div className="lg:hidden">
        <AdminSidebar />
      </div>
      <div className="flex-1 lg:ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Prospects</h1>
              <p className="text-gray-600">
                All contacts across deals, forms, newsletter, and WhatsApp
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div className="text-sm text-gray-600">Total Contacts</div>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </Card>
              <Card className="p-4 border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <div className="text-sm text-gray-600">Deals</div>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {stats.deals}
                </div>
              </Card>
              <Card className="p-4 border-purple-200 bg-purple-50">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <div className="text-sm text-gray-600">Form Submissions</div>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {stats.form_submissions}
                </div>
              </Card>
              <Card className="p-4 border-pink-200 bg-pink-50">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-pink-600" />
                  <div className="text-sm text-gray-600">Newsletter</div>
                </div>
                <div className="text-2xl font-bold text-pink-700">
                  {stats.newsletter}
                </div>
              </Card>
              <Card className="p-4 border-green-200 bg-green-50">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <div className="text-sm text-gray-600">WhatsApp</div>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {stats.whatsapp}
                </div>
              </Card>
            </div>

            {/* Search and Export */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, company, or relationship..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            {/* Tabs and Table */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="deals">Deals ({stats.deals})</TabsTrigger>
                <TabsTrigger value="form_submissions">
                  Forms ({stats.form_submissions})
                </TabsTrigger>
                <TabsTrigger value="newsletter">
                  Newsletter ({stats.newsletter})
                </TabsTrigger>
                <TabsTrigger value="whatsapp">
                  WhatsApp ({stats.whatsapp})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {loading ? (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500">Loading prospects...</p>
                  </Card>
                ) : filteredProspects.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500">No prospects found</p>
                  </Card>
                ) : (
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-medium text-gray-600">
                              Name
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">
                              Company
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">
                              Contact Info
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">
                              Source
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">
                              Relationship
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProspects.map((prospect, index) => (
                            <tr
                              key={`${prospect.source}-${prospect.source_id}-${index}`}
                              className="border-b hover:bg-gray-50 transition-colors"
                            >
                              <td className="p-3">
                                <div className="font-medium text-gray-900">
                                  {prospect.name || "—"}
                                </div>
                                {prospect.deal_value != null && (
                                  <div className="text-xs text-green-600 font-medium">
                                    ${prospect.deal_value.toLocaleString()}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-gray-600">
                                {prospect.company || "—"}
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  {prospect.email && (
                                    <a
                                      href={`mailto:${prospect.email}`}
                                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                                    >
                                      <Mail className="h-3 w-3" />
                                      {prospect.email}
                                    </a>
                                  )}
                                  {prospect.phone && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                      <Phone className="h-3 w-3" />
                                      {prospect.phone}
                                    </span>
                                  )}
                                  {prospect.linkedin && (
                                    <a
                                      href={prospect.linkedin}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                                    >
                                      <Linkedin className="h-3 w-3" />
                                      LinkedIn
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                {getSourceBadge(prospect.source)}
                              </td>
                              <td className="p-3 text-gray-600 text-xs">
                                {prospect.relationship}
                              </td>
                              <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                                {prospect.date
                                  ? new Date(
                                      prospect.date
                                    ).toLocaleDateString()
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

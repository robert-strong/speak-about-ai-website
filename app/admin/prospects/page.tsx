"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  Mic,
  MapPin,
  Pencil,
  Trash2,
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

interface Speaker {
  id: number
  name: string
  email: string
  location: string
  topics: string[]
  programs: string[]
  linkedinUrl: string
  website: string
  fee: string
  oneLiner: string
  image: string
}

export default function ContactsPage() {
  const [mainTab, setMainTab] = useState("contacts")
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)
  const [speakersLoading, setSpeakersLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [speakerSearchTerm, setSpeakerSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [stats, setStats] = useState<Stats>({
    total: 0,
    deals: 0,
    form_submissions: 0,
    newsletter: 0,
    whatsapp: 0,
  })

  // Edit state
  const [editingContact, setEditingContact] = useState<Prospect | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", company: "", linkedin: "" })
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deletingContact, setDeletingContact] = useState<Prospect | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchProspects()
    fetchSpeakers()
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

  const fetchSpeakers = async () => {
    try {
      const response = await fetch("/api/speakers")
      if (response.ok) {
        const data = await response.json()
        setSpeakers(data.speakers || [])
      }
    } catch (error) {
      console.error("Error fetching speakers:", error)
    } finally {
      setSpeakersLoading(false)
    }
  }

  const openEdit = (prospect: Prospect) => {
    setEditingContact(prospect)
    setEditForm({
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone,
      company: prospect.company,
      linkedin: prospect.linkedin,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingContact) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/prospects/${editingContact.source_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: editingContact.source,
          ...editForm,
        }),
      })
      if (response.ok) {
        // Update local state
        setProspects((prev) =>
          prev.map((p) =>
            p.source === editingContact.source && p.source_id === editingContact.source_id
              ? { ...p, ...editForm }
              : p
          )
        )
        setEditingContact(null)
      }
    } catch (error) {
      console.error("Error updating contact:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingContact) return
    setDeleting(true)
    try {
      const response = await fetch(
        `/api/admin/prospects/${deletingContact.source_id}?source=${encodeURIComponent(deletingContact.source)}`,
        { method: "DELETE" }
      )
      if (response.ok) {
        setProspects((prev) =>
          prev.filter(
            (p) => !(p.source === deletingContact.source && p.source_id === deletingContact.source_id)
          )
        )
        // Update stats
        const sourceKey = {
          Deal: "deals",
          "Form Submission": "form_submissions",
          Newsletter: "newsletter",
          WhatsApp: "whatsapp",
        }[deletingContact.source] as keyof Stats
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          [sourceKey]: (prev[sourceKey] as number) - 1,
        }))
        setDeletingContact(null)
      }
    } catch (error) {
      console.error("Error deleting contact:", error)
    } finally {
      setDeleting(false)
    }
  }

  const filteredProspects = prospects.filter((p) => {
    if (activeTab !== "all") {
      const sourceMap: Record<string, string> = {
        deals: "Deal",
        form_submissions: "Form Submission",
        newsletter: "Newsletter",
        whatsapp: "WhatsApp",
      }
      if (p.source !== sourceMap[activeTab]) return false
    }

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

  const filteredSpeakers = speakers.filter((s) => {
    if (!speakerSearchTerm) return true
    const term = speakerSearchTerm.toLowerCase()
    return (
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.location?.toLowerCase().includes(term) ||
      s.topics?.some((t) => t.toLowerCase().includes(term)) ||
      s.programs?.some((p) => p.toLowerCase().includes(term))
    )
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
      "Name", "Email", "Phone", "Company", "LinkedIn",
      "Source", "Relationship", "Deal Value", "Date", "Status",
    ]
    const csvData = filteredProspects.map((p) => [
      p.name, p.email, p.phone, p.company, p.linkedin,
      p.source, p.relationship,
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
    a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportSpeakersToCSV = () => {
    const headers = ["Name", "Email", "Location", "Topics", "Programs", "Fee Range", "LinkedIn", "Website"]
    const csvData = filteredSpeakers.map((s) => [
      s.name, s.email, s.location || "",
      (s.topics || []).join("; "), (s.programs || []).join("; "),
      s.fee || "", s.linkedinUrl || "", s.website || "",
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
    a.download = `speakers-${new Date().toISOString().split("T")[0]}.csv`
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
              <h1 className="text-2xl font-bold">Contacts</h1>
              <p className="text-gray-600">
                All contacts, prospects, and speakers
              </p>
            </div>

            {/* Main Tabs: Contacts / Speakers */}
            <Tabs value={mainTab} onValueChange={setMainTab}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="contacts" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="speakers" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Speakers
                </TabsTrigger>
              </TabsList>

              {/* Contacts Tab */}
              <TabsContent value="contacts" className="space-y-6">
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

                {/* Source Filter Tabs and Table */}
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
                        <p className="text-gray-500">Loading contacts...</p>
                      </Card>
                    ) : filteredProspects.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-gray-500">No contacts found</p>
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
                                <th className="text-left p-3 font-medium text-gray-600 w-20">
                                  Actions
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
                                      {prospect.name && prospect.name !== "Website Visitor"
                                        ? prospect.name
                                        : <span className="text-gray-400 italic">{prospect.name || "\u2014"}</span>}
                                    </div>
                                    {prospect.deal_value != null && (
                                      <div className="text-xs text-green-600 font-medium">
                                        ${prospect.deal_value.toLocaleString()}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-gray-600">
                                    {prospect.company || "\u2014"}
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
                                      ? new Date(prospect.date).toLocaleDateString()
                                      : "\u2014"}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => openEdit(prospect)}
                                        title="Edit contact"
                                      >
                                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 hover:bg-red-50"
                                        onClick={() => setDeletingContact(prospect)}
                                        title="Delete contact"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                      </Button>
                                    </div>
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
              </TabsContent>

              {/* Speakers Tab */}
              <TabsContent value="speakers" className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="h-4 w-4 text-purple-500" />
                      <div className="text-sm text-gray-600">Total Speakers</div>
                    </div>
                    <div className="text-2xl font-bold">{speakers.length}</div>
                  </Card>
                  <Card className="p-4 border-purple-200 bg-purple-50">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      <div className="text-sm text-gray-600">Locations</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {new Set(speakers.filter((s) => s.location).map((s) => s.location)).size}
                    </div>
                  </Card>
                  <Card className="p-4 border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <div className="text-sm text-gray-600">With Email</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {speakers.filter((s) => s.email).length}
                    </div>
                  </Card>
                </div>

                {/* Search and Export */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, location, or topic..."
                      value={speakerSearchTerm}
                      onChange={(e) => setSpeakerSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" onClick={exportSpeakersToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>

                {/* Speakers Table */}
                {speakersLoading ? (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500">Loading speakers...</p>
                  </Card>
                ) : filteredSpeakers.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500">No speakers found</p>
                  </Card>
                ) : (
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-medium text-gray-600">
                              Speaker
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">
                              Location
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">
                              Contact Info
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">
                              Main Topics
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">
                              Fee Range
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSpeakers.map((speaker) => (
                            <tr
                              key={speaker.id}
                              className="border-b hover:bg-gray-50 transition-colors"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  {speaker.image ? (
                                    <img
                                      src={speaker.image}
                                      alt={speaker.name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                      <Mic className="h-5 w-5 text-purple-500" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {speaker.name}
                                    </div>
                                    {speaker.oneLiner && (
                                      <div className="text-xs text-gray-500 max-w-[250px] truncate">
                                        {speaker.oneLiner}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                {speaker.location ? (
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                    {speaker.location}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">{"\u2014"}</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  {speaker.email && (
                                    <a
                                      href={`mailto:${speaker.email}`}
                                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                                    >
                                      <Mail className="h-3 w-3" />
                                      {speaker.email}
                                    </a>
                                  )}
                                  {speaker.linkedinUrl && (
                                    <a
                                      href={speaker.linkedinUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                                    >
                                      <Linkedin className="h-3 w-3" />
                                      LinkedIn
                                    </a>
                                  )}
                                  {speaker.website && (
                                    <a
                                      href={speaker.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                                    >
                                      Website
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                  {(speaker.topics || []).slice(0, 4).map((topic, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                  {(speaker.topics || []).length > 4 && (
                                    <Badge variant="outline" className="text-xs text-gray-500">
                                      +{speaker.topics.length - 4}
                                    </Badge>
                                  )}
                                  {(!speaker.topics || speaker.topics.length === 0) && (
                                    <span className="text-gray-400 text-xs">{"\u2014"}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-gray-600 text-sm whitespace-nowrap">
                                {speaker.fee || "\u2014"}
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

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 mb-2">
              {editingContact && getSourceBadge(editingContact.source)}
              {editingContact && (
                <span className="text-xs text-gray-500">{editingContact.relationship}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                placeholder="Company name"
              />
            </div>
            {editingContact?.source === "WhatsApp" && (
              <div className="space-y-2">
                <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
                <Input
                  id="edit-linkedin"
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                  placeholder="LinkedIn profile URL"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContact(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {deletingContact?.name || deletingContact?.email}
              </span>
              ? This will permanently remove the record from the{" "}
              <span className="font-semibold">{deletingContact?.source}</span> source.
            </p>
            <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingContact(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

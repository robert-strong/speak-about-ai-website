"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Plus,
  Search,
  Edit,
  Eye,
  Phone,
  Mail,
  MapPin,
  Clock,
  LogOut,
  BarChart3,
  CheckSquare,
  Loader2,
  AlertTriangle,
  Database,
  ExternalLink,
  FileText,
  List,
  Kanban,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { DealsKanban } from "@/components/deals-kanban"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Deal {
  id: number
  client_name: string
  client_email: string
  client_phone: string
  company: string
  event_title: string
  event_date: string
  event_location: string
  event_type: string
  speaker_requested?: string
  attendee_count: number
  budget_range: string
  deal_value: number
  travel_required: boolean
  travel_stipend: number
  flight_required: boolean
  hotel_required: boolean
  travel_notes?: string
  status: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
  priority: "low" | "medium" | "high" | "urgent"
  source: string
  notes: string
  created_at: string
  last_contact: string
  next_follow_up?: string
  updated_at: string
}

const DEAL_STATUSES = {
  lead: { label: "New Lead", color: "bg-gray-500" },
  qualified: { label: "Qualified", color: "bg-blue-500" },
  proposal: { label: "Proposal Sent", color: "bg-yellow-500" },
  negotiation: { label: "Negotiating", color: "bg-orange-500" },
  won: { label: "Won", color: "bg-green-500" },
  lost: { label: "Lost", color: "bg-red-500" },
}

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline")

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    company: "",
    eventTitle: "",
    eventDate: "",
    eventLocation: "",
    eventType: "in-person",
    speakerRequested: "",
    attendeeCount: "",
    budgetRange: "",
    dealValue: "",
    travelRequired: false,
    travelStipend: "",
    flightRequired: false,
    hotelRequired: false,
    travelNotes: "",
    status: "lead" as Deal["status"],
    priority: "medium" as Deal["priority"],
    source: "",
    notes: "",
    nextFollowUp: "",
  })

  // Check authentication and load deals
  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadDeals()
  }, [router])

  const loadDeals = async () => {
    try {
      setLoading(true)
      setDatabaseError(null)
      const response = await fetch("/api/deals")

      if (response.ok) {
        const dealsData = await response.json()
        setDeals(Array.isArray(dealsData) ? dealsData : dealsData.deals || [])
        setTableExists(true)
      } else {
        const errorData = await response.json()
        setDeals([])

        if (response.status === 503 && errorData.tableExists === false) {
          setTableExists(false)
          setDatabaseError("The deals table doesn't exist in your database. Please run the setup script to create it.")
        } else {
          setDatabaseError(errorData.error || "Failed to load deals")
          toast({
            title: "Error",
            description: errorData.error || "Failed to load deals",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error loading deals:", error)
      setDeals([])
      setDatabaseError("Failed to connect to the database")
      toast({
        title: "Error",
        description: "Failed to load deals",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Optimize button click handlers
  const handleShowCreateForm = useCallback(() => {
    setShowCreateForm(true)
  }, [])

  // Optimize form field updates
  const updateFormField = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleCancelForm = useCallback(() => {
    setShowCreateForm(false)
    setEditingDeal(null)
    setFormData({
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      company: "",
      eventTitle: "",
      eventDate: "",
      eventLocation: "",
      eventType: "in-person",
      speakerRequested: "",
      attendeeCount: "",
      budgetRange: "",
      dealValue: "",
      travelRequired: false,
      travelStipend: "",
      flightRequired: false,
      hotelRequired: false,
      travelNotes: "",
      status: "lead",
      priority: "medium",
      source: "",
      notes: "",
      nextFollowUp: "",
    })
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear all authentication data
      localStorage.removeItem("adminLoggedIn")
      localStorage.removeItem("adminSessionToken")
      localStorage.removeItem("adminUser")
      router.push("/admin")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const dealData = {
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        client_phone: formData.clientPhone,
        company: formData.company,
        event_title: formData.eventTitle,
        event_date: formData.eventDate,
        event_location: formData.eventLocation,
        event_type: formData.eventType,
        speaker_requested: formData.speakerRequested,
        attendee_count: Number.parseInt(formData.attendeeCount) || 0,
        budget_range: formData.budgetRange,
        deal_value: Number.parseFloat(formData.dealValue) || 0,
        travel_required: formData.travelRequired,
        travel_stipend: Number.parseFloat(formData.travelStipend) || 0,
        flight_required: formData.flightRequired,
        hotel_required: formData.hotelRequired,
        travel_notes: formData.travelNotes,
        status: formData.status,
        priority: formData.priority,
        source: formData.source,
        notes: formData.notes,
        last_contact: new Date().toISOString().split("T")[0],
        next_follow_up: formData.nextFollowUp || undefined,
      }

      let response
      if (editingDeal) {
        response = await fetch(`/api/deals/${editingDeal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dealData),
        })
      } else {
        response = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dealData),
        })
      }

      if (response.ok) {
        toast({
          title: "Success",
          description: editingDeal ? "Deal updated successfully" : "Deal created successfully",
        })

        // Reset form and reload deals
        setFormData({
          clientName: "",
          clientEmail: "",
          clientPhone: "",
          company: "",
          eventTitle: "",
          eventDate: "",
          eventLocation: "",
          eventType: "in-person",
          speakerRequested: "",
          attendeeCount: "",
          budgetRange: "",
          dealValue: "",
          travelRequired: false,
          travelStipend: "",
          flightRequired: false,
          hotelRequired: false,
          travelNotes: "",
          status: "lead",
          priority: "medium",
          source: "",
          notes: "",
          nextFollowUp: "",
        })
        setShowCreateForm(false)
        setEditingDeal(null)
        loadDeals()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to save deal",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving deal:", error)
      toast({
        title: "Error",
        description: "Failed to save deal",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (deal: Deal) => {
    setFormData({
      clientName: deal.client_name,
      clientEmail: deal.client_email,
      clientPhone: deal.client_phone,
      company: deal.company,
      eventTitle: deal.event_title,
      eventDate: deal.event_date,
      eventLocation: deal.event_location,
      eventType: deal.event_type || "in-person",
      speakerRequested: deal.speaker_requested || "",
      attendeeCount: deal.attendee_count.toString(),
      budgetRange: deal.budget_range,
      dealValue: deal.deal_value.toString(),
      travelRequired: deal.travel_required || false,
      travelStipend: deal.travel_stipend ? deal.travel_stipend.toString() : "",
      flightRequired: deal.flight_required || false,
      hotelRequired: deal.hotel_required || false,
      travelNotes: deal.travel_notes || "",
      status: deal.status,
      priority: deal.priority,
      source: deal.source,
      notes: deal.notes,
      nextFollowUp: deal.next_follow_up || "",
    })
    setEditingDeal(deal)
    setShowCreateForm(true)
  }

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.event_title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || deal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading deals...</span>
      </div>
    )
  }

  // Calculate statistics - handle string values from database
  const totalDeals = deals.length
  
  // Parse deal value whether it's a string or number
  const parseDealValue = (deal: Deal): number => {
    if (!deal || !deal.deal_value) return 0
    if (typeof deal.deal_value === 'number') return deal.deal_value
    if (typeof deal.deal_value === 'string') {
      const parsed = parseFloat(deal.deal_value)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }
  
  const totalValue = deals.reduce((sum, deal) => sum + parseDealValue(deal), 0)
  const wonDeals = deals.filter((d) => d.status === "won").length
  const pipelineValue = deals
    .filter((d) => d.status !== "won" && d.status !== "lost")
    .reduce((sum, deal) => sum + parseDealValue(deal), 0)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage deals and event bookings</p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={handleShowCreateForm} 
                disabled={!tableExists}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Deal
              </Button>
            </div>
          </div>

        {/* Database Error Alert */}
        {databaseError && !tableExists && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Database Setup Required</AlertTitle>
            <AlertDescription className="text-yellow-700">
              <p className="mb-3">{databaseError}</p>
              <div className="flex gap-2">
                <Link href="/debug-neon">
                  <Button size="sm" variant="outline" className="bg-white">
                    <Database className="mr-2 h-4 w-4" />
                    Debug Database
                  </Button>
                </Link>
                <Button size="sm" onClick={loadDeals} variant="outline" className="bg-white">
                  <Loader2 className="mr-2 h-4 w-4" />
                  Retry Connection
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0 
                }).format(pipelineValue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wonDeals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0 
                }).format(totalValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {tableExists && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search deals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="lead">New Leads</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal Sent</SelectItem>
                    <SelectItem value="negotiation">Negotiating</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && tableExists && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingDeal ? "Edit Deal" : "Create New Deal"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => updateFormField('clientName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => updateFormField('company', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => updateFormField('clientEmail', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientPhone">Phone</Label>
                      <Input
                        id="clientPhone"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventTitle">Event Title *</Label>
                      <Input
                        id="eventTitle"
                        value={formData.eventTitle}
                        onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventType">Event Format</Label>
                      <Select
                        value={formData.eventType}
                        onValueChange={(value) => {
                          setFormData({ 
                            ...formData, 
                            eventType: value,
                            travelRequired: value === "in-person",
                            flightRequired: false,
                            hotelRequired: false,
                            travelStipend: ""
                          })
                        }}
                      >
                        <SelectTrigger id="eventType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in-person">In-Person</SelectItem>
                          <SelectItem value="virtual">Virtual</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="eventDate">Event Date</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventLocation">Location</Label>
                      <Input
                        id="eventLocation"
                        value={formData.eventLocation}
                        onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="attendeeCount">Expected Attendees</Label>
                      <Input
                        id="attendeeCount"
                        type="number"
                        value={formData.attendeeCount}
                        onChange={(e) => setFormData({ ...formData, attendeeCount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="speakerRequested">Speaker Requested</Label>
                      <Input
                        id="speakerRequested"
                        value={formData.speakerRequested}
                        onChange={(e) => setFormData({ ...formData, speakerRequested: e.target.value })}
                        placeholder="Adam Cheyer, AI Expert, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Travel Information */}
                {formData.eventType === "in-person" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Travel Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="flightRequired"
                          className="rounded"
                          checked={formData.flightRequired}
                          onChange={(e) => setFormData({ ...formData, flightRequired: e.target.checked })}
                        />
                        <Label htmlFor="flightRequired">Flight Required</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hotelRequired"
                          className="rounded"
                          checked={formData.hotelRequired}
                          onChange={(e) => setFormData({ ...formData, hotelRequired: e.target.checked })}
                        />
                        <Label htmlFor="hotelRequired">Hotel Required</Label>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="travelStipend">Travel Stipend ($)</Label>
                        <Input
                          id="travelStipend"
                          type="number"
                          value={formData.travelStipend}
                          onChange={(e) => setFormData({ ...formData, travelStipend: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="travelNotes">Travel Notes</Label>
                        <Textarea
                          id="travelNotes"
                          value={formData.travelNotes}
                          onChange={(e) => setFormData({ ...formData, travelNotes: e.target.value })}
                          rows={3}
                          placeholder="Additional travel requirements or notes..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Deal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Deal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budgetRange">Budget Range</Label>
                      <Input
                        id="budgetRange"
                        value={formData.budgetRange}
                        onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                        placeholder="$10,000 - $20,000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dealValue">Deal Value ($)</Label>
                      <Input
                        id="dealValue"
                        type="number"
                        value={formData.dealValue}
                        onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: Deal["status"]) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">New Lead</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="proposal">Proposal Sent</SelectItem>
                          <SelectItem value="negotiation">Negotiating</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: Deal["priority"]) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="source">Lead Source</Label>
                      <Input
                        id="source"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        placeholder="Website, LinkedIn, Referral, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="nextFollowUp">Expected Close Date</Label>
                      <Input
                        id="nextFollowUp"
                        type="date"
                        value={formData.nextFollowUp}
                        onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Add any additional notes about the deal..."
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingDeal ? "Update Deal" : "Create Deal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Deals Management Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Deal Management</h2>
          </div>

          {!tableExists ? (
            <Card>
              <CardContent className="text-center py-12">
                <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Setup Required</h3>
                <p className="text-gray-500 mb-4">
                  The deals table doesn't exist in your database. Please run the setup script to get started.
                </p>
                <div className="flex justify-center gap-2">
                  <Link href="/debug-neon">
                    <Button>
                      <Database className="mr-2 h-4 w-4" />
                      Debug Database
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={loadDeals}>
                    <Loader2 className="mr-2 h-4 w-4" />
                    Retry Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "pipeline" | "list")} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="pipeline" className="flex items-center gap-2">
                  <Kanban className="h-4 w-4" />
                  Pipeline View
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pipeline" className="space-y-4">
                <Card>
                  <CardContent className="p-6 overflow-x-auto">
                    <div className="min-w-[1200px]">
                      <DealsKanban onDealClick={(deal) => setSelectedDeal(deal)} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredDeals.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                No deals found matching your filters
                              </td>
                            </tr>
                          ) : (
                            filteredDeals.map((deal) => (
                              <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{deal.client_name}</div>
                                    <div className="text-sm text-gray-500">{deal.company}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{deal.event_title}</div>
                                    <div className="text-sm text-gray-500">{deal.event_location}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ${new Intl.NumberFormat('en-US', { 
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0 
                                  }).format(deal.deal_value)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    className={`${DEAL_STATUSES[deal.status].color} text-white`}
                                  >
                                    {DEAL_STATUSES[deal.status].label}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant="outline"
                                    className={PRIORITY_COLORS[deal.priority]}
                                  >
                                    {deal.priority.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(deal.event_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedDeal(deal)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEdit(deal)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Deal Detail Modal */}
        {selectedDeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{selectedDeal.event_title}</CardTitle>
                  <Button variant="ghost" onClick={() => setSelectedDeal(null)}>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Client Information</h4>
                  <p>
                    {selectedDeal.client_name} - {selectedDeal.company}
                  </p>
                  <p>
                    {selectedDeal.client_email} | {selectedDeal.client_phone}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Event Details</h4>
                  <p>
                    <strong>Date:</strong> {new Date(selectedDeal.event_date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedDeal.event_location}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedDeal.event_type}
                  </p>
                  <p>
                    <strong>Attendees:</strong> {selectedDeal.attendee_count}
                  </p>
                  {selectedDeal.speaker_requested && (
                    <p>
                      <strong>Speaker:</strong> {selectedDeal.speaker_requested}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">Deal Information</h4>
                  <p>
                    <strong>Value:</strong> ${new Intl.NumberFormat('en-US', { 
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0 
                    }).format(selectedDeal.deal_value)}
                  </p>
                  <p>
                    <strong>Budget Range:</strong> {selectedDeal.budget_range}
                  </p>
                  <p>
                    <strong>Status:</strong> {DEAL_STATUSES[selectedDeal.status].label}
                  </p>
                  <p>
                    <strong>Priority:</strong> {selectedDeal.priority.toUpperCase()}
                  </p>
                  <p>
                    <strong>Source:</strong> {selectedDeal.source}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Timeline</h4>
                  <p>
                    <strong>Created:</strong> {new Date(selectedDeal.created_at).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Last Contact:</strong> {new Date(selectedDeal.last_contact).toLocaleDateString()}
                  </p>
                  {selectedDeal.next_follow_up && (
                    <p>
                      <strong>Next Follow-up:</strong> {new Date(selectedDeal.next_follow_up).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {selectedDeal.notes && (
                  <div>
                    <h4 className="font-semibold">Notes</h4>
                    <p className="text-sm text-gray-600">{selectedDeal.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

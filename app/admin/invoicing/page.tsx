"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  Receipt,
  Check,
  Trash2,
  Edit,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Mail
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { InvoicePDFDialog } from "@/components/invoice-pdf-viewer"
import { InvoiceEditorModal } from "@/components/invoice-editor-modal"
import { authGet, authPost, authPatch, authDelete } from "@/lib/auth-fetch"

interface Project {
  id: number
  contract_id?: number
  project_name: string
  client_name: string
  client_email: string
  client_phone?: string
  company?: string
  speaker_name?: string
  speaker_email?: string
  event_title: string
  event_date: string
  event_location: string
  event_type: string
  attendee_count?: number
  status: "invoicing" | "logistics_planning" | "pre_event" | "event_week" | "follow_up" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  budget: string
  speaker_fee?: string
  spent?: string
  invoice_sent?: boolean
  payment_received?: boolean
  description?: string
  notes?: string
  created_at: string
  updated_at: string

  // Event logistics
  venue_details?: string
  av_requirements?: string
  travel_arrangements?: string
  accommodation_details?: string
  expenses_budget?: number
  travel_expenses_amount?: string

  // Timeline milestones
  contracts_due?: string
  speaker_confirmation_due?: string
  av_check_due?: string
  final_details_due?: string

  // New fields
  event_name?: string
}

interface Invoice {
  id: number
  project_id: number
  invoice_number: string
  invoice_type?: "deposit" | "final" | "standard"
  amount: number | string
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  issue_date: string
  due_date: string
  payment_date?: string
  notes?: string
}

// Helper to safely parse amount as number
const parseAmount = (amount: number | string | undefined): number => {
  if (amount === undefined || amount === null) return 0
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(parsed) ? 0 : parsed
}

const INVOICE_STATUSES = {
  draft: { label: "Draft", color: "bg-gray-500" },
  sent: { label: "Sent", color: "bg-blue-500" },
  paid: { label: "Paid", color: "bg-green-500" },
  overdue: { label: "Overdue", color: "bg-red-500" },
  cancelled: { label: "Cancelled", color: "bg-gray-400" }
}

type SortField = "due_date" | "amount" | "status" | "invoice_number"
type SortOrder = "asc" | "desc"

export default function InvoicingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState<{id: number, number: string} | null>(null)
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<number | null>(null)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortField>("due_date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [projectSearch, setProjectSearch] = useState("")

  const [invoiceFormData, setInvoiceFormData] = useState({
    project_id: "",
    invoice_type: "",
    amount: "",
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_terms: "net-30",
    notes: ""
  })

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)

      const [projectsResponse, invoicesResponse] = await Promise.all([
        authGet("/api/projects"),
        authGet("/api/invoices")
      ])

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData)
      }

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData)
      } else {
        console.log("Invoices API not available yet, using empty array")
        setInvoices([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatEventDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A'
    try {
      let date: Date

      if (dateString.length === 10 && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number)
        date = new Date(year, month - 1, day)
      } else {
        const datePart = dateString.split('T')[0]
        const [year, month, day] = datePart.split('-').map(Number)
        date = new Date(year, month - 1, day)
      }

      if (isNaN(date.getTime())) return 'N/A'

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'N/A'
    }
  }

  // Check if an invoice is overdue (past due date and not paid/cancelled)
  const isInvoiceOverdue = (invoice: Invoice) => {
    if (invoice.status === "paid" || invoice.status === "cancelled") return false
    if (invoice.status === "overdue") return true // Already marked overdue in DB

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const due = new Date(invoice.due_date)
    due.setHours(0, 0, 0, 0)

    return due.getTime() < today.getTime()
  }

  // Calculate due date status for visual indicators
  const getDueDateStatus = (dueDate: string, status: string) => {
    if (status === "paid" || status === "cancelled") return "normal"

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) return "overdue"
    if (daysUntilDue <= 7) return "due-soon"
    return "normal"
  }

  // Filter and sort invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "overdue") {
        // For overdue tab, include both DB-marked overdue AND sent invoices past due date
        filtered = filtered.filter(inv => isInvoiceOverdue(inv))
      } else if (statusFilter === "sent") {
        // For sent tab, exclude invoices that are actually overdue
        filtered = filtered.filter(inv => inv.status === "sent" && !isInvoiceOverdue(inv))
      } else {
        filtered = filtered.filter(inv => inv.status === statusFilter)
      }
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(invoice => {
        const project = projects.find(p => p.id === invoice.project_id)
        return (
          invoice.invoice_number.toLowerCase().includes(searchLower) ||
          project?.client_name?.toLowerCase().includes(searchLower) ||
          project?.company?.toLowerCase().includes(searchLower) ||
          project?.event_name?.toLowerCase().includes(searchLower) ||
          project?.event_title?.toLowerCase().includes(searchLower) ||
          project?.project_name?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "due_date":
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          break
        case "amount":
          comparison = parseAmount(a.amount) - parseAmount(b.amount)
          break
        case "status":
          const statusOrder = { draft: 0, sent: 1, overdue: 2, paid: 3, cancelled: 4 }
          comparison = statusOrder[a.status] - statusOrder[b.status]
          break
        case "invoice_number":
          comparison = a.invoice_number.localeCompare(b.invoice_number)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [invoices, projects, statusFilter, searchTerm, sortBy, sortOrder])

  // Filter projects for dropdown with search
  const filteredProjects = useMemo(() => {
    const activeProjects = projects.filter(p => !["completed", "cancelled"].includes(p.status))

    if (!projectSearch) return activeProjects

    const searchLower = projectSearch.toLowerCase()
    return activeProjects.filter(project =>
      project.client_name?.toLowerCase().includes(searchLower) ||
      project.company?.toLowerCase().includes(searchLower) ||
      project.event_name?.toLowerCase().includes(searchLower) ||
      project.event_title?.toLowerCase().includes(searchLower) ||
      project.project_name?.toLowerCase().includes(searchLower)
    )
  }, [projects, projectSearch])

  // Get selected project details for preview
  const selectedProject = useMemo(() => {
    if (!invoiceFormData.project_id) return null
    return projects.find(p => p.id.toString() === invoiceFormData.project_id)
  }, [projects, invoiceFormData.project_id])

  // Count invoices by status (overdue includes sent invoices past due date)
  const statusCounts = useMemo(() => {
    const overdueCount = invoices.filter(i => isInvoiceOverdue(i)).length
    const sentCount = invoices.filter(i => i.status === "sent" && !isInvoiceOverdue(i)).length

    return {
      all: invoices.length,
      draft: invoices.filter(i => i.status === "draft").length,
      sent: sentCount,
      paid: invoices.filter(i => i.status === "paid").length,
      overdue: overdueCount
    }
  }, [invoices])

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    return sortOrder === "asc"
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  const handleInvoiceTypeChange = (value: string, projectId: string) => {
    if (!projectId) return

    const project = projects.find(p => p.id.toString() === projectId)
    if (!project) return

    const speakerFee = parseFloat(project.speaker_fee || project.budget || "0")
    const travelExpenses = parseFloat(project.travel_expenses_amount || "0")
    const totalAmount = speakerFee + travelExpenses
    let amount = ""

    switch (value) {
      case "initial":
        amount = (totalAmount * 0.5).toString()
        break
      case "final":
        amount = (totalAmount * 0.5).toString()
        break
      case "full":
        amount = totalAmount.toString()
        break
      case "full-speaker-only":
        amount = speakerFee.toString()
        break
      case "travel-only":
        amount = travelExpenses.toString()
        break
      case "custom":
        amount = ""
        break
    }

    setInvoiceFormData({
      ...invoiceFormData,
      invoice_type: value,
      amount: amount
    })
  }

  const handleCreateInvoice = async () => {
    try {
      const response = await authPost("/api/invoices", {
          project_id: parseInt(invoiceFormData.project_id)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invoice created successfully"
        })
        loadData()
        setInvoiceFormData({
          project_id: "",
          invoice_type: "",
          amount: "",
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_terms: "net-30",
          notes: ""
        })
        setProjectSearch("")
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create invoice",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive"
      })
    }
  }

  const handleUpdateInvoiceStatus = async (invoiceId: number, newStatus: string) => {
    try {
      const updateData: { status: string; payment_date?: string } = { status: newStatus }

      // If marking as paid, set payment_date to today
      if (newStatus === "paid") {
        updateData.payment_date = new Date().toISOString().split('T')[0]
      }

      const response = await authPatch(`/api/invoices/${invoiceId}`, updateData)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invoice status updated"
        })
        loadData()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update invoice status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating invoice status:", error)
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive"
      })
    }
  }

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return

    try {
      const response = await authDelete(`/api/invoices/${invoiceId}`)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invoice deleted successfully"
        })
        loadData()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete invoice",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      })
    }
  }

  const markInvoicePaid = async (invoiceId: number) => {
    await handleUpdateInvoiceStatus(invoiceId, "paid")
  }

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      await handleUpdateInvoiceStatus(invoiceId, "sent")
      toast({
        title: "Invoice Sent",
        description: "Invoice has been marked as sent"
      })
    } catch (error) {
      console.error("Error sending invoice:", error)
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive"
      })
    }
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
            <p className="text-gray-600 mt-2">Create, manage, and track invoices for all projects</p>
          </div>

          {/* Invoice Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${new Intl.NumberFormat('en-US').format(
                    invoices.reduce((sum, inv) => sum + parseAmount(inv.amount), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoices.length} total invoices
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${new Intl.NumberFormat('en-US').format(
                    invoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + parseAmount(inv.amount), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoices.filter(i => i.status === "paid").length} paid
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  ${new Intl.NumberFormat('en-US').format(
                    invoices.filter(i => i.status === "sent" || isInvoiceOverdue(i)).reduce((sum, inv) => sum + parseAmount(inv.amount), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoices.filter(i => i.status === "sent" || isInvoiceOverdue(i)).length} pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${new Intl.NumberFormat('en-US').format(
                    invoices.filter(i => isInvoiceOverdue(i)).reduce((sum, inv) => sum + parseAmount(inv.amount), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoices.filter(i => isInvoiceOverdue(i)).length} overdue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Create Invoice Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Create New Invoice</CardTitle>
                  <CardDescription>Generate invoices for your projects</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="project-search">Select Project</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="project-search"
                        placeholder="Search projects..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={invoiceFormData.project_id}
                      onValueChange={(value) => {
                        setInvoiceFormData({...invoiceFormData, project_id: value})
                        if (invoiceFormData.invoice_type) {
                          handleInvoiceTypeChange(invoiceFormData.invoice_type, value)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProjects.map(project => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.event_name || project.event_title || project.project_name} - {project.client_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="invoice-type">Invoice Type</Label>
                  <Select
                    value={invoiceFormData.invoice_type}
                    onValueChange={(value) => handleInvoiceTypeChange(value, invoiceFormData.project_id)}
                  >
                    <SelectTrigger id="invoice-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Initial Invoice (50% of Total)</SelectItem>
                      <SelectItem value="final">Final Invoice (50% of Total)</SelectItem>
                      <SelectItem value="full">Full Amount (Speaker Fee + Travel)</SelectItem>
                      <SelectItem value="full-speaker-only">Speaker Fee Only</SelectItem>
                      <SelectItem value="travel-only">Travel Expenses Only</SelectItem>
                      <SelectItem value="custom">Custom Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="invoice-amount">Amount</Label>
                  <Input
                    id="invoice-amount"
                    type="number"
                    placeholder="25000"
                    value={invoiceFormData.amount}
                    onChange={(e) => setInvoiceFormData({...invoiceFormData, amount: e.target.value})}
                    disabled={invoiceFormData.invoice_type !== "custom" && invoiceFormData.invoice_type !== ""}
                  />
                </div>
              </div>

              {/* Project Preview */}
              {selectedProject && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Project Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Client:</span>
                      <p className="font-medium">{selectedProject.client_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Company:</span>
                      <p className="font-medium">{selectedProject.company || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{selectedProject.client_email || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Event Date:</span>
                      <p className="font-medium">{formatEventDate(selectedProject.event_date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Speaker Fee:</span>
                      <p className="font-medium">${new Intl.NumberFormat('en-US').format(parseFloat(selectedProject.speaker_fee || selectedProject.budget || "0"))}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Travel Expenses:</span>
                      <p className="font-medium">${new Intl.NumberFormat('en-US').format(parseFloat(selectedProject.travel_expenses_amount || "0"))}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="invoice-due-date">Due Date</Label>
                  <Input
                    id="invoice-due-date"
                    type="date"
                    value={invoiceFormData.due_date}
                    onChange={(e) => setInvoiceFormData({...invoiceFormData, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="invoice-terms">Payment Terms</Label>
                  <Select
                    value={invoiceFormData.payment_terms}
                    onValueChange={(value) => setInvoiceFormData({...invoiceFormData, payment_terms: value})}
                  >
                    <SelectTrigger id="invoice-terms">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net-30">Net 30</SelectItem>
                      <SelectItem value="net-15">Net 15</SelectItem>
                      <SelectItem value="due-on-receipt">Due on Receipt</SelectItem>
                      <SelectItem value="net-60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="invoice-notes">Notes / Description</Label>
                <Textarea
                  id="invoice-notes"
                  placeholder="Additional notes or description for the invoice..."
                  rows={3}
                  value={invoiceFormData.notes}
                  onChange={(e) => setInvoiceFormData({...invoiceFormData, notes: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={handleCreateInvoice}
                  disabled={!invoiceFormData.project_id || !invoiceFormData.amount}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoices List with Tabs */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>All Invoices</CardTitle>
                  <CardDescription>Manage and track all invoices</CardDescription>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by client, invoice #, or project..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all" className="gap-2">
                    All
                    <Badge variant="secondary" className="ml-1">{statusCounts.all}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="gap-2">
                    Draft
                    <Badge variant="secondary" className="ml-1">{statusCounts.draft}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="gap-2">
                    Sent
                    <Badge variant="secondary" className="ml-1">{statusCounts.sent}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="paid" className="gap-2">
                    Paid
                    <Badge variant="secondary" className="ml-1">{statusCounts.paid}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="overdue" className="gap-2">
                    Overdue
                    <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700">{statusCounts.overdue}</Badge>
                  </TabsTrigger>
                </TabsList>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("invoice_number")}
                      >
                        <div className="flex items-center">
                          Invoice #
                          <SortIcon field="invoice_number" />
                        </div>
                      </TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("amount")}
                      >
                        <div className="flex items-center">
                          Amount
                          <SortIcon field="amount" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center">
                          Status
                          <SortIcon field="status" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("due_date")}
                      >
                        <div className="flex items-center">
                          Due Date
                          <SortIcon field="due_date" />
                        </div>
                      </TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          {searchTerm || statusFilter !== "all"
                            ? "No invoices match your search criteria"
                            : "No invoices found. Create your first invoice above."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedInvoices.map(invoice => {
                        const project = projects.find(p => p.id === invoice.project_id)
                        const statusConfig = INVOICE_STATUSES[invoice.status]
                        const dueDateStatus = getDueDateStatus(invoice.due_date, invoice.status)

                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>
                              {project?.event_name || project?.event_title || project?.project_name || "N/A"}
                            </TableCell>
                            <TableCell>{project?.client_name || "N/A"}</TableCell>
                            <TableCell>
                              {project?.client_email ? (
                                <a
                                  href={`mailto:${project.client_email}`}
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Mail className="h-3 w-3" />
                                  {project.client_email}
                                </a>
                              ) : "N/A"}
                            </TableCell>
                            <TableCell>${new Intl.NumberFormat('en-US').format(parseAmount(invoice.amount))}</TableCell>
                            <TableCell>
                              <Badge className={`${statusConfig.color} text-white`}>
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-2 ${
                                dueDateStatus === "overdue" ? "text-red-600 font-medium" :
                                dueDateStatus === "due-soon" ? "text-yellow-600 font-medium" :
                                ""
                              }`}>
                                {dueDateStatus === "overdue" && <AlertTriangle className="h-4 w-4" />}
                                {dueDateStatus === "due-soon" && <Clock className="h-4 w-4" />}
                                {formatEventDate(invoice.due_date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {invoice.payment_date ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Calendar className="h-3 w-3" />
                                  {formatEventDate(invoice.payment_date)}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="View PDF"
                                  onClick={() => setSelectedInvoiceForPDF({id: invoice.id, number: invoice.invoice_number})}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Edit Invoice"
                                  onClick={() => setSelectedInvoiceForEdit(invoice.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {invoice.status === "draft" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Mark as Sent"
                                    onClick={() => handleSendInvoice(invoice.id)}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                )}
                                {(invoice.status === "sent" || invoice.status === "overdue") && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-600 hover:text-green-700"
                                    title="Mark as Paid"
                                    onClick={() => markInvoicePaid(invoice.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete Invoice"
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* PDF Dialog */}
      {selectedInvoiceForPDF && (
        <InvoicePDFDialog
          invoiceId={selectedInvoiceForPDF.id}
          invoiceNumber={selectedInvoiceForPDF.number}
          open={!!selectedInvoiceForPDF}
          onOpenChange={(open) => {
            if (!open) setSelectedInvoiceForPDF(null)
          }}
        />
      )}

      {/* Edit Modal */}
      {selectedInvoiceForEdit && (
        <InvoiceEditorModal
          invoiceId={selectedInvoiceForEdit}
          open={!!selectedInvoiceForEdit}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedInvoiceForEdit(null)
              loadData()
            }
          }}
          onSave={() => {
            loadData()
          }}
        />
      )}
    </div>
  )
}

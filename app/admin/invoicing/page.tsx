"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  DollarSign,
  FileText,
  Send,
  Download,
  Receipt,
  Check,
  X,
  Trash2,
  AlertCircle,
  Edit
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { InvoicePDFDialog } from "@/components/invoice-pdf-viewer"
import { InvoiceEditorModal } from "@/components/invoice-editor-modal"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"

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
  amount: number
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  issue_date: string
  due_date: string
  payment_date?: string
  notes?: string
}

const INVOICE_STATUSES = {
  draft: { label: "Draft", color: "bg-gray-500" },
  sent: { label: "Sent", color: "bg-blue-500" },
  paid: { label: "Paid", color: "bg-green-500" },
  overdue: { label: "Overdue", color: "bg-red-500" },
  cancelled: { label: "Cancelled", color: "bg-gray-400" }
}

export default function InvoicingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState<{id: number, number: string} | null>(null)
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<number | null>(null)
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
      const response = await authPatch(`/api/invoices/${invoiceId}`, { status: newStatus })
      
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
                    invoices.reduce((sum, inv) => sum + inv.amount, 0)
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
                    invoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + inv.amount, 0)
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
                    invoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((sum, inv) => sum + inv.amount, 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoices.filter(i => ["sent", "overdue"].includes(i.status)).length} pending
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
                    invoices.filter(i => i.status === "overdue").reduce((sum, inv) => sum + inv.amount, 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoices.filter(i => i.status === "overdue").length} overdue
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
                  <Label htmlFor="invoice-project">Select Project</Label>
                  <Select 
                    value={invoiceFormData.project_id} 
                    onValueChange={(value) => {
                      setInvoiceFormData({...invoiceFormData, project_id: value})
                      if (invoiceFormData.invoice_type) {
                        handleInvoiceTypeChange(invoiceFormData.invoice_type, value)
                      }
                    }}
                  >
                    <SelectTrigger id="invoice-project">
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects
                        .filter(p => !["completed", "cancelled"].includes(p.status))
                        .map(project => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.event_name || project.event_title || project.project_name} - {project.client_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>Manage and track all invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => {
                    const project = projects.find(p => p.id === invoice.project_id)
                    const statusConfig = INVOICE_STATUSES[invoice.status]
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          {project?.event_name || project?.event_title || project?.project_name || "N/A"}
                        </TableCell>
                        <TableCell>{project?.client_name || "N/A"}</TableCell>
                        <TableCell>${new Intl.NumberFormat('en-US').format(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.color} text-white`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatEventDate(invoice.due_date)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setSelectedInvoiceForPDF({id: invoice.id, number: invoice.invoice_number})}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setSelectedInvoiceForEdit(invoice.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {invoice.status === "draft" && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleSendInvoice(invoice.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {invoice.status === "sent" && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => markInvoicePaid(invoice.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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
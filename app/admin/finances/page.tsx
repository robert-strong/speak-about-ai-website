"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AdminSidebar } from "@/components/admin-sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  DollarSign,
  TrendingUp,
  Edit,
  Save,
  Loader2,
  Download,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Mic,
  Building2,
  Plane
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"

interface FinancialProject {
  id: number
  project_name: string
  client_name: string
  client_email?: string
  company?: string
  event_name?: string
  event_date?: string
  status: string
  speaker_name?: string

  // Financial data
  budget: number
  speaker_fee: number
  travel_buyout: number
  total_to_collect: number  // budget + travel_buyout (what client pays)
  speaker_payout: number    // speaker_fee + travel_buyout (what speaker gets)
  net_commission: number    // budget - speaker_fee (your commission)

  // Client payment tracking
  payment_status: "pending" | "partial" | "paid"
  payment_date?: string
  invoice_number?: string
  purchase_order_number?: string
  payment_terms?: string

  // Speaker payment tracking
  speaker_payment_status: "pending" | "paid"
  speaker_payment_date?: string
}

interface FinancialSummary {
  total_to_collect: number
  amount_collected: number
  amount_pending: number
  total_speaker_payouts: number
  speaker_payouts_paid: number
  speaker_payouts_pending: number
  total_travel_buyouts: number
  net_commission_realized: number
  net_commission_projected: number
  total_projects: number
  projects_paid: number
  projects_pending: number
  speakers_paid: number
  speakers_pending: number
}

export default function FinancesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<FinancialProject[]>([])
  const [summary, setSummary] = useState<FinancialSummary>({
    total_to_collect: 0,
    amount_collected: 0,
    amount_pending: 0,
    total_speaker_payouts: 0,
    speaker_payouts_paid: 0,
    speaker_payouts_pending: 0,
    total_travel_buyouts: 0,
    net_commission_realized: 0,
    net_commission_projected: 0,
    total_projects: 0,
    projects_paid: 0,
    projects_pending: 0,
    speakers_paid: 0,
    speakers_pending: 0
  })

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [speakerPaymentFilter, setSpeakerPaymentFilter] = useState("all")

  // Edit dialog state
  const [editingProject, setEditingProject] = useState<FinancialProject | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    loadFinancialData()
  }, [router])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("adminSessionToken")

      const response = await fetch("/api/admin/finances", {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
        setSummary(data.summary || {})
      } else {
        toast({
          title: "Error",
          description: "Failed to load financial data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading financial data:", error)
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditProject = (project: FinancialProject) => {
    setEditingProject({ ...project })
    setShowEditDialog(true)
  }

  const handleSaveProject = async () => {
    if (!editingProject) return

    try {
      setSaving(true)
      const token = localStorage.getItem("adminSessionToken")

      // Ensure travel_buyout is a proper number
      const travelBuyoutValue = Number(editingProject.travel_buyout) || 0

      console.log('Saving travel_buyout:', {
        original: editingProject.travel_buyout,
        converted: travelBuyoutValue,
        type: typeof travelBuyoutValue
      })

      const response = await fetch("/api/admin/finances", {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          projectId: editingProject.id,
          payment_status: editingProject.payment_status,
          payment_date: editingProject.payment_date,
          speaker_payment_status: editingProject.speaker_payment_status,
          speaker_payment_date: editingProject.speaker_payment_date,
          travel_buyout: travelBuyoutValue,
          invoice_number: editingProject.invoice_number,
          purchase_order_number: editingProject.purchase_order_number
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment info updated successfully",
        })
        setShowEditDialog(false)
        loadFinancialData()
      } else {
        toast({
          title: "Error",
          description: "Failed to update payment info",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Project', 'Client', 'Company', 'Event Date', 'Deal Value', 'Speaker Fee', 'Travel Buyout', 'Net Commission', 'Client Payment', 'Speaker Payment']
    const rows = filteredProjects.map(p => [
      p.project_name,
      p.client_name,
      p.company || '',
      p.event_date ? formatDate(p.event_date) : '',
      p.budget,
      p.speaker_fee,
      p.travel_buyout,
      p.net_commission,
      p.payment_status,
      p.speaker_payment_status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === "" ||
      project.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.company?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPayment = paymentFilter === "all" || project.payment_status === paymentFilter

    const matchesSpeakerPayment = speakerPaymentFilter === "all" ||
      (speakerPaymentFilter === "due" && project.speaker_payment_status !== "paid" && project.speaker_fee > 0) ||
      (speakerPaymentFilter === "paid" && project.speaker_payment_status === "paid")

    return matchesSearch && matchesPayment && matchesSpeakerPayment
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 ml-72 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading financial data...</span>
        </div>
      </div>
    )
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="mt-2 text-gray-600">Track revenue, payments, and speaker payouts</p>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Summary Stats - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total to Collect</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summary.total_to_collect)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.total_projects} projects (deal + travel)
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Collected</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.amount_collected)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.projects_paid} paid
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(summary.amount_pending)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.projects_pending} awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Commission</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(summary.net_commission_projected)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(summary.net_commission_realized)} realized
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Speaker Payouts</CardTitle>
                <Mic className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.total_speaker_payouts)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total owed (fee + travel)
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payouts Due</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(summary.speaker_payouts_pending)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.speakers_pending} speakers to pay
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payouts Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.speaker_payouts_paid)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.speakers_paid} speakers paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Travel Buyouts</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.total_travel_buyouts)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Included in payouts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by project, client, or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Client payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Client Payments</SelectItem>
                    <SelectItem value="paid">Client Paid</SelectItem>
                    <SelectItem value="pending">Client Pending</SelectItem>
                    <SelectItem value="partial">Client Partial</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={speakerPaymentFilter} onValueChange={setSpeakerPaymentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Speaker payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Speaker Payments</SelectItem>
                    <SelectItem value="due">Speaker Due</SelectItem>
                    <SelectItem value="paid">Speaker Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Projects Table */}
          <Card>
            <CardHeader>
              <CardTitle>Project Finances</CardTitle>
              <CardDescription>
                Showing {filteredProjects.length} of {projects.length} projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Speaker</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead className="text-right">Deal Value</TableHead>
                    <TableHead className="text-right">Speaker Fee</TableHead>
                    <TableHead className="text-right">Travel</TableHead>
                    <TableHead className="text-right">Net Commission</TableHead>
                    <TableHead>Client Payment</TableHead>
                    <TableHead>Speaker Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/admin/projects/${project.id}/edit`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {project.project_name}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {project.client_name}
                            {project.company && ` - ${project.company}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.speaker_name ? (
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{project.speaker_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.event_date ? formatDate(project.event_date) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(project.budget)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(project.speaker_fee)}
                      </TableCell>
                      <TableCell className="text-right">
                        {project.travel_buyout > 0 ? formatCurrency(project.travel_buyout) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${project.net_commission >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(project.net_commission)}
                      </TableCell>
                      <TableCell>
                        {project.payment_status === 'paid' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        ) : project.payment_status === 'partial' ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Partial
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {project.payment_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(project.payment_date)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.speaker_fee > 0 ? (
                          project.speaker_payment_status === 'paid' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Due
                            </Badge>
                          )
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                        {project.speaker_payment_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(project.speaker_payment_date)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        No projects match your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Payment Info</DialogTitle>
            <DialogDescription>
              Update payment status for this project
            </DialogDescription>
          </DialogHeader>

          {editingProject && (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{editingProject.project_name}</h4>
                <p className="text-sm text-gray-500">
                  {editingProject.client_name}
                  {editingProject.company && ` - ${editingProject.company}`}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <span>Deal Value: {formatCurrency(editingProject.budget)}</span>
                  <span>Speaker Fee: {formatCurrency(editingProject.speaker_fee)}</span>
                  <span className="text-blue-600">To Collect: {formatCurrency(editingProject.total_to_collect)}</span>
                  <span className="text-green-600">Net Commission: {formatCurrency(editingProject.net_commission)}</span>
                </div>
              </div>

              {/* Travel Buyout */}
              <div>
                <Label htmlFor="travel_buyout">Travel Buyout ($)</Label>
                <Input
                  id="travel_buyout"
                  type="number"
                  step="1"
                  min="0"
                  value={editingProject.travel_buyout > 0 ? editingProject.travel_buyout : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const numValue = value === '' ? 0 : Number(value)
                    setEditingProject({
                      ...editingProject,
                      travel_buyout: numValue
                    })
                  }}
                  placeholder="Enter whole dollar amount (e.g., 1500)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {formatCurrency(editingProject.travel_buyout || 0)}
                </p>
              </div>

              {/* Client Payment */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Client Payment
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_status">Status</Label>
                    <Select
                      value={editingProject.payment_status}
                      onValueChange={(value: any) => setEditingProject({
                        ...editingProject,
                        payment_status: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment_date">Date Paid</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={editingProject.payment_date?.split('T')[0] || ''}
                      onChange={(e) => setEditingProject({
                        ...editingProject,
                        payment_date: e.target.value
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice_number">Invoice #</Label>
                    <Input
                      id="invoice_number"
                      value={editingProject.invoice_number || ''}
                      onChange={(e) => setEditingProject({
                        ...editingProject,
                        invoice_number: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchase_order_number">PO #</Label>
                    <Input
                      id="purchase_order_number"
                      value={editingProject.purchase_order_number || ''}
                      onChange={(e) => setEditingProject({
                        ...editingProject,
                        purchase_order_number: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Speaker Payment */}
              {editingProject.speaker_fee > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Speaker Payment
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="speaker_payment_status">Status</Label>
                      <Select
                        value={editingProject.speaker_payment_status}
                        onValueChange={(value: any) => setEditingProject({
                          ...editingProject,
                          speaker_payment_status: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="speaker_payment_date">Date Paid</Label>
                      <Input
                        id="speaker_payment_date"
                        type="date"
                        value={editingProject.speaker_payment_date?.split('T')[0] || ''}
                        onChange={(e) => setEditingProject({
                          ...editingProject,
                          speaker_payment_date: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProject} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

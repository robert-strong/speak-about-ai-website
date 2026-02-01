"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertCircle, CheckCircle, XCircle, Clock, 
  Eye, Mail, Search, Filter, RefreshCw,
  ChevronLeft, ChevronRight, AlertTriangle,
  Building2, Calendar, Globe, MapPin
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface Vendor {
  id: number
  company_name: string
  slug: string
  contact_name?: string
  contact_email: string
  contact_phone?: string
  website?: string
  description?: string
  location?: string
  category_name?: string
  status: string
  created_at: string
  updated_at: string
  approved_at?: string
  approved_by?: string
}

interface VendorStats {
  pending?: { count: number; oldest: string; newest: string }
  approved?: { count: number; oldest: string; newest: string }
  rejected?: { count: number; oldest: string; newest: string }
  suspended?: { count: number; oldest: string; newest: string }
}

export function VendorStatusManager() {
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<number[]>([])
  const [stats, setStats] = useState<VendorStats>({})
  const [loading, setLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [bulkAction, setBulkAction] = useState("")
  const [reviewNote, setReviewNote] = useState("")
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: false,
    total: 0
  })

  useEffect(() => {
    loadVendors()
  }, [currentStatus, pagination.offset])

  const loadVendors = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/vendors/status?status=${currentStatus}&limit=${pagination.limit}&offset=${pagination.offset}`
      )
      const data = await response.json()
      
      setVendors(data.vendors || [])
      setStats(data.stats || {})
      setPagination(prev => ({
        ...prev,
        total: data.total,
        hasMore: data.pagination?.hasMore || false
      }))
    } catch (error) {
      console.error("Error loading vendors:", error)
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVendors(vendors.map(v => v.id))
    } else {
      setSelectedVendors([])
    }
  }

  const handleSelectVendor = (vendorId: number, checked: boolean) => {
    if (checked) {
      setSelectedVendors(prev => [...prev, vendorId])
    } else {
      setSelectedVendors(prev => prev.filter(id => id !== vendorId))
    }
  }

  const handleBulkAction = async () => {
    if (selectedVendors.length === 0) {
      toast({
        title: "No vendors selected",
        description: "Please select at least one vendor",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch("/api/vendors/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vendorIds: selectedVendors,
          status: bulkAction,
          reviewNote,
          reviewerEmail: "admin@speakaboutai.com"
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${selectedVendors.length} vendor(s) updated to ${bulkAction}`,
        })
        setShowBulkDialog(false)
        setSelectedVendors([])
        setBulkAction("")
        setReviewNote("")
        loadVendors()
      } else {
        throw new Error("Failed to update vendors")
      }
    } catch (error) {
      console.error("Error updating vendors:", error)
      toast({
        title: "Error",
        description: "Failed to update vendor statuses",
        variant: "destructive"
      })
    }
  }

  const handleQuickAction = async (vendorId: number, action: string) => {
    try {
      const vendor = vendors.find(v => v.id === vendorId)
      const response = await fetch("/api/vendors/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vendorId,
          action,
          data: {
            company_name: vendor?.company_name,
            reviewer: "admin@speakaboutai.com"
          }
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Vendor ${action.replace('quick_', '')}ed successfully`,
        })
        loadVendors()
      } else {
        throw new Error("Failed to process action")
      }
    } catch (error) {
      console.error("Error processing action:", error)
      toast({
        title: "Error",
        description: "Failed to process action",
        variant: "destructive"
      })
    }
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "success"
      case "pending": return "warning"
      case "rejected": return "destructive"
      case "suspended": return "secondary"
      default: return "default"
    }
  }

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return format(new Date(date), "MMM d, yyyy")
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-900">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats.pending?.count || 0}
                </p>
                {stats.pending?.oldest && (
                  <p className="text-xs text-yellow-700 mt-1">
                    Oldest: {getTimeAgo(stats.pending.oldest)}
                  </p>
                )}
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Approved</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.approved?.count || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-900">Rejected</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.rejected?.count || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.suspended?.count || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendor Status Management</CardTitle>
              <CardDescription>
                Review and manage vendor application statuses
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadVendors}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {selectedVendors.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setShowBulkDialog(true)}
                >
                  Bulk Action ({selectedVendors.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStatus} onValueChange={setCurrentStatus}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending ({stats.pending?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({stats.approved?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({stats.rejected?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="suspended">
                  Suspended ({stats.suspended?.count || 0})
                </TabsTrigger>
              </TabsList>

              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-left">
                      <Checkbox
                        checked={selectedVendors.length === vendors.length && vendors.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      Company
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      Contact
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      Category
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      Submitted
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      Status
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedVendors.includes(vendor.id)}
                          onCheckedChange={(checked) => 
                            handleSelectVendor(vendor.id, checked as boolean)
                          }
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {vendor.company_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {vendor.website && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Globe className="h-3 w-3 mr-1" />
                                {vendor.website}
                              </div>
                            )}
                            {vendor.location && (
                              <div className="flex items-center text-xs text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                {vendor.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <p className="text-gray-900">{vendor.contact_name}</p>
                          <p className="text-gray-500">{vendor.contact_email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-600">
                          {vendor.category_name || "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600">
                          {getTimeAgo(vendor.created_at)}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={getStatusColor(vendor.status) as any}>
                          {vendor.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVendor(vendor)
                              setShowDetailDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {vendor.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleQuickAction(vendor.id, "quick_approve")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleQuickAction(vendor.id, "quick_reject")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredVendors.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No vendors found</p>
                </div>
              )}
            </div>

            {pagination.hasMore && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                    disabled={pagination.offset === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                    disabled={!pagination.hasMore}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Status Update</DialogTitle>
            <DialogDescription>
              Update status for {selectedVendors.length} selected vendor(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                  <SelectItem value="suspended">Suspend</SelectItem>
                  <SelectItem value="pending">Set to Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Review Note (Optional)</label>
              <Textarea
                placeholder="Add a note about this bulk action..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
              />
            </div>

            {bulkAction === "rejected" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-900">
                    <p className="font-medium">Warning</p>
                    <p>Rejected vendors will need to reapply to be considered again.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAction} disabled={!bulkAction}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>
              Review complete vendor information
            </DialogDescription>
          </DialogHeader>

          {selectedVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Company</p>
                  <p className="text-sm">{selectedVendor.company_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-sm">{selectedVendor.category_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p className="text-sm">{selectedVendor.contact_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{selectedVendor.contact_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm">{selectedVendor.contact_phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Website</p>
                  <p className="text-sm">{selectedVendor.website || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-sm">{selectedVendor.location || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant={getStatusColor(selectedVendor.status) as any}>
                    {selectedVendor.status}
                  </Badge>
                </div>
              </div>

              {selectedVendor.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                  <p className="text-sm text-gray-700">{selectedVendor.description}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">
                  Submitted: {format(new Date(selectedVendor.created_at), "PPpp")}
                </p>
                {selectedVendor.approved_at && (
                  <p className="text-sm text-gray-500">
                    Approved: {format(new Date(selectedVendor.approved_at), "PPpp")} by {selectedVendor.approved_by}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
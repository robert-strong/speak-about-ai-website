"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Check,
  X,
  Eye,
  Clock,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  AlertCircle,
  MessageSquare,
  Send,
  Users
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface WhatsAppApplication {
  id: number
  email: string
  full_name: string
  linkedin_url: string
  phone_number: string
  primary_role: string
  other_role?: string
  value_expectations?: string[]
  agree_to_rules: boolean
  status: 'pending' | 'approved' | 'rejected' | 'invited'
  admin_notes?: string
  rejection_reason?: string
  whatsapp_invite_sent_at?: string
  whatsapp_joined_at?: string
  whatsapp_invite_link?: string
  created_at: string
  updated_at: string
  reviewed_at?: string
  reviewed_by?: string
  submission_ip?: string
  user_agent?: string
}

export default function WhatsAppApplicationsPage() {
  const [applications, setApplications] = useState<WhatsAppApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<WhatsAppApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<WhatsAppApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, activeTab])

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/whatsapp-applications", {
        headers: {
          'x-admin-request': 'true'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter(a => a.status === activeTab)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.primary_role.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredApplications(filtered)
  }

  const handleAction = async (action: 'approve' | 'reject' | 'invite') => {
    if (!selectedApplication) return

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/whatsapp-applications/${selectedApplication.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'x-admin-request': 'true'
        },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes,
          rejection_reason: action === 'reject' ? rejectionReason : undefined,
          whatsapp_invite_link: action === 'invite' ? inviteLink : undefined
        })
      })

      if (response.ok) {
        await fetchApplications()
        setShowReviewDialog(false)
        setSelectedApplication(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error updating application:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setAdminNotes("")
    setRejectionReason("")
    setInviteLink("")
  }

  const openApplicationDetails = (application: WhatsAppApplication) => {
    setSelectedApplication(application)
    setAdminNotes(application.admin_notes || "")
    setRejectionReason(application.rejection_reason || "")
    setInviteLink(application.whatsapp_invite_link || "")
    setShowReviewDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>
      case "rejected":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>
      case "invited":
        return <Badge className="bg-blue-100 text-blue-800"><Send className="h-3 w-3 mr-1" />Invited</Badge>
      default:
        return null
    }
  }

  const getApplicationCounts = () => {
    const pending = applications.filter(a => a.status === "pending").length
    const approved = applications.filter(a => a.status === "approved").length
    const rejected = applications.filter(a => a.status === "rejected").length
    const invited = applications.filter(a => a.status === "invited").length
    return { pending, approved, rejected, invited, total: applications.length }
  }

  const counts = getApplicationCounts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Group Applications</h1>
        <p className="text-gray-600">Review and approve event professional networking group applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{counts.total}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-700">{counts.pending}</div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-2xl font-bold text-green-700">{counts.approved}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="text-2xl font-bold text-blue-700">{counts.invited}</div>
          <div className="text-sm text-gray-600">Invited</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-2xl font-bold text-red-700">{counts.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs and Application List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="invited">
            Invited ({counts.invited})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({counts.rejected})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({counts.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Loading applications...</p>
            </Card>
          ) : filteredApplications.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No applications found</p>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <Card key={application.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-green-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{application.full_name}</h3>
                      </div>

                      <p className="text-sm text-gray-600 mb-1">{application.primary_role}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {application.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {application.phone_number}
                        </span>
                      </div>

                      {application.value_expectations && application.value_expectations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {application.value_expectations.slice(0, 3).map((expectation, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {expectation}
                            </Badge>
                          ))}
                          {application.value_expectations.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{application.value_expectations.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Applied: {new Date(application.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(application.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openApplicationDetails(application)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Application Details Dialog */}
      {selectedApplication && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Review: {selectedApplication.full_name}</DialogTitle>
              <DialogDescription>
                Review WhatsApp group application and make decision
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-xl font-semibold">{selectedApplication.full_name}</h3>
                <p className="text-gray-600">{selectedApplication.primary_role}</p>
                {selectedApplication.other_role && (
                  <p className="text-sm text-gray-500">Other role: {selectedApplication.other_role}</p>
                )}

                <div className="flex flex-col gap-2 mt-3">
                  <a href={`mailto:${selectedApplication.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedApplication.email}
                  </a>
                  <a href={`tel:${selectedApplication.phone_number}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedApplication.phone_number}
                  </a>
                  <a href={selectedApplication.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Linkedin className="h-3 w-3" />
                    LinkedIn Profile
                  </a>
                </div>
              </div>

              {/* Value Expectations */}
              {selectedApplication.value_expectations && selectedApplication.value_expectations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    What They Expect from the Group
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.value_expectations.map((expectation, index) => (
                      <Badge key={index} variant="secondary">
                        {expectation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Agreed to Rules */}
              <div>
                <h4 className="font-semibold mb-2">Community Rules Agreement</h4>
                <p className="text-sm">
                  {selectedApplication.agree_to_rules ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Agreed to community rules
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <X className="h-4 w-4" />
                      Did not agree to rules
                    </span>
                  )}
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin-notes">Admin Notes (Private)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any internal notes about this application..."
                  rows={3}
                />
              </div>

              {/* Status-specific sections */}
              {selectedApplication.status === "pending" && (
                <div>
                  <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows={2}
                  />
                </div>
              )}

              {(selectedApplication.status === "approved" || selectedApplication.status === "invited") && (
                <div>
                  <Label htmlFor="invite-link">WhatsApp Invite Link</Label>
                  <Input
                    id="invite-link"
                    value={inviteLink}
                    onChange={(e) => setInviteLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                  />
                  {selectedApplication.whatsapp_invite_sent_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Invite sent: {new Date(selectedApplication.whatsapp_invite_sent_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Previous Decision Info */}
              {selectedApplication.status !== "pending" && (
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-1">Current Status</p>
                  <div className="space-y-1 text-gray-600">
                    <p>Status: {getStatusBadge(selectedApplication.status)}</p>
                    {selectedApplication.reviewed_by && (
                      <p>Reviewed by: {selectedApplication.reviewed_by}</p>
                    )}
                    {selectedApplication.reviewed_at && (
                      <p>Date: {new Date(selectedApplication.reviewed_at).toLocaleString()}</p>
                    )}
                    {selectedApplication.rejection_reason && (
                      <p>Rejection reason: {selectedApplication.rejection_reason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewDialog(false)
                  resetForm()
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              {selectedApplication.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction('reject')}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={isProcessing}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </>
              )}
              {(selectedApplication.status === "approved" || selectedApplication.status === "invited") && (
                <Button
                  onClick={() => handleAction('invite')}
                  disabled={isProcessing || !inviteLink}
                >
                  <Send className="h-4 w-4 mr-1" />
                  {selectedApplication.status === "invited" ? "Resend Invite" : "Send Invite"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  Video,
  Users,
  DollarSign,
  Plane,
  Loader2,
  Linkedin,
  Star
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin-sidebar"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"

interface SpeakerApplication {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  website?: string
  linkedin_url?: string
  location: string
  title: string
  company: string
  bio: string
  expertise_areas: string[]
  speaking_topics: string
  years_speaking?: number
  previous_engagements?: string
  video_links: string[]
  reference_contacts?: string
  speaking_fee_range?: string
  travel_requirements?: string
  available_formats: string[]
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'invited'
  admin_notes?: string
  rejection_reason?: string
  invitation_sent_at?: string
  invitation_expires_at?: string
  account_created_at?: string
  created_at: string
  updated_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [application, setApplication] = useState<SpeakerApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    loadApplication()
  }, [params.id, router])

  const loadApplication = async () => {
    try {
      setLoading(true)
      const response = await authGet(`/api/speaker-applications/${params.id}`)

      if (response.ok) {
        const data = await response.json()
        setApplication(data)
        setAdminNotes(data.admin_notes || "")
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to load application",
          variant: "destructive",
        })
        router.push("/admin/speakers")
      }
    } catch (error) {
      console.error("Error loading application:", error)
      toast({
        title: "Error",
        description: "Failed to load application",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'approve' | 'reject' | 'invite' | 'update_notes') => {
    setProcessingAction(true)
    try {
      const response = await authPatch(`/api/speaker-applications/${params.id}`, {
          action,
          admin_notes: adminNotes,
          rejection_reason: action === 'reject' ? rejectionReason : undefined
        })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message || `Application ${action} successfully`,
        })
        loadApplication()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || `Failed to ${action} application`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error processing application:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} application`,
        variant: "destructive",
      })
    } finally {
      setProcessingAction(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending Review', variant: 'secondary' as const, icon: Clock },
      under_review: { label: 'Under Review', variant: 'outline' as const, icon: FileText },
      approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
      invited: { label: 'Invited', variant: 'default' as const, icon: Send },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="text-sm px-3 py-1">
        <Icon className="mr-1 h-4 w-4" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading application...</span>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Application not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/speakers">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Speakers
              </Button>
            </Link>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {application.first_name} {application.last_name}
                </h1>
                <p className="mt-2 text-gray-600">
                  {application.title} at {application.company}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(application.status)}
                <div className="text-sm text-gray-500">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Applied {new Date(application.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          {application.status !== 'pending' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Application Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Applied on {formatDate(application.created_at)}</span>
                  </div>
                  {application.reviewed_at && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>Reviewed on {formatDate(application.reviewed_at)} by {application.reviewed_by}</span>
                    </div>
                  )}
                  {application.invitation_sent_at && (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-blue-500" />
                      <span>Invitation sent on {formatDate(application.invitation_sent_at)}</span>
                    </div>
                  )}
                  {application.invitation_expires_at && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Invitation expires on {formatDate(application.invitation_expires_at)}</span>
                    </div>
                  )}
                  {application.account_created_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Account created on {formatDate(application.account_created_at)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${application.email}`} className="text-blue-600 hover:underline">
                      {application.email}
                    </a>
                  </div>
                  {application.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{application.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{application.location}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {application.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a href={application.website} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                        {application.website}
                      </a>
                    </div>
                  )}
                  {application.linkedin_url && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-gray-400" />
                      <a href={application.linkedin_url} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Background */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Professional Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-500">Bio</Label>
                <p className="mt-2 whitespace-pre-wrap">{application.bio}</p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-gray-500">Speaking Topics</Label>
                <p className="mt-2">{application.speaking_topics}</p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-gray-500">Areas of Expertise</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {application.expertise_areas.map((area, idx) => (
                    <Badge key={idx} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Speaking Experience */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Speaking Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {application.years_speaking && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Years of Experience</Label>
                  <p className="mt-2">{application.years_speaking} years</p>
                </div>
              )}

              {application.previous_engagements && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Previous Engagements</Label>
                    <p className="mt-2 whitespace-pre-wrap">{application.previous_engagements}</p>
                  </div>
                </>
              )}

              {application.video_links.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Speaking Videos</Label>
                    <div className="mt-2 space-y-2">
                      {application.video_links.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-gray-400" />
                          <a href={link} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                            {link}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {application.reference_contacts && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">References</Label>
                    <p className="mt-2 whitespace-pre-wrap">{application.reference_contacts}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Logistics & Availability */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Logistics & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Speaking Fee Range</Label>
                  <p className="mt-2">{application.speaking_fee_range || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Available Formats</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {application.available_formats.map((format, idx) => (
                      <Badge key={idx} variant="outline">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {application.travel_requirements && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Travel Requirements</Label>
                    <p className="mt-2">{application.travel_requirements}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Admin Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this application..."
                  rows={4}
                  className="mt-2"
                />
                <Button
                  onClick={() => handleAction('update_notes')}
                  disabled={processingAction}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Save Notes
                </Button>
              </div>

              {application.status === 'pending' && (
                <>
                  <Separator />
                  <div>
                    <Label htmlFor="rejection_reason">Rejection Reason (if rejecting)</Label>
                    <Textarea
                      id="rejection_reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAction('approve')}
                      disabled={processingAction}
                    >
                      {processingAction ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Application
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAction('reject')}
                      disabled={processingAction}
                      variant="destructive"
                    >
                      {processingAction ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject Application
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {application.status === 'approved' && !application.invitation_sent_at && (
                <>
                  <Separator />
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Application Approved</AlertTitle>
                    <AlertDescription>
                      This application has been approved. You can now send an invitation for the speaker to create their account.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={() => handleAction('invite')}
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Invitation Email
                      </>
                    )}
                  </Button>
                </>
              )}

              {application.status === 'invited' && (
                <Alert>
                  <Send className="h-4 w-4" />
                  <AlertTitle>Invitation Sent</AlertTitle>
                  <AlertDescription>
                    An invitation was sent on {application.invitation_sent_at && formatDate(application.invitation_sent_at)}.
                    {application.invitation_expires_at && (
                      <span> The invitation expires on {formatDate(application.invitation_expires_at)}.</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {application.status === 'rejected' && application.rejection_reason && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Application Rejected</AlertTitle>
                  <AlertDescription>
                    Reason: {application.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
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
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Users,
  Loader2,
  Linkedin,
  Star,
  Award,
  Package,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin-sidebar"

interface VendorApplication {
  id: number
  email: string
  company_name: string
  primary_contact_name: string
  primary_contact_role: string
  primary_contact_linkedin?: string
  business_email: string
  business_phone: string
  company_website: string
  years_in_business: string
  business_description: string
  primary_category: string
  secondary_services: string[]
  specialty_capabilities?: string
  event_types: string[]
  average_event_size?: string
  headquarters_location: string
  service_areas: string[]
  specific_regions: string
  travel_fees_applicable: boolean
  travel_fee_policy?: string
  budget_minimum: number
  budget_maximum: number
  pricing_structure: string[]
  payment_terms?: string
  portfolio_link: string
  awards_recognition?: string
  review_links?: string
  typical_lead_time?: string
  works_with_vendors: boolean
  preferred_partners?: string
  languages: string[]
  accessibility_accommodations?: string
  pricing_range?: string
  team_size?: string
  why_join?: string
  certifications?: string
  testimonials?: string
  logo_url?: string
  application_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'needs_info'
  review_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  submission_ip?: string
  user_agent?: string
}

export default function VendorApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [application, setApplication] = useState<VendorApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
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
      const response = await fetch(`/api/vendors/applications/${params.id}`, {
        headers: {
          'x-admin-request': 'true'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
        setReviewNotes(data.application.review_notes || "")
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to load application",
          variant: "destructive",
        })
        router.push("/admin/directory")
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

  const handleAction = async (status: 'approved' | 'rejected' | 'under_review' | 'needs_info') => {
    if (status === 'approved') {
      if (!confirm(`Are you sure you want to approve ${application?.company_name}? This will create a vendor account.`)) {
        return
      }
    } else if (status === 'rejected') {
      if (!rejectionReason.trim()) {
        toast({
          title: "Rejection reason required",
          description: "Please provide a reason for rejection",
          variant: "destructive",
        })
        return
      }
      if (!confirm(`Are you sure you want to reject ${application?.company_name}?`)) {
        return
      }
    }

    setProcessingAction(true)
    try {
      const response = await fetch('/api/vendors/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify({
          id: params.id,
          status,
          notes: status === 'rejected' ? rejectionReason : reviewNotes,
          reviewerEmail: 'admin@speakaboutai.com'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: status === 'approved'
            ? `${application?.company_name} approved and converted to vendor!`
            : `Application ${status} successfully`,
        })

        // Redirect to directory after approval/rejection
        if (status === 'approved' || status === 'rejected') {
          setTimeout(() => {
            router.push('/admin/directory?tab=applications')
          }, 1500)
        } else {
          loadApplication()
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || `Failed to ${status} application`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error processing application:`, error)
      toast({
        title: "Error",
        description: `Failed to ${status} application`,
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
      needs_info: { label: 'Needs Info', variant: 'warning' as const, icon: AlertCircle },
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
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Application not found</AlertTitle>
          <AlertDescription>
            The vendor application you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/directory?tab=applications">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {application.logo_url ? (
                <img
                  src={application.logo_url}
                  alt={application.company_name}
                  className="h-20 w-20 rounded-lg object-contain border-2 border-gray-200"
                />
              ) : (
                <div className="h-20 w-20 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{application.company_name}</h1>
                <p className="text-gray-600 mt-1">{application.primary_category}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(application.application_status)}
                  <Badge variant="outline">
                    <Calendar className="mr-1 h-3 w-3" />
                    Applied {formatDate(application.created_at)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Business Description</h4>
                  <p className="text-gray-900">{application.business_description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Years in Business</h4>
                    <p className="text-gray-900">{application.years_in_business}</p>
                  </div>
                  {application.team_size && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Team Size</h4>
                      <p className="text-gray-900">{application.team_size}</p>
                    </div>
                  )}
                </div>

                {application.why_join && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Why They Want to Join</h4>
                      <p className="text-gray-900">{application.why_join}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Services & Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Services & Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.secondary_services && application.secondary_services.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Services Offered</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.secondary_services.map((service, idx) => (
                        <Badge key={idx} variant="secondary">{service}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {application.specialty_capabilities && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Specialty Capabilities</h4>
                    <p className="text-gray-900">{application.specialty_capabilities}</p>
                  </div>
                )}

                {application.event_types && application.event_types.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Event Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.event_types.map((type, idx) => (
                        <Badge key={idx} variant="outline">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {application.average_event_size && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Average Event Size</h4>
                    <p className="text-gray-900">{application.average_event_size}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing & Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Budget Range</h4>
                  <p className="text-gray-900 text-lg font-semibold">
                    ${application.budget_minimum?.toLocaleString()} - ${application.budget_maximum?.toLocaleString()}
                  </p>
                </div>

                {application.pricing_structure && application.pricing_structure.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Pricing Structure</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.pricing_structure.map((structure, idx) => (
                        <Badge key={idx} variant="secondary">{structure}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {application.payment_terms && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Payment Terms</h4>
                    <p className="text-gray-900">{application.payment_terms}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Travel Fees</h4>
                  <p className="text-gray-900">
                    {application.travel_fees_applicable ? 'Yes' : 'No'}
                    {application.travel_fee_policy && ` - ${application.travel_fee_policy}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Location & Service Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Service Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Headquarters</h4>
                  <p className="text-gray-900">{application.headquarters_location}</p>
                </div>

                {application.service_areas && application.service_areas.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Service Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.service_areas.map((area, idx) => (
                        <Badge key={idx} variant="outline">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Specific Regions</h4>
                  <p className="text-gray-900">{application.specific_regions}</p>
                </div>

                {application.languages && application.languages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.languages.map((lang, idx) => (
                        <Badge key={idx} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Credentials & Recognition */}
            {(application.awards_recognition || application.certifications || application.testimonials) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Credentials & Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application.awards_recognition && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Awards & Recognition</h4>
                      <p className="text-gray-900 whitespace-pre-wrap">{application.awards_recognition}</p>
                    </div>
                  )}

                  {application.certifications && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Certifications</h4>
                      <p className="text-gray-900 whitespace-pre-wrap">{application.certifications}</p>
                    </div>
                  )}

                  {application.testimonials && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">Testimonials</h4>
                      <p className="text-gray-900 whitespace-pre-wrap italic">"{application.testimonials}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{application.primary_contact_name}</p>
                    <p className="text-sm text-gray-600">{application.primary_contact_role}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <a href={`mailto:${application.business_email}`} className="text-sm text-blue-600 hover:underline">
                    {application.business_email}
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <a href={`tel:${application.business_phone}`} className="text-sm text-blue-600 hover:underline">
                    {application.business_phone}
                  </a>
                </div>

                {application.company_website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a href={application.company_website.startsWith('http') ? application.company_website : `https://${application.company_website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Website
                    </a>
                  </div>
                )}

                {application.primary_contact_linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-gray-500" />
                    <a href={application.primary_contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      LinkedIn Profile
                    </a>
                  </div>
                )}

                {application.portfolio_link && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <a href={application.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Portfolio
                    </a>
                  </div>
                )}

                {application.review_links && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-500" />
                    <a href={application.review_links} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Reviews
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Review Notes */}
                <div>
                  <Label htmlFor="reviewNotes">Review Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add internal notes about this application..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                {application.application_status === 'pending' || application.application_status === 'under_review' ? (
                  <>
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleAction('approved')}
                        disabled={processingAction}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {processingAction ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve & Create Vendor
                      </Button>

                      <Button
                        onClick={() => handleAction('under_review')}
                        disabled={processingAction}
                        variant="outline"
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Mark Under Review
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="rejectionReason">Rejection Reason</Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Required for rejection..."
                        rows={3}
                        className="mt-1"
                      />
                      <Button
                        onClick={() => handleAction('rejected')}
                        disabled={processingAction || !rejectionReason.trim()}
                        variant="destructive"
                        className="w-full mt-2"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>

                    <Button
                      onClick={() => handleAction('needs_info')}
                      disabled={processingAction}
                      variant="outline"
                      className="w-full"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request More Info
                    </Button>
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Application {application.application_status}</AlertTitle>
                    <AlertDescription>
                      {application.application_status === 'approved' && 'This application has been approved and converted to a vendor.'}
                      {application.application_status === 'rejected' && 'This application has been rejected.'}
                      {application.application_status === 'needs_info' && 'Waiting for additional information from applicant.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Review History */}
                {application.reviewed_at && (
                  <div className="text-sm text-gray-600 pt-2 border-t">
                    <p>Reviewed by: {application.reviewed_by}</p>
                    <p>On: {formatDate(application.reviewed_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            {(application.typical_lead_time || application.works_with_vendors || application.preferred_partners || application.accessibility_accommodations) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {application.typical_lead_time && (
                    <div>
                      <p className="font-semibold text-gray-600">Typical Lead Time</p>
                      <p>{application.typical_lead_time}</p>
                    </div>
                  )}

                  {application.works_with_vendors && (
                    <div>
                      <p className="font-semibold text-gray-600">Works with Other Vendors</p>
                      <p>Yes{application.preferred_partners && ` - ${application.preferred_partners}`}</p>
                    </div>
                  )}

                  {application.accessibility_accommodations && (
                    <div>
                      <p className="font-semibold text-gray-600">Accessibility Accommodations</p>
                      <p>{application.accessibility_accommodations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Submission Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p><strong>Submitted:</strong> {formatDate(application.created_at)}</p>
                <p><strong>Last Updated:</strong> {formatDate(application.updated_at)}</p>
                {application.submission_ip && (
                  <p><strong>IP Address:</strong> {application.submission_ip}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

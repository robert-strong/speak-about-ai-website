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
  Star,
  DollarSign,
  Mail,
  Phone,
  Globe,
  MapPin,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  AlertCircle,
  Award,
  GraduationCap,
  FileText,
  Video,
  Users,
  TrendingUp
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { authGet } from "@/lib/auth-fetch"

interface Speaker {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  website?: string
  linkedin_url?: string
  location?: string
  timezone?: string
  headshot_url?: string
  title?: string
  company?: string
  bio?: string
  short_bio?: string
  achievements?: string
  education?: string
  certifications?: string
  expertise_areas?: string[]
  speaking_topics?: string
  signature_talks?: string
  industries_experience?: string[]
  case_studies?: string
  years_speaking?: number
  total_engagements?: string
  previous_engagements?: string
  client_testimonials?: string
  video_links?: string[]
  media_coverage?: string
  twitter_url?: string
  youtube_url?: string
  instagram_url?: string
  blog_url?: string
  published_content?: string
  podcast_appearances?: string
  reference_contacts?: string
  past_client_references?: string
  speaker_bureau_experience?: string
  speaking_fee_range?: string
  travel_requirements?: string
  available_formats?: string[]
  booking_lead_time?: string
  availability_constraints?: string
  technical_requirements?: string
  speaking_experience?: string
  notable_organizations?: string
  ai_expertise?: string
  unique_perspective?: string
  audience_size_preference?: string
  why_speak_about_ai?: string
  additional_info?: string
  agree_to_terms?: boolean
  status?: 'pending' | 'approved' | 'rejected' | 'suspended'
  approval_notes?: string
  approved_by?: string
  approved_at?: string
  internal_rating?: number
  internal_notes?: string
  preferred_partner?: boolean
  created_at: string
  updated_at: string
}

export default function SpeakerApplicationsPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([])
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [internalRating, setInternalRating] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchSpeakers()
  }, [])

  useEffect(() => {
    filterSpeakers()
  }, [speakers, searchTerm, activeTab])

  const fetchSpeakers = async () => {
    try {
      const response = await authGet("/api/speaker-applications")
      if (response.ok) {
        const data = await response.json()
        setSpeakers(data.applications || data)
      }
    } catch (error) {
      console.error("Error fetching speakers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterSpeakers = () => {
    let filtered = speakers

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter(s => s.status === activeTab)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.expertise_areas?.some(topic =>
          topic.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    setFilteredSpeakers(filtered)
  }

  const handleApproval = async (approved: boolean) => {
    if (!selectedSpeaker) return
    
    setIsProcessing(true)
    
    try {
      const response = await fetch(`/api/speakers/${selectedSpeaker.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: approved ? "approved" : "rejected",
          approval_notes: approvalNotes,
          internal_notes: internalNotes,
          internal_rating: internalRating || undefined
        })
      })

      if (response.ok) {
        // Update local state
        const updatedSpeakers = speakers.map(s => 
          s.id === selectedSpeaker.id 
            ? { 
                ...s, 
                status: approved ? "approved" : "rejected", 
                approval_notes: approvalNotes,
                internal_notes: internalNotes,
                internal_rating: internalRating || s.internal_rating,
                approved_by: "Admin",
                approved_at: new Date().toISOString()
              } 
            : s
        )
        setSpeakers(updatedSpeakers)
        setShowApprovalDialog(false)
        setSelectedSpeaker(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error updating speaker status:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setApprovalNotes("")
    setInternalNotes("")
    setInternalRating(0)
  }

  const openSpeakerDetails = (speaker: Speaker) => {
    setSelectedSpeaker(speaker)
    setInternalNotes(speaker.internal_notes || "")
    setInternalRating(speaker.internal_rating || 0)
    setShowApprovalDialog(true)
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>
      case "rejected":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>
      case "suspended":
        return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="h-3 w-3 mr-1" />Suspended</Badge>
      default:
        return null
    }
  }

  const getSpeakerCounts = () => {
    const pending = speakers.filter(s => s.status === "pending").length
    const approved = speakers.filter(s => s.status === "approved").length
    const rejected = speakers.filter(s => s.status === "rejected").length
    const suspended = speakers.filter(s => s.status === "suspended").length
    return { pending, approved, rejected, suspended, total: speakers.length }
  }

  const counts = getSpeakerCounts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Speaker Applications</h1>
        <p className="text-gray-600">Review and approve speaker applications</p>
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
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-2xl font-bold text-red-700">{counts.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="text-2xl font-bold text-orange-700">{counts.suspended}</div>
          <div className="text-sm text-gray-600">Suspended</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, company, or topic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs and Speaker List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({counts.rejected})
          </TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended ({counts.suspended})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({counts.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Loading speakers...</p>
            </Card>
          ) : filteredSpeakers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No speaker applications found</p>
            </Card>
          ) : (
            filteredSpeakers.map((speaker) => (
              <Card key={speaker.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {speaker.headshot_url ? (
                      <img
                        src={speaker.headshot_url}
                        alt={`${speaker.first_name} ${speaker.last_name}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-gray-500">
                          {speaker.first_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{speaker.first_name} {speaker.last_name}</h3>
                        {speaker.preferred_partner && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Star className="h-3 w-3 mr-1" />Preferred
                          </Badge>
                        )}
                        {speaker.internal_rating && speaker.internal_rating > 0 && (
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < speaker.internal_rating! 
                                    ? "text-yellow-500 fill-current" 
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {speaker.title && speaker.company && (
                        <p className="text-sm text-gray-600 mb-1">
                          {speaker.title} at {speaker.company}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {speaker.email}
                        </span>
                        {speaker.speaking_fee_range && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {speaker.speaking_fee_range}
                          </span>
                        )}
                        {speaker.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {speaker.location}
                          </span>
                        )}
                      </div>

                      {speaker.expertise_areas && speaker.expertise_areas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {speaker.expertise_areas.slice(0, 3).map((topic, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {speaker.expertise_areas.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{speaker.expertise_areas.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {speaker.short_bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">{speaker.short_bio}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Applied: {new Date(speaker.created_at).toLocaleDateString()}</span>
                        {speaker.years_speaking && (
                          <span>{speaker.years_speaking} years experience</span>
                        )}
                        {speaker.total_engagements && (
                          <span>{speaker.total_engagements} engagements</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(speaker.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSpeakerDetails(speaker)}
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

      {/* Speaker Details Dialog */}
      {selectedSpeaker && (
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Speaker Review: {selectedSpeaker.first_name} {selectedSpeaker.last_name}</DialogTitle>
              <DialogDescription>
                Review speaker application and make approval decision
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                {selectedSpeaker.headshot_url ? (
                  <img
                    src={selectedSpeaker.headshot_url}
                    alt={`${selectedSpeaker.first_name} ${selectedSpeaker.last_name}`}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-3xl font-semibold text-gray-500">
                      {selectedSpeaker.first_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedSpeaker.first_name} {selectedSpeaker.last_name}</h3>
                  {selectedSpeaker.title && selectedSpeaker.company && (
                    <p className="text-gray-600">{selectedSpeaker.title} at {selectedSpeaker.company}</p>
                  )}
                  {selectedSpeaker.location && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedSpeaker.location}
                      {selectedSpeaker.timezone && ` (${selectedSpeaker.timezone})`}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <a href={`mailto:${selectedSpeaker.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedSpeaker.email}
                    </a>
                    {selectedSpeaker.phone && (
                      <a href={`tel:${selectedSpeaker.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedSpeaker.phone}
                      </a>
                    )}
                    {selectedSpeaker.website && (
                      <a href={selectedSpeaker.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Website
                      </a>
                    )}
                  </div>

                  {/* Social Media */}
                  <div className="flex items-center gap-3 mt-2">
                    {selectedSpeaker.linkedin_url && (
                      <a href={selectedSpeaker.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {selectedSpeaker.twitter_url && (
                      <a href={selectedSpeaker.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400">
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {selectedSpeaker.instagram_url && (
                      <a href={selectedSpeaker.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600">
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {selectedSpeaker.youtube_url && (
                      <a href={selectedSpeaker.youtube_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-600">
                        <Youtube className="h-4 w-4" />
                      </a>
                    )}
                    {selectedSpeaker.blog_url && (
                      <a href={selectedSpeaker.blog_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">
                        <FileText className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Why Speak About AI - CRITICAL FOR DECISION */}
              {selectedSpeaker.why_speak_about_ai && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Why They Want to Speak About AI
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedSpeaker.why_speak_about_ai}</p>
                </div>
              )}

              {/* AI Expertise & Unique Perspective */}
              <div className="grid grid-cols-2 gap-4">
                {selectedSpeaker.ai_expertise && (
                  <div>
                    <h4 className="font-semibold mb-2">AI Expertise</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.ai_expertise}</p>
                  </div>
                )}
                {selectedSpeaker.unique_perspective && (
                  <div>
                    <h4 className="font-semibold mb-2">Unique Perspective</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.unique_perspective}</p>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <h4 className="font-semibold mb-2">Biography</h4>
                {selectedSpeaker.short_bio && (
                  <div className="mb-2 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-500 mb-1">Short Bio:</p>
                    <p className="text-sm text-gray-700">{selectedSpeaker.short_bio}</p>
                  </div>
                )}
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.bio}</p>
              </div>

              {/* Speaking Topics & Expertise */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Areas of Expertise</h4>
                  {selectedSpeaker.expertise_areas && selectedSpeaker.expertise_areas.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSpeaker.expertise_areas.map((topic, index) => (
                        <Badge key={index} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not specified</p>
                  )}
                </div>
                {selectedSpeaker.industries_experience && selectedSpeaker.industries_experience.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Industry Experience</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSpeaker.industries_experience.map((industry, index) => (
                        <Badge key={index} variant="outline">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Speaking Topics */}
              {selectedSpeaker.speaking_topics && (
                <div>
                  <h4 className="font-semibold mb-2">Speaking Topics</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.speaking_topics}</p>
                </div>
              )}

              {/* Signature Talks */}
              {selectedSpeaker.signature_talks && (
                <div>
                  <h4 className="font-semibold mb-2">Signature Talks</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.signature_talks}</p>
                </div>
              )}

              {/* Qualifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedSpeaker.education && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Education
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.education}</p>
                  </div>
                )}
                {selectedSpeaker.certifications && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Certifications
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.certifications}</p>
                  </div>
                )}
                {selectedSpeaker.achievements && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Achievements
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.achievements}</p>
                  </div>
                )}
              </div>

              {/* Speaking Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Speaking Experience</h4>
                  <div className="space-y-2 text-sm">
                    {selectedSpeaker.speaking_experience && (
                      <div>
                        <span className="font-medium">Level:</span> {selectedSpeaker.speaking_experience}
                      </div>
                    )}
                    {selectedSpeaker.years_speaking && (
                      <div>
                        <span className="font-medium">Years Speaking:</span> {selectedSpeaker.years_speaking}
                      </div>
                    )}
                    {selectedSpeaker.total_engagements && (
                      <div>
                        <span className="font-medium">Total Engagements:</span> {selectedSpeaker.total_engagements}
                      </div>
                    )}
                    {selectedSpeaker.audience_size_preference && (
                      <div>
                        <span className="font-medium">Audience Size Preference:</span> {selectedSpeaker.audience_size_preference}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Fees & Logistics</h4>
                  <div className="space-y-2 text-sm">
                    {selectedSpeaker.speaking_fee_range && (
                      <div>
                        <span className="font-medium">Fee Range:</span> {selectedSpeaker.speaking_fee_range}
                      </div>
                    )}
                    {selectedSpeaker.booking_lead_time && (
                      <div>
                        <span className="font-medium">Lead Time:</span> {selectedSpeaker.booking_lead_time}
                      </div>
                    )}
                    {selectedSpeaker.available_formats && selectedSpeaker.available_formats.length > 0 && (
                      <div>
                        <span className="font-medium">Formats:</span> {selectedSpeaker.available_formats.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notable Organizations */}
              {selectedSpeaker.notable_organizations && (
                <div>
                  <h4 className="font-semibold mb-2">Notable Organizations</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.notable_organizations}</p>
                </div>
              )}

              {/* Previous Engagements */}
              {selectedSpeaker.previous_engagements && (
                <div>
                  <h4 className="font-semibold mb-2">Previous Engagements</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.previous_engagements}</p>
                </div>
              )}

              {/* Case Studies */}
              {selectedSpeaker.case_studies && (
                <div>
                  <h4 className="font-semibold mb-2">Case Studies</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.case_studies}</p>
                </div>
              )}

              {/* Testimonials */}
              {selectedSpeaker.client_testimonials && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    Client Testimonials
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedSpeaker.client_testimonials}</p>
                </div>
              )}

              {/* Video Links */}
              {selectedSpeaker.video_links && selectedSpeaker.video_links.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Speaking Videos
                  </h4>
                  <div className="space-y-2">
                    {selectedSpeaker.video_links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline block"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Media & Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSpeaker.media_coverage && (
                  <div>
                    <h4 className="font-semibold mb-2">Media Coverage</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.media_coverage}</p>
                  </div>
                )}
                {selectedSpeaker.published_content && (
                  <div>
                    <h4 className="font-semibold mb-2">Published Content</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.published_content}</p>
                  </div>
                )}
              </div>

              {selectedSpeaker.podcast_appearances && (
                <div>
                  <h4 className="font-semibold mb-2">Podcast Appearances</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.podcast_appearances}</p>
                </div>
              )}

              {/* References & Bureau Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSpeaker.past_client_references && (
                  <div>
                    <h4 className="font-semibold mb-2">Past Client References</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.past_client_references}</p>
                  </div>
                )}
                {selectedSpeaker.speaker_bureau_experience && (
                  <div>
                    <h4 className="font-semibold mb-2">Speaker Bureau Experience</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.speaker_bureau_experience}</p>
                  </div>
                )}
              </div>

              {/* Requirements & Constraints */}
              {(selectedSpeaker.travel_requirements || selectedSpeaker.technical_requirements || selectedSpeaker.availability_constraints) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Requirements & Constraints</h4>
                  <div className="space-y-3">
                    {selectedSpeaker.travel_requirements && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Travel Requirements:</p>
                        <p className="text-sm text-gray-600">{selectedSpeaker.travel_requirements}</p>
                      </div>
                    )}
                    {selectedSpeaker.technical_requirements && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Technical Requirements:</p>
                        <p className="text-sm text-gray-600">{selectedSpeaker.technical_requirements}</p>
                      </div>
                    )}
                    {selectedSpeaker.availability_constraints && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Availability Constraints:</p>
                        <p className="text-sm text-gray-600">{selectedSpeaker.availability_constraints}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {selectedSpeaker.additional_info && (
                <div>
                  <h4 className="font-semibold mb-2">Additional Information</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSpeaker.additional_info}</p>
                </div>
              )}

              {/* Internal Review Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Internal Review</h4>
                
                {/* Internal Rating */}
                <div className="mb-4">
                  <Label>Internal Rating</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setInternalRating(rating)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            rating <= internalRating
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          } hover:text-yellow-500 hover:fill-current transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internal Notes */}
                <div className="mb-4">
                  <Label htmlFor="internal-notes">Internal Notes (Private)</Label>
                  <Textarea
                    id="internal-notes"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Add any internal notes about this speaker..."
                    rows={3}
                  />
                </div>

                {/* Approval Notes */}
                <div>
                  <Label htmlFor="approval-notes">Approval Notes (May be shared with speaker)</Label>
                  <Textarea
                    id="approval-notes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add notes about your approval decision..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Previous Status Info */}
              {selectedSpeaker.status !== "pending" && (
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-1">Previous Decision</p>
                  <div className="space-y-1 text-gray-600">
                    <p>Status: {getStatusBadge(selectedSpeaker.status)}</p>
                    {selectedSpeaker.approved_by && (
                      <p>Decided by: {selectedSpeaker.approved_by}</p>
                    )}
                    {selectedSpeaker.approved_at && (
                      <p>Date: {new Date(selectedSpeaker.approved_at).toLocaleString()}</p>
                    )}
                    {selectedSpeaker.approval_notes && (
                      <p>Notes: {selectedSpeaker.approval_notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalDialog(false)
                  resetForm()
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              {selectedSpeaker.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleApproval(false)}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApproval(true)}
                    disabled={isProcessing}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </>
              )}
              {selectedSpeaker.status !== "pending" && (
                <Button
                  onClick={() => handleApproval(selectedSpeaker.status !== "approved")}
                  disabled={isProcessing}
                >
                  Update Status
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Users,
  MapPin,
  DollarSign,
  CheckCircle,
  FileText,
  Clock,
  Building,
  User,
  Mail,
  Phone,
  Star,
  Briefcase,
  CheckSquare,
  CreditCard,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Download,
  Share2,
  ExternalLink
} from "lucide-react"
import type { Proposal } from "@/lib/proposals-db"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface ProposalViewProps {
  proposal: Proposal
  isPreview?: boolean
}

export function ProposalView({ proposal, isPreview = false }: ProposalViewProps) {
  const { toast } = useToast()
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [acceptanceData, setAcceptanceData] = useState({
    name: "",
    title: "",
    notes: ""
  })
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Track time spent on page
  useEffect(() => {
    const startTime = Date.now()
    
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      // TODO: Send time tracking data
      console.log("Time spent on proposal:", timeSpent, "seconds")
    }
  }, [])

  const handleAccept = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/proposal/${proposal.access_token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accepted_by: acceptanceData.name,
          acceptance_notes: acceptanceData.notes
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Proposal accepted successfully! We'll be in touch soon."
        })
        setShowAcceptDialog(false)
        // Reload to show updated status
        window.location.reload()
      } else {
        throw new Error("Failed to accept proposal")
      }
    } catch (error) {
      console.error("Error accepting proposal:", error)
      toast({
        title: "Error",
        description: "Failed to accept proposal. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/proposal/${proposal.access_token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rejected_by: proposal.client_name,
          rejection_reason: rejectionReason
        })
      })

      if (response.ok) {
        toast({
          title: "Feedback Sent",
          description: "Thank you for your feedback. We appreciate your consideration."
        })
        setShowRejectDialog(false)
        window.location.reload()
      } else {
        throw new Error("Failed to send feedback")
      }
    } catch (error) {
      console.error("Error rejecting proposal:", error)
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isExpired = proposal.valid_until && new Date(proposal.valid_until) < new Date()
  const canRespond = ["sent", "viewed"].includes(proposal.status) && !isExpired && !isPreview

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {proposal.title || "Speaking Engagement Proposal"}
              </h1>
              <p className="text-gray-600 mt-2">
                Prepared for {proposal.client_name} 
                {proposal.client_company && ` at ${proposal.client_company}`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {proposal.proposal_number} • {formatDate(proposal.created_at)}
              </p>
            </div>
            <div className="text-right">
              {proposal.status === "accepted" && (
                <Badge className="bg-green-100 text-green-800 mb-2">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accepted
                </Badge>
              )}
              {proposal.status === "rejected" && (
                <Badge variant="destructive" className="mb-2">
                  Rejected
                </Badge>
              )}
              {isExpired && proposal.status !== "accepted" && (
                <Badge variant="secondary" className="mb-2">
                  Expired
                </Badge>
              )}
              {proposal.valid_until && !isExpired && (
                <p className="text-sm text-gray-500">
                  Valid until {formatDate(proposal.valid_until)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Speakers - Primary Focus */}
          {proposal.speakers && proposal.speakers.length > 0 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-center">
                Meet Your {proposal.speakers.length > 1 ? "Speakers" : "Speaker"}
              </h2>
              
              {proposal.speakers.map((speaker, index) => (
                <Card key={index} className="overflow-hidden">
                  {/* Speaker Hero Section */}
                  <div className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="absolute inset-0 bg-black/20" />
                    
                    {/* Availability Badge */}
                    {speaker.availability_confirmed !== undefined && (
                      <div className="absolute top-4 left-4 z-10">
                        <Badge className={speaker.availability_confirmed 
                          ? "bg-green-500 text-white border-green-600" 
                          : "bg-yellow-500 text-white border-yellow-600"
                        }>
                          {speaker.availability_confirmed ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Availability Confirmed
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 mr-1" />
                              Availability Pending
                            </>
                          )}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Speaker Image */}
                    {speaker.image_url && (
                      <img
                        src={speaker.image_url}
                        alt={speaker.name}
                        className="absolute right-0 top-0 h-full w-auto object-cover"
                        style={{ maxWidth: '50%' }}
                      />
                    )}
                    
                    {/* Speaker Info Overlay */}
                    <div className="relative h-full flex items-center">
                      <div className="w-1/2 px-8 py-12">
                        <h3 className="text-4xl font-bold text-white mb-2">
                          {speaker.name}
                        </h3>
                        {speaker.title && (
                          <p className="text-xl text-white/90 mb-6">
                            {speaker.title}
                          </p>
                        )}
                        
                        {/* Expertise Tags */}
                        {speaker.topics && speaker.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {speaker.topics.slice(0, 5).map((topic, i) => (
                              <Badge 
                                key={i} 
                                className="bg-white/20 text-white border-white/30 backdrop-blur"
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Speaker Details */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Learn More Section */}
                      <div>
                        <h4 className="text-lg font-semibold mb-3 flex items-center">
                          <User className="h-5 w-5 mr-2" />
                          Learn More About {speaker.name.split(' ')[0]}
                        </h4>
                        <p className="text-gray-600 mb-4">
                          Discover {speaker.name.split(' ')[0]}'s full background, expertise, and speaking topics.
                        </p>
                        <a
                          href={`https://speakabout.ai/speakers/${speaker.slug || speaker.name.toLowerCase().replace(/\s+/g, '-')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                          View Full Speaker Profile
                          <ExternalLink className="w-5 h-5 ml-2" />
                        </a>
                      </div>
                      
                      {/* Video Section */}
                      <div>
                        <h4 className="text-lg font-semibold mb-3 flex items-center">
                          <Star className="h-5 w-5 mr-2" />
                          Speaker Preview
                        </h4>
                        {(() => {
                          console.log(`Speaker ${speaker.name} video_url:`, speaker.video_url)
                          console.log(`Speaker ${speaker.name} image_url:`, speaker.image_url)
                          return speaker.video_url ? (
                            <div className="relative rounded-lg overflow-hidden shadow-lg">
                              {speaker.video_url.includes('youtube.com') || speaker.video_url.includes('youtu.be') ? (
                              <iframe
                                src={speaker.video_url.includes('watch?v=') 
                                  ? speaker.video_url.replace('watch?v=', 'embed/')
                                  : speaker.video_url.includes('youtu.be/')
                                  ? speaker.video_url.replace('youtu.be/', 'youtube.com/embed/')
                                  : speaker.video_url
                                }
                                className="w-full h-64"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                title={`${speaker.name} preview video`}
                              />
                            ) : speaker.video_url.includes('vimeo.com') ? (
                              <iframe
                                src={speaker.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                                className="w-full h-64"
                                allowFullScreen
                                title={`${speaker.name} preview video`}
                              />
                            ) : (
                              <video
                                src={speaker.video_url}
                                controls
                                className="w-full h-64"
                                title={`${speaker.name} preview video`}
                              />
                            )}
                          </div>
                          ) : (
                            <div className="bg-gray-100 rounded-lg p-8 text-center">
                              <p className="text-gray-500">
                                Video preview coming soon
                              </p>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    
                    {/* Investment & Details */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-gray-50 rounded-lg">
                        <h4 className="text-lg font-semibold mb-3 flex items-center">
                          <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
                          Speaking Fee
                        </h4>
                        <p className="text-3xl font-bold text-gray-900">
                          {speaker.fee ? formatCurrency(speaker.fee) : 'Please Inquire'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Estimated investment</p>
                      </div>
                      
                      <div className="p-6 bg-blue-50 rounded-lg">
                        <h4 className="text-lg font-semibold mb-3 flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                          Why {speaker.name.split(' ')[0]}?
                        </h4>
                        <p className="text-gray-700">
                          {speaker.relevance_text || 
                            `${speaker.name} brings unparalleled expertise in ${speaker.topics?.[0] || 'their field'}, 
                            making them the perfect choice for your ${proposal.event_type || 'event'}.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Event Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Event Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900">{proposal.event_title}</h3>
                {proposal.event_description && (
                  <p className="text-gray-600 mt-2">{proposal.event_description}</p>
                )}
              </div>
              <div className="space-y-3">
                {proposal.event_date && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(proposal.event_date)}
                  </div>
                )}
                {proposal.event_location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {proposal.event_location}
                  </div>
                )}
                {proposal.attendee_count && (
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {proposal.attendee_count} attendees expected
                  </div>
                )}
                {proposal.event_format && (
                  <Badge variant="secondary">
                    {proposal.event_format.charAt(0).toUpperCase() + proposal.event_format.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Executive Summary */}
          {proposal.executive_summary && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{proposal.executive_summary}</p>
            </Card>
          )}

          {/* Services & Deliverables - Minimized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposal.services && proposal.services.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Services Included
                </h2>
                <div className="space-y-2">
                  {proposal.services.filter(s => s.included).map((service, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-gray-600">{service.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {proposal.deliverables && proposal.deliverables.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <CheckSquare className="h-5 w-5 mr-2" />
                  Deliverables
                </h2>
                <div className="space-y-2">
                  {proposal.deliverables.map((deliverable, index) => (
                    <div key={index}>
                      <p className="font-medium text-sm">{deliverable.name}</p>
                      {deliverable.description && (
                        <p className="text-xs text-gray-600">{deliverable.description}</p>
                      )}
                      {deliverable.timeline && (
                        <p className="text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {deliverable.timeline}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Investment Summary - Simplified */}
          <Card className="p-6 bg-gray-50">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Investment Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <span className="text-lg">Total Investment</span>
                  <span className="text-2xl font-bold">{formatCurrency(proposal.total_investment)}</span>
                </div>
              </div>
              
              {proposal.payment_terms && (
                <div>
                  <h3 className="font-medium mb-2">Payment Terms</h3>
                  <p className="text-sm text-gray-600">{proposal.payment_terms}</p>
                </div>
              )}
            </div>

            {proposal.payment_schedule && proposal.payment_schedule.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-3">Payment Schedule</h3>
                <div className="space-y-2">
                  {proposal.payment_schedule.map((milestone, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                      <div>
                        <p className="font-medium">{milestone.description}</p>
                        <p className="text-xs text-gray-500">{milestone.due_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(milestone.amount)}</p>
                        {milestone.percentage && (
                          <p className="text-xs text-gray-500">{milestone.percentage}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Why Us */}
          {proposal.why_us && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Why Choose Speak About AI
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">{proposal.why_us}</p>
            </Card>
          )}

          {/* Testimonials */}
          {proposal.testimonials && proposal.testimonials.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">What Others Say</h2>
              <div className="space-y-6">
                {proposal.testimonials.map((testimonial, index) => (
                  <blockquote key={index} className="border-l-4 border-blue-600 pl-4">
                    <p className="text-gray-600 italic">"{testimonial.quote}"</p>
                    <footer className="mt-2">
                      <p className="font-medium">{testimonial.author}</p>
                      {(testimonial.title || testimonial.company) && (
                        <p className="text-sm text-gray-500">
                          {testimonial.title}
                          {testimonial.title && testimonial.company && ", "}
                          {testimonial.company}
                        </p>
                      )}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </Card>
          )}

          {/* Terms & Conditions */}
          {proposal.terms_conditions && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
              <p className="text-gray-600 whitespace-pre-wrap text-sm">{proposal.terms_conditions}</p>
            </Card>
          )}

          {/* Action Buttons */}
          {canRespond && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Ready to Move Forward?</h2>
                <p className="text-gray-600 mb-6">
                  We're excited about the opportunity to work with you.
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => setShowAcceptDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="h-5 w-5 mr-2" />
                    Accept Proposal
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Provide Feedback
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Contact Information */}
          <Card className="p-6 bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">Questions?</h2>
            <p className="text-gray-600 mb-4">
              We're here to help. Feel free to reach out with any questions or to discuss this proposal further.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="mailto:hello@speakaboutai.com"
                className="flex items-center text-blue-600 hover:underline"
              >
                <Mail className="h-4 w-4 mr-2" />
                hello@speakaboutai.com
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center text-blue-600 hover:underline"
              >
                <Phone className="h-4 w-4 mr-2" />
                (123) 456-7890
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Proposal</DialogTitle>
            <DialogDescription>
              Please provide your information to accept this proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="accept-name">Your Name</Label>
              <Input
                id="accept-name"
                value={acceptanceData.name}
                onChange={(e) => setAcceptanceData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label htmlFor="accept-title">Your Title</Label>
              <Input
                id="accept-title"
                value={acceptanceData.title}
                onChange={(e) => setAcceptanceData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="VP of Events"
              />
            </div>
            <div>
              <Label htmlFor="accept-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="accept-notes"
                value={acceptanceData.notes}
                onChange={(e) => setAcceptanceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any specific requirements or notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAccept} 
              disabled={!acceptanceData.name || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              We value your feedback. Please let us know how we can improve.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="rejection-reason">Your Feedback</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please share any feedback or reasons for your decision..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={isSubmitting}>
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, CheckCircle, Send, FileText, DollarSign, Calendar, MapPin, Users } from "lucide-react"
import { useWizard } from "../wizard-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function StepReview() {
  const { wizardData, goToPreviousStep } = useWizard()
  const [generating, setGenerating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleGenerate = async (status: "draft" | "sent") => {
    setGenerating(true)

    try {
      const proposalData = {
        deal_id: wizardData.deal_id || undefined,
        title: `${wizardData.event_title} - Proposal`,
        status,
        client_name: wizardData.client_name,
        client_email: wizardData.client_email,
        client_company: wizardData.client_company,
        event_title: wizardData.event_title,
        event_date: wizardData.event_date?.toISOString(),
        event_location: wizardData.event_location,
        event_type: wizardData.event_type,
        event_format: wizardData.event_format,
        attendee_count: wizardData.attendee_count,
        speakers: wizardData.selected_speakers.map(s => ({
          name: s.name,
          slug: s.slug,
          title: s.title,
          bio: s.bio,
          topics: [],
          fee: s.fee,
          image_url: s.image_url
        })),
        services: wizardData.services,
        total_investment: wizardData.total_investment,
        payment_terms: wizardData.payment_terms,
        payment_schedule: [
          {
            milestone: "Deposit",
            percentage: 50,
            amount: wizardData.total_investment * 0.5,
            due_date: "Upon signing"
          },
          {
            milestone: "Final Payment",
            percentage: 50,
            amount: wizardData.total_investment * 0.5,
            due_date: "7 days before event"
          }
        ],
        deliverables: [
          {
            name: "Pre-event consultation",
            description: "Virtual meeting to align on objectives",
            timeline: "2 weeks before event"
          },
          {
            name: "Customized presentation",
            description: "Tailored content for your audience",
            timeline: "1 week before event"
          }
        ],
        valid_until: new Date(Date.now() + wizardData.valid_days * 24 * 60 * 60 * 1000).toISOString(),
        version: 1
      }

      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposalData)
      })

      if (response.ok) {
        const proposal = await response.json()
        toast({
          title: "Success!",
          description: status === "draft"
            ? "Proposal saved as draft"
            : "Proposal generated and ready to send"
        })

        // Redirect to proposal page
        router.push(`/admin/proposals/${proposal.id}`)
      } else {
        throw new Error("Failed to create proposal")
      }
    } catch (error) {
      console.error("Error generating proposal:", error)
      toast({
        title: "Error",
        description: "Failed to generate proposal. Please try again.",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Generate</h2>
        <p className="text-gray-600">
          Review your proposal details before generating. You can save as draft or send directly to the client.
        </p>
      </div>

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-purple-900">
              ${wizardData.total_investment.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600">Total Investment</p>
          </div>
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Speakers</p>
            <p className="font-semibold">{wizardData.selected_speakers.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Services</p>
            <p className="font-semibold">{wizardData.services.filter(s => s.included).length}</p>
          </div>
          <div>
            <p className="text-gray-600">Valid For</p>
            <p className="font-semibold">{wizardData.valid_days} days</p>
          </div>
        </div>
      </Card>

      {/* Client Info */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Client Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Client Name</p>
            <p className="font-medium">{wizardData.client_name}</p>
          </div>
          <div>
            <p className="text-gray-600">Company</p>
            <p className="font-medium">{wizardData.client_company}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600">Email</p>
            <p className="font-medium">{wizardData.client_email}</p>
          </div>
        </div>
      </Card>

      {/* Event Details */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          Event Details
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">{wizardData.event_title}</p>
              <p className="text-gray-600">{wizardData.event_type}</p>
            </div>
          </div>
          {wizardData.event_date && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              {wizardData.event_date.toLocaleDateString()}
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            {wizardData.event_location}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4" />
            {wizardData.attendee_count} attendees
          </div>
          <Badge variant="secondary" className="text-xs">
            {wizardData.event_format}
          </Badge>
        </div>
      </Card>

      {/* Speakers */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Selected Speakers</h3>
        <div className="space-y-3">
          {wizardData.selected_speakers.map((speaker) => (
            <div key={speaker.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={speaker.image_url} />
                <AvatarFallback>
                  {speaker.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{speaker.name}</p>
                <p className="text-sm text-gray-600">{speaker.title}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${speaker.fee.toLocaleString()}</p>
                {speaker.match_score && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {speaker.match_score}% match
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Services */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-purple-600" />
          Services & Investment
        </h3>
        <div className="space-y-2">
          {wizardData.services.filter(s => s.included).map((service, idx) => (
            <div key={idx} className="flex justify-between items-start text-sm">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-gray-600 text-xs">{service.description}</p>
              </div>
              <p className="font-semibold whitespace-nowrap ml-4">
                {service.price === 0 ? "Included" : `$${service.price.toLocaleString()}`}
              </p>
            </div>
          ))}
          <div className="pt-3 border-t flex justify-between items-center font-semibold">
            <p>Total Investment</p>
            <p className="text-lg text-purple-900">
              ${wizardData.total_investment.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Payment Terms */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Payment Terms</h3>
        <p className="text-sm text-gray-700">{wizardData.payment_terms}</p>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={generating}
        >
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleGenerate("draft")}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Save as Draft
          </Button>
          <Button
            onClick={() => handleGenerate("sent")}
            disabled={generating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Generate & Send
          </Button>
        </div>
      </div>
    </div>
  )
}

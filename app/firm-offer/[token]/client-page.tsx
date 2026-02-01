"use client"

import { useState } from "react"
import { EssentialInfoForm } from "@/components/essential-info-form"
import type { FirmOffer } from "@/lib/firm-offer-types"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, Timer } from "lucide-react"

interface Props {
  token: string
  proposal: any
  firmOffer: any
  speakerName: string
  speakerFee: number
  travelBuyout?: number
  eventDate?: string
  eventName?: string
  eventLocation?: string
  clientName?: string
  clientCompany?: string
}

export function FirmOfferClientPage({
  token,
  proposal,
  firmOffer,
  speakerName,
  speakerFee,
  travelBuyout = 0,
  eventDate,
  eventName,
  eventLocation,
  clientName,
  clientCompany
}: Props) {
  const { toast } = useToast()
  const [currentOffer, setCurrentOffer] = useState(firmOffer)

  // Calculate hold expiration
  const getHoldStatus = () => {
    if (!currentOffer) return null

    const createdAt = new Date(currentOffer.created_at)
    const holdExpires = currentOffer.hold_expires_at
      ? new Date(currentOffer.hold_expires_at)
      : new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days default
    const now = new Date()
    const daysRemaining = Math.ceil((holdExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      expired: daysRemaining < 0,
      daysRemaining: Math.max(0, daysRemaining),
      expiresAt: holdExpires
    }
  }

  const holdStatus = getHoldStatus()

  // If hold has expired
  if (holdStatus?.expired && currentOffer?.status !== 'speaker_confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Speaker Hold Has Expired</h1>
            <p className="text-gray-600 mb-4">
              The 2-week hold period for {speakerName} has expired. We need to re-confirm their availability before proceeding.
            </p>
            <p className="text-gray-600">
              Please contact us at <a href="mailto:hello@speakaboutai.com" className="text-blue-600 hover:underline">hello@speakaboutai.com</a> to request a new quote and availability check.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  // If already submitted, show status
  if (currentOffer?.status === 'submitted' || currentOffer?.status === 'sent_to_speaker' || currentOffer?.status === 'speaker_confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            {currentOffer.status === 'speaker_confirmed' ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Speaker Confirmed!</h1>
                <p className="text-gray-600">
                  Great news! {speakerName} has confirmed your event. Our team will be in touch shortly with next steps.
                </p>
              </>
            ) : currentOffer.status === 'sent_to_speaker' ? (
              <>
                <Clock className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Awaiting Speaker Confirmation</h1>
                <p className="text-gray-600">
                  Your event details have been sent to {speakerName} for review. We'll notify you once they respond.
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Details Submitted</h1>
                <p className="text-gray-600">
                  Thank you! Your event details are being reviewed by our team. We'll forward them to {speakerName} shortly.
                </p>
              </>
            )}
          </Card>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data: Partial<FirmOffer>) => {
    try {
      let response
      if (currentOffer?.id) {
        // Update existing
        response = await fetch(`/api/firm-offers/${currentOffer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
        })
      } else {
        // Create new
        response = await fetch('/api/firm-offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            proposal_id: proposal?.id,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
        })
      }

      if (!response.ok) throw new Error('Failed to submit')

      const updated = await response.json()
      setCurrentOffer(updated)

      toast({
        title: "Submitted!",
        description: "Your event details have been submitted for review."
      })
    } catch (error) {
      console.error('Error submitting:', error)
      throw error
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Hold Expiration Warning Banner */}
      {holdStatus && currentOffer && (
        <div className="max-w-2xl mx-auto mb-6">
          <Card className={`p-4 ${holdStatus.daysRemaining <= 3 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <Timer className={`h-5 w-5 ${holdStatus.daysRemaining <= 3 ? 'text-red-600' : 'text-amber-600'}`} />
              <div className="flex-1">
                <p className={`font-medium ${holdStatus.daysRemaining <= 3 ? 'text-red-800' : 'text-amber-800'}`}>
                  {holdStatus.daysRemaining <= 3 ? (
                    <>Speaker hold expires in {holdStatus.daysRemaining} day{holdStatus.daysRemaining !== 1 ? 's' : ''}!</>
                  ) : (
                    <>Speaker hold valid for {holdStatus.daysRemaining} more days</>
                  )}
                </p>
                <p className={`text-sm ${holdStatus.daysRemaining <= 3 ? 'text-red-700' : 'text-amber-700'}`}>
                  {speakerName}'s availability is held until {formatDate(holdStatus.expiresAt)}.
                  After this date, we'll need to re-confirm availability.
                </p>
              </div>
              <Badge variant={holdStatus.daysRemaining <= 3 ? 'destructive' : 'secondary'}>
                {holdStatus.daysRemaining} days left
              </Badge>
            </div>
          </Card>
        </div>
      )}

      <EssentialInfoForm
        proposalId={proposal?.id}
        speakerName={speakerName}
        speakerFee={speakerFee}
        travelBuyout={travelBuyout}
        eventDate={eventDate || currentOffer?.event_overview?.event_date}
        eventName={eventName || currentOffer?.event_overview?.event_name}
        eventLocation={eventLocation || currentOffer?.event_overview?.venue_address}
        clientName={clientName}
        clientCompany={clientCompany || currentOffer?.event_overview?.end_client_name}
        initialData={currentOffer || undefined}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

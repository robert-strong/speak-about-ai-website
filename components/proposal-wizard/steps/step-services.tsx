"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, DollarSign, CheckCircle, Sparkles } from "lucide-react"
import { useWizard } from "../wizard-context"

interface ServiceItem {
  name: string
  description: string
  price: number
  included: boolean
}

export function StepServices() {
  const { wizardData, updateWizardData, goToNextStep, goToPreviousStep } = useWizard()
  const [services, setServices] = useState<ServiceItem[]>(wizardData.services)
  const [paymentTerms, setPaymentTerms] = useState(wizardData.payment_terms)
  const [validDays, setValidDays] = useState(wizardData.valid_days)

  useEffect(() => {
    // Load recommended services if none exist
    if (services.length === 0) {
      loadRecommendedServices()
    }
  }, [])

  const loadRecommendedServices = () => {
    const recommended: ServiceItem[] = []

    // Base keynote
    const totalSpeakerFees = wizardData.selected_speakers.reduce((sum, s) => sum + s.fee, 0)
    recommended.push({
      name: wizardData.session_format || "Keynote Presentation",
      description: `${wizardData.session_format === "workshop" ? "Interactive workshop session" : "60-minute keynote address"}`,
      price: totalSpeakerFees,
      included: true
    })

    // Pre-event consultation (always included)
    recommended.push({
      name: "Pre-event consultation",
      description: "Virtual meeting to align on event objectives and customize content",
      price: 0,
      included: true
    })

    // Customized content (always included)
    recommended.push({
      name: "Customized presentation",
      description: "Tailored content addressing your specific audience and goals",
      price: 0,
      included: true
    })

    // Q&A session
    if (wizardData.attendee_count > 100) {
      recommended.push({
        name: "Q&A session (15-20 min)",
        description: "Interactive audience Q&A following the presentation",
        price: 0,
        included: true
      })
    }

    // Optional add-ons based on event size
    if (wizardData.attendee_count >= 200) {
      recommended.push({
        name: "Executive roundtable",
        description: "Intimate discussion with leadership team (up to 15 people)",
        price: Math.round(totalSpeakerFees * 0.2),
        included: false
      })

      recommended.push({
        name: "Post-event recording rights",
        description: "Rights to record and share presentation internally",
        price: Math.round(totalSpeakerFees * 0.1),
        included: false
      })
    }

    if (wizardData.attendee_count >= 500) {
      recommended.push({
        name: "Book signing session",
        description: "Meet & greet with book signing (if applicable)",
        price: 1000,
        included: false
      })
    }

    setServices(recommended)
  }

  const addCustomService = () => {
    setServices([
      ...services,
      {
        name: "",
        description: "",
        price: 0,
        included: false
      }
    ])
  }

  const updateService = (index: number, updates: Partial<ServiceItem>) => {
    setServices(services.map((s, i) => i === index ? { ...s, ...updates } : s))
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return services
      .filter(s => s.included)
      .reduce((sum, s) => sum + s.price, 0)
  }

  const handleContinue = () => {
    updateWizardData({
      services,
      payment_terms: paymentTerms,
      valid_days: validDays,
      total_investment: calculateTotal()
    })
    goToNextStep()
  }

  const total = calculateTotal()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Services & Investment</h2>
        <p className="text-gray-600">
          We've suggested a service package based on your event. Customize as needed.
        </p>
      </div>

      {/* Summary Card */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Investment</p>
            <p className="text-3xl font-bold text-purple-900">
              ${total.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">
              {wizardData.selected_speakers.length} Speaker{wizardData.selected_speakers.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-600">
              {services.filter(s => s.included).length} Services
            </p>
          </div>
        </div>
      </Card>

      {/* Services List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Services Included</h3>
          <Button
            onClick={addCustomService}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Service
          </Button>
        </div>

        {services.map((service, index) => (
          <Card key={index} className="p-4">
            <div className="flex gap-4">
              <div className="pt-1">
                <Checkbox
                  checked={service.included}
                  onCheckedChange={(checked) =>
                    updateService(index, { included: checked as boolean })
                  }
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-2">
                  <Input
                    value={service.name}
                    onChange={(e) => updateService(index, { name: e.target.value })}
                    placeholder="Service name"
                    className="font-medium"
                  />
                  {!service.name.includes("Keynote") && !service.name.includes("consultation") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeService(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <Textarea
                  value={service.description}
                  onChange={(e) => updateService(index, { description: e.target.value })}
                  placeholder="Service description"
                  className="text-sm"
                  rows={2}
                />

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    value={service.price}
                    onChange={(e) =>
                      updateService(index, { price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-32"
                  />
                  {service.price === 0 && service.included && (
                    <Badge variant="secondary" className="text-xs">
                      Included
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment Terms */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Payment Terms</h3>
        <Textarea
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          placeholder="e.g., 50% deposit upon signing, 50% due 7 days before event"
          rows={3}
        />
      </Card>

      {/* Proposal Validity */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Proposal Valid For</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={validDays}
            onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
            className="w-24"
          />
          <span className="text-sm text-gray-600">days</span>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Review Proposal
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

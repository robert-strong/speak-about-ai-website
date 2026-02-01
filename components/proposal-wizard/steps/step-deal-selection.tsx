"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWizard } from "../wizard-context"

interface Deal {
  id: number
  client_name: string
  client_email: string
  company: string
  event_title: string
  event_date: string
  event_location: string
  event_type: string
  attendee_count: number
  deal_value: number
  status: string
  priority: string
  speaker_requested?: string
}

export function StepDealSelection() {
  const { updateWizardData, goToNextStep } = useWizard()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"qualified" | "proposal" | "negotiation" | "all">("qualified")

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    try {
      const response = await fetch("/api/deals")
      if (response.ok) {
        const data = await response.json()
        const filteredDeals = data.filter((d: Deal) =>
          ["qualified", "proposal", "negotiation"].includes(d.status)
        )

        // Sort: qualified first, then by priority, then by date
        const sortedDeals = filteredDeals.sort((a: Deal, b: Deal) => {
          const statusOrder = { qualified: 0, proposal: 1, negotiation: 2 }
          const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
          if (statusDiff !== 0) return statusDiff

          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
          if (priorityDiff !== 0) return priorityDiff

          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        })

        setDeals(sortedDeals)
      }
    } catch (error) {
      console.error("Error fetching deals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDeal = (deal: Deal) => {
    updateWizardData({
      deal_id: deal.id.toString(),
      client_name: deal.client_name,
      client_email: deal.client_email,
      client_company: deal.company,
      event_title: deal.event_title,
      event_date: deal.event_date ? new Date(deal.event_date) : undefined,
      event_location: deal.event_location,
      event_type: deal.event_type,
      attendee_count: deal.attendee_count,
      budget: deal.deal_value
    })
    goToNextStep()
  }

  const filteredDeals = statusFilter === "all"
    ? deals
    : deals.filter(d => d.status === statusFilter)

  const dealCounts = {
    all: deals.length,
    qualified: deals.filter(d => d.status === "qualified").length,
    proposal: deals.filter(d => d.status === "proposal").length,
    negotiation: deals.filter(d => d.status === "negotiation").length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Select a Deal</h2>
        <p className="text-gray-600">
          Choose a qualified deal to create a proposal for, or start from scratch.
        </p>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="qualified">
            Qualified ({dealCounts.qualified})
          </TabsTrigger>
          <TabsTrigger value="proposal">
            Proposal ({dealCounts.proposal})
          </TabsTrigger>
          <TabsTrigger value="negotiation">
            Negotiation ({dealCounts.negotiation})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({dealCounts.all})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Start from Scratch Option */}
      <Card
        className="p-4 cursor-pointer hover:border-purple-500 transition-colors border-2 border-dashed"
        onClick={() => goToNextStep()}
      >
        <div className="text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <h3 className="font-medium mb-1">Start from Scratch</h3>
          <p className="text-sm text-gray-600">
            Create a proposal without linking to an existing deal
          </p>
        </div>
      </Card>

      {/* Deals Grid */}
      {filteredDeals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeals.map((deal) => (
            <Card
              key={deal.id}
              className={cn(
                "p-4 cursor-pointer hover:border-purple-500 transition-all hover:shadow-lg",
                deal.status === "qualified" && "border-green-200 bg-green-50/30",
                deal.priority === "urgent" && "border-red-300"
              )}
              onClick={() => handleSelectDeal(deal)}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-base flex-1">
                    {deal.client_name}
                  </h3>
                  <div className="flex gap-1 flex-shrink-0">
                    {deal.priority === "urgent" && (
                      <Badge variant="destructive" className="text-xs">
                        Urgent
                      </Badge>
                    )}
                    {deal.priority === "high" && (
                      <Badge className="text-xs bg-orange-100 text-orange-800">
                        High
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "text-xs",
                        deal.status === "qualified" && "bg-green-100 text-green-800"
                      )}
                    >
                      {deal.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">{deal.company}</p>
                  <p className="text-sm text-gray-600 mt-1">{deal.event_title}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {deal.deal_value > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                      💰 ${deal.deal_value.toLocaleString()}
                    </span>
                  )}
                  {deal.event_location && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      📍 {deal.event_location}
                    </span>
                  )}
                  {deal.event_date && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      📅 {new Date(deal.event_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {deal.speaker_requested && (
                  <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded text-xs">
                    <p className="font-semibold text-purple-900 mb-1">Requested Speaker:</p>
                    <p className="text-purple-700">🎤 {deal.speaker_requested}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-gray-600">
            {statusFilter === "all"
              ? "No active deals found."
              : `No ${statusFilter} deals found. Try selecting a different status.`}
          </p>
        </Card>
      )}
    </div>
  )
}

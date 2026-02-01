"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Loader2, Search, Filter, Sparkles } from "lucide-react"
import { SpeakerCard } from "../speaker-card"
import { useWizard } from "../wizard-context"

interface SpeakerRecommendation {
  id: number
  name: string
  slug?: string
  title?: string
  bio?: string
  short_bio?: string
  headshot_url?: string
  speaking_fee_range?: string
  match_score?: number
  match_reasons?: string[]
  topics?: string[]
  industries?: string[]
}

export function StepSpeakerSelection() {
  const { wizardData, updateWizardData, goToNextStep, goToPreviousStep } = useWizard()
  const [loading, setLoading] = useState(true)
  const [speakers, setSpeakers] = useState<SpeakerRecommendation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBudget, setFilterBudget] = useState(true)

  useEffect(() => {
    fetchSpeakerRecommendations()
  }, [])

  const fetchSpeakerRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/tools/speaker-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: wizardData.deal_id,
          criteria: {
            event_type: wizardData.event_type,
            event_location: wizardData.event_location,
            budget: wizardData.budget,
            attendee_count: wizardData.attendee_count,
            topics: wizardData.main_theme ? [wizardData.main_theme] : [],
            session_format: wizardData.session_format
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSpeakers(data.speakers)
      }
    } catch (error) {
      console.error("Error fetching speaker recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSpeaker = (speaker: SpeakerRecommendation) => {
    const isSelected = wizardData.selected_speakers.some(s => s.id === speaker.id)

    if (isSelected) {
      // Deselect
      updateWizardData({
        selected_speakers: wizardData.selected_speakers.filter(s => s.id !== speaker.id)
      })
    } else {
      // Select
      updateWizardData({
        selected_speakers: [
          ...wizardData.selected_speakers,
          {
            id: speaker.id,
            name: speaker.name,
            slug: speaker.slug,
            title: speaker.title,
            bio: speaker.bio || speaker.short_bio || "",
            fee: parseInt(speaker.speaking_fee_range?.match(/\d+/)?.[0] || "0") * 1000,
            image_url: speaker.headshot_url || "",
            match_score: speaker.match_score,
            match_reasons: speaker.match_reasons
          }
        ]
      })
    }
  }

  const filteredSpeakers = speakers.filter(speaker => {
    const matchesSearch = searchTerm === "" ||
      speaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      speaker.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      speaker.topics?.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesBudget = !filterBudget ||
      !wizardData.budget ||
      !speaker.speaking_fee_range ||
      parseInt(speaker.speaking_fee_range.match(/\d+/)?.[0] || "999999") * 1000 <= wizardData.budget

    return matchesSearch && matchesBudget
  })

  const canProceed = wizardData.selected_speakers.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Speakers</h2>
        <p className="text-gray-600">
          We've found {speakers.length} speaker{speakers.length !== 1 ? 's' : ''} that match your event requirements.
          Select one or more speakers to include in your proposal.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search speakers by name, expertise, or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant={filterBudget ? "default" : "outline"}
            onClick={() => setFilterBudget(!filterBudget)}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Within Budget
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {filteredSpeakers.length} speaker{filteredSpeakers.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </Card>

      {/* Selected Speakers Summary */}
      {wizardData.selected_speakers.length > 0 && (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-purple-900">
                {wizardData.selected_speakers.length} Speaker{wizardData.selected_speakers.length !== 1 ? 's' : ''} Selected
              </p>
              <p className="text-sm text-purple-700">
                {wizardData.selected_speakers.map(s => s.name).join(", ")}
              </p>
            </div>
            <Badge className="bg-purple-600 text-white">
              Total: ${wizardData.selected_speakers.reduce((sum, s) => sum + s.fee, 0).toLocaleString()}
            </Badge>
          </div>
        </Card>
      )}

      {/* Speaker List */}
      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Finding the best speaker matches...</p>
        </Card>
      ) : filteredSpeakers.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No speakers match your current filters.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setFilterBudget(false)
            }}
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSpeakers.map((speaker) => (
            <SpeakerCard
              key={speaker.id}
              speaker={{
                id: speaker.id.toString(),
                name: speaker.name,
                slug: speaker.slug,
                title: speaker.title,
                bio: speaker.bio,
                short_bio: speaker.short_bio,
                location: speaker.location,
                fee_range: speaker.speaking_fee_range,
                image_url: speaker.headshot_url,
                topics: Array.isArray(speaker.topics)
                  ? speaker.topics
                  : typeof speaker.topics === 'string'
                    ? JSON.parse(speaker.topics)
                    : [],
                match_score: speaker.match_score,
                match_reasons: speaker.match_reasons
              }}
              selected={wizardData.selected_speakers.some(s => s.id === speaker.id.toString())}
              onSelect={() => handleSelectSpeaker(speaker)}
              onViewProfile={() => window.open(`/speakers/${speaker.slug}`, '_blank')}
              budget={wizardData.budget}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
        >
          Back
        </Button>
        <Button
          onClick={goToNextStep}
          disabled={!canProceed}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Continue to Services
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

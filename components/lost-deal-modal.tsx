"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LostDealModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LostDealData) => void
  dealName: string
}

export interface LostDealData {
  reason: string
  specificReason: string
  worthFollowUp: boolean
  followUpTimeframe?: string
  nextSteps: string
  competitorWon?: string
  budgetMismatch?: string
  otherNotes?: string
}

const LOST_REASONS = {
  budget: "Budget constraints",
  timing: "Bad timing",
  competitor: "Went with competitor",
  internal: "Handled internally",
  cancelled: "Event cancelled",
  noResponse: "Client went dark",
  notFit: "Not a good fit",
  other: "Other"
}

const FOLLOW_UP_TIMEFRAMES = {
  "1month": "1 month",
  "3months": "3 months",
  "6months": "6 months",
  "1year": "1 year",
  "never": "Never"
}

export function LostDealModal({ isOpen, onClose, onSubmit, dealName }: LostDealModalProps) {
  const [reason, setReason] = useState("")
  const [specificReason, setSpecificReason] = useState("")
  const [worthFollowUp, setWorthFollowUp] = useState(false)
  const [followUpTimeframe, setFollowUpTimeframe] = useState("")
  const [nextSteps, setNextSteps] = useState("")
  const [competitorWon, setCompetitorWon] = useState("")
  const [budgetMismatch, setBudgetMismatch] = useState("")
  const [otherNotes, setOtherNotes] = useState("")

  const handleSubmit = () => {
    const data: LostDealData = {
      reason,
      specificReason,
      worthFollowUp,
      followUpTimeframe: worthFollowUp ? followUpTimeframe : undefined,
      nextSteps,
      competitorWon: reason === "competitor" ? competitorWon : undefined,
      budgetMismatch: reason === "budget" ? budgetMismatch : undefined,
      otherNotes
    }
    onSubmit(data)
    resetForm()
  }

  const resetForm = () => {
    setReason("")
    setSpecificReason("")
    setWorthFollowUp(false)
    setFollowUpTimeframe("")
    setNextSteps("")
    setCompetitorWon("")
    setBudgetMismatch("")
    setOtherNotes("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Deal as Lost: {dealName}</DialogTitle>
          <DialogDescription>
            Please provide details about why this deal was lost to help improve future opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Primary Reason */}
          <div className="space-y-3">
            <Label>What was the primary reason for losing this deal?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {Object.entries(LOST_REASONS).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={value} />
                  <Label htmlFor={value} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Conditional follow-up questions */}
          {reason === "budget" && (
            <div className="space-y-3">
              <Label>What was the budget mismatch?</Label>
              <Textarea
                value={budgetMismatch}
                onChange={(e) => setBudgetMismatch(e.target.value)}
                placeholder="e.g., Their budget was $10k, our minimum is $25k"
                className="min-h-[80px]"
              />
            </div>
          )}

          {reason === "competitor" && (
            <div className="space-y-3">
              <Label>Which competitor won the deal?</Label>
              <input
                type="text"
                value={competitorWon}
                onChange={(e) => setCompetitorWon(e.target.value)}
                placeholder="Competitor name or 'Unknown'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          {/* Specific details */}
          <div className="space-y-3">
            <Label>Please provide specific details about what happened</Label>
            <Textarea
              value={specificReason}
              onChange={(e) => setSpecificReason(e.target.value)}
              placeholder="Provide context about the loss, any feedback from the client, key objections, etc."
              className="min-h-[100px]"
            />
          </div>

          {/* Follow-up assessment */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="worthFollowUp"
                checked={worthFollowUp}
                onCheckedChange={(checked) => setWorthFollowUp(checked as boolean)}
              />
              <Label htmlFor="worthFollowUp" className="cursor-pointer">
                Is this deal worth following up on in the future?
              </Label>
            </div>
            
            {worthFollowUp && (
              <div className="ml-6 space-y-3">
                <Label>When should we follow up?</Label>
                <Select value={followUpTimeframe} onValueChange={setFollowUpTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FOLLOW_UP_TIMEFRAMES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Next steps */}
          <div className="space-y-3">
            <Label>What are the next steps? (if any)</Label>
            <Textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="e.g., Send thank you email, Add to newsletter, Schedule follow-up for next year's event, No action needed"
              className="min-h-[80px]"
            />
          </div>

          {/* Additional notes */}
          <div className="space-y-3">
            <Label>Any other notes or lessons learned?</Label>
            <Textarea
              value={otherNotes}
              onChange={(e) => setOtherNotes(e.target.value)}
              placeholder="Optional: Any additional context or insights that might help with future deals"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason || !specificReason}
            className="bg-red-600 hover:bg-red-700"
          >
            Mark as Lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
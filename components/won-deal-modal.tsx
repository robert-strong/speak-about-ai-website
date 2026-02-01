"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, DollarSign, User, Calendar, AlertCircle, Loader2 } from "lucide-react"

interface Deal {
  id: number
  client_name: string
  company: string
  event_title: string
  event_date: string
  event_location: string
  deal_value: number
  speaker_requested?: string
  notes?: string
}

interface WonDealModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: WonDealData) => Promise<void>
  deal: Deal | null
}

export interface WonDealData {
  deal_value: number
  speaker_name: string
  speaker_fee: number
  commission_percentage: number
  commission_amount: number
  payment_terms: string
  contract_signed: boolean
  deposit_received: boolean
  deposit_amount?: number
  win_notes?: string
}

const PAYMENT_TERMS = [
  "Net 30 after event",
  "Net 15 after event",
  "50% deposit, 50% after event",
  "100% upfront",
  "Custom terms",
]

export function WonDealModal({ isOpen, onClose, onSubmit, deal }: WonDealModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [dealValue, setDealValue] = useState("")
  const [speakerName, setSpeakerName] = useState("")
  const [speakerFee, setSpeakerFee] = useState("")
  const [commissionPercentage, setCommissionPercentage] = useState("20")
  const [commissionAmount, setCommissionAmount] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30 after event")
  const [contractSigned, setContractSigned] = useState(false)
  const [depositReceived, setDepositReceived] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [winNotes, setWinNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-fill form when deal changes
  useEffect(() => {
    if (deal) {
      const totalValue = deal.deal_value || 0
      setDealValue(totalValue.toString())
      setSpeakerName(deal.speaker_requested || "")
      // Calculate commission and speaker fee based on default 20%
      // Commission = deal_value × percentage, speaker_fee = deal_value - commission
      const percentage = 20
      const commission = totalValue * percentage / 100
      const fee = totalValue - commission
      setCommissionAmount(commission.toFixed(2))
      setSpeakerFee(fee.toFixed(2))
    }
  }, [deal])

  // Recalculate commission and speaker fee when deal value or percentage changes
  // Formula: commission = dealValue × percentage / 100, speakerFee = dealValue - commission
  useEffect(() => {
    const totalValue = parseFloat(dealValue) || 0
    const percentage = parseFloat(commissionPercentage) || 0
    const commission = totalValue * percentage / 100
    const fee = totalValue - commission
    setCommissionAmount(commission.toFixed(2))
    setSpeakerFee(fee.toFixed(2))
  }, [dealValue, commissionPercentage])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!dealValue || parseFloat(dealValue) <= 0) {
      newErrors.dealValue = "Deal value is required"
    }

    if (!speakerName.trim()) {
      newErrors.speakerName = "Speaker name is required"
    }

    // Validate commission percentage is reasonable
    const pct = parseFloat(commissionPercentage) || 0
    if (pct < 0 || pct > 100) {
      newErrors.commissionPercentage = "Commission must be between 0-100%"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const data: WonDealData = {
        deal_value: parseFloat(dealValue),
        speaker_name: speakerName,
        speaker_fee: parseFloat(speakerFee),
        commission_percentage: parseFloat(commissionPercentage),
        commission_amount: parseFloat(commissionAmount),
        payment_terms: paymentTerms,
        contract_signed: contractSigned,
        deposit_received: depositReceived,
        deposit_amount: depositReceived ? parseFloat(depositAmount) || 0 : undefined,
        win_notes: winNotes || undefined,
      }
      await onSubmit(data)
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setDealValue("")
    setSpeakerName("")
    setSpeakerFee("")
    setCommissionPercentage("20")
    setCommissionAmount("")
    setPaymentTerms("Net 30 after event")
    setContractSigned(false)
    setDepositReceived(false)
    setDepositAmount("")
    setWinNotes("")
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!deal) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle>Confirm Won Deal</DialogTitle>
              <DialogDescription>
                Please verify the details before marking this deal as won
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Deal Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">Deal Summary</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Client:</span>{" "}
              <span className="font-medium">{deal.client_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Company:</span>{" "}
              <span className="font-medium">{deal.company}</span>
            </div>
            <div>
              <span className="text-gray-500">Event:</span>{" "}
              <span className="font-medium">{deal.event_title}</span>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>{" "}
              <span className="font-medium">
                {deal.event_date ? new Date(deal.event_date).toLocaleDateString() : "TBD"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 py-4">
          {/* Financial Details */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Financial Details
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dealValue">
                  Total Deal Value <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    id="dealValue"
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="0.00"
                    className={`pl-7 ${errors.dealValue ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.dealValue && (
                  <p className="text-xs text-red-500">{errors.dealValue}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="speakerFee">
                  Speaker Fee (calculated)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    id="speakerFee"
                    type="number"
                    value={speakerFee}
                    readOnly
                    placeholder="0.00"
                    className="pl-7 bg-gray-50"
                  />
                </div>
                <p className="text-xs text-gray-500">= Deal Value - Commission</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissionPercentage">Commission %</Label>
                <div className="relative">
                  <Input
                    id="commissionPercentage"
                    type="number"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(e.target.value)}
                    placeholder="20"
                    className="pr-7"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Commission Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    value={commissionAmount}
                    readOnly
                    className="pl-7 bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Speaker Details */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Speaker Details
            </h4>

            <div className="space-y-2">
              <Label htmlFor="speakerName">
                Speaker Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="speakerName"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                placeholder="Enter speaker name"
                className={errors.speakerName ? "border-red-500" : ""}
              />
              {errors.speakerName && (
                <p className="text-xs text-red-500">{errors.speakerName}</p>
              )}
            </div>
          </div>

          {/* Payment & Contract Status */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Payment & Contract Status
            </h4>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contractSigned"
                  checked={contractSigned}
                  onCheckedChange={(checked) => setContractSigned(checked as boolean)}
                />
                <Label htmlFor="contractSigned" className="cursor-pointer">
                  Contract has been signed
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="depositReceived"
                  checked={depositReceived}
                  onCheckedChange={(checked) => setDepositReceived(checked as boolean)}
                />
                <Label htmlFor="depositReceived" className="cursor-pointer">
                  Deposit has been received
                </Label>
              </div>

              {depositReceived && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <Input
                      id="depositAmount"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-7 w-48"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="winNotes">Notes (optional)</Label>
            <Textarea
              id="winNotes"
              value={winNotes}
              onChange={(e) => setWinNotes(e.target.value)}
              placeholder="Any additional notes about this win..."
              className="min-h-[80px]"
            />
          </div>

          {/* Warning if contract not signed */}
          {!contractSigned && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Contract not signed</p>
                <p className="text-yellow-700">
                  You can still mark this deal as won, but make sure to follow up on getting the contract signed.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm & Mark as Won
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

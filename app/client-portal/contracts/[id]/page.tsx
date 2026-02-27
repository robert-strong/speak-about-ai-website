"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft, Calendar, MapPin, DollarSign, Users,
  Loader2, AlertCircle, CheckCircle, FileText, Clock
} from "lucide-react"
import { ContractPDFDownload } from "@/components/contract-pdf-download"

interface ContractDetail {
  id: number
  contract_number: string
  title: string
  status: string
  event_title: string
  event_date: string
  event_location: string
  fee_amount: number
  speaker_name: string
  created_at: string
  sent_at: string
  signed_at: string
  signatures: Record<string, { signed: boolean; signed_at: string }>
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasSignedPdf, setHasSignedPdf] = useState(false)

  const contractId = params.id as string

  useEffect(() => {
    fetchContract()
  }, [contractId])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("clientToken")
      if (!token) {
        router.push("/client-portal/login")
        return
      }

      const response = await fetch("/api/clients/contracts", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        localStorage.removeItem("clientToken")
        router.push("/client-portal/login")
        return
      }

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      const found = result.contracts?.find(
        (c: any) => c.id === parseInt(contractId, 10)
      )

      if (!found) {
        setError("Contract not found")
        return
      }

      setContract(found)

      // Check if signed PDF exists
      const pdfResponse = await fetch(`/api/clients/contracts/${contractId}/pdf`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
      setHasSignedPdf(pdfResponse.ok)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contract")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBD"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/client-portal/contracts")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Contracts
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Contract not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isFullyExecuted = contract.status === "fully_executed"

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/client-portal/contracts")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Contracts
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {contract.event_title || contract.title}
          </h1>
          <p className="text-gray-500">Contract #{contract.contract_number}</p>
        </div>
        <Badge
          className={
            isFullyExecuted
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          }
        >
          {isFullyExecuted ? "Fully Executed" : contract.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Contract Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Speaker:</span>
              <span className="font-medium">{contract.speaker_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Date:</span>
              <span className="font-medium">{formatDate(contract.event_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Location:</span>
              <span className="font-medium">{contract.event_location || "TBD"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Fee:</span>
              <span className="font-medium">{formatCurrency(contract.fee_amount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Signing Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <div>
                <span className="text-gray-500">Created:</span>{" "}
                <span className="font-medium">{formatDate(contract.created_at)}</span>
              </div>
            </div>
            {contract.sent_at && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div>
                  <span className="text-gray-500">Sent:</span>{" "}
                  <span className="font-medium">{formatDate(contract.sent_at)}</span>
                </div>
              </div>
            )}
            {contract.signatures?.client && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <div>
                  <span className="text-gray-500">Client signed:</span>{" "}
                  <span className="font-medium">{formatDate(contract.signatures.client.signed_at)}</span>
                </div>
              </div>
            )}
            {contract.signatures?.speaker && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <div>
                  <span className="text-gray-500">Agent signed:</span>{" "}
                  <span className="font-medium">{formatDate(contract.signatures.speaker.signed_at)}</span>
                </div>
              </div>
            )}
            {isFullyExecuted && (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-700">Fully Executed</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Download Section */}
      {isFullyExecuted && hasSignedPdf && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Signed Contract</h3>
                <p className="text-sm text-gray-500">
                  Download or print your fully executed contract with all signatures.
                </p>
              </div>
              <ContractPDFDownload
                contractId={contract.id}
                contractNumber={contract.contract_number}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isFullyExecuted && !hasSignedPdf && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The signed PDF is being generated. Please check back shortly.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

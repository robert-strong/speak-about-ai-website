"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText, Calendar, MapPin, DollarSign, Users, PenTool,
  Download, Loader2, AlertCircle, CheckCircle, Clock, ArrowRight
} from "lucide-react"

interface PortalContract {
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
  client_has_signed: boolean
  speaker_has_signed: boolean
  has_signed_pdf: boolean
  client_signing_token: string | null
}

interface PortalData {
  todo: PortalContract[]
  library: PortalContract[]
  stats: { pending: number; completed: number; total: number }
}

export default function ClientPortalContractsPage() {
  const router = useRouter()
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("clientToken")
      if (!token) {
        router.push("/client-portal/login")
        return
      }

      const response = await fetch("/api/clients/contracts/portal", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        localStorage.removeItem("clientToken")
        router.push("/client-portal/login")
        return
      }

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contracts")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBD"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your contracts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  const defaultTab = data.todo.length > 0 ? "action-required" : "library"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Contracts</h1>
        <p className="text-gray-500 mt-1">
          Review, sign, and download your speaking engagement contracts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Action Required</p>
                <p className="text-2xl font-bold text-orange-600">{data.stats.pending}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <PenTool className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{data.stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="action-required" className="gap-2">
            <PenTool className="w-4 h-4" />
            Action Required
            {data.todo.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {data.todo.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-2">
            <FileText className="w-4 h-4" />
            Contract Library
          </TabsTrigger>
        </TabsList>

        {/* Action Required Tab */}
        <TabsContent value="action-required" className="mt-4">
          {data.todo.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                <p className="text-gray-500 mt-1">
                  You have no contracts waiting for your signature.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.todo.map((contract) => (
                <Card key={contract.id} className="border-l-4 border-l-orange-400">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {contract.event_title || contract.title}
                          </h3>
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Awaiting Signature
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {contract.speaker_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(contract.event_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {contract.event_location || "TBD"}
                          </div>
                        </div>
                        {contract.speaker_has_signed && (
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Speaker has signed - waiting for your signature
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          if (contract.client_signing_token) {
                            router.push(`/contracts/sign/${contract.client_signing_token}`)
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
                      >
                        Review & Sign
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contract Library Tab */}
        <TabsContent value="library" className="mt-4">
          {data.library.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No completed contracts yet</h3>
                <p className="text-gray-500 mt-1">
                  Completed contracts will appear here for download.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.library.map((contract) => (
                <Card key={contract.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {contract.event_title || contract.title}
                          </h3>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Fully Executed
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {contract.speaker_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(contract.event_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {formatCurrency(contract.fee_amount)}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Contract #{contract.contract_number}
                          {contract.signed_at && ` | Signed ${formatDate(contract.signed_at)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/client-portal/contracts/${contract.id}`)}
                        >
                          View Details
                        </Button>
                        {contract.has_signed_pdf && (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/client-portal/contracts/${contract.id}`)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

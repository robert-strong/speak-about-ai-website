"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowLeft,
  Download,
  Send,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Printer,
  Mail
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin-sidebar"

interface Contract {
  id: number
  deal_id?: number
  contract_number: string
  title: string
  type: string
  status: "draft" | "sent" | "partially_signed" | "fully_executed" | "cancelled"
  terms?: string
  fee_amount?: number
  payment_terms?: string
  event_title?: string
  event_date?: string
  event_location?: string
  event_type?: string
  client_name?: string
  client_email?: string
  client_company?: string
  speaker_name?: string
  speaker_email?: string
  speaker_fee?: number
  generated_at: string
  sent_at?: string
  expires_at?: string
  completed_at?: string
  access_token: string
  created_by?: string
  updated_at: string
}

const CONTRACT_STATUSES = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-500", icon: Send },
  partially_signed: { label: "Partially Signed", color: "bg-yellow-500", icon: Clock },
  fully_executed: { label: "Fully Executed", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: XCircle }
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadContract()
  }, [id, router])

  const loadContract = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contracts/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setContract(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load contract",
          variant: "destructive"
        })
        router.push("/admin/crm")
      }
    } catch (error) {
      console.error("Error loading contract:", error)
      toast({
        title: "Error",
        description: "Failed to load contract",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendContract = async () => {
    if (!contract) return

    try {
      const response = await fetch(`/api/contracts/${contract.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract sent successfully",
        })
        loadContract()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to send contract",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error sending contract:", error)
      toast({
        title: "Error",
        description: "Failed to send contract",
        variant: "destructive"
      })
    }
  }

  const handleDownloadPDF = async () => {
    toast({
      title: "Coming Soon",
      description: "PDF download functionality will be available soon",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (!isLoggedIn || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!contract) {
    return <div className="flex items-center justify-center min-h-screen">Contract not found</div>
  }

  const StatusIcon = CONTRACT_STATUSES[contract.status].icon

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 lg:pl-64">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/crm?tab=contracts">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Contracts
              </Button>
            </Link>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Contract {contract.contract_number}
                </h1>
                <p className="text-gray-600">{contract.title}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={`${CONTRACT_STATUSES[contract.status].color} text-white px-3 py-1`}>
                  <StatusIcon className="mr-2 h-4 w-4" />
                  {CONTRACT_STATUSES[contract.status].label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contract Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{contract.client_name}</p>
                  <p className="text-sm text-gray-600">{contract.client_company}</p>
                  <p className="text-sm text-gray-600">{contract.client_email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{contract.event_title}</p>
                  <p className="text-sm text-gray-600">{formatDate(contract.event_date)}</p>
                  <p className="text-sm text-gray-600">{contract.event_location}</p>
                  <Badge variant="outline" className="text-xs">
                    {contract.event_type === "virtual" ? "Virtual" : "In-Person"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Financial Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{formatCurrency(contract.fee_amount || 0)}</p>
                  <p className="text-sm text-gray-600">Speaker Fee: {formatCurrency(contract.speaker_fee || contract.fee_amount || 0)}</p>
                  <p className="text-sm text-gray-600">{contract.payment_terms}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            {contract.status === "draft" && (
              <Button onClick={handleSendContract}>
                <Send className="mr-2 h-4 w-4" />
                Send Contract
              </Button>
            )}
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            {contract.status === "sent" && (
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Resend Email
              </Button>
            )}
          </div>

          {/* Contract Status Timeline */}
          {contract.status !== "draft" && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contract Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Contract Generated</p>
                      <p className="text-sm text-gray-600">{formatDate(contract.generated_at)}</p>
                    </div>
                  </div>
                  {contract.sent_at && (
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Contract Sent</p>
                        <p className="text-sm text-gray-600">{formatDate(contract.sent_at)}</p>
                      </div>
                    </div>
                  )}
                  {contract.status === "partially_signed" && (
                    <div className="flex items-center gap-4">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Partially Signed</p>
                        <p className="text-sm text-gray-600">Waiting for additional signatures</p>
                      </div>
                    </div>
                  )}
                  {contract.completed_at && (
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Fully Executed</p>
                        <p className="text-sm text-gray-600">{formatDate(contract.completed_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract Content */}
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Contract Terms</CardTitle>
              <CardDescription>
                Type: {contract.type} • Generated on {formatDate(contract.generated_at || new Date().toISOString())}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none contract-content"
                dangerouslySetInnerHTML={{ 
                  __html: (contract.terms || 'No terms available').replace(/\n/g, '<br />').replace(/##/g, '<h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                }}
              />
            </CardContent>
          </Card>

          {/* Expiration Warning */}
          {contract.expires_at && new Date(contract.expires_at) > new Date() && contract.status === "sent" && (
            <Alert className="mt-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Contract Expiration</AlertTitle>
              <AlertDescription>
                This contract will expire on {formatDate(contract.expires_at)} if not signed.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .admin-sidebar,
          button,
          .no-print {
            display: none !important;
          }
          
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          .lg\\:pl-64 {
            padding-left: 0 !important;
          }
          
          .contract-content {
            font-size: 12pt;
            line-height: 1.5;
          }
        }
      `}</style>
    </div>
  )
}
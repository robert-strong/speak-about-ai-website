"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Building2, 
  DollarSign,
  User,
  AlertTriangle,
  CheckCircle,
  Download,
  Printer
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Contract {
  id: number
  contract_number: string
  title: string
  status: string
  terms: string
  total_amount: number
  payment_terms?: string
  event_title: string
  event_date: string
  event_location: string
  event_type?: string
  client_name: string
  client_company?: string
  speaker_name?: string
  speaker_fee?: number
  generated_at: string
  expires_at?: string
}

export default function ContractViewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const { toast } = useToast()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadContract()
  }, [token])

  const loadContract = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contracts/public/${token}`)
      
      if (response.ok) {
        const data = await response.json()
        setContract(data)
      } else if (response.status === 404) {
        setError("Contract not found. Please check your link and try again.")
      } else {
        setError("Failed to load contract. Please try again later.")
      }
    } catch (error) {
      console.error("Error loading contract:", error)
      setError("Failed to load contract. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    toast({
      title: "Coming Soon",
      description: "PDF download functionality will be available soon",
    })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contract...</p>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-center">Contract Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">{error || "The contract you're looking for could not be found."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = contract.expires_at && new Date(contract.expires_at) < new Date()
  const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    sent: "bg-blue-500",
    partially_signed: "bg-yellow-500",
    fully_executed: "bg-green-500",
    cancelled: "bg-red-500"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Contract {contract.contract_number}
              </h1>
              <p className="text-gray-600 mt-1">{contract.title}</p>
            </div>
            <Badge className={`${statusColors[contract.status]} text-white px-3 py-1`}>
              {contract.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Expiration Warning */}
        {isExpired && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Contract Expired</AlertTitle>
            <AlertDescription className="text-red-700">
              This contract expired on {formatDate(contract.expires_at!)}. Please contact us for a new contract.
            </AlertDescription>
          </Alert>
        )}

        {/* Contract Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{contract.client_name}</p>
              {contract.client_company && (
                <p className="text-sm text-gray-600">{contract.client_company}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-sm">{contract.event_title}</p>
              <p className="text-sm text-gray-600">{formatDate(contract.event_date)}</p>
              <p className="text-sm text-gray-600">{contract.event_location}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Financial Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{formatCurrency(contract.total_amount)}</p>
              <p className="text-sm text-gray-600">{contract.payment_terms}</p>
            </CardContent>
          </Card>
        </div>

        {/* Contract Content */}
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle>Contract Terms</CardTitle>
            <CardDescription>
              Generated on {formatDate(contract.generated_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: contract.terms
                  .replace(/\n/g, '<br />')
                  .replace(/##/g, '<h3 class="text-lg font-semibold mt-6 mb-3">')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This is a read-only view of the contract.</p>
          {contract.status === 'sent' && !isExpired && (
            <p>If you need to sign this contract, please use the signing link provided in your email.</p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print,
          button {
            display: none !important;
          }
          
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          .prose {
            font-size: 12pt;
            line-height: 1.5;
          }
          
          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
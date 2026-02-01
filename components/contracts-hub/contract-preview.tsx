"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  Send,
  Eye,
  FileText,
  Calendar,
  User,
  Building,
  DollarSign,
  MapPin,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  CheckCircle,
  Printer,
  Share2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { processTemplate, defaultContractTemplates } from "@/lib/contract-templates"
import ReactMarkdown from 'react-markdown'

interface ContractPreviewProps {
  contractId?: number | null
}

interface ContractData {
  id: number
  contract_number: string
  title: string
  status: string
  template_id: string
  contract_data: Record<string, any>
  client_name: string
  client_email: string
  speaker_name?: string
  speaker_email?: string
  event_title: string
  event_date: string
  event_location: string
  total_amount: number
  created_at: string
  sent_at?: string
  executed_at?: string
  signatures?: {
    client?: {
      signed: boolean
      signed_at?: string
      signer_name?: string
    }
    speaker?: {
      signed: boolean
      signed_at?: string
      signer_name?: string
    }
  }
}

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  pending_review: { label: "Pending Review", color: "bg-yellow-500", icon: Clock },
  sent_for_signature: { label: "Sent for Signature", color: "bg-blue-500", icon: Send },
  partially_signed: { label: "Partially Signed", color: "bg-orange-500", icon: Clock },
  fully_executed: { label: "Fully Executed", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: AlertTriangle }
}

export function ContractPreview({ contractId }: ContractPreviewProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [contract, setContract] = useState<ContractData | null>(null)
  const [processedContent, setProcessedContent] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (contractId) {
      loadContract(contractId)
    }
  }, [contractId])

  const loadContract = async (id: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contracts/${id}`)
      if (response.ok) {
        const data = await response.json()
        setContract(data)
        
        // Process the template with contract values
        const template = defaultContractTemplates.find(t => t.id === (data.template_id || 'standard-speaker-agreement'))
        if (template) {
          const content = processTemplate(template, data.contract_data || {})
          setProcessedContent(content)
        }
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

  const handleSendForSignature = async () => {
    if (!contract) return
    
    try {
      const response = await fetch(`/api/contracts/${contract.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract sent for signature"
        })
        loadContract(contract.id)
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

  const handleDownload = () => {
    if (!contract) return
    window.open(`/api/contracts/${contract.id}/download`, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  const copySigningLink = async (type: 'client' | 'speaker') => {
    if (!contract) return
    
    const link = `${window.location.origin}/contracts/sign/${contract.id}/${type}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    
    toast({
      title: "Success",
      description: `${type === 'client' ? 'Client' : 'Speaker'} signing link copied to clipboard`
    })
  }

  const shareContract = async () => {
    if (!contract) return
    
    const url = `${window.location.origin}/contracts/view/${contract.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: contract.title,
          text: `Contract: ${contract.contract_number}`,
          url: url
        })
      } catch (error) {
        console.log('Share failed:', error)
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Success",
        description: "Contract link copied to clipboard"
      })
    }
  }

  if (!contractId) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contract Selected</h3>
        <p className="text-gray-500">Select a contract from the list or create a new one to preview</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading contract preview...</span>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Contract Not Found</h3>
        <p className="text-gray-500">The requested contract could not be loaded</p>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[contract.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{contract.title}</h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-gray-600">Contract #{contract.contract_number}</span>
            <Badge className={`${statusConfig.color} text-white`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          {contract.status === 'draft' && (
            <Button onClick={handleSendForSignature} className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Send for Signature
            </Button>
          )}
          
          {['sent_for_signature', 'partially_signed'].includes(contract.status) && (
            <>
              <Button variant="outline" onClick={() => copySigningLink('client')}>
                <Copy className="w-4 h-4 mr-2" />
                Client Link
              </Button>
              {contract.speaker_name && (
                <Button variant="outline" onClick={() => copySigningLink('speaker')}>
                  <Copy className="w-4 h-4 mr-2" />
                  Speaker Link
                </Button>
              )}
            </>
          )}
          
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          
          <Button variant="outline" onClick={shareContract}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm">Client</span>
              </div>
              <p className="font-medium">{contract.client_name}</p>
              <p className="text-sm text-gray-500">{contract.client_email}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm">Speaker</span>
              </div>
              <p className="font-medium">{contract.speaker_name || 'TBD'}</p>
              {contract.speaker_email && (
                <p className="text-sm text-gray-500">{contract.speaker_email}</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Event Date</span>
              </div>
              <p className="font-medium">
                {new Date(contract.event_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Contract Value</span>
              </div>
              <p className="font-medium">${contract.total_amount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Status */}
      {contract.status !== 'draft' && contract.signatures && (
        <Card>
          <CardHeader>
            <CardTitle>Signature Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    contract.signatures.client?.signed ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {contract.signatures.client?.signed ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Client Signature</p>
                    <p className="text-sm text-gray-500">
                      {contract.signatures.client?.signed 
                        ? `Signed by ${contract.signatures.client.signer_name} on ${new Date(contract.signatures.client.signed_at!).toLocaleDateString()}`
                        : 'Pending signature'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {contract.speaker_name && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      contract.signatures.speaker?.signed ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {contract.signatures.speaker?.signed ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Speaker Signature</p>
                      <p className="text-sm text-gray-500">
                        {contract.signatures.speaker?.signed 
                          ? `Signed by ${contract.signatures.speaker.signer_name} on ${new Date(contract.signatures.speaker.signed_at!).toLocaleDateString()}`
                          : 'Pending signature'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Document */}
      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle>Contract Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray max-w-none">
            <ReactMarkdown>{processedContent}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
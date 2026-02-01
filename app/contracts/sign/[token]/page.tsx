"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertCircle, FileText, Calendar, MapPin, DollarSign, Users, PenTool, RotateCcw } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"
import { useToast } from "@/hooks/use-toast"

interface Contract {
  id: number
  contract_number: string
  title: string
  status: string
  terms: string
  event_title: string
  event_date: string
  client_name: string
  speaker_name?: string
  total_amount: number
}

interface Signature {
  id: number
  signer_type: "client" | "speaker" | "admin"
  signer_name: string
  signed_at: string
}

interface ContractData {
  contract: Contract
  signer_type: "client" | "speaker" | "admin"
  signatures: Signature[]
  can_sign: boolean
}

export default function ContractSigningPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const signatureRef = useRef<SignatureCanvas>(null)
  
  const [contractData, setContractData] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [showSignatureForm, setShowSignatureForm] = useState(false)
  
  const [formData, setFormData] = useState({
    signer_name: "",
    signer_email: "",
    signer_title: ""
  })

  const token = params.token as string

  useEffect(() => {
    loadContractData()
  }, [token])

  const loadContractData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/contracts/sign/${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load contract')
      }

      setContractData(data)
      
      // Pre-fill name based on signer type
      if (data.signer_type === 'client') {
        setFormData(prev => ({ ...prev, signer_name: data.contract.client_name }))
      } else if (data.signer_type === 'speaker') {
        setFormData(prev => ({ ...prev, signer_name: data.contract.speaker_name || '' }))
      }
    } catch (error) {
      console.error('Error loading contract:', error)
      setError(error instanceof Error ? error.message : 'Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  const clearSignature = () => {
    signatureRef.current?.clear()
  }

  const handleSubmitSignature = async () => {
    if (!contractData || !signatureRef.current) return

    // Validate form
    if (!formData.signer_name || !formData.signer_email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    // Validate signature
    if (signatureRef.current.isEmpty()) {
      toast({
        title: "Error", 
        description: "Please provide your signature",
        variant: "destructive"
      })
      return
    }

    try {
      setSigning(true)
      
      const signatureData = signatureRef.current.toDataURL()
      
      const response = await fetch(`/api/contracts/sign/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signer_name: formData.signer_name,
          signer_email: formData.signer_email,
          signer_title: formData.signer_title,
          signature_data: signatureData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit signature')
      }

      toast({
        title: "Success",
        description: "Your signature has been submitted successfully!"
      })

      // Reload contract data to show updated status
      await loadContractData()
      setShowSignatureForm(false)
    } catch (error) {
      console.error('Error submitting signature:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit signature",
        variant: "destructive"
      })
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contract...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Access Error</CardTitle>
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
              variant="outline"
            >
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contractData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Contract Not Found</CardTitle>
            <CardDescription>The requested contract could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { contract, signer_type, signatures, can_sign } = contractData
  
  const hasClientSignature = signatures.some(s => s.signer_type === 'client')
  const hasSpeakerSignature = signatures.some(s => s.signer_type === 'speaker')
  const isFullyExecuted = hasClientSignature && hasSpeakerSignature

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Signing</h1>
          <p className="text-gray-600">
            {signer_type === 'client' ? 'Client' : signer_type === 'speaker' ? 'Speaker' : 'Admin'} Signature Required
          </p>
        </div>

        {/* Contract Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{contract.title}</CardTitle>
                <CardDescription>Contract #{contract.contract_number}</CardDescription>
              </div>
              <Badge 
                variant={isFullyExecuted ? "default" : can_sign ? "secondary" : "outline"}
                className={
                  isFullyExecuted ? "bg-green-500" : 
                  can_sign ? "bg-blue-500" : "bg-gray-500"
                }
              >
                {isFullyExecuted ? "Fully Executed" : 
                 can_sign ? "Awaiting Your Signature" : "Awaiting Other Signatures"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Event Date</p>
                  <p className="font-medium">{new Date(contract.event_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Contract Value</p>
                  <p className="font-medium">${contract.total_amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium">{contract.client_name}</p>
                </div>
              </div>
              {contract.speaker_name && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Speaker</p>
                    <p className="font-medium">{contract.speaker_name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Signature Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Signature Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${hasClientSignature ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {hasClientSignature ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <PenTool className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Client Signature</p>
                    {hasClientSignature ? (
                      <p className="text-sm text-green-600">
                        Signed by {signatures.find(s => s.signer_type === 'client')?.signer_name} on{' '}
                        {new Date(signatures.find(s => s.signer_type === 'client')?.signed_at || '').toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Pending</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${hasSpeakerSignature ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {hasSpeakerSignature ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <PenTool className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Speaker Signature</p>
                    {hasSpeakerSignature ? (
                      <p className="text-sm text-green-600">
                        Signed by {signatures.find(s => s.signer_type === 'speaker')?.signer_name} on{' '}
                        {new Date(signatures.find(s => s.signer_type === 'speaker')?.signed_at || '').toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Pending</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Form */}
        {can_sign && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Signature Required</CardTitle>
              <CardDescription>
                Please review the contract terms and provide your digital signature below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showSignatureForm ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-6">
                    By clicking the button below, you acknowledge that you have read, understood, and agree to the terms of this contract.
                  </p>
                  <Button 
                    onClick={() => setShowSignatureForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <PenTool className="w-5 h-5 mr-2" />
                    Proceed to Sign Contract
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signer_name">Full Name *</Label>
                      <Input
                        id="signer_name"
                        value={formData.signer_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, signer_name: e.target.value }))}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signer_email">Email Address *</Label>
                      <Input
                        id="signer_email"
                        type="email"
                        value={formData.signer_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, signer_email: e.target.value }))}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="signer_title">Title/Position (Optional)</Label>
                      <Input
                        id="signer_title"
                        value={formData.signer_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, signer_title: e.target.value }))}
                        placeholder="e.g., CEO, Event Manager, etc."
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-medium mb-4 block">Digital Signature *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          width: 500,
                          height: 200,
                          className: 'signature-canvas bg-white rounded border w-full'
                        }}
                        backgroundColor="white"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-sm text-gray-600">Sign above using your mouse, trackpad, or touch screen</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={clearSignature}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      By signing this contract, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions outlined in this agreement.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleSubmitSignature}
                      disabled={signing}
                      className="bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {signing ? "Submitting..." : "Submit Signature"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSignatureForm(false)}
                      disabled={signing}
                      size="lg"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contract Terms Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Terms</CardTitle>
            <CardDescription>Full contract details and terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {contract.terms}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
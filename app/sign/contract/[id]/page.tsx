"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContractData {
  id: number
  contract_number: string
  event_title: string
  event_date: string
  event_location: string
  client_company: string
  client_signer_email: string
  client_signer_name: string
  speaker_name: string
  total_amount: number
  content: string
  status: string
}

export default function ContractSigningPage() {
  const { toast } = useToast()
  const params = useParams()
  const searchParams = useSearchParams()
  const contractId = params.id as string
  const token = searchParams.get("token")
  
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [signing, setSigning] = useState(false)
  const [contract, setContract] = useState<ContractData | null>(null)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"verify" | "review" | "sign" | "complete">("verify")
  
  const [verificationEmail, setVerificationEmail] = useState("")
  const [signatureData, setSignatureData] = useState({
    signerName: "",
    signerTitle: "",
    agreedToTerms: false
  })

  useEffect(() => {
    if (!token) {
      setError("Invalid signing link. Please use the link from your email.")
      setLoading(false)
      return
    }
    
    fetchContract()
  }, [contractId, token])

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/signing?token=${token}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to load contract")
      }
      
      const contractData = await response.json()
      setContract(contractData)
      setVerificationEmail(contractData.client_signer_email)
      setSignatureData(prev => ({
        ...prev,
        signerName: contractData.client_signer_name
      }))
      
      // Check if already signed
      if (contractData.status === "fully_executed" || contractData.status === "client_signed") {
        setStep("complete")
      }
    } catch (error) {
      console.error("Error loading contract:", error)
      setError(error instanceof Error ? error.message : "Failed to load contract")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!verificationEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      })
      return
    }

    setVerifying(true)
    try {
      const response = await fetch(`/api/contracts/${contractId}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: verificationEmail,
          token 
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Email verification failed")
      }

      setStep("review")
      toast({
        title: "Email Verified",
        description: "You can now review and sign the contract"
      })
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Unable to verify email",
        variant: "destructive"
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleSign = async () => {
    if (!signatureData.signerName || !signatureData.signerTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and title",
        variant: "destructive"
      })
      return
    }

    if (!signatureData.agreedToTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the terms to proceed",
        variant: "destructive"
      })
      return
    }

    setSigning(true)
    try {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signerName: signatureData.signerName,
          signerTitle: signatureData.signerTitle,
          signerType: "client"
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Signing failed")
      }

      setStep("complete")
      toast({
        title: "Success!",
        description: "Contract signed successfully"
      })
    } catch (error) {
      toast({
        title: "Signing Failed",
        description: error instanceof Error ? error.message : "Unable to sign contract",
        variant: "destructive"
      })
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/speak-about-ai-logo.png" 
            alt="Speak About AI" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-gray-900">Contract Signing Portal</h1>
        </div>

        {step === "verify" && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Verify Your Email</CardTitle>
              <CardDescription>
                Please confirm your email address to proceed with signing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={verificationEmail}
                  onChange={(e) => setVerificationEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <Alert>
                <AlertDescription>
                  This should match the email address where you received the signing link
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleVerifyEmail}
                disabled={verifying}
                className="w-full"
              >
                {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "review" && contract && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Contract</CardTitle>
                <CardDescription>
                  Please carefully review the contract before signing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-2">Contract Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Contract #:</strong> {contract.contract_number}</p>
                    <p><strong>Event:</strong> {contract.event_title}</p>
                    <p><strong>Date:</strong> {new Date(contract.event_date).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> {contract.event_location}</p>
                    <p><strong>Speaker:</strong> {contract.speaker_name}</p>
                    <p><strong>Total Amount:</strong> ${contract.total_amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Contract Content */}
                <div className="border rounded-lg p-6 max-h-96 overflow-y-auto bg-white">
                  <div dangerouslySetInnerHTML={{ __html: contract.content }} />
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="signerName">Your Name</Label>
                    <Input
                      id="signerName"
                      value={signatureData.signerName}
                      onChange={(e) => setSignatureData({...signatureData, signerName: e.target.value})}
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signerTitle">Your Title</Label>
                    <Input
                      id="signerTitle"
                      value={signatureData.signerTitle}
                      onChange={(e) => setSignatureData({...signatureData, signerTitle: e.target.value})}
                      placeholder="e.g., CEO, Director of Events"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="agree"
                      checked={signatureData.agreedToTerms}
                      onChange={(e) => setSignatureData({...signatureData, agreedToTerms: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="agree" className="text-sm">
                      I have read and agree to the terms of this contract
                    </Label>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Print Contract
                  </Button>
                  <Button
                    onClick={handleSign}
                    disabled={signing || !signatureData.agreedToTerms}
                    className="flex-1"
                  >
                    {signing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "complete" && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Contract Signed Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Thank you for signing the contract. You will receive a confirmation email with a copy of the fully executed contract.
                </AlertDescription>
              </Alert>
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Contract #{contract?.contract_number} has been signed.
                </p>
                <Button variant="outline" onClick={() => window.close()}>
                  Close Window
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
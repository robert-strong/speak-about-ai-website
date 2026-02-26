"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Loader2,
  Phone,
  Mail,
  RefreshCw,
  Building2,
  CreditCard
} from "lucide-react"

interface BankInfo {
  bankName: string
  routingNumber: string
  accountNumber: string
  accountType: string
  wireRoutingNumber?: string
  swiftCode?: string
}

export default function SecureBankInfoPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)

  const [step, setStep] = useState<'loading' | 'verify' | 'otp' | 'view' | 'error'>('loading')
  const [error, setError] = useState<string>("")
  const [clientName, setClientName] = useState<string>("")
  const [maskedEmail, setMaskedEmail] = useState<string>("")
  const [otp, setOtp] = useState<string>("")
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    validateToken()
  }, [token])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/secure-bank-info/${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid link")
        setStep('error')
        return
      }

      setClientName(data.clientName || "")
      setMaskedEmail(data.maskedEmail)
      setStep('verify')
    } catch (err) {
      setError("Failed to validate link")
      setStep('error')
    }
  }

  const sendOtp = async () => {
    try {
      setOtpSending(true)
      setError("")

      const response = await fetch(`/api/secure-bank-info/${token}/send-otp`, {
        method: 'POST'
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to send code")
        return
      }

      setStep('otp')
      setCountdown(60) // 60 second cooldown for resend
    } catch (err) {
      setError("Failed to send verification code")
    } finally {
      setOtpSending(false)
    }
  }

  const verifyOtp = async () => {
    try {
      setOtpVerifying(true)
      setError("")

      const response = await fetch(`/api/secure-bank-info/${token}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to verify code")
        return
      }

      setBankInfo(data.bankInfo)
      setStep('view')
    } catch (err) {
      setError("Failed to verify code")
    } finally {
      setOtpVerifying(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Loading state
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validating secure link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500">
              Please contact the sender for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verification step
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Secure Bank Details</CardTitle>
            <CardDescription>
              {clientName ? `Hello ${clientName}, ` : ""}
              Verify your identity to view bank details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <p className="text-blue-800">
                For your security, we'll send a one-time verification code to{" "}
                <strong>{maskedEmail}</strong>
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={sendOtp}
              disabled={otpSending}
              className="w-full"
              size="lg"
            >
              {otpSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Verification Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // OTP entry step
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Enter Verification Code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to {maskedEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>

            <Button
              onClick={verifyOtp}
              disabled={otp.length !== 6 || otpVerifying}
              className="w-full"
              size="lg"
            >
              {otpVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & View Bank Details"
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={sendOtp}
                disabled={countdown > 0 || otpSending}
              >
                {countdown > 0 ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend code in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend code
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // View bank info step
  if (step === 'view' && bankInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Security Warning */}
          <Alert className="border-amber-300 bg-amber-50">
            <Phone className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Security Verification Required</AlertTitle>
            <AlertDescription className="text-amber-700">
              <strong>IMPORTANT:</strong> Before making any transfer, please verify these details
              via a phone call to the sender. Never rely solely on email for bank details.
            </AlertDescription>
          </Alert>

          {/* Bank Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Bank Details
                  </CardTitle>
                  <CardDescription>Speak About AI Payment Information</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Name */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-500 block mb-1">Bank Name</label>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg">{bankInfo.bankName}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(bankInfo.bankName, 'bankName')}
                  >
                    {copiedField === 'bankName' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Account Type */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-500 block mb-1">Account Type</label>
                <span className="font-medium">{bankInfo.accountType}</span>
              </div>

              {/* Routing Number */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-sm text-blue-600 block mb-1">
                  <CreditCard className="h-3 w-3 inline mr-1" />
                  ACH Routing Number
                </label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-bold tracking-wider">
                    {bankInfo.routingNumber}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(bankInfo.routingNumber, 'routingNumber')}
                    className="border-blue-300 hover:bg-blue-100"
                  >
                    {copiedField === 'routingNumber' ? (
                      <>
                        <Check className="h-4 w-4 text-green-600 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Account Number */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-sm text-blue-600 block mb-1">
                  <CreditCard className="h-3 w-3 inline mr-1" />
                  Account Number
                </label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-bold tracking-wider">
                    {bankInfo.accountNumber}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(bankInfo.accountNumber, 'accountNumber')}
                    className="border-blue-300 hover:bg-blue-100"
                  >
                    {copiedField === 'accountNumber' ? (
                      <>
                        <Check className="h-4 w-4 text-green-600 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Wire Routing Number */}
              {bankInfo.wireRoutingNumber && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <label className="text-sm text-purple-600 block mb-1">
                    Wire Routing Number
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-bold tracking-wider">
                      {bankInfo.wireRoutingNumber}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(bankInfo.wireRoutingNumber!, 'wireRoutingNumber')}
                      className="border-purple-300 hover:bg-purple-100"
                    >
                      {copiedField === 'wireRoutingNumber' ? (
                        <>
                          <Check className="h-4 w-4 text-green-600 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SWIFT Code */}
              {bankInfo.swiftCode && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <label className="text-sm text-purple-600 block mb-1">
                    SWIFT/BIC Code (International)
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-bold tracking-wider">
                      {bankInfo.swiftCode}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(bankInfo.swiftCode!, 'swiftCode')}
                      className="border-purple-300 hover:bg-purple-100"
                    >
                      {copiedField === 'swiftCode' ? (
                        <>
                          <Check className="h-4 w-4 text-green-600 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* One-time view notice */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>One-Time Access</AlertTitle>
            <AlertDescription>
              This page will not be accessible after you leave. Please save this information
              securely if needed.
            </AlertDescription>
          </Alert>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>Speak About AI - Secure Payment Portal</p>
            <p className="mt-1">This link has now been used and will expire.</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Users, Building2, Mail, Shield, ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ClientPortalLogin() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'verification'>('email')
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [devCode, setDevCode] = useState("")

  // Check if already logged in
  useEffect(() => {
    const isClientLoggedIn = localStorage.getItem("clientLoggedIn")
    const sessionToken = localStorage.getItem("clientSessionToken")
    if (isClientLoggedIn && sessionToken) {
      router.push("/portal/dashboard")
    }
  }, [router])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.requiresVerification) {
        setClientInfo(data.clientInfo)
        setStep('verification')
        // In development, show the verification code
        if (data.verificationCode) {
          setDevCode(data.verificationCode)
        }
      } else if (data.success) {
        // Direct login (shouldn't happen in this flow)
        localStorage.setItem("clientLoggedIn", "true")
        localStorage.setItem("clientSessionToken", data.sessionToken)
        localStorage.setItem("clientUser", JSON.stringify(data.user))
        router.push("/portal/dashboard")
      } else {
        setError(data.error || "Authentication failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, verificationCode }),
      })

      const data = await response.json()

      if (data.success) {
        // Store authentication data
        localStorage.setItem("clientLoggedIn", "true")
        localStorage.setItem("clientSessionToken", data.sessionToken)
        localStorage.setItem("clientUser", JSON.stringify(data.user))
        localStorage.setItem("clientProjects", JSON.stringify(data.projects))
        
        // Redirect to dashboard
        router.push("/portal/dashboard")
      } else {
        setError(data.error || "Invalid verification code")
      }
    } catch (error) {
      console.error("Verification error:", error)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/portal">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portal Home
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Portal</h1>
          <p className="text-gray-600">Access your speaking engagements and event details</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              {step === 'email' ? 'Client Access' : 'Verify Access'}
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? 'Enter your logistics contact email to access your events'
                : `We've generated a verification code for ${email}`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700" 
                  disabled={isLoading}
                >
                  {isLoading ? "Checking..." : "Access My Events"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Client Info */}
                {clientInfo && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{clientInfo.name}</p>
                        {clientInfo.company && (
                          <p className="text-sm text-gray-600">{clientInfo.company}</p>
                        )}
                        <p className="text-sm text-blue-600 mt-1">
                          {clientInfo.projectCount} active event{clientInfo.projectCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Development Code Display */}
                {devCode && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Development Mode:</strong> Your verification code is <strong>{devCode}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleVerificationSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Verification Code</Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      placeholder="Enter 6-character code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      required
                      disabled={isLoading}
                      className="h-12 text-center font-mono text-lg tracking-widest"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setStep('email')
                        setError("")
                        setVerificationCode("")
                      }}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700" 
                      disabled={isLoading || verificationCode.length !== 6}
                    >
                      {isLoading ? "Verifying..." : "Access Portal"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Info Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                <p className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  Secure access for event participants
                </p>
                <p>Contact your event coordinator for assistance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
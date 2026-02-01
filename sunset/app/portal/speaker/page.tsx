"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Mail, ArrowRight, ArrowLeft, Lock } from "lucide-react"

export default function SpeakerPortalLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("speakerToken")
    if (token) {
      router.push("/speakers/dashboard")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/speakers/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store auth token using new system
        localStorage.setItem("speakerToken", data.token)
        localStorage.setItem("speakerEmail", data.email)
        localStorage.setItem("speakerId", data.speakerId)
        localStorage.setItem("speakerName", data.speakerName)
        
        // Also keep old storage for backward compatibility
        localStorage.setItem("speakerLoggedIn", "true")
        localStorage.setItem("speakerSessionToken", data.token)
        
        router.push("/speakers/dashboard")
      } else {
        setError(data.error || "Invalid email or password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center px-4">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E68C6] rounded-full mb-4">
            <Mic className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Speaker Portal</h1>
          <p className="text-gray-600">Manage your speaker profile and bookings</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle>Speaker Login</CardTitle>
            <CardDescription>
              Sign in to access your speaker profile and event information
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="speaker@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-[#1E68C6] hover:bg-blue-700" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {/* Password Reset Notice */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-medium mb-2">
                🔐 First time logging in?
              </p>
              <p className="text-xs text-amber-700 mb-3">
                If you're an existing speaker (like noah@speakabout.ai) but haven't set a password yet, you'll need to reset your password first.
              </p>
              <Link href="/portal/speaker-reset-password">
                <Button variant="outline" size="sm" className="w-full">
                  <Lock className="mr-2 h-3 w-3" />
                  Set/Reset Password
                </Button>
              </Link>
            </div>

            {/* Registration Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                <p className="mb-3">Don't have a speaker account?</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/apply")}
                >
                  Apply to Speak
                </Button>
              </div>
            </div>

            {/* Forgot Password - TODO: Implement password reset */}
            {/* <div className="mt-4 text-center">
              <Link href="/speakers/forgot-password">
                <Button
                  variant="link"
                  className="text-sm text-gray-600 hover:text-[#1E68C6]"
                >
                  Forgot your password?
                </Button>
              </Link>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
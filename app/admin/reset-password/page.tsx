"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertCircle, CheckCircle, Key, Copy, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminResetPasswordPage() {
  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
    resetKey: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<{
    message: string
    newPasswordHash: string
    instructions: string[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(null)

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/admin-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          newPassword: formData.newPassword,
          resetKey: formData.resetKey,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess({
          message: data.message,
          newPasswordHash: data.newPasswordHash,
          instructions: data.instructions
        })
        // Clear form
        setFormData({
          email: "",
          newPassword: "",
          confirmPassword: "",
          resetKey: "",
        })
      } else {
        setError(data.error || "Password reset failed")
      }
    } catch (error) {
      console.error("Reset error:", error)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (success?.newPasswordHash) {
      try {
        await navigator.clipboard.writeText(success.newPasswordHash)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <Card className="w-full max-w-2xl border-green-700 bg-gray-800">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-600 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">Password Hash Generated</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Follow the instructions below to complete the password reset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-green-900/20 border-green-700">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                {success.message}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Instructions:</h3>
              <ol className="space-y-2 text-gray-300">
                {success.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">New Password Hash (Copy this value):</Label>
              <div className="flex gap-2">
                <Input
                  value={success.newPasswordHash}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Alert className="bg-yellow-900/20 border-yellow-700">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                <strong>Important:</strong> Update your ADMIN_PASSWORD_HASH environment variable with the hash above, then restart your application.
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setSuccess(null)
                  setError("")
                }}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Reset Another Password
              </Button>
              <Link href="/admin" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <Card className="w-full max-w-md border-gray-700 bg-gray-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-orange-600 rounded-full">
              <Key className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">Reset Admin Password</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Generate a new password hash for admin access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resetKey" className="text-gray-300">Reset Key</Label>
              <Input
                id="resetKey"
                type="password"
                placeholder="Enter your reset key"
                value={formData.resetKey}
                onChange={(e) => setFormData({ ...formData, resetKey: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                This is the ADMIN_RESET_KEY from your environment variables
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700" 
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate New Password Hash"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <Link href="/admin">
              <Button variant="ghost" className="w-full text-gray-300 hover:bg-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertCircle, Key, ArrowLeft, Lock, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState("")

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [loginPassword, setLoginPassword] = useState("") // the password used to log in (auto-filled as current)
  const [sessionToken, setSessionToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Check if already logged in
  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    const sessionToken = localStorage.getItem("adminSessionToken")
    if (isAdminLoggedIn && sessionToken) {
      router.push("/admin/manage")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Check if user must change password
        if (data.user.must_change_password) {
          // Store token but don't redirect — show change password form
          setSessionToken(data.sessionToken)
          setLoginPassword(formData.password)
          localStorage.setItem("adminLoggedIn", "true")
          localStorage.setItem("adminSessionToken", data.sessionToken)
          localStorage.setItem("adminUser", JSON.stringify(data.user))
          setShowChangePassword(true)
          setError("")
          return
        }

        // Normal login — store auth data and redirect
        localStorage.setItem("adminLoggedIn", "true")
        localStorage.setItem("adminSessionToken", data.sessionToken)
        localStorage.setItem("adminUser", JSON.stringify(data.user))

        // Redirect to dashboard
        router.push("/admin/manage")
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setForgotSuccess("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      })

      const data = await response.json()

      if (response.status === 429) {
        setError(data.error || "Too many requests. Please try again later.")
      } else {
        setForgotSuccess(data.message)
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          currentPassword: loginPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push("/admin/manage")
      } else {
        setError(data.error || "Failed to change password")
      }
    } catch (error) {
      console.error("Change password error:", error)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ---- Change Password Interstitial ----
  if (showChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <Card className="w-full max-w-md border-gray-700 bg-gray-800">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-600 rounded-full">
                <Lock className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">Set New Password</CardTitle>
            <CardDescription className="text-center text-gray-400">
              You must set a new password before continuing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>

              <p className="text-xs text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase, and a number.
              </p>

              {error && (
                <div className="flex items-center space-x-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Set New Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---- Forgot Password Form ----
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <Card className="w-full max-w-md border-gray-700 bg-gray-800">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-600 rounded-full">
                <Mail className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">Forgot Password</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your email to receive a temporary password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 bg-green-900/30 border border-green-700 rounded-lg p-4">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-green-300 text-sm">{forgotSuccess}</p>
                </div>
                <Button
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotSuccess("")
                    setForgotEmail("")
                    setError("")
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail" className="text-gray-300">Email Address</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Temporary Password"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setError("")
                    setForgotEmail("")
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---- Login Form (default) ----
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <Card className="w-full max-w-md border-gray-700 bg-gray-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">Admin Access</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Internal CRM & Deal Management System
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <button
                  type="button"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setError("")
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Access Admin Panel"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center">
              <Link href="/admin/reset-password">
                <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700">
                  <Key className="mr-2 h-4 w-4" />
                  Reset Admin Password
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

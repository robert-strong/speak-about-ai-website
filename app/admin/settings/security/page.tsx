"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { authPost } from "@/lib/auth-fetch"
import {
  KeyRound,
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
  Lock,
} from "lucide-react"

export default function SecuritySettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [saving, setSaving] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // User info
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)

    // Get user info
    const userStr = localStorage.getItem("adminUser")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserName(user.name || null)
        setUserEmail(user.email || null)
      } catch {}
    }

    setLoading(false)
  }, [router])

  // Password validation
  const passwordChecks = {
    length: newPassword.length >= 8,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    match: newPassword === confirmPassword && confirmPassword.length > 0,
  }

  const isPasswordValid = Object.values(passwordChecks).every(Boolean)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast({ title: "Error", description: "Please enter your current password", variant: "destructive" })
      return
    }

    if (!isPasswordValid) {
      toast({ title: "Error", description: "Please fix password requirements", variant: "destructive" })
      return
    }

    try {
      setSaving(true)
      const response = await authPost("/api/auth/change-password", {
        currentPassword,
        newPassword,
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: "Success", description: "Your password has been changed successfully" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        throw new Error(data.error || "Failed to change password")
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to change password", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const PasswordCheck = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-sm ${passed ? "text-green-600" : "text-gray-400"}`}>
      {passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {label}
    </div>
  )

  if (!isLoggedIn || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        <div className="p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              Account Security
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your password and security settings
            </p>
          </div>

          {/* User Info */}
          {(userName || userEmail) && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <Lock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Logged in as <strong>{userName || userEmail}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                {newPassword && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                    <PasswordCheck passed={passwordChecks.length} label="At least 8 characters" />
                    <PasswordCheck passed={passwordChecks.lowercase} label="One lowercase letter" />
                    <PasswordCheck passed={passwordChecks.uppercase} label="One uppercase letter" />
                    <PasswordCheck passed={passwordChecks.number} label="One number" />
                  </div>
                )}

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordChecks.match && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <X className="h-3 w-3" /> Passwords do not match
                    </p>
                  )}
                  {passwordChecks.match && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving || !currentPassword || !isPasswordValid}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { authGet, authPut, authPost } from "@/lib/auth-fetch"
import {
  Mail,
  Save,
  Send,
  Shield,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  Lock,
  Globe,
} from "lucide-react"

interface SmtpConfig {
  provider: string
  host: string
  port: number
  username: string
  password: string
  from_name: string
  from_email: string
  use_tls: boolean
}

export default function SmtpSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [config, setConfig] = useState<SmtpConfig>({
    provider: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    from_name: '',
    from_email: '',
    use_tls: true,
  })

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadConfig()
  }, [router])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await authGet('/api/admin/smtp-config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
        }
      }
    } catch (error) {
      console.error('Error loading SMTP config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProviderChange = (provider: string) => {
    if (provider === 'gmail') {
      setConfig(prev => ({ ...prev, provider: 'gmail', host: 'smtp.gmail.com', port: 587, use_tls: true }))
    } else if (provider === 'outlook') {
      setConfig(prev => ({ ...prev, provider: 'outlook', host: 'smtp-mail.outlook.com', port: 587, use_tls: true }))
    } else {
      setConfig(prev => ({ ...prev, provider: 'custom' }))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await authPut('/api/admin/smtp-config', { config })
      if (response.ok) {
        toast({ title: "Saved", description: "SMTP configuration updated" })
        setTestResult(null)
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: "Error", description: "Failed to save SMTP configuration", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast({ title: "Error", description: "Enter an email address to send a test to", variant: "destructive" })
      return
    }

    try {
      setTesting(true)
      setTestResult(null)
      const response = await authPost('/api/admin/smtp-config', { test_email: testEmail })
      const data = await response.json()

      if (response.ok) {
        setTestResult({ success: true, message: data.message })
      } else {
        setTestResult({ success: false, message: data.error })
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Test failed' })
    } finally {
      setTesting(false)
    }
  }

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
        <div className="p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Mail className="h-8 w-8 text-blue-600" />
              Email / SMTP Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Configure email sending for welcome emails and notifications
            </p>
          </div>

          {/* Gmail Setup Guide */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Gmail SMTP Setup</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                <li>Go to your Google Account &gt; Security &gt; 2-Step Verification (enable it if not already)</li>
                <li>Go to <strong>App passwords</strong> (search &quot;App passwords&quot; in Google Account settings)</li>
                <li>Create a new app password for &quot;Mail&quot;</li>
                <li>Copy the 16-character password and paste it below</li>
              </ol>
              <p className="text-xs mt-2 text-gray-500">
                Do NOT use your regular Gmail password. App passwords are separate and can be revoked anytime.
              </p>
            </AlertDescription>
          </Alert>

          {/* Provider Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Email Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {[
                  { id: 'gmail', label: 'Gmail', icon: '📧' },
                  { id: 'outlook', label: 'Outlook / Office 365', icon: '📬' },
                  { id: 'custom', label: 'Custom SMTP', icon: '⚙️' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      config.provider === p.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span>{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SMTP Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                SMTP Credentials
              </CardTitle>
              <CardDescription>
                {config.provider === 'gmail'
                  ? 'Enter your Gmail address and App Password'
                  : 'Enter your SMTP server details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.provider === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label>SMTP Host</Label>
                    <Input
                      value={config.host}
                      onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={config.port}
                      onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                      placeholder="587"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{config.provider === 'gmail' ? 'Gmail Address' : 'Username / Email'}</Label>
                  <Input
                    type="email"
                    value={config.username}
                    onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder={config.provider === 'gmail' ? 'you@gmail.com' : 'username@example.com'}
                  />
                </div>
                <div>
                  <Label>
                    {config.provider === 'gmail' ? 'App Password' : 'Password'}
                    <span className="text-xs text-gray-400 ml-2">(not your regular password)</span>
                  </Label>
                  <Input
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={config.provider === 'gmail' ? 'xxxx xxxx xxxx xxxx' : 'SMTP password'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* From Address */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Sender Identity
              </CardTitle>
              <CardDescription>How your emails appear to recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>From Name</Label>
                  <Input
                    value={config.from_name}
                    onChange={(e) => setConfig(prev => ({ ...prev, from_name: e.target.value }))}
                    placeholder="Speak About AI"
                  />
                </div>
                <div>
                  <Label>
                    From Email
                    <span className="text-xs text-gray-400 ml-2">(leave blank to use SMTP username)</span>
                  </Label>
                  <Input
                    type="email"
                    value={config.from_email}
                    onChange={(e) => setConfig(prev => ({ ...prev, from_email: e.target.value }))}
                    placeholder={config.username || 'you@gmail.com'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end mb-8">
            <Button onClick={handleSave} disabled={saving} size="lg" className="bg-blue-600 hover:bg-blue-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>

          {/* Test Connection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test Connection
              </CardTitle>
              <CardDescription>
                Send a test email to verify your configuration works. Save your settings first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email to send test to..."
                  className="max-w-sm"
                />
                <Button onClick={handleTest} disabled={testing} variant="outline">
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg ${
                  testResult.success
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

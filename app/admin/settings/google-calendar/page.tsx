"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { authGet, authPut, authPost } from "@/lib/auth-fetch"
import {
  Calendar,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Link2,
  Unlink,
  Zap,
  Clock,
  Video,
  RefreshCw,
} from "lucide-react"

interface CalendarConfig {
  enabled: boolean
  calendar_id: string
  calendar_name: string
  user_email: string | null
  auto_sync: boolean
  include_meet_link: boolean
  default_reminder_minutes: number
}

interface CalendarOption {
  id: string
  summary: string
  primary: boolean
}

export default function GoogleCalendarSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const [calendars, setCalendars] = useState<CalendarOption[]>([])
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [config, setConfig] = useState<CalendarConfig>({
    enabled: false,
    calendar_id: 'primary',
    calendar_name: 'Primary',
    user_email: null,
    auto_sync: false,
    include_meet_link: false,
    default_reminder_minutes: 60,
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
      const response = await authGet('/api/admin/google-calendar-config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
        }
        setConnected(data.connected)
        setConnectedEmail(data.connectedEmail)
        setCalendars(data.calendars || [])
      }
    } catch (error) {
      console.error('Error loading calendar config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await authPut('/api/admin/google-calendar-config', { config })
      if (response.ok) {
        toast({ title: "Saved", description: "Google Calendar settings updated" })
        setTestResult(null)
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      setTestResult(null)
      // Save first so the test uses the selected calendar
      await authPut('/api/admin/google-calendar-config', { config })
      const response = await authPost('/api/admin/google-calendar-config', { action: 'test' })
      const data = await response.json()
      if (response.ok) {
        setTestResult({ success: true, message: data.message })
      } else {
        setTestResult({ success: false, message: data.error })
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Connection test failed' })
    } finally {
      setTesting(false)
    }
  }

  const handleCalendarSelect = (calendarId: string) => {
    const cal = calendars.find(c => c.id === calendarId)
    setConfig(prev => ({
      ...prev,
      calendar_id: calendarId,
      calendar_name: cal?.summary || 'Primary',
    }))
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
              <Calendar className="h-8 w-8 text-blue-600" />
              Google Calendar Sync
            </h1>
            <p className="text-gray-600 mt-2">
              Sync project events from Project Management to your Google Calendar
            </p>
          </div>

          {/* Connection Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Connection Status
              </CardTitle>
              <CardDescription>
                Google Calendar uses the same OAuth connection as Gmail Sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {connected ? (
                    <>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">Connected</p>
                        <p className="text-sm text-gray-500">
                          Signed in as <span className="font-medium">{connectedEmail}</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                        <Unlink className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Not Connected</p>
                        <p className="text-sm text-gray-500">
                          Connect your Google account to enable calendar sync
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {!connected && (
                  <Button
                    variant="outline"
                    onClick={() => window.open('/api/auth/gmail', '_blank')}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect Google Account
                  </Button>
                )}
                {connected && (
                  <Button variant="ghost" size="sm" onClick={loadConfig}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {!connected && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Google Account Required</AlertTitle>
              <AlertDescription>
                You need to connect your Google account first. Go to{" "}
                <button
                  onClick={() => router.push('/admin/settings/smtp')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Email / SMTP Settings
                </button>{" "}
                and click &quot;Connect Gmail Account&quot;, or use the button above.
                This grants both email sync and calendar access.
              </AlertDescription>
            </Alert>
          )}

          {/* Enable Sync */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Calendar Sync
              </CardTitle>
              <CardDescription>
                When enabled, project events can be pushed to your Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Calendar Sync</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Allow pushing project events to Google Calendar from Project Management
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  disabled={!connected}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Auto-Sync New Projects</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Automatically create a calendar event when a new project is created with an event date
                  </p>
                </div>
                <Switch
                  checked={config.auto_sync}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_sync: checked }))}
                  disabled={!connected || !config.enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Calendar Selection */}
          {connected && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Target Calendar
                </CardTitle>
                <CardDescription>
                  Choose which Google Calendar to push project events to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calendars.length > 0 ? (
                  <div className="space-y-3">
                    <Label>Select Calendar</Label>
                    <Select
                      value={config.calendar_id}
                      onValueChange={handleCalendarSelect}
                      disabled={!config.enabled}
                    >
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Select a calendar" />
                      </SelectTrigger>
                      <SelectContent>
                        {calendars.map((cal) => (
                          <SelectItem key={cal.id} value={cal.id}>
                            {cal.summary} {cal.primary && "(Primary)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Currently selected: <span className="font-medium">{config.calendar_name}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No calendars found. Click Refresh above to reload your calendar list.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Event Defaults */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Event Defaults
              </CardTitle>
              <CardDescription>
                Default settings applied to new calendar events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Include Google Meet Link</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Automatically add a Google Meet video conference link to events
                  </p>
                </div>
                <Switch
                  checked={config.include_meet_link}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, include_meet_link: checked }))}
                  disabled={!connected || !config.enabled}
                />
              </div>

              <div>
                <Label>Default Reminder</Label>
                <Select
                  value={String(config.default_reminder_minutes)}
                  onValueChange={(val) => setConfig(prev => ({ ...prev, default_reminder_minutes: parseInt(val) }))}
                  disabled={!connected || !config.enabled}
                >
                  <SelectTrigger className="w-full max-w-xs mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="120">2 hours before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                    <SelectItem value="2880">2 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>How Calendar Sync Works</AlertTitle>
            <AlertDescription>
              <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
                <li>Go to <strong>Project Management</strong> and open any project</li>
                <li>Click the <strong>&quot;Push to Google Calendar&quot;</strong> button on a project with an event date</li>
                <li>The event will be created on your selected Google Calendar with project details, location, and attendees</li>
                {config.auto_sync && (
                  <li>With auto-sync enabled, new projects with event dates will automatically create calendar events</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>

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
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Test Connection */}
          {connected && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Test Connection
                </CardTitle>
                <CardDescription>
                  Verify the calendar connection is working by checking for upcoming events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleTest} disabled={testing} variant="outline">
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Test Calendar Connection
                    </>
                  )}
                </Button>

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
          )}
        </div>
      </main>
    </div>
  )
}

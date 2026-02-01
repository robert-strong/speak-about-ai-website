"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Mail,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Loader2,
  Filter
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"

interface EmailNotification {
  id: number
  deal_id?: number
  recipient_email: string
  email_type: string
  subject?: string
  sent_at: string
  status: "sent" | "failed" | "pending"
  error_message?: string
  deal_client_name?: string
  deal_event_title?: string
}

interface EmailStats {
  totalEmails: number
  sentEmails: number
  failedEmails: number
  pendingEmails: number
  successRate: number
}

const EMAIL_STATUS_CONFIG = {
  sent: { label: "Sent", color: "bg-green-500", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500", icon: AlertTriangle },
  pending: { label: "Pending", color: "bg-yellow-500", icon: Clock }
}

export default function AdminEmailsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [emails, setEmails] = useState<EmailNotification[]>([])
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [timeRange, setTimeRange] = useState("7")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadEmails()
  }, [router, timeRange])

  const loadEmails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/emails?days=${timeRange}`)
      
      if (response.ok) {
        const data = await response.json()
        setEmails(data.emails || [])
        setStats(data.stats || null)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to load email notifications",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading emails:", error)
      toast({
        title: "Error",
        description: "Failed to load email notification data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async (id: number) => {
    try {
      const response = await fetch(`/api/emails/${id}/resend`, {
        method: "POST"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email resent successfully"
        })
        loadEmails() // Reload to show updated status
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to resend email",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error resending email:", error)
      toast({
        title: "Error",
        description: "Failed to resend email",
        variant: "destructive"
      })
    }
  }

  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.deal_client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.deal_event_title?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || email.status === statusFilter
    const matchesType = typeFilter === "all" || email.email_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading email notifications...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Notifications</h1>
              <p className="mt-2 text-gray-600">Monitor and manage system email notifications</p>
            </div>
            <div className="flex gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadEmails} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {!stats ? (
            <Alert className="mb-8 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">No Email Data</AlertTitle>
              <AlertDescription className="text-yellow-700">
                No email notifications found in the selected time range.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEmails.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sent</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.sentEmails.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.failedEmails.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pendingEmails.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search emails by recipient, subject, or deal info..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="new_deal">New Deal</SelectItem>
                        <SelectItem value="deal_update">Deal Update</SelectItem>
                        <SelectItem value="contract_sent">Contract Sent</SelectItem>
                        <SelectItem value="contract_signed">Contract Signed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Email Notifications Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>
                    Showing {filteredEmails.length} of {emails.length} email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Deal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No email notifications found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell className="font-medium">{email.recipient_email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {email.email_type.replace(/_/g, " ").toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {email.subject || "No subject"}
                            </TableCell>
                            <TableCell>
                              {email.deal_id ? (
                                <div className="text-sm">
                                  <div className="font-medium">{email.deal_client_name}</div>
                                  <div className="text-gray-500">{email.deal_event_title}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No deal</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={`${EMAIL_STATUS_CONFIG[email.status].color} text-white`}
                                title={email.error_message || ""}
                              >
                                {EMAIL_STATUS_CONFIG[email.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(email.sent_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {email.status === "failed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleResendEmail(email.id)}
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    Resend
                                  </Button>
                                )}
                                {email.deal_id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => router.push(`/admin/dashboard`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
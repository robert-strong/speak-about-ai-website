"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { authGet, authPost, authPut, authDelete } from "@/lib/auth-fetch"
import {
  Shield,
  Save,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Info,
  Building2,
  CreditCard,
  FileText,
  Link as LinkIcon,
  Mail,
  Copy,
  Check,
  Trash2,
  Clock,
  Activity,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink
} from "lucide-react"

interface BankingConfig {
  entity_name: string
  entity_address: string
  entity_email: string
  entity_phone: string
  entity_ein: string
  bank_name: string
  account_name: string
  account_number: string
  routing_number: string
  wire_routing_number: string
  swift_code: string
  bank_address: string
  wire_instructions: string
  ach_instructions: string
  payment_terms_deposit: string
  payment_terms_final: string
  source?: string
}

interface SecureBankInfo {
  bankName: string
  routingNumber: string
  accountNumber: string
  accountType: string
  wireRoutingNumber?: string
  swiftCode?: string
}

interface SecureLink {
  id: number
  token_id: string
  client_email: string
  client_name?: string
  expires_at: string
  viewed_at?: string
  is_active: boolean
  view_count: number
  max_views: number
  created_at: string
  status: 'active' | 'viewed' | 'expired' | 'revoked'
}

interface AuditLog {
  id: number
  action: string
  client_email?: string
  ip_address?: string
  created_at: string
  link_client_email?: string
  link_client_name?: string
}

export default function BankingSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("portal")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSensitive, setShowSensitive] = useState(false)

  // Invoice banking config state
  const [config, setConfig] = useState<BankingConfig>({
    entity_name: '',
    entity_address: '',
    entity_email: '',
    entity_phone: '',
    entity_ein: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    routing_number: '',
    wire_routing_number: '',
    swift_code: '',
    bank_address: '',
    wire_instructions: '',
    ach_instructions: '',
    payment_terms_deposit: 'Net 30 days from issue date',
    payment_terms_final: 'Due on event date'
  })

  // Secure bank portal state
  const [secureBankInfo, setSecureBankInfo] = useState<SecureBankInfo>({
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'Checking',
    wireRoutingNumber: '',
    swiftCode: ''
  })
  const [secureBankExists, setSecureBankExists] = useState(false)
  const [savingSecure, setSavingSecure] = useState(false)

  // Link generation state
  const [clientEmail, setClientEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Links and audit state
  const [links, setLinks] = useState<SecureLink[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [loadingAudit, setLoadingAudit] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadAllData()
  }, [router])

  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([
      loadBankingConfig(),
      loadSecureBankInfo(),
      loadLinks(),
      loadAuditLog()
    ])
    setLoading(false)
  }

  const loadBankingConfig = async () => {
    try {
      const response = await authGet('/api/admin/banking-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config || config)
      }
    } catch (error) {
      console.error('Error loading banking config:', error)
    }
  }

  const loadSecureBankInfo = async () => {
    try {
      const response = await authGet('/api/admin/secure-bank-info')
      if (response.ok) {
        const data = await response.json()
        setSecureBankExists(data.exists)
        if (data.data) {
          setSecureBankInfo({
            bankName: data.data.bankName || '',
            routingNumber: data.data.routingNumber || '',
            accountNumber: data.data.accountNumber || '',
            accountType: data.data.accountType || 'Checking',
            wireRoutingNumber: data.data.wireRoutingNumber || '',
            swiftCode: data.data.swiftCode || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading secure bank info:', error)
    }
  }

  const loadLinks = async () => {
    try {
      setLoadingLinks(true)
      const response = await authGet('/api/admin/secure-bank-info/generate-link')
      if (response.ok) {
        const data = await response.json()
        setLinks(data.links || [])
      }
    } catch (error) {
      console.error('Error loading links:', error)
    } finally {
      setLoadingLinks(false)
    }
  }

  const loadAuditLog = async () => {
    try {
      setLoadingAudit(true)
      const response = await authGet('/api/admin/secure-bank-info/audit-log')
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error loading audit log:', error)
    } finally {
      setLoadingAudit(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      setSaving(true)
      const response = await authPut('/api/admin/banking-config', { config })
      if (response.ok) {
        toast({ title: "Success", description: "Invoice banking configuration saved" })
        loadBankingConfig()
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSecureBankInfo = async () => {
    try {
      setSavingSecure(true)
      const response = await authPost('/api/admin/secure-bank-info', secureBankInfo)
      if (response.ok) {
        toast({ title: "Success", description: "Secure bank info saved with AES-256 encryption" })
        setSecureBankExists(true)
        loadSecureBankInfo()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save bank info", variant: "destructive" })
    } finally {
      setSavingSecure(false)
    }
  }

  const handleGenerateLink = async () => {
    if (!clientEmail) {
      toast({ title: "Error", description: "Please enter a client email", variant: "destructive" })
      return
    }

    try {
      setGeneratingLink(true)
      const response = await authPost('/api/admin/secure-bank-info/generate-link', {
        clientEmail,
        clientName,
        expiresInHours: 168,
        maxViews: 1
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedLink(data.link.magicLink)
        toast({ title: "Success", description: `Secure link sent to ${clientEmail}` })
        setClientEmail('')
        setClientName('')
        loadLinks()
        loadAuditLog()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate link')
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate link", variant: "destructive" })
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleRevokeLink = async (linkId: number) => {
    try {
      const response = await authDelete(`/api/admin/secure-bank-info/generate-link?id=${linkId}`)
      if (response.ok) {
        toast({ title: "Success", description: "Link revoked" })
        loadLinks()
        loadAuditLog()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to revoke link", variant: "destructive" })
    }
  }

  const copyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'viewed':
        return <Badge className="bg-blue-100 text-blue-800">Viewed</Badge>
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
      case 'revoked':
        return <Badge className="bg-red-100 text-red-800">Revoked</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'bank_info_updated': 'Bank Info Updated',
      'link_generated': 'Link Generated',
      'link_accessed': 'Link Accessed',
      'otp_sent': 'OTP Sent',
      'bank_info_viewed': 'Bank Info Viewed',
      'link_revoked': 'Link Revoked'
    }
    return labels[action] || action
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto" />
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
      <main className="flex-1 ml-72 min-h-screen overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Banking & Payment Portal</h1>
            <p className="text-gray-600 mt-2">Securely manage and share banking information</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="portal" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Secure Portal
              </TabsTrigger>
              <TabsTrigger value="invoice" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoice Config
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Audit Log
              </TabsTrigger>
            </TabsList>

            {/* Secure Portal Tab */}
            <TabsContent value="portal" className="space-y-6">
              {/* Security Notice */}
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Zero-Knowledge Encryption</AlertTitle>
                <AlertDescription className="text-blue-800">
                  Your bank info is encrypted with AES-256 before storage. Clients must verify via email OTP
                  and can only view once. Links expire after 7 days.
                </AlertDescription>
              </Alert>

              {/* Secure Bank Info Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Your Secure Bank Details
                  </CardTitle>
                  <CardDescription>
                    This information is AES-256 encrypted and shared securely via magic links
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="secure_bank_name">Bank Name *</Label>
                      <Input
                        id="secure_bank_name"
                        value={secureBankInfo.bankName}
                        onChange={(e) => setSecureBankInfo({...secureBankInfo, bankName: e.target.value})}
                        placeholder="Chase Bank"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secure_account_type">Account Type</Label>
                      <Input
                        id="secure_account_type"
                        value={secureBankInfo.accountType}
                        onChange={(e) => setSecureBankInfo({...secureBankInfo, accountType: e.target.value})}
                        placeholder="Checking"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secure_routing">Routing Number *</Label>
                      <Input
                        id="secure_routing"
                        type={showSensitive ? "text" : "password"}
                        value={secureBankInfo.routingNumber}
                        onChange={(e) => setSecureBankInfo({...secureBankInfo, routingNumber: e.target.value})}
                        placeholder={secureBankExists ? "****" : "Enter routing number"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="secure_account">Account Number *</Label>
                      <Input
                        id="secure_account"
                        type={showSensitive ? "text" : "password"}
                        value={secureBankInfo.accountNumber}
                        onChange={(e) => setSecureBankInfo({...secureBankInfo, accountNumber: e.target.value})}
                        placeholder={secureBankExists ? "****" : "Enter account number"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="secure_wire_routing">Wire Routing Number</Label>
                      <Input
                        id="secure_wire_routing"
                        type={showSensitive ? "text" : "password"}
                        value={secureBankInfo.wireRoutingNumber}
                        onChange={(e) => setSecureBankInfo({...secureBankInfo, wireRoutingNumber: e.target.value})}
                        placeholder="For domestic wires"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secure_swift">SWIFT Code</Label>
                      <Input
                        id="secure_swift"
                        value={secureBankInfo.swiftCode}
                        onChange={(e) => setSecureBankInfo({...secureBankInfo, swiftCode: e.target.value})}
                        placeholder="For international transfers"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSensitive(!showSensitive)}
                    >
                      {showSensitive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showSensitive ? "Hide" : "Show"} Numbers
                    </Button>
                    <Button onClick={handleSaveSecureBankInfo} disabled={savingSecure}>
                      {savingSecure ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="h-4 w-4 mr-2" /> Save Encrypted</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Share Access Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Share Access
                  </CardTitle>
                  <CardDescription>
                    Generate a secure, time-limited link for a client to view your bank details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!secureBankExists && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please save your bank info above before generating links.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client_email">Client Email *</Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@company.com"
                        disabled={!secureBankExists}
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_name">Client Name (Optional)</Label>
                      <Input
                        id="client_name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="John Smith"
                        disabled={!secureBankExists}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleGenerateLink}
                      disabled={!secureBankExists || !clientEmail || generatingLink}
                    >
                      {generatingLink ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><LinkIcon className="h-4 w-4 mr-2" /> Generate Secure Link</>
                      )}
                    </Button>
                    <p className="text-sm text-gray-500">
                      Link expires in 7 days • One-time view only
                    </p>
                  </div>

                  {generatedLink && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-800 font-medium">Link Generated!</p>
                          <p className="text-xs text-green-600 mt-1 font-mono truncate max-w-md">
                            {generatedLink}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={copyLink}>
                            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Links Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Active Links
                      </CardTitle>
                      <CardDescription>Manage and monitor shared access links</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadLinks} disabled={loadingLinks}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingLinks ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {links.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No links generated yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {links.map((link) => (
                          <TableRow key={link.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{link.client_name || 'Unknown'}</p>
                                <p className="text-sm text-gray-500">{link.client_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(link.status)}</TableCell>
                            <TableCell className="text-sm">{formatDate(link.created_at)}</TableCell>
                            <TableCell className="text-sm">{formatDate(link.expires_at)}</TableCell>
                            <TableCell>{link.view_count} / {link.max_views}</TableCell>
                            <TableCell>
                              {link.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevokeLink(link.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoice Config Tab */}
            <TabsContent value="invoice" className="space-y-6">
              <Alert className="border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900">Invoice Settings</AlertTitle>
                <AlertDescription className="text-amber-800">
                  This information appears on generated invoices. For secure bank detail sharing with clients,
                  use the Secure Portal tab instead.
                </AlertDescription>
              </Alert>

              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>Your business details shown on invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entity_name">Business/Entity Name</Label>
                      <Input
                        id="entity_name"
                        value={config.entity_name}
                        onChange={(e) => setConfig({...config, entity_name: e.target.value})}
                        placeholder="Strong Entertainment, LLC"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_name">Account Holder Name</Label>
                      <Input
                        id="account_name"
                        value={config.account_name}
                        onChange={(e) => setConfig({...config, account_name: e.target.value})}
                        placeholder="Robert Strong"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="entity_address">Business Address</Label>
                      <Input
                        id="entity_address"
                        value={config.entity_address}
                        onChange={(e) => setConfig({...config, entity_address: e.target.value})}
                        placeholder="651 Homer Ave, Palo Alto, CA 94301"
                      />
                    </div>
                    <div>
                      <Label htmlFor="entity_email">Business Email</Label>
                      <Input
                        id="entity_email"
                        type="email"
                        value={config.entity_email}
                        onChange={(e) => setConfig({...config, entity_email: e.target.value})}
                        placeholder="human@speakabout.ai"
                      />
                    </div>
                    <div>
                      <Label htmlFor="entity_phone">Business Phone</Label>
                      <Input
                        id="entity_phone"
                        value={config.entity_phone}
                        onChange={(e) => setConfig({...config, entity_phone: e.target.value})}
                        placeholder="(1) 415-665-2442"
                      />
                    </div>
                    <div>
                      <Label htmlFor="entity_ein">EIN/Tax ID</Label>
                      <Input
                        id="entity_ein"
                        value={config.entity_ein}
                        onChange={(e) => setConfig({...config, entity_ein: e.target.value})}
                        placeholder="84-4432163"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Terms */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Terms
                  </CardTitle>
                  <CardDescription>Default payment terms shown on invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payment_terms_deposit">Deposit Invoice Terms</Label>
                      <Input
                        id="payment_terms_deposit"
                        value={config.payment_terms_deposit}
                        onChange={(e) => setConfig({...config, payment_terms_deposit: e.target.value})}
                        placeholder="Net 30 days from issue date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_terms_final">Final Invoice Terms</Label>
                      <Input
                        id="payment_terms_final"
                        value={config.payment_terms_final}
                        onChange={(e) => setConfig({...config, payment_terms_final: e.target.value})}
                        placeholder="Due on event date"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ach_instructions">Payment Instructions</Label>
                    <Textarea
                      id="ach_instructions"
                      value={config.ach_instructions}
                      onChange={(e) => setConfig({...config, ach_instructions: e.target.value})}
                      placeholder="Please pay using ACH transfer."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={saving} size="lg">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Save Invoice Configuration</>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Activity Log
                      </CardTitle>
                      <CardDescription>Complete audit trail of all actions</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadAuditLog} disabled={loadingAudit}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingAudit ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {auditLogs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No activity yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant="outline">{getActionLabel(log.action)}</Badge>
                            </TableCell>
                            <TableCell>
                              {log.client_email || log.link_client_email || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.ip_address || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(log.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

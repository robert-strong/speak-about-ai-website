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
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"
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
  FileText
} from "lucide-react"

interface BankingConfig {
  bank_name: string
  account_name: string
  account_number: string
  routing_number: string
  swift_code: string
  bank_address: string
  wire_instructions: string
  ach_instructions: string
  payment_terms_deposit: string
  payment_terms_final: string
  source?: string
}

interface MaskedBankingValues {
  account_number?: string
  routing_number?: string
}

export default function BankingSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSensitive, setShowSensitive] = useState(false)
  const [config, setConfig] = useState<BankingConfig>({
    bank_name: '',
    account_name: '',
    account_number: '',
    routing_number: '',
    swift_code: '',
    bank_address: '',
    wire_instructions: '',
    ach_instructions: '',
    payment_terms_deposit: 'Net 30 days from issue date',
    payment_terms_final: 'Due on event date'
  })
  const [maskedValues, setMaskedValues] = useState<MaskedBankingValues>({})

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadBankingConfig()
  }, [router])

  const loadBankingConfig = async () => {
    try {
      setLoading(true)
      const response = await authGet('/api/admin/banking-config')

      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        setMaskedValues(data.masked || {})
      }
    } catch (error) {
      console.error('Error loading banking config:', error)
      toast({
        title: "Error",
        description: "Failed to load banking configuration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await authPut('/api/admin/banking-config', { config })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Banking configuration saved securely"
        })
        loadBankingConfig()
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving banking config:', error)
      toast({
        title: "Error",
        description: "Failed to save banking configuration",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (field: keyof BankingConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Banking Configuration</h1>
            <p className="text-gray-600 mt-2">Securely manage banking information for invoices</p>
          </div>

          {/* Security Notice */}
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Security Notice</AlertTitle>
            <AlertDescription className="text-amber-800">
              Banking information is encrypted and stored securely. 
              {config.source === 'environment' ? (
                <span className="block mt-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Currently using environment variables (most secure)
                  </Badge>
                </span>
              ) : (
                <span className="block mt-2">
                  For maximum security, consider using environment variables in your hosting platform.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Banking Information */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Bank Account Details
                  </CardTitle>
                  <CardDescription>Information displayed on invoices</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSensitive(!showSensitive)}
                >
                  {showSensitive ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Sensitive
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Sensitive
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={config.bank_name}
                    onChange={(e) => handleFieldChange('bank_name', e.target.value)}
                    placeholder="Chase Bank"
                  />
                </div>
                <div>
                  <Label htmlFor="account_name">Account Name</Label>
                  <Input
                    id="account_name"
                    value={config.account_name}
                    onChange={(e) => handleFieldChange('account_name', e.target.value)}
                    placeholder="Your Business Name LLC"
                  />
                </div>
                <div>
                  <Label htmlFor="account_number" className="flex items-center gap-2">
                    Account Number
                    <Lock className="h-3 w-3 text-gray-500" />
                  </Label>
                  <Input
                    id="account_number"
                    type={showSensitive ? "text" : "password"}
                    value={config.account_number}
                    onChange={(e) => handleFieldChange('account_number', e.target.value)}
                    placeholder={maskedValues.account_number || "****1234"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Will be displayed as: {config.account_number ? `****${config.account_number.slice(-4)}` : maskedValues.account_number}
                  </p>
                </div>
                <div>
                  <Label htmlFor="routing_number" className="flex items-center gap-2">
                    Routing Number
                    <Lock className="h-3 w-3 text-gray-500" />
                  </Label>
                  <Input
                    id="routing_number"
                    type={showSensitive ? "text" : "password"}
                    value={config.routing_number}
                    onChange={(e) => handleFieldChange('routing_number', e.target.value)}
                    placeholder={maskedValues.routing_number || "****6789"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Will be displayed as: {config.routing_number ? `****${config.routing_number.slice(-4)}` : maskedValues.routing_number}
                  </p>
                </div>
                <div>
                  <Label htmlFor="swift_code">SWIFT/BIC Code</Label>
                  <Input
                    id="swift_code"
                    value={config.swift_code}
                    onChange={(e) => handleFieldChange('swift_code', e.target.value)}
                    placeholder="CHASUS33"
                  />
                </div>
                <div>
                  <Label htmlFor="bank_address">Bank Address</Label>
                  <Input
                    id="bank_address"
                    value={config.bank_address}
                    onChange={(e) => handleFieldChange('bank_address', e.target.value)}
                    placeholder="123 Bank St, New York, NY 10001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment Instructions
              </CardTitle>
              <CardDescription>Additional information for wire transfers and payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wire_instructions">Wire Transfer Instructions</Label>
                <Textarea
                  id="wire_instructions"
                  value={config.wire_instructions}
                  onChange={(e) => handleFieldChange('wire_instructions', e.target.value)}
                  placeholder="For international wires, please use SWIFT code. Include invoice number as reference."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="ach_instructions">ACH Transfer Instructions</Label>
                <Textarea
                  id="ach_instructions"
                  value={config.ach_instructions}
                  onChange={(e) => handleFieldChange('ach_instructions', e.target.value)}
                  placeholder="For ACH transfers, use routing and account numbers above."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Terms
              </CardTitle>
              <CardDescription>Default payment terms for invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payment_terms_deposit">Deposit Invoice Terms</Label>
                <Input
                  id="payment_terms_deposit"
                  value={config.payment_terms_deposit}
                  onChange={(e) => handleFieldChange('payment_terms_deposit', e.target.value)}
                  placeholder="Net 30 days from issue date"
                />
              </div>
              <div>
                <Label htmlFor="payment_terms_final">Final Invoice Terms</Label>
                <Input
                  id="payment_terms_final"
                  value={config.payment_terms_final}
                  onChange={(e) => handleFieldChange('payment_terms_final', e.target.value)}
                  placeholder="Due on event date"
                />
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Configuration Priority</AlertTitle>
            <AlertDescription>
              Environment variables (if set) take priority over database configuration for added security.
              To use environment variables, add them to your hosting platform's settings.
            </AlertDescription>
          </Alert>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={saving}
              size="lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
        </div>
      </main>
    </div>
  )
}
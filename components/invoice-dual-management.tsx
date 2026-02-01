"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { InvoicePDFDialog } from "@/components/invoice-pdf-viewer"
import { 
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"
  FileText, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock,
  Download,
  Send,
  Plus
} from "lucide-react"

interface Invoice {
  id: number
  invoice_number: string
  invoice_type: 'deposit' | 'final' | 'standard'
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  payment_date?: string
  description?: string
}

interface InvoiceDualManagementProps {
  projectId: number
  projectName: string
  existingInvoices?: Invoice[]
  totalAmount: number
  onInvoicesCreated?: () => void
}

export function InvoiceDualManagement({
  projectId,
  projectName,
  existingInvoices = [],
  totalAmount,
  onInvoicesCreated
}: InvoiceDualManagementProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(existingInvoices)
  const [loading, setLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<{id: number, number: string} | null>(null)
  const { toast } = useToast()

  const depositInvoice = invoices.find(inv => inv.invoice_type === 'deposit')
  const finalInvoice = invoices.find(inv => inv.invoice_type === 'final')

  const handleGenerateInvoices = async () => {
    try {
      setLoading(true)
      const response = await authPost('/api/invoices/generate-pair', { projectId })

      if (!response.ok) {
        throw new Error('Failed to generate invoices')
      }

      const data = await response.json()
      setInvoices([data.invoices.deposit, data.invoices.final])
      
      toast({
        title: "Success",
        description: "Deposit and final payment invoices created successfully"
      })

      onInvoicesCreated?.()
    } catch (error) {
      console.error('Error generating invoices:', error)
      toast({
        title: "Error",
        description: "Failed to generate invoices",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (invoiceId: number, invoiceType: string) => {
    try {
      const response = await authPatch(`/api/invoices/${invoiceId}`, { 
          status: 'paid',
          payment_date: new Date()
      })

      if (!response.ok) {
        throw new Error('Failed to update invoice')
      }

      setInvoices(invoices.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: 'paid', payment_date: new Date().toISOString() }
          : inv
      ))

      toast({
        title: "Success",
        description: `${invoiceType === 'deposit' ? 'Deposit' : 'Final payment'} marked as paid`
      })
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-500"
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.draft}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!depositInvoice && !finalInvoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>
            Generate deposit and final payment invoices for {projectName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No invoices generated yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Total Contract Value: {formatCurrency(totalAmount)}
            </p>
            <Button 
              onClick={handleGenerateInvoices}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Deposit & Final Invoices
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>
            Manage deposit and final payment for {projectName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deposit Invoice */}
            {depositInvoice && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Deposit Invoice</h3>
                    {getStatusBadge(depositInvoice.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Invoice #</span>
                    <span className="font-mono text-sm">{depositInvoice.invoice_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="font-semibold">{formatCurrency(depositInvoice.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Due Date</span>
                    <span className="text-sm">{formatDate(depositInvoice.due_date)}</span>
                  </div>
                  {depositInvoice.payment_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Paid On</span>
                      <span className="text-sm text-green-600">
                        {formatDate(depositInvoice.payment_date)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedInvoice({
                        id: depositInvoice.id,
                        number: depositInvoice.invoice_number
                      })}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View / Download PDF
                    </Button>
                    {depositInvoice.status !== 'paid' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => handleMarkAsPaid(depositInvoice.id, 'deposit')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final Invoice */}
            {finalInvoice && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Final Payment</h3>
                    {getStatusBadge(finalInvoice.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Invoice #</span>
                    <span className="font-mono text-sm">{finalInvoice.invoice_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="font-semibold">{formatCurrency(finalInvoice.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Due Date</span>
                    <span className="text-sm">{formatDate(finalInvoice.due_date)}</span>
                  </div>
                  {finalInvoice.payment_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Paid On</span>
                      <span className="text-sm text-green-600">
                        {formatDate(finalInvoice.payment_date)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedInvoice({
                        id: finalInvoice.id,
                        number: finalInvoice.invoice_number
                      })}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View / Download PDF
                    </Button>
                    {finalInvoice.status !== 'paid' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => handleMarkAsPaid(finalInvoice.id, 'final')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Contract</span>
                <p className="font-semibold">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Paid</span>
                <p className="font-semibold text-green-600">
                  {formatCurrency(
                    invoices
                      .filter(inv => inv.status === 'paid')
                      .reduce((sum, inv) => sum + inv.amount, 0)
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Outstanding</span>
                <p className="font-semibold text-orange-600">
                  {formatCurrency(
                    invoices
                      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
                      .reduce((sum, inv) => sum + inv.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer Dialog */}
      {selectedInvoice && (
        <InvoicePDFDialog
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.number}
          open={!!selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
        />
      )}
    </div>
  )
}
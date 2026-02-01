"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Eye, Loader2, Mail, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"

interface InvoicePDFViewerProps {
  invoiceId: number
  invoiceNumber: string
  onClose?: () => void
}

export function InvoicePDFViewer({ invoiceId, invoiceNumber, onClose }: InvoicePDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [htmlContent, setHtmlContent] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoiceHTML()
  }, [invoiceId])

  const fetchInvoiceHTML = async () => {
    try {
      setLoading(true)
      // Add cache-busting to ensure fresh data
      const response = await authFetch(`/api/invoices/${invoiceId}/pdf?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      })

      if (response.ok) {
        const html = await response.text()
        setHtmlContent(html)
      } else {
        toast({
          title: "Error",
          description: "Failed to load invoice preview",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching invoice:", error)
      toast({
        title: "Error",
        description: "Failed to load invoice preview",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const jsPDF = (await import('jspdf')).default
      
      // Create a temporary iframe to render the HTML
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.left = '-9999px'
      iframe.style.width = '794px' // A4 width in pixels at 96 DPI
      iframe.style.height = '1123px' // A4 height in pixels at 96 DPI
      document.body.appendChild(iframe)

      // Write the HTML content to the iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(htmlContent)
        iframeDoc.close()

        // Wait for content and images to load
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Use html2canvas if available, otherwise use jsPDF's html method
        try {
          const html2canvas = (await import('html2canvas')).default
          const canvas = await html2canvas(iframeDoc.body, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            imageTimeout: 15000
          })

          const imgData = canvas.toDataURL('image/png')
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          })

          const imgWidth = 210 // A4 width in mm
          const pageHeight = 297 // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          let heightLeft = imgHeight
          let position = 0

          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }

          pdf.save(`invoice-${invoiceNumber}.pdf`)
        } catch (error) {
          // Fallback to simple jsPDF html method
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          })

          await pdf.html(iframeDoc.body, {
            callback: function (doc) {
              doc.save(`invoice-${invoiceNumber}.pdf`)
            },
            x: 10,
            y: 10,
            width: 190,
            windowWidth: 794
          })
        }
      }

      // Clean up
      document.body.removeChild(iframe)
      
      toast({
        title: "Success",
        description: "Invoice downloaded successfully"
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const handleEmailInvoice = () => {
    toast({
      title: "Coming Soon",
      description: "Email functionality will be available soon"
    })
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
        >
          <Eye className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEmailInvoice}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>

      {/* Preview Container */}
      <div className="border rounded-lg bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <iframe
            srcDoc={htmlContent}
            className="w-full h-[600px] border-0"
            title={`Invoice ${invoiceNumber}`}
          />
        )}
      </div>
    </div>
  )
}

interface InvoicePDFDialogProps {
  invoiceId: number | null
  invoiceNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoicePDFDialog({ invoiceId, invoiceNumber, open, onOpenChange }: InvoicePDFDialogProps) {
  if (!invoiceId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice {invoiceNumber}</DialogTitle>
        </DialogHeader>
        <InvoicePDFViewer
          invoiceId={invoiceId}
          invoiceNumber={invoiceNumber}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
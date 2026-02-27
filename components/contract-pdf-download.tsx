"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContractPDFDownloadProps {
  contractId: number
  contractNumber: string
}

export function ContractPDFDownload({ contractId, contractNumber }: ContractPDFDownloadProps) {
  const [downloading, setDownloading] = useState(false)
  const { toast } = useToast()

  const fetchSignedHTML = async (): Promise<string | null> => {
    const token = localStorage.getItem("clientToken")
    if (!token) return null

    const response = await fetch(`/api/clients/contracts/${contractId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch signed contract")
    }

    return response.text()
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const htmlContent = await fetchSignedHTML()
      if (!htmlContent) {
        throw new Error("No signed contract available")
      }

      // Dynamically import jsPDF
      const jsPDF = (await import("jspdf")).default

      // Create temp iframe
      const iframe = document.createElement("iframe")
      iframe.style.position = "absolute"
      iframe.style.left = "-9999px"
      iframe.style.width = "794px"
      iframe.style.height = "1123px"
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) throw new Error("Failed to create render frame")

      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      // Wait for content to render
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        const html2canvas = (await import("html2canvas")).default
        const canvas = await html2canvas(iframeDoc.body, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          imageTimeout: 15000,
        })

        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        })

        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        pdf.save(`${contractNumber}-signed.pdf`)
      } catch {
        // Fallback
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        })
        await pdf.html(iframeDoc.body, {
          callback: (doc) => doc.save(`${contractNumber}-signed.pdf`),
          x: 10,
          y: 10,
          width: 190,
          windowWidth: 794,
        })
      }

      document.body.removeChild(iframe)

      toast({
        title: "Success",
        description: "Signed contract downloaded successfully",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download contract. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = async () => {
    try {
      const htmlContent = await fetchSignedHTML()
      if (!htmlContent) return

      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => printWindow.print(), 500)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to print contract",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleDownload} disabled={downloading}>
        {downloading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {downloading ? "Generating PDF..." : "Download PDF"}
      </Button>
      <Button variant="outline" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
    </div>
  )
}

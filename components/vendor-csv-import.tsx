"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Papa from "papaparse"

interface VendorCSVRow {
  name?: string
  email?: string
  company?: string
  category?: string
  website?: string
  phone?: string
  [key: string]: string | undefined
}

interface ImportResults {
  success: boolean
  imported: number
  failed: number
  errors?: Array<{ row: number; error: string }>
}

export function VendorCSVImport() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoApprove, setAutoApprove] = useState(false)
  const [preview, setPreview] = useState<VendorCSVRow[]>([])
  const [importResults, setImportResults] = useState<ImportResults | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive"
      })
      return
    }
    
    setFile(selectedFile)
    setImportResults(null)
    
    // Parse CSV for preview
    Papa.parse(selectedFile, {
      header: true,
      preview: 5,
      complete: (results) => {
        setPreview(results.data)
      },
      error: (error) => {
        console.error("Error parsing CSV:", error)
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive"
        })
      }
    })
  }
  
  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    
    // Parse entire CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("Parsed CSV data:", results.data.length, "rows")
        console.log("First row sample:", results.data[0])
        
        try {
          const response = await fetch("/api/vendors/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-request": "true"
            },
            body: JSON.stringify({
              data: results.data,
              autoApprove
            })
          })
          
          const data = await response.json()
          
          if (response.ok) {
            setImportResults(data.results)
            toast({
              title: "Import completed",
              description: data.message,
            })
            
            // Clear file after successful import
            if (data.results.failed === 0) {
              setTimeout(() => {
                setFile(null)
                setPreview([])
                setImportResults(null)
              }, 3000)
            }
          } else {
            toast({
              title: "Import failed",
              description: data.error || "Failed to import vendors",
              variant: "destructive"
            })
          }
        } catch (error) {
          console.error("Error importing vendors:", error)
          toast({
            title: "Error",
            description: "Failed to import vendors",
            variant: "destructive"
          })
        } finally {
          setLoading(false)
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error)
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive"
        })
        setLoading(false)
      }
    })
  }
  
  const downloadTemplate = () => {
    const headers = [
      "Email Address",
      "Company Name",
      "Primary Contact Name",
      "Primary Contact Role",
      "Primary Contact LinkedIn Profile",
      "Business Email (must be a company domain)",
      "Business Phone Number",
      "Company Website URL",
      "Years in Business",
      "Describe your business in 1-2 sentences.",
      "Primary Vendor Category",
      "Secondary Services Offered",
      "Specialty Capabilities or Certifications (e.g., sustainable practices, minority-owned, specific equipment)",
      "Typical Event Types Served",
      "Average Event Size You Handle (number of attendees)",
      "Headquarters Location (City, State/Province, Country)",
      "Service Areas",
      "Specific Cities/Regions Covered",
      "Are travel fees applicable?",
      "Travel Fee General Policy (if applicable)",
      "Typical Project Budget Range (Minimum)",
      "Typical Project Budget Range (Maximum)",
      "Pricing Structure",
      "Payment Terms (Deposit requirements, net terms)",
      "Link to Portfolio or Case Studies",
      "Awards or Industry Recognition",
      "Links to Google Reviews or other platform ratings (e.g., Yelp, WeddingWire)",
      "Typical Lead Time Required for Your Services",
      "Do you work with other vendors? (e.g., preferred partner list, collaborations)",
      "Preferred Partner List (if applicable)",
      "Languages Spoken by Your Team",
      "Accessibility Accommodations Offered (e.g., accessible venues, sign language interpreters, sensory-friendly options)"
    ]
    
    const csv = headers.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendor-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Vendors from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file to bulk import vendors into the directory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Need the template?</p>
              <p className="text-sm text-gray-500">Download our CSV template with all required fields</p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
        
        {/* File Upload */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">
                    {file ? file.name : "Click to upload CSV file"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV files only, max 10MB
                  </p>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </Label>
            </div>
          </div>
          
          {/* Auto-approve toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-approve"
              checked={autoApprove}
              onCheckedChange={setAutoApprove}
            />
            <Label htmlFor="auto-approve">
              Auto-approve imported vendors (skip pending status)
            </Label>
          </div>
        </div>
        
        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Preview (first 5 rows)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Company Name</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{row["Company Name"]}</td>
                      <td className="p-2">{row["Primary Contact Name"]}</td>
                      <td className="p-2">{row["Business Email (must be a company domain)"]}</td>
                      <td className="p-2">{row["Primary Vendor Category"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              Total rows in file: {preview.length === 5 ? "5+" : preview.length}
            </p>
          </div>
        )}
        
        {/* Import Results */}
        {importResults && (
          <Alert className={importResults.failed > 0 ? "border-yellow-500" : "border-green-500"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Import Results</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Successfully imported: {importResults.success}</span>
                </div>
                {importResults.failed > 0 && (
                  <>
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Failed: {importResults.failed}</span>
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium">Errors:</p>
                        {importResults.errors.map((err: any, idx: number) => (
                          <p key={idx} className="text-xs text-gray-600">
                            Row {err.row} ({err.company}): {err.error}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Import Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="min-w-[150px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Vendors
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Upload, Download, FileSpreadsheet, CheckCircle, 
  XCircle, AlertTriangle, Play, Pause, RotateCcw,
  Eye, Trash2, Filter
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface BatchJob {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "failed"
  totalItems: number
  processedItems: number
  successCount: number
  errorCount: number
  createdAt: Date
  completedAt?: Date
  errors: Array<{
    row: number
    field: string
    message: string
  }>
}

interface ProcessedVendor {
  row: number
  company_name: string
  email: string
  status: "success" | "error" | "duplicate" | "invalid"
  message?: string
  vendorId?: number
}

export function VendorBatchProcessor() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null)
  const [processedVendors, setProcessedVendors] = useState<ProcessedVendor[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive"
      })
      return
    }
    
    setSelectedFile(file)
    
    const newJob: BatchJob = {
      id: Date.now().toString(),
      name: file.name,
      status: "pending",
      totalItems: 0,
      processedItems: 0,
      successCount: 0,
      errorCount: 0,
      createdAt: new Date(),
      errors: []
    }
    
    setJobs(prev => [newJob, ...prev])
    setCurrentJob(newJob)
    
    await parseAndValidateFile(file, newJob)
  }
  
  const parseAndValidateFile = async (file: File, job: BatchJob) => {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
    
    const requiredFields = ['company_name', 'contact_email']
    const missingFields = requiredFields.filter(field => !headers.includes(field))
    
    if (missingFields.length > 0) {
      job.status = "failed"
      job.errors.push({
        row: 0,
        field: "headers",
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
      setJobs(prev => prev.map(j => j.id === job.id ? job : j))
      toast({
        title: "Invalid CSV format",
        description: `Missing required columns: ${missingFields.join(', ')}`,
        variant: "destructive"
      })
      return
    }
    
    job.totalItems = lines.length - 1
    setJobs(prev => prev.map(j => j.id === job.id ? job : j))
    
    const vendors: ProcessedVendor[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const vendor: any = {}
      
      headers.forEach((header, index) => {
        vendor[header] = values[index] || ''
      })
      
      vendors.push({
        row: i,
        company_name: vendor.company_name,
        email: vendor.contact_email,
        status: "success",
        message: "Ready to process"
      })
    }
    
    setProcessedVendors(vendors)
  }
  
  const startProcessing = async () => {
    if (!currentJob || !processedVendors.length) return
    
    setIsProcessing(true)
    currentJob.status = "processing"
    setJobs(prev => prev.map(j => j.id === currentJob.id ? currentJob : j))
    
    for (const vendor of processedVendors) {
      if (!isProcessing) break
      
      try {
        const response = await fetch('/api/vendors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-request': 'true'
          },
          body: JSON.stringify({
            company_name: vendor.company_name,
            contact_email: vendor.email,
            status: 'pending',
            slug: vendor.company_name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          vendor.status = "success"
          vendor.message = "Vendor created successfully"
          vendor.vendorId = data.vendor?.id
          currentJob.successCount++
        } else {
          const error = await response.json()
          vendor.status = "error"
          vendor.message = error.error || "Failed to create vendor"
          currentJob.errorCount++
        }
      } catch (error) {
        vendor.status = "error"
        vendor.message = "Network error"
        currentJob.errorCount++
      }
      
      currentJob.processedItems++
      setProcessedVendors([...processedVendors])
      setJobs(prev => prev.map(j => j.id === currentJob.id ? currentJob : j))
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    currentJob.status = currentJob.errorCount === 0 ? "completed" : "completed"
    currentJob.completedAt = new Date()
    setJobs(prev => prev.map(j => j.id === currentJob.id ? currentJob : j))
    setIsProcessing(false)
    
    toast({
      title: "Batch processing completed",
      description: `Processed ${currentJob.processedItems} vendors: ${currentJob.successCount} successful, ${currentJob.errorCount} errors`,
    })
  }
  
  const pauseProcessing = () => {
    setIsProcessing(false)
    if (currentJob) {
      currentJob.status = "pending"
      setJobs(prev => prev.map(j => j.id === currentJob.id ? currentJob : j))
    }
  }
  
  const resetJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      job.status = "pending"
      job.processedItems = 0
      job.successCount = 0
      job.errorCount = 0
      job.completedAt = undefined
      setJobs([...jobs])
      setProcessedVendors(prev => 
        prev.map(v => ({ ...v, status: "success", message: "Ready to process" }))
      )
    }
  }
  
  const downloadResults = () => {
    const csv = [
      ['Row', 'Company Name', 'Email', 'Status', 'Message', 'Vendor ID'].join(','),
      ...processedVendors.map(v => 
        [v.row, v.company_name, v.email, v.status, v.message || '', v.vendorId || ''].join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-import-results-${Date.now()}.csv`
    a.click()
  }
  
  const downloadTemplate = () => {
    const template = [
      'company_name,contact_email,contact_name,contact_phone,website,location,category,description',
      'Example Company,contact@example.com,John Doe,123-456-7890,https://example.com,New York,Technology,We provide tech solutions'
    ].join('\n')
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendor-import-template.csv'
    a.click()
  }
  
  const filteredVendors = processedVendors.filter(v => 
    filterStatus === "all" || v.status === filterStatus
  )
  
  const getProgressPercentage = () => {
    if (!currentJob || currentJob.totalItems === 0) return 0
    return Math.round((currentJob.processedItems / currentJob.totalItems) * 100)
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Import Vendors</CardTitle>
          <CardDescription>
            Upload a CSV file to import multiple vendors at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <div className="flex flex-col items-center">
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload CSV file
                      </p>
                      <p className="text-xs text-gray-500">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </label>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={downloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                
                {currentJob && currentJob.status === "pending" && processedVendors.length > 0 && (
                  <Button
                    className="w-full"
                    onClick={startProcessing}
                    disabled={isProcessing}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Processing
                  </Button>
                )}
                
                {isProcessing && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={pauseProcessing}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                
                {currentJob && currentJob.status === "completed" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={downloadResults}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Results
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => resetJob(currentJob.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {currentJob && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Processing: {currentJob.processedItems} / {currentJob.totalItems}
                  </span>
                  <span className="text-gray-600">
                    {getProgressPercentage()}%
                  </span>
                </div>
                <Progress value={getProgressPercentage()} />
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {currentJob.totalItems}
                    </p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {currentJob.successCount}
                    </p>
                    <p className="text-sm text-gray-500">Success</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {currentJob.errorCount}
                    </p>
                    <p className="text-sm text-gray-500">Errors</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {processedVendors.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Import Results</CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.slice(0, 50).map((vendor, index) => (
                  <TableRow key={index}>
                    <TableCell>{vendor.row}</TableCell>
                    <TableCell>{vendor.company_name}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        vendor.status === "success" ? "success" :
                        vendor.status === "error" ? "destructive" :
                        "secondary"
                      }>
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {vendor.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredVendors.length > 50 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Showing first 50 results. Download CSV for complete results.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map(job => (
                  <TableRow key={job.id}>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        job.status === "completed" ? "success" :
                        job.status === "processing" ? "warning" :
                        job.status === "failed" ? "destructive" :
                        "secondary"
                      }>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.totalItems}</TableCell>
                    <TableCell className="text-green-600">
                      {job.successCount}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {job.errorCount}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {job.createdAt.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
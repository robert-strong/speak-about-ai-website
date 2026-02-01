"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileUp,
  Upload,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Save,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  Copy
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"

interface DynamicField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency' | 'textarea'
  defaultValue?: string
  required: boolean
}

interface ContractTemplate {
  id: string
  name: string
  description: string
  fileUrl?: string
  fileName?: string
  uploadedAt?: string
  dynamicFields: DynamicField[]
}

// Pre-defined dynamic fields based on your requirements
const STANDARD_FIELDS: DynamicField[] = [
  // Parties
  { key: 'agent_name', label: 'Agent Name', type: 'text', defaultValue: 'Speak About AI, a division of Strong Entertainment, LLC', required: true },
  { key: 'speaker_name', label: 'Speaker Name', type: 'text', required: true },
  { key: 'client_company', label: 'Client Company', type: 'text', required: true },
  
  // Event Details
  { key: 'event_reference', label: 'Event Reference #', type: 'text', required: true },
  { key: 'event_name', label: 'Event Name', type: 'text', required: true },
  { key: 'event_date', label: 'Event Date', type: 'date', required: true },
  { key: 'event_time_start', label: 'Start Time', type: 'text', required: true },
  { key: 'event_time_end', label: 'End Time', type: 'text', required: true },
  { key: 'event_location', label: 'Event Location', type: 'textarea', required: true },
  
  // Financial
  { key: 'speaker_fee', label: 'Speaker Fee', type: 'currency', required: true },
  { key: 'travel_stipend', label: 'Travel Stipend', type: 'currency', required: false },
  { key: 'accommodation_details', label: 'Accommodation Details', type: 'textarea', required: false },
  
  // Deliverables
  { key: 'keynote_duration', label: 'Keynote Duration', type: 'text', defaultValue: '40 minutes', required: true },
  { key: 'keynote_topic', label: 'Keynote Topic', type: 'text', required: true },
  { key: 'qa_duration', label: 'Q&A Duration', type: 'text', defaultValue: '20 minutes', required: false },
  
  // Schedule
  { key: 'arrival_time', label: 'Speaker Arrival Time', type: 'text', required: true },
  { key: 'tech_check_time', label: 'Tech Check Time', type: 'text', defaultValue: 'TBD', required: false },
  { key: 'keynote_time', label: 'Keynote Time', type: 'text', required: true },
  { key: 'departure_time', label: 'Departure Time', type: 'text', required: true },
  
  // Additional Requirements
  { key: 'virtual_meetings', label: 'Virtual Meeting Requirements', type: 'textarea', defaultValue: 'One 30-minute virtual alignment meeting before the event', required: false },
  { key: 'additional_requirements', label: 'Additional Requirements', type: 'textarea', required: false },
  
  // Signature Fields
  { key: 'agent_signer_name', label: 'Agent Signer Name', type: 'text', required: true },
  { key: 'agent_signer_title', label: 'Agent Signer Title', type: 'text', required: true },
  { key: 'speaker_signer_name', label: 'Speaker Signer Name', type: 'text', required: true },
  { key: 'client_signer_name', label: 'Client Signer Name', type: 'text', required: true },
  { key: 'client_signer_title', label: 'Client Signer Title', type: 'text', required: true },
  
  // Dates
  { key: 'agreement_date', label: 'Agreement Date', type: 'date', required: true },
  { key: 'payment_due_date', label: 'Payment Due Date', type: 'date', required: false },
  { key: 'cancellation_deadline', label: 'Cancellation Deadline', type: 'date', required: false }
]

export default function ContractTemplateUploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [editingField, setEditingField] = useState<DynamicField | null>(null)
  const [isAddingField, setIsAddingField] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadTemplates()
  }, [router])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      // Load templates from localStorage for now
      const savedTemplates = localStorage.getItem('contractTemplates')
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates))
      } else {
        // Create default template
        const defaultTemplate: ContractTemplate = {
          id: 'standard-speaking-agreement',
          name: 'Standard Speaking Agreement',
          description: 'Standard contract template for speaking engagements',
          dynamicFields: STANDARD_FIELDS
        }
        setTemplates([defaultTemplate])
        localStorage.setItem('contractTemplates', JSON.stringify([defaultTemplate]))
      }
    } catch (error) {
      console.error("Error loading templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!file || !selectedTemplate) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('templateId', selectedTemplate.id)

      const response = await fetch('/api/contracts/templates/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update template with file info
        const updatedTemplate = {
          ...selectedTemplate,
          fileUrl: result.url,
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        }

        const updatedTemplates = templates.map(t => 
          t.id === selectedTemplate.id ? updatedTemplate : t
        )
        
        setTemplates(updatedTemplates)
        localStorage.setItem('contractTemplates', JSON.stringify(updatedTemplates))
        setSelectedTemplate(updatedTemplate)
        setFile(null)
        
        toast({
          title: "Success",
          description: "Contract template uploaded successfully"
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Failed to upload contract template",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveField = (field: DynamicField) => {
    if (!selectedTemplate) return

    const updatedFields = editingField
      ? selectedTemplate.dynamicFields.map(f => f.key === editingField.key ? field : f)
      : [...selectedTemplate.dynamicFields, field]

    const updatedTemplate = {
      ...selectedTemplate,
      dynamicFields: updatedFields
    }

    const updatedTemplates = templates.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    )

    setTemplates(updatedTemplates)
    localStorage.setItem('contractTemplates', JSON.stringify(updatedTemplates))
    setSelectedTemplate(updatedTemplate)
    setEditingField(null)
    setIsAddingField(false)

    toast({
      title: "Success",
      description: `Field ${editingField ? 'updated' : 'added'} successfully`
    })
  }

  const handleDeleteField = (fieldKey: string) => {
    if (!selectedTemplate) return

    const updatedFields = selectedTemplate.dynamicFields.filter(f => f.key !== fieldKey)
    const updatedTemplate = {
      ...selectedTemplate,
      dynamicFields: updatedFields
    }

    const updatedTemplates = templates.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    )

    setTemplates(updatedTemplates)
    localStorage.setItem('contractTemplates', JSON.stringify(updatedTemplates))
    setSelectedTemplate(updatedTemplate)

    toast({
      title: "Success",
      description: "Field deleted successfully"
    })
  }

  const generateFieldPlaceholder = (field: DynamicField) => {
    return `{{${field.key}}}`
  }

  const copyPlaceholder = async (field: DynamicField) => {
    const placeholder = generateFieldPlaceholder(field)
    await navigator.clipboard.writeText(placeholder)
    toast({
      title: "Copied",
      description: `${placeholder} copied to clipboard`
    })
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contract Template Manager</h1>
                <p className="mt-2 text-gray-600">Upload Word documents and configure dynamic fields</p>
              </div>
              <Button 
                onClick={() => router.push('/admin/contracts-hub')}
                variant="outline"
              >
                Back to Contracts Hub
              </Button>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">How it works</AlertTitle>
            <AlertDescription className="text-blue-700">
              <ol className="mt-2 space-y-1 list-decimal list-inside">
                <li>Upload your standard contract as a Word document (.docx)</li>
                <li>Configure dynamic fields that will be replaced in the contract</li>
                <li>Use placeholders like {"{{speaker_name}}"} in your Word document</li>
                <li>The system will replace these placeholders when creating contracts</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Templates List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Templates</CardTitle>
                  <CardDescription>Select a template to configure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      {template.fileName && (
                        <div className="flex items-center gap-2 mt-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">{template.fileName}</span>
                        </div>
                      )}
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {template.dynamicFields.length} fields
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Template Configuration */}
            <div className="lg:col-span-2">
              {selectedTemplate ? (
                <div className="space-y-6">
                  {/* File Upload */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Contract Document</CardTitle>
                      <CardDescription>Upload a Word document (.docx) as your contract template</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedTemplate.fileName ? (
                        <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-900">{selectedTemplate.fileName}</p>
                                <p className="text-sm text-green-700">
                                  Uploaded {new Date(selectedTemplate.uploadedAt!).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = '.docx'
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0]
                                  if (file) setFile(file)
                                }
                                input.click()
                              }}
                            >
                              Replace
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 cursor-pointer"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = '.docx'
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) setFile(file)
                            }
                            input.click()
                          }}
                        >
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">Click to upload Word document</p>
                          <p className="text-sm text-gray-500 mt-1">(.docx files only)</p>
                        </div>
                      )}

                      {file && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-blue-900">{file.name}</p>
                                <p className="text-sm text-blue-700">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFile(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleFileUpload}
                                disabled={uploading}
                              >
                                {uploading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Dynamic Fields */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Dynamic Fields</CardTitle>
                          <CardDescription>Configure fields that will be replaced in the contract</CardDescription>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingField({
                              key: '',
                              label: '',
                              type: 'text',
                              required: false
                            })
                            setIsAddingField(true)
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Field
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Placeholder</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Required</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTemplate.dynamicFields.map(field => (
                            <TableRow key={field.key}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{field.label}</p>
                                  <p className="text-sm text-gray-500">{field.key}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                                    {generateFieldPlaceholder(field)}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyPlaceholder(field)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{field.type}</Badge>
                              </TableCell>
                              <TableCell>
                                {field.required ? (
                                  <Badge className="bg-red-500 text-white">Required</Badge>
                                ) : (
                                  <Badge variant="outline">Optional</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingField(field)
                                      setIsAddingField(false)
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteField(field.key)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {selectedTemplate.dynamicFields.length === 0 && (
                        <div className="text-center py-8">
                          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No dynamic fields configured</p>
                          <p className="text-sm text-gray-500 mt-1">Add fields that will be replaced in your contract</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Template Selected</h3>
                    <p className="text-gray-500">Select a template from the list to configure it</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Field Editor Dialog */}
          <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isAddingField ? 'Add New Field' : 'Edit Field'}</DialogTitle>
                <DialogDescription>Configure the dynamic field properties</DialogDescription>
              </DialogHeader>
              {editingField && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="field-key">Field Key</Label>
                    <Input
                      id="field-key"
                      value={editingField.key}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        key: e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase()
                      })}
                      placeholder="e.g., speaker_name"
                      disabled={!isAddingField}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will become the placeholder: {`{{${editingField.key || 'field_key'}}}`}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="field-label">Field Label</Label>
                    <Input
                      id="field-label"
                      value={editingField.label}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        label: e.target.value
                      })}
                      placeholder="e.g., Speaker Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="field-type">Field Type</Label>
                    <select
                      id="field-type"
                      className="w-full px-3 py-2 border rounded-md"
                      value={editingField.type}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        type: e.target.value as DynamicField['type']
                      })}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="currency">Currency</option>
                      <option value="textarea">Text Area</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="field-default">Default Value (Optional)</Label>
                    <Input
                      id="field-default"
                      value={editingField.defaultValue || ''}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        defaultValue: e.target.value
                      })}
                      placeholder="Enter default value"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="field-required"
                      checked={editingField.required}
                      onChange={(e) => setEditingField({
                        ...editingField,
                        required: e.target.checked
                      })}
                    />
                    <Label htmlFor="field-required">Required field</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingField(null)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => handleSaveField(editingField)}
                      disabled={!editingField.key || !editingField.label}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Field
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
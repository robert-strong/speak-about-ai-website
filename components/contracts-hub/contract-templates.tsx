"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileText,
  Plus,
  Edit,
  Copy,
  Trash2,
  Settings,
  Info,
  ChevronRight,
  Code,
  Eye,
  Save,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { defaultContractTemplates, type ContractTemplate, type ContractSection } from "@/lib/contract-templates"

export function ContractTemplates() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState(defaultContractTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [editingSection, setEditingSection] = useState<ContractSection | null>(null)
  const [showVariableHelp, setShowVariableHelp] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive"
      })
      return
    }

    const newTemplate: ContractTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription || "Custom contract template",
      sections: [
        {
          id: "intro",
          title: "Introduction",
          content: "This agreement is entered into between {{client_company}} and {{speaker_name}}.",
          order: 1,
          isRequired: true
        },
        {
          id: "services",
          title: "Services",
          content: "The Speaker agrees to provide speaking services for {{event_title}} on {{event_date}}.",
          order: 2,
          isRequired: true
        },
        {
          id: "compensation",
          title: "Compensation",
          content: "The Client agrees to pay the Speaker {{speaker_fee}} for the services.",
          order: 3,
          isRequired: true
        }
      ]
    }

    setTemplates([...templates, newTemplate])
    setSelectedTemplate(newTemplate)
    setNewTemplateName("")
    setNewTemplateDescription("")
    
    toast({
      title: "Success",
      description: "New template created successfully"
    })
  }

  const handleDuplicateTemplate = (template: ContractTemplate) => {
    const newTemplate: ContractTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
    }
    setTemplates([...templates, newTemplate])
    toast({
      title: "Success",
      description: "Template duplicated successfully"
    })
  }

  const handleSaveSection = (updatedSection: ContractSection) => {
    if (!selectedTemplate) return
    
    const updatedTemplate = {
      ...selectedTemplate,
      sections: selectedTemplate.sections.map(section =>
        section.id === updatedSection.id ? updatedSection : section
      )
    }
    
    setTemplates(templates.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    ))
    setSelectedTemplate(updatedTemplate)
    setEditingSection(null)
    
    toast({
      title: "Success",
      description: "Section updated successfully"
    })
  }

  const commonVariables = [
    { var: "{{client_company}}", desc: "Client company name" },
    { var: "{{client_name}}", desc: "Client contact name" },
    { var: "{{client_email}}", desc: "Client email address" },
    { var: "{{speaker_name}}", desc: "Speaker full name" },
    { var: "{{speaker_email}}", desc: "Speaker email address" },
    { var: "{{event_title}}", desc: "Event title/name" },
    { var: "{{event_date}}", desc: "Event date" },
    { var: "{{event_location}}", desc: "Event location" },
    { var: "{{speaker_fee}}", desc: "Speaking fee amount" },
    { var: "{{payment_terms}}", desc: "Payment terms" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Contract Templates</h3>
          <p className="text-sm text-gray-600">Manage and customize your contract templates</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a new contract template with custom sections
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Standard Speaking Agreement"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  placeholder="Brief description of this template..."
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" onClick={() => {
                  setNewTemplateName("")
                  setNewTemplateDescription("")
                }}>
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
                  Create Template
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Variable Help */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <div className="flex justify-between items-start">
            <div>
              Templates use variables in double curly braces like {"{{variable_name}}"} that get replaced with actual values when creating contracts.
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowVariableHelp(!showVariableHelp)}
            >
              {showVariableHelp ? 'Hide' : 'Show'} Variables
            </Button>
          </div>
          
          {showVariableHelp && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {commonVariables.map(({ var: variable, desc }) => (
                <div key={variable} className="flex justify-between p-2 bg-white rounded">
                  <code className="text-blue-700">{variable}</code>
                  <span className="text-gray-600">{desc}</span>
                </div>
              ))}
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Templates List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Cards */}
        <div className="lg:col-span-1 space-y-4">
          {templates.map(template => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">
                    {template.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-600">
                  <p>{template.sections.length} sections</p>
                  <p>{template.variables.length} variables</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicateTemplate(template)
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedTemplate.name}</CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sections">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                    <TabsTrigger value="variables">Variables</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sections" className="space-y-4">
                    {selectedTemplate.sections
                      .sort((a, b) => a.order - b.order)
                      .map(section => (
                        <Card key={section.id}>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-sm">
                                {section.order}. {section.title}
                              </CardTitle>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingSection(section)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-600 whitespace-pre-wrap">
                              {section.content.substring(0, 200)}...
                            </div>
                            {section.variables && section.variables.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {section.variables.map(v => (
                                  <Badge key={v} variant="secondary" className="text-xs">
                                    {v}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </TabsContent>
                  
                  <TabsContent value="variables" className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {selectedTemplate.variables.map(variable => (
                        <Card key={variable.key}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{variable.label}</p>
                                <code className="text-xs text-gray-600">{"{{" + variable.key + "}}"}</code>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {variable.type}
                                </Badge>
                                {variable.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {variable.defaultValue && (
                              <p className="text-xs text-gray-500 mt-2">
                                Default: {variable.defaultValue}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Template Selected</h3>
                <p className="text-gray-500">Select a template from the list to view and edit its details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Section Editor Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Section: {editingSection?.title}</DialogTitle>
            <DialogDescription>
              Modify the section content. Use {"{{variable_name}}"} for dynamic values.
            </DialogDescription>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-title">Section Title</Label>
                <Input
                  id="section-title"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({
                    ...editingSection,
                    title: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="section-content">Section Content</Label>
                <Textarea
                  id="section-content"
                  value={editingSection.content}
                  onChange={(e) => setEditingSection({
                    ...editingSection,
                    content: e.target.value
                  })}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-editable"
                    checked={editingSection.isEditable}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      isEditable: e.target.checked
                    })}
                  />
                  <Label htmlFor="is-editable">Allow editing when creating contracts</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingSection(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection(editingSection)}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
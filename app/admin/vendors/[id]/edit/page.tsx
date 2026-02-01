"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import {
  ArrowLeft, Save, Trash2, Eye, Upload, X, Plus,
  Building2, User, Mail, Phone, Globe, MapPin,
  DollarSign, Star, Calendar, CheckCircle, XCircle,
  Clock, AlertCircle, TrendingUp, Shield, Award,
  FileText, Image, Tag, Settings, History, MessageSquare
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface VendorData {
  id: number
  company_name: string
  slug: string
  contact_name?: string
  contact_email: string
  contact_phone?: string
  website?: string
  description?: string
  location?: string
  services?: string[]
  pricing_range?: string
  minimum_budget?: number
  years_in_business?: number
  logo_url?: string
  tags?: string[]
  featured?: boolean
  verified?: boolean
  status: string
  average_rating?: number
  total_reviews?: number
  approved_at?: string
  approved_by?: string
  created_at: string
  updated_at?: string
}

interface ChangelogEntry {
  id: number
  field_name: string
  old_value: any
  new_value: any
  changed_by: string
  changed_at: string
}

export default function VendorEditPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const vendorId = params.id as string
  
  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  
  const [formData, setFormData] = useState<Partial<VendorData>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [newService, setNewService] = useState("")
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    loadVendor()
  }, [vendorId])

  useEffect(() => {
    // Check for unsaved changes
    if (vendor && formData.company_name) {
      const changed = JSON.stringify(vendor) !== JSON.stringify({ ...vendor, ...formData })
      setHasChanges(changed)
    }
  }, [formData, vendor])

  const loadVendor = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        headers: {
          "x-admin-request": "true"
        }
      })
      
      if (!response.ok) throw new Error("Failed to load vendor")
      
      const data = await response.json()
      setVendor(data.vendor)
      setFormData(data.vendor)
      setChangelog(data.changelog || [])
    } catch (error) {
      console.error("Error loading vendor:", error)
      toast({
        title: "Error",
        description: "Failed to load vendor details",
        variant: "destructive"
      })
      router.push("/admin/vendors/manage")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-request": "true"
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error("Failed to save vendor")
      
      const data = await response.json()
      setVendor(data.vendor)
      setFormData(data.vendor)
      setHasChanges(false)
      
      toast({
        title: "Success",
        description: "Vendor updated successfully"
      })
      
      // Reload to get updated changelog
      loadVendor()
    } catch (error) {
      console.error("Error saving vendor:", error)
      toast({
        title: "Error",
        description: "Failed to save vendor",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${vendor?.company_name}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "DELETE",
        headers: {
          "x-admin-request": "true"
        }
      })
      
      if (!response.ok) throw new Error("Failed to delete vendor")
      
      toast({
        title: "Success",
        description: "Vendor deleted successfully"
      })
      
      router.push("/admin/vendors/manage")
    } catch (error) {
      console.error("Error deleting vendor:", error)
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive"
      })
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const response = await fetch("/api/vendors/upload", {
        method: "POST",
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, logo_url: data.url })
        toast({
          title: "Logo uploaded",
          description: "Remember to save your changes"
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const addService = () => {
    if (newService.trim()) {
      const services = formData.services || []
      setFormData({
        ...formData,
        services: [...services, newService.trim()]
      })
      setNewService("")
    }
  }

  const removeService = (index: number) => {
    const services = formData.services || []
    setFormData({
      ...formData,
      services: services.filter((_, i) => i !== index)
    })
  }

  const addTag = () => {
    if (newTag.trim()) {
      const tags = formData.tags || []
      setFormData({
        ...formData,
        tags: [...tags, newTag.trim()]
      })
      setNewTag("")
    }
  }

  const removeTag = (index: number) => {
    const tags = formData.tags || []
    setFormData({
      ...formData,
      tags: tags.filter((_, i) => i !== index)
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />
      case "rejected": return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "success"
      case "pending": return "warning"
      case "rejected": return "destructive"
      default: return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Vendor not found</p>
          <Button onClick={() => router.push("/admin/vendors/manage")} className="mt-4">
            Back to Vendors
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/vendors/manage")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Vendor</h1>
              <p className="text-gray-600">Manage vendor information and settings</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Badge variant="warning" className="py-1">
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => window.open(`/vendor-directory/vendors/${vendor.slug || vendor.id}`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(formData.status || "")}
                  <span className="font-semibold capitalize">{formData.status}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {vendor.average_rating?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({vendor.total_reviews || 0})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Pricing</p>
              <p className="font-semibold mt-1">{formData.pricing_range || "Not set"}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-semibold mt-1">
                {format(new Date(vendor.created_at), "MMM yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.featured || false}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, featured: checked })
                  }
                />
                <Label className="text-sm">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.verified || false}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, verified: checked })
                  }
                />
                <Label className="text-sm">Verified</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="media">Media & Branding</TabsTrigger>
          <TabsTrigger value="services">Services & Pricing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Basic details about the vendor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name*</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name || ""}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug || ""}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="company-name"
                  />
                  <p className="text-xs text-gray-500">
                    /vendor-directory/vendors/{formData.slug || "company-name"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, State"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="years_in_business">Years in Business</Label>
                  <Input
                    id="years_in_business"
                    type="number"
                    value={formData.years_in_business || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      years_in_business: parseInt(e.target.value) 
                    })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the vendor's services and specialties..."
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  {(formData.description || "").length} / 500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Primary contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact_name"
                      value={formData.contact_name || ""}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="John Doe"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email Address*</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email || ""}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="contact@company.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone || ""}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="website"
                      value={formData.website || ""}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.company.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Branding</CardTitle>
              <CardDescription>Manage vendor's visual identity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label>Company Logo</Label>
                  <div className="mt-4 flex items-start gap-6">
                    <Avatar className="h-32 w-32 border-2 border-gray-200">
                      <AvatarImage src={formData.logo_url} />
                      <AvatarFallback className="text-3xl">
                        {formData.company_name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="mb-2"
                        />
                        <p className="text-sm text-gray-500">
                          Recommended: Square image, at least 400x400px
                        </p>
                      </div>
                      
                      {formData.logo_url && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={formData.logo_url}
                            readOnly
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({ ...formData, logo_url: "" })}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label>Portfolio Gallery</Label>
                  <p className="text-sm text-gray-500 mb-4">
                    Additional images showcasing the vendor's work
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 cursor-pointer transition-colors">
                      <label className="cursor-pointer text-center p-4">
                        <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <span className="text-sm text-gray-500">Add Images</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Portfolio gallery feature will be available soon"
                            })
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>List of services this vendor provides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a service..."
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addService()}
                  />
                  <Button onClick={addService}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.services || []).map((service, index) => (
                    <Badge key={index} variant="secondary" className="py-1 px-3">
                      {service}
                      <button
                        onClick={() => removeService(index)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!formData.services || formData.services.length === 0) && (
                    <p className="text-gray-500 text-sm">No services added yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
              <CardDescription>Set pricing tier and budget requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pricing_range">Pricing Range</Label>
                  <Select
                    value={formData.pricing_range || ""}
                    onValueChange={(value) => setFormData({ ...formData, pricing_range: value })}
                  >
                    <SelectTrigger id="pricing_range">
                      <SelectValue placeholder="Select pricing tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ - Budget Friendly</SelectItem>
                      <SelectItem value="$$">$$ - Moderate</SelectItem>
                      <SelectItem value="$$$">$$$ - Premium</SelectItem>
                      <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minimum_budget">Minimum Budget</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="minimum_budget"
                      type="number"
                      value={formData.minimum_budget || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        minimum_budget: parseInt(e.target.value) 
                      })}
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags & Categories</CardTitle>
              <CardDescription>Help customers find this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.tags || []).map((tag, index) => (
                    <Badge key={index} variant="outline" className="py-1 px-3">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => removeTag(index)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!formData.tags || formData.tags.length === 0) && (
                    <p className="text-gray-500 text-sm">No tags added yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Settings</CardTitle>
              <CardDescription>Administrative settings and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          Pending Review
                        </div>
                      </SelectItem>
                      <SelectItem value="approved">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Approved
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Rejected
                        </div>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          Suspended
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Featured Vendor</Label>
                      <p className="text-sm text-gray-500">Display prominently in listings</p>
                    </div>
                    <Switch
                      checked={formData.featured || false}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, featured: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Verified Badge</Label>
                      <p className="text-sm text-gray-500">Show verification badge</p>
                    </div>
                    <Switch
                      checked={formData.verified || false}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, verified: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {vendor.approved_at && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Approved By</p>
                    <p className="font-medium">{vendor.approved_by || "System"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Approved On</p>
                    <p className="font-medium">
                      {format(new Date(vendor.approved_at), "PPP")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change History</CardTitle>
              <CardDescription>Track all modifications to this vendor profile</CardDescription>
            </CardHeader>
            <CardContent>
              {changelog.length > 0 ? (
                <div className="space-y-4">
                  {changelog.map((change) => (
                    <div key={change.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <History className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">
                            {change.field_name.replace(/_/g, " ").charAt(0).toUpperCase() + 
                             change.field_name.replace(/_/g, " ").slice(1)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(change.changed_at), "PPp")}
                          </p>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600">
                            <span className="text-gray-500">From:</span> {JSON.stringify(change.old_value) || "Empty"}
                          </p>
                          <p className="text-gray-600">
                            <span className="text-gray-500">To:</span> {JSON.stringify(change.new_value) || "Empty"}
                          </p>
                          <p className="text-gray-500">By: {change.changed_by}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No changes recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
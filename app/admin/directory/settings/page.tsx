"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  Settings, Save, Plus, Trash2, Edit2, X, Check,
  Globe, Mail, Phone, Building2, DollarSign, Tag,
  Shield, Bell, Eye, EyeOff, Copy, RefreshCw,
  ChevronRight, Users, Filter, Layout, Palette,
  FileText, Database, Zap, AlertCircle, Info,
  ArrowUp, ArrowDown, Grid, List, Search
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  display_order: number
  is_active: boolean
  vendor_count?: number
}

interface PricingTier {
  id: string
  symbol: string
  name: string
  min_budget: number
  max_budget?: number
  description: string
  color: string
}

interface DirectorySettings {
  // General Settings
  directory_name: string
  directory_description: string
  contact_email: string
  support_phone?: string
  
  // Display Settings
  vendors_per_page: number
  show_featured_first: boolean
  enable_reviews: boolean
  enable_ratings: boolean
  require_approval: boolean
  auto_approve_verified: boolean
  
  // SEO Settings
  meta_title: string
  meta_description: string
  og_image?: string
  
  // Email Settings
  notification_email: string
  send_vendor_notifications: boolean
  send_admin_notifications: boolean
  
  // Access Settings
  public_access: boolean
  require_login_to_view: boolean
  require_login_to_contact: boolean
  
  // API Settings
  api_enabled: boolean
  api_rate_limit: number
  webhook_url?: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  last_updated?: string
}

export default function DirectorySettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    icon: ""
  })
  
  // Pricing Tiers
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { id: "1", symbol: "$", name: "Budget", min_budget: 0, max_budget: 5000, description: "Affordable options for smaller events", color: "green" },
    { id: "2", symbol: "$$", name: "Moderate", min_budget: 5000, max_budget: 25000, description: "Mid-range pricing for standard events", color: "blue" },
    { id: "3", symbol: "$$$", name: "Premium", min_budget: 25000, max_budget: 75000, description: "High-end services with premium features", color: "purple" },
    { id: "4", symbol: "$$$$", name: "Luxury", min_budget: 75000, description: "Exclusive luxury services", color: "gold" }
  ])
  
  // Settings
  const [settings, setSettings] = useState<DirectorySettings>({
    directory_name: "Vendor Directory",
    directory_description: "Find the perfect vendors for your event",
    contact_email: "directory@speakaboutai.com",
    support_phone: "",
    vendors_per_page: 20,
    show_featured_first: true,
    enable_reviews: true,
    enable_ratings: true,
    require_approval: true,
    auto_approve_verified: false,
    meta_title: "Vendor Directory - Find Event Vendors",
    meta_description: "Browse our curated directory of event vendors",
    og_image: "",
    notification_email: "admin@speakaboutai.com",
    send_vendor_notifications: true,
    send_admin_notifications: true,
    public_access: true,
    require_login_to_view: false,
    require_login_to_contact: true,
    api_enabled: false,
    api_rate_limit: 100,
    webhook_url: ""
  })
  
  // Email Templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: "vendor_approved",
      name: "Vendor Approved",
      subject: "Your vendor application has been approved!",
      body: "Dear {{vendor_name}},\n\nWe're excited to inform you that your vendor application has been approved...",
      variables: ["vendor_name", "company_name", "login_url"]
    },
    {
      id: "vendor_rejected",
      name: "Vendor Rejected",
      subject: "Update on your vendor application",
      body: "Dear {{vendor_name}},\n\nThank you for your interest in joining our vendor directory...",
      variables: ["vendor_name", "company_name", "reason"]
    },
    {
      id: "new_inquiry",
      name: "New Inquiry",
      subject: "New inquiry from {{customer_name}}",
      body: "You have received a new inquiry through the vendor directory...",
      variables: ["customer_name", "customer_email", "message", "vendor_name"]
    }
  ])
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Load categories
      const categoriesRes = await fetch("/api/directory/categories", {
        headers: { "x-admin-request": "true" }
      })
      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }
      
      // Load settings (would typically come from API)
      // For now using default state
      
      setLoading(false)
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load directory settings",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Save settings API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast({
        title: "Success",
        description: "Settings saved successfully"
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name) return
    
    try {
      // API call to create category
      const response = await fetch("/api/directory/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-request": "true"
        },
        body: JSON.stringify({
          ...newCategory,
          slug: newCategory.slug || newCategory.name.toLowerCase().replace(/\s+/g, "-"),
          display_order: categories.length,
          is_active: true
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCategories([...categories, data.category])
        setNewCategory({ name: "", slug: "", description: "", icon: "" })
        toast({
          title: "Success",
          description: "Category added successfully"
        })
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      })
    }
  }

  const handleUpdateCategory = async (category: Category) => {
    try {
      // API call to update category
      const response = await fetch(`/api/directory/categories/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-request": "true"
        },
        body: JSON.stringify(category)
      })
      
      if (response.ok) {
        setCategories(categories.map(c => c.id === category.id ? category : c))
        setEditingCategory(null)
        toast({
          title: "Success",
          description: "Category updated successfully"
        })
      }
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    
    try {
      const response = await fetch(`/api/directory/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          "x-admin-request": "true"
        }
      })
      
      if (response.ok) {
        setCategories(categories.filter(c => c.id !== categoryId))
        toast({
          title: "Success",
          description: "Category deleted successfully"
        })
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      })
    }
  }

  const handleMoveCategory = (categoryId: number, direction: "up" | "down") => {
    const index = categories.findIndex(c => c.id === categoryId)
    if (index === -1) return
    
    const newCategories = [...categories]
    if (direction === "up" && index > 0) {
      [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]]
    } else if (direction === "down" && index < categories.length - 1) {
      [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]]
    }
    
    // Update display order
    newCategories.forEach((cat, i) => {
      cat.display_order = i
    })
    
    setCategories(newCategories)
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Directory Settings</h1>
            <p className="text-gray-600">Configure your vendor directory settings and preferences</p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Tiers</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="vendor-portal">Vendor Portal</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure the basic details of your vendor directory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="directory_name">Directory Name</Label>
                  <Input
                    id="directory_name"
                    value={settings.directory_name}
                    onChange={(e) => setSettings({ ...settings, directory_name: e.target.value })}
                    placeholder="Vendor Directory"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="directory_description">Directory Description</Label>
                <Textarea
                  id="directory_description"
                  value={settings.directory_description}
                  onChange={(e) => setSettings({ ...settings, directory_description: e.target.value })}
                  rows={3}
                  placeholder="A brief description of your vendor directory..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="support_phone">Support Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="support_phone"
                    value={settings.support_phone}
                    onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your directory for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={settings.meta_title}
                  onChange={(e) => setSettings({ ...settings, meta_title: e.target.value })}
                  placeholder="Vendor Directory - Find Event Vendors"
                />
                <p className="text-xs text-gray-500">{settings.meta_title.length} / 60 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={settings.meta_description}
                  onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
                  rows={3}
                  placeholder="Browse our curated directory of event vendors..."
                />
                <p className="text-xs text-gray-500">{settings.meta_description.length} / 160 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="og_image">Open Graph Image URL</Label>
                <Input
                  id="og_image"
                  value={settings.og_image}
                  onChange={(e) => setSettings({ ...settings, og_image: e.target.value })}
                  placeholder="https://example.com/og-image.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Categories</CardTitle>
              <CardDescription>Manage the categories vendors can be listed under</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add New Category */}
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-4">Add New Category</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Category Name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ 
                      ...newCategory, 
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    })}
                  />
                  <Input
                    placeholder="URL Slug"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  />
                  <Input
                    placeholder="Icon (emoji or class)"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  />
                  <Button onClick={handleAddCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
                <Input
                  className="mt-4"
                  placeholder="Description (optional)"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>

              {/* Categories List */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Vendors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category, index) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveCategory(category.id, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveCategory(category.id, "down")}
                            disabled={index === categories.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingCategory?.id === category.id ? (
                          <Input
                            value={editingCategory.icon}
                            onChange={(e) => setEditingCategory({ 
                              ...editingCategory, 
                              icon: e.target.value 
                            })}
                            className="w-16"
                          />
                        ) : (
                          <span className="text-2xl">{category.icon || "📁"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCategory?.id === category.id ? (
                          <Input
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ 
                              ...editingCategory, 
                              name: e.target.value 
                            })}
                          />
                        ) : (
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-sm text-gray-500">{category.description}</p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCategory?.id === category.id ? (
                          <Input
                            value={editingCategory.slug}
                            onChange={(e) => setEditingCategory({ 
                              ...editingCategory, 
                              slug: e.target.value 
                            })}
                          />
                        ) : (
                          <code className="text-sm">{category.slug}</code>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.vendor_count || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={editingCategory?.id === category.id 
                            ? editingCategory.is_active 
                            : category.is_active}
                          onCheckedChange={(checked) => {
                            if (editingCategory?.id === category.id) {
                              setEditingCategory({ ...editingCategory, is_active: checked })
                            } else {
                              handleUpdateCategory({ ...category, is_active: checked })
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {editingCategory?.id === category.id ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateCategory(editingCategory)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCategory(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCategory(category)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No categories yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tiers */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Tiers</CardTitle>
              <CardDescription>Define pricing ranges for vendor services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingTiers.map((tier) => (
                  <div key={tier.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Symbol</Label>
                        <Input
                          value={tier.symbol}
                          onChange={(e) => setPricingTiers(
                            pricingTiers.map(t => t.id === tier.id 
                              ? { ...t, symbol: e.target.value }
                              : t
                            )
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={tier.name}
                          onChange={(e) => setPricingTiers(
                            pricingTiers.map(t => t.id === tier.id 
                              ? { ...t, name: e.target.value }
                              : t
                            )
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Min Budget</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            value={tier.min_budget}
                            onChange={(e) => setPricingTiers(
                              pricingTiers.map(t => t.id === tier.id 
                                ? { ...t, min_budget: parseInt(e.target.value) }
                                : t
                              )
                            )}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Max Budget</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            value={tier.max_budget || ""}
                            onChange={(e) => setPricingTiers(
                              pricingTiers.map(t => t.id === tier.id 
                                ? { ...t, max_budget: e.target.value ? parseInt(e.target.value) : undefined }
                                : t
                              )
                            )}
                            placeholder="No limit"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <Select
                          value={tier.color}
                          onValueChange={(value) => setPricingTiers(
                            pricingTiers.map(t => t.id === tier.id 
                              ? { ...t, color: value }
                              : t
                            )
                          )}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Description</Label>
                      <Input
                        value={tier.description}
                        onChange={(e) => setPricingTiers(
                          pricingTiers.map(t => t.id === tier.id 
                            ? { ...t, description: e.target.value }
                            : t
                          )
                        )}
                        placeholder="Brief description of this pricing tier..."
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <Alert className="mt-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Pricing tiers help customers filter vendors by budget. 
                  The max budget is optional - leave it empty for the highest tier.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Configure how the directory is displayed to visitors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vendors_per_page">Vendors Per Page</Label>
                  <Select
                    value={settings.vendors_per_page.toString()}
                    onValueChange={(value) => setSettings({ 
                      ...settings, 
                      vendors_per_page: parseInt(value) 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Show Featured First</Label>
                    <p className="text-sm text-gray-500">Display featured vendors at the top</p>
                  </div>
                  <Switch
                    checked={settings.show_featured_first}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, show_featured_first: checked })
                    }
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Enable Reviews</Label>
                    <p className="text-sm text-gray-500">Allow customers to leave reviews</p>
                  </div>
                  <Switch
                    checked={settings.enable_reviews}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enable_reviews: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Enable Ratings</Label>
                    <p className="text-sm text-gray-500">Show star ratings for vendors</p>
                  </div>
                  <Switch
                    checked={settings.enable_ratings}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enable_ratings: checked })
                    }
                  />
                </div>
              </div>
              
              <Alert>
                <Layout className="h-4 w-4" />
                <AlertDescription>
                  These settings affect how vendors are displayed in the public directory.
                  Changes will be applied immediately after saving.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Settings</CardTitle>
              <CardDescription>Configure vendor approval workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Require Approval</Label>
                  <p className="text-sm text-gray-500">New vendors must be approved before appearing</p>
                </div>
                <Switch
                  checked={settings.require_approval}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, require_approval: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Auto-Approve Verified</Label>
                  <p className="text-sm text-gray-500">Automatically approve vendors with verified status</p>
                </div>
                <Switch
                  checked={settings.auto_approve_verified}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, auto_approve_verified: checked })
                  }
                  disabled={!settings.require_approval}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Directory Access</CardTitle>
              <CardDescription>Control who can access your vendor directory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Public Access</Label>
                  <p className="text-sm text-gray-500">Allow anyone to browse the directory</p>
                </div>
                <Switch
                  checked={settings.public_access}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, public_access: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Require Login to View</Label>
                  <p className="text-sm text-gray-500">Users must sign in to view vendor details</p>
                </div>
                <Switch
                  checked={settings.require_login_to_view}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, require_login_to_view: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Require Login to Contact</Label>
                  <p className="text-sm text-gray-500">Users must sign in to contact vendors</p>
                </div>
                <Switch
                  checked={settings.require_login_to_contact}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, require_login_to_contact: checked })
                  }
                />
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Access controls help you manage who can interact with your vendor directory.
                  Consider your audience when setting these restrictions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notification_email">Notification Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="notification_email"
                    type="email"
                    value={settings.notification_email}
                    onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Vendor Notifications</Label>
                    <p className="text-sm text-gray-500">Send emails to vendors</p>
                  </div>
                  <Switch
                    checked={settings.send_vendor_notifications}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, send_vendor_notifications: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Admin Notifications</Label>
                    <p className="text-sm text-gray-500">Send emails to admins</p>
                  </div>
                  <Switch
                    checked={settings.send_admin_notifications}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, send_admin_notifications: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Portal */}
        <TabsContent value="vendor-portal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Self-Service Portal</CardTitle>
              <CardDescription>
                Vendors can manage their own profiles through a secure, passwordless login system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security:</strong> The vendor portal uses email-based authentication with magic links. 
                  No passwords are stored, ensuring maximum security.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    How Vendor Login Works
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Vendor enters their email at <code>/vendors/login</code></li>
                    <li>System sends a secure magic link to their email</li>
                    <li>Vendor clicks the link to access their dashboard</li>
                    <li>Session remains active for 30 days</li>
                  </ol>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Vendor Portal Features
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Edit company information
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Upload logo and photos
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Manage services and pricing
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Update contact details
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        View performance metrics
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Track profile views
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        See change history
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Upload documents
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Globe className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <p className="font-semibold">Vendor Login</p>
                        <p className="text-sm text-gray-500 mt-1">/vendors/login</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full"
                          onClick={() => window.open("/vendors/login", "_blank")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="font-semibold">Vendor Dashboard</p>
                        <p className="text-sm text-gray-500 mt-1">/vendors/dashboard</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full"
                          onClick={() => window.open("/vendors/dashboard", "_blank")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                        <p className="font-semibold">Application Form</p>
                        <p className="text-sm text-gray-500 mt-1">/vendors/apply</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full"
                          onClick={() => window.open("/vendors/apply", "_blank")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Portal Settings</h4>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Allow Vendor Self-Registration</Label>
                    <p className="text-sm text-gray-500">Let new vendors apply through the application form</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Email Verification Required</Label>
                    <p className="text-sm text-gray-500">Vendors must verify email before accessing dashboard</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Auto-Send Welcome Email</Label>
                    <p className="text-sm text-gray-500">Send onboarding instructions when vendors are approved</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Magic Link Expiration</Label>
                  <Select defaultValue="15">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Session Duration</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Customize automated email messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => setEditingTemplate(
                        editingTemplate?.id === template.id ? null : template
                      )}
                    >
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-500">{template.subject}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        editingTemplate?.id === template.id ? "rotate-90" : ""
                      }`} />
                    </div>
                    
                    {editingTemplate?.id === template.id && (
                      <div className="p-4 border-t space-y-4">
                        <div className="space-y-2">
                          <Label>Subject Line</Label>
                          <Input
                            value={editingTemplate.subject}
                            onChange={(e) => setEditingTemplate({
                              ...editingTemplate,
                              subject: e.target.value
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Email Body</Label>
                          <Textarea
                            value={editingTemplate.body}
                            onChange={(e) => setEditingTemplate({
                              ...editingTemplate,
                              body: e.target.value
                            })}
                            rows={8}
                            className="font-mono text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Available Variables</Label>
                          <div className="flex flex-wrap gap-2">
                            {editingTemplate.variables.map((variable) => (
                              <Badge key={variable} variant="secondary">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              // Reset to original
                              setEditingTemplate(null)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              // Save template
                              setEmailTemplates(emailTemplates.map(t => 
                                t.id === editingTemplate.id ? editingTemplate : t
                              ))
                              setEditingTemplate(null)
                              toast({
                                title: "Success",
                                description: "Email template updated"
                              })
                            }}
                          >
                            Save Template
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API & Webhooks */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Enable and configure API access for your directory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Enable API</Label>
                  <p className="text-sm text-gray-500">Allow external applications to access directory data</p>
                </div>
                <Switch
                  checked={settings.api_enabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, api_enabled: checked })
                  }
                />
              </div>
              
              {settings.api_enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="api_rate_limit">Rate Limit (requests per hour)</Label>
                    <Input
                      id="api_rate_limit"
                      type="number"
                      value={settings.api_rate_limit}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        api_rate_limit: parseInt(e.target.value) 
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>API Endpoints</Label>
                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
                      <p>GET /api/directory/vendors</p>
                      <p>GET /api/directory/vendors/:id</p>
                      <p>GET /api/directory/categories</p>
                      <p>GET /api/directory/search</p>
                    </div>
                  </div>
                  
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      API keys can be generated for individual users in the user management section.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Send real-time updates to external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  value={settings.webhook_url}
                  onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                  placeholder="https://example.com/webhook"
                />
              </div>
              
              {settings.webhook_url && (
                <>
                  <div className="space-y-2">
                    <Label>Webhook Events</Label>
                    <div className="space-y-2">
                      {[
                        "vendor.created",
                        "vendor.updated",
                        "vendor.deleted",
                        "vendor.approved",
                        "review.created",
                        "inquiry.received"
                      ].map((event) => (
                        <div key={event} className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <Label className="font-normal">{event}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Webhook
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
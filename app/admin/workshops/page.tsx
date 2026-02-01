"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminSidebar } from "@/components/admin-sidebar"
import { WorkshopMediaManager } from "@/components/workshop-media-manager"
import { Plus, Edit, Trash2, Search, Eye, Star, Users, Clock, Loader2, CheckCircle, XCircle } from "lucide-react"
import { TableSkeleton } from "@/components/admin-loading-skeletons"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Testimonial, PricingTier } from "@/lib/workshops-db"

interface Workshop {
  id: number
  title: string
  slug: string
  speaker_id: number | null
  speaker_name?: string
  short_description: string | null
  duration_minutes: number | null
  format: string | null
  target_audience: string | null
  price_range: string | null
  technical_experience_needed?: string | null
  active: boolean
  featured: boolean
  created_at: string
  thumbnail_url?: string | null
  video_urls?: string[] | null
  image_urls?: string[] | null
  testimonials?: Testimonial[] | null
  client_logos?: string[] | null
  pricing_tiers?: PricingTier[] | null
}

interface Speaker {
  id: number
  name: string
}

export default function AdminWorkshopsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null)

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Validators
  const validateTitle = (title: string): string => {
    if (!title.trim()) return "Title is required"
    if (title.trim().length < 3) return "Title must be at least 3 characters"
    return ""
  }

  const validateSlug = (slug: string): string => {
    if (!slug.trim()) return "Slug is required"
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) return "Slug can only contain lowercase letters, numbers, and hyphens"
    return ""
  }

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "title": return validateTitle(value)
      case "slug": return validateSlug(value)
      default: return ""
    }
  }

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name as keyof typeof formData] as string)
    setFieldErrors(prev => ({ ...prev, [name]: error }))
  }

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    speaker_id: "none",
    short_description: "",
    description: "",
    duration_minutes: "",
    formats: [] as string[],
    max_participants: "",
    price_range: "",
    target_audience: "",
    prerequisites: "",
    technical_experience_needed: "",
    learning_objectives: "",
    materials_included: "",
    key_takeaways: "",
    agenda: "",
    topics: "",
    customizable: true,
    custom_options: "",
    category: "",
    display_order: "",
    badge_text: "",
    roi_stats: "",
    meta_title: "",
    meta_description: "",
    keywords: "",
    active: true,
    featured: false,
    thumbnail_url: "",
    thumbnail_position: "center",
    video_urls: [] as string[],
    image_urls: [] as string[],
    testimonials: [] as Testimonial[],
    client_logos: [] as string[],
    pricing_tiers: [] as PricingTier[]
  })

  useEffect(() => {
    loadWorkshops()
    loadSpeakers()
  }, [])

  const loadWorkshops = async () => {
    try {
      const token = localStorage.getItem("adminSessionToken")
      const response = await fetch("/api/workshops?includeInactive=true", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-dev-admin-bypass": "dev-admin-access"
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Handle both response formats: { workshops: [...] } or direct array
        const workshopsData = Array.isArray(data) ? data : (data.workshops || [])
        setWorkshops(workshopsData)
      }
    } catch (error) {
      console.error("Error loading workshops:", error)
      toast({
        title: "Error",
        description: "Failed to load workshops",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSpeakers = async () => {
    try {
      const token = localStorage.getItem("adminSessionToken")
      const response = await fetch("/api/admin/speakers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-dev-admin-bypass": "dev-admin-access"
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Filter out speakers with invalid IDs before setting state
        const validSpeakers = (data.speakers || []).filter((speaker: Speaker) => {
          if (!speaker.id || !speaker.name) return false
          const idStr = speaker.id.toString().trim()
          return idStr !== ""
        })
        setSpeakers(validSpeakers)
      } else {
        toast({
          title: "Warning",
          description: "Failed to load speakers list",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading speakers:", error)
      toast({
        title: "Error",
        description: "Failed to load speakers list",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const titleError = validateTitle(formData.title)
    const slugError = validateSlug(formData.slug)

    setTouched({ title: true, slug: true })
    setFieldErrors({ title: titleError, slug: slugError })

    if (titleError || slugError) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted errors before saving",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem("adminSessionToken")

      // Parse ROI stats if it's a JSON string
      let roiStats = null
      if (formData.roi_stats && formData.roi_stats.trim()) {
        try {
          roiStats = JSON.parse(formData.roi_stats)
        } catch (e) {
          console.error("Invalid ROI stats JSON:", e)
          toast({
            title: "Warning",
            description: "ROI stats contains invalid JSON and will be ignored",
            variant: "destructive"
          })
        }
      }

      const payload = {
        title: formData.title,
        slug: formData.slug,
        speaker_id: formData.speaker_id && formData.speaker_id !== "none" ? parseInt(formData.speaker_id) : null,
        short_description: formData.short_description || null,
        description: formData.description || null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        format: formData.formats.join(", ") || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        price_range: formData.price_range || null,
        target_audience: formData.target_audience || null,
        prerequisites: formData.prerequisites || null,
        technical_experience_needed: formData.technical_experience_needed || null,
        learning_objectives: formData.learning_objectives.split("\n").filter(Boolean),
        materials_included: formData.materials_included.split("\n").filter(Boolean),
        key_takeaways: formData.key_takeaways.split("\n").filter(Boolean),
        agenda: formData.agenda || null,
        topics: formData.topics.split(",").map(t => t.trim()).filter(Boolean),
        customizable: formData.customizable,
        custom_options: formData.custom_options || null,
        category: formData.category || null,
        display_order: formData.display_order ? parseInt(formData.display_order) : null,
        badge_text: formData.badge_text || null,
        roi_stats: roiStats,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
        active: formData.active,
        featured: formData.featured,
        thumbnail_url: formData.thumbnail_url || null,
        thumbnail_position: formData.thumbnail_position || "center",
        video_urls: formData.video_urls.length > 0 ? formData.video_urls : null,
        image_urls: formData.image_urls.length > 0 ? formData.image_urls : null,
        testimonials: formData.testimonials.length > 0 ? formData.testimonials : null,
        client_logos: formData.client_logos.length > 0 ? formData.client_logos : null,
        pricing_tiers: formData.pricing_tiers.length > 0 ? formData.pricing_tiers : null
      }

      const url = editingWorkshop
        ? `/api/workshops/${editingWorkshop.id}`
        : "/api/workshops"
      const method = editingWorkshop ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-dev-admin-bypass": "dev-admin-access"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Workshop ${editingWorkshop ? "updated" : "created"} successfully`
        })
        setShowCreateForm(false)
        setEditingWorkshop(null)
        resetForm()
        loadWorkshops()
      } else {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }
    } catch (error) {
      console.error("Error saving workshop:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save workshop",
        variant: "destructive"
      })
    }
  }

  const [editLoading, setEditLoading] = useState(false)

  const handleEdit = async (workshop: Workshop) => {
    setEditLoading(true)
    try {
      // Fetch full workshop data including all fields
      const token = localStorage.getItem("adminSessionToken")
      console.log("Fetching workshop:", workshop.id)
      const response = await fetch(`/api/workshops/${workshop.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-dev-admin-bypass": "dev-admin-access"
        }
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(errorData.details || errorData.error || "Failed to load workshop details")
      }

      const fullWorkshop = await response.json()
      console.log("Loaded workshop:", fullWorkshop)

      setEditingWorkshop(fullWorkshop)
      setFormData({
        title: fullWorkshop.title,
        slug: fullWorkshop.slug,
        speaker_id: fullWorkshop.speaker_id ? fullWorkshop.speaker_id.toString() : "none",
        short_description: fullWorkshop.short_description || "",
        description: fullWorkshop.description || "",
        duration_minutes: fullWorkshop.duration_minutes?.toString() || "",
        formats: fullWorkshop.format ? fullWorkshop.format.split(", ").map((f: string) => f.trim()).filter(Boolean) : [],
        max_participants: fullWorkshop.max_participants?.toString() || "",
        price_range: fullWorkshop.price_range || "",
        target_audience: fullWorkshop.target_audience || "",
        prerequisites: fullWorkshop.prerequisites || "",
        technical_experience_needed: fullWorkshop.technical_experience_needed || "",
        learning_objectives: Array.isArray(fullWorkshop.learning_objectives)
          ? fullWorkshop.learning_objectives.join("\n")
          : "",
        materials_included: Array.isArray(fullWorkshop.materials_included)
          ? fullWorkshop.materials_included.join("\n")
          : "",
        key_takeaways: Array.isArray(fullWorkshop.key_takeaways)
          ? fullWorkshop.key_takeaways.join("\n")
          : "",
        agenda: fullWorkshop.agenda || "",
        topics: Array.isArray(fullWorkshop.topics)
          ? fullWorkshop.topics.join(", ")
          : "",
        customizable: fullWorkshop.customizable ?? true,
        custom_options: fullWorkshop.custom_options || "",
        category: fullWorkshop.category || "",
        display_order: fullWorkshop.display_order?.toString() || "",
        badge_text: fullWorkshop.badge_text || "",
        roi_stats: fullWorkshop.roi_stats ? JSON.stringify(fullWorkshop.roi_stats, null, 2) : "",
        meta_title: fullWorkshop.meta_title || "",
        meta_description: fullWorkshop.meta_description || "",
        keywords: Array.isArray(fullWorkshop.keywords)
          ? fullWorkshop.keywords.join(", ")
          : "",
        active: fullWorkshop.active,
        featured: fullWorkshop.featured,
        thumbnail_url: fullWorkshop.thumbnail_url || "",
        thumbnail_position: fullWorkshop.thumbnail_position || "center",
        video_urls: fullWorkshop.video_urls || [],
        image_urls: fullWorkshop.image_urls || [],
        testimonials: fullWorkshop.testimonials || [],
        client_logos: fullWorkshop.client_logos || [],
        pricing_tiers: fullWorkshop.pricing_tiers || []
      })
      setShowCreateForm(true)
    } catch (error) {
      console.error("Error loading workshop for edit:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load workshop details",
        variant: "destructive"
      })
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this workshop?")) return

    try {
      const token = localStorage.getItem("adminSessionToken")
      const response = await fetch(`/api/workshops/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-dev-admin-bypass": "dev-admin-access"
        }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Workshop deleted successfully"
        })
        loadWorkshops()
      }
    } catch (error) {
      console.error("Error deleting workshop:", error)
      toast({
        title: "Error",
        description: "Failed to delete workshop",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      speaker_id: "none",
      short_description: "",
      description: "",
      duration_minutes: "",
      formats: [],
      max_participants: "",
      price_range: "",
      target_audience: "",
      prerequisites: "",
      technical_experience_needed: "",
      learning_objectives: "",
      materials_included: "",
      key_takeaways: "",
      agenda: "",
      topics: "",
      customizable: true,
      custom_options: "",
      category: "",
      display_order: "",
      badge_text: "",
      roi_stats: "",
      meta_title: "",
      meta_description: "",
      keywords: "",
      active: true,
      featured: false,
      thumbnail_url: "",
      thumbnail_position: "center",
      video_urls: [],
      image_urls: [],
      testimonials: [],
      client_logos: [],
      pricing_tiers: []
    })
  }

  const toggleFormat = (format: string) => {
    setFormData(prev => ({
      ...prev,
      formats: prev.formats.includes(format)
        ? prev.formats.filter(f => f !== format)
        : [...prev.formats, format]
    }))
  }

  const filteredWorkshops = workshops.filter(workshop =>
    workshop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workshop.speaker_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workshop.target_audience?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>

      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workshops Management</h1>
              <p className="mt-2 text-gray-600">Manage AI workshops and training sessions</p>
            </div>
            <Button onClick={() => { setShowCreateForm(true); setEditingWorkshop(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Workshop
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{editingWorkshop ? "Edit Workshop" : "Create New Workshop"}</CardTitle>
                <CardDescription>
                  {editingWorkshop ? "Update workshop details" : "Add a new workshop to your catalog"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="title">Workshop Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value })
                          if (touched.title) {
                            setFieldErrors(prev => ({ ...prev, title: validateTitle(e.target.value) }))
                          }
                        }}
                        onBlur={() => handleBlur("title")}
                        className={touched.title && fieldErrors.title ? "border-red-500" : ""}
                        required
                      />
                      {touched.title && fieldErrors.title && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors.title}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="slug">URL Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => {
                          setFormData({ ...formData, slug: e.target.value })
                          if (touched.slug) {
                            setFieldErrors(prev => ({ ...prev, slug: validateSlug(e.target.value) }))
                          }
                        }}
                        onBlur={() => handleBlur("slug")}
                        className={touched.slug && fieldErrors.slug ? "border-red-500" : ""}
                        placeholder="ai-for-executives"
                        required
                      />
                      {touched.slug && fieldErrors.slug && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors.slug}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="speaker">Speaker</Label>
                      <Select
                        value={formData.speaker_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, speaker_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a speaker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No speaker assigned</SelectItem>
                          {speakers.filter(speaker => {
                            // Filter out speakers with invalid IDs
                            if (!speaker.id || !speaker.name) return false
                            const idStr = speaker.id.toString().trim()
                            return idStr !== ""
                          }).map((speaker) => (
                            <SelectItem key={speaker.id} value={speaker.id.toString()}>
                              {speaker.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Format (select all that apply)</Label>
                      <div className="flex flex-col gap-2 mt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.formats.includes("Virtual")}
                            onChange={() => toggleFormat("Virtual")}
                            className="rounded"
                          />
                          <span className="text-sm">Virtual</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.formats.includes("In-Person")}
                            onChange={() => toggleFormat("In-Person")}
                            className="rounded"
                          />
                          <span className="text-sm">In-Person</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.formats.includes("Hybrid")}
                            onChange={() => toggleFormat("Hybrid")}
                            className="rounded"
                          />
                          <span className="text-sm">Hybrid</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                        placeholder="90"
                      />
                    </div>

                    <div>
                      <Label htmlFor="price_range">Price Range</Label>
                      <Input
                        id="price_range"
                        value={formData.price_range}
                        onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                        placeholder="$5,000 - $10,000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="target_audience">Target Audience</Label>
                      <Input
                        id="target_audience"
                        value={formData.target_audience}
                        onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                        placeholder="Executives, Developers, etc."
                      />
                    </div>

                    <div>
                      <Label htmlFor="max_participants">Max Participants</Label>
                      <Input
                        id="max_participants"
                        type="number"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="short_description">Short Description</Label>
                    <Textarea
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      rows={2}
                      placeholder="Brief overview (max 500 characters)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="technical_experience_needed">Technical Experience Needed</Label>
                    <Input
                      id="technical_experience_needed"
                      value={formData.technical_experience_needed}
                      onChange={(e) => setFormData({ ...formData, technical_experience_needed: e.target.value })}
                      placeholder="e.g., Beginner, Intermediate, Advanced, or None Required"
                    />
                  </div>

                  <div>
                    <Label htmlFor="learning_objectives">Learning Objectives (one per line)</Label>
                    <Textarea
                      id="learning_objectives"
                      value={formData.learning_objectives}
                      onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
                      rows={3}
                      placeholder="Understand AI fundamentals&#10;Learn practical applications&#10;Develop AI strategy"
                    />
                  </div>

                  <div>
                    <Label htmlFor="topics">Topics (comma-separated)</Label>
                    <Input
                      id="topics"
                      value={formData.topics}
                      onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                      placeholder="AI, Machine Learning, Strategy, Leadership"
                    />
                  </div>

                  {/* Pricing Tiers Section */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Pricing Tiers</h3>
                    <p className="text-sm text-gray-600 mb-4">Add different pricing options based on workshop duration/format</p>

                    {formData.pricing_tiers.map((tier, index) => (
                      <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Tier Name</Label>
                            <Input
                              value={tier.name}
                              onChange={(e) => {
                                const newTiers = [...formData.pricing_tiers]
                                newTiers[index] = { ...tier, name: e.target.value }
                                setFormData({ ...formData, pricing_tiers: newTiers })
                              }}
                              placeholder="e.g., Keynote, Half-Day"
                            />
                          </div>
                          <div>
                            <Label>Duration</Label>
                            <Input
                              value={tier.duration}
                              onChange={(e) => {
                                const newTiers = [...formData.pricing_tiers]
                                newTiers[index] = { ...tier, duration: e.target.value }
                                setFormData({ ...formData, pricing_tiers: newTiers })
                              }}
                              placeholder="e.g., 45-60 min"
                            />
                          </div>
                          <div>
                            <Label>Price</Label>
                            <Input
                              value={tier.price}
                              onChange={(e) => {
                                const newTiers = [...formData.pricing_tiers]
                                newTiers[index] = { ...tier, price: e.target.value }
                                setFormData({ ...formData, pricing_tiers: newTiers })
                              }}
                              placeholder="e.g., $10,000 - $15,000"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newTiers = formData.pricing_tiers.filter((_, i) => i !== index)
                                setFormData({ ...formData, pricing_tiers: newTiers })
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Label>Description (optional)</Label>
                          <Input
                            value={tier.description || ""}
                            onChange={(e) => {
                              const newTiers = [...formData.pricing_tiers]
                              newTiers[index] = { ...tier, description: e.target.value }
                              setFormData({ ...formData, pricing_tiers: newTiers })
                            }}
                            placeholder="Additional details about this tier"
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          pricing_tiers: [...formData.pricing_tiers, { name: "", duration: "", price: "" }]
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pricing Tier
                    </Button>
                  </div>

                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Media & Testimonials</h3>
                    <WorkshopMediaManager
                      thumbnailUrl={formData.thumbnail_url}
                      videoUrls={formData.video_urls}
                      imageUrls={formData.image_urls}
                      testimonials={formData.testimonials}
                      clientLogos={formData.client_logos}
                      onThumbnailChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
                      onVideoUrlsChange={(urls) => setFormData({ ...formData, video_urls: urls })}
                      onImagesChange={(urls) => setFormData({ ...formData, image_urls: urls })}
                      onTestimonialsChange={(testimonials) => setFormData({ ...formData, testimonials })}
                      onClientLogosChange={(logos) => setFormData({ ...formData, client_logos: logos })}
                    />

                    {/* Thumbnail Position Selector */}
                    {formData.thumbnail_url && (
                      <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                        <Label className="text-base font-medium">Thumbnail Focal Point</Label>
                        <p className="text-sm text-gray-600 mb-4">Select where the image should focus when cropped</p>

                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Preview */}
                          <div className="relative w-full md:w-64 h-32 rounded-lg overflow-hidden border bg-gray-200">
                            <img
                              src={formData.thumbnail_url}
                              alt="Thumbnail preview"
                              className="w-full h-full object-cover"
                              style={{ objectPosition: formData.thumbnail_position }}
                            />
                          </div>

                          {/* Position Grid */}
                          <div className="flex-1">
                            <div className="grid grid-cols-3 gap-2 max-w-[200px]">
                              {[
                                { label: "↖", value: "top left" },
                                { label: "↑", value: "top center" },
                                { label: "↗", value: "top right" },
                                { label: "←", value: "center left" },
                                { label: "●", value: "center" },
                                { label: "→", value: "center right" },
                                { label: "↙", value: "bottom left" },
                                { label: "↓", value: "bottom center" },
                                { label: "↘", value: "bottom right" },
                              ].map((pos) => (
                                <button
                                  key={pos.value}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, thumbnail_position: pos.value })}
                                  className={`p-2 text-sm rounded border transition-colors ${
                                    formData.thumbnail_position === pos.value
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : "bg-white hover:bg-gray-100 border-gray-300"
                                  }`}
                                  title={pos.value}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Current: {formData.thumbnail_position}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Active</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Featured</span>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit">
                      {editingWorkshop ? "Update Workshop" : "Create Workshop"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); setEditingWorkshop(null); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Workshops ({filteredWorkshops.length})</CardTitle>
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search workshops..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workshop</TableHead>
                      <TableHead>Speaker</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkshops.map((workshop) => (
                      <TableRow key={workshop.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{workshop.title}</div>
                            <div className="text-sm text-gray-500">{workshop.target_audience}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {workshop.speaker_name || <span className="text-gray-400">Unassigned</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{workshop.format || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          {workshop.duration_minutes ? `${workshop.duration_minutes} min` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {workshop.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {workshop.active ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(workshop)} disabled={editLoading}>
                              {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                            </Button>
                            <Link href={`/ai-workshops/${workshop.slug}`} target="_blank">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(workshop.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Building2, Plus, Edit, Trash2, Upload, X, ArrowUp, ArrowDown, Eye, EyeOff, Loader2, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Speaker {
  id: number
  name: string
  slug: string
  title: string
  headshot: string
}

interface CaseStudy {
  id: number
  company: string
  logo_url: string | null
  location: string
  event_type: string
  image_url: string
  image_alt: string
  testimonial: string
  testimonial_author?: string
  testimonial_title?: string
  speaker_contribution?: string
  video_url?: string
  impact_points: string[]
  speakers: Speaker[]
  display_order: number
  active: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

// Image Upload Field Component
function ImageUploadField({
  label,
  value,
  onChange,
  placeholder,
  description,
  uploadFolder = "uploads/case-studies"
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description?: string
  uploadFolder?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', uploadFolder)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onChange(result.path)
      } else {
        setUploadError(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload image')
    } finally {
      setUploading(false)
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-gray-300">{label}</Label>

      {/* Image Preview */}
      {value && (
        <div className="relative w-full max-w-xs h-32 bg-gray-700 rounded-lg overflow-hidden group">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg'
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <label className="cursor-pointer bg-white text-gray-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Replace
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      )}

      {/* Upload Button (when no image) */}
      {!value && (
        <label className="cursor-pointer flex flex-col items-center justify-center w-full max-w-xs h-32 bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg hover:border-blue-400 hover:bg-gray-600 transition-colors">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Click to upload</span>
              <span className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, WebP</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded">
          {uploadError}
          <button onClick={() => setUploadError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white flex-1"
          placeholder={placeholder || "https://..."}
        />
        <label className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            className="h-10 border-gray-600 hover:bg-gray-700"
            asChild
          >
            <span>
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  )
}

export default function CaseStudiesManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [speakers, setSpeakers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudy, setEditingStudy] = useState<CaseStudy | null>(null)
  const [formData, setFormData] = useState({
    company: "",
    logo_url: "",
    location: "",
    event_type: "",
    image_url: "",
    image_alt: "",
    testimonial: "",
    testimonial_author: "",
    testimonial_title: "",
    speaker_contribution: "",
    video_url: "",
    impact_points: ["", "", ""],
    speaker_ids: [] as number[],
    display_order: 0,
    active: true,
    featured: false
  })

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    fetchCaseStudies()
    fetchSpeakers()
  }, [router])

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch("/api/case-studies")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setCaseStudies(data.data)
      }
    } catch (error) {
      console.error("Error fetching case studies:", error)
      toast({
        title: "Error",
        description: "Failed to fetch case studies",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSpeakers = async () => {
    try {
      const response = await fetch("/api/speakers")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setSpeakers(data.speakers)
      }
    } catch (error) {
      console.error("Error fetching speakers:", error)
    }
  }

  const handleOpenDialog = (study?: CaseStudy) => {
    if (study) {
      setEditingStudy(study)
      setFormData({
        company: study.company,
        logo_url: study.logo_url || "",
        location: study.location,
        event_type: study.event_type,
        image_url: study.image_url,
        image_alt: study.image_alt,
        testimonial: study.testimonial || "",
        testimonial_author: study.testimonial_author || "",
        testimonial_title: study.testimonial_title || "",
        speaker_contribution: study.speaker_contribution || "",
        video_url: study.video_url || "",
        impact_points: study.impact_points.length >= 3
          ? study.impact_points
          : [...study.impact_points, "", "", ""].slice(0, 3),
        speaker_ids: study.speakers?.map(s => s.id).filter((id): id is number => id !== undefined && id !== null) || [],
        display_order: study.display_order,
        active: study.active,
        featured: study.featured
      })
    } else {
      setEditingStudy(null)
      setFormData({
        company: "",
        logo_url: "",
        location: "",
        event_type: "",
        image_url: "",
        image_alt: "",
        testimonial: "",
        testimonial_author: "",
        testimonial_title: "",
        speaker_contribution: "",
        video_url: "",
        impact_points: ["", "", ""],
        speaker_ids: [],
        display_order: caseStudies.length,
        active: true,
        featured: false
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingStudy(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const filteredImpactPoints = formData.impact_points.filter(p => p.trim() !== "")

    if (filteredImpactPoints.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide at least one impact point",
        variant: "destructive"
      })
      return
    }

    try {
      const url = editingStudy
        ? `/api/case-studies/${editingStudy.id}`
        : "/api/case-studies"

      const response = await fetch(url, {
        method: editingStudy ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          impact_points: filteredImpactPoints
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Case study ${editingStudy ? "updated" : "created"} successfully`
        })
        handleCloseDialog()
        fetchCaseStudies()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error saving case study:", error)
      toast({
        title: "Error",
        description: "Failed to save case study",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this case study?")) return

    try {
      const response = await fetch(`/api/case-studies/${id}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Case study deleted successfully"
        })
        fetchCaseStudies()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error deleting case study:", error)
      toast({
        title: "Error",
        description: "Failed to delete case study",
        variant: "destructive"
      })
    }
  }

  const handleReorder = async (id: number, direction: "up" | "down") => {
    const currentIndex = caseStudies.findIndex(s => s.id === id)
    if (currentIndex === -1) return

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= caseStudies.length) return

    const newOrder = [...caseStudies]
    const [removed] = newOrder.splice(currentIndex, 1)
    newOrder.splice(targetIndex, 0, removed)

    // Update display_order for all affected studies
    for (let i = 0; i < newOrder.length; i++) {
      const study = newOrder[i]
      if (study.display_order !== i) {
        await fetch(`/api/case-studies/${study.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...study,
            display_order: i,
            speaker_ids: study.speakers?.map(s => s.id) || []
          })
        })
      }
    }

    fetchCaseStudies()
  }

  const handleToggleActive = async (study: CaseStudy) => {
    try {
      const response = await fetch(`/api/case-studies/${study.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...study,
          active: !study.active,
          speaker_ids: study.speakers?.map(s => s.id) || []
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Case study ${!study.active ? "activated" : "deactivated"}`
        })
        fetchCaseStudies()
      }
    } catch (error) {
      console.error("Error toggling active status:", error)
      toast({
        title: "Error",
        description: "Failed to update case study",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <AdminSidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Building2 className="mr-2 h-6 w-6" />
                  Client Case Studies Management
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage client success stories and testimonials
                </CardDescription>
              </div>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Case Study
              </Button>
            </CardHeader>

            <CardContent>
              {loading ? (
                <p className="text-gray-400 text-center py-8">Loading case studies...</p>
              ) : caseStudies.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No case studies found. Create your first one!</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Order</TableHead>
                      <TableHead className="text-gray-300">Company</TableHead>
                      <TableHead className="text-gray-300">Location</TableHead>
                      <TableHead className="text-gray-300">Event Type</TableHead>
                      <TableHead className="text-gray-300">Speakers</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caseStudies.map((study, index) => (
                      <TableRow key={study.id} className="border-gray-700">
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-2">
                            <span>{study.display_order}</span>
                            <div className="flex flex-col">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReorder(study.id, "up")}
                                disabled={index === 0}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReorder(study.id, "down")}
                                disabled={index === caseStudies.length - 1}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 font-medium">{study.company}</TableCell>
                        <TableCell className="text-gray-400">{study.location}</TableCell>
                        <TableCell className="text-gray-400">{study.event_type}</TableCell>
                        <TableCell className="text-gray-400">
                          {study.speakers && study.speakers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {study.speakers.filter(speaker => speaker && speaker.id && speaker.name).map(speaker => (
                                <Badge key={speaker.id} variant="secondary" className="text-xs">
                                  {speaker.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">No speakers</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge
                              variant={study.active ? "default" : "secondary"}
                              className="cursor-pointer"
                              onClick={() => handleToggleActive(study)}
                            >
                              {study.active ? (
                                <><Eye className="mr-1 h-3 w-3" /> Active</>
                              ) : (
                                <><EyeOff className="mr-1 h-3 w-3" /> Inactive</>
                              )}
                            </Badge>
                            {study.featured && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDialog(study)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(study.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>
              {editingStudy ? "Edit Case Study" : "Add New Case Study"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingStudy ? "Update the case study details" : "Create a new client success story"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company" className="text-gray-300">Company Name *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-gray-300">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="event_type" className="text-gray-300">Event Type *</Label>
              <Input
                id="event_type"
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="e.g., Tech Leadership Summit"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ImageUploadField
                label="Company Logo (optional)"
                value={formData.logo_url}
                onChange={(value) => setFormData({ ...formData, logo_url: value })}
                description="Company logo displayed on the case study"
                uploadFolder="uploads/case-studies/logos"
              />

              <ImageUploadField
                label="Event Image *"
                value={formData.image_url}
                onChange={(value) => setFormData({ ...formData, image_url: value })}
                description="Main event photo"
                uploadFolder="uploads/case-studies"
              />
            </div>

            <div>
              <Label htmlFor="image_alt" className="text-gray-300">Image Alt Text (SEO) *</Label>
              <Textarea
                id="image_alt"
                value={formData.image_alt}
                onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                rows={2}
                placeholder="Descriptive alt text for SEO..."
                required
              />
            </div>

            <div>
              <Label htmlFor="testimonial" className="text-gray-300">Testimonial Quote</Label>
              <Textarea
                id="testimonial"
                value={formData.testimonial}
                onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
                placeholder="Client testimonial quote..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testimonial_author" className="text-gray-300">Testimonial Author</Label>
                <Input
                  id="testimonial_author"
                  value={formData.testimonial_author}
                  onChange={(e) => setFormData({ ...formData, testimonial_author: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="e.g., John Smith"
                />
              </div>
              <div>
                <Label htmlFor="testimonial_title" className="text-gray-300">Author Title/Role</Label>
                <Input
                  id="testimonial_title"
                  value={formData.testimonial_title}
                  onChange={(e) => setFormData({ ...formData, testimonial_title: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="e.g., VP of Events, Acme Corp"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="speaker_contribution" className="text-gray-300">Speaker Contribution</Label>
              <Textarea
                id="speaker_contribution"
                value={formData.speaker_contribution}
                onChange={(e) => setFormData({ ...formData, speaker_contribution: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                rows={2}
                placeholder="What the speaker provided for this event..."
              />
              <p className="text-xs text-gray-400 mt-1">Describe what the speaker delivered (e.g., keynote, workshop, panel moderation)</p>
            </div>

            <div>
              <Label htmlFor="video_url" className="text-gray-300">Video URL (YouTube)</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-400 mt-1">Optional YouTube video highlighting the event</p>
            </div>

            <div>
              <Label className="text-gray-300">Impact Points (Key Outcomes)</Label>
              {formData.impact_points.map((point, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...formData.impact_points]
                      newPoints[index] = e.target.value
                      setFormData({ ...formData, impact_points: newPoints })
                    }}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder={`Impact point ${index + 1}`}
                  />
                  {formData.impact_points.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newPoints = formData.impact_points.filter((_, i) => i !== index)
                        setFormData({ ...formData, impact_points: newPoints })
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setFormData({ ...formData, impact_points: [...formData.impact_points, ""] })}
                className="mt-2"
              >
                <Plus className="mr-1 h-3 w-3" /> Add Impact Point
              </Button>
            </div>

            <div>
              <Label className="text-gray-300">Featured Speakers</Label>
              <Select
                value={formData.speaker_ids.length > 0 && formData.speaker_ids[0] != null ? formData.speaker_ids[0].toString() : ""}
                onValueChange={(value) => {
                  const id = parseInt(value)
                  if (!formData.speaker_ids.includes(id)) {
                    setFormData({ ...formData, speaker_ids: [...formData.speaker_ids, id] })
                  }
                }}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select speakers..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {speakers.map(speaker => (
                    <SelectItem key={speaker.id} value={speaker.id.toString()}>
                      {speaker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.speaker_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.speaker_ids.map(id => {
                    const speaker = speakers.find(s => s.id === id)
                    if (!speaker) return null
                    return (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                        {speaker.name}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              speaker_ids: formData.speaker_ids.filter(sid => sid !== id)
                            })
                          }}
                          className="ml-1 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="display_order" className="text-gray-300">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="active" className="text-gray-300">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="featured" className="text-gray-300">Featured</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingStudy ? "Update" : "Create"} Case Study
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

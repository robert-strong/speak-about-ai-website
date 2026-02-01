"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  X,
  User,
  Settings,
  Briefcase,
  Camera,
  Upload,
  Mail,
  Globe,
  MapPin,
  Phone
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin-sidebar"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"

export default function AdminAddSpeakerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    bio: "",
    short_bio: "",
    one_liner: "",
    headshot_url: "",
    website: "",
    location: "",
    programs: "",
    topics: [] as string[],
    industries: [] as string[],
    videos: [] as { id: string; title: string; url: string; thumbnail?: string }[],
    testimonials: [] as { quote: string; author: string; position?: string; company?: string }[],
    speaking_fee_range: "",
    travel_preferences: "",
    technical_requirements: "",
    dietary_restrictions: "",
    slug: "",
    featured: false,
    active: true,
    listed: true,
    ranking: 0,
    social_media: {
      linkedin: "",
      twitter: "",
      instagram: "",
      youtube: "",
      facebook: ""
    }
  })

  const [newTopic, setNewTopic] = useState("")
  const [newIndustry, setNewIndustry] = useState("")
  const [newVideo, setNewVideo] = useState({ title: "", url: "" })
  const [newTestimonial, setNewTestimonial] = useState({ quote: "", author: "", position: "", company: "" })

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Field validators
  const validateEmail = (email: string): string => {
    if (!email) return "Email is required"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Invalid email format"
    return ""
  }

  const validateName = (name: string): string => {
    if (!name.trim()) return "Name is required"
    if (name.trim().length < 2) return "Name must be at least 2 characters"
    return ""
  }

  const validateUrl = (url: string): string => {
    if (!url) return "" // Optional field
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
      return ""
    } catch {
      return "Invalid URL format"
    }
  }

  const validateSlug = (slug: string): string => {
    if (!slug) return "" // Optional - will be auto-generated
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) return "Slug can only contain lowercase letters, numbers, and hyphens"
    return ""
  }

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name": return validateName(value)
      case "email": return validateEmail(value)
      case "website": return validateUrl(value)
      case "slug": return validateSlug(value)
      default: return ""
    }
  }

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name as keyof typeof formData] as string)
    setFieldErrors(prev => ({ ...prev, [name]: error }))
  }

  // Check authentication
  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value)
      setFieldErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleAddTopic = () => {
    if (newTopic.trim() && !formData.topics.includes(newTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()]
      }))
      setNewTopic("")
    }
  }

  const handleRemoveTopic = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }))
  }

  const handleAddIndustry = () => {
    if (newIndustry.trim() && !formData.industries.includes(newIndustry.trim())) {
      setFormData(prev => ({
        ...prev,
        industries: [...prev.industries, newIndustry.trim()]
      }))
      setNewIndustry("")
    }
  }

  const handleRemoveIndustry = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      industries: prev.industries.filter(i => i !== industry)
    }))
  }

  const handleAddVideo = () => {
    if (newVideo.title.trim() && newVideo.url.trim()) {
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, { 
          id: Date.now().toString(), 
          title: newVideo.title.trim(), 
          url: newVideo.url.trim() 
        }]
      }))
      setNewVideo({ title: "", url: "" })
    }
  }

  const handleRemoveVideo = (id: string) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter(v => v.id !== id)
    }))
  }

  const handleAddTestimonial = () => {
    if (newTestimonial.quote.trim() && newTestimonial.author.trim()) {
      setFormData(prev => ({
        ...prev,
        testimonials: [...prev.testimonials, {
          quote: newTestimonial.quote.trim(),
          author: newTestimonial.author.trim(),
          position: newTestimonial.position.trim(),
          company: newTestimonial.company.trim()
        }]
      }))
      setNewTestimonial({ quote: "", author: "", position: "", company: "" })
    }
  }

  const handleRemoveTestimonial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index)
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file (JPEG, PNG, WebP, or GIF)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/speakers/upload',
      })

      setFormData(prev => ({
        ...prev,
        headshot_url: blob.url
      }))

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSave = async () => {
    // Validate all fields
    const nameError = validateName(formData.name)
    const emailError = validateEmail(formData.email)
    const websiteError = validateUrl(formData.website)
    const slugError = validateSlug(formData.slug)

    const errors = {
      name: nameError,
      email: emailError,
      website: websiteError,
      slug: slugError
    }

    // Mark all fields as touched
    setTouched({ name: true, email: true, website: true, slug: true })
    setFieldErrors(errors)

    // Check for any errors
    if (nameError || emailError || websiteError || slugError) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted errors before saving",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Generate slug if not provided
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      const response = await authPost("/api/admin/speakers", {
          ...formData,
          slug,
          social_media: formData.social_media
        })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Speaker created successfully",
        })
        router.push(`/admin/speakers/${data.speaker.id}`)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create speaker",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: "Failed to create speaker",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/admin/speakers">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Speakers
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Speaker</h1>
                <p className="mt-2 text-gray-600">Create a new speaker profile</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Speaker
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="media">Media & Social</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Essential speaker details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24" key={formData.headshot_url || 'no-image'}>
                      <AvatarImage src={formData.headshot_url} alt={formData.name} />
                      <AvatarFallback>
                        {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SP'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Upload Photo
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-gray-500 mt-1">Recommended: 400x400px</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur("name")}
                        className={touched.name && fieldErrors.name ? "border-red-500" : ""}
                        required
                      />
                      {touched.name && fieldErrors.name && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur("email")}
                        className={touched.email && fieldErrors.email ? "border-red-500" : ""}
                        required
                      />
                      {touched.email && fieldErrors.email && (
                        <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, State/Country"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Professional Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("website")}
                      className={touched.website && fieldErrors.website ? "border-red-500" : ""}
                      placeholder="https://..."
                    />
                    {touched.website && fieldErrors.website && (
                      <p className="text-sm text-red-500 mt-1">{fieldErrors.website}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="one_liner">One-Liner</Label>
                    <Input
                      id="one_liner"
                      name="one_liner"
                      value={formData.one_liner}
                      onChange={handleInputChange}
                      placeholder="Brief tagline or description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="short_bio">Short Bio</Label>
                    <Textarea
                      id="short_bio"
                      name="short_bio"
                      value={formData.short_bio}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Brief biography (200 characters)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Full Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={6}
                      placeholder="Detailed biography"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Details</CardTitle>
                  <CardDescription>Speaking topics, expertise, and media</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Slug */}
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur("slug")}
                      className={touched.slug && fieldErrors.slug ? "border-red-500" : ""}
                      placeholder="speaker-name (auto-generated if empty)"
                    />
                    {touched.slug && fieldErrors.slug ? (
                      <p className="text-sm text-red-500 mt-1">{fieldErrors.slug}</p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Used for speaker profile URL: /speakers/{formData.slug || 'speaker-name'}</p>
                    )}
                  </div>

                  {/* Topics */}
                  <div>
                    <Label>Speaking Topics</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="Add a topic"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                      />
                      <Button onClick={handleAddTopic} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.topics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="px-3 py-1">
                          {topic}
                          <button
                            onClick={() => handleRemoveTopic(topic)}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Industries */}
                  <div>
                    <Label>Industries</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newIndustry}
                        onChange={(e) => setNewIndustry(e.target.value)}
                        placeholder="Add an industry"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIndustry())}
                      />
                      <Button onClick={handleAddIndustry} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.industries.map((industry) => (
                        <Badge key={industry} variant="secondary" className="px-3 py-1">
                          {industry}
                          <button
                            onClick={() => handleRemoveIndustry(industry)}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="speaking_fee_range">Speaking Fee Range</Label>
                    <Input
                      id="speaking_fee_range"
                      name="speaking_fee_range"
                      value={formData.speaking_fee_range}
                      onChange={handleInputChange}
                      placeholder="e.g., $5,000 - $10,000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="programs">Programs/Services</Label>
                    <Textarea
                      id="programs"
                      name="programs"
                      value={formData.programs}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Keynotes, workshops, consulting, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="travel_preferences">Travel Preferences</Label>
                    <Textarea
                      id="travel_preferences"
                      name="travel_preferences"
                      value={formData.travel_preferences}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Flight class, hotel preferences, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="technical_requirements">Technical Requirements</Label>
                    <Textarea
                      id="technical_requirements"
                      name="technical_requirements"
                      value={formData.technical_requirements}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="A/V needs, stage setup, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                    <Input
                      id="dietary_restrictions"
                      name="dietary_restrictions"
                      value={formData.dietary_restrictions}
                      onChange={handleInputChange}
                      placeholder="Vegetarian, allergies, etc."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Videos</CardTitle>
                  <CardDescription>Add speaker videos and demos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                      placeholder="Video title"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newVideo.url}
                        onChange={(e) => setNewVideo({...newVideo, url: e.target.value})}
                        placeholder="Video URL"
                      />
                      <Button onClick={handleAddVideo} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {formData.videos.map((video) => (
                      <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{video.title}</p>
                          <p className="text-sm text-gray-500">{video.url}</p>
                        </div>
                        <Button
                          onClick={() => handleRemoveVideo(video.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Testimonials</CardTitle>
                  <CardDescription>Add client testimonials and reviews</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      value={newTestimonial.quote}
                      onChange={(e) => setNewTestimonial({...newTestimonial, quote: e.target.value})}
                      placeholder="Testimonial quote"
                      rows={3}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={newTestimonial.author}
                        onChange={(e) => setNewTestimonial({...newTestimonial, author: e.target.value})}
                        placeholder="Author name *"
                      />
                      <Input
                        value={newTestimonial.position}
                        onChange={(e) => setNewTestimonial({...newTestimonial, position: e.target.value})}
                        placeholder="Position/Title"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={newTestimonial.company}
                          onChange={(e) => setNewTestimonial({...newTestimonial, company: e.target.value})}
                          placeholder="Company"
                        />
                        <Button onClick={handleAddTestimonial} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {formData.testimonials.map((testimonial, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <p className="italic">"{testimonial.quote}"</p>
                        <p className="text-sm text-gray-600 mt-2">
                          — {testimonial.author}
                          {testimonial.position && `, ${testimonial.position}`}
                          {testimonial.company && ` at ${testimonial.company}`}
                        </p>
                        <Button
                          onClick={() => handleRemoveTestimonial(index)}
                          size="sm"
                          variant="ghost"
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                  <CardDescription>Add social media profile links</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={formData.social_media.linkedin}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        social_media: {...prev.social_media, linkedin: e.target.value}
                      }))}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">Twitter/X</Label>
                    <Input
                      id="twitter"
                      value={formData.social_media.twitter}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        social_media: {...prev.social_media, twitter: e.target.value}
                      }))}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.social_media.instagram}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        social_media: {...prev.social_media, instagram: e.target.value}
                      }))}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={formData.social_media.youtube}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        social_media: {...prev.social_media, youtube: e.target.value}
                      }))}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData.social_media.facebook}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        social_media: {...prev.social_media, facebook: e.target.value}
                      }))}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Settings & Visibility</CardTitle>
                  <CardDescription>Control speaker profile settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="active">Active</Label>
                        <p className="text-sm text-gray-500">Speaker is available for bookings</p>
                      </div>
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={handleSwitchChange('active')}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="listed">Listed</Label>
                        <p className="text-sm text-gray-500">Show on public speakers page</p>
                      </div>
                      <Switch
                        id="listed"
                        checked={formData.listed}
                        onCheckedChange={handleSwitchChange('listed')}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="featured">Featured</Label>
                        <p className="text-sm text-gray-500">Highlight as featured speaker</p>
                      </div>
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={handleSwitchChange('featured')}
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="ranking">Display Ranking</Label>
                      <Input
                        id="ranking"
                        name="ranking"
                        type="number"
                        value={formData.ranking}
                        onChange={handleInputChange}
                        placeholder="0"
                      />
                      <p className="text-sm text-gray-500 mt-1">Higher numbers appear first</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
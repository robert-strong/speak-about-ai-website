"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin-sidebar"
import { ConferenceImageUploader } from "@/components/conference-image-uploader"
import { SingleImageUploader } from "@/components/single-image-uploader"
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ConferenceImage {
  url: string
  caption?: string
  year?: number
  order: number
  featured?: boolean
}

interface Conference {
  id: number
  name: string
  organization?: string
  website_url?: string
  date_display?: string
  location?: string
  city?: string
  country?: string
  venue?: string
  description?: string
  logo_url?: string
  banner_url?: string
  images?: ConferenceImage[]
  status: string
  contact_name?: string
  contact_role?: string
  contact_email?: string
  contact_linkedin?: string
  notes?: string
  published: boolean
  featured: boolean
}

export default function EditConferencePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [conference, setConference] = useState<Conference | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check-auth")
      if (!response.ok) {
        router.push("/admin")
        return
      }
      loadConference()
    } catch (error) {
      router.push("/admin")
    }
  }

  const loadConference = async () => {
    try {
      const response = await fetch(`/api/conferences/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setConference(data.conference)
      } else {
        toast({
          title: "Error",
          description: "Failed to load conference",
          variant: "destructive"
        })
        router.push("/admin/conferences")
      }
    } catch (error) {
      console.error("Error loading conference:", error)
      toast({
        title: "Error",
        description: "Failed to load conference",
        variant: "destructive"
      })
      router.push("/admin/conferences")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!conference) return

    setSaving(true)
    try {
      const response = await fetch(`/api/conferences/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conference)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Conference updated successfully"
        })
        router.push("/admin/conferences")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update conference",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error saving conference:", error)
      toast({
        title: "Error",
        description: "Failed to update conference",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!conference) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/conferences/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Conference deleted successfully"
        })
        router.push("/admin/conferences")
      } else {
        toast({
          title: "Error",
          description: "Failed to delete conference",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting conference:", error)
      toast({
        title: "Error",
        description: "Failed to delete conference",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    )
  }

  if (!conference) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/conferences")}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Conferences
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Edit Conference</h1>
              <p className="text-gray-600 mt-1">{conference.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the conference
                      "{conference.name}" from the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete Conference
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core conference details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Conference Name *</Label>
                    <Input
                      id="name"
                      value={conference.name}
                      onChange={(e) => setConference({ ...conference, name: e.target.value })}
                      placeholder="Conference name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={conference.organization || ''}
                      onChange={(e) => setConference({ ...conference, organization: e.target.value })}
                      placeholder="Organizing body"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={conference.website_url || ''}
                      onChange={(e) => setConference({ ...conference, website_url: e.target.value })}
                      placeholder="https://conference.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_display">Date</Label>
                    <Input
                      id="date_display"
                      value={conference.date_display || ''}
                      onChange={(e) => setConference({ ...conference, date_display: e.target.value })}
                      placeholder="e.g., 25-28 April, 2026"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={conference.location || ''}
                      onChange={(e) => setConference({ ...conference, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={conference.city || ''}
                      onChange={(e) => setConference({ ...conference, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={conference.country || ''}
                      onChange={(e) => setConference({ ...conference, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      value={conference.venue || ''}
                      onChange={(e) => setConference({ ...conference, venue: e.target.value })}
                      placeholder="Convention Center Name, Hotel, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={conference.description || ''}
                    onChange={(e) => setConference({ ...conference, description: e.target.value })}
                    placeholder="Brief description of the conference for public display..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Media & Images */}
            <Card>
              <CardHeader>
                <CardTitle>Media & Images</CardTitle>
                <CardDescription>Upload conference logos and photos from previous years</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo & Banner Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SingleImageUploader
                    imageUrl={conference.logo_url}
                    onChange={(url) => setConference({ ...conference, logo_url: url })}
                    label="Conference Logo"
                    description="Square logo for conference branding"
                    aspectRatio="square"
                  />

                  <SingleImageUploader
                    imageUrl={conference.banner_url}
                    onChange={(url) => setConference({ ...conference, banner_url: url })}
                    label="Conference Banner"
                    description="Wide banner image for headers"
                    aspectRatio="wide"
                  />
                </div>

                {/* Event Photos */}
                <div className="space-y-2">
                  <Label>Event Photos (Previous Years)</Label>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload photos from previous conference years to showcase the event atmosphere and attract speakers
                  </p>
                  <ConferenceImageUploader
                    images={conference.images || []}
                    onChange={(images) => setConference({ ...conference, images })}
                    conferenceId={conference.id}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Settings</CardTitle>
                <CardDescription>Conference tracking and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={conference.status}
                      onValueChange={(value) => setConference({ ...conference, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to_do">To Do</SelectItem>
                        <SelectItem value="passed_watch">Passed/Watch</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="attending">Attending</SelectItem>
                        <SelectItem value="speaking">Speaking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="published" className="cursor-pointer">Published (Visible to Users)</Label>
                      <Switch
                        id="published"
                        checked={conference.published}
                        onCheckedChange={(checked) => setConference({ ...conference, published: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="featured" className="cursor-pointer">Featured</Label>
                      <Switch
                        id="featured"
                        checked={conference.featured}
                        onCheckedChange={(checked) => setConference({ ...conference, featured: checked })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Conference organizer contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={conference.contact_name || ''}
                      onChange={(e) => setConference({ ...conference, contact_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_role">Contact Role</Label>
                    <Input
                      id="contact_role"
                      value={conference.contact_role || ''}
                      onChange={(e) => setConference({ ...conference, contact_role: e.target.value })}
                      placeholder="Event Director"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={conference.contact_email || ''}
                      onChange={(e) => setConference({ ...conference, contact_email: e.target.value })}
                      placeholder="contact@conference.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_linkedin">Contact LinkedIn</Label>
                    <Input
                      id="contact_linkedin"
                      value={conference.contact_linkedin || ''}
                      onChange={(e) => setConference({ ...conference, contact_linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Internal notes and reminders</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={conference.notes || ''}
                  onChange={(e) => setConference({ ...conference, notes: e.target.value })}
                  placeholder="Add internal notes about this conference..."
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* Save Button (Bottom) */}
            <div className="flex items-center justify-end gap-2 pb-8">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/conferences")}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

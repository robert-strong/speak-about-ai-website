"use client"

import { useState, useRef } from "react"
import { upload } from '@vercel/blob/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload, X, Loader2, Image as ImageIcon, Video, Award, Building2, Plus, FolderOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Testimonial } from "@/lib/workshops-db"
import { ImageLibraryPicker } from "@/components/image-library-picker"
import { createImagePathname, addTimestampSuffix } from "@/lib/image-naming"

interface WorkshopMediaManagerProps {
  workshopTitle?: string // For standardized image naming
  thumbnailUrl?: string
  videoUrls?: string[]
  imageUrls?: string[]
  testimonials?: Testimonial[]
  clientLogos?: string[]
  onThumbnailChange: (url: string) => void
  onVideoUrlsChange: (urls: string[]) => void
  onImagesChange: (urls: string[]) => void
  onTestimonialsChange: (testimonials: Testimonial[]) => void
  onClientLogosChange: (urls: string[]) => void
}

export function WorkshopMediaManager({
  workshopTitle,
  thumbnailUrl,
  videoUrls = [],
  imageUrls = [],
  testimonials = [],
  clientLogos = [],
  onThumbnailChange,
  onVideoUrlsChange,
  onImagesChange,
  onTestimonialsChange,
  onClientLogosChange
}: WorkshopMediaManagerProps) {
  const { toast } = useToast()
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingTestimonialPhoto, setUploadingTestimonialPhoto] = useState<number | null>(null)

  // Refs for file inputs to trigger programmatically
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const imagesInputRef = useRef<HTMLInputElement>(null)
  const logosInputRef = useRef<HTMLInputElement>(null)

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be under 10MB",
        variant: "destructive"
      })
      return
    }

    setUploadingThumbnail(true)
    try {
      // Create standardized pathname for SEO
      const standardizedPath = createImagePathname(
        file.name.includes('thumbnail') ? file.name : `thumbnail-${file.name}`,
        'workshops',
        workshopTitle
      )
      const finalPath = addTimestampSuffix(standardizedPath)

      const blob = await upload(finalPath, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })

      onThumbnailChange(blob.url)
      toast({
        title: "Success",
        description: "Thumbnail uploaded successfully"
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload thumbnail",
        variant: "destructive"
      })
    } finally {
      setUploadingThumbnail(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploadingImage(true)
    const newUrls: string[] = []

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image`,
            variant: "destructive"
          })
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive"
          })
          continue
        }

        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        })

        newUrls.push(blob.url)
      }

      if (newUrls.length > 0) {
        onImagesChange([...imageUrls, ...newUrls])
        toast({
          title: "Success",
          description: `Uploaded ${newUrls.length} image${newUrls.length > 1 ? 's' : ''}`
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploadingLogo(true)
    const newUrls: string[] = []

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image`,
            variant: "destructive"
          })
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive"
          })
          continue
        }

        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        })

        newUrls.push(blob.url)
      }

      if (newUrls.length > 0) {
        onClientLogosChange([...clientLogos, ...newUrls])
        toast({
          title: "Success",
          description: `Uploaded ${newUrls.length} logo${newUrls.length > 1 ? 's' : ''}`
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload logos",
        variant: "destructive"
      })
    } finally {
      setUploadingLogo(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleTestimonialPhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be under 10MB",
        variant: "destructive"
      })
      return
    }

    setUploadingTestimonialPhoto(index)
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })

      const updated = [...testimonials]
      updated[index] = { ...updated[index], photo_url: blob.url }
      onTestimonialsChange(updated)

      toast({
        title: "Success",
        description: "Photo uploaded successfully"
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive"
      })
    } finally {
      setUploadingTestimonialPhoto(null)
      if (e.target) e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    onImagesChange(imageUrls.filter((_, i) => i !== index))
  }

  const removeLogo = (index: number) => {
    onClientLogosChange(clientLogos.filter((_, i) => i !== index))
  }

  const addVideoUrl = () => {
    onVideoUrlsChange([...videoUrls, ""])
  }

  const updateVideoUrl = (index: number, url: string) => {
    const updated = [...videoUrls]
    updated[index] = url
    onVideoUrlsChange(updated)
  }

  const removeVideoUrl = (index: number) => {
    onVideoUrlsChange(videoUrls.filter((_, i) => i !== index))
  }

  const addTestimonial = () => {
    onTestimonialsChange([...testimonials, {
      name: "",
      role: "",
      company: "",
      quote: "",
      photo_url: ""
    }])
  }

  const updateTestimonial = (index: number, field: keyof Testimonial, value: string) => {
    const updated = [...testimonials]
    updated[index] = { ...updated[index], [field]: value }
    onTestimonialsChange(updated)
  }

  const removeTestimonial = (index: number) => {
    onTestimonialsChange(testimonials.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Thumbnail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Thumbnail Image
          </CardTitle>
          <CardDescription>Main thumbnail for workshop card display</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Hidden file input for thumbnail */}
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailUpload}
            disabled={uploadingThumbnail}
            className="hidden"
          />

          {thumbnailUrl ? (
            <div className="space-y-3">
              <div className="relative p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <img
                  src={thumbnailUrl}
                  alt="Workshop thumbnail"
                  className="w-full h-48 object-cover rounded"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onThumbnailChange("")}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={uploadingThumbnail}
                >
                  {uploadingThumbnail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Replace
                    </>
                  )}
                </Button>
                <ImageLibraryPicker
                  onSelect={onThumbnailChange}
                  title="Select Thumbnail"
                  description="Choose from previously uploaded images"
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Browse Library
                    </Button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                onClick={() => !uploadingThumbnail && thumbnailInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {uploadingThumbnail ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold text-blue-600">Click to upload</span> thumbnail
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                )}
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-500">or</span>
              </div>
              <ImageLibraryPicker
                onSelect={onThumbnailChange}
                title="Select Thumbnail"
                description="Choose from previously uploaded images"
                trigger={
                  <Button type="button" variant="outline" className="w-full">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Browse Image Library
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video URLs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Highlight Videos
          </CardTitle>
          <CardDescription>YouTube or Vimeo video URLs showcasing the workshop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {videoUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => updateVideoUrl(index, e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removeVideoUrl(index)}
                className="text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addVideoUrl} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Video URL
          </Button>
        </CardContent>
      </Card>

      {/* Workshop Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Workshop Images
          </CardTitle>
          <CardDescription>Photos from previous workshops</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Workshop image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden file input for images */}
          <input
            ref={imagesInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesUpload}
            disabled={uploadingImage}
            className="hidden"
          />

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => imagesInputRef.current?.click()}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </>
              )}
            </Button>
            <ImageLibraryPicker
              multiple
              onSelect={(url) => onImagesChange([...imageUrls, url])}
              onSelectMultiple={(urls) => onImagesChange([...imageUrls, ...urls])}
              title="Select Workshop Images"
              description="Choose from previously uploaded images"
              trigger={
                <Button type="button" variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Browse Library
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Testimonials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Testimonials
          </CardTitle>
          <CardDescription>Client testimonials and reviews</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">Testimonial {index + 1}</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTestimonial(index)}
                    className="text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={testimonial.name}
                      onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input
                      value={testimonial.role}
                      onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                      placeholder="CEO"
                    />
                  </div>
                </div>

                <div>
                  <Label>Company</Label>
                  <Input
                    value={testimonial.company}
                    onChange={(e) => updateTestimonial(index, 'company', e.target.value)}
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <Label>Quote</Label>
                  <Textarea
                    value={testimonial.quote}
                    onChange={(e) => updateTestimonial(index, 'quote', e.target.value)}
                    placeholder="This workshop transformed our understanding of..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Photo</Label>
                  {testimonial.photo_url ? (
                    <div className="flex items-center gap-4 mt-2">
                      <img
                        src={testimonial.photo_url}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateTestimonial(index, 'photo_url', '')}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Label htmlFor={`testimonial-photo-${index}`} className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild disabled={uploadingTestimonialPhoto === index}>
                          <div>
                            {uploadingTestimonialPhoto === index ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Photo
                              </>
                            )}
                          </div>
                        </Button>
                        <Input
                          id={`testimonial-photo-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleTestimonialPhotoUpload(index, e)}
                          disabled={uploadingTestimonialPhoto === index}
                          className="hidden"
                        />
                      </Label>
                      <ImageLibraryPicker
                        onSelect={(url) => updateTestimonial(index, 'photo_url', url)}
                        title="Select Photo"
                        description="Choose from previously uploaded images"
                        trigger={
                          <Button type="button" variant="outline" size="sm">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Browse
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="outline" onClick={addTestimonial} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </CardContent>
      </Card>

      {/* Client Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Client Logos
          </CardTitle>
          <CardDescription>Company logos of clients who have taken this workshop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clientLogos.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {clientLogos.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="w-full h-20 flex items-center justify-center bg-gray-50 rounded-lg border p-2">
                    <img
                      src={url}
                      alt={`Client logo ${index + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeLogo(index)}
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden file input for logos */}
          <input
            ref={logosInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleLogoUpload}
            disabled={uploadingLogo}
            className="hidden"
          />

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logosInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logos
                </>
              )}
            </Button>
            <ImageLibraryPicker
              multiple
              onSelect={(url) => onClientLogosChange([...clientLogos, url])}
              onSelectMultiple={(urls) => onClientLogosChange([...clientLogos, ...urls])}
              title="Select Client Logos"
              description="Choose from previously uploaded logos"
              trigger={
                <Button type="button" variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Browse Library
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

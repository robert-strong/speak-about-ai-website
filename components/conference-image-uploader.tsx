"use client"

import { useState } from "react"
import { upload } from '@vercel/blob/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Star, StarOff, Loader2, Image as ImageIcon, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ConferenceImage {
  url: string
  caption?: string
  year?: number
  order: number
  featured?: boolean
}

interface ConferenceImageUploaderProps {
  images: ConferenceImage[]
  onChange: (images: ConferenceImage[]) => void
  conferenceId?: number
}

export function ConferenceImageUploader({ images, onChange, conferenceId }: ConferenceImageUploaderProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const newImages: ConferenceImage[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image file`,
            variant: "destructive"
          })
          continue
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive"
          })
          continue
        }

        // Use Vercel Blob client upload
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        })

        newImages.push({
          url: blob.url,
          caption: '',
          year: new Date().getFullYear(),
          order: images.length + newImages.length,
          featured: false
        })
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages])
        toast({
          title: "Success",
          description: `Uploaded ${newImages.length} image${newImages.length > 1 ? 's' : ''}`
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload one or more images",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      // Reset input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    // Reorder remaining images
    onChange(newImages.map((img, i) => ({ ...img, order: i })))
  }

  const updateImage = (index: number, updates: Partial<ConferenceImage>) => {
    const newImages = images.map((img, i) =>
      i === index ? { ...img, ...updates } : img
    )
    onChange(newImages)
  }

  const toggleFeatured = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      featured: i === index ? !img.featured : img.featured
    }))
    onChange(newImages)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    // Update order
    const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }))
    onChange(reorderedImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                  <p className="text-sm text-gray-600">Uploading images...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </Label>
        </div>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Uploaded Images ({images.length})
            </h3>
            <p className="text-xs text-gray-500">Drag to reorder</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {images
              .sort((a, b) => a.order - b.order)
              .map((image, index) => (
                <Card
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move transition-all ${
                    draggedIndex === index ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Drag Handle */}
                      <div className="flex items-center">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>

                      {/* Image Preview */}
                      <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={image.url}
                          alt={image.caption || 'Conference image'}
                          className="w-full h-full object-cover"
                        />
                        {image.featured && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-yellow-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Image Details */}
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`caption-${index}`} className="text-xs">
                            Caption
                          </Label>
                          <Input
                            id={`caption-${index}`}
                            value={image.caption || ''}
                            onChange={(e) => updateImage(index, { caption: e.target.value })}
                            placeholder="Image caption..."
                            className="text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor={`year-${index}`} className="text-xs">
                              Year
                            </Label>
                            <Input
                              id={`year-${index}`}
                              type="number"
                              value={image.year || ''}
                              onChange={(e) => updateImage(index, { year: parseInt(e.target.value) })}
                              placeholder="2024"
                              className="text-sm"
                            />
                          </div>

                          <div className="flex items-end gap-2">
                            <Button
                              type="button"
                              variant={image.featured ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleFeatured(index)}
                              className="flex-1"
                            >
                              {image.featured ? (
                                <>
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  Featured
                                </>
                              ) : (
                                <>
                                  <StarOff className="h-3 w-3 mr-1" />
                                  Set Featured
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-start">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No images uploaded yet</p>
          <p className="text-xs text-gray-400">Upload photos from previous years to showcase the event</p>
        </div>
      )}
    </div>
  )
}

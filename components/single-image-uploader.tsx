"use client"

import { useState, useRef } from "react"
import { upload } from '@vercel/blob/client'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createImagePathname, addTimestampSuffix } from "@/lib/image-naming"

type ImageContext = 'speakers' | 'workshops' | 'conferences' | 'vendors' | 'blog' | 'general'

interface SingleImageUploaderProps {
  imageUrl?: string
  onChange: (url: string) => void
  onClear?: () => void
  label: string
  description?: string
  aspectRatio?: "square" | "wide" // square for logos, wide for banners
  context?: ImageContext // For standardized naming
  identifier?: string // e.g., speaker name, workshop title
}

export function SingleImageUploader({
  imageUrl,
  onChange,
  onClear,
  label,
  description,
  aspectRatio = "square",
  context = "general",
  identifier
}: SingleImageUploaderProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be under 10MB",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      // Create a standardized pathname for SEO
      const standardizedPath = createImagePathname(file.name, context, identifier)
      const finalPath = addTimestampSuffix(standardizedPath)

      // Use Vercel Blob client upload with standardized naming
      const blob = await upload(finalPath, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })

      onChange(blob.url)
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
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

  const handleClear = () => {
    if (onClear) {
      onClear()
    } else {
      onChange('')
    }
  }

  const previewHeight = aspectRatio === "square" ? "h-32" : "h-24"
  const previewClass = aspectRatio === "square" ? "object-contain" : "object-cover"

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div>
          <Label>{label}</Label>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {imageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {/* Current Image Preview */}
      {imageUrl ? (
        <div className="relative p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <img
            src={imageUrl}
            alt={label}
            className={`w-full ${previewHeight} ${previewClass} rounded`}
          />
        </div>
      ) : (
        /* Upload Area */
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Uploading...</p>
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
      )}

      {/* Replace Button (when image exists) */}
      {imageUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Replace Image
            </>
          )}
        </Button>
      )}
    </div>
  )
}

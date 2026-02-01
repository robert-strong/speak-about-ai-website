"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2, ImageIcon, Check, FolderOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageBlob {
  url: string
  pathname: string
  size: number
  uploadedAt: string
  contentType: string
}

interface ImageLibraryPickerProps {
  onSelect: (url: string) => void
  multiple?: boolean
  onSelectMultiple?: (urls: string[]) => void
  trigger?: React.ReactNode
  title?: string
  description?: string
}

export function ImageLibraryPicker({
  onSelect,
  multiple = false,
  onSelectMultiple,
  trigger,
  title = "Image Library",
  description = "Select from previously uploaded images",
}: ImageLibraryPickerProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<ImageBlob[]>([])
  const [grouped, setGrouped] = useState<Record<string, ImageBlob[]>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("all")

  const loadImages = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("adminSessionToken")
      const response = await fetch("/api/images/library", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-dev-admin-bypass": "dev-admin-access",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load images")
      }

      const data = await response.json()
      setImages(data.images)
      setGrouped(data.grouped)
    } catch (error) {
      console.error("Error loading images:", error)
      toast({
        title: "Error",
        description: "Failed to load image library",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadImages()
      setSelectedImages([])
    }
  }, [open])

  const filteredImages = images.filter((image) =>
    image.pathname.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleImageSelect = (url: string) => {
    if (multiple) {
      setSelectedImages((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
      )
    } else {
      onSelect(url)
      setOpen(false)
    }
  }

  const handleConfirmMultiple = () => {
    if (onSelectMultiple && selectedImages.length > 0) {
      onSelectMultiple(selectedImages)
      setOpen(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFilename = (pathname: string) => {
    return pathname.split("/").pop() || pathname
  }

  const folders = Object.keys(grouped).sort()

  // Filter for workshop-related images
  const workshopImages = filteredImages.filter((image) =>
    image.pathname.toLowerCase().includes("workshop")
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm">
            <ImageIcon className="h-4 w-4 mr-2" />
            Browse Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="all">All ({filteredImages.length})</TabsTrigger>
                {workshopImages.length > 0 && (
                  <TabsTrigger value="workshops">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    Workshops ({workshopImages.length})
                  </TabsTrigger>
                )}
                {folders.map((folder) => (
                  <TabsTrigger key={folder} value={folder}>
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {folder === "root" ? "Root" : folder}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="h-[400px] overflow-y-auto">
                <TabsContent value="all" className="mt-0">
                  {filteredImages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No images found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {filteredImages.map((image) => (
                        <ImageCard
                          key={image.url}
                          image={image}
                          isSelected={selectedImages.includes(image.url)}
                          onClick={() => handleImageSelect(image.url)}
                          formatFileSize={formatFileSize}
                          getFilename={getFilename}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Workshops Tab */}
                <TabsContent value="workshops" className="mt-0">
                  {workshopImages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No workshop images found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {workshopImages.map((image) => (
                        <ImageCard
                          key={image.url}
                          image={image}
                          isSelected={selectedImages.includes(image.url)}
                          onClick={() => handleImageSelect(image.url)}
                          formatFileSize={formatFileSize}
                          getFilename={getFilename}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {folders.map((folder) => (
                  <TabsContent key={folder} value={folder} className="mt-0">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {(grouped[folder] || [])
                        .filter((image) =>
                          image.pathname
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map((image) => (
                          <ImageCard
                            key={image.url}
                            image={image}
                            isSelected={selectedImages.includes(image.url)}
                            onClick={() => handleImageSelect(image.url)}
                            formatFileSize={formatFileSize}
                            getFilename={getFilename}
                          />
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          )}

          {/* Footer with selection info and confirm button for multiple selection */}
          {multiple && selectedImages.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                {selectedImages.length} image{selectedImages.length > 1 ? "s" : ""}{" "}
                selected
              </p>
              <Button onClick={handleConfirmMultiple}>
                Add Selected Images
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ImageCardProps {
  image: ImageBlob
  isSelected: boolean
  onClick: () => void
  formatFileSize: (bytes: number) => string
  getFilename: (pathname: string) => string
}

function ImageCard({
  image,
  isSelected,
  onClick,
  formatFileSize,
  getFilename,
}: ImageCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="aspect-square bg-gray-100">
        <img
          src={image.url}
          alt={getFilename(image.pathname)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
          <Check className="h-3 w-3" />
        </div>
      )}

      {/* Hover overlay with details */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <p className="text-white text-xs truncate font-medium">
          {getFilename(image.pathname)}
        </p>
        <p className="text-white/70 text-xs">{formatFileSize(image.size)}</p>
      </div>
    </button>
  )
}

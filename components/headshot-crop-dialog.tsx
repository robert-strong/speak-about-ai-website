"use client"

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Loader2, ZoomIn, ZoomOut } from "lucide-react"

interface HeadshotCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  applying?: boolean
  onApply: (cropped: Blob) => void | Promise<void>
}

// Square editing viewport size in px; exported crop is up to OUTPUT_SIZE px.
const VIEWPORT = 320
const OUTPUT_SIZE = 1000
const MAX_ZOOM = 4

export function HeadshotCropDialog({
  open,
  onOpenChange,
  imageUrl,
  applying = false,
  onApply,
}: HeadshotCropDialogProps) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Load the image (with CORS enabled so canvas export works) whenever the dialog opens
  useEffect(() => {
    if (!open || !imageUrl) return
    setDims(null)
    setLoadError(null)
    setZoom(1)
    setOffset({ x: 0, y: 0 })

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imgRef.current = img
      setDims({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.onerror = () => {
      setLoadError("Could not load the image for editing. If it is hosted on another site, upload the file directly first.")
    }
    img.src = imageUrl
  }, [open, imageUrl])

  // At zoom 1 the image exactly covers the square viewport
  const baseScale = dims ? Math.max(VIEWPORT / dims.w, VIEWPORT / dims.h) : 1
  const dispW = dims ? dims.w * baseScale * zoom : 0
  const dispH = dims ? dims.h * baseScale * zoom : 0

  const clampOffset = (x: number, y: number, z: number) => {
    if (!dims) return { x: 0, y: 0 }
    const maxX = Math.max(0, (dims.w * baseScale * z - VIEWPORT) / 2)
    const maxY = Math.max(0, (dims.h * baseScale * z - VIEWPORT) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }

  const handleZoomChange = (value: number[]) => {
    const z = value[0]
    setZoom(z)
    setOffset(prev => clampOffset(prev.x, prev.y, z))
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dims || applying) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    setOffset(clampOffset(drag.originX + (e.clientX - drag.startX), drag.originY + (e.clientY - drag.startY), zoom))
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }

  const handleApply = async () => {
    const img = imgRef.current
    if (!img || !dims) return
    try {
      // Map the visible viewport back to source-image pixels
      const scale = baseScale * zoom
      const imgLeft = VIEWPORT / 2 - dispW / 2 + offset.x
      const imgTop = VIEWPORT / 2 - dispH / 2 + offset.y
      const sx = -imgLeft / scale
      const sy = -imgTop / scale
      const sSize = VIEWPORT / scale

      const outputSize = Math.max(1, Math.min(OUTPUT_SIZE, Math.round(sSize)))
      const canvas = document.createElement("canvas")
      canvas.width = outputSize
      canvas.height = outputSize
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas is not supported in this browser")
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, outputSize, outputSize)
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Failed to create image"))), "image/jpeg", 0.92)
      })
      await onApply(blob)
    } catch (err) {
      // A tainted canvas (image without CORS headers) throws a SecurityError on export
      setLoadError(
        err instanceof DOMException && err.name === "SecurityError"
          ? "This image's host does not allow editing in the browser. Upload the file directly, then crop it."
          : err instanceof Error
            ? err.message
            : "Failed to crop the image",
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={value => !applying && onOpenChange(value)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Headshot</DialogTitle>
          <DialogDescription>
            Drag to reposition and zoom to scale. The square area is what will show on speaker cards and the profile page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden rounded-lg border bg-gray-100 select-none touch-none cursor-grab active:cursor-grabbing"
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {loadError ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-600">
                {loadError}
              </div>
            ) : !dims ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Crop preview"
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    width: dispW,
                    height: dispH,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  }}
                />
                {/* Rule-of-thirds guides */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/3 top-0 h-full w-px bg-white/40" />
                  <div className="absolute left-2/3 top-0 h-full w-px bg-white/40" />
                  <div className="absolute top-1/3 left-0 w-full h-px bg-white/40" />
                  <div className="absolute top-2/3 left-0 w-full h-px bg-white/40" />
                </div>
              </>
            )}
          </div>

          <div className="flex w-full items-center gap-3 px-1">
            <ZoomOut className="h-4 w-4 flex-shrink-0 text-gray-500" />
            <Slider
              value={[zoom]}
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              onValueChange={handleZoomChange}
              disabled={!dims || !!loadError || applying}
            />
            <ZoomIn className="h-4 w-4 flex-shrink-0 text-gray-500" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply} disabled={!dims || !!loadError || applying}>
            {applying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Apply Crop"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

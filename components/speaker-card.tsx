"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Speaker } from "@/lib/speakers-data"
import { CalendarCheck, User, Lightbulb } from "lucide-react"

interface UnifiedSpeakerCardProps {
  speaker: Speaker
  contactSource: string
  maxTopicsToShow?: number
}

export function SpeakerCard({ speaker, contactSource, maxTopicsToShow = 3 }: UnifiedSpeakerCardProps) {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">("loading")
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("")
  const isInitialMount = useRef(true)
  const [didCancelRef, setDidCancelRef] = useState(false)

  if (!speaker || !speaker.slug) {
    return null
  }

  const {
    name = "Unnamed Speaker",
    title = "N/A",
    image,
    imagePosition = "center",
    imageOffsetY = "0%",
    industries = [],
    programs = [],
    slug,
    feeRange,
  } = speaker

  const placeholderImg = `/placeholder.svg?width=400&height=300&text=${encodeURIComponent(name)}`

  useEffect(() => {
    setCurrentImageUrl(image || placeholderImg)
  }, [image, placeholderImg])

  useEffect(() => {
    let didCancel = false
    setDidCancelRef(false)

    const loadImage = async () => {
      if (currentImageUrl && currentImageUrl !== placeholderImg) {
        setImageState("loading")
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          if (!didCancelRef) {
            setImageState("loaded")
          }
        }

        img.onerror = () => {
          if (!didCancelRef) {
            setImageState("error")
            if (currentImageUrl !== placeholderImg) {
              setCurrentImageUrl(placeholderImg)
            }
          }
        }

        img.src = currentImageUrl
      } else if (currentImageUrl === placeholderImg) {
        setImageState("loaded")
      }
    }

    loadImage()

    return () => {
      setDidCancelRef(true)
      didCancel = true
    }
  }, [currentImageUrl, placeholderImg, didCancelRef])

  const handleImageError = () => {
    if (imageState !== "error" && currentImageUrl !== placeholderImg) {
      setImageState("error")
      setCurrentImageUrl(placeholderImg)
    }
  }

  const handleImageLoad = () => {
    if (imageState !== "loaded") setImageState("loaded")
  }

  const profileLink = `/speakers/${slug}`
  const safeContactSource = contactSource || "unknown_source"
  const contactLink = `/contact?source=${safeContactSource}&speakerName=${encodeURIComponent(name)}`

  const commonButtonClasses =
    "w-full text-xs sm:text-sm px-3 h-auto py-3 whitespace-normal flex items-center justify-center gap-2"

  // Use programs array for keynote topics
  let safePrograms = Array.isArray(programs) ? programs : []
  
  // Fix for single-element arrays containing multiple items
  if (safePrograms.length === 1 && typeof safePrograms[0] === 'string') {
    // Check if it contains multiple items separated by comma or newline
    const singleItem = safePrograms[0];
    if (singleItem.includes(',') || singleItem.includes('\n')) {
      safePrograms = singleItem.split(/[,\n]+/).map(p => p.trim()).filter(p => p && p !== '');
    }
  }
  
  // Cap the number of keynote topics shown so cards stay a consistent height.
  // Speakers with many topics (4+) would otherwise stretch the tile taller than
  // the ideal (e.g. Vishal Sharma / Peter Norvig / Mo Tiwari, who show 3).
  const visiblePrograms = safePrograms.slice(0, maxTopicsToShow)

  const safeIndustries = Array.isArray(industries) ? industries : []

  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out border-0 bg-white group transform hover:-translate-y-1.5">
      <Link href={profileLink} className="block">
        <div className="relative w-full aspect-square sm:aspect-[4/5] md:aspect-[3/4] bg-gray-100 overflow-hidden rounded-t-xl cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1E68C6] z-20 group-hover:opacity-100 opacity-75 transition-opacity duration-300"></div>
          {imageState === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mb-2"></div>
                <div className="text-gray-500 text-sm">Loading image...</div>
              </div>
            </div>
          )}
          {imageState === "error" && currentImageUrl === placeholderImg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
              <div className="text-gray-400 text-sm text-center px-4">
                <div className="mb-2">📷</div>
                <div>Image unavailable</div>
              </div>
            </div>
          )}
          <img
            key={currentImageUrl}
            src={currentImageUrl || "/placeholder.svg"}
            alt={name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out ${
              imageState === "loaded" ? "opacity-100" : "opacity-0"
            }`}
            style={{ objectPosition: imagePosition === "top" ? `center ${imageOffsetY}` : "center" }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="eager"
            crossOrigin="anonymous"
          />
          {feeRange && (
            <Badge
              variant="secondary"
              className="absolute top-3 right-3 bg-black/75 text-white backdrop-blur-sm text-xs px-2.5 py-1.5 font-montserrat rounded-md shadow-md z-10"
            >
              {feeRange}
            </Badge>
          )}
          {safeIndustries.length > 0 && safeIndustries[0] && (
            <Badge className="absolute top-3 left-3 bg-[#1E68C6] text-white font-montserrat text-xs px-2 py-1.5 rounded-md shadow-md z-10 max-w-[calc(50%-0.5rem)] truncate">
              {safeIndustries[0]}
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4 sm:p-5 flex flex-col flex-grow relative">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-b-xl -z-1"></div>
        <div className="relative z-0">
          <Link href={profileLink} className="block">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-neue-haas leading-tight mb-1 group-hover:text-[#1E68C6] transition-colors duration-300">
              {name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium font-montserrat leading-snug">{title}</p>
          </Link>
          <div className="mb-4"></div>
          <div className="mb-3">
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-2 font-montserrat">
              <Lightbulb className="w-3.5 h-3.5" />
              Keynote Topics
            </div>
            {visiblePrograms.length > 0 ? (
              <div className="space-y-1.5">
                {visiblePrograms.map((program, index) => (
                  <div key={`${slug}-program-${index}`} className="text-sm text-gray-700 font-montserrat break-words">
                    • {String(program).trim()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 font-montserrat italic">
                No keynote topics available yet
              </div>
            )}
          </div>
          <div className="mt-auto pt-4">
            <div className="w-full flex flex-col space-y-3">
              <Button asChild variant="gold" className={commonButtonClasses}>
                <Link href={contactLink}>
                  <CalendarCheck size={16} />
                  <span>Book A Speaker</span>
                </Link>
              </Button>
              <div className="flex gap-2">
                <Button asChild variant="default" className={`${commonButtonClasses} flex-1`}>
                  <Link href={profileLink}>
                    <User size={16} />
                    <span>View Profile</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

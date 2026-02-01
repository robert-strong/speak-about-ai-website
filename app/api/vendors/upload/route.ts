import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    // Check if blob storage is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set")
      
      // Return a mock URL for development
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ 
          url: "https://placehold.co/400x400/2563eb/ffffff?text=Vendor+Logo",
          success: true,
          message: "Using placeholder in development" 
        })
      }
      
      return NextResponse.json(
        { error: "File upload service not configured" },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, GIF, and SVG images are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `vendors/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return NextResponse.json({
      url: blob.url,
      success: true
    })
  } catch (error) {
    console.error("Vendor upload error:", error)
    
    // Return placeholder in development if blob upload fails
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ 
        url: "https://placehold.co/400x400/2563eb/ffffff?text=Vendor+Logo",
        success: true,
        message: "Using placeholder due to upload error in development" 
      })
    }
    
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
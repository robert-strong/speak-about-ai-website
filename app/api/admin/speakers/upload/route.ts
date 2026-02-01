import { handleUpload } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // For admin uploads, we'll check the referer to ensure it's from the admin dashboard
    const referer = request.headers.get('referer')
    
    // Basic security check - ensure request is from admin area
    if (referer && !referer.includes('/admin/speakers')) {
      return NextResponse.json(
        { error: 'Unauthorized upload request', code: 'UNAUTHORIZED' },
        { status: 403 }
      )
    }

    // Check if the Blob token is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set")
      return NextResponse.json({ error: "File upload service unavailable" }, { status: 503 })
    }

    const body = await request.json()

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Generate a client token for the browser to upload the file
        // Only allow image uploads for speaker profiles
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB limit for speaker photos
          allowOverwrite: true,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        // Get notified of client upload completion
        console.log("Admin speaker photo upload completed:", blob)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Admin speaker upload error:", error)

    // Provide user-friendly error messages for common issues
    let errorMessage = "Upload failed"
    let statusCode = 400

    if (error instanceof Error) {
      const msg = error.message.toLowerCase()

      if (msg.includes("content type") || msg.includes("not allowed")) {
        errorMessage = "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image."
      } else if (msg.includes("size") || msg.includes("too large")) {
        errorMessage = "Image is too large. Please upload an image under 5MB."
      } else if (msg.includes("network") || msg.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again."
        statusCode = 503
      } else if (msg.includes("token") || msg.includes("unauthorized")) {
        errorMessage = "Upload authorization failed. Please refresh the page and try again."
        statusCode = 401
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: statusCode },
    )
  }
}
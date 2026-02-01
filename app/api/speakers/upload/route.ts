import { handleUpload } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // For speaker uploads, we'll check the referer to ensure it's from the speaker dashboard
    // In production, implement proper JWT validation
    const referer = request.headers.get('referer')
    const origin = request.headers.get('origin')
    
    // Basic security check - ensure request is from our domain
    if (referer && !referer.includes('/speakers/dashboard')) {
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
        }
      },
      onUploadCompleted: async ({ blob }) => {
        // Get notified of client upload completion
        console.log("Speaker photo upload completed:", blob)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Speaker upload error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 400 },
    )
  }
}
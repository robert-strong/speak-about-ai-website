import { list } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth-middleware"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Require authentication
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required", code: "NO_AUTH" },
        { status: 401 }
      )
    }

    // Check if the Blob token is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set")
      return NextResponse.json({ error: "Image library unavailable" }, { status: 503 })
    }

    // Get search/filter params
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get("prefix") || ""
    const cursor = searchParams.get("cursor") || undefined
    const limit = parseInt(searchParams.get("limit") || "1000", 10)

    // List blobs from Vercel Blob storage - get all images by paginating
    let allBlobs: Awaited<ReturnType<typeof list>>["blobs"] = []
    let currentCursor = cursor
    let iterations = 0
    const maxIterations = 10 // Safety limit

    do {
      const result = await list({
        prefix,
        cursor: currentCursor,
        limit: Math.min(limit, 1000),
      })
      allBlobs = [...allBlobs, ...result.blobs]
      currentCursor = result.cursor
      iterations++
    } while (currentCursor && iterations < maxIterations && allBlobs.length < limit)

    const blobs = allBlobs
    const nextCursor = currentCursor
    const hasMore = !!currentCursor

    // Filter to only image types (use file extension as fallback when contentType is undefined)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff']
    const imageBlobs = blobs.filter((blob) => {
      // Check contentType first
      if (blob.contentType?.startsWith("image/")) return true
      // Fallback to file extension check
      const pathname = blob.pathname.toLowerCase()
      return imageExtensions.some(ext => pathname.endsWith(ext))
    })

    // Group by folder/prefix for easier browsing
    const grouped: Record<string, typeof imageBlobs> = {}
    for (const blob of imageBlobs) {
      // Extract folder from pathname (e.g., "speakers/photo.jpg" -> "speakers")
      const parts = blob.pathname.split("/")
      const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "root"
      if (!grouped[folder]) {
        grouped[folder] = []
      }
      grouped[folder].push(blob)
    }

    return NextResponse.json({
      images: imageBlobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        contentType: blob.contentType,
      })),
      grouped,
      cursor: nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error("Error listing images:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list images",
      },
      { status: 500 }
    )
  }
}

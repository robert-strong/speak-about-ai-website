"use client"

import type React from "react"

import { useState } from "react"
import { upload } from "@vercel/blob/client"

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  // Add this function to check image dimensions
  const checkImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error("Failed to load image"))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Update the handleSubmit function with stricter file size limits
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please select a file")
      return
    }

    // Check file size (500KB limit)
    const maxSizeKB = 500
    const maxSizeBytes = maxSizeKB * 1024
    if (file.size > maxSizeBytes) {
      setError(`File size too large: ${(file.size / 1024).toFixed(1)}KB. Maximum allowed: ${maxSizeKB}KB`)
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    try {
      // Check image dimensions
      setUploadStatus("Checking image dimensions...")
      const dimensions = await checkImageDimensions(file)

      if (dimensions.width < 800 || dimensions.height < 800) {
        setError(`Image dimensions too small: ${dimensions.width}x${dimensions.height}px. Minimum required: 800x800px`)
        return
      }

      setUploading(true)
      setError(null)
      setUploadStatus("Starting upload...")

      console.log("Starting upload for file:", file.name, "Size:", file.size, "Dimensions:", dimensions)

      // Create a filename with timestamp to avoid conflicts
      const timestamp = new Date().getTime()
      const filename = `${file.name.split(".")[0]}-${timestamp}.${file.name.split(".").pop()}`

      setUploadStatus("Connecting to Vercel Blob...")

      // Upload to Vercel Blob
      const blob = await upload(filename, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })

      console.log("Upload successful:", blob)
      setUploadedUrl(blob.url)
      setUploadStatus(null)
    } catch (err) {
      console.error("Upload error:", err)
      setError(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`)

      // Provide more helpful error messages
      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          setError(
            "Network error: Could not connect to the upload API. Check your internet connection and make sure the API route exists.",
          )
        } else if (err.message.includes("401") || err.message.includes("unauthorized")) {
          setError("Authentication error: The Blob token may be invalid or missing.")
        } else if (err.message.includes("CORS")) {
          setError("CORS error: The API route may not be configured correctly.")
        }
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">
            Select image file:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null
                setFile(selectedFile)
                setError(null)
                setUploadedUrl(null)

                if (selectedFile) {
                  console.log("File selected:", {
                    name: selectedFile.name,
                    size: selectedFile.size,
                    type: selectedFile.type,
                  })
                }
              }}
              className="block w-full mt-1 border p-2"
            />
          </label>
          {file && (
            <div className="mt-2 text-sm text-gray-600">
              <p>File: {file.name}</p>
              <p>Size: {(file.size / 1024).toFixed(1)} KB</p>
              <p>Type: {file.type}</p>
              {file.size > 500 * 1024 && (
                <p className="text-red-600 font-semibold">⚠️ File too large - must be under 500KB</p>
              )}
            </div>
          )}
          {file && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded">
              <h3 className="font-bold mb-2">Image Requirements:</h3>
              <ul className="list-disc pl-5 text-sm">
                <li>
                  <strong>Minimum dimensions:</strong> 800x800 pixels
                </li>
                <li>
                  <strong>Maximum file size:</strong> 500KB
                </li>
                <li>
                  <strong>Supported formats:</strong> JPEG, PNG, WebP, GIF
                </li>
                <li>
                  <strong>Recommendation:</strong> Use JPEG format for smaller file sizes
                </li>
                <li>
                  <strong>Tip:</strong> Compress images before uploading to meet size requirements
                </li>
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading || !file}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </form>

      {uploadStatus && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded">
          <p>{uploadStatus}</p>
          {uploading && (
            <div className="mt-2 w-full h-1 bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 animate-pulse"></div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {uploadedUrl && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-bold">Upload Successful!</h2>

          <div className="p-4 bg-gray-100 rounded">
            <p className="font-mono text-sm break-all">{uploadedUrl}</p>
          </div>

          <div className="border p-4">
            <p className="mb-2 font-bold">Image Preview:</p>
            <img src={uploadedUrl || "/placeholder.svg"} alt="Uploaded image" className="max-w-full h-auto" />
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-bold">Next Steps:</p>
            <p className="mt-2">Copy this URL and paste it in your Google Sheet for the speaker's image field.</p>
          </div>
        </div>
      )}

      {/* Image Optimization Tips */}
      <div className="mt-8 p-4 bg-green-50 rounded">
        <h3 className="font-bold mb-2 text-green-800">Image Optimization Tips:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-green-700">
          <li>Use online tools like TinyPNG, Squoosh, or Photoshop's "Save for Web" to compress images</li>
          <li>JPEG format typically produces smaller file sizes than PNG for photos</li>
          <li>Aim for 80-90% quality when compressing to balance size and visual quality</li>
          <li>Consider using WebP format for even better compression (if supported)</li>
          <li>Square aspect ratio (1:1) works best for speaker profile images</li>
        </ul>
      </div>

      {/* Debug Information */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-2">Troubleshooting:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Check the browser console (F12) for detailed error messages</li>
          <li>If you see "Failed to fetch" errors, the API route might not be responding</li>
          <li>If you see "401 Unauthorized" errors, the Blob token might be invalid</li>
          <li>Make sure the /api/upload route exists and is properly configured</li>
        </ul>
      </div>
    </div>
  )
}

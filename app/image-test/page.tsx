"use client"

import { useState } from "react"
import Image from "next/image"

export default function ImageTestPage() {
  const [status, setStatus] = useState<string>("Loading...")
  const [imgSrc, setImgSrc] = useState<string>("/speakers/peter-norvig-headshot.jpg")
  const [useNextImage, setUseNextImage] = useState<boolean>(true)

  const handleLoadSuccess = () => {
    setStatus("Image loaded successfully!")
  }

  const handleLoadError = () => {
    setStatus("Error loading image!")
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Image Loading Test</h1>

      <div className="mb-4">
        <label className="block mb-2">
          Image path:
          <input
            type="text"
            value={imgSrc}
            onChange={(e) => setImgSrc(e.target.value)}
            className="ml-2 border p-1 w-full"
          />
        </label>
      </div>

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={useNextImage}
            onChange={() => setUseNextImage(!useNextImage)}
            className="mr-2"
          />
          Use Next.js Image component
        </label>
      </div>

      <button onClick={() => setStatus("Loading...")} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
        Reload Image
      </button>

      <div className="p-4 border mb-4">
        <p className="mb-2">
          <strong>Status:</strong> {status}
        </p>

        {useNextImage ? (
          <Image
            src={imgSrc || "/placeholder.svg"}
            alt="Test image"
            width={400}
            height={500}
            onLoad={handleLoadSuccess}
            onError={handleLoadError}
            className="max-w-full h-auto"
            unoptimized={true}
          />
        ) : (
          <img
            src={imgSrc || "/placeholder.svg"}
            alt="Test image"
            onLoad={handleLoadSuccess}
            onError={handleLoadError}
            className="max-w-full h-auto"
          />
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Troubleshooting Tips:</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            If the image loads with the regular img tag but not with Next.js Image, there might be an issue with the
            Next.js Image optimization.
          </li>
          <li>
            Try adding <code>unoptimized=true</code> to the Next.js Image component.
          </li>
          <li>Check if the image file is too large (over 4MB).</li>
          <li>Verify the image isn't corrupted by opening it directly in a browser.</li>
          <li>Try converting the image to a different format (PNG, WebP).</li>
        </ul>
      </div>
    </div>
  )
}

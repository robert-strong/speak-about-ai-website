import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Constructs a full URL for an image path.
 * - Handles absolute URLs (http, https).
 * - Handles protocol-relative URLs (e.g., from Contentful) by prepending "https:".
 * - Handles relative paths (starts with '/') by prepending the NEXT_PUBLIC_PAYLOAD_URL (for Payload CMS).
 * @param imagePath The path or URL to the image.
 * @returns The full, absolute URL to the image or null if the path is invalid.
 */
export function getImageUrl(imagePath?: string | null): string | null {
  const backendUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL

  if (!imagePath) {
    return null
  }

  // If it's already a full URL (http, https), return it directly
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath
  }

  // If it's protocol-relative (e.g., //images.ctfassets.net/... from Contentful), prepend https:
  if (imagePath.startsWith("//")) {
    return `https:${imagePath}`
  }

  // If it's a relative path (Payload CMS convention, e.g., /media/image.jpg), prepend the backend URL
  if (imagePath.startsWith("/") && backendUrl) {
    return `${backendUrl}${imagePath}`
  }

  // If it's a relative path but backendUrl is not set, or other unhandled cases
  if (imagePath.startsWith("/")) {
    console.warn(
      `getImageUrl: Relative path "${imagePath}" provided but NEXT_PUBLIC_PAYLOAD_URL is not set or path is not a known type. Returning path as is.`,
    )
  }
  // Fallback for other cases (e.g. a local public path that doesn't start with / but is treated as relative by browser)
  return imagePath
}

/**
 * Formats a date string consistently for both server and client to prevent hydration mismatches.
 * Uses UTC to ensure consistent formatting regardless of server/client timezone differences.
 * @param dateString The date string to format
 * @returns Formatted date string in "MMM DD, YYYY" format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return ""
    }

    // Use UTC methods to ensure consistent formatting across server/client
    const month = date.toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC"
    })
    const day = date.getUTCDate()
    const year = date.getUTCFullYear()

    return `${month} ${day}, ${year}`
  } catch (error) {
    console.warn(`formatDate: Invalid date string "${dateString}"`)
    return ""
  }
}

/**
 * Formats a number as currency (USD)
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return "$0"
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount)
}

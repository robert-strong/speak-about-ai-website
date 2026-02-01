/**
 * Utility functions for standardizing image filenames for SEO
 */

/**
 * Converts a filename to a SEO-friendly slug
 * - Lowercase
 * - Replaces spaces and underscores with hyphens
 * - Removes special characters except hyphens and periods
 * - Preserves the file extension
 */
export function slugifyFilename(filename: string): string {
  // Extract the extension
  const lastDotIndex = filename.lastIndexOf('.')
  const extension = lastDotIndex > 0 ? filename.slice(lastDotIndex).toLowerCase() : ''
  const nameWithoutExtension = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename

  // Slugify the name
  const slug = nameWithoutExtension
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')

  return slug + extension
}

/**
 * Creates a standardized pathname for an uploaded image
 * @param originalFilename - The original filename from the upload
 * @param context - The context/category (e.g., 'speakers', 'workshops', 'conferences')
 * @param identifier - Optional identifier to add (e.g., speaker name, workshop title)
 */
export function createImagePathname(
  originalFilename: string,
  context: 'speakers' | 'workshops' | 'conferences' | 'vendors' | 'blog' | 'general',
  identifier?: string
): string {
  const slugifiedName = slugifyFilename(originalFilename)

  // Extract extension for potential renaming
  const lastDotIndex = slugifiedName.lastIndexOf('.')
  const extension = lastDotIndex > 0 ? slugifiedName.slice(lastDotIndex) : ''
  const nameWithoutExtension = lastDotIndex > 0 ? slugifiedName.slice(0, lastDotIndex) : slugifiedName

  // If an identifier is provided, use it to create a more descriptive name
  if (identifier) {
    const slugifiedIdentifier = identifier
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Determine the type based on original filename hints
    let type = ''
    const lowerName = originalFilename.toLowerCase()
    if (lowerName.includes('headshot') || lowerName.includes('photo') || lowerName.includes('portrait')) {
      type = 'headshot'
    } else if (lowerName.includes('logo')) {
      type = 'logo'
    } else if (lowerName.includes('thumbnail') || lowerName.includes('thumb')) {
      type = 'thumbnail'
    } else if (lowerName.includes('banner') || lowerName.includes('hero')) {
      type = 'banner'
    }

    // Create the final pathname
    const finalName = type
      ? `${slugifiedIdentifier}-${type}`
      : `${slugifiedIdentifier}-${nameWithoutExtension}`

    return `${context}/${finalName}${extension}`
  }

  return `${context}/${slugifiedName}`
}

/**
 * Adds a unique timestamp suffix to prevent filename collisions
 */
export function addTimestampSuffix(pathname: string): string {
  const timestamp = Date.now()
  const lastDotIndex = pathname.lastIndexOf('.')

  if (lastDotIndex > 0) {
    const name = pathname.slice(0, lastDotIndex)
    const extension = pathname.slice(lastDotIndex)
    return `${name}-${timestamp}${extension}`
  }

  return `${pathname}-${timestamp}`
}

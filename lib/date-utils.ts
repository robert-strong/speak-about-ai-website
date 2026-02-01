// Utility functions for consistent date/time formatting in Pacific Time

/**
 * Format a date to Pacific Time with various format options
 */
export function formatDatePST(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return 'N/A'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Default options for Pacific Time
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...options
  }
  
  try {
    return dateObj.toLocaleString('en-US', defaultOptions)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

/**
 * Format a date with time in Pacific Time
 */
export function formatDateTimePST(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return 'N/A'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  }
  
  try {
    return dateObj.toLocaleString('en-US', defaultOptions)
  } catch (error) {
    console.error('Error formatting date/time:', error)
    return 'Invalid date'
  }
}

/**
 * Format time only in Pacific Time
 */
export function formatTimePST(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return 'N/A'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    ...options
  }
  
  try {
    return dateObj.toLocaleTimeString('en-US', defaultOptions)
  } catch (error) {
    console.error('Error formatting time:', error)
    return 'Invalid time'
  }
}

/**
 * Get current time in PST
 */
export function getCurrentTimePST(): string {
  return formatTimePST(new Date())
}

/**
 * Get current date/time in PST
 */
export function getCurrentDateTimePST(): string {
  return formatDateTimePST(new Date())
}

/**
 * Format date for display in tables/lists (short format)
 */
export function formatDateShortPST(date: string | Date | null | undefined): string {
  return formatDatePST(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format date for display in detailed views (long format)
 */
export function formatDateLongPST(date: string | Date | null | undefined): string {
  return formatDatePST(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Get PST timezone offset string (e.g., "PST" or "PDT")
 */
export function getPSTTimezoneLabel(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short'
  })
  
  const parts = formatter.formatToParts(now)
  const timeZone = parts.find(part => part.type === 'timeZoneName')
  
  return timeZone?.value || 'PST'
}

/**
 * Format relative time (e.g., "2 hours ago") in PST context
 */
export function formatRelativeTimePST(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 7) {
    return formatDateShortPST(date)
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  } else {
    return 'Just now'
  }
}
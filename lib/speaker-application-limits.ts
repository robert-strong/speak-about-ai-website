/**
 * Maximum lengths for the public speaker application form (/apply).
 *
 * Shared by the form (maxLength on inputs) and the API route (400 instead of
 * a database error). Generous on purpose: applicants write sentences in fields
 * like "timezone" and "booking lead time". The matching columns are TEXT as of
 * migration 028; these caps just keep payloads sane.
 */
export const SPEAKER_APPLICATION_LIMITS = {
  first_name: 100,
  last_name: 100,
  email: 255,
  phone: 100,
  website: 500,
  linkedin_url: 500,
  location: 255,
  timezone: 255,
  headshot_url: 500,
  title: 255,
  company: 255,
  total_engagements: 255,
  booking_lead_time: 500,
  twitter_url: 500,
  youtube_url: 500,
  instagram_url: 500,
  blog_url: 500,
} as const

export type SpeakerApplicationLimitedField = keyof typeof SPEAKER_APPLICATION_LIMITS

export const SPEAKER_APPLICATION_FIELD_LABELS: Record<SpeakerApplicationLimitedField, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  email: 'Email',
  phone: 'Phone number',
  website: 'Website',
  linkedin_url: 'LinkedIn URL',
  location: 'Location',
  timezone: 'Timezone',
  headshot_url: 'Headshot URL',
  title: 'Title',
  company: 'Company',
  total_engagements: 'Total speaking engagements',
  booking_lead_time: 'Booking lead time',
  twitter_url: 'Twitter/X URL',
  youtube_url: 'YouTube URL',
  instagram_url: 'Instagram URL',
  blog_url: 'Blog URL',
}

/** Returns a visitor-readable error for the first field over its limit, or null. */
export function findOverlongField(body: Record<string, unknown>): string | null {
  for (const [field, max] of Object.entries(SPEAKER_APPLICATION_LIMITS) as [SpeakerApplicationLimitedField, number][]) {
    const value = body[field]
    if (typeof value === 'string' && value.length > max) {
      return `${SPEAKER_APPLICATION_FIELD_LABELS[field]} is too long (${value.length} characters, maximum ${max}). Please shorten it.`
    }
  }
  return null
}

/**
 * Public display of direct contact details (phone numbers, email addresses).
 *
 * Turned OFF in Sep 2026: visitors are directed to the contact form instead.
 * All the underlying plumbing (content keys, defaults, admin editor fields,
 * database values) is left in place, so restoring the old behaviour is just
 * setting NEXT_PUBLIC_SHOW_DIRECT_CONTACT_INFO=true (or flipping the default
 * below) and redeploying.
 *
 * This only affects what anonymous visitors see on the marketing site. Admin
 * pages, client/speaker portals, contracts, proposals and outgoing emails are
 * not gated by this flag.
 */
export const SHOW_DIRECT_CONTACT_INFO = process.env.NEXT_PUBLIC_SHOW_DIRECT_CONTACT_INFO === 'true'

/** Where visitors are sent instead of a phone number or email address. */
export const CONTACT_FORM_PATH = '/contact'

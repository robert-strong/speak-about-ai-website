import { NextRequest } from 'next/server'

export interface AnalyticsData {
  sessionId: string
  visitorId: string
  pagePath: string
  pageTitle?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  userAgent?: string
  ipAddress?: string
  country?: string
  city?: string
  deviceType?: 'mobile' | 'desktop' | 'tablet'
  browser?: string
  os?: string
  screenResolution?: string
  viewportSize?: string
  isBot?: boolean
}

export interface EventData {
  sessionId: string
  visitorId: string
  eventName: string
  eventCategory?: string
  eventValue?: number
  pagePath?: string
  metadata?: Record<string, any>
}

/**
 * Extract analytics data from request
 */
export function extractAnalyticsFromRequest(request: NextRequest): Partial<AnalyticsData> {
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || request.headers.get('referrer') || ''
  
  // Extract IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ipAddress = forwarded 
    ? forwarded.split(',')[0].trim() 
    : request.headers.get('x-real-ip') || request.ip || 'unknown'

  // Detect device type from user agent
  const deviceType = getDeviceType(userAgent)
  const browser = getBrowserFromUserAgent(userAgent)
  const os = getOSFromUserAgent(userAgent)
  const isBot = detectBot(userAgent)

  return {
    userAgent,
    referrer: referer,
    ipAddress,
    deviceType,
    browser,
    os,
    isBot
  }
}

/**
 * Extract UTM parameters from URL
 */
export function extractUTMParams(url: string): {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
} {
  try {
    const urlObj = new URL(url)
    return {
      utmSource: urlObj.searchParams.get('utm_source') || undefined,
      utmMedium: urlObj.searchParams.get('utm_medium') || undefined,
      utmCampaign: urlObj.searchParams.get('utm_campaign') || undefined,
      utmContent: urlObj.searchParams.get('utm_content') || undefined,
      utmTerm: urlObj.searchParams.get('utm_term') || undefined,
    }
  } catch {
    return {}
  }
}

/**
 * Generate visitor ID (would typically use cookies or fingerprinting)
 */
export function generateVisitorId(): string {
  return 'visitor_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Detect device type from user agent
 */
function getDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  }
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile'
  }
  
  return 'desktop'
}

/**
 * Extract browser from user agent
 */
function getBrowserFromUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('firefox')) return 'Firefox'
  if (ua.includes('chrome')) return 'Chrome'
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
  if (ua.includes('edge')) return 'Edge'
  if (ua.includes('opera')) return 'Opera'
  if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer'
  
  return 'Unknown'
}

/**
 * Extract OS from user agent
 */
function getOSFromUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac os')) return 'macOS'
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
  
  return 'Unknown'
}

/**
 * Detect if user agent is a bot
 */
function detectBot(userAgent: string): boolean {
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'headless',
    'googlebot', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandexbot', 'facebookexternalhit'
  ]
  
  const ua = userAgent.toLowerCase()
  return botPatterns.some(pattern => ua.includes(pattern))
}

/**
 * Get approximate location from IP (you'd typically use a service like ipapi.co)
 */
export async function getLocationFromIP(ipAddress: string): Promise<{country?: string, city?: string}> {
  // This is a placeholder - you'd integrate with a real IP geolocation service
  // Free options: ipapi.co, ip-api.com, freegeoip.app
  try {
    if (ipAddress === 'unknown' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return { country: 'Unknown', city: 'Unknown' }
    }
    
    // Example integration with ipapi.co (free tier: 1000 requests/month)
    // const response = await fetch(`https://ipapi.co/${ipAddress}/json/`)
    // const data = await response.json()
    // return { country: data.country_name, city: data.city }
    
    return { country: 'Unknown', city: 'Unknown' }
  } catch {
    return { country: 'Unknown', city: 'Unknown' }
  }
}

/**
 * Check if request should be tracked (exclude admin, bots, etc.)
 */
export function shouldTrackRequest(request: NextRequest, analytics: Partial<AnalyticsData>): boolean {
  const url = request.nextUrl
  
  // Don't track admin pages
  if (url.pathname.startsWith('/admin')) return false
  
  // Don't track API calls
  if (url.pathname.startsWith('/api')) return false
  
  // Don't track bots
  if (analytics.isBot) return false
  
  // Don't track common non-page requests
  const excludeExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.woff', '.woff2']
  if (excludeExtensions.some(ext => url.pathname.endsWith(ext))) return false
  
  return true
}
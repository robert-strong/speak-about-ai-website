import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractAnalyticsFromRequest, extractUTMParams, generateVisitorId, generateSessionId, shouldTrackRequest } from './lib/analytics-utils'
import { recordPageView, updateSession } from './lib/analytics-db'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Bot protection - block suspicious traffic patterns
  const country = request.geo?.country || request.headers.get('x-vercel-ip-country') || ''
  const userAgent = request.headers.get('user-agent') || ''

  // Block known bot patterns:
  // - Singapore + Windows 7 + Chrome (common bot signature)
  // - Empty or suspicious user agents
  const isWindows7 = userAgent.includes('Windows NT 6.1')
  const isSuspiciousBot = (
    // Block Singapore + Windows 7 (known bot farm pattern)
    (country === 'SG' && isWindows7) ||
    // Block empty user agents
    !userAgent ||
    userAgent.length < 10 ||
    // Block common bot signatures
    /bot|crawler|spider|scraper|headless/i.test(userAgent)
  )

  // Allow legitimate bots like Google, Bing, Slack
  const isLegitimateBot = /Googlebot|Bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot/i.test(userAgent)

  if (isSuspiciousBot && !isLegitimateBot) {
    // Return a 403 Forbidden for suspicious bots
    return new NextResponse('Access Denied', { status: 403 })
  }

  // URL normalization for SEO (before creating response)
  let shouldRedirect = false

  // List of known root-level routes that should NOT be redirected to /speakers/
  const knownRoutes = [
    '/',
    '/speakers',
    '/contact',
    '/about',
    '/blog',
    '/our-services',
    '/our-team',
    '/partners',
    '/ai-workshops',
    '/workshops',
    '/conference-directory',
    '/admin',
    '/api',
    '/clients',
    '/apply',
    '/privacy',
    '/terms',
  ]

  // Check if this is a root-level path (no nested paths)
  const isRootLevelPath = pathname.split('/').filter(Boolean).length === 1

  // If it's a root-level path and not a known route, redirect to /speakers/:slug
  if (isRootLevelPath && !knownRoutes.includes(pathname) && !pathname.startsWith('/api/')) {
    const slug = pathname.slice(1) // Remove leading slash
    url.pathname = `/speakers/${slug}`
    return NextResponse.redirect(url, 301)
  }

  // Convert speaker and blog slugs to lowercase
  if (pathname.startsWith('/speakers/') || pathname.startsWith('/blog/')) {
    const lowerPathname = pathname.toLowerCase()
    if (pathname !== lowerPathname) {
      url.pathname = lowerPathname
      shouldRedirect = true
    }
  }

  // Remove trailing slash except for homepage
  if (pathname !== '/' && pathname.endsWith('/')) {
    url.pathname = pathname.slice(0, -1)
    shouldRedirect = true
  }

  // Redirect if URL needs normalization
  if (shouldRedirect) {
    return NextResponse.redirect(url, 301)
  }
  
  const response = NextResponse.next()
  
  // Add canonical header to help search engines
  response.headers.set('Link', `<https://speakabout.ai${pathname}>; rel="canonical"`)
  
  // Check if this is an API route
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // Check if user is an admin (has adminLoggedIn cookie)
  const isAdmin = request.cookies.get('adminLoggedIn')?.value === 'true'

  // Extract analytics data from the request
  const analyticsData = extractAnalyticsFromRequest(request)
  
  // Check if we should track this request (skip for API routes and admin users)
  if (isApiRoute || isAdmin || !shouldTrackRequest(request, analyticsData)) {
    // For API routes, we still want to ensure session cookie is set
    if (isApiRoute && !request.cookies.get('session_id')?.value) {
      const sessionId = generateSessionId()
      response.cookies.set('session_id', sessionId, {
        maxAge: 30 * 60, // 30 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    }
    return response
  }

  // Check if user has consented to analytics cookies
  const cookieConsent = request.cookies.get('cookie-consent')?.value
  let hasAnalyticsConsent = false
  
  if (cookieConsent) {
    try {
      const consent = JSON.parse(cookieConsent)
      hasAnalyticsConsent = consent.analytics === true
    } catch {
      hasAnalyticsConsent = false
    }
  }

  // If no analytics consent, skip tracking
  if (!hasAnalyticsConsent) {
    return response
  }

  try {
    // Get or generate visitor ID from cookies
    let visitorId = request.cookies.get('visitor_id')?.value
    if (!visitorId) {
      visitorId = generateVisitorId()
      response.cookies.set('visitor_id', visitorId, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    }

    // Get or generate session ID from cookies
    let sessionId = request.cookies.get('session_id')?.value
    let isNewSession = false
    if (!sessionId) {
      sessionId = generateSessionId()
      isNewSession = true
      response.cookies.set('session_id', sessionId, {
        maxAge: 30 * 60, // 30 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    }

    // Extract UTM parameters
    const utmParams = extractUTMParams(request.url)

    // Get page title from headers if available (would be set by client-side script)
    const pageTitle = request.headers.get('x-page-title') || undefined

    // Record the page view
    await recordPageView({
      sessionId,
      visitorId,
      pagePath: request.nextUrl.pathname,
      pageTitle,
      ...analyticsData,
      ...utmParams
    })

    // Update session information
    await updateSession(sessionId, {
      visitorId,
      firstPage: isNewSession ? request.nextUrl.pathname : undefined,
      lastPage: request.nextUrl.pathname,
      pageCount: isNewSession ? 1 : undefined,
      referrer: analyticsData.referrer,
      ...utmParams,
      deviceType: analyticsData.deviceType,
      browser: analyticsData.browser
    })

  } catch (error) {
    // Don't let analytics errors break the website
    console.error('Analytics tracking error:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * 
     * Note: We now include API routes to ensure session cookies are set
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseAdminSessionOptions {
  inactivityTimeout?: number // milliseconds (default: 1 hour)
  warningTime?: number // milliseconds before timeout to show warning (default: 5 minutes)
  checkInterval?: number // how often to check for inactivity (default: 30 seconds)
}

interface SessionState {
  isActive: boolean
  timeUntilLogout: number | null
  showWarning: boolean
}

export function useAdminSession(options: UseAdminSessionOptions = {}) {
  const router = useRouter()
  const {
    inactivityTimeout = 60 * 60 * 1000, // 1 hour
    warningTime = 5 * 60 * 1000, // 5 minutes
    checkInterval = 30 * 1000 // 30 seconds
  } = options

  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: true,
    timeUntilLogout: null,
    showWarning: false
  })

  const lastActivityRef = useRef<number>(Date.now())
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const refreshCooldownRef = useRef<number>(0)

  // Update last activity time
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Clear any existing logout timeout
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current)
      logoutTimeoutRef.current = null
    }

    // Reset warning state
    setSessionState(prev => ({
      ...prev,
      showWarning: false,
      timeUntilLogout: null
    }))

    // Refresh session token if we haven't refreshed in the last 5 minutes
    const now = Date.now()
    if (now - refreshCooldownRef.current > 5 * 60 * 1000) {
      refreshSession().catch(() => {
        // Silently ignore refresh errors during activity updates
        // This prevents console noise from network blips
      })
      refreshCooldownRef.current = now
    }
  }, [])

  // Track consecutive refresh failures
  const refreshFailuresRef = useRef<number>(0)
  const MAX_REFRESH_FAILURES = 3

  // Refresh session token
  const refreshSession = async () => {
    try {
      const token = localStorage.getItem('adminSessionToken')
      if (!token) return

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.sessionToken) {
          localStorage.setItem('adminSessionToken', data.sessionToken)
        }
        // Reset failure count on success
        refreshFailuresRef.current = 0
      } else {
        // Increment failure count
        refreshFailuresRef.current++
        console.warn(`Session refresh failed (attempt ${refreshFailuresRef.current}/${MAX_REFRESH_FAILURES})`)

        // Only logout after multiple consecutive failures
        if (refreshFailuresRef.current >= MAX_REFRESH_FAILURES) {
          console.warn('Max refresh failures reached, logging out')
          await performLogout()
        }
      }
    } catch (error) {
      // Network error - don't count as auth failure, just log it
      console.error('Failed to refresh session (network error):', error)
    }
  }

  // Track if logout is in progress to prevent multiple calls
  const isLoggingOutRef = useRef(false)

  // Perform logout
  const performLogout = useCallback(async () => {
    // Prevent multiple simultaneous logout calls
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    try {
      // Clear local storage
      localStorage.removeItem('adminLoggedIn')
      localStorage.removeItem('adminSessionToken')
      localStorage.removeItem('adminUser')

      // Call logout endpoint to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      // Redirect to login
      router.push('/admin')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if API call fails
      router.push('/admin')
    } finally {
      // Reset after a delay to allow redirect to complete
      setTimeout(() => {
        isLoggingOutRef.current = false
      }, 1000)
    }
  }, [router])

  // Extend session (called when user clicks "Stay logged in")
  const extendSession = useCallback(() => {
    updateActivity()
  }, [updateActivity])

  // Check for inactivity
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivityRef.current
      const timeUntilTimeout = inactivityTimeout - timeSinceActivity

      // If we've exceeded the timeout, logout
      if (timeSinceActivity >= inactivityTimeout) {
        console.log('Session timed out due to inactivity')
        performLogout()
        return
      }

      // If we're within warning time, show warning
      if (timeUntilTimeout <= warningTime) {
        setSessionState({
          isActive: true,
          showWarning: true,
          timeUntilLogout: Math.ceil(timeUntilTimeout / 1000) // in seconds
        })

        // Set a timeout to logout when time expires
        if (!logoutTimeoutRef.current) {
          logoutTimeoutRef.current = setTimeout(() => {
            console.log('Session timed out after warning')
            performLogout()
          }, timeUntilTimeout)
        }
      } else {
        setSessionState({
          isActive: true,
          showWarning: false,
          timeUntilLogout: null
        })
      }
    }

    // Start checking for inactivity
    checkIntervalRef.current = setInterval(checkInactivity, checkInterval)

    // Initial check
    checkInactivity()

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current)
      }
    }
  }, [inactivityTimeout, warningTime, checkInterval, performLogout])

  // Track user activity
  useEffect(() => {
    // Only track if we're in a browser environment
    if (typeof window === 'undefined') return

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    // Throttled activity handler to avoid excessive calls
    let throttleTimeout: NodeJS.Timeout | null = null
    const throttledUpdateActivity = () => {
      if (!throttleTimeout) {
        updateActivity()
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null
        }, 1000) // Throttle to once per second
      }
    }

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, throttledUpdateActivity, { passive: true })
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledUpdateActivity)
      })
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
    }
  }, [updateActivity])

  // Track if session has been validated to prevent re-validation on back navigation
  const hasValidatedRef = useRef(false)

  // Validate session on mount (only once)
  useEffect(() => {
    // Skip if already validated (prevents issues with back button navigation)
    if (hasValidatedRef.current) return
    hasValidatedRef.current = true

    const validateSession = async () => {
      try {
        const token = localStorage.getItem('adminSessionToken')
        const isLoggedIn = localStorage.getItem('adminLoggedIn')

        // Only logout if there's genuinely no session
        // Check both token AND logged in flag to be safe
        if (!token && !isLoggedIn) {
          // Double-check we're on an admin page that requires auth
          // Don't logout if we're on the login page itself
          if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
            performLogout()
          }
          return
        }

        // Try to refresh the session if we have a token
        if (token) {
          await refreshSession()
        }
      } catch {
        // Silently ignore validation errors on mount
        // Session will be validated again on next activity
      }
    }

    // Small delay to ensure localStorage is accessible after navigation
    const timeoutId = setTimeout(validateSession, 100)

    return () => clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount

  return {
    ...sessionState,
    extendSession,
    logout: performLogout
  }
}

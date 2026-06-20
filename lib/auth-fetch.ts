/**
 * Authenticated fetch utility for admin API calls
 * Automatically includes JWT token from localStorage in Authorization header
 * Automatically refreshes expired tokens and retries on 401
 * Only logs out on a DEFINITIVE auth rejection — never on transient/network failures
 */

interface AuthFetchOptions extends RequestInit {
  headers?: HeadersInit
  _isRetry?: boolean // internal flag to prevent infinite retry loops
}

// Result of a refresh attempt:
// - { token }        -> got a fresh token, safe to retry
// - { unauthorized } -> server says the session is genuinely invalid/expired -> logout
// - { transient }    -> network error / 5xx / cold start -> DO NOT logout, just fail soft
type RefreshResult =
  | { token: string }
  | { unauthorized: true }
  | { transient: true }

let isLoggingOut = false

// Single-flight guard: collapse concurrent refreshes into ONE request.
// The speakers page fires ~5 authGet calls on mount; without this they would
// each fire /api/auth/refresh in parallel, and a single transient failure among
// them would log the user out even though the token was recoverable.
let refreshPromise: Promise<RefreshResult> | null = null

function forceLogout(reason: string) {
  if (isLoggingOut || typeof window === 'undefined') return
  isLoggingOut = true

  // Visible breadcrumb so we can see exactly what triggered the logout.
  console.warn(`[auth-fetch] Forcing logout — ${reason}`)

  localStorage.removeItem('adminLoggedIn')
  localStorage.removeItem('adminSessionToken')
  localStorage.removeItem('adminUser')

  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})

  window.location.href = '/admin'
}

async function doRefresh(): Promise<RefreshResult> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminSessionToken') : null
    if (!token) return { unauthorized: true }

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
        return { token: data.sessionToken }
      }
      // 200 but no token in body — treat as transient rather than logging out
      return { transient: true }
    }

    // 401/403 => the refresh endpoint says the session is genuinely invalid
    // (token expired beyond the 7-day grace, bad signature, etc.)
    if (response.status === 401 || response.status === 403) {
      return { unauthorized: true }
    }

    // 5xx and anything else => transient server issue, don't punish the user
    return { transient: true }
  } catch {
    // Network error / cold start => transient, never logout
    return { transient: true }
  }
}

function tryRefreshToken(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function authFetch(url: string, options: AuthFetchOptions = {}): Promise<Response> {
  const { _isRetry, ...fetchOptions } = options

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminSessionToken') : null

  // Merge headers with authorization
  const headers = new Headers(fetchOptions.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Make the request with merged headers and credentials (sends httpOnly cookies)
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  })

  // If we get a 401 and this isn't already a retry, try refreshing the token
  if (response.status === 401 && !_isRetry) {
    const hadToken = !!token
    const result = await tryRefreshToken()

    if ('token' in result) {
      // Got a fresh token — retry the original request once
      return authFetch(url, { ...options, _isRetry: true })
    }

    if ('unauthorized' in result) {
      // Refresh was definitively rejected — session is unrecoverable
      forceLogout(`401 on ${url}; refresh rejected (unauthorized). Had localStorage token: ${hadToken}`)
      return response
    }

    // Transient failure (network blip, cold start, 5xx): do NOT logout.
    // Return the original 401 so the caller can fail soft, exactly like the
    // cookie-based admin pages do. The next user activity will retry.
    console.warn(`[auth-fetch] 401 on ${url}; refresh was transient — NOT logging out`)
    return response
  }

  // If this was a retry and STILL got 401, the token is truly invalid — logout
  if (response.status === 401 && _isRetry) {
    forceLogout(`401 on ${url} even after a successful token refresh + retry`)
  }

  return response
}

/**
 * Convenience method for GET requests
 */
export async function authGet(url: string, options: AuthFetchOptions = {}): Promise<Response> {
  return authFetch(url, { ...options, method: 'GET' })
}

/**
 * Convenience method for POST requests
 */
export async function authPost(url: string, body?: any, options: AuthFetchOptions = {}): Promise<Response> {
  return authFetch(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Convenience method for PUT requests
 */
export async function authPut(url: string, body?: any, options: AuthFetchOptions = {}): Promise<Response> {
  return authFetch(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Convenience method for PATCH requests
 */
export async function authPatch(url: string, body?: any, options: AuthFetchOptions = {}): Promise<Response> {
  return authFetch(url, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Convenience method for DELETE requests
 */
export async function authDelete(url: string, options: AuthFetchOptions = {}): Promise<Response> {
  return authFetch(url, { ...options, method: 'DELETE' })
}

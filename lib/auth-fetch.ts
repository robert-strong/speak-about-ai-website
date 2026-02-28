/**
 * Authenticated fetch utility for admin API calls
 * Automatically includes JWT token from localStorage in Authorization header
 * Automatically refreshes expired tokens and retries on 401
 */

interface AuthFetchOptions extends RequestInit {
  headers?: HeadersInit
  _isRetry?: boolean // internal flag to prevent infinite retry loops
}

async function tryRefreshToken(): Promise<string | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminSessionToken') : null
    if (!token) return null

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
        return data.sessionToken
      }
    }
    return null
  } catch {
    return null
  }
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
    const newToken = await tryRefreshToken()
    if (newToken) {
      // Retry the original request with the new token
      return authFetch(url, { ...options, _isRetry: true })
    }
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

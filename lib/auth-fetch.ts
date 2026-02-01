/**
 * Authenticated fetch utility for admin API calls
 * Automatically includes JWT token from localStorage in Authorization header
 */

interface AuthFetchOptions extends RequestInit {
  headers?: HeadersInit
}

export async function authFetch(url: string, options: AuthFetchOptions = {}): Promise<Response> {
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminSessionToken') : null

  // Merge headers with authorization
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Make the request with merged headers
  return fetch(url, {
    ...options,
    headers,
  })
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

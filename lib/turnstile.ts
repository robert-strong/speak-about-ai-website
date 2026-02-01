/**
 * Cloudflare Turnstile verification utility
 *
 * This utility provides server-side verification of Turnstile tokens
 * to protect forms from spam and automated submissions.
 */

export interface TurnstileVerificationResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

/**
 * Verify a Turnstile token with Cloudflare's API
 *
 * @param token The token received from the client-side Turnstile widget
 * @param remoteip Optional IP address of the user for additional validation
 * @returns Promise resolving to verification result
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<{ success: boolean; error?: string }> {

  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured')
    return {
      success: false,
      error: 'Turnstile not configured on server'
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteip) {
      formData.append('remoteip', remoteip)
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    if (!response.ok) {
      console.error('Turnstile API returned non-OK status:', response.status)
      return {
        success: false,
        error: 'Turnstile verification failed'
      }
    }

    const data: TurnstileVerificationResponse = await response.json()

    if (!data.success) {
      console.warn('Turnstile verification failed:', data['error-codes'])
      return {
        success: false,
        error: 'CAPTCHA verification failed. Please try again.'
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Error verifying Turnstile token:', error)
    return {
      success: false,
      error: 'Failed to verify CAPTCHA. Please try again.'
    }
  }
}

/**
 * Get the client IP address from the request
 * Handles various proxy headers
 */
export function getClientIP(request: Request): string | undefined {
  // Try common proxy headers first
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return undefined
}

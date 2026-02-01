import { NextRequest, NextResponse } from 'next/server'
import { createGmailClient } from '@/lib/gmail-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/admin/manage?gmail_error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 })
    }

    const gmailClient = createGmailClient()

    // Exchange code for tokens
    const tokens = await gmailClient.getTokensFromCode(code)

    // Set credentials to get user email
    await gmailClient.setCredentials(tokens.access_token!, tokens.refresh_token)
    const userEmail = await gmailClient.getUserEmail()

    // Save tokens to database
    await gmailClient.saveTokens(userEmail!, tokens)

    // Redirect to admin page with success message
    return NextResponse.redirect(
      new URL(`/admin/manage?gmail_connected=${encodeURIComponent(userEmail!)}`, request.url)
    )
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error)
    return NextResponse.redirect(
      new URL(`/admin/manage?gmail_error=${encodeURIComponent('Authentication failed')}`, request.url)
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createGmailClient } from '@/lib/gmail-client'

export async function GET(request: NextRequest) {
  try {
    const gmailClient = createGmailClient()
    const authUrl = gmailClient.getAuthUrl('gmail-auth')

    // If requesting HTML (from browser), show a nice page
    const acceptHeader = request.headers.get('accept')
    if (acceptHeader?.includes('text/html')) {
      return new NextResponse(
        `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gmail & Calendar Authentication</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 500px;
      text-align: center;
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin: 20px 0;
    }
    .permissions {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: left;
    }
    .permissions h3 {
      margin-top: 0;
      color: #1E68C6;
    }
    .permissions ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .permissions li {
      margin: 8px 0;
      color: #555;
    }
    .btn {
      display: inline-block;
      background: #1E68C6;
      color: white;
      padding: 15px 40px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: background 0.3s;
    }
    .btn:hover {
      background: #155a9c;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Google Authentication</h1>
    <p>Connect your Google account to enable Gmail and Calendar integration for Speak About AI.</p>

    <div class="permissions">
      <h3>Permissions Requested:</h3>
      <ul>
        <li>📧 Read Gmail messages</li>
        <li>📅 Create and manage calendar events</li>
        <li>👤 View your email address</li>
      </ul>
    </div>

    <p style="font-size: 14px; color: #999;">You'll be redirected to Google to grant permissions. Your credentials are stored securely.</p>

    <a href="${authUrl}" class="btn">Connect Google Account</a>
  </div>
</body>
</html>
        `,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      )
    }

    // If requesting JSON (from API), return JSON
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}

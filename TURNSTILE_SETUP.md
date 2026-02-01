# Cloudflare Turnstile CAPTCHA Setup

This document explains how to configure Cloudflare Turnstile for spam protection on the contact form.

## What is Turnstile?

Cloudflare Turnstile is a privacy-friendly CAPTCHA alternative that:
- ✅ **Free** for unlimited requests
- ✅ **Privacy-focused** - no tracking, no cookies
- ✅ **User-friendly** - invisible or minimal interaction
- ✅ **Fast** - ~400ms verification time
- ✅ **Accessible** - works with screen readers

## Setup Instructions

### 1. Get Turnstile API Keys

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile** in the sidebar
3. Click **Add Site**
4. Configure your site:
   - **Site Name**: Speak About AI Contact Form
   - **Domain**: `speakabout.ai`
   - **Widget Mode**: Managed (recommended)
5. Click **Create**
6. Copy your **Site Key** and **Secret Key**

### 2. Add Environment Variables

Add these variables to your `.env.local` file:

```bash
# Cloudflare Turnstile - CAPTCHA Protection
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

**Important Notes:**
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` must start with `NEXT_PUBLIC_` to be accessible in the browser
- `TURNSTILE_SECRET_KEY` is server-side only and should NEVER be exposed to the client
- Never commit these keys to git - they're in `.gitignore`

### 3. Test Modes

Turnstile provides test keys for development:

**Always Passes (For Development):**
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**Always Fails (For Testing Error Handling):**
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000AB
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA
```

**Forces Interactive Challenge:**
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=3x00000000000000000000FF
TURNSTILE_SECRET_KEY=3x0000000000000000000000000000000AA
```

### 4. Verify Installation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/contact`

3. You should see the Turnstile widget above the "Submit Request" button

4. Try submitting the form:
   - Without completing CAPTCHA → Should show error
   - After completing CAPTCHA → Should submit successfully

## How It Works

### Client-Side (Form)

The Turnstile widget is added to [custom-contact-form.tsx](components/custom-contact-form.tsx):

```typescript
<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
  onSuccess={(token) => setTurnstileToken(token)}
  onError={() => setTurnstileToken('')}
  onExpire={() => setTurnstileToken('')}
/>
```

When the user completes the CAPTCHA:
1. Turnstile generates a one-time token
2. Token is stored in component state
3. Token is sent with form submission
4. Submit button is disabled until token is received

### Server-Side (API)

The API route [submit-deal/route.ts](app/api/submit-deal/route.ts) verifies the token:

```typescript
import { verifyTurnstileToken, getClientIP } from '@/lib/turnstile'

// Verify token
const clientIP = getClientIP(request)
const verification = await verifyTurnstileToken(turnstileToken, clientIP)

if (!verification.success) {
  return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 })
}
```

The verification:
1. Sends token to Cloudflare's API
2. Includes client IP for additional validation
3. Returns success/failure
4. Blocks submission if verification fails

## Monitoring & Analytics

View CAPTCHA statistics in [Cloudflare Dashboard](https://dash.cloudflare.com/):
- **Requests**: Total verification attempts
- **Solve Rate**: Percentage of successful verifications
- **Challenge Rate**: How often users see interactive challenges
- **Block Rate**: Percentage of blocked bot attempts

## Troubleshooting

### Widget Not Showing

1. Check environment variable is set:
   ```bash
   echo $NEXT_PUBLIC_TURNSTILE_SITE_KEY
   ```

2. Verify it starts with `NEXT_PUBLIC_`

3. Restart dev server after adding env vars

### Verification Always Fails

1. Check secret key is correct in `.env.local`
2. Verify domain matches in Cloudflare dashboard
3. Check server logs for specific error messages

### "CAPTCHA verification required" Error

- User didn't complete the CAPTCHA before submitting
- Token expired (valid for 5 minutes)
- Network issue prevented token generation

## Security Best Practices

1. **Never expose secret key** - Keep it server-side only
2. **Validate on server** - Never trust client-side verification alone
3. **Use HTTPS** - Required for production use
4. **Monitor solve rates** - Low rates may indicate misconfiguration
5. **Rotate keys** - Change keys if compromised

## Additional Resources

- [Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [React Turnstile Package](https://github.com/marsidev/react-turnstile)
- [Turnstile Best Practices](https://developers.cloudflare.com/turnstile/best-practices/)

## Support

If you encounter issues:
1. Check Cloudflare Dashboard for error logs
2. Review server logs for verification failures
3. Test with development keys first
4. Contact Cloudflare support if needed

# Admin Portal Setup Guide for Production

## ✅ Local Testing Confirmed Working
The admin login works perfectly locally with these credentials:
- Email: `human@speakabout.ai`
- Password: `SpeakAboutAI2025!`

## 🚨 Production Setup Required

### Step 1: Go to Vercel Dashboard
Navigate to: https://vercel.com → Your Project → Settings → Environment Variables

### Step 2: Add These EXACT Environment Variables

**IMPORTANT**: Copy these values EXACTLY as shown, including all characters:

```
ADMIN_EMAIL
```
Value:
```
human@speakabout.ai
```

```
ADMIN_PASSWORD_HASH
```
Value:
```
248368c863030abb985faccf37e7bd87:f10a5bd410ee5f0069f89c2a7da018bc81b23deb03927f5d78a1b9fc45bd72f1dbf3e1d81171ed2232238ca304d75fb459bce216c9e0bc7429fdbf5b91bb9416
```

```
JWT_SECRET
```
Value:
```
2e172fc76b442dbb8732bc0d470af12019197b07594ef00e236c9b8aa0f52e8cc533f4c9b3a84c6ee99ec52a1c592ffa0de3cc8ef578ea364f819034ee7af713
```

### Step 3: Important Notes
1. **DO NOT** include quotes around the values in Vercel
2. **DO NOT** add any extra spaces before or after the values
3. Make sure to select **Production** environment when adding the variables
4. The password hash should be one long string without any line breaks

### Step 4: Redeploy
After adding the environment variables:
1. Go to the Deployments tab
2. Find the latest deployment
3. Click the three dots menu → Redeploy
4. Select "Use existing Build Cache" → Redeploy

### Step 5: Test Login
1. Go to: https://speakabout.ai/admin
2. Enter email: `human@speakabout.ai`
3. Enter password: `SpeakAboutAI2025!`
4. Click Login

## Troubleshooting

### If you see "Authentication service unavailable"
- The `ADMIN_EMAIL` or `ADMIN_PASSWORD_HASH` environment variable is missing in Vercel

### If you see "Authentication service configuration error"  
- The `JWT_SECRET` environment variable is missing in Vercel

### If you see "Invalid credentials"
- Double-check that the email is exactly: `human@speakabout.ai`
- Make sure there are no extra spaces in the environment variables
- The password hash might have been copied incorrectly

### To Verify Environment Variables Are Set
1. In Vercel dashboard, go to Settings → Environment Variables
2. You should see all three variables listed for Production
3. Click the eye icon to view each value and verify it matches above

### Debug Endpoint (Development Only)
Visit: http://localhost:3000/api/debug-auth
This will show if environment variables are properly loaded.

## Alternative: Set Your Own Password

If you want to use a different password:

1. Run locally:
```bash
node scripts/test-admin-login.mjs "YourCustomPassword123"
```

2. Copy the generated hash
3. Update `ADMIN_PASSWORD_HASH` in Vercel with the new hash
4. Redeploy the application

## Security Notes
- The JWT_SECRET should remain secret and never be shared
- Change the admin password regularly
- Consider using a password manager to generate and store strong passwords
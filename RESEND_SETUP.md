# Resend Email Setup Guide

## 1. Install Resend

```bash
npm install resend
```

## 2. Get Your API Key

1. Go to https://resend.com and sign up for an account
2. Navigate to the API Keys section
3. Create a new API key
4. Copy the API key (it starts with `re_`)

## 3. Add to Environment Variables

Add this to your `.env.local` file:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=hello@speakabout.ai
```

## 4. Verify Your Domain

In Resend dashboard:
1. Go to Domains section
2. Add your domain (speakabout.ai)
3. Add the DNS records they provide to your domain provider
4. Wait for verification (usually takes a few minutes)

## 5. Email Templates

The system will use Resend to send:
- New inquiry notifications to admin
- Client confirmation emails
- Client portal invitations
- Project status updates

## DNS Records to Add

Resend will provide records like:
- **MX Record**: For receiving emails
- **TXT Record**: For domain verification (SPF)
- **CNAME Records**: For DKIM authentication

Example:
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all

Type: CNAME
Name: resend._domainkey
Value: [provided by Resend]
```

## Testing

After setup, test with:
```bash
node scripts/test-email.js
```
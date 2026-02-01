# Kondo Integration Setup Guide

This guide explains how to set up the Kondo LinkedIn integration with your admin panel.

## Overview

The Kondo integration allows you to:
- Sync LinkedIn contacts from Kondo to your CRM
- Automatically create/update deals based on contact labels
- View all LinkedIn conversations in your admin panel
- Track contact engagement and conversation status

## Setup Steps

### 1. Create the Database Table

Run the SQL migration in your Neon database:

```bash
# Execute this SQL in Neon console
psql $DATABASE_URL < scripts/create-kondo-contacts-table.sql
```

Or run it directly:
```sql
CREATE TABLE IF NOT EXISTS kondo_contacts (
  id SERIAL PRIMARY KEY,
  kondo_id VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  linkedin_url TEXT,
  linkedin_uid VARCHAR(255),
  headline TEXT,
  location VARCHAR(255),
  picture_url TEXT,
  conversation_status VARCHAR(100),
  conversation_state VARCHAR(100),
  latest_message TEXT,
  latest_message_at TIMESTAMP,
  kondo_url TEXT,
  kondo_note TEXT,
  labels JSONB,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Add Environment Variable

Add your Kondo API key to `.env.local`:

```bash
KONDO_API_KEY=your-secret-api-key-here
```

### 3. Configure Kondo Webhook

In your Kondo dashboard, create a new webhook with these settings:

**Name:** Speak About AI CRM Sync

**Trigger type:** Streaming

**URL:** `https://yourdomain.com/api/webhooks/kondo`

**API Key Header:** `x-api-key`

**API Key Value:** `[same value as KONDO_API_KEY in .env.local]`

### 4. Test the Integration

Click "Test with your latest conversation" in Kondo to send a test webhook.

You should see the contact appear at:
`https://yourdomain.com/admin/kondo`

## How It Works

### Label-to-Deal Mapping

Kondo labels are automatically mapped to deal statuses:

| Kondo Label | Deal Status | Priority |
|------------|-------------|----------|
| SQL | negotiation | - |
| MQL - High | qualified | high |
| MQL - Medium | qualified | medium |
| MQL - Low | qualified | low |
| Disqualified | lost | - |

### Automatic Deal Creation

Deals are automatically created when contacts have these labels:
- SQL
- MQL - High
- MQL - Medium
- MQL - Low
- Client

### Deal Updates

If a deal already exists for a contact, it will be updated with:
- Latest conversation status
- Updated priority based on labels
- Latest message appended to notes
- Last contact timestamp

## Accessing Kondo Data

### Admin Panel
View all LinkedIn contacts at: `/admin/kondo`

Features:
- Contact list with avatars and LinkedIn profiles
- Conversation status and latest messages
- Labels and lead qualification
- Direct links to Kondo and LinkedIn
- Quick stats (Total, SQL, MQL, Clients)

### API Endpoint
Fetch contacts programmatically:
```bash
GET /api/kondo/contacts
```

## Webhook Payload Structure

```json
{
  "event": {
    "email": "contact@example.com",
    "type": "general-update-test"
  },
  "data": {
    "contact_first_name": "John",
    "contact_last_name": "Doe",
    "contact_linkedin_url": "https://linkedin.com/in/...",
    "contact_headline": "CEO at Company",
    "conversation_status": "waiting_for_their_reply",
    "conversation_latest_content": "Latest message...",
    "kondo_labels": [
      {
        "kondo_label_id": "...",
        "kondo_label_name": "SQL"
      }
    ]
  }
}
```

## Troubleshooting

### Contacts Not Syncing
1. Check that `KONDO_API_KEY` is set in `.env.local`
2. Verify the webhook URL is correct in Kondo
3. Check API logs for errors

### Deals Not Creating
1. Ensure contact has a qualifying label (SQL, MQL, Client)
2. Check that deals table exists in database
3. Verify contact email is valid

### Database Connection Issues
1. Verify `DATABASE_URL` is correct in `.env.local`
2. Check Neon connection is active
3. Run the table creation SQL again

## Support

For issues or questions:
- Check the webhook logs in Kondo
- View server logs for API errors
- Contact support with webhook payload examples

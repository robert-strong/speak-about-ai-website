# Contentful + Outrank Integration Setup

## Overview
This integration allows Outrank to automatically publish blog posts to your Contentful CMS through a webhook endpoint.

## Prerequisites

1. **Contentful Space**: You need an existing Contentful space with a `blogPost` content type
2. **Contentful Management Token**: Required to create and update entries
3. **Outrank Account**: With webhook capabilities

## Setup Steps

### 1. Get Your Contentful Management Token

1. Log in to [Contentful](https://app.contentful.com)
2. Go to Settings → API keys
3. Click on "Content management tokens" tab
4. Click "Generate personal token"
5. Give it a name (e.g., "Outrank Integration")
6. Copy the token immediately (it won't be shown again)

### 2. Add Environment Variables

Add these to your `.env.local` file:

```bash
# Existing Contentful variables
CONTENTFUL_SPACE_ID="your_space_id"
CONTENTFUL_ACCESS_TOKEN="your_delivery_token"

# New required variables
CONTENTFUL_MANAGEMENT_TOKEN="your_management_token_here"
OUTRANK_WEBHOOK_SECRET="your_secure_webhook_secret"
```

### 3. Contentful Content Model

Ensure your `blogPost` content type has these fields:

- `title` (Text, required)
- `slug` (Text, required, unique)
- `content` (Rich Text, required)
- `excerpt` (Text)
- `publishedDate` (Date & time)
- `featured` (Boolean)
- `outrank_id` (Text, unique) - Add this field to track Outrank articles

### 4. Configure Outrank

1. In Outrank, go to your webhook settings
2. Set the webhook URL to: `https://your-domain.com/api/outrank-webhook`
3. Set the authentication to Bearer token
4. Use the value from `OUTRANK_WEBHOOK_SECRET` as the token

### 5. Test the Integration

Use the test webhook feature in the admin panel:
1. Go to `/admin/blog`
2. Click on "Outrank Integration" tab
3. Enter your webhook secret
4. Click "Test Webhook"

## How It Works

1. **Outrank sends webhook** with article data
2. **Webhook validates** the Bearer token authentication
3. **Article is validated** for required fields
4. **Content is converted** from HTML/Markdown to Contentful Rich Text
5. **Entry is created/updated** in Contentful
6. **Entry is published** automatically

## Features

- **Duplicate Prevention**: Uses slug to check for existing articles
- **Auto-publish**: Articles are automatically published after creation
- **Error Handling**: Detailed error logging and response
- **Validation**: Ensures all required fields are present
- **Format Conversion**: Converts HTML and Markdown to Rich Text

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your `OUTRANK_WEBHOOK_SECRET` matches in both Outrank and your app
2. **500 Contentful error**: Verify your `CONTENTFUL_MANAGEMENT_TOKEN` is valid
3. **Content type not found**: Ensure `blogPost` content type exists in Contentful
4. **Field errors**: Check that all required fields exist in your content model

### Testing Locally

You can test the webhook locally using curl:

```bash
curl -X POST http://localhost:3001/api/outrank-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "event_type": "publish_articles",
    "timestamp": "2024-01-01T12:00:00Z",
    "data": {
      "articles": [{
        "id": "test-123",
        "title": "Test Article",
        "slug": "test-article",
        "content_markdown": "# Test\n\nThis is a test article.",
        "content_html": "<h1>Test</h1><p>This is a test article.</p>",
        "meta_description": "Test article description",
        "created_at": "2024-01-01T12:00:00Z"
      }]
    }
  }'
```

## Security Notes

- Always use HTTPS in production
- Keep your Management Token secure
- Rotate tokens regularly
- Monitor webhook logs for suspicious activity
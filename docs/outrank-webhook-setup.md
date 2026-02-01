# Outrank Webhook Setup Guide

## Overview
This webhook endpoint receives article data from Outrank and stores it in a Neon PostgreSQL database.

## Setup Instructions

### 1. Database Setup

First, run the migration to create the `blog_posts` table:

```bash
# Connect to your Neon database
psql $DATABASE_URL

# Run the migration
\i migrations/001_create_blog_posts_table.sql
```

Or run directly:
```bash
psql $DATABASE_URL < migrations/001_create_blog_posts_table.sql
```

### 2. Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your values:
```env
# Your Neon database URL
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require

# Generate a secure token
OUTRANK_WEBHOOK_SECRET=your-secure-token-here
```

3. Generate a secure webhook token:
```bash
openssl rand -base64 32
```

### 3. Configure Outrank

In your Outrank dashboard:

1. Navigate to Settings > Webhooks
2. Add a new webhook with:
   - **URL**: `https://your-domain.com/api/outrank-webhook`
   - **Method**: `POST`
   - **Headers**: 
     - `Authorization: Bearer your-secure-token-here`
     - `Content-Type: application/json`
   - **Events**: Select "Article Published"

### 4. Test the Webhook

#### Test locally with curl:

```bash
# Test endpoint health
curl http://localhost:3001/api/outrank-webhook

# Test with sample payload
curl -X POST http://localhost:3001/api/outrank-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-token-here" \
  -d '{
    "event_type": "publish_articles",
    "timestamp": "2025-10-05T11:28:24.117Z",
    "data": {
      "articles": [{
        "id": "test-article-123",
        "title": "Test Article",
        "content_html": "<h1>Test Content</h1><p>This is a test article.</p>",
        "content_markdown": "# Test Content\n\nThis is a test article.",
        "meta_description": "Test meta description",
        "created_at": "2025-10-05T11:28:24.117Z",
        "image_url": "https://example.com/image.png",
        "slug": "test-article",
        "tags": ["test", "webhook"]
      }]
    }
  }'
```

#### Test webhook validation:

```bash
# Test unauthorized request (should return 401)
curl -X POST http://localhost:3001/api/outrank-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test invalid token (should return 401)
curl -X POST http://localhost:3001/api/outrank-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong-token" \
  -d '{"test": "data"}'

# Test malformed JSON (should return 400)
curl -X POST http://localhost:3001/api/outrank-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-token-here" \
  -d 'malformed json'
```

### 5. Monitor Logs

The webhook logs detailed information for debugging:

- `[Outrank Webhook] Received POST request` - Initial request received
- `[Outrank Webhook] Successfully inserted article: [slug]` - Article saved
- `[Outrank Webhook] Updated existing article: [slug]` - Duplicate updated
- `[Outrank Webhook] Error processing article` - Processing failed

Check Next.js console output during development or your production logging service.

### 6. Database Queries

Useful queries for managing blog posts:

```sql
-- View all articles
SELECT id, title, slug, status, published_date 
FROM blog_posts 
ORDER BY published_date DESC;

-- View articles with specific tag
SELECT * FROM blog_posts 
WHERE tags @> '["ai"]'::jsonb;

-- Get published articles
SELECT * FROM blog_posts 
WHERE status = 'published' 
ORDER BY published_date DESC;

-- Check for duplicates
SELECT slug, COUNT(*) 
FROM blog_posts 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Delete test articles
DELETE FROM blog_posts 
WHERE slug LIKE 'test-%';
```

## API Response Format

### Success Response (200/207)
```json
{
  "message": "Processed 2 of 3 articles",
  "results": {
    "inserted": 1,
    "updated": 1,
    "failed": 1,
    "details": {
      "successful": ["article-slug-1"],
      "duplicates": ["article-slug-2"],
      "failed": [
        {
          "slug": "article-slug-3",
          "error": "Missing required field: title"
        }
      ]
    }
  }
}
```

### Error Responses

- **401 Unauthorized**: Missing or invalid authorization token
- **400 Bad Request**: Invalid JSON or missing required fields
- **500 Internal Server Error**: Database or server error

## Security Considerations

1. **Token Security**: 
   - Never commit the webhook secret to version control
   - Rotate tokens periodically
   - Use strong, random tokens (32+ characters)

2. **Database Security**:
   - Use parameterized queries (already implemented)
   - Validate all input data
   - Use connection pooling in production

3. **Rate Limiting**: 
   - Consider implementing rate limiting for production
   - Monitor for unusual webhook activity

## Troubleshooting

### Common Issues

1. **"Webhook not configured properly"**
   - Ensure `OUTRANK_WEBHOOK_SECRET` is set in `.env.local`

2. **"Database connection not configured"**
   - Verify `DATABASE_URL` is correct
   - Check Neon dashboard for connection issues

3. **Duplicate key errors**
   - The webhook handles duplicates by updating existing articles
   - Check for unique constraint violations on slug

4. **JSON parsing errors**
   - Ensure Outrank is sending valid JSON
   - Check Content-Type header is `application/json`

## Production Deployment

1. Set environment variables in your hosting platform (Vercel, etc.)
2. Ensure database migrations are run
3. Test webhook endpoint with production URL
4. Monitor logs for errors
5. Set up alerts for webhook failures

## Support

For issues or questions:
- Check webhook logs in console
- Verify database connectivity
- Test with curl commands above
- Review Outrank webhook documentation
# SEO Indexing Checklist for speakabout.ai

## Immediate Actions Required:

### 1. Submit to Google Search Console
- Go to https://search.google.com/search-console
- Add property for `https://www.speakabout.ai`
- Verify ownership (HTML file, DNS, or meta tag)
- Submit sitemap: `https://www.speakabout.ai/sitemap.xml`
- Use "Request Indexing" for homepage

### 2. Check for Rendering Issues
Visit: https://search.google.com/test/mobile-friendly
- Test your homepage URL
- Check if Google can render your JavaScript properly

### 3. Verify DNS and SSL
- Ensure www and non-www versions redirect properly
- Check SSL certificate is valid
- Test with: https://www.ssllabs.com/ssltest/

### 4. Check for Manual Actions
In Google Search Console:
- Security & Manual Actions → Manual actions
- Look for any penalties

### 5. Test Your Sitemap
- Visit https://www.speakabout.ai/sitemap.xml
- Ensure it loads correctly
- Submit it in Search Console under Sitemaps

### 6. Speed and Core Web Vitals
- Test with https://pagespeed.web.dev/
- Poor performance can delay indexing
- Focus on LCP, FID, and CLS metrics

### 7. Internal Linking
- Ensure homepage has internal links from other pages
- Add breadcrumbs if not present

### 8. Build Initial Authority
- Submit to Bing Webmaster Tools
- Create Google My Business listing
- Get listed in relevant directories
- Share on social media platforms

## Technical Fixes to Implement:

### Add JSON-LD to homepage layout
The schema.org data is defined but not rendered. Add this to your homepage:
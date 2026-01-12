# Testing Social Sharing Metadata

This guide explains how to test and debug social sharing previews (Open Graph and Twitter Cards) for brief URLs.

## Quick Start

### 1. Environment Setup

Ensure you have set the required environment variables in your `.env.local` file:

```bash
# CRITICAL: Required for social sharing to work correctly
NEXT_PUBLIC_BASE_URL=https://stateofclarity.org

# Required for fetching brief data
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:** `NEXT_PUBLIC_BASE_URL` must be set to your production domain for social sharing images to load correctly on platforms like WhatsApp, Facebook, and Twitter.

### 2. Test Metadata Locally

Visit the metadata test page in your browser:

```
http://localhost:3000/test/metadata/[brief-id]
```

For example:
- `http://localhost:3000/test/metadata/uk-four-day-week`
- `http://localhost:3000/test/metadata/your-brief-uuid-here`

This page will show you:
- ✅ All Open Graph tags that will be generated
- ✅ Twitter Card tags
- ✅ Preview of the OG image
- ✅ Any warnings or errors
- ✅ Links to test in social media validators

### 3. Test the Metadata API Directly

You can also test the metadata generation via API:

```bash
curl http://localhost:3000/api/brief-metadata/[brief-id] | jq
```

This returns a JSON response with all metadata that would be generated for that brief.

## Social Media Validation Tools

Once your site is deployed, use these tools to test how your briefs will appear when shared:

### Facebook Sharing Debugger
**URL:** https://developers.facebook.com/tools/debug/

- Enter your brief URL (e.g., `https://stateofclarity.org/brief/uk-four-day-week`)
- Click "Debug" to see what Facebook sees
- Use "Scrape Again" if you've made changes and need to clear Facebook's cache
- **Note:** Facebook caches aggressively - changes can take a few hours to propagate even after scraping

### Twitter Card Validator
**URL:** https://cards-dev.twitter.com/validator

- Enter your brief URL
- Preview how the card will appear on Twitter
- Check for any validation errors or warnings
- Twitter typically updates faster than Facebook (within minutes)

### LinkedIn Post Inspector
**URL:** https://www.linkedin.com/post-inspector/

- Enter your brief URL
- See how LinkedIn will display your link
- Use "Inspect" to force LinkedIn to re-fetch metadata
- LinkedIn caches for about 7 days

### WhatsApp Link Preview

WhatsApp doesn't have a public validator, but you can test by:
1. Opening WhatsApp (mobile or web)
2. Creating a message to yourself or a test contact
3. Paste the brief URL
4. WhatsApp should show a preview card with your image and text

**Important:** WhatsApp caches very aggressively. If you don't see updates:
- Clear WhatsApp cache (on mobile: Settings > Storage > Clear Cache)
- Wait 24-48 hours for WhatsApp's cache to expire
- Use a different brief ID/URL for testing

## Common Issues and Solutions

### Issue: Blank preview on WhatsApp/iMessage

**Causes:**
- `NEXT_PUBLIC_BASE_URL` not set or incorrect
- OG image URL not accessible
- Brief not found in database
- Supabase credentials incorrect

**Solutions:**
1. Check server logs for metadata generation errors
2. Visit `/test/metadata/[id]` to debug locally
3. Verify environment variables are set correctly
4. Check that the brief exists in the database
5. Test the OG image URL directly in your browser

### Issue: Shows old/cached preview

**Causes:**
- Social media platforms cache metadata aggressively
- Previous version of the page was scraped

**Solutions:**
1. Use "Scrape Again" in Facebook Sharing Debugger
2. Use "Inspect" in LinkedIn Post Inspector
3. For Twitter, clear the validator and re-submit
4. For WhatsApp, clear cache or wait 24-48 hours
5. Test with a different brief URL/ID to bypass cache

### Issue: OG image not loading

**Causes:**
- Base URL is incorrect
- `/api/og` endpoint is failing
- URL encoding issues with special characters

**Solutions:**
1. Test the OG image URL directly: `https://your-domain.com/api/og?title=Test&description=Test&score=8`
2. Check server logs for errors in the OG image generation
3. Verify the brief's title doesn't have special characters that break URL encoding
4. Use the metadata test page to see the generated OG image URL

### Issue: Generic metadata shown instead of brief-specific

**Causes:**
- Brief ID not found in database
- Metadata generation failing silently
- Using fallback metadata

**Solutions:**
1. Check server logs for error messages
2. Verify the brief exists: `curl http://localhost:3000/api/briefs/[id]`
3. Check Supabase credentials are correct
4. Use the metadata debug endpoint to see detailed error info

## Understanding Metadata Generation

### Server-Side Rendering (SSR)

The brief metadata is generated **server-side** in `app/brief/[id]/layout.tsx`:

1. Next.js calls `generateMetadata()` on the server
2. The function fetches brief data from Supabase using `getBriefById()`
3. Metadata (title, description, OG tags) is injected into the HTML `<head>`
4. Social media crawlers see the metadata in the initial HTML response

This means:
- ✅ Metadata is available immediately when the page loads
- ✅ No JavaScript required for social media crawlers
- ✅ Works for both sample briefs and database briefs
- ⚠️ Errors in data fetching result in fallback metadata

### OG Image Generation

The Open Graph image is generated dynamically at `/api/og`:

1. Layout generates a URL like: `/api/og?title=Brief+Title&description=Summary&score=8.5`
2. Social media platforms fetch this URL
3. The edge function renders an image with:
   - Brief title
   - Summary excerpt
   - Clarity score badge
   - State of Clarity branding
4. Returns a 1200x630px PNG image

## Debugging Checklist

When social sharing isn't working, follow this checklist:

- [ ] `NEXT_PUBLIC_BASE_URL` is set correctly in production
- [ ] Brief exists in database (test with `/api/briefs/[id]`)
- [ ] Metadata debug endpoint works (`/api/brief-metadata/[id]`)
- [ ] OG image endpoint works (`/api/og?title=Test&description=Test&score=8`)
- [ ] Server logs show no errors when accessing the brief page
- [ ] Social media validators show the correct metadata
- [ ] Tried clearing social media cache (Scrape Again, Inspect, etc.)
- [ ] Tested with a fresh brief URL (not previously cached)

## Testing in Production

After deploying:

1. **Verify environment variables** are set in Vercel/your hosting provider
2. **Test a brief URL** in the metadata test page: `https://your-domain.com/test/metadata/[id]`
3. **Run through validators** (Facebook, Twitter, LinkedIn)
4. **Share in WhatsApp** to verify mobile preview works
5. **Check OG image** loads correctly: view the OG image URL in your browser

## Additional Resources

- [Open Graph Protocol](https://ogp.me/) - Official OG tag specification
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards) - Twitter's card format guide
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) - Next.js metadata API documentation
- [WhatsApp Link Preview](https://faq.whatsapp.com/539178204411980) - How WhatsApp generates previews

## Support

If you're still experiencing issues:

1. Check the server logs for detailed error messages
2. Use the `/test/metadata/[id]` page to debug locally
3. Verify all environment variables are set correctly
4. Test the OG image URL directly in your browser
5. Try with a different brief ID to rule out data issues

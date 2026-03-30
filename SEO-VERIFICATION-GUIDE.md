# SEO Verification Codes Guide (Optional)

## Are Verification Codes Required?

**No, these are OPTIONAL.** Your site will work fine without them. However, if you want to:

- Verify site ownership with Google Search Console
- Track SEO performance
- Submit sitemaps
- Get search analytics

Then you should add them.

## How to Get Verification Codes

### 1. Google Search Console Verification

1. Go to: https://search.google.com/search-console
2. Add your property (website URL)
3. Choose "HTML tag" verification method
4. Copy the `content` value from the meta tag
   - Example: `<meta name="google-site-verification" content="abc123xyz789" />`
   - Copy only: `abc123xyz789`
5. Add to `.env`:
   ```env
   NEXT_PUBLIC_GOOGLE_VERIFICATION=abc123xyz789
   ```

### 2. Yandex Webmaster (Optional - for Russian market)

1. Go to: https://webmaster.yandex.com/
2. Add your site
3. Choose HTML tag verification
4. Copy the verification code
5. Add to `.env`:
   ```env
   NEXT_PUBLIC_YANDEX_VERIFICATION=your-yandex-code
   ```

### 3. Yahoo Search (Optional)

1. Go to: https://search.yahoo.com/
2. Follow their verification process
3. Add to `.env`:
   ```env
   NEXT_PUBLIC_YAHOO_VERIFICATION=your-yahoo-code
   ```

## Adding to .env File

Create or update your `.env` or `.env.local` file:

```env
# Required
NEXT_PUBLIC_BASE_URL=https://www.betheven.com

# Optional - Only add if you want to verify with these search engines
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-code-here
NEXT_PUBLIC_YANDEX_VERIFICATION=your-yandex-code-here
NEXT_PUBLIC_YAHOO_VERIFICATION=your-yahoo-code-here
```

## What Happens Without Verification Codes?

- ✅ Site works normally
- ✅ SEO still works
- ✅ Sitemap still works
- ❌ Can't verify site ownership in Search Console
- ❌ Can't see search analytics
- ❌ Can't submit sitemaps manually

## Recommendation

**For production, you should at least add Google Search Console verification** to:

- Monitor your SEO performance
- See which keywords bring traffic
- Fix indexing issues
- Submit sitemaps
- Get search analytics

## After Adding Codes

1. Restart your development server
2. Check page source - you should see verification meta tags in `<head>`
3. Go back to Search Console and click "Verify"
4. Once verified, you can submit your sitemap at: `/sitemap.xml`

## Current Implementation

The verification codes are automatically added to all pages via the metadata in `src/lib/seo.ts`. They appear as:

```html
<meta name="google-site-verification" content="YOUR_CODE" />
<meta name="yandex-verification" content="YOUR_CODE" />
<meta name="yahoo-site-verification" content="YOUR_CODE" />
```

These are only added if the environment variables are set, so it's safe to leave them empty.

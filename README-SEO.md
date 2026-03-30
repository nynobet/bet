# SEO Setup for BetHeven

## Overview

This document describes the SEO implementation for the BetHeven application.

## Files Created

### 1. **Sitemap** (`src/app/sitemap.ts`)

- Automatically generates sitemap.xml
- Includes all public routes
- Includes dynamic casino game routes (up to 1000 games)
- Accessible at: `/sitemap.xml`

### 2. **Robots.txt** (`src/app/robots.ts`)

- Automatically generates robots.txt
- Blocks private routes (dashboard, agent, API, etc.)
- Allows public routes
- Points to sitemap
- Accessible at: `/robots.txt`

### 3. **SEO Utility** (`src/lib/seo.ts`)

- `generateMetadata()` - Creates comprehensive metadata
- `generateStructuredData()` - Creates JSON-LD structured data
- Supports Open Graph, Twitter Cards, and Schema.org

### 4. **Metadata Added to Pages**

- **Root Layout** (`src/app/layout.tsx`) - Default site metadata
- **Home Page** (`src/app/(web)/(home)/page.tsx`) - Homepage metadata + structured data
- **Casino Page** (`src/app/(web)/casino/page.tsx`) - Casino games metadata
- **Privacy Page** (`src/app/(web)/(trm_con)/privacy/page.tsx`) - Privacy policy metadata
- **Terms Page** (`src/app/(web)/(trm_con)/terms/page.tsx`) - Terms & conditions metadata
- **Offers Page** (`src/app/(web)/offers/layout.tsx`) - Promotions metadata

## Environment Variables

Add these to your `.env` file:

```env
NEXT_PUBLIC_BASE_URL=https://www.betheven.com
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_YANDEX_VERIFICATION=your-yandex-verification-code
NEXT_PUBLIC_YAHOO_VERIFICATION=your-yahoo-verification-code
```

## Features

### ✅ Sitemap

- Dynamic generation
- Includes static routes
- Includes casino games (limited to 1000 for performance)
- Proper priority and change frequency

### ✅ Robots.txt

- Blocks private/admin routes
- Allows public routes
- Search engine specific rules
- Sitemap reference

### ✅ Metadata

- Title and description
- Keywords
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Language alternates (en/bn)
- Search engine verification

### ✅ Structured Data (JSON-LD)

- Organization schema
- WebSite schema
- WebPage schema
- Product schema (for games)

## SEO Best Practices Implemented

1. **Meta Tags**: Complete meta tag implementation
2. **Open Graph**: Social media sharing optimization
3. **Twitter Cards**: Twitter sharing optimization
4. **Structured Data**: Schema.org markup for better search understanding
5. **Canonical URLs**: Prevents duplicate content issues
6. **Language Alternates**: Supports multi-language SEO
7. **Robots Control**: Proper crawling directives
8. **Sitemap**: Easy discovery of all pages

## Testing

### Check Sitemap

Visit: `https://www.betheven.com/sitemap.xml`

### Check Robots.txt

Visit: `https://www.betheven.com/robots.txt`

### Validate Structured Data

Use Google's Rich Results Test: https://search.google.com/test/rich-results

### Check Metadata

- View page source
- Check `<head>` section for meta tags
- Verify Open Graph tags
- Check for JSON-LD structured data

## Next Steps

1. Add OG image at `/public/images/og-image.jpg` (1200x630px)
2. Add logo at `/public/images/logo.png`
3. Set environment variables
4. Submit sitemap to Google Search Console
5. Submit sitemap to Bing Webmaster Tools
6. Monitor SEO performance in analytics

## Notes

- Sitemap limits games to 1000 for performance. Adjust in `sitemap.ts` if needed.
- Private routes are blocked in robots.txt. Update if needed.
- All metadata is translatable via next-intl.
- Structured data can be extended for specific game pages.

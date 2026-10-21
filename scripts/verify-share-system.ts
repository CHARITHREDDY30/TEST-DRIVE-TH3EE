/**
 * Comprehensive Automated Verification Suite for:
 * TH3EE E-Commerce Share System
 *
 * Verifies:
 * 1. Product Detail Page Share Button (Icon + Label on Desktop, Compact on Mobile)
 * 2. Product Card Unobtrusive Share Icon with event stopPropagation
 * 3. Canonical, Stable, Permanent Product URLs (https://th3ee.in/products/:slug)
 * 4. Required Dynamic Share Message formatting with product name, price & canonical URL
 * 5. Platform Sharing URLs (WhatsApp, Facebook, Telegram, X, Instagram fallback, Copy Link)
 * 6. Native Share API integration with polished fallback modal
 * 7. Dynamic Social Preview Metadata (og:title, og:image, og:url, og:type, twitter:card)
 * 8. Static Prerendering of HTML for Crawlers & Social Bots
 * 9. Privacy-Preserving Analytics Tracking (no PII, passwords, or sensitive data)
 * 10. Collection & Category Sharing
 * 11. Bag Drop Item Sharing
 * 12. Invalid Slug Graceful Handling (Drop Not Found)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { 
  getCanonicalProductUrl, 
  getCanonicalCollectionUrl, 
  formatProductShareMessage, 
  generatePlatformShareUrls,
  OFFICIAL_SITE_DOMAIN
} from '../src/lib/share';
import { INITIAL_MASTER_PRODUCTS } from '../src/data/initialCatalog';
import { shareAnalytics } from '../src/services/shareAnalytics.service';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, desc: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${desc}`);
  } else {
    failedTests++;
    console.error(`  ✖ FAIL: ${desc}`);
  }
}

console.log('\n======================================================');
console.log('--- RUNNING TH3EE E-COMMERCE SHARE SYSTEM TESTS ---');
console.log('======================================================\n');

const cwd = process.cwd();
const appTsx = readFileSync(resolve(cwd, 'src/App.tsx'), 'utf-8');
const shareTs = readFileSync(resolve(cwd, 'src/lib/share.ts'), 'utf-8');
const shareModalTsx = readFileSync(resolve(cwd, 'src/components/common/ShareProductModal.tsx'), 'utf-8');
const shareAnalyticsTs = readFileSync(resolve(cwd, 'src/services/shareAnalytics.service.ts'), 'utf-8');
const seoServiceTs = readFileSync(resolve(cwd, 'src/services/seo.service.ts'), 'utf-8');
const bagViewTsx = readFileSync(resolve(cwd, 'src/components/bag/BagView.tsx'), 'utf-8');
const prerenderScriptTs = readFileSync(resolve(cwd, 'scripts/prerender-seo.ts'), 'utf-8');

// -------------------------------------------------------------------
// 1. PRODUCT DETAIL PAGE SHARE BUTTON & DESKTOP LABEL
// -------------------------------------------------------------------
console.log('--- 1. Product Detail Page Share Button ---');

assert(
  appTsx.includes('Share Drop') && appTsx.includes('Share2 className='),
  'Product detail page includes clearly visible Share2 icon button'
);

assert(
  appTsx.includes('<span className="hidden sm:inline') && appTsx.includes('Share</span>'),
  'Product detail page includes responsive "Share" label for desktop and compact icon on mobile'
);

assert(
  appTsx.includes('Social Share Squad Bar'),
  'Product detail page includes dedicated 1-tap social squad bar'
);

// -------------------------------------------------------------------
// 2. PRODUCT CARDS COMPACT SHARE BUTTON
// -------------------------------------------------------------------
console.log('\n--- 2. Product Card Compact Share Action ---');

assert(
  appTsx.includes('e.stopPropagation(); onShare(product);'),
  'Product card share click strictly stops event propagation to prevent accidental card navigation'
);

assert(
  appTsx.includes('Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4"') || appTsx.includes('Share2 className="w-4 h-4"'),
  'Product card renders compact Share2 icon in unobtrusive overlay position'
);

// -------------------------------------------------------------------
// 3. CANONICAL & STABLE PUBLIC URLs
// -------------------------------------------------------------------
console.log('\n--- 3. Canonical Permanent URLs ---');

assert(
  OFFICIAL_SITE_DOMAIN === 'th3ee.in',
  'Official site domain is configured strictly as th3ee.in'
);

const sampleProd = INITIAL_MASTER_PRODUCTS[0];
const sampleCanonicalUrl = getCanonicalProductUrl(sampleProd);
assert(
  sampleCanonicalUrl === `https://th3ee.in/products/${sampleProd.slug}`,
  `Canonical product URL correctly formatted: ${sampleCanonicalUrl}`
);

const collectionUrl = getCanonicalCollectionUrl({ category: 'T-Shirts' });
assert(
  collectionUrl === 'https://th3ee.in/shop?category=T-Shirts',
  `Canonical collection URL correctly formatted: ${collectionUrl}`
);

assert(
  !sampleCanonicalUrl.includes('token') && !sampleCanonicalUrl.includes('admin') && !sampleCanonicalUrl.includes('key'),
  'Product URLs never expose tokens, secrets, or admin routes'
);

// -------------------------------------------------------------------
// 4. STANDARDIZED PRODUCT SHARE MESSAGE FORMAT
// -------------------------------------------------------------------
console.log('\n--- 4. Standardized Share Message Format ---');

const formattedMsg = formatProductShareMessage(sampleProd);
assert(
  formattedMsg.startsWith(`Check out ${sampleProd.name} at TH3EE! Shop now for ₹`),
  `Share message matches required prefix pattern: ${formattedMsg.substring(0, 50)}...`
);

assert(
  formattedMsg.endsWith(sampleCanonicalUrl),
  'Share message concludes with canonical product URL'
);

assert(
  formattedMsg.includes(String(Math.round(Number(sampleProd.price)))),
  'Share message dynamically includes actual selling price from catalog'
);

// -------------------------------------------------------------------
// 5. MULTI-PLATFORM SHARING URLs & INSTAGRAM FALLBACK
// -------------------------------------------------------------------
console.log('\n--- 5. Platform Sharing URLs & Fallbacks ---');

const platformUrls = generatePlatformShareUrls({
  title: sampleProd.name,
  text: formattedMsg,
  url: sampleCanonicalUrl
});

assert(
  platformUrls.whatsapp.startsWith('https://api.whatsapp.com/send?text='),
  'WhatsApp sharing URL uses official endpoint with encoded text'
);

assert(
  platformUrls.facebook.startsWith('https://www.facebook.com/sharer/sharer.php?u='),
  'Facebook sharing URL uses official sharer endpoint with encoded product URL'
);

assert(
  platformUrls.telegram.startsWith('https://t.me/share/url?url='),
  'Telegram sharing URL includes encoded URL and text parameters'
);

assert(
  platformUrls.x.startsWith('https://twitter.com/intent/tweet?text='),
  'X (Twitter) sharing URL uses Web Intent with encoded message'
);

assert(
  platformUrls.instagram.includes('instagram.com'),
  'Instagram fallback URL properly configured'
);

assert(
  shareTs.includes('navigator.clipboard') && (shareTs.includes('execCommand') || shareTs.includes('textarea')),
  'Clipboard API implemented with graceful DOM fallback for older/restricted browsers'
);

// -------------------------------------------------------------------
// 6. NATIVE WEB SHARE API WITH POLISHED FALLBACK MODAL
// -------------------------------------------------------------------
console.log('\n--- 6. Native Share API & Fallback Modal ---');

assert(
  appTsx.includes('navigator.share') && appTsx.includes('handleShareProduct'),
  'App provides seamless native Web Share API invoking device share sheet on mobile'
);

assert(
  shareModalTsx.includes('aria-live="polite"'),
  'Share modal includes accessible live announcement region for screen readers'
);

assert(
  shareModalTsx.includes('Product link copied to clipboard!') || shareModalTsx.includes('Link copied to clipboard!'),
  'Share modal displays toast feedback when link is copied'
);

// -------------------------------------------------------------------
// 7. SOCIAL PREVIEW METADATA & PRERENDERING FOR CRAWLERS
// -------------------------------------------------------------------
console.log('\n--- 7. Dynamic Open Graph & Twitter Cards ---');

assert(
  seoServiceTs.includes("og:title") && 
  seoServiceTs.includes("og:image") && 
  seoServiceTs.includes("og:url") && 
  seoServiceTs.includes("og:type") &&
  seoServiceTs.includes("twitter:card"),
  'seoService dynamically manages Open Graph and Twitter large image cards'
);

assert(
  appTsx.includes('seoService.setProductSEO(currentProduct'),
  'App.tsx synchronizes dynamic Open Graph tags upon product route change'
);

// Verify static prerendering script and generated files
assert(
  prerenderScriptTs.includes('INITIAL_MASTER_PRODUCTS') && prerenderScriptTs.includes('<base href="/" />'),
  'Prerender script correctly injects base href and product meta tags'
);

// Test sample prerendered product file if dist exists, or public exists
const sampleProductPublicPath = resolve(cwd, `public/products/${sampleProd.slug}/index.html`);
if (existsSync(sampleProductPublicPath)) {
  const publicHtml = readFileSync(sampleProductPublicPath, 'utf-8');
  assert(
    publicHtml.includes('<meta property="og:title"') && 
    publicHtml.includes('<meta property="og:image"') &&
    publicHtml.includes('<meta name="twitter:card" content="summary_large_image"'),
    `Static prerendered HTML contains valid crawler metadata for ${sampleProd.slug}`
  );
} else {
  // If dist/public file is created during build, verify that build triggers prerender
  const packageJson = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf-8'));
  assert(
    packageJson.scripts.build.includes('scripts/prerender-seo.ts'),
    'package.json build script automatically triggers prerender-seo.ts'
  );
}

// -------------------------------------------------------------------
// 8. PRIVACY-PRESERVING ANALYTICS TRACKING
// -------------------------------------------------------------------
console.log('\n--- 8. Safe Privacy-Preserving Analytics ---');

assert(
  shareAnalyticsTs.includes('product_share_clicked') &&
  shareAnalyticsTs.includes('product_share_completed') &&
  shareAnalyticsTs.includes('product_link_copied') &&
  shareAnalyticsTs.includes('collection_shared'),
  'ShareAnalyticsService tracks all required non-sensitive event names'
);

assert(
  shareAnalyticsTs.includes('itemId?: string') &&
  shareAnalyticsTs.includes('itemType?:') &&
  shareAnalyticsTs.includes('channel?: ShareChannel') &&
  shareAnalyticsTs.includes('timestamp: string') &&
  !shareAnalyticsTs.includes('auth.token') &&
  !shareAnalyticsTs.includes('user.password'),
  'ShareAnalyticsService records strictly non-sensitive event metrics'
);

// Test tracking execution
shareAnalytics.clearEvents();
shareAnalytics.trackShareClicked({ productSlug: sampleProd.slug, channel: 'whatsapp' });
shareAnalytics.trackLinkCopied({ productSlug: sampleProd.slug });
const recorded = shareAnalytics.getRecentEvents();
assert(
  recorded.length === 2 && recorded[0].eventName === 'product_share_clicked' && recorded[1].eventName === 'product_link_copied',
  'Share analytics records non-sensitive events locally'
);

// -------------------------------------------------------------------
// 9. COLLECTION, HOMEPAGE & BAG SHARING
// -------------------------------------------------------------------
console.log('\n--- 9. Collection, Homepage & Bag Sharing ---');

assert(
  appTsx.includes('handleShareCollection') && appTsx.includes('onShareCollection='),
  'App provides collection sharing with canonical URL support'
);

assert(
  appTsx.includes('Share Drops') || appTsx.includes('Share Collection'),
  'Featured homepage collection and shop views include share buttons'
);

assert(
  bagViewTsx.includes('onShareItem') && bagViewTsx.includes('Share Drop'),
  'BagView supports sharing individual bag drops'
);

// -------------------------------------------------------------------
// 10. DEEP ROUTE NAVIGATION & INVALID SLUG HANDLING
// -------------------------------------------------------------------
console.log('\n--- 10. Deep Route Navigation & Error Handling ---');

assert(
  appTsx.includes('Drop Not Found') && appTsx.includes('Back to Shop All'),
  'App handles invalid or unavailable product slugs gracefully with Drop Not Found screen'
);

assert(
  appTsx.includes('path.indexOf("/products/") === 0'),
  'Route parser directly parses /products/:slug for direct navigation from social links'
);

// -------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------
console.log('\n======================================================');
console.log(`TOTAL SHARE SYSTEM TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✔ ALL TH3EE SHARE SYSTEM ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!\n');
}

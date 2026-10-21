import type { Product, UniverseCategory } from '../types/store';
import { resolveProductImageUrl } from './r2';

export const OFFICIAL_SITE_DOMAIN = 'th3ee.in';

export interface ShareTargetItem {
  type: 'product' | 'collection' | 'universe' | 'wishlist';
  id?: string;
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  price?: number;
  image?: string;
  category?: string;
  url?: string;
}

/**
 * Returns the canonical, publicly accessible URL for a product on th3ee.in.
 */
export function getCanonicalProductUrl(product: Product | { slug: string }, domain: string = OFFICIAL_SITE_DOMAIN): string {
  const cleanSlug = encodeURIComponent(product.slug).replace(/%2F/g, '/');
  return `https://${domain}/products/${cleanSlug}`;
}

/**
 * Returns the canonical URL for a collection or universe.
 */
export function getCanonicalCollectionUrl(param: { category?: string; universe?: string }, domain: string = OFFICIAL_SITE_DOMAIN): string {
  if (param.category) {
    return `https://${domain}/shop?category=${encodeURIComponent(param.category)}`;
  }
  if (param.universe) {
    return `https://${domain}/shop?universe=${encodeURIComponent(param.universe)}`;
  }
  return `https://${domain}/shop`;
}

/**
 * Formats a clean, professional product share message as required:
 * e.g. "Check out SPIRIT: BORN TO STAND OUT at TH3EE! Shop now for ₹499. https://th3ee.in/products/spirit-born-to-stand-out"
 */
export function formatProductShareMessage(product: Product, domain: string = OFFICIAL_SITE_DOMAIN): string {
  const price = Math.round(Number(product.price));
  const url = getCanonicalProductUrl(product, domain);
  return `Check out ${product.name} at TH3EE! Shop now for ₹${price}. ${url}`;
}

/**
 * Formats a collection or universe share message.
 */
export function formatCollectionShareMessage(title: string, url: string): string {
  return `Explore the ${title} collection on TH3EE Streetwear! Discover heavyweight archive drops here: ${url}`;
}

/**
 * Formats a shared wishlist message with direct product links without leaking any customer PII.
 */
export function formatWishlistShareMessage(count: number, url: string): string {
  return `Check out my curated wishlist drops on TH3EE Streetwear (${count} ${count === 1 ? 'item' : 'items'}): ${url}`;
}

/**
 * Generates verified platform share URLs for all major channels.
 */
export function generatePlatformShareUrls(params: {
  title: string;
  text: string;
  url: string;
}) {
  const encodedUrl = encodeURIComponent(params.url);
  const encodedText = encodeURIComponent(params.text);
  const encodedTitle = encodeURIComponent(params.title);

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    x: `https://twitter.com/intent/tweet?text=${encodedText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
    // Instagram direct URL fallback (native share handles direct Stories / DMs)
    instagram: `https://www.instagram.com/`
  };
}

/**
 * Copies text to clipboard safely with fallback for older browsers or restricted permissions.
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Modern Async Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fall through to DOM fallback
    }
  }

  // ExecCommand textarea fallback
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Extracts a normalized product image URL for sharing.
 */
export function getProductShareImage(product: Product): string {
  const candidate = (product.colors && product.colors[0] && product.colors[0].images && product.colors[0].images[0]) || 
    (product.images && product.images[0]) || 
    (product as any).image || 
    '';
  return resolveProductImageUrl(candidate);
}

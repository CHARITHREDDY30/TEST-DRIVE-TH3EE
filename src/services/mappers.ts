import type { Product, HeroSlide, StoreBrandConfig } from '../types/store';
import { resolveProductImageUrl } from '../lib/r2';

/**
 * Maps a database `products` row into the frontend `Product` domain type.
 */
export function mapDbProductToFrontend(row: any): Product {
  const resolvedImages = Array.isArray(row.image_urls) && row.image_urls.length > 0
    ? row.image_urls.map((img: string) => resolveProductImageUrl(img))
    : (row.image_url || row.image ? [resolveProductImageUrl(row.image_url || row.image)] : []);

  const resolvedColors = Array.isArray(row.colors)
    ? row.colors.map((c: any) => ({
        name: c.name || 'Standard',
        hex: c.hex || '#111111',
        images: Array.isArray(c.images) ? c.images.map((img: string) => resolveProductImageUrl(img)) : []
      }))
    : [];

  const gsmDisplay = typeof row.gsm === 'number'
    ? `${row.gsm} GSM`
    : (typeof row.gsm === 'string' && row.gsm.trim() !== '' ? row.gsm : '240 GSM');

  const availableSizes = Array.isArray(row.available_sizes) && row.available_sizes.length > 0
    ? row.available_sizes
    : (Array.isArray(row.sizes) && row.sizes.length > 0 ? row.sizes : ['S', 'M', 'L', 'XL', 'XXL']);

  return {
    id: row.legacy_id || row.id,
    sku: row.legacy_id || row.slug || row.id,
    slug: row.slug || '',
    name: row.name || 'Untitled Product',
    category: row.category || 'T-Shirts',
    subcategory: row.subcategory || '',
    universeId: row.universe_id || row.universeId || '',
    price: Number(row.selling_price ?? row.price ?? 0),
    originalPrice: Number(row.original_price ?? row.originalPrice ?? row.selling_price ?? 0),
    gsm: gsmDisplay,
    fabric: row.fabric || '100% Cotton',
    fit: row.fit || 'Regular Box Cut',
    availableSizes,
    colors: resolvedColors,
    inventory: row.inventory && typeof row.inventory === 'object' ? row.inventory : undefined,
    badge: row.badge || undefined,
    rating: Number(row.rating ?? 5.0),
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? 0),
    inStock: Boolean(row.in_stock ?? true),
    description: row.description || '',
    specs: Array.isArray(row.specs) ? row.specs : (Array.isArray(row.specifications) ? row.specifications : []),
    care: Array.isArray(row.care) ? row.care : [],
    images: resolvedImages
  };
}

/**
 * Maps a frontend `Product` into database row structure for upserting.
 */
export function mapFrontendProductToDb(prod: Partial<Product>, dbId?: string): Record<string, any> {
  const gsmNum = typeof prod.gsm === 'number'
    ? prod.gsm
    : parseInt(String(prod.gsm || '0').replace(/[^0-9]/g, ''), 10) || null;

  const images = (prod.images || []).map(img => resolveProductImageUrl(img));
  const primaryImage = images[0] || resolveProductImageUrl(null);

  const colors = (prod.colors || []).map(c => ({
    name: c.name,
    hex: c.hex,
    images: (c.images || []).map(img => resolveProductImageUrl(img))
  }));

  const payload: Record<string, any> = {
    legacy_id: prod.id || prod.sku,
    name: prod.name,
    slug: prod.slug,
    description: prod.description || '',
    category: prod.category || 'T-Shirts',
    subcategory: prod.subcategory || '',
    universe_id: prod.universeId || '',
    selling_price: prod.price !== undefined ? Number(prod.price) : 0,
    original_price: prod.originalPrice !== undefined ? Number(prod.originalPrice) : (prod.price || 0),
    gsm: gsmNum,
    fabric: prod.fabric || '',
    fit: prod.fit || '',
    image: primaryImage,
    image_url: primaryImage,
    image_urls: images,
    sizes: prod.availableSizes || ['S', 'M', 'L', 'XL', 'XXL'],
    colors: colors,
    available_sizes: prod.availableSizes || ['S', 'M', 'L', 'XL', 'XXL'],
    specifications: prod.specs || [],
    specs: prod.specs || [],
    care: prod.care || [],
    badge: prod.badge || null,
    rating: prod.rating !== undefined ? Number(prod.rating) : 5.0,
    reviews_count: prod.reviewsCount !== undefined ? Number(prod.reviewsCount) : 0,
    in_stock: prod.inStock !== undefined ? Boolean(prod.inStock) : true,
    is_published: true,
    updated_at: new Date().toISOString()
  };

  if (dbId) {
    payload.id = dbId;
  }

  return payload;
}

/**
 * Maps a database `hero_slides` row to the frontend `HeroSlide` domain type.
 */
export function mapDbHeroSlideToFrontend(row: any, index: number = 0): HeroSlide {
  let highlight = '';
  let desc = row.subtitle || '';
  if (row.subtitle && row.subtitle.includes(' • ')) {
    const parts = row.subtitle.split(' • ');
    highlight = parts[0];
    desc = parts.slice(1).join(' • ');
  }

  const defaultGradients = [
    'from-amber-950 via-orange-950 to-neutral-950',
    'from-neutral-950 via-neutral-900 to-neutral-950',
    'from-stone-950 via-zinc-900 to-neutral-950'
  ];

  return {
    id: row.id,
    tag: row.tag || 'EXCLUSIVE DROP',
    title: row.title || 'TH3EE ARCHIVE',
    highlight: highlight || row.title || '',
    desc: desc || '',
    cta: row.cta || 'EXPLORE NOW',
    target: row.target_url || '/shop',
    bgGradient: row.bg_gradient || defaultGradients[index % defaultGradients.length],
    image: resolveProductImageUrl(row.image_url),
    mobileImage: row.mobile_image_url ? resolveProductImageUrl(row.mobile_image_url) : (row.mobileImage ? resolveProductImageUrl(row.mobileImage) : undefined),
    badgeColor: row.badge_color || 'bg-[#E51E2B]'
  };
}

/**
 * Maps a frontend `HeroSlide` to database row structure.
 */
export function mapFrontendHeroSlideToDb(slide: HeroSlide, sortOrder: number = 1): Record<string, any> {
  return {
    id: slide.id,
    title: slide.title,
    subtitle: slide.highlight ? `${slide.highlight} • ${slide.desc}` : slide.desc,
    image_url: resolveProductImageUrl(slide.image),
    mobile_image_url: resolveProductImageUrl(slide.mobileImage || slide.image),
    target_url: slide.target,
    sort_order: sortOrder,
    is_active: true,
    updated_at: new Date().toISOString()
  };
}

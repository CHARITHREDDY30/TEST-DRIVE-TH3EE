import type { CartItem, Product, ProductColor } from '../types/store';
import { GLOBAL_DEFAULT_IMAGE } from '../lib/r2';

const GUEST_ID_KEY = 'th3ee_guest_cart_identity_token';
const LEGACY_STORAGE_KEY = 'th3ee_bag_cart';

/**
 * Generates a cryptographically secure random identifier.
 * Uses window.crypto when available, falling back to secure random byte generation.
 */
export function generateCryptographicToken(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    if (typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    const buf = new Uint8Array(16);
    window.crypto.getRandomValues(buf);
    // Format as UUID v4
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const hex = Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  // Safe fallback if crypto is not present
  return 'gst_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Gets or creates the persistent cryptographically isolated guest identity token.
 * This token is unique to this browser instance / profile.
 */
export function getGuestCartToken(): string {
  if (typeof window === 'undefined') return 'server_session_placeholder';
  try {
    let token = localStorage.getItem(GUEST_ID_KEY);
    if (!token || token.trim().length < 16) {
      token = generateCryptographicToken();
      localStorage.setItem(GUEST_ID_KEY, token);
    }
    return token;
  } catch {
    return generateCryptographicToken();
  }
}

/**
 * Derives the isolated customer storage key.
 * Strictly separates authenticated customer bags from guest bags.
 * Never uses a shared global key.
 */
export function getCustomerStorageKey(userId?: string | null): string {
  if (userId && userId.trim() !== '') {
    return `th3ee_bag_usr_${userId.trim()}`;
  }
  const guestToken = getGuestCartToken();
  return `th3ee_bag_gst_${guestToken}`;
}

/**
 * Resolves the variant thumbnail image:
 * 1. Matches the selected colour variant's image if available.
 * 2. Falls back to the primary product image.
 * 3. Falls back to global default image.
 */
export function resolveVariantThumbnail(product: Product, selectedColor?: string): string {
  if (!product) return GLOBAL_DEFAULT_IMAGE;

  // 1. Try color-specific image
  if (selectedColor && Array.isArray(product.colors) && product.colors.length > 0) {
    const targetColor = selectedColor.trim().toLowerCase();
    const matched = product.colors.find(
      (c: ProductColor) => c && c.name && c.name.trim().toLowerCase() === targetColor
    );
    if (matched && Array.isArray(matched.images) && matched.images.length > 0 && matched.images[0]) {
      return matched.images[0];
    }
  }

  // 2. Try product primary image
  if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
    return product.images[0];
  }

  // 3. Try first color's first image
  if (Array.isArray(product.colors) && product.colors[0]?.images?.[0]) {
    return product.colors[0].images[0];
  }

  return GLOBAL_DEFAULT_IMAGE;
}

/**
 * Loads cart items for the given customer identity.
 * Migrates any legacy shared cart data once into the isolated customer key.
 */
export function loadCustomerCart(userId?: string | null): CartItem[] {
  if (typeof window === 'undefined') return [];

  const isolatedKey = getCustomerStorageKey(userId);

  try {
    // Check isolated customer storage first
    const rawData = localStorage.getItem(isolatedKey);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed)) {
        return sanitizeCartItems(parsed);
      }
    }

    // Check and migrate legacy shared storage if this is a fresh isolated session
    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData) {
      try {
        const legacyParsed = JSON.parse(legacyData);
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
          const sanitized = sanitizeCartItems(legacyParsed);
          localStorage.setItem(isolatedKey, JSON.stringify(sanitized));
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          return sanitized;
        }
      } catch {
        // ignore parsing error
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to load customer cart from storage:', err);
  }

  return [];
}

/**
 * Saves cart items to the customer's isolated storage key.
 */
export function saveCustomerCart(items: CartItem[], userId?: string | null): void {
  if (typeof window === 'undefined') return;

  const isolatedKey = getCustomerStorageKey(userId);
  try {
    localStorage.setItem(isolatedKey, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save customer cart to storage:', err);
  }
}

/**
 * Sanitizes and validates cart items to guarantee schema consistency.
 */
function sanitizeCartItems(items: any[]): CartItem[] {
  return items
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name || 'Untitled Drop'),
      price: Number(item.price) || 0,
      originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
      selectedSize: String(item.selectedSize || 'L'),
      selectedColor: String(item.selectedColor || 'Standard'),
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
      thumbnail: item.thumbnail || (item.images && item.images[0]) || undefined,
      images: Array.isArray(item.images) ? item.images : undefined,
      colors: Array.isArray(item.colors) ? item.colors : undefined,
      slug: item.slug ? String(item.slug) : undefined
    }));
}

/**
 * Adds an item to the cart, matching on (id + selectedSize + selectedColor).
 * If variant exists, increments quantity. Otherwise appends as a new variant.
 */
export function addProductToCart(
  currentCart: CartItem[],
  product: Product,
  size?: string,
  color?: string
): { success: boolean; cart: CartItem[]; item: CartItem; isNewVariant: boolean } {
  if (product.inStock === false) {
    throw new Error('This drop is currently sold out');
  }

  const chosenSize = (size && size.trim()) ? size.trim() : 'L';
  const chosenColor = (color && color.trim())
    ? color.trim()
    : ((product.colors && product.colors[0] && product.colors[0].name) ? product.colors[0].name : 'Standard');

  const resolvedThumb = resolveVariantThumbnail(product, chosenColor);

  const existingIndex = currentCart.findIndex(
    (item) => item.id === product.id &&
      item.selectedSize.toLowerCase() === chosenSize.toLowerCase() &&
      item.selectedColor.toLowerCase() === chosenColor.toLowerCase()
  );

  let updatedCart: CartItem[];
  let affectedItem: CartItem;
  let isNewVariant = false;

  if (existingIndex > -1) {
    updatedCart = currentCart.map((item, idx) => {
      if (idx === existingIndex) {
        affectedItem = {
          ...item,
          quantity: item.quantity + 1,
          // ensure thumbnail is updated if it was missing
          thumbnail: item.thumbnail || resolvedThumb
        };
        return affectedItem;
      }
      return item;
    });
  } else {
    isNewVariant = true;
    affectedItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
      selectedSize: chosenSize,
      selectedColor: chosenColor,
      quantity: 1,
      thumbnail: resolvedThumb,
      images: product.images,
      colors: product.colors,
      slug: product.slug
    };
    updatedCart = [...currentCart, affectedItem];
  }

  return {
    success: true,
    cart: updatedCart,
    item: affectedItem,
    isNewVariant
  };
}

/**
 * Adjusts quantity of a specific item variant.
 * If next quantity is <= 0, the variant is removed.
 */
export function adjustVariantQuantity(
  currentCart: CartItem[],
  productId: string,
  size: string,
  color: string,
  delta: number
): CartItem[] {
  return currentCart
    .map((item) => {
      if (
        item.id === productId &&
        item.selectedSize.toLowerCase() === size.toLowerCase() &&
        item.selectedColor.toLowerCase() === color.toLowerCase()
      ) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    })
    .filter(Boolean) as CartItem[];
}

/**
 * Removes a specific variant from the cart.
 */
export function removeVariantFromCart(
  currentCart: CartItem[],
  productId: string,
  size: string,
  color: string
): CartItem[] {
  return currentCart.filter(
    (item) =>
      !(
        item.id === productId &&
        item.selectedSize.toLowerCase() === size.toLowerCase() &&
        item.selectedColor.toLowerCase() === color.toLowerCase()
      )
  );
}

/**
 * Migrates a guest cart into an authenticated user's cart on login.
 */
export function mergeGuestCartIntoUserCart(userId: string): CartItem[] {
  if (typeof window === 'undefined') return [];

  const guestKey = getCustomerStorageKey(null);
  const userKey = getCustomerStorageKey(userId);

  try {
    const rawGuest = localStorage.getItem(guestKey);
    const rawUser = localStorage.getItem(userKey);

    const guestItems: CartItem[] = rawGuest ? sanitizeCartItems(JSON.parse(rawGuest)) : [];
    const userItems: CartItem[] = rawUser ? sanitizeCartItems(JSON.parse(rawUser)) : [];

    if (guestItems.length === 0) return userItems;

    // Merge: add guest items to user cart
    let merged = [...userItems];
    for (const gItem of guestItems) {
      const matchIdx = merged.findIndex(
        (u) =>
          u.id === gItem.id &&
          u.selectedSize.toLowerCase() === gItem.selectedSize.toLowerCase() &&
          u.selectedColor.toLowerCase() === gItem.selectedColor.toLowerCase()
      );
      if (matchIdx > -1) {
        merged[matchIdx] = {
          ...merged[matchIdx],
          quantity: merged[matchIdx].quantity + gItem.quantity
        };
      } else {
        merged.push(gItem);
      }
    }

    localStorage.setItem(userKey, JSON.stringify(merged));
    localStorage.removeItem(guestKey); // Clean up guest cart
    return merged;
  } catch (err) {
    console.warn('Failed to merge guest cart into user cart:', err);
    return loadCustomerCart(userId);
  }
}

/**
 * Generates an isolated, formatted WhatsApp ordering URL from bag items.
 */
export function buildWhatsAppCartOrderUrl(
  cart: CartItem[],
  subtotal: number,
  discount: number,
  coupon: string,
  shipping: number,
  total: number,
  deliveryInfo?: any,
  phoneNum?: string,
  domain?: string,
  customOrderRef?: string
): string {
  const targetPhone = phoneNum || '919392233213';
  const siteDomain = domain || 'th3ee.store';
  const orderRef = customOrderRef || ('TH3EE-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000));

  const productEntries = cart.map((item, idx) => {
    const itemPrice = Number(item.price) || 0;
    const origPrice = Number(item.originalPrice) || 0;
    let entry = `${idx + 1}. ${item.name}\n   • Size: ${item.selectedSize} | Colour: ${item.selectedColor}\n   • Qty: ${item.quantity} × Rs. ${itemPrice.toFixed(2)}`;
    if (origPrice > itemPrice) {
      entry += ` (MRP: Rs. ${origPrice.toFixed(2)} — Save Rs. ${((origPrice - itemPrice) * item.quantity).toFixed(0)})`;
    }
    return entry;
  }).join('\n\n');

  const addressLines: string[] = [];
  if (deliveryInfo) {
    const customerName = deliveryInfo.fullName || deliveryInfo.name;
    const phone = deliveryInfo.mobileNumber || deliveryInfo.phone;
    if (customerName) addressLines.push('• Customer Name: ' + customerName);
    if (phone) addressLines.push('• Mobile Number: ' + phone);

    const streetCombined = [
      deliveryInfo.houseNo,
      deliveryInfo.houseStreet,
      deliveryInfo.street || deliveryInfo.address
    ].filter(Boolean).join(', ');

    if (streetCombined) addressLines.push('• Street Address: ' + streetCombined);
    const area = deliveryInfo.areaLocality || deliveryInfo.area;
    if (area) addressLines.push('• Area / Locality: ' + area);
    if (deliveryInfo.landmark) addressLines.push('• Landmark: ' + deliveryInfo.landmark);

    const regionLine = [
      deliveryInfo.city,
      deliveryInfo.state,
      deliveryInfo.pincode ? 'PIN: ' + deliveryInfo.pincode : ''
    ].filter(Boolean).join(', ');

    if (regionLine) addressLines.push('• City, State & PIN: ' + regionLine);
  }

  const addressBlock = addressLines.length > 0 ? [
    'Delivery & Customer Details:',
    ...addressLines
  ].join('\n') : '';

  const totalQty = cart.reduce((c, i) => c + (Number(i.quantity) || 1), 0);

  const message = [
    `Hello TH3EE! I would like to place an order from ${siteDomain}`,
    '',
    `Order Reference: ${orderRef}`,
    '',
    `Bag Items (${totalQty} items):`,
    productEntries,
    '',
    'Order Summary:',
    `• Subtotal: Rs. ${Number(subtotal).toFixed(2)}`,
    discount > 0 ? `• Discount${coupon ? ` (${coupon})` : ''}: -Rs. ${Number(discount).toFixed(2)}` : null,
    `• Delivery Fee: ${shipping === 0 ? 'FREE EXPRESS SHIPPING' : `Rs. ${Number(shipping).toFixed(2)}`}`,
    `• Final Total: Rs. ${Number(total).toFixed(2)}`,
    '',
    addressBlock,
    '',
    'Please confirm product availability and share the payment details.'
  ].filter(Boolean).join('\n');

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Clears cart items for the specified customer identity and legacy storage.
 */
export function clearCustomerCart(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  const isolatedKey = getCustomerStorageKey(userId);
  try {
    localStorage.removeItem(isolatedKey);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear customer cart:', err);
  }
}

export const cartService = {
  getGuestCartToken,
  getCustomerStorageKey,
  resolveVariantThumbnail,
  loadCustomerCart,
  saveCustomerCart,
  clearCustomerCart,
  addProductToCart,
  adjustVariantQuantity,
  removeVariantFromCart,
  mergeGuestCartIntoUserCart,
  buildWhatsAppCartOrderUrl
};

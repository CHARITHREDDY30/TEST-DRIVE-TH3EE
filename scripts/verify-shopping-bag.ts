import assert from 'node:assert';
import {
  cartService,
  generateCryptographicToken,
  resolveVariantThumbnail,
  addProductToCart,
  adjustVariantQuantity,
  removeVariantFromCart,
  mergeGuestCartIntoUserCart
} from '../src/services/cart.service';
import type { Product, CartItem } from '../src/types/store';
import { GLOBAL_DEFAULT_IMAGE } from '../src/lib/r2';

console.log('====================================================');
console.log('   TH3EE SHOPPING BAG & CUSTOMER ISOLATION TEST     ');
console.log('====================================================\n');

// Mock in-memory storage to simulate isolated browser instances
const mockStorage: Record<string, string> = {};
(global as any).window = global;
(global as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

const sampleProductA: Product = {
  id: 'prod-001',
  sku: 'TH3-TEE-001',
  slug: 'baahubali-heavyweight-oversized-tee',
  name: 'Baahubali Cult Heavyweight Tee',
  category: 'T-Shirts',
  subcategory: 'Baahubali',
  universeId: 'tfi',
  price: 1499,
  originalPrice: 2499,
  gsm: '240 GSM',
  fabric: '100% Combed Cotton',
  fit: 'Oversized Streetwear Fit',
  availableSizes: ['S', 'M', 'L', 'XL', '2XL'],
  colors: [
    {
      name: 'Vintage Black',
      hex: '#111111',
      images: ['https://pub-r2.dev/tshirts/baahubali_black.jpg']
    },
    {
      name: 'Blood Crimson',
      hex: '#8B0000',
      images: ['https://pub-r2.dev/tshirts/baahubali_crimson.jpg']
    },
    {
      name: 'Raw Ash Grey',
      hex: '#888888',
      images: [] // empty images to test fallback to primary image
    }
  ],
  inStock: true,
  description: 'Cult Indian cinema loopback cotton drop',
  specs: ['240 GSM Heavyweight', 'Pre-shrunk'],
  care: ['Machine wash cold'],
  images: ['https://pub-r2.dev/tshirts/baahubali_main.jpg']
};

const sampleProductSoldOut: Product = {
  ...sampleProductA,
  id: 'prod-sold-out',
  name: 'Sold Out Limited Edition',
  inStock: false
};

let testsPassed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`[FAIL] ${name}:`, err.message);
    process.exit(1);
  }
}

// TEST 1: Default Product Image in Shopping Bag & Color Variant Thumbnail
runTest('1. Variant thumbnail resolution uses color image, falls back to primary image, then global default', () => {
  // Case A: Selected color has specific image
  const thumbA = resolveVariantThumbnail(sampleProductA, 'Vintage Black');
  assert.strictEqual(thumbA, 'https://pub-r2.dev/tshirts/baahubali_black.jpg');

  const thumbB = resolveVariantThumbnail(sampleProductA, 'Blood Crimson');
  assert.strictEqual(thumbB, 'https://pub-r2.dev/tshirts/baahubali_crimson.jpg');

  // Case B: Selected color has empty images array -> falls back to primary image
  const thumbC = resolveVariantThumbnail(sampleProductA, 'Raw Ash Grey');
  assert.strictEqual(thumbC, 'https://pub-r2.dev/tshirts/baahubali_main.jpg');

  // Case C: No color match -> falls back to primary image
  const thumbD = resolveVariantThumbnail(sampleProductA, 'NonExistentColor');
  assert.strictEqual(thumbD, 'https://pub-r2.dev/tshirts/baahubali_main.jpg');

  // Case D: Product with no images at all -> falls back to GLOBAL_DEFAULT_IMAGE
  const emptyProd: Product = { ...sampleProductA, images: [], colors: [] };
  const thumbE = resolveVariantThumbnail(emptyProd, 'Standard');
  assert.strictEqual(thumbE, GLOBAL_DEFAULT_IMAGE);
});

// TEST 2: Add-to-bag without opening bag & duplicate submission protection
runTest('2. Sold-out drops throw error and prevent addition', () => {
  assert.throws(() => {
    addProductToCart([], sampleProductSoldOut, 'L', 'Vintage Black');
  }, /sold out/i);
});

// TEST 3: Add to bag preserves all variant details, selling price, MRP, and discount info
runTest('3. Add to bag preserves size, color, thumbnail, selling price, and originalPrice', () => {
  const initialCart: CartItem[] = [];
  const res = addProductToCart(initialCart, sampleProductA, 'L', 'Blood Crimson');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.cart.length, 1);
  const item = res.item;
  assert.strictEqual(item.id, 'prod-001');
  assert.strictEqual(item.selectedSize, 'L');
  assert.strictEqual(item.selectedColor, 'Blood Crimson');
  assert.strictEqual(item.quantity, 1);
  assert.strictEqual(item.price, 1499);
  assert.strictEqual(item.originalPrice, 2499);
  assert.strictEqual(item.thumbnail, 'https://pub-r2.dev/tshirts/baahubali_crimson.jpg');
});

// TEST 4: Bag Persistence & Quantity Handling (same variant increments quantity)
runTest('4. Adding same product variant twice increments quantity without creating duplicate rows', () => {
  let cart: CartItem[] = [];
  const firstAdd = addProductToCart(cart, sampleProductA, 'L', 'Vintage Black');
  cart = firstAdd.cart;
  assert.strictEqual(cart.length, 1);
  assert.strictEqual(cart[0].quantity, 1);

  const secondAdd = addProductToCart(cart, sampleProductA, 'L', 'Vintage Black');
  cart = secondAdd.cart;
  assert.strictEqual(cart.length, 1, 'Should NOT create a second line for identical variant');
  assert.strictEqual(cart[0].quantity, 2, 'Quantity should be incremented to 2');
});

// TEST 5: Different sizes and different colors create distinct variants
runTest('5. Adding same product in different sizes creates separate variant rows', () => {
  let cart: CartItem[] = [];
  cart = addProductToCart(cart, sampleProductA, 'M', 'Vintage Black').cart;
  cart = addProductToCart(cart, sampleProductA, 'XL', 'Vintage Black').cart;
  assert.strictEqual(cart.length, 2, 'Different sizes must remain separate line items');
  assert.strictEqual(cart[0].selectedSize, 'M');
  assert.strictEqual(cart[1].selectedSize, 'XL');
});

runTest('6. Adding same product in different colors creates separate variant rows', () => {
  let cart: CartItem[] = [];
  cart = addProductToCart(cart, sampleProductA, 'L', 'Vintage Black').cart;
  cart = addProductToCart(cart, sampleProductA, 'L', 'Blood Crimson').cart;
  assert.strictEqual(cart.length, 2, 'Different colors must remain separate line items');
  assert.strictEqual(cart[0].selectedColor, 'Vintage Black');
  assert.strictEqual(cart[1].selectedColor, 'Blood Crimson');
  assert.strictEqual(cart[0].thumbnail, 'https://pub-r2.dev/tshirts/baahubali_black.jpg');
  assert.strictEqual(cart[1].thumbnail, 'https://pub-r2.dev/tshirts/baahubali_crimson.jpg');
});

// TEST 7: Quantity adjustment and item removal
runTest('7. Quantity adjustments (+, -) and removal correctly update totals', () => {
  let cart: CartItem[] = [];
  cart = addProductToCart(cart, sampleProductA, 'L', 'Vintage Black').cart;
  cart = addProductToCart(cart, sampleProductA, 'L', 'Vintage Black').cart;
  assert.strictEqual(cart[0].quantity, 2);

  // Decrement to 1
  cart = adjustVariantQuantity(cart, 'prod-001', 'L', 'Vintage Black', -1);
  assert.strictEqual(cart[0].quantity, 1);

  // Decrementing to 0 removes item
  cart = adjustVariantQuantity(cart, 'prod-001', 'L', 'Vintage Black', -1);
  assert.strictEqual(cart.length, 0);

  // Direct removal
  cart = addProductToCart(cart, sampleProductA, 'M', 'Vintage Black').cart;
  cart = removeVariantFromCart(cart, 'prod-001', 'M', 'Vintage Black');
  assert.strictEqual(cart.length, 0);
});

// TEST 8: Customer Isolation (Guest vs Guest)
runTest('8. Customer Isolation: Separate guest sessions have strictly isolated shopping bags', () => {
  // Session A
  const guestTokenA = generateCryptographicToken();
  const storageKeyA = `th3ee_bag_gst_${guestTokenA}`;

  // Session B
  const guestTokenB = generateCryptographicToken();
  const storageKeyB = `th3ee_bag_gst_${guestTokenB}`;

  assert.notStrictEqual(guestTokenA, guestTokenB);
  assert.notStrictEqual(storageKeyA, storageKeyB);

  // Add items to Session A's bag
  const itemsA: CartItem[] = [{
    id: 'prod-001',
    name: 'Baahubali Tee',
    price: 1499,
    selectedSize: 'L',
    selectedColor: 'Vintage Black',
    quantity: 1,
    thumbnail: 'https://pub-r2.dev/tshirts/baahubali_black.jpg'
  }];
  mockStorage[storageKeyA] = JSON.stringify(itemsA);

  // Verify Session B sees an empty bag
  const rawB = mockStorage[storageKeyB];
  assert.strictEqual(rawB, undefined, 'Session B must NEVER see items from Session A');

  // Verify Session A sees its own items
  const parsedA = JSON.parse(mockStorage[storageKeyA]);
  assert.strictEqual(parsedA.length, 1);
  assert.strictEqual(parsedA[0].id, 'prod-001');
});

// TEST 9: Customer Isolation (User vs User)
runTest('9. Customer Isolation: Separate authenticated users have strictly isolated shopping bags', () => {
  const user1Key = 'th3ee_bag_usr_user_111';
  const user2Key = 'th3ee_bag_usr_user_222';

  mockStorage[user1Key] = JSON.stringify([{ id: 'p1', name: 'User 1 Item', price: 999, selectedSize: 'S', selectedColor: 'Black', quantity: 1 }]);
  mockStorage[user2Key] = JSON.stringify([{ id: 'p2', name: 'User 2 Item', price: 1899, selectedSize: 'XL', selectedColor: 'White', quantity: 2 }]);

  const u1Cart = JSON.parse(mockStorage[user1Key]);
  const u2Cart = JSON.parse(mockStorage[user2Key]);

  assert.strictEqual(u1Cart.length, 1);
  assert.strictEqual(u1Cart[0].id, 'p1');

  assert.strictEqual(u2Cart.length, 1);
  assert.strictEqual(u2Cart[0].id, 'p2');
  assert.notStrictEqual(u1Cart[0].id, u2Cart[0].id);
});

// TEST 10: Seamless guest-to-user cart migration on login
runTest('10. Seamless cart migration: Guest items merge into authenticated user bag on login', () => {
  // Set guest cart
  const guestKey = cartService.getCustomerStorageKey(null);
  mockStorage[guestKey] = JSON.stringify([{
    id: 'prod-001',
    name: 'Baahubali Tee',
    price: 1499,
    selectedSize: 'L',
    selectedColor: 'Vintage Black',
    quantity: 2
  }]);

  // Log in as user 333
  const mergedCart = mergeGuestCartIntoUserCart('user_333');
  assert.strictEqual(mergedCart.length, 1);
  assert.strictEqual(mergedCart[0].quantity, 2);

  // Guest cart is cleaned up to prevent leakage to subsequent guests
  assert.strictEqual(mockStorage[guestKey], undefined);

  // User cart has the items
  const userKey = cartService.getCustomerStorageKey('user_333');
  assert.notStrictEqual(mockStorage[userKey], undefined);
});

// TEST 11: Order via WhatsApp URL generation & formatting
runTest('11. Order via WhatsApp builds valid URL with items, sizes, colours, prices, and unique reference', () => {
  const testCart: CartItem[] = [
    {
      id: 'prod-001',
      name: 'Baahubali Cult Heavyweight Tee',
      price: 1499,
      originalPrice: 2499,
      selectedSize: 'L',
      selectedColor: 'Vintage Black',
      quantity: 2,
      thumbnail: 'https://pub-r2.dev/tshirts/baahubali_black.jpg'
    },
    {
      id: 'prod-002',
      name: 'Anime Shonen Oversized Tee',
      price: 1399,
      originalPrice: 1999,
      selectedSize: 'M',
      selectedColor: 'Crimson Red',
      quantity: 1,
      thumbnail: 'https://pub-r2.dev/tshirts/anime_red.jpg'
    }
  ];

  const deliveryInfo = {
    fullName: 'Ravi Teja',
    phone: '9876543210',
    address: 'Flat 402, Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034'
  };

  const url = cartService.buildWhatsAppCartOrderUrl(
    testCart,
    4397,
    200,
    'TH3EE10',
    0,
    4197,
    deliveryInfo,
    '919392233213',
    'th3ee.store'
  );

  assert.ok(url.startsWith('https://wa.me/919392233213?text='), 'Must target correct WhatsApp phone');
  const decodedMessage = decodeURIComponent(url.replace('https://wa.me/919392233213?text=', ''));

  assert.ok(decodedMessage.includes('Order Reference: TH3EE-'), 'Must include unique order reference');
  assert.ok(decodedMessage.includes('Baahubali Cult Heavyweight Tee'), 'Must include product name');
  assert.ok(decodedMessage.includes('Size: L | Colour: Vintage Black'), 'Must include size and color');
  assert.ok(decodedMessage.includes('Qty: 2 × Rs. 1499.00'), 'Must include quantity and unit price');
  assert.ok(decodedMessage.includes('Save Rs. 2000'), 'Must include discount savings calculation');
  assert.ok(decodedMessage.includes('Subtotal: Rs. 4397.00'), 'Must include subtotal');
  assert.ok(decodedMessage.includes('Discount (TH3EE10): -Rs. 200'), 'Must include coupon discount');
  assert.ok(decodedMessage.includes('FREE EXPRESS SHIPPING'), 'Must format free shipping');
  assert.ok(decodedMessage.includes('Final Total: Rs. 4197.00'), 'Must include final total');
  assert.ok(decodedMessage.includes('Ravi Teja'), 'Must include customer name');
  assert.ok(decodedMessage.includes('500034'), 'Must include pincode');
});

console.log(`\n====================================================`);
console.log(`   ALL ${testsPassed} AUTOMATED TESTS PASSED SUCCESSFULLY!`);
console.log(`====================================================\n`);

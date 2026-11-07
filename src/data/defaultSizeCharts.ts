import type { ProductSizeChart, GarmentMeasurementEntry } from '../types/sizing';
import type { Product } from '../types/store';

export const DEFAULT_OVERSIZED_TSHIRT_MEASUREMENTS: GarmentMeasurementEntry[] = [
  { size: 'XS', chestCm: 102, shoulderCm: 51,   lengthCm: 71, sleeveCm: 21.5, waistCm: 100, hipCm: 102, isAvailable: true },
  { size: 'S',  chestCm: 107, shoulderCm: 53.5, lengthCm: 74, sleeveCm: 23,   waistCm: 105, hipCm: 107, isAvailable: true },
  { size: 'M',  chestCm: 112, shoulderCm: 56,   lengthCm: 76, sleeveCm: 24,   waistCm: 110, hipCm: 112, isAvailable: true },
  { size: 'L',  chestCm: 117, shoulderCm: 58.5, lengthCm: 79, sleeveCm: 25.5, waistCm: 115, hipCm: 117, isAvailable: true },
  { size: 'XL', chestCm: 122, shoulderCm: 61,   lengthCm: 81, sleeveCm: 26.5, waistCm: 120, hipCm: 122, isAvailable: true },
  { size: 'XXL',chestCm: 127, shoulderCm: 63.5, lengthCm: 84, sleeveCm: 28,   waistCm: 125, hipCm: 127, isAvailable: true },
];

export const DEFAULT_REGULAR_TSHIRT_MEASUREMENTS: GarmentMeasurementEntry[] = [
  { size: 'XS', chestCm: 91,  shoulderCm: 42,   lengthCm: 67, sleeveCm: 19,   waistCm: 86,  hipCm: 91,  isAvailable: true },
  { size: 'S',  chestCm: 96,  shoulderCm: 44.5, lengthCm: 70, sleeveCm: 20.5, waistCm: 91,  hipCm: 96,  isAvailable: true },
  { size: 'M',  chestCm: 102, shoulderCm: 47,   lengthCm: 72, sleeveCm: 21.5, waistCm: 97,  hipCm: 102, isAvailable: true },
  { size: 'L',  chestCm: 107, shoulderCm: 49.5, lengthCm: 75, sleeveCm: 23,   waistCm: 102, hipCm: 107, isAvailable: true },
  { size: 'XL', chestCm: 112, shoulderCm: 52,   lengthCm: 77, sleeveCm: 24,   waistCm: 107, hipCm: 112, isAvailable: true },
  { size: 'XXL',chestCm: 117, shoulderCm: 54.5, lengthCm: 80, sleeveCm: 25.5, waistCm: 112, hipCm: 117, isAvailable: true },
];

export const DEFAULT_BOXY_TSHIRT_MEASUREMENTS: GarmentMeasurementEntry[] = [
  { size: 'XS', chestCm: 107, shoulderCm: 53.5, lengthCm: 63.5, sleeveCm: 20.5, waistCm: 105, hipCm: 107, isAvailable: true },
  { size: 'S',  chestCm: 112, shoulderCm: 56,   lengthCm: 66,   sleeveCm: 21.5, waistCm: 110, hipCm: 112, isAvailable: true },
  { size: 'M',  chestCm: 117, shoulderCm: 58.5, lengthCm: 68.5, sleeveCm: 23,   waistCm: 115, hipCm: 117, isAvailable: true },
  { size: 'L',  chestCm: 122, shoulderCm: 61,   lengthCm: 71,   sleeveCm: 24,   waistCm: 120, hipCm: 122, isAvailable: true },
  { size: 'XL', chestCm: 127, shoulderCm: 63.5, lengthCm: 73.5, sleeveCm: 25.5, waistCm: 125, hipCm: 127, isAvailable: true },
  { size: 'XXL',chestCm: 132, shoulderCm: 66,   lengthCm: 76,   sleeveCm: 26.5, waistCm: 130, hipCm: 132, isAvailable: true },
];

export const DEFAULT_HOODIE_MEASUREMENTS: GarmentMeasurementEntry[] = [
  { size: 'XS', chestCm: 110, shoulderCm: 54, lengthCm: 69, sleeveCm: 60, waistCm: 106, hipCm: 102, isAvailable: true },
  { size: 'S',  chestCm: 116, shoulderCm: 57, lengthCm: 72, sleeveCm: 62, waistCm: 112, hipCm: 108, isAvailable: true },
  { size: 'M',  chestCm: 122, shoulderCm: 60, lengthCm: 75, sleeveCm: 64, waistCm: 118, hipCm: 114, isAvailable: true },
  { size: 'L',  chestCm: 128, shoulderCm: 63, lengthCm: 78, sleeveCm: 66, waistCm: 124, hipCm: 120, isAvailable: true },
  { size: 'XL', chestCm: 134, shoulderCm: 66, lengthCm: 81, sleeveCm: 68, waistCm: 130, hipCm: 126, isAvailable: true },
  { size: 'XXL',chestCm: 140, shoulderCm: 69, lengthCm: 83, sleeveCm: 70, waistCm: 136, hipCm: 132, isAvailable: true },
];

export const DEFAULT_SIZE_CHART_TEMPLATES: Record<string, ProductSizeChart> = {
  'oversized-tshirt': {
    productId: 'template-oversized-tshirt',
    productName: 'Signature Oversized Graphic Tee',
    category: 'T-Shirts',
    fitType: 'Oversized',
    gsm: '290 GSM',
    fabric: '100% Combed Terry Cotton',
    description: 'Signature drop-shoulder streetwear proportion with generous chest volume and relaxed drape.',
    preferredFitRecommendation: 'Designed for a modern relaxed streetwear fit. Stay true to size for signature drape.',
    measurements: DEFAULT_OVERSIZED_TSHIRT_MEASUREMENTS,
  },
  'regular-tshirt': {
    productId: 'template-regular-tshirt',
    productName: 'Core Regular Fit Tee',
    category: 'T-Shirts',
    fitType: 'Regular Fit',
    gsm: '200 GSM',
    fabric: '100% Super-Combed Long-Staple Cotton',
    description: 'Classic tailoring with natural shoulder alignment, standard sleeve pitch, and balanced torso length.',
    preferredFitRecommendation: 'True-to-size classic cut. Size up once if you prefer a looser contour.',
    measurements: DEFAULT_REGULAR_TSHIRT_MEASUREMENTS,
  },
  'boxy-tshirt': {
    productId: 'template-boxy-tshirt',
    productName: 'Japanese Boxy Crop Cut Tee',
    category: 'T-Shirts',
    fitType: 'Boxy Fit',
    gsm: '240 GSM',
    fabric: 'Heavyweight Loopback Jersey',
    description: 'Ultra-wide chest circumference with a slightly cropped vertical hemline for high-fashion layering.',
    preferredFitRecommendation: 'Wide boxy silhouette. Length sits right at belt level.',
    measurements: DEFAULT_BOXY_TSHIRT_MEASUREMENTS,
  },
  'hoodie': {
    productId: 'template-hoodie',
    productName: '500 GSM Ultimate French Terry Hoodie',
    category: 'Hoodies & Sweats',
    fitType: 'Oversized',
    gsm: '500 GSM',
    fabric: 'Double-Loop Heavy French Terry',
    description: 'Engineered heavyweight outerwear drape with seamless double-layered hood and articulated drop shoulders.',
    preferredFitRecommendation: 'Generously proportioned for layering over tees. Order your normal size.',
    measurements: DEFAULT_HOODIE_MEASUREMENTS,
  }
};

/**
 * Returns the most accurate baseline size chart for a given product
 * based on its category, fit name, gsm, or specific product attributes.
 */
export function getBaselineSizeChartForProduct(product: Partial<Product>): ProductSizeChart {
  const cat = (product.category || '').toLowerCase();
  const fit = (product.fit || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();

  // 1. Outerwear / Hoodies
  if (cat.includes('hoodie') || cat.includes('sweat') || name.includes('hoodie')) {
    return {
      ...DEFAULT_SIZE_CHART_TEMPLATES['hoodie'],
      productId: product.id || product.slug || 'template-hoodie',
      productName: product.name || '500 GSM Ultimate French Terry Hoodie',
      fitType: 'Oversized',
      gsm: product.gsm || '500 GSM',
      fabric: product.fabric || 'Double-Loop French Terry'
    };
  }

  // 2. Regular Fit
  if (fit.includes('regular') || fit.includes('classic') || fit.includes('standard') || fit.includes('slim')) {
    return {
      ...DEFAULT_SIZE_CHART_TEMPLATES['regular-tshirt'],
      productId: product.id || product.slug || 'template-regular-tshirt',
      productName: product.name || 'Classic Regular Tee',
      fitType: 'Regular Fit',
      gsm: product.gsm || '200 GSM',
      fabric: product.fabric || '100% Combed Cotton'
    };
  }

  // 3. Boxy Fit (strictly boxy cut without oversized)
  if ((fit.includes('boxy') || name.includes('boxy')) && !fit.includes('oversized')) {
    return {
      ...DEFAULT_SIZE_CHART_TEMPLATES['boxy-tshirt'],
      productId: product.id || product.slug || 'template-boxy-tshirt',
      productName: product.name || 'Heavyweight Boxy Tee',
      fitType: 'Boxy Fit',
      gsm: product.gsm || '240 GSM',
      fabric: product.fabric || 'Heavyweight Loopback Jersey'
    };
  }

  // 4. Default to Oversized T-Shirt (TH3EE's core iconic silhouette)
  return {
    ...DEFAULT_SIZE_CHART_TEMPLATES['oversized-tshirt'],
    productId: product.id || product.slug || 'template-oversized-tshirt',
    productName: product.name || 'TH3EE Oversized Heavyweight Tee',
    fitType: 'Oversized',
    gsm: product.gsm || '290 GSM',
    fabric: product.fabric || '100% Combed Terry Cotton'
  };
}


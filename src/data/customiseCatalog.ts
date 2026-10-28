import type {
  CustomisationCatalogConfig,
  GarmentFitOption,
  ColorSwatch,
  FabricSpec,
  PrintPlacementDefinition
} from '../types/customise';

export const DEFAULT_FIT_OPTIONS: GarmentFitOption[] = [
  {
    id: 'Oversized',
    name: 'Oversized',
    tagline: 'Signature Streetwear Drape',
    silhouette: 'Relaxed drop-shoulder silhouette with generous chest room and modern streetwear proportions.',
    shoulderStyle: 'Dropped shoulder seam (4-6 cm below natural shoulder point)',
    bodyDrape: 'Loose, structured drape that holds its boxy form without clinging.',
    recommendedUse: 'Streetwear statements, graphic illustrations, back-print masterpieces, and lifestyle daily wear.',
    measurements: [
      { size: 'XS', chestCm: 102, chestIn: 40, lengthCm: 71, lengthIn: 28, shoulderCm: 51, shoulderIn: 20, sleeveCm: 21.5, sleeveIn: 8.5 },
      { size: 'S',  chestCm: 107, chestIn: 42, lengthCm: 74, lengthIn: 29, shoulderCm: 53.5, shoulderIn: 21, sleeveCm: 23, sleeveIn: 9 },
      { size: 'M',  chestCm: 112, chestIn: 44, lengthCm: 76, lengthIn: 30, shoulderCm: 56, shoulderIn: 22, sleeveCm: 24, sleeveIn: 9.5 },
      { size: 'L',  chestCm: 117, chestIn: 46, lengthCm: 79, lengthIn: 31, shoulderCm: 58.5, shoulderIn: 23, sleeveCm: 25.5, sleeveIn: 10 },
      { size: 'XL', chestCm: 122, chestIn: 48, lengthCm: 81, lengthIn: 32, shoulderCm: 61, shoulderIn: 24, sleeveCm: 26.5, sleeveIn: 10.5 },
      { size: 'XXL',chestCm: 127, chestIn: 50, lengthCm: 84, lengthIn: 33, shoulderCm: 63.5, shoulderIn: 25, sleeveCm: 28, sleeveIn: 11 }
    ]
  },
  {
    id: 'Regular Fit',
    name: 'Regular Fit',
    tagline: 'Timeless Standard Proportions',
    silhouette: 'Conventional tailoring with natural shoulder alignment, tapered sleeves, and balanced body length.',
    shoulderStyle: 'Natural shoulder alignment sitting exactly on the acromion bone.',
    bodyDrape: 'Clean, versatile contour that follows the torso with comfortable ease of movement.',
    recommendedUse: 'Subtle left-chest emblems, corporate merchandise, uniform branding, and clean minimal aesthetic.',
    measurements: [
      { size: 'XS', chestCm: 91,  chestIn: 36, lengthCm: 67, lengthIn: 26.5, shoulderCm: 42, shoulderIn: 16.5, sleeveCm: 19, sleeveIn: 7.5 },
      { size: 'S',  chestCm: 96,  chestIn: 38, lengthCm: 70, lengthIn: 27.5, shoulderCm: 44.5, shoulderIn: 17.5, sleeveCm: 20.5, sleeveIn: 8 },
      { size: 'M',  chestCm: 102, chestIn: 40, lengthCm: 72, lengthIn: 28.5, shoulderCm: 47, shoulderIn: 18.5, sleeveCm: 21.5, sleeveIn: 8.5 },
      { size: 'L',  chestCm: 107, chestIn: 42, lengthCm: 75, lengthIn: 29.5, shoulderCm: 49.5, shoulderIn: 19.5, sleeveCm: 23, sleeveIn: 9 },
      { size: 'XL', chestCm: 112, chestIn: 44, lengthCm: 77, lengthIn: 30.5, shoulderCm: 52, shoulderIn: 20.5, sleeveCm: 24, sleeveIn: 9.5 },
      { size: 'XXL',chestCm: 117, chestIn: 46, lengthCm: 80, lengthIn: 31.5, shoulderCm: 54.5, shoulderIn: 21.5, sleeveCm: 25.5, sleeveIn: 10 }
    ]
  },
  {
    id: 'Boxy Fit',
    name: 'Boxy Fit',
    tagline: 'Wide Torso & Cropped Proportion',
    silhouette: 'Modern Japanese streetwear silhouette with extra-wide chest circumference and shorter hemline.',
    shoulderStyle: 'Wide dropped shoulder line with open, boxy armholes.',
    bodyDrape: 'Sharp rectangular drape that sits cleanly above the hip line without ballooning.',
    recommendedUse: 'High-fashion graphics, bold typographic prints, contemporary layering, and heavyweight drape.',
    measurements: [
      { size: 'XS', chestCm: 107, chestIn: 42, lengthCm: 63.5, lengthIn: 25, shoulderCm: 53.5, shoulderIn: 21, sleeveCm: 20.5, sleeveIn: 8 },
      { size: 'S',  chestCm: 112, chestIn: 44, lengthCm: 66,   lengthIn: 26, shoulderCm: 56,   shoulderIn: 22, sleeveCm: 21.5, sleeveIn: 8.5 },
      { size: 'M',  chestCm: 117, chestIn: 46, lengthCm: 68.5, lengthIn: 27, shoulderCm: 58.5, shoulderIn: 23, sleeveCm: 23,   sleeveIn: 9 },
      { size: 'L',  chestCm: 122, chestIn: 48, lengthCm: 71,   lengthIn: 28, shoulderCm: 61,   shoulderIn: 24, sleeveCm: 24,   sleeveIn: 9.5 },
      { size: 'XL', chestCm: 127, chestIn: 50, lengthCm: 73.5, lengthIn: 29, shoulderCm: 63.5, shoulderIn: 25, sleeveCm: 25.5, sleeveIn: 10 },
      { size: 'XXL',chestCm: 132, chestIn: 52, lengthCm: 76,   lengthIn: 30, shoulderCm: 66,   shoulderIn: 26, sleeveCm: 26.5, sleeveIn: 10.5 }
    ]
  }
];

export const DEFAULT_COLOR_SWATCHES: ColorSwatch[] = [
  { name: 'Jet Black', hex: '#111111', border: '#222222', badge: 'Signature Core' },
  { name: 'Optical White', hex: '#FFFFFF', border: '#E5E5E5', badge: 'High Contrast' },
  { name: 'Anthracite Charcoal', hex: '#27272A', border: '#3F3F46', badge: 'Deep Slate' },
  { name: 'Heather Grey', hex: '#8C9298', border: '#9DA3A9', badge: 'Sport Mélange' },
  { name: 'Light Ash Grey', hex: '#D1D5DB', border: '#E5E7EB', badge: 'Minimal' },
  { name: 'Royal Navy', hex: '#152238', border: '#1C2E4A', badge: 'Classic Atelier' },
  { name: 'Cobalt Blue', hex: '#1E40AF', border: '#2563EB', badge: 'Electric Hue' },
  { name: 'Sky Mist Blue', hex: '#7DD3FC', border: '#38BDF8', badge: 'Pastel Street' },
  { name: 'Sage Olive', hex: '#5A6B5C', border: '#6B7E6D', badge: 'Mineral Wash' },
  { name: 'Forest Pine', hex: '#1B4332', border: '#2D6A4F', badge: 'Deep Alpine' },
  { name: 'Military Olive', hex: '#4B5320', border: '#5C6527', badge: 'Tactical' },
  { name: 'Vintage Brown', hex: '#3E2723', border: '#4E342E', badge: 'Earthy Hue' },
  { name: 'Mocha Coffee', hex: '#5C4033', border: '#6F4E37', badge: 'Rich Roast' },
  { name: 'Sand Beige', hex: '#D2C2B2', border: '#C2B1A0', badge: 'Subtle Warm' },
  { name: 'Desert Khaki', hex: '#C2B280', border: '#A89765', badge: 'Neutral Tone' },
  { name: 'Crimson Maroon', hex: '#58111A', border: '#731622', badge: 'Royal Edition' },
  { name: 'Cherry Red', hex: '#B91C1C', border: '#DC2626', badge: 'Bold Accent' },
  { name: 'Terracotta Rust', hex: '#9C412C', border: '#B44E36', badge: 'Artisan Clay' },
  { name: 'Dusty Rose', hex: '#C48B8B', border: '#B37878', badge: 'Blush' },
  { name: 'Lavender Lilac', hex: '#7C6E8F', border: '#9081A4', badge: 'Vapour' },
  { name: 'Mustard Ochre', hex: '#C28828', border: '#A87520', badge: 'Warm Glow' },
  { name: 'Washed Teal', hex: '#2E6F74', border: '#3B8B91', badge: 'Pacific' }
];

export const DEFAULT_FABRIC_SPECS: FabricSpec[] = [
  {
    name: '240 GSM Luxury French Terry Cotton',
    composition: '100% Combed Ring-Spun Cotton',
    gsm: '240 GSM',
    weave: 'Tight loopback single jersey with bio-silicon wash',
    feel: 'Heavyweight, buttery smooth surface, breathable and ultra-durable',
    description: 'Our flagship custom apparel blank crafted in Tirupati. Engineered specifically for Direct-to-Film (DTF) vibrancy and zero distortion over 50+ wash cycles.',
    fits: ['Oversized', 'Boxy Fit']
  },
  {
    name: '200 GSM Premium Combed Cotton',
    composition: '100% Super-Combed Long-Staple Cotton',
    gsm: '200 GSM',
    weave: 'Compact combed jersey with pre-shrunk enzyme wash',
    feel: 'Substantial medium-heavy weight with gentle cool-touch finish',
    description: 'Perfect year-round versatility. Provides sharp print transfer edges with a soft, natural drape.',
    fits: ['Oversized', 'Regular Fit', 'Boxy Fit']
  },
  {
    name: '180 GSM Everyday Core Cotton',
    composition: '100% Bio-Washed Combed Cotton',
    gsm: '180 GSM',
    weave: 'Fine gauge jersey with anti-pilling treatment',
    feel: 'Lightweight, ultra-breathable, and soft against the skin',
    description: 'Ideal for tropical summers, bulk team merchandise, and high-movement everyday wear.',
    fits: ['Regular Fit']
  }
];

export const DEFAULT_PRINT_PLACEMENTS: PrintPlacementDefinition[] = [
  {
    id: 'front_chest',
    label: 'Left Chest Print',
    zone: 'front',
    description: 'Classic subtle pocket-area placement. Ideal for logos, brand monograms, and small emblems.',
    defaultDimensions: '4" × 4" (10 × 10 cm)',
    recommendedSizes: ['small', 'medium'],
    highlightCoordinates: { x: 57, y: 35, width: 14, height: 14 }
  },
  {
    id: 'center_chest',
    label: 'Center Chest Print',
    zone: 'front',
    description: 'High-impact focal zone centered across upper torso. Ideal for typographic statements and mid-sized art.',
    defaultDimensions: '8" × 6" (20 × 15 cm)',
    recommendedSizes: ['medium', 'large'],
    highlightCoordinates: { x: 38, y: 33, width: 24, height: 16 }
  },
  {
    id: 'large_front',
    label: 'Large Front Print',
    zone: 'front',
    description: 'Expansive front coverage spanning the chest down to mid-torso. Maximum visual presence.',
    defaultDimensions: '12" × 16" (30 × 40 cm)',
    recommendedSizes: ['large', 'full_print', 'custom'],
    highlightCoordinates: { x: 32, y: 30, width: 36, height: 38 }
  },
  {
    id: 'upper_back',
    label: 'Upper Back / Nape',
    zone: 'back',
    description: 'Sleek placement beneath collar rim. Ideal for tagline, atelier stamp, or discreet branding.',
    defaultDimensions: '10" × 4" (25 × 10 cm)',
    recommendedSizes: ['small', 'medium'],
    highlightCoordinates: { x: 35, y: 24, width: 30, height: 12 }
  },
  {
    id: 'full_back',
    label: 'Full Back Masterpiece',
    zone: 'back',
    description: 'Our most popular streetwear canvas. Full-spread HD Direct-to-Film printing across the entire back.',
    defaultDimensions: '14" × 18" (35 × 45 cm)',
    recommendedSizes: ['large', 'full_print', 'custom'],
    highlightCoordinates: { x: 30, y: 26, width: 40, height: 44 }
  },
  {
    id: 'left_sleeve',
    label: 'Left Sleeve Bicep',
    zone: 'sleeve',
    description: 'Subtle accent on the outer left sleeve. Ideal for flags, squad numbers, or mini icons.',
    defaultDimensions: '3.5" × 3.5" (9 × 9 cm)',
    recommendedSizes: ['small'],
    highlightCoordinates: { x: 14, y: 34, width: 10, height: 10 }
  },
  {
    id: 'right_sleeve',
    label: 'Right Sleeve Bicep',
    zone: 'sleeve',
    description: 'Subtle accent on outer right sleeve. Balances front or back artwork.',
    defaultDimensions: '3.5" × 3.5" (9 × 9 cm)',
    recommendedSizes: ['small'],
    highlightCoordinates: { x: 76, y: 34, width: 10, height: 10 }
  },
  {
    id: 'both_sleeves',
    label: 'Both Sleeves Matching',
    zone: 'sleeve',
    description: 'Symmetrical print placement on left and right sleeves.',
    defaultDimensions: '3.5" × 3.5" on each sleeve',
    recommendedSizes: ['small'],
    highlightCoordinates: { x: 14, y: 34, width: 72, height: 10 }
  },
  {
    id: 'custom',
    label: 'Custom Placement',
    zone: 'front',
    description: 'Off-center, hemline, collar-wrap, or multi-location custom coordination. Handled directly with atelier team.',
    defaultDimensions: 'Specify in notes',
    recommendedSizes: ['custom'],
    highlightCoordinates: { x: 25, y: 25, width: 50, height: 50 }
  }
];

export const INITIAL_CUSTOMISATION_CATALOG: CustomisationCatalogConfig = {
  fits: DEFAULT_FIT_OPTIONS,
  categories: ['T-Shirt', 'Hoodie'],
  sleeves: ['Half Sleeve', 'Full Sleeve'],
  neckTypes: ['Round Neck', 'Polo Neck'],
  fabrics: DEFAULT_FABRIC_SPECS,
  colors: DEFAULT_COLOR_SWATCHES,
  placements: DEFAULT_PRINT_PLACEMENTS,
  basePrices: {
    baseTshirt: 599,
    baseHoodie: 1299,
    frontPrint: 150,
    backPrint: 180,
    sleevePrint: 90,
    fullPrint: 250,
    customPrint: 200
  }
};

export type GenderFit = 'mens' | 'womens' | 'unisex';

export type FitPreference = 'snug' | 'regular' | 'oversized';

export type HeightUnit = 'cm' | 'ft_in';

export type WeightUnit = 'kg' | 'lbs';

export type MeasurementUnit = 'cm' | 'in';

export interface BodyProfile {
  gender: GenderFit;
  heightCm: number;
  heightUnit: HeightUnit;
  weightKg: number;
  weightUnit: WeightUnit;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  fitPreference: FitPreference;
}

export interface GarmentMeasurementEntry {
  size: string; // 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  chestCm: number;
  shoulderCm: number;
  lengthCm: number;
  sleeveCm: number;
  waistCm?: number;
  hipCm?: number;
  isAvailable?: boolean;
}

export interface ProductSizeChart {
  id?: string;
  productId: string; // Product id, slug, or 'default'
  productName?: string;
  category: string; // 'T-Shirts' | 'Hoodies & Sweats' | 'Custom DTF' | string
  fitType: 'Oversized' | 'Regular Fit' | 'Boxy Fit' | 'Slim Fit' | string;
  gsm?: string;
  fabric?: string;
  description?: string;
  measurements: GarmentMeasurementEntry[];
  preferredFitRecommendation?: string;
  updatedAt?: string;
}

export type FitAreaSentiment = 'positive' | 'warning' | 'info';

export interface BodyAreaFit {
  area: 'Chest' | 'Waist' | 'Hips' | 'Length';
  status: 'Just right' | 'Slightly snug' | 'Roomy' | 'Snug' | 'Very roomy' | 'Short' | 'Slightly short' | 'Slightly long' | 'Long';
  sentiment: FitAreaSentiment;
  deltaCm?: number;
  percentage?: number; // 0 - 100 for gauge visualization (0=Snug, 50=Just right, 100=Roomy)
}

export interface SizeComparisonDetail {
  size: string;
  chestFit: string;
  waistFit: string;
  hipsFit: string;
  lengthFit: string;
  overallFit: string;
  bodyAreas: BodyAreaFit[];
  isAvailable: boolean;
  score: number;
}

export interface SizeRecommendationResult {
  recommendedSize: string;
  confidenceScore: number; // e.g. 96
  confidenceLevel: 'High' | 'Medium' | 'Estimated';
  explanation: string;
  fitBreakdown: BodyAreaFit[];
  sizeComparisons: Record<string, SizeComparisonDetail>;
  isRecommendedSizeInStock: boolean;
  alternativeRecommendedSize?: string;
  alternativeExplanation?: string;
  productTitle: string;
  fitType: string;
}


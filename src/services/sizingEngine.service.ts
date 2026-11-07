import type {
  BodyProfile,
  ProductSizeChart,
  SizeRecommendationResult,
  BodyAreaFit,
  SizeComparisonDetail,
  FitPreference
} from '../types/sizing';
import type { Product } from '../types/store';

// Conversion constants
export const CM_PER_INCH = 2.54;
export const LBS_PER_KG = 2.20462;

export function cmToInches(cm: number): number {
  return Math.round((cm / CM_PER_INCH) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * CM_PER_INCH * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG);
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / LBS_PER_KG) * 10) / 10;
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round(((feet * 12) + inches) * CM_PER_INCH * 10) / 10;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}

/**
 * Validates whether the provided body profile has realistic metrics.
 */
export function validateBodyProfile(profile: Partial<BodyProfile>): { isValid: boolean; error?: string } {
  if (!profile.heightCm || profile.heightCm < 120 || profile.heightCm > 230) {
    return { isValid: false, error: 'Please enter a valid height between 120 cm (3\'11") and 230 cm (7\'6").' };
  }
  if (!profile.weightKg || profile.weightKg < 30 || profile.weightKg > 180) {
    return { isValid: false, error: 'Please enter a valid weight between 30 kg (66 lbs) and 180 kg (396 lbs).' };
  }
  if (profile.chestCm && (profile.chestCm < 60 || profile.chestCm > 160)) {
    return { isValid: false, error: 'Optional chest measurement must be between 60 cm and 160 cm.' };
  }
  if (profile.waistCm && (profile.waistCm < 50 || profile.waistCm > 160)) {
    return { isValid: false, error: 'Optional waist measurement must be between 50 cm and 160 cm.' };
  }
  if (profile.hipsCm && (profile.hipsCm < 60 || profile.hipsCm > 170)) {
    return { isValid: false, error: 'Optional hips measurement must be between 60 cm and 170 cm.' };
  }
  return { isValid: true };
}

/**
 * Calculates anthropometric body estimations (chest, waist, hips, torso length)
 * from height, weight, and gender if not explicitly entered by the customer.
 */
export function estimateBodyDimensions(profile: BodyProfile): {
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  torsoHeightCm: number;
  bmi: number;
  hasDirectChest: boolean;
  hasDirectWaist: boolean;
  hasDirectHips: boolean;
} {
  const height = profile.heightCm;
  const weight = profile.weightKg;
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  // Torso is approximately 38-42% of total height
  const torsoHeightCm = height * 0.40;

  let estChest: number;
  let estWaist: number;
  let estHips: number;

  if (profile.gender === 'womens') {
    // Female anatomical model calibrated baseline
    estChest = 0.41 * height + 0.33 * weight;
    estWaist = 0.30 * height + 0.35 * weight;
    estHips = 0.42 * height + 0.45 * weight;
  } else {
    // Men's & Unisex anatomical model calibrated baseline
    estChest = 0.42 * height + 0.30 * weight;
    estWaist = 0.33 * height + 0.35 * weight;
    estHips = 0.38 * height + 0.40 * weight;
  }

  return {
    chestCm: Math.round(profile.chestCm || estChest),
    waistCm: Math.round(profile.waistCm || estWaist),
    hipsCm: Math.round(profile.hipsCm || estHips),
    torsoHeightCm: Math.round(torsoHeightCm),
    bmi: Math.round(bmi * 10) / 10,
    hasDirectChest: Boolean(profile.chestCm && profile.chestCm > 0),
    hasDirectWaist: Boolean(profile.waistCm && profile.waistCm > 0),
    hasDirectHips: Boolean(profile.hipsCm && profile.hipsCm > 0),
  };
}

/**
 * Computes targeted garment ease (wearing ease in cm over raw body circumference)
 * depending on garment silhouette, fabric/GSM, category, and customer's fit preference.
 */
function getGarmentEaseRequirements(
  chart: ProductSizeChart,
  fitPref: FitPreference
): {
  idealChestEaseCm: number;
  minChestEaseCm: number;
  idealWaistEaseCm: number;
  idealLengthRatio: number;
} {
  const isHoodie = (chart.category || '').toLowerCase().includes('hoodie') ||
    (chart.productName || '').toLowerCase().includes('hoodie');

  const fitType = (chart.fitType || '').toLowerCase();

  // Baseline target chest ease (garment chest - body chest)
  let idealChestEase = 12; // Standard comfortable ease
  let minChestEase = 4;
  let idealWaistEase = 12;
  let idealLengthRatio = 0.44; // Garment length as proportion of height

  if (isHoodie) {
    // Heavyweight fleece layering requires greater chest & shoulder ease (+16 to 22 cm)
    idealChestEase = 20;
    minChestEase = 10;
    idealWaistEase = 16;
    idealLengthRatio = 0.43;
  } else if (fitType.includes('oversized')) {
    // TH3EE drop-shoulder signature box cut (+14 to 18 cm)
    idealChestEase = 16;
    minChestEase = 8;
    idealWaistEase = 14;
    idealLengthRatio = 0.44;
  } else if (fitType.includes('boxy')) {
    // Japanese wide crop cut (+18 cm chest, shorter length)
    idealChestEase = 18;
    minChestEase = 10;
    idealWaistEase = 16;
    idealLengthRatio = 0.40;
  } else if (fitType.includes('regular') || fitType.includes('classic')) {
    // Regular standard fit (+8 to 12 cm chest)
    idealChestEase = 10;
    minChestEase = 4;
    idealWaistEase = 8;
    idealLengthRatio = 0.42;
  } else if (fitType.includes('slim')) {
    // Slim tailored (+4 to 6 cm chest)
    idealChestEase = 6;
    minChestEase = 2;
    idealWaistEase = 5;
    idealLengthRatio = 0.41;
  }

  // Adjust for user's personal drape preference:
  if (fitPref === 'snug') {
    idealChestEase -= 5;
    minChestEase -= 2;
    idealWaistEase -= 4;
  } else if (fitPref === 'oversized') {
    idealChestEase += 6;
    minChestEase += 3;
    idealWaistEase += 5;
  }

  return {
    idealChestEaseCm: idealChestEase,
    minChestEaseCm: minChestEase,
    idealWaistEaseCm: idealWaistEase,
    idealLengthRatio
  };
}

/**
 * Evaluates how a specific garment size fits against estimated/direct body dimensions.
 */
function evaluateSingleSizeFit(
  garment: {
    size: string;
    chestCm: number;
    lengthCm: number;
    shoulderCm: number;
    sleeveCm: number;
    waistCm?: number;
    hipCm?: number;
    isAvailable?: boolean;
  },
  body: {
    chestCm: number;
    waistCm: number;
    hipsCm: number;
    torsoHeightCm: number;
    height: number;
  },
  ease: {
    idealChestEaseCm: number;
    minChestEaseCm: number;
    idealWaistEaseCm: number;
    idealLengthRatio: number;
  }
): {
  score: number;
  bodyAreas: BodyAreaFit[];
  chestFit: string;
  waistFit: string;
  hipsFit: string;
  lengthFit: string;
  overallFit: string;
} {
  const actualChestEase = garment.chestCm - body.chestCm;
  const actualWaistEase = (garment.waistCm || garment.chestCm * 0.96) - body.waistCm;
  const actualHipEase = (garment.hipCm || garment.chestCm) - body.hipsCm;
  const actualLengthRatio = garment.lengthCm / body.height;

  // 1. CHEST EVALUATION
  let chestStatus: BodyAreaFit['status'];
  let chestSentiment: BodyAreaFit['sentiment'];
  let chestPct: number;

  const chestDeltaFromIdeal = actualChestEase - ease.idealChestEaseCm;

  if (actualChestEase < ease.minChestEaseCm - 2) {
    chestStatus = 'Snug';
    chestSentiment = 'warning';
    chestPct = 15;
  } else if (actualChestEase < ease.minChestEaseCm + 2) {
    chestStatus = 'Slightly snug';
    chestSentiment = 'warning';
    chestPct = 32;
  } else if (chestDeltaFromIdeal >= -4 && chestDeltaFromIdeal <= 6) {
    chestStatus = 'Just right';
    chestSentiment = 'positive';
    chestPct = 50;
  } else if (chestDeltaFromIdeal > 6 && chestDeltaFromIdeal <= 14) {
    chestStatus = 'Roomy';
    chestSentiment = 'info';
    chestPct = 78;
  } else {
    chestStatus = 'Very roomy';
    chestSentiment = 'info';
    chestPct = 95;
  }

  // 2. WAIST EVALUATION
  let waistStatus: BodyAreaFit['status'];
  let waistSentiment: BodyAreaFit['sentiment'];
  let waistPct: number;

  if (actualWaistEase < 2) {
    waistStatus = 'Snug';
    waistSentiment = 'warning';
    waistPct = 18;
  } else if (actualWaistEase < 6) {
    waistStatus = 'Slightly snug';
    waistSentiment = 'warning';
    waistPct = 34;
  } else if (actualWaistEase <= 18) {
    waistStatus = 'Just right';
    waistSentiment = 'positive';
    waistPct = 50;
  } else {
    waistStatus = 'Roomy';
    waistSentiment = 'info';
    waistPct = 80;
  }

  // 3. HIPS EVALUATION
  let hipsStatus: BodyAreaFit['status'];
  let hipsSentiment: BodyAreaFit['sentiment'];
  let hipsPct: number;

  if (actualHipEase < 0) {
    hipsStatus = 'Snug';
    hipsSentiment = 'warning';
    hipsPct = 20;
  } else if (actualHipEase < 5) {
    hipsStatus = 'Slightly snug';
    hipsSentiment = 'warning';
    hipsPct = 35;
  } else if (actualHipEase <= 16) {
    hipsStatus = 'Just right';
    hipsSentiment = 'positive';
    hipsPct = 50;
  } else {
    hipsStatus = 'Roomy';
    hipsSentiment = 'info';
    hipsPct = 82;
  }

  // 4. LENGTH EVALUATION
  let lengthStatus: BodyAreaFit['status'];
  let lengthSentiment: BodyAreaFit['sentiment'];
  let lengthPct: number;

  const lengthDiffCm = garment.lengthCm - (body.height * ease.idealLengthRatio);

  if (lengthDiffCm < -4) {
    lengthStatus = 'Short';
    lengthSentiment = 'warning';
    lengthPct = 15;
  } else if (lengthDiffCm < -1.5) {
    lengthStatus = 'Slightly short';
    lengthSentiment = 'warning';
    lengthPct = 32;
  } else if (lengthDiffCm <= 3.5) {
    lengthStatus = 'Just right';
    lengthSentiment = 'positive';
    lengthPct = 50;
  } else if (lengthDiffCm <= 7) {
    lengthStatus = 'Slightly long';
    lengthSentiment = 'info';
    lengthPct = 75;
  } else {
    lengthStatus = 'Long';
    lengthSentiment = 'info';
    lengthPct = 92;
  }

  // Compute closeness penalty score (lower is closer, 0 is perfect)
  const chestPenalty = Math.abs(chestDeltaFromIdeal) * 3;
  const waistPenalty = actualWaistEase < 4 ? Math.abs(actualWaistEase - 8) * 2 : 0;
  const lengthPenalty = Math.abs(lengthDiffCm) * 1.5;
  const unwearablePenalty = actualChestEase < 0 ? 100 : 0;

  const totalScore = chestPenalty + waistPenalty + lengthPenalty + unwearablePenalty;

  const bodyAreas: BodyAreaFit[] = [
    { area: 'Chest', status: chestStatus, sentiment: chestSentiment, deltaCm: Math.round(actualChestEase), percentage: chestPct },
    { area: 'Waist', status: waistStatus, sentiment: waistSentiment, deltaCm: Math.round(actualWaistEase), percentage: waistPct },
    { area: 'Hips', status: hipsStatus, sentiment: hipsSentiment, deltaCm: Math.round(actualHipEase), percentage: hipsPct },
    { area: 'Length', status: lengthStatus, sentiment: lengthSentiment, deltaCm: Math.round(lengthDiffCm), percentage: lengthPct },
  ];

  let overall = 'Best Fit';
  if (chestStatus === 'Snug' || lengthStatus === 'Short') {
    overall = 'Snug Fit';
  } else if (chestStatus === 'Very roomy' || lengthStatus === 'Long') {
    overall = 'Oversized Drape';
  } else if (chestStatus === 'Roomy') {
    overall = 'Relaxed Fit';
  } else if (chestStatus === 'Slightly snug') {
    overall = 'Fitted Contour';
  }

  return {
    score: totalScore,
    bodyAreas,
    chestFit: chestStatus,
    waistFit: waistStatus,
    hipsFit: hipsStatus,
    lengthFit: lengthStatus,
    overallFit: overall
  };
}

/**
 * MAIN ENGINE CALCULATION:
 * Takes product data, product-specific size chart, and user's body profile.
 * Computes recommendation, dynamic comparison across all sizes, and inventory checks.
 */
export function calculateRecommendedSize(
  chart: ProductSizeChart,
  profile: BodyProfile,
  product?: Partial<Product>,
  selectedColor?: string
): SizeRecommendationResult {
  const body = estimateBodyDimensions(profile);
  const ease = getGarmentEaseRequirements(chart, profile.fitPreference);

  const measurements = chart.measurements && chart.measurements.length > 0
    ? chart.measurements
    : [];

  if (measurements.length === 0) {
    throw new Error('Please refer to our size chart or contact us for assistance.');
  }

  // Check inventory availability from product object if provided
  const inventory = product?.inventory;
  const availableProductSizes = product?.availableSizes || measurements.map(m => m.size);

  const comparisons: Record<string, SizeComparisonDetail> = {};
  let bestSize = measurements[0].size;
  let minScore = Infinity;

  measurements.forEach(m => {
    const evalResult = evaluateSingleSizeFit(
      m,
      {
        chestCm: body.chestCm,
        waistCm: body.waistCm,
        hipsCm: body.hipsCm,
        torsoHeightCm: body.torsoHeightCm,
        height: profile.heightCm
      },
      ease
    );

    // Determine inventory in-stock for this size & color
    let isSizeInStock = (m.isAvailable !== false) && availableProductSizes.includes(m.size);
    if (product && product.inStock === false) {
      isSizeInStock = false;
    } else if (inventory && selectedColor && inventory[selectedColor]) {
      const stockQty = inventory[selectedColor][m.size];
      if (typeof stockQty === 'number' && stockQty <= 0) {
        isSizeInStock = false;
      }
    }

    comparisons[m.size] = {
      size: m.size,
      chestFit: evalResult.chestFit,
      waistFit: evalResult.waistFit,
      hipsFit: evalResult.hipsFit,
      lengthFit: evalResult.lengthFit,
      overallFit: evalResult.overallFit,
      bodyAreas: evalResult.bodyAreas,
      isAvailable: isSizeInStock,
      score: evalResult.score
    };

    if (evalResult.score < minScore) {
      minScore = evalResult.score;
      bestSize = m.size;
    }
  });

  const bestComparison = comparisons[bestSize];
  const isRecommendedInStock = bestComparison ? bestComparison.isAvailable : true;

  // If recommended size is out of stock, find the closest available alternative:
  let alternativeSize: string | undefined;
  let alternativeExplanation: string | undefined;

  if (!isRecommendedInStock) {
    const sortedAvailable = Object.values(comparisons)
      .filter(c => c.isAvailable && c.size !== bestSize)
      .sort((a, b) => a.score - b.score);

    if (sortedAvailable.length > 0) {
      alternativeSize = sortedAvailable[0].size;
      alternativeExplanation = `Size ${bestSize} is currently out of stock in this colour. We recommend Size ${alternativeSize} (${sortedAvailable[0].overallFit.toLowerCase()}) as the closest available match.`;
    }
  }

  // Calculate confidence score and level
  let confidenceScore = 92;
  let confidenceLevel: SizeRecommendationResult['confidenceLevel'] = 'Medium';

  if (body.hasDirectChest) {
    confidenceScore += 5;
    confidenceLevel = 'High';
  }
  if (body.hasDirectWaist && body.hasDirectHips) {
    confidenceScore += 2;
  }
  if (minScore < 8) {
    confidenceScore = Math.min(99, confidenceScore + 2);
  } else if (minScore > 25) {
    confidenceScore = Math.max(78, confidenceScore - 10);
    confidenceLevel = 'Estimated';
  }

  // Human-readable explanation tailored to customer & product specs
  const productTitle = chart.productName || product?.name || 'Silhouette';
  const fitTypeName = chart.fitType || 'Oversized';
  const chestText = body.hasDirectChest ? `chest measurement (${body.chestCm} cm)` : `proportions`;
  
  const explanation = `Based on your height (${profile.heightCm} cm), weight (${profile.weightKg} kg) and ${chestText}, size ${bestSize} is the closest match for this ${fitTypeName} silhouette.`;

  return {
    recommendedSize: bestSize,
    confidenceScore,
    confidenceLevel,
    explanation,
    fitBreakdown: bestComparison ? bestComparison.bodyAreas : [],
    sizeComparisons: comparisons,
    isRecommendedSizeInStock: isRecommendedInStock,
    alternativeRecommendedSize: alternativeSize,
    alternativeExplanation,
    productTitle,
    fitType: fitTypeName
  };
}


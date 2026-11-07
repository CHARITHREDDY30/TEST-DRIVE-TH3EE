import React, { useState, useEffect } from 'react';
import {
  X,
  Ruler,
  Check,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Info,
  RotateCcw,
  AlertTriangle,
  Minus,
  Plus,
  Table,
  HelpCircle
} from 'lucide-react';
import type {
  GenderFit,
  FitPreference,
  HeightUnit,
  WeightUnit,
  MeasurementUnit,
  BodyProfile,
  ProductSizeChart,
  SizeRecommendationResult,
  BodyAreaFit
} from '../../types/sizing';
import type { Product } from '../../types/store';
import { HumanBodyIllustration } from './HumanBodyIllustration';
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm,
  calculateRecommendedSize,
  validateBodyProfile
} from '../../services/sizingEngine.service';
import { sizingService } from '../../services/sizing.service';

interface SizeFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedColor: string;
  onSelectSize: (size: string) => void;
  currentSelectedSize?: string;
  initialTab?: 'finder' | 'chart';
}

export const SizeFinderModal: React.FC<SizeFinderModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedColor,
  onSelectSize,
  currentSelectedSize,
  initialTab = 'finder'
}) => {
  // Top-level modal tab: 'finder' (Smart Guided Finder) or 'chart' (Raw Garment Measurement Table)
  const [activeModalTab, setActiveModalTab] = useState<'finder' | 'chart'>(initialTab);

  // Wizard Navigation for Finder: 1 = Profile, 2 = Measurements, 3 = Results
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isCalculating, setIsCalculating] = useState(false);

  // Sizing Profile State
  const [gender, setGender] = useState<GenderFit>('mens');
  const [fitPreference, setFitPreference] = useState<FitPreference>('regular');

  // Height State
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCm, setHeightCm] = useState<number>(175);
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(9);

  // Weight State
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weightKg, setWeightKg] = useState<number>(72);
  const [weightLbs, setWeightLbs] = useState<number>(158);

  // Optional Body Measurements
  const [optionalUnit, setOptionalUnit] = useState<MeasurementUnit>('cm');
  const [chestVal, setChestVal] = useState<string>('');
  const [waistVal, setWaistVal] = useState<string>('');
  const [hipsVal, setHipsVal] = useState<string>('');
  const [activeIllustrationArea, setActiveIllustrationArea] = useState<
    'chest' | 'waist' | 'hips' | 'height' | 'weight' | null
  >(null);

  // Size Chart Table Unit (CM / IN)
  const [chartUnit, setChartUnit] = useState<'cm' | 'in'>('cm');

  // Sizing Data & Results
  const [productChart, setProductChart] = useState<ProductSizeChart | null>(null);
  const [recommendation, setRecommendation] = useState<SizeRecommendationResult | null>(null);
  const [activeComparisonSize, setActiveComparisonSize] = useState<string>('L');
  const [calculationError, setCalculationError] = useState<string>('');

  // Prevent background scrolling when open & load sizing data
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveModalTab(initialTab);
      // Load product size chart
      sizingService.getSizeChartForProduct(product).then(chart => {
        setProductChart(chart);
      });
    } else {
      document.body.style.overflow = '';
      setStep(1);
      setCalculationError('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product, initialTab]);

  // Keep feet/inches in sync with cm
  const updateHeightCm = (newCm: number) => {
    const clamped = Math.max(130, Math.min(220, Math.round(newCm)));
    setHeightCm(clamped);
    const { feet, inches } = cmToFeetInches(clamped);
    setHeightFeet(feet);
    setHeightInches(inches);
  };

  const updateHeightFeetInches = (newFeet: number, newInches: number) => {
    const f = Math.max(4, Math.min(7, newFeet));
    const i = Math.max(0, Math.min(11, newInches));
    setHeightFeet(f);
    setHeightInches(i);
    const convertedCm = feetInchesToCm(f, i);
    setHeightCm(Math.round(convertedCm));
  };

  // Keep lbs in sync with kg
  const updateWeightKg = (newKg: number) => {
    const clamped = Math.max(35, Math.min(160, Math.round(newKg)));
    setWeightKg(clamped);
    setWeightLbs(kgToLbs(clamped));
  };

  const updateWeightLbs = (newLbs: number) => {
    const clamped = Math.max(77, Math.min(350, Math.round(newLbs)));
    setWeightLbs(clamped);
    setWeightKg(Math.round(lbsToKg(clamped)));
  };

  // Optional measurements conversions
  const getParsedOptionalCm = (valStr: string): number | undefined => {
    const num = parseFloat(valStr);
    if (isNaN(num) || num <= 0) return undefined;
    return optionalUnit === 'in' ? Math.round(inchesToCm(num)) : Math.round(num);
  };

  // Run calculation
  const handleCalculate = () => {
    setCalculationError('');
    const profile: BodyProfile = {
      gender,
      heightCm,
      heightUnit,
      weightKg,
      weightUnit,
      chestCm: getParsedOptionalCm(chestVal),
      waistCm: getParsedOptionalCm(waistVal),
      hipsCm: getParsedOptionalCm(hipsVal),
      fitPreference
    };

    const validation = validateBodyProfile(profile);
    if (!validation.isValid) {
      setCalculationError(validation.error || 'Please review your inputs.');
      return;
    }

    setIsCalculating(true);

    setTimeout(() => {
      try {
        const chart = productChart || sizingService.getSizeChartForProductSync(product);
        const result = calculateRecommendedSize(chart, profile, product, selectedColor);
        setRecommendation(result);
        setActiveComparisonSize(result.recommendedSize);
        setIsCalculating(false);
        setStep(3);
      } catch (err: any) {
        setIsCalculating(false);
        setCalculationError(err.message || 'Unable to calculate sizing for this item.');
      }
    }, 450); // Subtle processing animation
  };

  // Handle final size selection
  const handleApplySize = (sizeToApply: string) => {
    onSelectSize(sizeToApply);
    onClose();
  };

  if (!isOpen) return null;

  const currentComparison = recommendation?.sizeComparisons[activeComparisonSize];
  const allChartSizes = productChart?.measurements.map(m => m.size) || ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-finder-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs font-mono"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Container */}
      <div className="relative bg-[#FAFAF8] border border-neutral-300 text-neutral-900 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between z-10 transition-all font-sans">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-[#FAFAF8]/95 backdrop-blur-md px-5 sm:px-8 pt-5 pb-4 border-b border-neutral-200/90 z-20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E51E2B] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                TH3EE ATELIER · FIT ARCHITECTURE
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-200/50 rounded-full transition-colors cursor-pointer"
              aria-label="Close size finder"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 id="size-finder-title" className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
                {activeModalTab === 'chart'
                  ? 'Garment Measurement Specs'
                  : step === 3
                  ? 'Your Recommended Fit'
                  : 'Find Your Perfect Size'}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5 font-mono truncate max-w-md">
                Silhouette: <span className="font-bold text-neutral-800">{product.name}</span> ({product.category})
              </p>
            </div>

            {/* Stepper indicator if in Finder */}
            {activeModalTab === 'finder' && (
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold shrink-0">
                <span className={`px-2 py-0.5 rounded-full ${step >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'}`}>1</span>
                <span className="text-neutral-300">─</span>
                <span className={`px-2 py-0.5 rounded-full ${step >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'}`}>2</span>
                <span className="text-neutral-300">─</span>
                <span className={`px-2 py-0.5 rounded-full ${step === 3 ? 'bg-[#E51E2B] text-white' : 'bg-neutral-200 text-neutral-500'}`}>3</span>
              </div>
            )}
          </div>

          {/* DUAL MODE TABS: SMART FINDER vs SIZE CHART */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="inline-flex p-1 bg-neutral-200/70 rounded-full border border-neutral-300 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setActiveModalTab('finder')}
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeModalTab === 'finder'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E51E2B]" />
                <span>Smart Size Finder</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('chart')}
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeModalTab === 'chart'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-neutral-400" />
                <span>Garment Size Chart</span>
              </button>
            </div>

            {activeModalTab === 'chart' && (
              <div className="inline-flex p-0.5 bg-neutral-100 rounded-full border border-neutral-200 text-[10px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setChartUnit('cm')}
                  className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                    chartUnit === 'cm' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600'
                  }`}
                >
                  CM
                </button>
                <button
                  type="button"
                  onClick={() => setChartUnit('in')}
                  className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                    chartUnit === 'in' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600'
                  }`}
                >
                  IN
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 space-y-6">
          
          {/* ======================================================== */}
          {/* TAB 2: RAW GARMENT SIZE CHART SPECIFICATION TABLE       */}
          {/* ======================================================== */}
          {activeModalTab === 'chart' && productChart && (
            <div className="space-y-6">
              
              {/* Product Sizing Meta Bar */}
              <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase text-[#E51E2B]">
                      {productChart.fitType} Silhouette
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-xs font-mono text-neutral-500">
                      {productChart.gsm || '290 GSM'} {productChart.fabric || 'Cotton'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 font-sans mt-0.5">
                    {productChart.preferredFitRecommendation || 'Tailored with drop shoulders and relaxed streetwear chest ease.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('finder')}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E51E2B]" />
                  <span>Get My Recommendation</span>
                </button>
              </div>

              {/* Garment Dimensions Table */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs overflow-x-auto">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800">
                    Flat Garment Dimensions ({chartUnit.toUpperCase()})
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Laid flat on cutting table
                  </span>
                </div>

                <table className="w-full text-left text-xs border-collapse mt-2">
                  <thead>
                    <tr className="border-b border-neutral-200 text-[10px] font-mono uppercase font-bold text-neutral-500">
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Chest</th>
                      <th className="py-2.5 px-3">Length</th>
                      <th className="py-2.5 px-3">Shoulder</th>
                      <th className="py-2.5 px-3">Sleeve</th>
                      <th className="py-2.5 px-3">Waist</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {productChart.measurements.map(m => {
                      const isCurrent = currentSelectedSize === m.size;
                      const isRec = recommendation?.recommendedSize === m.size;
                      const isAvail = m.isAvailable !== false;

                      const dispChest = chartUnit === 'in' ? cmToInches(m.chestCm) : m.chestCm;
                      const dispLength = chartUnit === 'in' ? cmToInches(m.lengthCm) : m.lengthCm;
                      const dispShoulder = chartUnit === 'in' ? cmToInches(m.shoulderCm) : m.shoulderCm;
                      const dispSleeve = chartUnit === 'in' ? cmToInches(m.sleeveCm) : m.sleeveCm;
                      const dispWaist = m.waistCm ? (chartUnit === 'in' ? cmToInches(m.waistCm) : m.waistCm) : '—';

                      return (
                        <tr
                          key={m.size}
                          className={`hover:bg-neutral-50 transition-colors ${
                            isCurrent ? 'bg-red-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-neutral-900 flex items-center gap-1.5">
                            <span>{m.size}</span>
                            {isRec && (
                              <span className="bg-[#E51E2B] text-white text-[8px] font-bold px-1.5 py-0.2 rounded-xs uppercase">
                                Best Fit
                              </span>
                            )}
                            {isCurrent && !isRec && (
                              <span className="bg-neutral-900 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-xs uppercase">
                                Selected
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-neutral-700">{dispChest} {chartUnit}</td>
                          <td className="py-3 px-3 text-neutral-700">{dispLength} {chartUnit}</td>
                          <td className="py-3 px-3 text-neutral-700">{dispShoulder} {chartUnit}</td>
                          <td className="py-3 px-3 text-neutral-700">{dispSleeve} {chartUnit}</td>
                          <td className="py-3 px-3 text-neutral-700">{dispWaist}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              disabled={!isAvail}
                              onClick={() => handleApplySize(m.size)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-neutral-900 text-white'
                                  : isAvail
                                  ? 'bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-800'
                                  : 'opacity-40 cursor-not-allowed text-neutral-400'
                              }`}
                            >
                              {isCurrent ? 'Selected' : isAvail ? 'Select' : 'Sold Out'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* How to Measure Quick Instructions */}
              <div className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-neutral-800">
                  <HelpCircle className="w-4 h-4 text-neutral-500" />
                  <span>How We Measure Garments At Tirupati Atelier</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-600 font-sans">
                  <div className="p-2.5 bg-neutral-50 rounded-xl space-y-0.5">
                    <strong className="text-neutral-900 font-mono font-bold text-[11px] uppercase block">
                      Chest Circumference
                    </strong>
                    <p className="text-[11px]">
                      Measured straight across the chest 2.5 cm below the armpit, multiplied by 2 for total circumference.
                    </p>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-xl space-y-0.5">
                    <strong className="text-neutral-900 font-mono font-bold text-[11px] uppercase block">
                      Garment Length
                    </strong>
                    <p className="text-[11px]">
                      Measured vertically from the highest point of the shoulder seam to the bottom edge of the hem.
                    </p>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-xl space-y-0.5">
                    <strong className="text-neutral-900 font-mono font-bold text-[11px] uppercase block">
                      Shoulder Width
                    </strong>
                    <p className="text-[11px]">
                      Measured straight across the back from the tip of the left shoulder seam to the right seam.
                    </p>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-xl space-y-0.5">
                    <strong className="text-neutral-900 font-mono font-bold text-[11px] uppercase block">
                      Sleeve Length
                    </strong>
                    <p className="text-[11px]">
                      Measured from the shoulder seam along the outer arm fold down to the finished sleeve hem.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: GUIDED SMART SIZE FINDER                         */}
          {/* ======================================================== */}
          {activeModalTab === 'finder' && (
            <>
              {calculationError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E51E2B]" />
                  <span>{calculationError}</span>
                </div>
              )}

              {/* STEP 1: SELECT FIT PROFILE & PREFERENCE */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 mb-2.5">
                      1. Select Fit Profile
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'mens', label: "Men's Wear", desc: 'Broader shoulders & straight contour' },
                        { id: 'womens', label: "Women's Wear", desc: 'Fitted bust & hip ease contour' },
                        { id: 'unisex', label: 'Prefer not to specify', desc: 'Neutral athletic proportion' }
                      ].map(item => {
                        const isSelected = gender === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setGender(item.id as GenderFit)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-xs font-bold uppercase">{item.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#E51E2B]" />}
                            </div>
                            <span className={`text-[10px] leading-tight ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                              {item.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fit Preference Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700">
                        2. Desired Silhouette Drape
                      </label>
                      <span className="text-[11px] font-mono text-neutral-500">
                        How do you like this piece to hang?
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'snug', label: 'Fitted / Snug', desc: 'Closer to torso with minimal excess ease' },
                        { id: 'regular', label: 'True / Balanced', desc: 'Intended atelier silhouette cut' },
                        { id: 'oversized', label: 'Generous / Boxy', desc: 'Extra drape with dropped shoulders' }
                      ].map(pref => {
                        const isSelected = fitPreference === pref.id;
                        return (
                          <button
                            key={pref.id}
                            type="button"
                            onClick={() => setFitPreference(pref.id as FitPreference)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-xs font-bold uppercase">{pref.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#E51E2B]" />}
                            </div>
                            <span className={`text-[10px] leading-tight ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                              {pref.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Informational Callout */}
                  <div className="p-3.5 bg-neutral-100/80 border border-neutral-200 rounded-2xl flex items-start gap-2.5 text-xs text-neutral-600">
                    <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    <p>
                      This drop features <strong className="text-neutral-900 font-bold">{productChart?.fitType || product.fit || 'TH3EE Signature Cut'}</strong> ({product.gsm || 'Heavyweight Cotton'}). Measurements are calibrated directly against Tirupati atelier garment specs.
                    </p>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
                    >
                      <span>Continue to Body Info</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ENTER BODY INFORMATION & MEASUREMENTS */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Controls Column (Height & Weight) */}
                    <div className="md:col-span-7 space-y-6">
                      
                      {/* CONTROL 1: HEIGHT */}
                      <div
                        className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-3 transition-colors"
                        onMouseEnter={() => setActiveIllustrationArea('height')}
                        onMouseLeave={() => setActiveIllustrationArea(null)}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800">
                            Height
                          </label>
                          
                          {/* Unit Toggle CM / FT-IN */}
                          <div className="inline-flex p-0.5 bg-neutral-100 rounded-full border border-neutral-200 text-[10px] font-mono font-bold">
                            <button
                              type="button"
                              onClick={() => setHeightUnit('cm')}
                              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                                heightUnit === 'cm' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                              }`}
                            >
                              CM
                            </button>
                            <button
                              type="button"
                              onClick={() => setHeightUnit('ft_in')}
                              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                                heightUnit === 'ft_in' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                              }`}
                            >
                              FT / IN
                            </button>
                          </div>
                        </div>

                        {/* Numeric Input & Minus/Plus */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateHeightCm(heightCm - 1)}
                            className="w-9 h-9 rounded-xl border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all text-neutral-700 cursor-pointer"
                            aria-label="Decrease height"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {heightUnit === 'cm' ? (
                            <div className="flex-1 flex items-center justify-center bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 focus-within:border-black">
                              <input
                                type="number"
                                min="130"
                                max="220"
                                value={heightCm}
                                onChange={e => updateHeightCm(Number(e.target.value))}
                                className="w-16 text-center font-mono font-bold text-base bg-transparent focus:outline-none"
                              />
                              <span className="text-xs font-mono text-neutral-500 ml-1">cm</span>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center gap-2 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5">
                              <input
                                type="number"
                                min="4"
                                max="7"
                                value={heightFeet}
                                onChange={e => updateHeightFeetInches(Number(e.target.value), heightInches)}
                                className="w-8 text-center font-mono font-bold text-base bg-transparent focus:outline-none"
                              />
                              <span className="text-xs font-mono text-neutral-500">ft</span>
                              <input
                                type="number"
                                min="0"
                                max="11"
                                value={heightInches}
                                onChange={e => updateHeightFeetInches(heightFeet, Number(e.target.value))}
                                className="w-8 text-center font-mono font-bold text-base bg-transparent focus:outline-none ml-2"
                              />
                              <span className="text-xs font-mono text-neutral-500">in</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => updateHeightCm(heightCm + 1)}
                            className="w-9 h-9 rounded-xl border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all text-neutral-700 cursor-pointer"
                            aria-label="Increase height"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Interactive Slider */}
                        <div className="pt-1">
                          <input
                            type="range"
                            min="135"
                            max="215"
                            value={heightCm}
                            onChange={e => updateHeightCm(Number(e.target.value))}
                            className="w-full accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-1">
                            <span>135 cm (4'5")</span>
                            <span>175 cm (5'9")</span>
                            <span>215 cm (7'1")</span>
                          </div>
                        </div>
                      </div>

                      {/* CONTROL 2: WEIGHT */}
                      <div
                        className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-3 transition-colors"
                        onMouseEnter={() => setActiveIllustrationArea('weight')}
                        onMouseLeave={() => setActiveIllustrationArea(null)}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800">
                            Weight
                          </label>
                          
                          {/* Unit Toggle KG / LBS */}
                          <div className="inline-flex p-0.5 bg-neutral-100 rounded-full border border-neutral-200 text-[10px] font-mono font-bold">
                            <button
                              type="button"
                              onClick={() => setWeightUnit('kg')}
                              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                                weightUnit === 'kg' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                              }`}
                            >
                              KG
                            </button>
                            <button
                              type="button"
                              onClick={() => setWeightUnit('lbs')}
                              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                                weightUnit === 'lbs' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                              }`}
                            >
                              LBS
                            </button>
                          </div>
                        </div>

                        {/* Numeric Input & Minus/Plus */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateWeightKg(weightKg - 1)}
                            className="w-9 h-9 rounded-xl border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all text-neutral-700 cursor-pointer"
                            aria-label="Decrease weight"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {weightUnit === 'kg' ? (
                            <div className="flex-1 flex items-center justify-center bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 focus-within:border-black">
                              <input
                                type="number"
                                min="35"
                                max="160"
                                value={weightKg}
                                onChange={e => updateWeightKg(Number(e.target.value))}
                                className="w-16 text-center font-mono font-bold text-base bg-transparent focus:outline-none"
                              />
                              <span className="text-xs font-mono text-neutral-500 ml-1">kg</span>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 focus-within:border-black">
                              <input
                                type="number"
                                min="77"
                                max="350"
                                value={weightLbs}
                                onChange={e => updateWeightLbs(Number(e.target.value))}
                                className="w-16 text-center font-mono font-bold text-base bg-transparent focus:outline-none"
                              />
                              <span className="text-xs font-mono text-neutral-500 ml-1">lbs</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => updateWeightKg(weightKg + 1)}
                            className="w-9 h-9 rounded-xl border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-all text-neutral-700 cursor-pointer"
                            aria-label="Increase weight"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Interactive Slider */}
                        <div className="pt-1">
                          <input
                            type="range"
                            min="40"
                            max="140"
                            value={weightKg}
                            onChange={e => updateWeightKg(Number(e.target.value))}
                            className="w-full accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-1">
                            <span>40 kg (88 lbs)</span>
                            <span>75 kg (165 lbs)</span>
                            <span>140 kg (308 lbs)</span>
                          </div>
                        </div>
                      </div>

                      {/* OPTIONAL BODY MEASUREMENTS */}
                      <div className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800 block">
                              Optional Precision Measurements
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              Leave blank to use calibrated anthropometric estimates
                            </span>
                          </div>

                          {/* Unit Toggle CM / IN */}
                          <div className="inline-flex p-0.5 bg-neutral-100 rounded-full border border-neutral-200 text-[10px] font-mono font-bold">
                            <button
                              type="button"
                              onClick={() => setOptionalUnit('cm')}
                              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                                optionalUnit === 'cm' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                              }`}
                            >
                              CM
                            </button>
                            <button
                              type="button"
                              onClick={() => setOptionalUnit('in')}
                              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                                optionalUnit === 'in' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                              }`}
                            >
                              IN
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {/* Chest */}
                          <div
                            className="space-y-1"
                            onMouseEnter={() => setActiveIllustrationArea('chest')}
                            onMouseLeave={() => setActiveIllustrationArea(null)}
                          >
                            <label className="text-[10px] font-mono uppercase font-bold text-neutral-600 flex items-center gap-1">
                              Chest
                            </label>
                            <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 focus-within:border-black">
                              <input
                                type="number"
                                placeholder={optionalUnit === 'cm' ? '98' : '38'}
                                value={chestVal}
                                onChange={e => setChestVal(e.target.value)}
                                onFocus={() => setActiveIllustrationArea('chest')}
                                onBlur={() => setActiveIllustrationArea(null)}
                                className="w-full font-mono font-bold text-xs bg-transparent focus:outline-none"
                              />
                              <span className="text-[10px] font-mono text-neutral-400">{optionalUnit}</span>
                            </div>
                          </div>

                          {/* Waist */}
                          <div
                            className="space-y-1"
                            onMouseEnter={() => setActiveIllustrationArea('waist')}
                            onMouseLeave={() => setActiveIllustrationArea(null)}
                          >
                            <label className="text-[10px] font-mono uppercase font-bold text-neutral-600 flex items-center gap-1">
                              Waist
                            </label>
                            <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 focus-within:border-black">
                              <input
                                type="number"
                                placeholder={optionalUnit === 'cm' ? '82' : '32'}
                                value={waistVal}
                                onChange={e => setWaistVal(e.target.value)}
                                onFocus={() => setActiveIllustrationArea('waist')}
                                onBlur={() => setActiveIllustrationArea(null)}
                                className="w-full font-mono font-bold text-xs bg-transparent focus:outline-none"
                              />
                              <span className="text-[10px] font-mono text-neutral-400">{optionalUnit}</span>
                            </div>
                          </div>

                          {/* Hips */}
                          <div
                            className="space-y-1"
                            onMouseEnter={() => setActiveIllustrationArea('hips')}
                            onMouseLeave={() => setActiveIllustrationArea(null)}
                          >
                            <label className="text-[10px] font-mono uppercase font-bold text-neutral-600 flex items-center gap-1">
                              Hips
                            </label>
                            <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 focus-within:border-black">
                              <input
                                type="number"
                                placeholder={optionalUnit === 'cm' ? '98' : '38'}
                                value={hipsVal}
                                onChange={e => setHipsVal(e.target.value)}
                                onFocus={() => setActiveIllustrationArea('hips')}
                                onBlur={() => setActiveIllustrationArea(null)}
                                className="w-full font-mono font-bold text-xs bg-transparent focus:outline-none"
                              />
                              <span className="text-[10px] font-mono text-neutral-400">{optionalUnit}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Visual Column (Anatomical Human Body Illustration) */}
                    <div className="md:col-span-5 bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[340px]">
                      <div className="w-full text-center pb-2 border-b border-neutral-100">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                          Anatomical Fit Guide
                        </span>
                      </div>

                      <HumanBodyIllustration
                        gender={gender}
                        activeArea={activeIllustrationArea}
                        chestVal={getParsedOptionalCm(chestVal)}
                        waistVal={getParsedOptionalCm(waistVal)}
                        hipsVal={getParsedOptionalCm(hipsVal)}
                      />

                      <div className="w-full text-center pt-2 border-t border-neutral-100 text-[10px] font-mono text-neutral-500">
                        {activeIllustrationArea === 'chest' && 'Chest circumference measured around fullest point.'}
                        {activeIllustrationArea === 'waist' && 'Waist measured around natural narrowest torso line.'}
                        {activeIllustrationArea === 'hips' && 'Hips measured around fullest part of pelvis.'}
                        {activeIllustrationArea === 'height' && `Height: ${heightCm} cm (${heightFeet}'${heightInches}")`}
                        {activeIllustrationArea === 'weight' && `Weight: ${weightKg} kg (${weightLbs} lbs)`}
                        {!activeIllustrationArea && 'Interactive body guide highlights your measurements.'}
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full sm:w-auto px-5 py-3 rounded-full border border-neutral-300 hover:border-black text-neutral-700 hover:text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCalculate}
                      disabled={isCalculating}
                      className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#E51E2B] hover:bg-[#c91823] active:bg-[#af151f] text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    >
                      {isCalculating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Calculating Atelier Fit...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>FIND MY PERFECT SIZE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SIZE RECOMMENDATION RESULTS & COMPARISON */}
              {step === 3 && recommendation && (
                <div className="space-y-6">
                  
                  {/* Top Hero Recommendation Card */}
                  <div className="p-6 bg-white border border-neutral-200 rounded-3xl shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-neutral-900 via-[#E51E2B] to-neutral-900" />
                    
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-neutral-500 block mb-1">
                      YOUR RECOMMENDED SIZE
                    </span>

                    <div className="flex items-center justify-center gap-3 my-2">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-900 text-white rounded-2xl flex items-center justify-center font-black text-3xl sm:text-4xl shadow-md border-2 border-neutral-900">
                        {recommendation.recommendedSize}
                      </div>
                      <div className="text-left">
                        <span className="inline-block bg-[#E51E2B] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1 shadow-2xs">
                          BEST FIT
                        </span>
                        <div className="text-xs font-mono font-bold text-neutral-800">
                          {recommendation.confidenceScore}% Fit Match
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {recommendation.confidenceLevel} Confidence
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 max-w-lg mx-auto font-mono mt-2 leading-relaxed">
                      {recommendation.explanation}
                    </p>

                    {/* Inventory Alert if Out of Stock */}
                    {!recommendation.isRecommendedSizeInStock && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left flex items-start gap-2.5 text-xs text-amber-800 font-mono">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Size {recommendation.recommendedSize} is out of stock in {selectedColor}.</strong>
                          {recommendation.alternativeRecommendedSize && (
                            <p className="mt-0.5">
                              {recommendation.alternativeExplanation}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FIT BREAKDOWN TABLE / CARDS */}
                  <div className="p-5 bg-white border border-neutral-200 rounded-3xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800">
                        Fit Breakdown for Size {activeComparisonSize}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        Garment Ease Analysis
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(currentComparison?.bodyAreas || recommendation.fitBreakdown).map(area => {
                        const isPositive = area.sentiment === 'positive';
                        const isWarning = area.sentiment === 'warning';
                        const isInfo = area.sentiment === 'info';

                        const badgeBg = isPositive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isWarning
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200';

                        return (
                          <div
                            key={area.area}
                            className="p-3 bg-neutral-50/70 border border-neutral-200 rounded-2xl flex flex-col justify-between"
                          >
                            <span className="text-[10px] font-mono uppercase font-bold text-neutral-500 mb-1">
                              {area.area}
                            </span>
                            <div className="space-y-1">
                              <span
                                className={`inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${badgeBg}`}
                              >
                                {area.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PHASE 4: INTERACTIVE SIZE COMPARISON */}
                  <div className="p-5 bg-white border border-neutral-200 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 block">
                          Interactive Size Comparison
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Tap any size to preview how the silhouette drapes on you
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-800">
                        Selected: Size {activeComparisonSize}
                      </span>
                    </div>

                    {/* Size Pills Selector */}
                    <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                      {allChartSizes.map(size => {
                        const isRec = size === recommendation.recommendedSize;
                        const isSelected = size === activeComparisonSize;
                        const comparison = recommendation.sizeComparisons[size];
                        const isAvail = comparison?.isAvailable ?? true;

                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setActiveComparisonSize(size)}
                            className={`py-2.5 px-1 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer relative border ${
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black'
                            }`}
                          >
                            <div>{size}</div>
                            {isRec && (
                              <span
                                className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold ${
                                  isSelected ? 'bg-[#E51E2B] text-white' : 'bg-[#E51E2B] text-white'
                                }`}
                                title="Recommended Best Fit"
                              >
                                ★
                              </span>
                            )}
                            {!isAvail && (
                              <span className="block text-[8px] text-neutral-400 font-normal">
                                Sold Out
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Visual Comparison Gauge Bars for Chest, Waist, Hips, Length */}
                    <div className="space-y-3 pt-2">
                      {(currentComparison?.bodyAreas || recommendation.fitBreakdown).map(area => {
                        const pct = area.percentage || 50;
                        return (
                          <div key={area.area} className="space-y-1">
                            <div className="flex justify-between items-baseline text-[11px] font-mono">
                              <span className="font-bold text-neutral-700">{area.area} Fit</span>
                              <span className="font-bold text-neutral-900">{area.status}</span>
                            </div>
                            {/* 3-segment gauge: Snug (left) | Just Right (center) | Roomy (right) */}
                            <div className="relative w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                              {/* Indicator pin */}
                              <div
                                className="absolute top-0 bottom-0 w-3 rounded-full bg-neutral-900 border border-white shadow-xs transition-all duration-300 -translate-x-1/2"
                                style={{ left: `${pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                              <span>Snug</span>
                              <span className="text-neutral-600 font-bold">Just Right</span>
                              <span>Roomy</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3 Actions (Phase 7: Shopping Cart Integration) */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleApplySize(activeComparisonSize)}
                      className="w-full bg-[#171717] hover:bg-black active:bg-neutral-950 text-white py-4 px-6 rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.005] active:scale-[0.995]"
                    >
                      <Check className="w-4 h-4 text-[#E51E2B]" />
                      <span>
                        SELECT SIZE {activeComparisonSize}
                        {activeComparisonSize === recommendation.recommendedSize ? ' (RECOMMENDED)' : ''}
                      </span>
                    </button>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex-1 py-3 px-4 rounded-full border border-neutral-300 hover:border-black text-neutral-700 hover:text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Adjust Measurements</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveModalTab('chart')}
                        className="flex-1 py-3 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                      >
                        View Full Size Table
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Check,
  Ruler,
  AlertCircle,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Minus,
  Zap,
  Copy,
  Palette,
  Scissors,
  CheckCheck,
  RotateCw,
  Maximize2,
  Minimize2,
  Eye,
  Shirt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  CustomDesignSource,
  GarmentFitType,
  GarmentCategoryType,
  SleeveType,
  NeckType,
  CustomRequestVariant,
  CustomRequestPlacement,
  CustomRequestFile,
  CustomisationCatalogConfig,
  ColorSwatch
} from '../../types/customise';
import { customiseService, type SubmitCustomRequestPayload } from '../../services/customise.service';
import { INITIAL_CUSTOMISATION_CATALOG } from '../../data/customiseCatalog';
import { SizeGuideModal } from './SizeGuideModal';
import { VariantQuantityMatrix } from './VariantQuantityMatrix';
import { GarmentSvg } from './GarmentIllustrations';

interface CustomiseWizardProps {
  navigate: (path: string) => void;
  currentUser?: any;
  showNotification: (data: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

// Preset Quick Concept Ideas for 1-Click Fill
const QUICK_INSPIRATION_PRESETS = [
  {
    icon: '🎬',
    label: 'Baahubali / Cinematic',
    desc: 'Cinematic Telugu calligraphy & weathered warrior motif on heavy streetwear black silhouette.',
    placement: 'large_front' as const
  },
  {
    icon: '⚔️',
    label: 'Vintage Anime Canvas',
    desc: 'Retro Japanese manga typography with expansive detailed backprint and minimal chest seal.',
    placement: 'full_back' as const
  },
  {
    icon: '👑',
    label: 'Minimalist Chest Monogram',
    desc: 'Refined modern typography or crest emblem on left chest with razor-sharp DTF precision.',
    placement: 'front_chest' as const
  },
  {
    icon: '🔥',
    label: 'Double-Sided Streetwear',
    desc: 'Front emblem crest paired with a bold high-contrast back statement illustration.',
    placement: 'both' as const
  },
  {
    icon: '🐅',
    label: 'Royal South Heritage',
    desc: 'Traditional heritage emblems and bold typography honoring South Indian artistry.',
    placement: 'large_front' as const
  }
];

// Curated Garment Silhouettes covering all cuts
const GARMENT_SILHOUETTES = [
  {
    category: 'T-Shirt' as GarmentCategoryType,
    fit: 'Oversized' as GarmentFitType,
    title: 'Oversized Tee',
    badge: '★ Best Seller',
    gsmText: '240 GSM French Terry',
    fabric: '240 GSM Luxury French Terry Cotton',
    desc: 'Dropped shoulders, relaxed streetwear boxy drape. Our signature cut.'
  },
  {
    category: 'T-Shirt' as GarmentCategoryType,
    fit: 'Boxy Fit' as GarmentFitType,
    title: 'Boxy Cropped Tee',
    badge: 'Modern Trend',
    gsmText: '240 GSM French Terry',
    fabric: '240 GSM Luxury French Terry Cotton',
    desc: 'Extra-wide torso with clean cropped hem for modern streetwear layering.'
  },
  {
    category: 'T-Shirt' as GarmentCategoryType,
    fit: 'Regular Fit' as GarmentFitType,
    title: 'Regular Classic Tee',
    badge: 'Everyday Fit',
    gsmText: '180 GSM Bio-Wash',
    fabric: '180 GSM Pure Combed Cotton',
    desc: 'Tailored everyday fit with natural shoulder line and breathable feel.'
  },
  {
    category: 'Hoodie' as GarmentCategoryType,
    fit: 'Oversized' as GarmentFitType,
    title: 'Streetwear Hoodie',
    badge: 'Heavyweight',
    gsmText: '380 GSM Brushed Fleece',
    fabric: '380 GSM Heavyweight Brushed Fleece',
    desc: 'Double-layered hood, kangaroo pouch, thick winter fleece warmth.'
  },
  {
    category: 'T-Shirt' as GarmentCategoryType,
    fit: 'Regular Fit' as GarmentFitType,
    title: 'Polo Street Tee',
    badge: 'Smart Collar',
    gsmText: '220 GSM Pique Cotton',
    fabric: '220 GSM Combed Pique Cotton',
    desc: 'Ribbed collar with structured placket for refined casual streetwear.'
  }
];

export const CustomiseWizard: React.FC<CustomiseWizardProps> = ({
  navigate,
  currentUser,
  showNotification
}) => {
  // Catalog State
  const [catalog, setCatalog] = useState<CustomisationCatalogConfig>(INITIAL_CUSTOMISATION_CATALOG);
  const [, setCatalogLoading] = useState(false);

  // 3-Step Wizard Flow
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Live Interactive Garment Studio Preview States
  const [activePreviewView, setActivePreviewView] = useState<'front' | 'back'>('front');
  const [isMockupExpandedOnMobile, setIsMockupExpandedOnMobile] = useState<boolean>(true);
  const [isLiveSummaryOpen, setIsLiveSummaryOpen] = useState<boolean>(false);

  // Step 1: Garment & Fabric & Color (Smart Defaults: Oversized, Jet Black, Half Sleeve, Round Neck, 240 GSM)
  const [garmentCategory, setGarmentCategory] = useState<GarmentCategoryType>('T-Shirt');
  const [fit, setFit] = useState<GarmentFitType>('Oversized');
  const [primaryColor, setPrimaryColor] = useState<string>('Jet Black');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('#111111');
  const [sleeve, setSleeve] = useState<SleeveType>('Half Sleeve');
  const [neckType, setNeckType] = useState<NeckType>('Round Neck');
  const [fabric, setFabric] = useState<string>('240 GSM Luxury French Terry Cotton');
  const [gsm, setGsm] = useState<string>('240 GSM');

  // Step 2: Design & Placement
  const [designSource, setDesignSource] = useState<CustomDesignSource>('have_design');
  const [designDescription, setDesignDescription] = useState('');
  const [printingInstructions, setPrintingInstructions] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<CustomRequestFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileResolutionWarning, setFileResolutionWarning] = useState<string | null>(null);

  // Placement Type
  const [quickPlacementType, setQuickPlacementType] = useState<'front' | 'back' | 'both' | 'chest' | 'sleeve' | 'custom'>('front');
  const [placements, setPlacements] = useState<CustomRequestPlacement[]>([
    {
      placementLocation: 'large_front',
      printSize: 'large',
      notes: ''
    }
  ]);

  // Step 3: Size, Quantity & Customer Details
  const [singleSize, setSingleSize] = useState<string>('L');
  const [singleQuantity, setSingleQuantity] = useState<number>(1);
  const [isAdvancedSizesOpen, setIsAdvancedSizesOpen] = useState<boolean>(false);

  // Multi-variant fallback for bulk/team
  const [variants, setVariants] = useState<CustomRequestVariant[]>([
    {
      color: 'Jet Black',
      size: 'L',
      quantity: 1,
      notes: ''
    }
  ]);

  // Customer Contact Info (Frictionless: Name & Phone are primary)
  const [customerName, setCustomerName] = useState(currentUser?.name || currentUser?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'email' | 'phone'>('whatsapp');

  // Optional Delivery & Notes
  const [city, setCity] = useState('Tirupati');
  const [pincode, setPincode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [state] = useState('Andhra Pradesh');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [requiredDate, setRequiredDate] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    requestNumber: string;
    trackingToken: string;
  } | null>(null);

  // Load Admin Catalog
  useEffect(() => {
    async function load() {
      setCatalogLoading(true);
      try {
        const cat = await customiseService.getCatalog();
        setCatalog(cat);
      } catch (err) {
        console.warn('Using default catalog:', err);
      } finally {
        setCatalogLoading(false);
      }
    }
    load();
  }, []);

  // Autofill if logged in
  useEffect(() => {
    if (currentUser) {
      if (!customerName && (currentUser.name || currentUser.full_name)) {
        setCustomerName(currentUser.name || currentUser.full_name);
      }
      if (!customerEmail && currentUser.email) {
        setCustomerEmail(currentUser.email);
      }
      if (!customerPhone && currentUser.phone) {
        setCustomerPhone(currentUser.phone);
      }
    }
  }, [currentUser]);

  // Keep single size/quantity and variants in sync
  useEffect(() => {
    if (!isAdvancedSizesOpen) {
      setVariants([
        {
          color: primaryColor,
          size: singleSize,
          quantity: singleQuantity,
          notes: ''
        }
      ]);
    }
  }, [primaryColor, singleSize, singleQuantity, isAdvancedSizesOpen]);

  // Quick Placement selector logic
  const handleSelectQuickPlacement = (type: 'front' | 'back' | 'both' | 'chest' | 'sleeve' | 'custom') => {
    setQuickPlacementType(type);
    const existingArtUrl = uploadedFiles[0]?.fileUrl;
    const existingArtKey = uploadedFiles[0]?.fileKey;

    if (type === 'front') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'large_front',
          printSize: 'large',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey
        }
      ]);
    } else if (type === 'back') {
      setActivePreviewView('back');
      setPlacements([
        {
          placementLocation: 'full_back',
          printSize: 'large',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey
        }
      ]);
    } else if (type === 'both') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'front_chest',
          printSize: 'small',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey,
          notes: 'Front Chest Logo'
        },
        {
          placementLocation: 'full_back',
          printSize: 'large',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey,
          notes: 'Full Back Statement'
        }
      ]);
    } else if (type === 'chest') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'front_chest',
          printSize: 'small',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey
        }
      ]);
    } else if (type === 'sleeve') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'left_sleeve',
          printSize: 'small',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey,
          notes: 'Left Sleeve Bicep'
        }
      ]);
    } else if (type === 'custom') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'custom',
          printSize: 'custom',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey,
          notes: 'Custom placement coordinated with studio'
        }
      ]);
    }
  };

  // Select Color Swatch
  const handleSelectColor = (swatch: ColorSwatch) => {
    setPrimaryColor(swatch.name);
    setSelectedColorHex(swatch.hex);
  };

  // Upload file handler
  const handleFileUpload = async (filesToUpload: FileList | null) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    setIsUploadingFile(true);
    setFileResolutionWarning(null);

    const newFiles: CustomRequestFile[] = [...uploadedFiles];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      // Print resolution check
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          if (img.width < 1000 || img.height < 1000) {
            setFileResolutionWarning(
              `Notice: "${file.name}" is ${img.width}×${img.height}px. For HD Direct-to-Film printing, high resolution (2000px+) gives maximum sharpness.`
            );
          }
        };
      }

      try {
        const result = await customiseService.uploadFile(file, 'custom-artwork');
        newFiles.push({
          fileType: designSource === 'have_design' ? 'artwork' : 'reference',
          fileName: result.name,
          fileUrl: result.url,
          fileKey: result.key,
          fileSizeBytes: result.size,
          mimeType: result.type,
          targetPlacement: placements[0]?.placementLocation || 'large_front'
        });

        // Map to active placement
        if (placements.length > 0) {
          const updated = [...placements];
          updated[0].artworkUrl = result.url;
          updated[0].artworkKey = result.key;
          setPlacements(updated);
        }

        showNotification({
          type: 'success',
          message: `Artwork "${file.name}" uploaded successfully!`
        });
      } catch (uploadErr: any) {
        showNotification({
          type: 'error',
          message: uploadErr.message || `Failed to upload ${file.name}`
        });
      }
    }

    setUploadedFiles(newFiles);
    setIsUploadingFile(false);
  };

  const handleRemoveFile = (index: number) => {
    const next = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(next);
    if (next.length === 0 && placements.length > 0) {
      const updated = [...placements];
      delete updated[0].artworkUrl;
      delete updated[0].artworkKey;
      setPlacements(updated);
    }
  };

  // Apply Quick Preset Concept
  const handleApplyPreset = (preset: typeof QUICK_INSPIRATION_PRESETS[0]) => {
    setDesignSource('have_idea');
    setDesignDescription(preset.desc);
    if (preset.placement === 'full_back') {
      handleSelectQuickPlacement('back');
    } else if (preset.placement === 'front_chest') {
      handleSelectQuickPlacement('chest');
    } else if (preset.placement === 'both') {
      handleSelectQuickPlacement('both');
    } else {
      handleSelectQuickPlacement('front');
    }
    showNotification({
      type: 'info',
      message: `Applied ${preset.label} concept preset!`
    });
  };

  // Total Quantity Calculation
  const totalQuantity = isAdvancedSizesOpen
    ? variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)
    : singleQuantity;

  // Validation
  const validateAndProceed = (targetStep: number): boolean => {
    if (targetStep === 2) {
      return true; // Garment & color already have smart defaults!
    }

    if (targetStep === 3) {
      if (designSource === 'have_design' && uploadedFiles.length === 0 && !designDescription.trim()) {
        showNotification({
          type: 'error',
          message: 'Please tap to upload your artwork/photo or describe what you want printed.'
        });
        return false;
      }
      if (designSource === 'have_idea' && !designDescription.trim()) {
        showNotification({
          type: 'error',
          message: 'Please type a short description or tap an inspiration preset below.'
        });
        return false;
      }
      return true;
    }

    return true;
  };

  // Final Request Submission
  const handleSubmitRequest = async () => {
    if (!customerName.trim()) {
      showNotification({ type: 'error', message: 'Please enter your full name.' });
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showNotification({ type: 'error', message: 'Please enter a valid 10-digit WhatsApp mobile number.' });
      return;
    }

    if (designSource === 'have_design' && uploadedFiles.length === 0 && !designDescription.trim()) {
      setActiveStep(2);
      showNotification({
        type: 'error',
        message: 'Please upload your artwork in Step 2 or describe your graphic.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalVariants = isAdvancedSizesOpen && variants.length > 0
        ? variants.map(v => ({
            color: v.color || primaryColor,
            size: v.size || singleSize,
            quantity: Number(v.quantity) || 1,
            notes: v.notes
          }))
        : [
            {
              color: primaryColor,
              size: singleSize,
              quantity: singleQuantity,
              notes: ''
            }
          ];

      const payload: SubmitCustomRequestPayload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase() || `${cleanPhone}@th3ee.store`,
        customer_phone: cleanPhone,
        preferred_contact: preferredContact,
        customer_id: currentUser?.id || undefined,
        design_type: designSource,
        design_description: designDescription.trim() || undefined,
        printing_instructions: printingInstructions.trim() || undefined,
        intended_use: 'personal',
        required_date: requiredDate || undefined,
        garment_category: garmentCategory,
        fit,
        sleeve,
        neck_type: neckType,
        fabric,
        gsm,
        primary_color: primaryColor,
        total_quantity: totalQuantity,
        artwork_approval_required: true,
        shipping_address: {
          fullName: customerName.trim(),
          phone: cleanPhone,
          addressLine1: addressLine1.trim() || 'Express Custom Order',
          city: city.trim() || 'Tirupati',
          state: state.trim() || 'Andhra Pradesh',
          pincode: pincode.trim() || '517501'
        },
        internal_notes: additionalNotes.trim() || undefined,
        variants: finalVariants,
        placements: placements.map(p => ({
          placement_location: p.placementLocation,
          print_size: p.printSize,
          custom_dimensions: p.customDimensions,
          artwork_url: p.artworkUrl || uploadedFiles[0]?.fileUrl,
          artwork_key: p.artworkKey || uploadedFiles[0]?.fileKey,
          notes: p.notes
        })),
        files: uploadedFiles.map(f => ({
          file_type: f.fileType,
          file_name: f.fileName,
          file_url: f.fileUrl,
          file_key: f.fileKey,
          file_size_bytes: f.fileSizeBytes,
          mime_type: f.mimeType,
          target_placement: f.targetPlacement
        }))
      };

      const result = await customiseService.submitRequest(payload);

      if (!result.success || !result.requestNumber || !result.trackingToken) {
        throw new Error(result.error || 'Failed to submit customisation request');
      }

      setSubmissionResult({
        requestNumber: result.requestNumber,
        trackingToken: result.trackingToken
      });

      showNotification({
        type: 'success',
        message: `Order request ${result.requestNumber} registered! Opening your live order ledger.`
      });

      // Directly navigate into the in-app tracking and quote payment page
      navigate(`/customise/track/${result.trackingToken}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showNotification({
        type: 'error',
        message: err.message || 'Submission error. Please verify network and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Order Reference ID
  const handleCopyOrderId = () => {
    if (!submissionResult) return;
    navigator.clipboard.writeText(submissionResult.requestNumber);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2500);
    showNotification({ type: 'info', message: 'Order reference ID copied to clipboard!' });
  };

  // =========================================================================
  // SUCCESS / RECEIPT VIEW (In-App Order Tracker & Zero-Redirect)
  // =========================================================================
  if (submissionResult) {
    return (
      <div className="w-full bg-[#F8F9FA] min-h-[85vh] py-6 sm:py-16 font-sans">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-neutral-200/90 p-5 sm:p-10 shadow-xl rounded-3xl text-center">
            
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="inline-block bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full mb-2 shadow-xs">
              Tirupati Atelier Studio
            </span>

            <h1 className="text-xl sm:text-3xl font-black uppercase text-neutral-900 tracking-tight leading-tight">
              Custom Order Submitted In-App!
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto leading-relaxed">
              Your custom garment specifications have been registered directly in the Atelier Admin Portal. Our studio is reviewing your artwork sizing. Once the quote is prepared, it will appear right on your in-app tracking page for instant online payment.
            </p>

            {/* Reference Number Card with 1-Tap Copy */}
            <div className="my-5 p-4 sm:p-5 bg-neutral-50/80 border border-neutral-200 rounded-2xl w-full text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Your Order Reference ID
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#FF2E2E] tracking-wider font-mono">
                  {submissionResult.requestNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="p-2 text-neutral-500 hover:text-black bg-neutral-200/70 hover:bg-neutral-300 rounded-full transition-colors active:scale-95 cursor-pointer"
                  title="Copy ID"
                >
                  {copiedOrderId ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-neutral-200/70 flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-600">
                <span className="bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-2xs font-bold">
                  {totalQuantity}x {fit} {garmentCategory}
                </span>
                <span className="bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-2xs font-bold">
                  {primaryColor}
                </span>
                <span className="bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-2xs font-bold">
                  {isAdvancedSizesOpen ? 'Multi-Size Run' : `Size ${singleSize}`}
                </span>
              </div>
            </div>

            {/* What to Expect Next (Clear In-App 3 Steps) */}
            <div className="bg-neutral-900 text-white p-4 sm:p-5 rounded-2xl text-left my-4 space-y-2.5 text-xs shadow-md">
              <span className="font-bold text-[#FF2E2E] uppercase tracking-wider block">
                What Happens Next (100% Inside This Site)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-neutral-300">
                <div className="border-l-2 border-[#FF2E2E] pl-2.5 py-0.5">
                  <strong className="text-white block font-bold">1. Studio Admin Review</strong>
                  <span className="text-neutral-400">Our studio team reviews artwork dimensions in the Admin Portal.</span>
                </div>
                <div className="border-l-2 border-[#FF2E2E] pl-2.5 py-0.5">
                  <strong className="text-white block font-bold">2. Quotation Published In-App</strong>
                  <span className="text-neutral-400">Your itemised price and digital proof appear directly on your live tracking page.</span>
                </div>
                <div className="border-l-2 border-[#FF2E2E] pl-2.5 py-0.5">
                  <strong className="text-white block font-bold">3. Pay Online on Site</strong>
                  <span className="text-neutral-400">Review quote and pay securely online via Razorpay (UPI, Cards, NetBanking) to begin production.</span>
                </div>
              </div>
            </div>

            {/* In-App Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => navigate(`/customise/track/${submissionResult.trackingToken}`)}
                className="w-full sm:w-auto bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] text-white font-bold text-xs uppercase px-8 py-3.5 tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/25 rounded-full active:scale-95 min-h-[46px] cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Track Live Order & View In-App Quote →</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase px-6 py-3.5 tracking-wider transition-colors rounded-full active:scale-95 min-h-[46px] cursor-pointer"
              >
                Return to Storefront
              </button>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-150">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs text-neutral-500 hover:text-black uppercase font-bold tracking-wider cursor-pointer"
              >
                ← Back to Home
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Current summary string for sticky bottom bar & badges
  const currentSummaryShort = `${fit} ${garmentCategory} • ${primaryColor} • ${isAdvancedSizesOpen ? `${totalQuantity} Pcs` : `Size ${singleSize} (${singleQuantity} Pc)`}`;

  // =========================================================================
  // MAIN STUDIO EXPERIENCE
  // =========================================================================
  return (
    <div className="w-full bg-[#F8F9FA] min-h-[90vh] py-3 sm:py-8 pb-32 sm:pb-16 font-sans text-neutral-900 selection:bg-red-500 selection:text-white">
      <div className="max-w-3xl mx-auto px-3 sm:px-6">

        {/* Minimal Breadcrumb & Fast Order Soft Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-wider text-neutral-500 flex items-center space-x-1.5 font-mono">
            <button type="button" onClick={() => navigate('/')} className="hover:text-[#FF2E2E] transition-colors cursor-pointer">Home</button>
            <span>/</span>
            <span className="text-neutral-900 font-bold">Custom Studio</span>
          </nav>

          <span className="bg-gradient-to-r from-red-50 to-rose-50 text-[#FF2E2E] border border-red-200/80 px-3 py-1 text-[10px] font-bold uppercase rounded-full flex items-center gap-1.5 shadow-2xs">
            <Zap className="w-3.5 h-3.5 fill-current shrink-0 text-[#FF2E2E]" />
            <span>30-Sec Fast Order • Zero Advance</span>
          </span>
        </div>

        {/* Studio Hero Title (Modern, Soft & Compact) */}
        <div className="mb-3 sm:mb-5">
          <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
            TH3EE Custom Apparel Studio
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
            Ultra-HD Direct-to-Film (DTF) prints on premium heavyweight cotton. Zero upfront cost • Digital proof sent directly to your WhatsApp.
          </p>
        </div>

        {/* ============================================================= */}
        {/* INTERACTIVE LIVE GARMENT MOCKUP STAGE (Interactive & Adaptive) */}
        {/* ============================================================= */}
        <div className="mb-4 sm:mb-6 bg-gradient-to-b from-white via-neutral-50/70 to-white border border-neutral-200/90 rounded-3xl p-3.5 sm:p-5 shadow-sm relative overflow-hidden transition-all duration-300">
          {/* Top Bar of Stage: Active Spec Chip + Flip Button + Collapse */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white border border-neutral-200 text-neutral-900 shadow-2xs">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-neutral-300 inline-block shadow-2xs"
                  style={{ backgroundColor: selectedColorHex }}
                />
                <span>{fit} {garmentCategory}</span>
                <span className="text-neutral-400">•</span>
                <span className="text-[#FF2E2E]">{primaryColor}</span>
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live 360° Studio
              </span>
            </div>

            {/* Stage Actions */}
            <div className="flex items-center gap-1.5">
              {/* Front / Back Flip Pill Button */}
              <button
                type="button"
                onClick={() => setActivePreviewView(activePreviewView === 'front' ? 'back' : 'front')}
                className="px-3.5 py-1.5 bg-neutral-900 hover:bg-[#FF2E2E] active:scale-95 text-white rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Flip Garment View"
              >
                <RotateCw className="w-3.5 h-3.5 transition-transform duration-300" />
                <span>{activePreviewView === 'front' ? 'View Back' : 'View Front'}</span>
              </button>

              {/* Mobile Collapse/Expand Preview */}
              <button
                type="button"
                onClick={() => setIsMockupExpandedOnMobile(!isMockupExpandedOnMobile)}
                className="sm:hidden p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors active:scale-90"
                title={isMockupExpandedOnMobile ? 'Compact Preview' : 'Expand Preview'}
              >
                {isMockupExpandedOnMobile ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Interactive Garment SVG Stage */}
          <AnimatePresence mode="wait">
            {isMockupExpandedOnMobile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center pt-0.5"
              >
                {/* SVG Canvas */}
                <div className="w-full max-w-[270px] sm:max-w-[330px] aspect-[500/520] relative flex items-center justify-center py-0.5">
                  <GarmentSvg
                    view={activePreviewView}
                    fit={fit}
                    category={garmentCategory}
                    sleeve={sleeve}
                    neckType={neckType}
                    colorHex={selectedColorHex}
                    selectedPlacements={placements.map(p => p.placementLocation)}
                    activePlacement={placements[0]?.placementLocation}
                    artworkPreviewUrl={uploadedFiles[0]?.fileUrl || null}
                    showHotspots={true}
                    className="w-full h-full drop-shadow-md transition-all duration-300"
                  />

                  {/* Active View Floating Pill */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-neutral-200/90 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-neutral-600 shadow-xs pointer-events-none whitespace-nowrap">
                    {activePreviewView === 'front' ? '— Front Center —' : '— Full Back Canvas —'}
                  </div>
                </div>

                {/* Instant 1-Tap Color Swatch Tray on Mockup Stage */}
                <div className="w-full mt-2 pt-2.5 border-t border-neutral-200/70 flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0 pl-1">
                    Tap Shade:
                  </span>
                  <div className="flex items-center gap-2 shrink-0 px-1">
                    {catalog.colors.slice(0, 8).map(swatch => {
                      const isSelected = primaryColor === swatch.name;
                      return (
                        <button
                          key={swatch.name}
                          type="button"
                          onClick={() => handleSelectColor(swatch)}
                          title={swatch.name}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all flex items-center justify-center relative cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-[#FF2E2E] ring-offset-2 scale-110 shadow-sm'
                              : 'hover:scale-105 opacity-90 hover:opacity-100 border border-neutral-300'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                ['#111111', '#58111A', '#3E2723', '#152238'].includes(swatch.hex.toUpperCase())
                                  ? 'text-white'
                                  : 'text-neutral-900'
                              }`}
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-bold uppercase text-[#FF2E2E] truncate pr-1">
                    {primaryColor}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SOFT MOBILE-ADAPTIVE STEP PROGRESS & TABS */}
        {/* ------------------------------------------------------------- */}
        <div className="mb-4 sm:mb-6 space-y-2">
          {/* Progress Indicator Bar */}
          <div className="w-full bg-neutral-200/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] h-full transition-all duration-300 rounded-full"
              style={{ width: activeStep === 1 ? '33.3%' : activeStep === 2 ? '66.6%' : '100%' }}
            />
          </div>

          {/* Stepper Soft Tabs */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {[
              { step: 1, title: 'Blank & Shade', sub: 'Cut, GSM & Shade' },
              { step: 2, title: 'Artwork', sub: 'Upload or Prompt' },
              { step: 3, title: 'Size & Info', sub: 'Run & WhatsApp' }
            ].map(s => {
              const isActive = activeStep === s.step;
              const isCompleted = activeStep > s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < activeStep || validateAndProceed(s.step)) {
                      setActiveStep(s.step);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`p-2 sm:p-3 rounded-2xl text-left transition-all relative cursor-pointer border ${
                    isActive
                      ? 'border-[#FF2E2E] bg-white shadow-sm ring-2 ring-[#FF2E2E]/15'
                      : isCompleted
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white/80 hover:border-neutral-300 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block opacity-75 font-mono">
                      0{s.step}
                    </span>
                    {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-black uppercase tracking-tight block truncate mt-0.5 ${isActive ? 'text-[#FF2E2E]' : ''}`}>
                    {s.title}
                  </span>
                  <span className={`text-[9px] hidden sm:block truncate ${isActive ? 'text-neutral-600' : isCompleted ? 'text-neutral-400' : 'text-neutral-400'}`}>
                    {s.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MAIN STUDIO CARD (Soft Rounded & Modern) */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-7 shadow-sm">

          {/* ============================================================= */}
          {/* STEP 1: BLANK, SILHOUETTE, SLEEVE, COLLAR, FABRIC & COLORWAY */}
          {/* ============================================================= */}
          {activeStep === 1 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[#FF2E2E] uppercase tracking-widest block mb-1">
                  STEP 01 OF 03 • BLANK & SHADE
                </span>
                <h2 className="text-lg sm:text-2xl font-black uppercase text-neutral-900 tracking-tight leading-snug">
                  Choose Garment Cut & Colorway
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Select your signature streetwear blank. Pre-shrunk, heavyweight luxury cotton with structured drape.
                </p>
              </div>

              {/* Garment Silhouette Selector (Clean 2x2 Grid with Soft Cards) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Garment Cut & Silhouette *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[10px] text-[#FF2E2E] font-bold uppercase underline flex items-center gap-1 cursor-pointer"
                  >
                    <Ruler className="w-3 h-3" />
                    <span>Size Chart</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {GARMENT_SILHOUETTES.map(item => {
                    const isSelected = garmentCategory === item.category && fit === item.fit;
                    return (
                      <div
                        key={item.title}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setGarmentCategory(item.category);
                          setFit(item.fit);
                          setFabric(item.fabric);
                          setGsm(item.gsmText);
                          if (item.category === 'Hoodie') {
                            setSleeve('Full Sleeve');
                          }
                        }}
                        className={`p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all text-left relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#FF2E2E] bg-red-50/25 shadow-xs ring-2 ring-[#FF2E2E]/20'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800">
                              {item.badge}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-[#FF2E2E]" />}
                          </div>
                          <h3 className="text-xs sm:text-sm font-black uppercase text-neutral-900 leading-snug">
                            {item.title}
                          </h3>
                          <span className="text-[10px] text-[#FF2E2E] font-bold block mb-1">
                            {item.gsmText}
                          </span>
                          <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sleeve Style & Collar Selection (Soft Segmented Pills) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Sleeve Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-[#FF2E2E]" />
                    <span>Sleeve Style *</span>
                  </label>
                  <div className="bg-neutral-100 p-1 rounded-full grid grid-cols-2 gap-1 border border-neutral-200/80">
                    {[
                      { id: 'Half Sleeve' as SleeveType, label: 'Half Sleeve' },
                      { id: 'Full Sleeve' as SleeveType, label: 'Full Sleeve' }
                    ].map(s => {
                      const isSleeveActive = sleeve === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSleeve(s.id)}
                          className={`py-2 px-3 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSleeveActive
                              ? 'bg-white text-neutral-900 shadow-xs ring-1 ring-black/5'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          <span>{s.label}</span>
                          {isSleeveActive && <Check className="w-3 h-3 text-[#FF2E2E]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Collar Neck Style */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#FF2E2E]" />
                    <span>Collar Style *</span>
                  </label>
                  <div className="bg-neutral-100 p-1 rounded-full grid grid-cols-2 gap-1 border border-neutral-200/80">
                    {[
                      { id: 'Round Neck' as NeckType, label: 'Crew Neck' },
                      { id: 'Polo Neck' as NeckType, label: 'Polo Collar' }
                    ].map(n => {
                      const isNeckActive = neckType === n.id;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setNeckType(n.id)}
                          className={`py-2 px-3 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isNeckActive
                              ? 'bg-white text-neutral-900 shadow-xs ring-1 ring-black/5'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          <span>{n.label}</span>
                          {isNeckActive && <Check className="w-3 h-3 text-[#FF2E2E]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Fabric GSM Quick Options (Soft Cards) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Fabric Weight & Quality *
                  </label>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">
                    {gsm}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { gsmVal: '240 GSM', label: '240 GSM French Terry', badge: 'Signature Heavy', spec: '240 GSM Luxury French Terry Cotton' },
                    { gsmVal: '200 GSM', label: '200 GSM Combed Cotton', badge: 'All-Season', spec: '200 GSM Premium Combed Cotton' },
                    { gsmVal: '180 GSM', label: '180 GSM Bio-Wash', badge: 'Light Everyday', spec: '180 GSM Pure Combed Cotton' }
                  ].map(fab => {
                    const isFabActive = gsm === fab.gsmVal;
                    return (
                      <button
                        key={fab.gsmVal}
                        type="button"
                        onClick={() => {
                          setGsm(fab.gsmVal);
                          setFabric(fab.spec);
                        }}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          isFabActive
                            ? 'border-[#FF2E2E] bg-red-50/20 text-neutral-900 ring-2 ring-[#FF2E2E]/20'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-black uppercase">{fab.gsmVal}</span>
                          <span className="text-[9px] font-bold uppercase text-[#FF2E2E]">{fab.badge}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 block truncate">{fab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Swatch Picker (Soft Swatch Bubbles) */}
              <div className="space-y-2 pt-1 border-t border-neutral-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#FF2E2E]" />
                    <span>Garment Colorway *</span>
                  </label>
                  <span className="text-xs font-bold text-[#FF2E2E] uppercase">
                    {primaryColor}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {catalog.colors.slice(0, 8).map(swatch => {
                    const isColorActive = primaryColor === swatch.name;
                    return (
                      <button
                        key={swatch.name}
                        type="button"
                        onClick={() => handleSelectColor(swatch)}
                        className={`p-2.5 border-2 rounded-2xl flex items-center gap-2.5 transition-all text-left cursor-pointer min-h-[46px] ${
                          isColorActive
                            ? 'border-[#FF2E2E] bg-red-50/20 ring-2 ring-[#FF2E2E]/20 shadow-2xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-neutral-300 shrink-0 shadow-2xs"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <div className="truncate flex-1">
                          <span className="text-xs font-bold uppercase text-neutral-900 block truncate">
                            {swatch.name}
                          </span>
                        </div>
                        {isColorActive && <Check className="w-3.5 h-3.5 text-[#FF2E2E] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Configuration Soft Chip */}
              <div className="p-3 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Selected Configuration:</span>
                  <span className="font-bold uppercase text-neutral-900">
                    {fit} {garmentCategory} • {primaryColor} • {sleeve} • {gsm}
                  </span>
                </div>
              </div>

              {/* In-Page Next Soft Button */}
              <div className="pt-3 border-t border-neutral-150 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Step 1 of 3: Blank chosen
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (validateAndProceed(2)) {
                      setActiveStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="rounded-full bg-gradient-to-r from-neutral-900 to-black hover:from-[#FF2E2E] hover:to-[#E51E2B] text-white px-7 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md active:scale-95 cursor-pointer min-h-[44px]"
                >
                  <span>Next: Add Artwork</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 2: ARTWORK, DESIGN UPLOAD & PRINT PLACEMENT */}
          {/* ============================================================= */}
          {activeStep === 2 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[#FF2E2E] uppercase tracking-widest block mb-1">
                  STEP 02 OF 03 • ARTWORK & PLACEMENT
                </span>
                <h2 className="text-lg sm:text-2xl font-black uppercase text-neutral-900 tracking-tight leading-snug">
                  Upload Design or Describe Concept
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Drop your artwork file from your phone, or type an idea for our studio artists to illustrate.
                </p>
              </div>

              {/* Pathway Toggle (Soft Rounded Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDesignSource('have_design')}
                  className={`p-3.5 border-2 rounded-2xl text-left transition-all flex items-center gap-3 cursor-pointer min-h-[56px] ${
                    designSource === 'have_design'
                      ? 'border-[#FF2E2E] bg-red-50/20 text-[#FF2E2E] ring-2 ring-[#FF2E2E]/20'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4 text-neutral-900" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase block text-neutral-900">
                      Upload Artwork / Photo
                    </span>
                    <span className="text-[10px] text-neutral-500 font-normal">
                      PNG, JPG, SVG, WebP, PDF (from Camera / Gallery)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDesignSource('have_idea')}
                  className={`p-3.5 border-2 rounded-2xl text-left transition-all flex items-center gap-3 cursor-pointer min-h-[56px] ${
                    designSource === 'have_idea'
                      ? 'border-[#FF2E2E] bg-red-50/20 text-[#FF2E2E] ring-2 ring-[#FF2E2E]/20'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4 text-neutral-900" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase block text-neutral-900">
                      I Have an Idea / Prompt
                    </span>
                    <span className="text-[10px] text-neutral-500 font-normal">
                      Describe it & our studio crafts the proof
                    </span>
                  </div>
                </button>
              </div>

              {/* PATHWAY A: UPLOAD FILE DROPZONE */}
              {designSource === 'have_design' && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-neutral-300 hover:border-neutral-800 rounded-3xl p-5 sm:p-7 text-center bg-neutral-50/60 transition-colors">
                    <input
                      type="file"
                      id="customise-file-upload-input"
                      multiple
                      accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      disabled={isUploadingFile}
                    />
                    <label
                      htmlFor="customise-file-upload-input"
                      className="cursor-pointer inline-flex flex-col items-center justify-center w-full"
                    >
                      <div className="w-12 h-12 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-700 mb-2 shadow-2xs">
                        {isUploadingFile ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#FF2E2E]" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase text-neutral-900 tracking-wider">
                        {isUploadingFile ? 'Uploading Artwork to Studio...' : 'Tap to Choose Photo or Graphic from Phone'}
                      </span>
                      <span className="text-[11px] text-neutral-500 mt-1">
                        Camera, Photo Gallery, PNG transparent, JPG, PDF (Up to 25MB)
                      </span>
                    </label>
                  </div>

                  {/* Resolution Warning */}
                  {fileResolutionWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{fileResolutionWarning}</span>
                    </div>
                  )}

                  {/* Uploaded File List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase text-neutral-700 block">
                        Uploaded Artwork ({uploadedFiles.length})
                      </span>
                      <div className="space-y-2">
                        {uploadedFiles.map((f, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 sm:p-3 bg-neutral-50 border border-neutral-200 rounded-2xl"
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3 truncate">
                              {f.mimeType?.startsWith('image/') ? (
                                <img
                                  src={f.fileUrl}
                                  alt=""
                                  className="w-12 h-12 object-contain rounded-xl border border-neutral-200 bg-white shrink-0 p-1 shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 rounded-xl shrink-0 shadow-2xs">
                                  <FileText className="w-5 h-5" />
                                </div>
                              )}
                              <div className="truncate">
                                <span className="text-xs font-bold text-neutral-900 block truncate">
                                  {f.fileName}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Ready for HD DTF Printing</span>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="text-neutral-400 hover:text-red-600 p-2 rounded-full hover:bg-neutral-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Print Instructions */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                      Print Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={printingInstructions}
                      onChange={(e) => setPrintingInstructions(e.target.value)}
                      placeholder="e.g. Keep background transparent, center alignment, vintage matte finish..."
                      className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                    />
                  </div>
                </div>
              )}

              {/* PATHWAY B: DESCRIBE IDEA & QUICK INSPIRATION PRESETS */}
              {designSource === 'have_idea' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                        Describe Your Concept *
                      </label>
                      <span className="text-[10px] text-neutral-400">Our studio artists illustrate it</span>
                    </div>
                    <textarea
                      rows={3}
                      value={designDescription}
                      onChange={(e) => setDesignDescription(e.target.value)}
                      placeholder="e.g. Vintage Baahubali typography in Telugu & English with a weathered battle sword emblem on back..."
                      className="w-full p-3.5 border border-neutral-300 rounded-2xl text-xs bg-neutral-50/50 focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                    />
                  </div>

                  {/* 1-Click Inspiration Chips */}
                  <div>
                    <span className="text-[11px] font-bold uppercase text-neutral-700 block mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF2E2E]" />
                      <span>Or Tap a Popular Concept to Autofill:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUICK_INSPIRATION_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPreset(p)}
                          className="p-3 text-left border border-neutral-200 hover:border-black rounded-2xl bg-neutral-50/50 hover:bg-white transition-all cursor-pointer min-h-[44px] active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{p.icon}</span>
                            <span className="text-xs font-bold uppercase text-neutral-900 truncate">
                              {p.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                            {p.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Print Placement Quick Cards (6 Soft Interactive Cards) */}
              <div className="space-y-2 pt-2 border-t border-neutral-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                    Print Location on Garment *
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    Live updates on mockup above
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'front' as const, label: 'Front Graphic', subtitle: 'Large center chest', icon: '👕', tag: 'Most Popular' },
                    { id: 'back' as const, label: 'Back Statement', subtitle: 'Full back canvas', icon: '🦅', tag: 'Streetwear' },
                    { id: 'both' as const, label: 'Front + Back', subtitle: 'Double-sided drop', icon: '🔥', tag: '2 Locations' },
                    { id: 'chest' as const, label: 'Left Chest', subtitle: 'Minimal crest logo', icon: '👑', tag: 'Subtle' },
                    { id: 'sleeve' as const, label: 'Sleeve Accent', subtitle: 'Outer arm placement', icon: '🦾', tag: 'Accent' },
                    { id: 'custom' as const, label: 'Custom Placement', subtitle: 'Specific coordinates', icon: '✂️', tag: 'Bespoke' }
                  ].map(loc => {
                    const isLocActive = quickPlacementType === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelectQuickPlacement(loc.id)}
                        className={`p-3 border-2 rounded-2xl text-left transition-all flex flex-col justify-between cursor-pointer min-h-[72px] ${
                          isLocActive
                            ? 'border-[#FF2E2E] bg-red-50/20 ring-2 ring-[#FF2E2E]/20 shadow-2xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-base mb-1">
                          <span>{loc.icon}</span>
                          {isLocActive ? (
                            <Check className="w-3.5 h-3.5 text-[#FF2E2E]" />
                          ) : (
                            <span className="text-[8px] uppercase font-bold text-neutral-400">{loc.tag}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase text-neutral-900 block truncate">
                            {loc.label}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-neutral-500 block truncate">
                            {loc.subtitle}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2 In-Page Navigation Controls */}
              <div className="pt-3 border-t border-neutral-150 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-700 transition-colors rounded-full flex items-center gap-1.5 min-h-[44px] active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateAndProceed(3)) {
                      setActiveStep(3);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="rounded-full bg-neutral-900 hover:bg-[#FF2E2E] text-white px-7 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md active:scale-95 cursor-pointer min-h-[44px]"
                >
                  <span>Next: Size & WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 3: SIZE, QUANTITY & INSTANT WHATSAPP DETAILS */}
          {/* ============================================================= */}
          {activeStep === 3 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[#FF2E2E] uppercase tracking-widest block mb-1">
                  STEP 03 OF 03 • SIZE, QUANTITY & CONTACT
                </span>
                <h2 className="text-lg sm:text-2xl font-black uppercase text-neutral-900 tracking-tight leading-snug">
                  Select Size & WhatsApp Details
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Zero upfront payment. Pricing is evaluated in our admin portal based on your exact print size, ink coverage, and blank selection.
                </p>
              </div>

              {/* Size Selector Pills (Soft Touch-Friendly Large Targets) */}
              {!isAdvancedSizesOpen && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Garment Size *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-[10px] text-[#FF2E2E] font-bold uppercase underline flex items-center gap-1 cursor-pointer"
                    >
                      <Ruler className="w-3 h-3" />
                      <span>Size Guide Chart</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                      const isSizeActive = singleSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSingleSize(sz)}
                          className={`py-3 rounded-full text-xs font-bold uppercase transition-all min-h-[44px] cursor-pointer ${
                            isSizeActive
                              ? 'bg-[#FF2E2E] text-white shadow-md shadow-red-500/25 scale-105'
                              : 'bg-white border-2 border-neutral-200 hover:border-neutral-400 text-neutral-800'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Quick Quantity Pills */}
              {!isAdvancedSizesOpen && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 sm:p-3.5 bg-neutral-50/80 border border-neutral-200/90 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold uppercase text-neutral-900 block">
                        Order Quantity:
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {singleQuantity >= 5 ? '🎉 Bulk discount applied!' : 'Bulk discount for 5+ pieces'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSingleQuantity(Math.max(1, singleQuantity - 1))}
                        disabled={singleQuantity <= 1}
                        className="w-10 h-10 rounded-full border border-neutral-300 bg-white flex items-center justify-center hover:bg-neutral-100 disabled:opacity-40 min-h-[40px] min-w-[40px] active:scale-90 transition-all cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-base font-bold text-neutral-900 w-9 text-center font-mono">
                        {singleQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSingleQuantity(singleQuantity + 1)}
                        className="w-10 h-10 rounded-full border border-neutral-300 bg-white flex items-center justify-center hover:bg-neutral-100 min-h-[40px] min-w-[40px] active:scale-90 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Quantity Shortcut Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
                    <span className="text-[10px] uppercase text-neutral-400 shrink-0">Quick:</span>
                    {[1, 2, 5, 10, 25, 50].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setSingleQuantity(qty)}
                        className={`px-3 py-1 rounded-full border transition-colors shrink-0 cursor-pointer ${
                          singleQuantity === qty
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500'
                        }`}
                      >
                        {qty} {qty === 1 ? 'pc' : 'pcs'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Group / Multi-Size Run Accordion Toggle */}
              <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAdvancedSizesOpen(!isAdvancedSizesOpen)}
                  className="w-full p-3.5 bg-neutral-50/80 hover:bg-neutral-100 flex items-center justify-between text-left transition-colors min-h-[44px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#FF2E2E] shrink-0" />
                    <span className="text-xs font-bold uppercase text-neutral-900">
                      Ordering for Team, Friends, or Event? (Multi-Size Breakdown)
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isAdvancedSizesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAdvancedSizesOpen && (
                  <div className="p-3 sm:p-4 bg-white border-t border-neutral-200 space-y-3">
                    <VariantQuantityMatrix
                      variants={variants}
                      onChangeVariants={(newVariants) => setVariants(newVariants)}
                      colors={catalog.colors}
                      intendedUse="personal"
                      onChangeIntendedUse={() => {}}
                      requiredDate={requiredDate}
                      onChangeRequiredDate={setRequiredDate}
                      additionalNotes={additionalNotes}
                      onChangeAdditionalNotes={setAdditionalNotes}
                    />
                  </div>
                )}
              </div>

              {/* Contact Information (Mobile-Friendly Form) */}
              <div className="space-y-3 pt-1 border-t border-neutral-150">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                    Contact & Proof Delivery Details *
                  </label>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    We will send digital mockups and quotation directly to your WhatsApp.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Full Name */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      autoComplete="name"
                      autoCapitalize="words"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Charith Reddy"
                      className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                      required
                    />
                  </div>

                  {/* WhatsApp Mobile Number with +91 indicator */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      WhatsApp Mobile Number * (For digital proofs)
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3.5 border border-r-0 border-neutral-300 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-l-xl">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full p-3 border border-neutral-300 rounded-r-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                        required
                      />
                    </div>
                  </div>

                  {/* Preferred Contact Channel */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      Preferred Communication Channel
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle },
                        { id: 'phone' as const, label: 'Phone Call', icon: Phone },
                        { id: 'email' as const, label: 'Email', icon: Mail }
                      ].map(ch => {
                        const isChActive = preferredContact === ch.id;
                        const IconComp = ch.icon;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setPreferredContact(ch.id)}
                            className={`p-2.5 border-2 rounded-2xl text-center transition-all flex flex-col items-center justify-center min-h-[48px] cursor-pointer ${
                              isChActive
                                ? 'border-[#FF2E2E] bg-red-50/20 text-[#FF2E2E] font-bold ring-2 ring-[#FF2E2E]/20'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                            }`}
                          >
                            <IconComp className="w-3.5 h-3.5 mb-0.5" />
                            <span className="text-[11px] font-bold uppercase">{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2-Column: Email & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="patron@example.com"
                        className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        Delivery City & Pincode (Optional)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City (e.g. Tirupati)"
                          className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="Pincode (e.g. 517501)"
                          className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Street Address (Optional) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      Street Delivery Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Door / Flat No., Apartment, Street, Landmark"
                      className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                    />
                  </div>

                  {/* Desired Date & Special Requests */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        Needed By Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={requiredDate}
                        onChange={(e) => setRequiredDate(e.target.value)}
                        className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        Special Requests / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="e.g. Birthday gift, urgent dispatch..."
                        className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Studio Trust / Zero Risk Guarantee Card */}
              <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-1.5 text-xs shadow-md">
                <div className="flex items-center gap-1.5 text-[#FF2E2E] font-bold uppercase">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>TH3EE Atelier Patron Assurance</span>
                </div>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  <strong>Zero upfront payment required.</strong> Pricing is calculated by our studio team based on your exact print size, ink coverage, and blank cut. We will send an itemised quote and digital proof directly to your WhatsApp. You can negotiate, approve, and pay securely online right through the site!
                </p>
              </div>

              {/* Step 3 Navigation & Submit CTA */}
              <div className="pt-3 border-t border-neutral-150 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-700 transition-colors rounded-full flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 2</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] hover:from-neutral-900 hover:to-black text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-xl active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-[48px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Custom Order...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit Free Request • Free Mockup</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* COLLAPSIBLE ATELIER SPECIFICATION SUMMARY (Compact on Mobile) */}
        {/* ========================================================================= */}
        <div className="mt-4 sm:mt-6 bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 pb-2">
            <div>
              <span className="text-[10px] font-bold text-[#FF2E2E] uppercase tracking-widest block font-mono">
                CURRENT SPECIFICATION SUMMARY
              </span>
              <h3 className="text-xs sm:text-base font-black uppercase text-neutral-900 tracking-tight">
                Live Atelier Configuration
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsLiveSummaryOpen(!isLiveSummaryOpen)}
                className="text-[11px] font-bold uppercase px-3 py-1 rounded-full border border-neutral-200 hover:bg-neutral-100 flex items-center gap-1 text-neutral-700 transition-colors cursor-pointer"
              >
                <span>{isLiveSummaryOpen ? 'Hide' : 'View'} Details</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLiveSummaryOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Details */}
          {isLiveSummaryOpen && (
            <div className="pt-3 border-t border-neutral-150 mt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                {/* 1. Blank & Fit */}
                <div className="p-3 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Garment Cut</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStep(1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[9px] font-bold uppercase text-[#FF2E2E] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-black uppercase text-neutral-900 truncate text-[11px] sm:text-xs">
                    {fit} {garmentCategory}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                    {gsm} • {sleeve}
                  </p>
                </div>

                {/* 2. Colorway */}
                <div className="p-3 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Colorway</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStep(1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[9px] font-bold uppercase text-[#FF2E2E] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-3 h-3 rounded-full border border-neutral-400 shrink-0 shadow-2xs"
                      style={{ backgroundColor: selectedColorHex }}
                    />
                    <p className="font-black uppercase text-neutral-900 truncate text-[11px] sm:text-xs">
                      {primaryColor}
                    </p>
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                    {neckType}
                  </p>
                </div>

                {/* 3. Artwork & Placement */}
                <div className="p-3 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Placement</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStep(2);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[9px] font-bold uppercase text-[#FF2E2E] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-black uppercase text-neutral-900 truncate text-[11px] sm:text-xs">
                    {quickPlacementType === 'front'
                      ? 'Front Center'
                      : quickPlacementType === 'back'
                      ? 'Full Back Canvas'
                      : quickPlacementType === 'both'
                      ? 'Front + Back'
                      : quickPlacementType === 'chest'
                      ? 'Left Chest'
                      : quickPlacementType === 'sleeve'
                      ? 'Sleeve Print'
                      : 'Custom Zone'}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                    {uploadedFiles.length > 0
                      ? `Uploaded (${uploadedFiles[0].fileName})`
                      : designDescription
                      ? 'Idea Prompt Set'
                      : 'Pending in Step 2'}
                  </p>
                </div>

                {/* 4. Sizing & Total Pieces */}
                <div className="p-3 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Size & Run</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStep(3);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[9px] font-bold uppercase text-[#FF2E2E] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-black uppercase text-neutral-900 truncate text-[11px] sm:text-xs">
                    {isAdvancedSizesOpen ? 'Multi-Size Run' : `Size ${singleSize}`}
                  </p>
                  <p className="text-[10px] text-[#FF2E2E] font-bold truncate mt-0.5">
                    {totalQuantity} {totalQuantity === 1 ? 'Piece' : 'Pieces'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Policy Banner */}
          <div className="p-3.5 bg-neutral-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-md mt-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FF2E2E] text-white">
                  Pricing Policy
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-neutral-200">
                  Calculated by Studio in Admin Panel
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-300 leading-relaxed max-w-xl">
                Prices are <strong>never fixed upfront</strong>. Our studio evaluates exact print dimensions and artwork in the admin portal, passes itemised quote to WhatsApp, and you pay securely online right through the site once approved.
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right border-t sm:border-t-0 sm:border-l border-neutral-700 pt-1.5 sm:pt-0 sm:pl-3 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase">Upfront Advance</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-tight">₹0 Required Now</span>
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE FLOATING STICKY ACTION BAR (Modern Soft Pill Design) */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-2xl rounded-3xl p-3 sm:hidden pb-[calc(0.7rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="truncate flex-1 flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0 shadow-2xs"
              style={{ backgroundColor: selectedColorHex }}
            />
            <div className="truncate">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block truncate leading-none">
                Step {activeStep}/3 • {fit}
              </span>
              <span className="text-[11px] font-black uppercase text-neutral-900 truncate block mt-0.5">
                {primaryColor} • {garmentCategory}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
            ₹0 Now
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeStep > 1 && (
            <button
              type="button"
              onClick={() => {
                setActiveStep(activeStep - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold uppercase rounded-full flex items-center justify-center gap-1 min-h-[44px] shrink-0 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {activeStep < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (validateAndProceed(activeStep + 1)) {
                  setActiveStep(activeStep + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex-1 rounded-full bg-gradient-to-r from-neutral-900 to-black hover:from-[#FF2E2E] hover:to-[#E51E2B] text-white py-3 px-5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 min-h-[44px] shadow-md active:scale-95 cursor-pointer transition-all"
            >
              <span>{activeStep === 1 ? 'Next: Add Artwork' : 'Next: Size & Details'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] text-white py-3 px-5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 min-h-[44px] shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Free Request</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        selectedFit={fit}
        fitOptions={catalog.fits}
        onSelectFit={(newFit) => setFit(newFit)}
      />
    </div>
  );
};

export default CustomiseWizard;

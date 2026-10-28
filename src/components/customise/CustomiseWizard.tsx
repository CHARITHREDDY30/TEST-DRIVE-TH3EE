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
import { customerService } from '../../services/customer.service';
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
    badge: 'Best Seller',
    gsmText: '240 GSM',
    fabric: '240 GSM Luxury French Terry Cotton'
  },
  {
    category: 'T-Shirt' as GarmentCategoryType,
    fit: 'Boxy Fit' as GarmentFitType,
    title: 'Boxy Cropped Tee',
    badge: 'Streetwear',
    gsmText: '240 GSM',
    fabric: '240 GSM Luxury French Terry Cotton'
  },
  {
    category: 'T-Shirt' as GarmentCategoryType,
    fit: 'Regular Fit' as GarmentFitType,
    title: 'Regular Classic Tee',
    badge: 'Classic',
    gsmText: '180 GSM',
    fabric: '180 GSM Pure Combed Cotton'
  },
  {
    category: 'Hoodie' as GarmentCategoryType,
    fit: 'Oversized' as GarmentFitType,
    title: 'Streetwear Hoodie',
    badge: 'Heavyweight',
    gsmText: '380 GSM',
    fabric: '380 GSM Heavyweight Brushed Fleece'
  },
  {
    category: 'T-Shirt' as GarmentCategoryType,
    fit: 'Regular Fit' as GarmentFitType,
    title: 'Polo Street Tee',
    badge: 'Collar',
    gsmText: '220 GSM',
    fabric: '220 GSM Combed Pique Cotton'
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

  // Resolved Front and Back artwork helpers
  const frontArtworkFile = uploadedFiles.find(f =>
    f.targetPlacement?.includes('front') ||
    f.targetPlacement?.includes('chest') ||
    f.targetPlacement === 'front'
  ) || (quickPlacementType !== 'back' ? uploadedFiles[0] : undefined);

  const backArtworkFile = uploadedFiles.find(f =>
    f.targetPlacement?.includes('back') ||
    f.targetPlacement === 'back'
  ) || (quickPlacementType === 'back' ? uploadedFiles[0] : (uploadedFiles.length > 1 && quickPlacementType === 'both' ? uploadedFiles[1] : undefined));

  // Automatically keep placements' artwork synced when files or placement mode change
  useEffect(() => {
    if (placements.length === 0) return;
    setPlacements(prev => prev.map(p => {
      const isFront = p.placementLocation.includes('front') || p.placementLocation.includes('chest');
      const isBack = p.placementLocation.includes('back');
      if (isFront && frontArtworkFile) {
        return { ...p, artworkUrl: frontArtworkFile.fileUrl, artworkKey: frontArtworkFile.fileKey };
      }
      if (isBack && backArtworkFile) {
        return { ...p, artworkUrl: backArtworkFile.fileUrl, artworkKey: backArtworkFile.fileKey };
      }
      return p;
    }));
  }, [uploadedFiles, quickPlacementType]);

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
    const frontArtUrl = frontArtworkFile?.fileUrl || (type !== 'back' ? uploadedFiles[0]?.fileUrl : undefined);
    const frontArtKey = frontArtworkFile?.fileKey || (type !== 'back' ? uploadedFiles[0]?.fileKey : undefined);
    const backArtUrl = backArtworkFile?.fileUrl || (type === 'back' ? uploadedFiles[0]?.fileUrl : (uploadedFiles.length > 1 ? uploadedFiles[1]?.fileUrl : undefined));
    const backArtKey = backArtworkFile?.fileKey || (type === 'back' ? uploadedFiles[0]?.fileKey : (uploadedFiles.length > 1 ? uploadedFiles[1]?.fileKey : undefined));

    if (type === 'front') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'large_front',
          printSize: 'large',
          artworkUrl: frontArtUrl,
          artworkKey: frontArtKey
        }
      ]);
    } else if (type === 'back') {
      setActivePreviewView('back');
      setPlacements([
        {
          placementLocation: 'full_back',
          printSize: 'large',
          artworkUrl: backArtUrl,
          artworkKey: backArtKey
        }
      ]);
    } else if (type === 'both') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'front_chest',
          printSize: 'small',
          artworkUrl: frontArtUrl,
          artworkKey: frontArtKey,
          notes: 'Front Chest Logo'
        },
        {
          placementLocation: 'full_back',
          printSize: 'large',
          artworkUrl: backArtUrl,
          artworkKey: backArtKey,
          notes: 'Full Back Statement'
        }
      ]);
    } else if (type === 'chest') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'front_chest',
          printSize: 'small',
          artworkUrl: frontArtUrl,
          artworkKey: frontArtKey
        }
      ]);
    } else if (type === 'sleeve') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'left_sleeve',
          printSize: 'small',
          artworkUrl: frontArtUrl,
          artworkKey: frontArtKey,
          notes: 'Left Sleeve Bicep'
        }
      ]);
    } else if (type === 'custom') {
      setActivePreviewView('front');
      setPlacements([
        {
          placementLocation: 'custom',
          printSize: 'custom',
          artworkUrl: frontArtUrl,
          artworkKey: frontArtKey,
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

  // Upload file handler with target slot awareness
  const handleFileUpload = async (filesToUpload: FileList | null, targetSlot: 'front' | 'back' | 'auto' = 'auto') => {
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

        let resolvedTarget: string;
        if (targetSlot === 'front') {
          resolvedTarget = quickPlacementType === 'chest' ? 'front_chest' : 'large_front';
          setActivePreviewView('front');
        } else if (targetSlot === 'back') {
          resolvedTarget = 'full_back';
          setActivePreviewView('back');
        } else {
          resolvedTarget = quickPlacementType === 'back' ? 'full_back' : 'large_front';
        }

        const newFileObj: CustomRequestFile = {
          fileType: designSource === 'have_design' ? 'artwork' : 'reference',
          fileName: result.name,
          fileUrl: result.url,
          fileKey: result.key,
          fileSizeBytes: result.size,
          mimeType: result.type,
          targetPlacement: resolvedTarget
        };

        if (targetSlot === 'front') {
          const existingFrontIdx = newFiles.findIndex(f => f.targetPlacement?.includes('front') || f.targetPlacement?.includes('chest'));
          if (existingFrontIdx !== -1) {
            newFiles[existingFrontIdx] = newFileObj;
          } else {
            newFiles.unshift(newFileObj);
          }
        } else if (targetSlot === 'back') {
          const existingBackIdx = newFiles.findIndex(f => f.targetPlacement?.includes('back'));
          if (existingBackIdx !== -1) {
            newFiles[existingBackIdx] = newFileObj;
          } else {
            newFiles.push(newFileObj);
          }
        } else {
          newFiles.push(newFileObj);
        }

        showNotification({
          type: 'success',
          message: `${targetSlot === 'back' ? 'Back' : targetSlot === 'front' ? 'Front' : ''} Artwork "${file.name}" ready for printing!`
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
  };

  const handleRemoveSlot = (slot: 'front' | 'back') => {
    const next = uploadedFiles.filter(f =>
      slot === 'front'
        ? (!f.targetPlacement?.includes('front') && !f.targetPlacement?.includes('chest') && f.targetPlacement !== 'front')
        : (!f.targetPlacement?.includes('back') && f.targetPlacement !== 'back')
    );
    setUploadedFiles(next);
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

      let resolvedCustomerId: string | undefined = undefined;
      if (currentUser) {
        try {
          resolvedCustomerId = (await customerService.ensureCustomerRecord(currentUser, {
            name: customerName.trim(),
            phone: cleanPhone
          })) || undefined;
        } catch {
          resolvedCustomerId = undefined;
        }
      }

      const payload: SubmitCustomRequestPayload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase() || `${cleanPhone}@th3ee.store`,
        customer_phone: cleanPhone,
        preferred_contact: preferredContact,
        customer_id: resolvedCustomerId || undefined,
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
        placements: placements.map(p => {
          const isFront = p.placementLocation.includes('front') || p.placementLocation.includes('chest');
          const isBack = p.placementLocation.includes('back');
          const matchedArt = isFront ? (frontArtworkFile || uploadedFiles[0]) : (isBack ? (backArtworkFile || uploadedFiles[0]) : uploadedFiles[0]);
          return {
            placement_location: p.placementLocation,
            print_size: p.printSize,
            custom_dimensions: p.customDimensions,
            artwork_url: p.artworkUrl || matchedArt?.fileUrl,
            artwork_key: p.artworkKey || matchedArt?.fileKey,
            notes: p.notes
          };
        }),
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

        {/* Minimal Breadcrumb */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-wider text-neutral-400 flex items-center space-x-1 font-mono">
            <button type="button" onClick={() => navigate('/')} className="hover:text-[#FF2E2E] transition-colors cursor-pointer">Home</button>
            <span>/</span>
            <span className="text-neutral-800 font-bold">Custom Studio</span>
          </nav>
        </div>

        {/* Studio Hero Title (Clean & Compact) */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
            Custom Studio
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Direct-to-Film prints on heavyweight cotton • Free digital proof on WhatsApp
          </p>
        </div>

        {/* ============================================================= */}
        {/* INTERACTIVE LIVE GARMENT MOCKUP STAGE */}
        {/* ============================================================= */}
        <div className="mb-4 bg-gradient-to-b from-white via-neutral-50/70 to-white border border-neutral-200/90 rounded-3xl p-3 sm:p-4 shadow-sm relative overflow-hidden transition-all duration-300">
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
            </div>

            {/* Stage Actions: Segmented Front/Back Switcher + Flip + Mobile Toggle */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {/* Segmented Front / Back Switcher with upload status indicator */}
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-full border border-neutral-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActivePreviewView('front')}
                  className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePreviewView === 'front'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <span>Front</span>
                  {frontArtworkFile && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Front Artwork Active" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewView('back')}
                  className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePreviewView === 'back'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <span>Back</span>
                  {backArtworkFile && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Back Artwork Active" />
                  )}
                </button>
              </div>

              {/* Quick Flip Button */}
              <button
                type="button"
                onClick={() => setActivePreviewView(activePreviewView === 'front' ? 'back' : 'front')}
                className="p-1.5 bg-neutral-900 hover:bg-[#FF2E2E] active:scale-95 text-white rounded-full text-[11px] font-bold uppercase shadow-xs transition-all cursor-pointer"
                title="Flip View"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Mobile Collapse/Expand Preview */}
              <button
                type="button"
                onClick={() => setIsMockupExpandedOnMobile(!isMockupExpandedOnMobile)}
                className="sm:hidden p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors active:scale-90 cursor-pointer"
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
                    activePlacement={activePreviewView === 'front'
                      ? (placements.find(p => p.placementLocation.includes('front') || p.placementLocation.includes('chest'))?.placementLocation || 'large_front')
                      : (placements.find(p => p.placementLocation.includes('back'))?.placementLocation || 'full_back')
                    }
                    artworkPreviewUrl={uploadedFiles[0]?.fileUrl || null}
                    frontArtworkUrl={frontArtworkFile?.fileUrl || null}
                    backArtworkUrl={backArtworkFile?.fileUrl || null}
                    showHotspots={true}
                    className="w-full h-full drop-shadow-md transition-all duration-300"
                  />

                  {/* Active View Floating Pill */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-neutral-200/90 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-neutral-700 shadow-xs pointer-events-none whitespace-nowrap">
                    {activePreviewView === 'front' ? 'Front' : 'Back'}
                  </div>
                </div>

                {/* Instant 1-Tap Color Swatch Tray on Mockup Stage (All Colors) */}
                <div className="w-full mt-2 pt-2 border-t border-neutral-200/70 flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0 pl-1">
                    Color:
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 px-1 overflow-x-auto">
                    {catalog.colors.map(swatch => {
                      const isSelected = primaryColor === swatch.name;
                      const isDark = ['#111111', '#27272A', '#58111A', '#3E2723', '#152238', '#1B4332', '#4B5320', '#1E40AF'].includes(swatch.hex.toUpperCase());
                      return (
                        <button
                          key={swatch.name}
                          type="button"
                          onClick={() => handleSelectColor(swatch)}
                          title={swatch.name}
                          className={`w-7 h-7 rounded-full transition-all flex items-center justify-center relative cursor-pointer shrink-0 ${
                            isSelected
                              ? 'ring-2 ring-[#FF2E2E] ring-offset-2 scale-110 shadow-xs'
                              : 'hover:scale-105 border border-neutral-300'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-bold uppercase text-[#FF2E2E] truncate pr-1 shrink-0">
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
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[
              { step: 1, title: 'Garment' },
              { step: 2, title: 'Artwork' },
              { step: 3, title: 'Details' }
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
                  className={`py-2 px-3 rounded-2xl text-center transition-all relative cursor-pointer border ${
                    isActive
                      ? 'border-[#FF2E2E] bg-white shadow-xs ring-2 ring-[#FF2E2E]/15'
                      : isCompleted
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white/80 hover:border-neutral-300 text-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[10px] font-bold opacity-75 font-mono">
                      0{s.step}
                    </span>
                    <span className={`text-xs font-black uppercase tracking-tight truncate ${isActive ? 'text-[#FF2E2E]' : ''}`}>
                      {s.title}
                    </span>
                    {isCompleted && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </div>
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
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black uppercase text-neutral-900 tracking-tight">
                  Garment & Color
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs text-[#FF2E2E] font-bold uppercase underline flex items-center gap-1 cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>

              {/* Garment Silhouette Selector (Clean Grid with Soft Cards) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Garment Cut *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all text-left relative flex flex-col justify-between min-h-[72px] ${
                          isSelected
                            ? 'border-[#FF2E2E] bg-red-50/25 ring-2 ring-[#FF2E2E]/20 shadow-2xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                            {item.badge}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FF2E2E]" />}
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase text-neutral-900 leading-tight">
                            {item.title}
                          </h3>
                          <span className="text-[10px] text-neutral-500 font-bold block mt-0.5">
                            {item.gsmText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sleeve Style & Collar Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Sleeve Style */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Sleeve Style
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
                          className={`py-1.5 px-3 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSleeveActive
                              ? 'bg-white text-neutral-900 shadow-xs'
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
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Collar Style
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
                          className={`py-1.5 px-3 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isNeckActive
                              ? 'bg-white text-neutral-900 shadow-xs'
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

              {/* Fabric GSM Options */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Fabric Weight
                  </label>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">
                    {gsm}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { gsmVal: '240 GSM', label: 'Heavyweight', spec: '240 GSM Luxury French Terry Cotton' },
                    { gsmVal: '200 GSM', label: 'Medium', spec: '200 GSM Premium Combed Cotton' },
                    { gsmVal: '180 GSM', label: 'Lightweight', spec: '180 GSM Pure Combed Cotton' }
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
                        className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          isFabActive
                            ? 'border-[#FF2E2E] bg-red-50/20 text-neutral-900 ring-2 ring-[#FF2E2E]/20'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <span className="text-xs font-black uppercase block">{fab.gsmVal}</span>
                        <span className="text-[10px] text-neutral-500 block truncate">{fab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Swatch Picker (All 22 Colors in responsive grid) */}
              <div className="space-y-2 pt-1 border-t border-neutral-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#FF2E2E]" />
                    <span>Garment Color ({catalog.colors.length} Available) *</span>
                  </label>
                  <span className="text-xs font-bold text-[#FF2E2E] uppercase">
                    {primaryColor}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {catalog.colors.map(swatch => {
                    const isColorActive = primaryColor === swatch.name;
                    const isDark = ['#111111', '#27272A', '#58111A', '#3E2723', '#152238', '#1B4332', '#4B5320', '#1E40AF'].includes(swatch.hex.toUpperCase());
                    return (
                      <button
                        key={swatch.name}
                        type="button"
                        onClick={() => handleSelectColor(swatch)}
                        className={`p-2 border-2 rounded-2xl flex items-center gap-2 transition-all text-left cursor-pointer min-h-[44px] ${
                          isColorActive
                            ? 'border-[#FF2E2E] bg-red-50/20 ring-2 ring-[#FF2E2E]/20 shadow-2xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-neutral-300 shrink-0 flex items-center justify-center shadow-2xs"
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {isColorActive && (
                            <Check
                              className={`w-3 h-3 ${isDark ? 'text-white' : 'text-neutral-900'}`}
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <span className="text-xs font-bold uppercase text-neutral-900 block truncate flex-1">
                          {swatch.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-Page Next Button */}
              <div className="pt-2 border-t border-neutral-150 flex items-center justify-end">
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
                  <span>Next: Artwork</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 2: ARTWORK, DESIGN UPLOAD & PRINT PLACEMENT */}
          {/* ============================================================= */}
          {activeStep === 2 && (
            <div className="space-y-4 sm:space-y-5">
              <h2 className="text-base sm:text-lg font-black uppercase text-neutral-900 tracking-tight">
                Artwork
              </h2>

              {/* Pathway Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDesignSource('have_design')}
                  className={`p-3 border-2 rounded-2xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
                    designSource === 'have_design'
                      ? 'border-[#FF2E2E] bg-red-50/20 text-[#FF2E2E] font-bold ring-2 ring-[#FF2E2E]/20 shadow-2xs'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase">Upload Design</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDesignSource('have_idea')}
                  className={`p-3 border-2 rounded-2xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
                    designSource === 'have_idea'
                      ? 'border-[#FF2E2E] bg-red-50/20 text-[#FF2E2E] font-bold ring-2 ring-[#FF2E2E]/20 shadow-2xs'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase">Describe Idea</span>
                </button>
              </div>

              {/* Print Placement Options (Clean Grid) */}
              <div className="space-y-1.5 pt-1 border-t border-neutral-150">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Print Location *
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'front' as const, label: 'Front', icon: '👕' },
                    { id: 'back' as const, label: 'Back', icon: '🦅' },
                    { id: 'both' as const, label: 'Both Sides', icon: '🔥' },
                    { id: 'chest' as const, label: 'Left Chest', icon: '👑' },
                    { id: 'sleeve' as const, label: 'Sleeve', icon: '🦾' },
                    { id: 'custom' as const, label: 'Custom', icon: '✂️' }
                  ].map(loc => {
                    const isLocActive = quickPlacementType === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelectQuickPlacement(loc.id)}
                        className={`p-2.5 border-2 rounded-2xl text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[64px] ${
                          isLocActive
                            ? 'border-[#FF2E2E] bg-red-50/20 ring-2 ring-[#FF2E2E]/20 shadow-2xs text-[#FF2E2E]'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-800'
                        }`}
                      >
                        <span className="text-lg leading-none mb-1">{loc.icon}</span>
                        <span className="text-[11px] font-bold uppercase block truncate w-full">
                          {loc.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PATHWAY A: UPLOAD FILE DROPZONES */}
              {designSource === 'have_design' && (
                <div className="space-y-3 pt-1">
                  {/* SLOT 1: FRONT GRAPHIC */}
                  {quickPlacementType !== 'back' && (
                    <div className="bg-white border-2 border-emerald-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                          <span>👕</span>
                          <span>Front Artwork</span>
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                          Front
                        </span>
                      </div>

                      {!frontArtworkFile ? (
                        <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-4 text-center bg-emerald-50/20 transition-all">
                          <input
                            type="file"
                            id="customise-file-upload-front"
                            accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,image/*"
                            onChange={(e) => handleFileUpload(e.target.files, 'front')}
                            className="hidden"
                            disabled={isUploadingFile}
                          />
                          <label
                            htmlFor="customise-file-upload-front"
                            className="cursor-pointer inline-flex flex-col items-center justify-center w-full"
                          >
                            <div className="w-9 h-9 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 mb-1 shadow-2xs">
                              {isUploadingFile ? (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-xs font-bold uppercase text-neutral-900">
                              {isUploadingFile ? 'Uploading...' : 'Upload Front Artwork'}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-2.5 truncate">
                            {frontArtworkFile.mimeType?.startsWith('image/') ? (
                              <img
                                src={frontArtworkFile.fileUrl}
                                alt="Front Artwork"
                                className="w-10 h-10 object-contain rounded-lg border border-emerald-200 bg-white shrink-0 p-1"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 rounded-lg shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="truncate">
                              <span className="text-xs font-bold text-neutral-900 block truncate">
                                {frontArtworkFile.fileName}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Uploaded</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActivePreviewView('front')}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-full transition-colors cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot('front')}
                              className="text-neutral-400 hover:text-red-600 p-1 rounded-full cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Front Scale */}
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-bold uppercase text-neutral-500">Scale:</span>
                        <div className="flex items-center gap-1">
                          {[
                            { id: 'small', label: 'Crest' },
                            { id: 'medium', label: 'Medium' },
                            { id: 'large', label: 'Large' }
                          ].map(sz => {
                            const isChosen = placements[0]?.printSize === sz.id;
                            return (
                              <button
                                key={sz.id}
                                type="button"
                                onClick={() => {
                                  const updated = [...placements];
                                  if (updated[0]) updated[0].printSize = sz.id as any;
                                  setPlacements(updated);
                                }}
                                className={`px-2.5 py-0.5 rounded-full uppercase font-bold transition-all cursor-pointer ${
                                  isChosen
                                    ? 'bg-neutral-900 text-white shadow-2xs'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                              >
                                {sz.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SLOT 2: BACK GRAPHIC */}
                  {(quickPlacementType === 'both' || quickPlacementType === 'back') && (
                    <div className="bg-white border-2 border-red-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                          <span>🦅</span>
                          <span>Back Artwork</span>
                        </span>
                        <span className="bg-red-100 text-[#FF2E2E] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                          Back
                        </span>
                      </div>

                      {!backArtworkFile ? (
                        <div className="border-2 border-dashed border-red-300 hover:border-red-500 rounded-xl p-4 text-center bg-red-50/20 transition-all">
                          <input
                            type="file"
                            id="customise-file-upload-back"
                            accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,image/*"
                            onChange={(e) => handleFileUpload(e.target.files, 'back')}
                            className="hidden"
                            disabled={isUploadingFile}
                          />
                          <label
                            htmlFor="customise-file-upload-back"
                            className="cursor-pointer inline-flex flex-col items-center justify-center w-full"
                          >
                            <div className="w-9 h-9 rounded-full bg-white border border-red-200 flex items-center justify-center text-[#FF2E2E] mb-1 shadow-2xs">
                              {isUploadingFile ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#FF2E2E]" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-xs font-bold uppercase text-neutral-900">
                              {isUploadingFile ? 'Uploading...' : 'Upload Back Artwork'}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2.5 bg-red-50/50 border border-red-200 rounded-xl">
                          <div className="flex items-center gap-2.5 truncate">
                            {backArtworkFile.mimeType?.startsWith('image/') ? (
                              <img
                                src={backArtworkFile.fileUrl}
                                alt="Back Artwork"
                                className="w-10 h-10 object-contain rounded-lg border border-red-200 bg-white shrink-0 p-1"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-white border border-red-200 flex items-center justify-center text-red-600 rounded-lg shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="truncate">
                              <span className="text-xs font-bold text-neutral-900 block truncate">
                                {backArtworkFile.fileName}
                              </span>
                              <span className="text-[10px] text-red-700 font-bold uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#FF2E2E]" />
                                <span>Uploaded</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActivePreviewView('back')}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase text-[#FF2E2E] bg-red-100 hover:bg-red-200 rounded-full transition-colors cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot('back')}
                              className="text-neutral-400 hover:text-red-600 p-1 rounded-full cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Back Scale */}
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-bold uppercase text-neutral-500">Scale:</span>
                        <div className="flex items-center gap-1">
                          {[
                            { id: 'medium', label: 'Medium' },
                            { id: 'large', label: 'Large' },
                            { id: 'extra_large', label: 'Full Back' }
                          ].map(sz => {
                            const backPlacement = placements.find(p => p.placementLocation.includes('back'));
                            const isChosen = (backPlacement?.printSize || 'large') === sz.id;
                            return (
                              <button
                                key={sz.id}
                                type="button"
                                onClick={() => {
                                  const updated = placements.map(p =>
                                    p.placementLocation.includes('back') ? { ...p, printSize: sz.id as any } : p
                                  );
                                  setPlacements(updated);
                                }}
                                className={`px-2.5 py-0.5 rounded-full uppercase font-bold transition-all cursor-pointer ${
                                  isChosen
                                    ? 'bg-neutral-900 text-white shadow-2xs'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                              >
                                {sz.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resolution Warning */}
                  {fileResolutionWarning && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{fileResolutionWarning}</span>
                    </div>
                  )}

                  {/* Print Notes */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={printingInstructions}
                      onChange={(e) => setPrintingInstructions(e.target.value)}
                      placeholder="e.g. Transparent background, center alignment..."
                      className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* PATHWAY B: DESCRIBE IDEA */}
              {designSource === 'have_idea' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block mb-1">
                      Describe Your Concept *
                    </label>
                    <textarea
                      rows={3}
                      value={designDescription}
                      onChange={(e) => setDesignDescription(e.target.value)}
                      placeholder="Describe your design, typography, or theme..."
                      className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                    />
                  </div>

                  {/* Inspiration Chips */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_INSPIRATION_PRESETS.slice(0, 4).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className="p-2 text-left border border-neutral-200 hover:border-black rounded-xl bg-neutral-50/50 hover:bg-white transition-all cursor-pointer min-h-[40px] text-xs font-bold uppercase flex items-center gap-1.5 truncate"
                      >
                        <span>{p.icon}</span>
                        <span className="truncate">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 In-Page Navigation Controls */}
              <div className="pt-2 border-t border-neutral-150 flex items-center justify-between">
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
                  <span>Next: Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 3: SIZE, QUANTITY & CONTACT */}
          {/* ============================================================= */}
          {activeStep === 3 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black uppercase text-neutral-900 tracking-tight">
                  Size & Contact
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs text-[#FF2E2E] font-bold uppercase underline flex items-center gap-1 cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>

              {/* Size Selector */}
              {!isAdvancedSizesOpen && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                    Garment Size *
                  </label>
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                      const isSizeActive = singleSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSingleSize(sz)}
                          className={`py-2.5 rounded-2xl text-xs font-bold uppercase transition-all min-h-[44px] cursor-pointer ${
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

              {/* Quantity */}
              {!isAdvancedSizesOpen && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-3 bg-neutral-50/80 border border-neutral-200/90 rounded-2xl">
                    <span className="text-xs font-bold uppercase text-neutral-900">
                      Quantity:
                    </span>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSingleQuantity(Math.max(1, singleQuantity - 1))}
                        disabled={singleQuantity <= 1}
                        className="w-9 h-9 rounded-full border border-neutral-300 bg-white flex items-center justify-center hover:bg-neutral-100 disabled:opacity-40 min-h-[36px] min-w-[36px] active:scale-90 transition-all cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-base font-bold text-neutral-900 w-8 text-center font-mono">
                        {singleQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSingleQuantity(singleQuantity + 1)}
                        className="w-9 h-9 rounded-full border border-neutral-300 bg-white flex items-center justify-center hover:bg-neutral-100 min-h-[36px] min-w-[36px] active:scale-90 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Quantity Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs font-bold">
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

              {/* Group / Multi-Size Breakdown Toggle */}
              <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAdvancedSizesOpen(!isAdvancedSizesOpen)}
                  className="w-full p-3 bg-neutral-50 hover:bg-neutral-100 flex items-center justify-between text-left transition-colors min-h-[44px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#FF2E2E] shrink-0" />
                    <span className="text-xs font-bold uppercase text-neutral-900">
                      Team / Group Order? (Multi-Size Breakdown)
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

              {/* Contact Information */}
              <div className="space-y-2.5 pt-1 border-t border-neutral-150">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Contact Details *
                </label>

                <div className="space-y-2.5">
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

                  {/* WhatsApp Mobile Number */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      WhatsApp Number *
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
                      Preferred Channel
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle },
                        { id: 'phone' as const, label: 'Call', icon: Phone },
                        { id: 'email' as const, label: 'Email', icon: Mail }
                      ].map(ch => {
                        const isChActive = preferredContact === ch.id;
                        const IconComp = ch.icon;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setPreferredContact(ch.id)}
                            className={`p-2 border-2 rounded-2xl text-center transition-all flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer ${
                              isChActive
                                ? 'border-[#FF2E2E] bg-red-50/20 text-[#FF2E2E] font-bold ring-2 ring-[#FF2E2E]/20'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                            }`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase">{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* City & Pincode (Optional) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        City (Optional)
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Tirupati"
                        className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        Pincode (Optional)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 517501"
                        className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                      />
                    </div>
                  </div>

                  {/* Notes (Optional) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      Special Requests / Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="e.g. Urgent dispatch, gift packing..."
                      className="w-full p-3 border border-neutral-300 rounded-xl text-xs bg-neutral-50/50 min-h-[44px] focus:border-[#FF2E2E] focus:ring-2 focus:ring-[#FF2E2E]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Minimal 1-Line Trust Assurance */}
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-neutral-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero advance required • Free digital mockup on WhatsApp</span>
              </div>

              {/* Step 3 Navigation & Submit CTA */}
              <div className="pt-2 border-t border-neutral-150 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-700 transition-colors rounded-full flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] hover:from-neutral-900 hover:to-black text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 active:scale-[0.98] cursor-pointer disabled:opacity-50 min-h-[48px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

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
              <span>{activeStep === 1 ? 'Next: Artwork' : 'Next: Details'}</span>
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
                  <span>Submit Request</span>
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

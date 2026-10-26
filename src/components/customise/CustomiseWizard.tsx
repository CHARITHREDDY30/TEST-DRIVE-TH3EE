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
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Layers,
  Plus,
  Minus,
  RotateCw,
  Clock,
  Truck,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';
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
  ColorSwatch,
  FabricSpec
} from '../../types/customise';
import { customiseService, type SubmitCustomRequestPayload } from '../../services/customise.service';
import { INITIAL_CUSTOMISATION_CATALOG } from '../../data/customiseCatalog';
import { GarmentSvg } from './GarmentIllustrations';
import { SizeGuideModal } from './SizeGuideModal';
import { VariantQuantityMatrix } from './VariantQuantityMatrix';

interface CustomiseWizardProps {
  navigate: (path: string) => void;
  currentUser?: any;
  showNotification: (data: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

// Preset Quick Concept Ideas for 1-Click Fill
const QUICK_INSPIRATION_PRESETS = [
  {
    label: '🎬 Baahubali / Cinema Drop',
    desc: 'Mythological typography and cinematic motifs on heavy streetwear black silhouette.',
    placement: 'large_front'
  },
  {
    label: '⚔️ Vintage Anime Statement',
    desc: 'Retro Japanese manga aesthetics with detailed backprint and minimal chest logo.',
    placement: 'full_back'
  },
  {
    label: '👑 Minimalist Chest Monogram',
    desc: 'Clean subtle crest or modern typography on the left chest with premium DTF detail.',
    placement: 'front_chest'
  },
  {
    label: '🔥 Double-Sided Streetwear',
    desc: 'Front emblem logo with a bold high-contrast back graphic illustration.',
    placement: 'large_front'
  }
];

export const CustomiseWizard: React.FC<CustomiseWizardProps> = ({
  navigate,
  currentUser,
  showNotification
}) => {
  // Catalog State
  const [catalog, setCatalog] = useState<CustomisationCatalogConfig>(INITIAL_CUSTOMISATION_CATALOG);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Simplified 3-Step Wizard:
  // Step 1: Garment & Color (Blank)
  // Step 2: Design & Placement
  // Step 3: Size & Quick WhatsApp Contact
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [previewView, setPreviewView] = useState<'front' | 'back'>('front');

  // Garment Selection (Smart Defaults: Oversized, Jet Black, Half Sleeve, Round Neck)
  const [garmentCategory, setGarmentCategory] = useState<GarmentCategoryType>('T-Shirt');
  const [fit, setFit] = useState<GarmentFitType>('Oversized');
  const [primaryColor, setPrimaryColor] = useState<string>('Jet Black');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('#111111');
  const [sleeve, setSleeve] = useState<SleeveType>('Half Sleeve');
  const [neckType, setNeckType] = useState<NeckType>('Round Neck');
  const [fabric, setFabric] = useState<string>('240 GSM Luxury French Terry Cotton');
  const [gsm, setGsm] = useState<string>('240 GSM');

  // Design & Placement
  const [designSource, setDesignSource] = useState<CustomDesignSource>('have_design');
  const [designDescription, setDesignDescription] = useState('');
  const [printingInstructions, setPrintingInstructions] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<CustomRequestFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileResolutionWarning, setFileResolutionWarning] = useState<string | null>(null);

  // Quick Placement (Default: Large Front)
  const [quickPlacementType, setQuickPlacementType] = useState<'front' | 'back' | 'both' | 'chest'>('front');
  const [placements, setPlacements] = useState<CustomRequestPlacement[]>([
    {
      placementLocation: 'large_front',
      printSize: 'large',
      notes: ''
    }
  ]);

  // Size & Quantities
  const [singleSize, setSingleSize] = useState<string>('L');
  const [singleQuantity, setSingleQuantity] = useState<number>(1);
  const [isAdvancedSizesOpen, setIsAdvancedSizesOpen] = useState<boolean>(false);
  const [isAdvancedSpecsOpen, setIsAdvancedSpecsOpen] = useState<boolean>(false);

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
  const [state, setState] = useState('Andhra Pradesh');
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
  const handleSelectQuickPlacement = (type: 'front' | 'back' | 'both' | 'chest') => {
    setQuickPlacementType(type);
    const existingArtUrl = uploadedFiles[0]?.fileUrl;
    const existingArtKey = uploadedFiles[0]?.fileKey;

    if (type === 'front') {
      setPreviewView('front');
      setPlacements([
        {
          placementLocation: 'large_front',
          printSize: 'large',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey
        }
      ]);
    } else if (type === 'back') {
      setPreviewView('back');
      setPlacements([
        {
          placementLocation: 'full_back',
          printSize: 'large',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey
        }
      ]);
    } else if (type === 'both') {
      setPreviewView('front');
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
      setPreviewView('front');
      setPlacements([
        {
          placementLocation: 'front_chest',
          printSize: 'small',
          artworkUrl: existingArtUrl,
          artworkKey: existingArtKey
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

        // Map to active placement for real-time live preview
        if (placements.length > 0) {
          const updated = [...placements];
          updated[0].artworkUrl = result.url;
          updated[0].artworkKey = result.key;
          setPlacements(updated);
        }

        showNotification({
          type: 'success',
          message: `Artwork uploaded successfully! Preview updated on your garment.`
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
    } else if (preset.label.includes('Double-Sided')) {
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
          message: 'Please upload your design/photo or describe what you want printed.'
        });
        return false;
      }
      if (designSource === 'have_idea' && !designDescription.trim()) {
        showNotification({
          type: 'error',
          message: 'Please provide a short description or pick an inspiration preset.'
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
      showNotification({ type: 'error', message: 'Please enter your name.' });
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showNotification({ type: 'error', message: 'Please enter a valid 10-digit WhatsApp or mobile number.' });
      return;
    }

    if (designSource === 'have_design' && uploadedFiles.length === 0 && !designDescription.trim()) {
      setActiveStep(2);
      showNotification({
        type: 'error',
        message: 'Please upload your design/photo in Step 2 or describe your graphic.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Build variants list
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
        message: `Order request ${result.requestNumber} registered! Digital proof being prepared.`
      });

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

  // =========================================================================
  // SUCCESS / RECEIPT VIEW
  // =========================================================================
  if (submissionResult) {
    const waUrl = `https://wa.me/919121798653?text=${encodeURIComponent(
      `Hi TH3EE Studio! I just submitted custom order #${submissionResult.requestNumber} for ${totalQuantity}x ${fit} ${garmentCategory} (${primaryColor}, Size ${singleSize}). Please send my digital 3D mockup and quote!`
    )}`;

    return (
      <div className="w-full bg-[#FAFAFA] min-h-[85vh] py-8 sm:py-16 font-mono">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white border-2 border-neutral-900 p-6 sm:p-10 shadow-xl rounded-sm text-center">
            
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="inline-block bg-[#E51E2B] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-2">
              Tirupati Atelier Studio
            </span>

            <h1 className="text-2xl sm:text-3xl font-black uppercase text-neutral-900 tracking-tight">
              Custom Order Request Received!
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto leading-relaxed">
              Your custom piece is in queue. Our print master will inspect your design, set up the high-definition DTF digital proof, and send you the preview.
            </p>

            {/* Reference Number Card */}
            <div className="my-6 p-4 sm:p-5 bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-sm inline-block w-full">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Your Order Reference ID
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#E51E2B] tracking-wider block">
                {submissionResult.requestNumber}
              </span>
              <div className="mt-2 pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-center gap-3 text-[11px] text-neutral-600">
                <span><strong>Garment:</strong> {totalQuantity}x {fit} {garmentCategory}</span>
                <span>•</span>
                <span><strong>Color:</strong> {primaryColor}</span>
                <span>•</span>
                <span><strong>Size:</strong> {isAdvancedSizesOpen ? 'Multi-Size Run' : singleSize}</span>
              </div>
            </div>

            {/* What to Expect Next (Clear & Simple) */}
            <div className="bg-neutral-900 text-white p-4 rounded-sm text-left my-5 space-y-2 text-xs">
              <span className="font-bold text-[#E51E2B] uppercase tracking-wider block">
                What Happens Next? (3 Simple Steps)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-neutral-300">
                <div className="border-l-2 border-[#E51E2B] pl-2.5">
                  <strong className="text-white block">1. 3D Mockup Sent</strong>
                  <span>We send a digital preview of your design on WhatsApp/Email in ~2 hours.</span>
                </div>
                <div className="border-l-2 border-[#E51E2B] pl-2.5">
                  <strong className="text-white block">2. Review & Approve</strong>
                  <span>You approve the placement, sizing, and transparent quotation.</span>
                </div>
                <div className="border-l-2 border-[#E51E2B] pl-2.5">
                  <strong className="text-white block">3. 48-Hour Delivery</strong>
                  <span>Handcrafted at our Tirupati lab & dispatched with live courier tracking.</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase px-6 py-3 tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Studio on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => navigate(`/customise/track/${submissionResult.trackingToken}`)}
                className="w-full sm:w-auto bg-neutral-900 hover:bg-[#E51E2B] text-white font-bold text-xs uppercase px-6 py-3 tracking-wider transition-colors"
              >
                Track Live Order Status →
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-150">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs text-neutral-500 hover:text-black uppercase font-bold tracking-wider"
              >
                ← Return to Storefront
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Active artwork image for preview
  const activeArtworkUrl = uploadedFiles[0]?.fileUrl || null;

  // =========================================================================
  // MAIN STUDIO EXPERIENCE
  // =========================================================================
  return (
    <div className="w-full bg-[#FAFAFA] min-h-[90vh] py-6 sm:py-10 font-mono text-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Minimal Breadcrumb & Trust Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-wider text-neutral-500 flex items-center space-x-2">
            <button type="button" onClick={() => navigate('/')} className="hover:text-[#E51E2B] transition-colors">Home</button>
            <span>/</span>
            <span className="text-neutral-900 font-bold">Customise Studio</span>
          </nav>

          <div className="flex items-center gap-2">
            <span className="bg-[#E51E2B]/10 text-[#E51E2B] border border-[#E51E2B]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>30-Sec Fast Order • Ready in 48h</span>
            </span>
          </div>
        </div>

        {/* Studio Hero Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900 leading-none">
            TH3EE Custom Apparel Studio
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 max-w-2xl leading-relaxed">
            High-Definition Direct-to-Film (DTF) prints on premium heavyweight cotton. No minimum order quantity. Free 3D digital proof sent to your WhatsApp before printing.
          </p>
        </div>

        {/* Rapid 3-Step Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          {[
            { step: 1, title: '1. Garment & Color', subtitle: 'Choose fit & blank shade' },
            { step: 2, title: '2. Design & Placement', subtitle: 'Upload artwork or idea' },
            { step: 3, title: '3. Size & WhatsApp', subtitle: 'Instant quote & mockup' }
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
                  }
                }}
                className={`p-2.5 sm:p-3.5 border-2 rounded-xs text-left transition-all ${
                  isActive
                    ? 'border-[#E51E2B] bg-white shadow-sm ring-1 ring-[#E51E2B]'
                    : isCompleted
                    ? 'border-neutral-900 bg-neutral-900 text-white cursor-pointer'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isActive ? 'text-[#E51E2B]' : ''}`}>
                    {s.title}
                  </span>
                  {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <span className={`text-[10px] hidden sm:block mt-0.5 ${isActive ? 'text-neutral-600' : isCompleted ? 'text-neutral-400' : 'text-neutral-400'}`}>
                  {s.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2-COLUMN MAIN STUDIO LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: LIVE INTERACTIVE GARMENT STUDIO (STICKY ON DESKTOP) */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-4 bg-white border-2 border-neutral-900 rounded-sm p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-150">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                  Live Garment Preview
                </span>
              </div>

              {/* Front / Back Toggle */}
              <div className="inline-flex p-0.5 bg-neutral-100 rounded-xs border border-neutral-200 text-[10px] font-bold uppercase">
                <button
                  type="button"
                  onClick={() => setPreviewView('front')}
                  className={`px-3 py-1 rounded-2xs transition-colors ${
                    previewView === 'front'
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewView('back')}
                  className={`px-3 py-1 rounded-2xs transition-colors ${
                    previewView === 'back'
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  Back
                </button>
              </div>
            </div>

            {/* Interactive SVG Canvas with Real-Time Color & Artwork Overlay */}
            <div className="my-4 relative bg-neutral-50/70 border border-neutral-200 rounded-sm p-3 sm:p-4 flex items-center justify-center overflow-hidden min-h-[320px] sm:min-h-[380px]">
              <GarmentSvg
                view={previewView}
                fit={fit}
                sleeve={sleeve}
                neckType={neckType}
                colorHex={selectedColorHex}
                selectedPlacements={placements.map(p => p.placementLocation)}
                activePlacement={placements[0]?.placementLocation || null}
                onSelectPlacement={(placementId) => {
                  setPlacements([
                    {
                      placementLocation: placementId,
                      printSize: 'large',
                      artworkUrl: activeArtworkUrl || undefined
                    }
                  ]);
                }}
                artworkPreviewUrl={activeArtworkUrl}
                className="w-full max-w-[340px] h-auto drop-shadow-sm transition-all duration-300"
              />

              {/* View Rotate Pill Overlay */}
              <button
                type="button"
                onClick={() => setPreviewView(prev => prev === 'front' ? 'back' : 'front')}
                className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-neutral-800 border border-neutral-200 text-[10px] font-bold uppercase px-2.5 py-1 rounded-xs flex items-center gap-1 shadow-xs transition-colors"
              >
                <RotateCw className="w-3 h-3" />
                <span>Flip to {previewView === 'front' ? 'Back' : 'Front'}</span>
              </button>
            </div>

            {/* Live Specs Card */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xs p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px] uppercase">Silhouette:</span>
                <span className="font-bold text-neutral-900 uppercase">
                  {fit} {garmentCategory} ({primaryColor})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px] uppercase">Fabric Weight:</span>
                <span className="font-bold text-neutral-900 uppercase">{gsm} French Terry</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px] uppercase">Print Position:</span>
                <span className="font-bold text-[#E51E2B] uppercase">
                  {quickPlacementType === 'front' ? 'Large Front Graphic' : quickPlacementType === 'back' ? 'Full Back Statement' : quickPlacementType === 'both' ? 'Double-Sided (Front + Back)' : 'Left Chest Monogram'}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-neutral-500 text-[11px] uppercase">Estimated Price:</span>
                <span className="font-black text-neutral-900 text-sm">
                  ₹699 - ₹849 <span className="text-[10px] text-neutral-500 font-normal">/ piece</span>
                </span>
              </div>
            </div>

            {/* Interactive Size Guide Modal Trigger */}
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-[11px] text-neutral-700 hover:text-[#E51E2B] font-bold uppercase flex items-center gap-1 transition-colors"
              >
                <Ruler className="w-3.5 h-3.5 text-[#E51E2B]" />
                <span>Open Size Chart & Measurements</span>
              </button>
              <span className="text-[10px] text-neutral-400">Pre-Shrunk 100% Cotton</span>
            </div>

          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: FRICTIONLESS 3-STEP STUDIO WORKFLOW */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 bg-white border-2 border-neutral-900 rounded-sm p-5 sm:p-7 shadow-sm">

            {/* ------------------------------------------------------------- */}
            {/* STEP 1: GARMENT & COLOR (FAST, VISUAL PILLS) */}
            {/* ------------------------------------------------------------- */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block mb-1">
                    STEP 01 OF 03 • BLANK & SHADE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight">
                    Choose Your Garment & Color
                  </h2>
                  <p className="text-xs text-neutral-600 mt-1">
                    Select your signature streetwear blank. Pre-shrunk, heavyweight luxury cotton with structured drape.
                  </p>
                </div>

                {/* Garment Silhouette Selector (3 Big Cards) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                    Select Garment Cut *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        cat: 'T-Shirt' as GarmentCategoryType,
                        fitType: 'Oversized' as GarmentFitType,
                        title: 'Oversized Tee',
                        badge: 'Most Popular',
                        gsmText: '240 GSM French Terry',
                        desc: 'Dropped shoulders, relaxed streetwear boxy drape.'
                      },
                      {
                        cat: 'T-Shirt' as GarmentCategoryType,
                        fitType: 'Regular Fit' as GarmentFitType,
                        title: 'Regular Tee',
                        badge: 'Classic Fit',
                        gsmText: '180 GSM Bio-Wash',
                        desc: 'Tailored everyday fit with natural shoulder line.'
                      },
                      {
                        cat: 'Hoodie' as GarmentCategoryType,
                        fitType: 'Oversized' as GarmentFitType,
                        title: 'Streetwear Hoodie',
                        badge: 'Heavyweight',
                        gsmText: '380 GSM Brushed Fleece',
                        desc: 'Double-layered hood, kangaroo pouch, warm drape.'
                      }
                    ].map(item => {
                      const isSelected = garmentCategory === item.cat && fit === item.fitType;
                      return (
                        <div
                          key={item.title}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setGarmentCategory(item.cat);
                            setFit(item.fitType);
                            if (item.cat === 'Hoodie') {
                              setFabric('380 GSM Heavyweight Brushed Fleece');
                              setGsm('380 GSM');
                            } else if (item.fitType === 'Oversized') {
                              setFabric('240 GSM Luxury French Terry Cotton');
                              setGsm('240 GSM');
                            } else {
                              setFabric('180 GSM Pure Combed Cotton');
                              setGsm('180 GSM');
                            }
                          }}
                          className={`p-3.5 border-2 rounded-sm cursor-pointer transition-all text-left relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#E51E2B] bg-red-50/20 shadow-xs ring-1 ring-[#E51E2B]'
                              : 'border-neutral-200 hover:border-neutral-400 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-2xs bg-neutral-100 text-neutral-800">
                                {item.badge}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#E51E2B]" />}
                            </div>
                            <h3 className="text-sm font-black uppercase text-neutral-900">
                              {item.title}
                            </h3>
                            <span className="text-[10px] text-[#E51E2B] font-bold block mb-1">
                              {item.gsmText}
                            </span>
                            <p className="text-[11px] text-neutral-500 leading-snug">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Color Swatch Picker (Quick 6 Curated Streetwear Shades) */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Garment Colorway *
                    </label>
                    <span className="text-xs font-bold text-[#E51E2B] uppercase">
                      Selected: {primaryColor}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {catalog.colors.slice(0, 8).map(swatch => {
                      const isColorActive = primaryColor === swatch.name;
                      return (
                        <button
                          key={swatch.name}
                          type="button"
                          onClick={() => handleSelectColor(swatch)}
                          className={`p-2.5 border-2 rounded-xs flex items-center gap-2.5 transition-all text-left ${
                            isColorActive
                              ? 'border-[#E51E2B] bg-red-50/20 ring-1 ring-[#E51E2B]'
                              : 'border-neutral-200 hover:border-neutral-300 bg-white'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-neutral-300 shrink-0 shadow-2xs"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <div className="truncate">
                            <span className="text-xs font-bold uppercase text-neutral-900 block truncate">
                              {swatch.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Continue CTA */}
                <div className="pt-4 border-t border-neutral-150 flex items-center justify-between">
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
                    className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-7 py-3 text-xs font-bold uppercase tracking-wider transition-colors rounded-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Next: Add Your Artwork</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 2: DESIGN & PLACEMENT (EFFORTLESS UPLOAD OR 1-CLICK PRESET) */}
            {/* ------------------------------------------------------------- */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block mb-1">
                    STEP 02 OF 03 • ARTWORK & PLACEMENT
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight">
                    Your Design & Print Location
                  </h2>
                  <p className="text-xs text-neutral-600 mt-1">
                    Drop your image file or type a quick concept idea. You can preview it live on the garment mockup to your left.
                  </p>
                </div>

                {/* Starting Pathway (Design Upload vs Idea) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDesignSource('have_design')}
                    className={`p-3.5 border-2 rounded-sm text-left transition-all flex items-center gap-3 ${
                      designSource === 'have_design'
                        ? 'border-[#E51E2B] bg-red-50/20 text-[#E51E2B] ring-1 ring-[#E51E2B]'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase block text-neutral-900">
                        Upload My Artwork
                      </span>
                      <span className="text-[10px] text-neutral-500 font-normal">
                        PNG, JPG, SVG, WebP, PDF
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDesignSource('have_idea')}
                    className={`p-3.5 border-2 rounded-sm text-left transition-all flex items-center gap-3 ${
                      designSource === 'have_idea'
                        ? 'border-[#E51E2B] bg-red-50/20 text-[#E51E2B] ring-1 ring-[#E51E2B]'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase block text-neutral-900">
                        I Have an Idea / Prompt
                      </span>
                      <span className="text-[10px] text-neutral-500 font-normal">
                        Describe & our lab crafts it
                      </span>
                    </div>
                  </button>
                </div>

                {/* PATHWAY A: UPLOAD FILE DROPZONE */}
                {designSource === 'have_design' && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-neutral-300 hover:border-neutral-900 rounded-sm p-6 text-center bg-neutral-50/60 transition-colors">
                      <input
                        type="file"
                        id="customise-file-upload-input"
                        multiple
                        accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                        disabled={isUploadingFile}
                      />
                      <label
                        htmlFor="customise-file-upload-input"
                        className="cursor-pointer inline-flex flex-col items-center justify-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 mb-2 shadow-2xs">
                          {isUploadingFile ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#E51E2B]" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <span className="text-xs font-bold uppercase text-neutral-900 tracking-wider">
                          {isUploadingFile ? 'Uploading Artwork...' : 'Tap to Browse or Drop Artwork Here'}
                        </span>
                        <span className="text-[11px] text-neutral-500 mt-1">
                          PNG with transparent background, JPG, or PDF (Up to 25MB)
                        </span>
                      </label>
                    </div>

                    {/* Resolution Warning */}
                    {fileResolutionWarning && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xs text-[11px] text-amber-900 flex items-start gap-2">
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
                        <div className="space-y-1.5">
                          {uploadedFiles.map((f, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {f.mimeType?.startsWith('image/') ? (
                                  <img
                                    src={f.fileUrl}
                                    alt=""
                                    className="w-10 h-10 object-cover rounded-xs border border-neutral-200 bg-white shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 rounded-xs shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="truncate">
                                  <span className="text-xs font-bold text-neutral-900 block truncate">
                                    {f.fileName}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Ready & mapped to preview</span>
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveFile(idx)}
                                className="text-neutral-400 hover:text-red-600 p-1.5 transition-colors"
                                title="Remove file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes Input */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                        Any specific print instructions? (Optional)
                      </label>
                      <input
                        type="text"
                        value={printingInstructions}
                        onChange={(e) => setPrintingInstructions(e.target.value)}
                        placeholder="e.g. Keep background transparent, matte DTF finish, center alignment..."
                        className="w-full p-2.5 border border-neutral-300 rounded-xs text-xs bg-neutral-50/50"
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
                        <span className="text-[10px] text-neutral-400">Our studio artists will illustrate it</span>
                      </div>
                      <textarea
                        rows={3}
                        value={designDescription}
                        onChange={(e) => setDesignDescription(e.target.value)}
                        placeholder="e.g. Vintage Baahubali typography in Telugu & English with a weathered battle sword emblem on back..."
                        className="w-full p-3 border border-neutral-300 rounded-xs text-xs bg-neutral-50/50"
                      />
                    </div>

                    {/* 1-Click Inspiration Chips */}
                    <div>
                      <span className="text-[11px] font-bold uppercase text-neutral-700 block mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E51E2B]" />
                        <span>Or Click a Popular Streetwear Preset to Autofill:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {QUICK_INSPIRATION_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyPreset(p)}
                            className="p-2.5 text-left border border-neutral-200 hover:border-black rounded-xs bg-neutral-50/50 hover:bg-white transition-all"
                          >
                            <span className="text-xs font-bold uppercase block text-neutral-900">
                              {p.label}
                            </span>
                            <span className="text-[10px] text-neutral-500 line-clamp-1">
                              {p.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Print Placement Quick Cards */}
                <div className="space-y-2 pt-2 border-t border-neutral-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                      Print Location on Garment *
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Click to switch live view
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'front' as const, label: 'Front Graphic', subtitle: 'Large chest center', icon: '👕' },
                      { id: 'back' as const, label: 'Back Statement', subtitle: 'Full back canvas', icon: '🦅' },
                      { id: 'both' as const, label: 'Front + Back', subtitle: 'Double-sided drop', icon: '🔥' },
                      { id: 'chest' as const, label: 'Left Chest', subtitle: 'Minimal logo', icon: '👑' }
                    ].map(loc => {
                      const isLocActive = quickPlacementType === loc.id;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => handleSelectQuickPlacement(loc.id)}
                          className={`p-3 border-2 rounded-xs text-left transition-all flex flex-col justify-between ${
                            isLocActive
                              ? 'border-[#E51E2B] bg-red-50/20 ring-1 ring-[#E51E2B]'
                              : 'border-neutral-200 hover:border-neutral-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-base mb-1">
                            <span>{loc.icon}</span>
                            {isLocActive && <Check className="w-3.5 h-3.5 text-[#E51E2B]" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase text-neutral-900 block">
                              {loc.label}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {loc.subtitle}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 Navigation Controls */}
                <div className="pt-4 border-t border-neutral-150 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-4 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-700 transition-colors rounded-xs flex items-center gap-1.5"
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
                    className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-7 py-3 text-xs font-bold uppercase tracking-wider transition-colors rounded-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Next: Size & WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 3: SIZE, QUANTITY & INSTANT WHATSAPP DETAILS */}
            {/* ------------------------------------------------------------- */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block mb-1">
                    STEP 03 OF 03 • SIZE & INSTANT QUOTE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight">
                    Select Size & Get Free Proof
                  </h2>
                  <p className="text-xs text-neutral-600 mt-1">
                    Zero upfront payment. Enter your WhatsApp number so we can deliver your digital mockup and quote directly.
                  </p>
                </div>

                {/* Size Selector Pills */}
                {!isAdvancedSizesOpen && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                        Garment Size *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="text-[10px] text-[#E51E2B] font-bold uppercase underline"
                      >
                        View Size Chart
                      </button>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                        const isSizeActive = singleSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSingleSize(sz)}
                            className={`py-2.5 border-2 rounded-xs text-xs font-bold uppercase transition-all ${
                              isSizeActive
                                ? 'border-[#E51E2B] bg-[#E51E2B] text-white shadow-xs'
                                : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Stepper */}
                {!isAdvancedSizesOpen && (
                  <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-xs">
                    <div>
                      <span className="text-xs font-bold uppercase text-neutral-900 block">
                        Order Quantity:
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Bulk discount applied automatically for 5+ pieces
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSingleQuantity(Math.max(1, singleQuantity - 1))}
                        disabled={singleQuantity <= 1}
                        className="w-8 h-8 rounded-xs border border-neutral-300 bg-white flex items-center justify-center hover:bg-neutral-100 disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-neutral-900 w-8 text-center font-mono">
                        {singleQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSingleQuantity(singleQuantity + 1)}
                        className="w-8 h-8 rounded-xs border border-neutral-300 bg-white flex items-center justify-center hover:bg-neutral-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Group / Multi-Size Run Accordion Toggle */}
                <div className="border border-neutral-200 rounded-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedSizesOpen(!isAdvancedSizesOpen)}
                    className="w-full p-3 bg-neutral-50/80 hover:bg-neutral-100 flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#E51E2B]" />
                      <span className="text-xs font-bold uppercase text-neutral-900">
                        Ordering for friends, team, or college drop? (Multi-Size Breakdown)
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isAdvancedSizesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAdvancedSizesOpen && (
                    <div className="p-4 bg-white border-t border-neutral-200 space-y-3">
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

                {/* Simple Contact Form (Name + WhatsApp are primary) */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                    Where should we send your proof & quote? *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        Your Full Name *
                      </span>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Charith Reddy"
                        className="w-full p-2.5 border border-neutral-300 rounded-xs text-xs bg-neutral-50/40"
                        required
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        WhatsApp Number * (For digital proof)
                      </span>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full p-2.5 border border-neutral-300 rounded-xs text-xs bg-neutral-50/40"
                        required
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        Email Address (Optional)
                      </span>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="patron@example.com"
                        className="w-full p-2.5 border border-neutral-300 rounded-xs text-xs bg-neutral-50/40"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        City & Pincode (Optional)
                      </span>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Tirupati, 517501"
                        className="w-full p-2.5 border border-neutral-300 rounded-xs text-xs bg-neutral-50/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Expandable Advanced Options (Collar, Fabric GSM, Address) */}
                <div className="border border-neutral-200 rounded-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedSpecsOpen(!isAdvancedSpecsOpen)}
                    className="w-full p-3 bg-neutral-50/60 hover:bg-neutral-100 flex items-center justify-between text-left transition-colors text-xs text-neutral-700"
                  >
                    <span>Custom Specifications (Collar, Sleeve, Fabric GSM, Delivery Address)</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdvancedSpecsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAdvancedSpecsOpen && (
                    <div className="p-4 bg-white border-t border-neutral-200 space-y-4 text-xs">
                      {/* Sleeve & Collar */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Sleeve Style</label>
                          <select
                            value={sleeve}
                            onChange={(e) => setSleeve(e.target.value as SleeveType)}
                            className="w-full p-2 border border-neutral-300 rounded-xs bg-neutral-50 text-xs"
                          >
                            <option value="Half Sleeve">Half Sleeve (Streetwear)</option>
                            <option value="Full Sleeve">Full Sleeve (Ribbed Cuff)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Collar Neck</label>
                          <select
                            value={neckType}
                            onChange={(e) => setNeckType(e.target.value as NeckType)}
                            className="w-full p-2 border border-neutral-300 rounded-xs bg-neutral-50 text-xs"
                          >
                            <option value="Round Neck">Crew Round Neck</option>
                            <option value="Polo Neck">Polo Collar</option>
                          </select>
                        </div>
                      </div>

                      {/* Fabric Selection */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Fabric & GSM</label>
                        <select
                          value={fabric}
                          onChange={(e) => {
                            setFabric(e.target.value);
                            if (e.target.value.includes('240')) setGsm('240 GSM');
                            else if (e.target.value.includes('280')) setGsm('280 GSM');
                            else if (e.target.value.includes('380')) setGsm('380 GSM');
                            else setGsm('180 GSM');
                          }}
                          className="w-full p-2 border border-neutral-300 rounded-xs bg-neutral-50 text-xs"
                        >
                          <option value="240 GSM Luxury French Terry Cotton">240 GSM Luxury French Terry (Signature)</option>
                          <option value="280 GSM Heavyweight Terry">280 GSM Heavy French Terry</option>
                          <option value="180 GSM Pure Combed Cotton">180 GSM Standard Combed Cotton</option>
                          <option value="380 GSM Heavyweight Brushed Fleece">380 GSM Brushed Fleece (Hoodie)</option>
                        </select>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Street Address</label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          placeholder="House/Flat number, Street name, Landmark"
                          className="w-full p-2 border border-neutral-300 rounded-xs bg-neutral-50 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Studio Trust / Zero Risk Guarantee Card */}
                <div className="p-3.5 bg-neutral-900 text-white rounded-xs space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-[#E51E2B] font-bold uppercase">
                    <ShieldCheck className="w-4 h-4" />
                    <span>TH3EE Atelier Patron Assurance</span>
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    <strong>Zero upfront payment.</strong> We will create your digital mockup and send an itemised quotation with accurate pricing and shipping. You only pay after you approve the digital proof!
                  </p>
                </div>

                {/* Navigation & Submit CTA */}
                <div className="pt-4 border-t border-neutral-150 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-700 transition-colors rounded-xs flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitRequest}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-[#E51E2B] hover:bg-black text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest transition-all rounded-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Request to Studio...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Get Instant Quote & Free Mockup</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>

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

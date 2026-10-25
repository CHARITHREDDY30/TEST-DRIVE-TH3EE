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
  Image as ImageIcon,
  CheckCircle2,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  Loader2,
  Trash2,
  ExternalLink,
  ChevronRight
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
import { FitSelectionCards } from './FitSelectionCards';
import { FabricGsmGuide } from './FabricGsmGuide';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { PrintPlacementSelector } from './PrintPlacementSelector';
import { VariantQuantityMatrix } from './VariantQuantityMatrix';

interface CustomiseWizardProps {
  navigate: (path: string) => void;
  currentUser?: any;
  showNotification: (data: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export const CustomiseWizard: React.FC<CustomiseWizardProps> = ({
  navigate,
  currentUser,
  showNotification
}) => {
  // Catalog State
  const [catalog, setCatalog] = useState<CustomisationCatalogConfig>(INITIAL_CUSTOMISATION_CATALOG);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Wizard Step State (1: Design, 2: Garment Specs, 3: Print Placement, 4: Variants & Qty, 5: Customer Info, 6: Review)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Form State
  const [designSource, setDesignSource] = useState<CustomDesignSource>('have_design');
  const [designDescription, setDesignDescription] = useState('');
  const [printingInstructions, setPrintingInstructions] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<CustomRequestFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileResolutionWarning, setFileResolutionWarning] = useState<string | null>(null);

  // Garment Specifications
  const [garmentCategory, setGarmentCategory] = useState<GarmentCategoryType>('T-Shirt');
  const [fit, setFit] = useState<GarmentFitType>('Oversized');
  const [sleeve, setSleeve] = useState<SleeveType>('Half Sleeve');
  const [neckType, setNeckType] = useState<NeckType>('Round Neck');
  const [fabric, setFabric] = useState<string>('240 GSM Luxury French Terry Cotton');
  const [gsm, setGsm] = useState<string>('240 GSM');
  const [primaryColor, setPrimaryColor] = useState<string>('Jet Black');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('#111111');

  // Print Placements
  const [placements, setPlacements] = useState<CustomRequestPlacement[]>([
    {
      placementLocation: 'large_front',
      printSize: 'large',
      notes: ''
    }
  ]);

  // Variants Breakdown
  const [variants, setVariants] = useState<CustomRequestVariant[]>([
    {
      color: 'Jet Black',
      size: 'L',
      quantity: 1,
      notes: ''
    }
  ]);

  // Order Details
  const [intendedUse, setIntendedUse] = useState<string>('personal');
  const [requiredDate, setRequiredDate] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [artworkApprovalRequired, setArtworkApprovalRequired] = useState<boolean>(true);

  // Customer Contact Info
  const [customerName, setCustomerName] = useState(currentUser?.name || currentUser?.full_name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'email' | 'phone'>('whatsapp');
  
  // Delivery Address
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('Tirupati');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(true);

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

  // Sync user info if auth updates
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
  }, [currentUser, customerName, customerEmail, customerPhone]);

  // Handle color change
  const handleSelectColor = (swatch: ColorSwatch) => {
    setPrimaryColor(swatch.name);
    setSelectedColorHex(swatch.hex);

    // Update default variant color if only 1 variant exists
    if (variants.length === 1 && variants[0].quantity === 1) {
      setVariants([{ ...variants[0], color: swatch.name }]);
    }
  };

  // Handle fabric change
  const handleSelectFabric = (spec: FabricSpec) => {
    setFabric(spec.name);
    setGsm(spec.gsm);
  };

  // File Upload Handler
  const handleFileUpload = async (filesToUpload: FileList | null) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    setIsUploadingFile(true);
    setFileResolutionWarning(null);

    const newFiles: CustomRequestFile[] = [...uploadedFiles];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      // Check resolution for image files to advise user on print quality
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          if (img.width < 1000 || img.height < 1000) {
            setFileResolutionWarning(
              `Note: "${file.name}" is ${img.width}×${img.height}px. For HD Direct-to-Film printing across large placements, 2000px+ (300 DPI) produces the sharpest print.`
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

        // Automatically map first artwork file to active placement if empty
        if (placements.length > 0 && !placements[0].artworkUrl) {
          const updated = [...placements];
          updated[0].artworkUrl = result.url;
          updated[0].artworkKey = result.key;
          setPlacements(updated);
        }
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

  // Direct upload for a specific placement
  const handleUploadFileForPlacement = async (placementId: string, file: File) => {
    setIsUploadingFile(true);
    try {
      const result = await customiseService.uploadFile(file, 'custom-artwork');
      const newFile: CustomRequestFile = {
        fileType: 'artwork',
        fileName: result.name,
        fileUrl: result.url,
        fileKey: result.key,
        fileSizeBytes: result.size,
        mimeType: result.type,
        targetPlacement: placementId
      };
      setUploadedFiles(prev => [...prev, newFile]);

      // Map to placement
      const updated = placements.map(p => {
        if (p.placementLocation === placementId) {
          return { ...p, artworkUrl: result.url, artworkKey: result.key };
        }
        return p;
      });
      setPlacements(updated);

      showNotification({
        type: 'success',
        message: `Uploaded artwork assigned to ${placementId}`
      });
    } catch (err: any) {
      showNotification({
        type: 'error',
        message: err.message || 'Upload failed'
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Total Quantity Calculation
  const totalQuantity = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

  // Step Validation
  const validateStep = (stepNumber: number): boolean => {
    if (stepNumber === 1) {
      if (designSource === 'have_design' && uploadedFiles.length === 0 && !designDescription.trim()) {
        showNotification({
          type: 'error',
          message: 'Please upload artwork or provide a description of your design.'
        });
        return false;
      }
      if (designSource === 'have_idea' && !designDescription.trim()) {
        showNotification({
          type: 'error',
          message: 'Please describe the custom apparel idea you want us to craft.'
        });
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (!fit || !primaryColor || !fabric) {
        showNotification({ type: 'error', message: 'Please select fit, color, and fabric.' });
        return false;
      }
      return true;
    }

    if (stepNumber === 3) {
      if (placements.length === 0) {
        showNotification({ type: 'error', message: 'Please select at least one print placement location.' });
        return false;
      }
      return true;
    }

    if (stepNumber === 4) {
      if (totalQuantity <= 0) {
        showNotification({ type: 'error', message: 'Total garment quantity must be at least 1.' });
        return false;
      }
      return true;
    }

    if (stepNumber === 5) {
      if (!customerName.trim()) {
        showNotification({ type: 'error', message: 'Please enter your full name.' });
        return false;
      }
      if (!customerEmail.trim() || !customerEmail.includes('@')) {
        showNotification({ type: 'error', message: 'Please enter a valid email address.' });
        return false;
      }
      if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
        showNotification({ type: 'error', message: 'Please enter a valid 10-digit mobile number.' });
        return false;
      }
      if (!privacyConsent) {
        showNotification({ type: 'error', message: 'Please agree to the privacy policy to proceed.' });
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submission
  const handleSubmitRequest = async () => {
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    try {
      const payload: SubmitCustomRequestPayload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: customerPhone.trim(),
        preferred_contact: preferredContact,
        customer_id: currentUser?.id || undefined,
        design_type: designSource,
        design_description: designDescription.trim() || undefined,
        printing_instructions: printingInstructions.trim() || undefined,
        intended_use: intendedUse,
        required_date: requiredDate || undefined,
        garment_category: garmentCategory,
        fit,
        sleeve,
        neck_type: neckType,
        fabric,
        gsm,
        primary_color: primaryColor,
        total_quantity: totalQuantity,
        artwork_approval_required: artworkApprovalRequired,
        shipping_address: {
          fullName: customerName.trim(),
          phone: customerPhone.trim(),
          addressLine1: addressLine1.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim()
        },
        internal_notes: additionalNotes.trim() || undefined,
        variants: variants.map(v => ({
          color: v.color,
          size: v.size,
          quantity: Number(v.quantity) || 1,
          notes: v.notes
        })),
        placements: placements.map(p => ({
          placement_location: p.placementLocation,
          print_size: p.printSize,
          custom_dimensions: p.customDimensions,
          artwork_url: p.artworkUrl,
          artwork_key: p.artworkKey,
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
        message: `Customisation request ${result.requestNumber} registered successfully!`
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showNotification({
        type: 'error',
        message: err.message || 'Submission error. Please check your network and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SUBMITTED VIEW
  if (submissionResult) {
    const waUrl = `https://wa.me/919121798653?text=${encodeURIComponent(
      `Hi TH3EE Atelier! I have submitted customisation request ${submissionResult.requestNumber} for ${totalQuantity}x ${fit} ${garmentCategory}. Please review my quotation.`
    )}`;

    return (
      <div className="w-full bg-[#FAFAFA] min-h-[85vh] py-8 sm:py-16 font-mono">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white border-2 border-neutral-900 p-6 sm:p-10 shadow-2xl rounded-sm text-center">
            
            {/* Header Badge */}
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="inline-block bg-[#E51E2B] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-3">
              Tirupati Atelier Studio
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase text-neutral-900 tracking-tight">
              Customisation Request Received
            </h1>

            <p className="mt-3 text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed">
              Your request has been registered in the TH3EE Atelier Command Center. Our master craftsmen are reviewing your artwork, fabric choice, and placement specifications.
            </p>

            {/* Request Reference Box */}
            <div className="my-6 p-5 bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-sm inline-block w-full max-w-md">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Your Official Request Reference
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#E51E2B] tracking-wider block selection:bg-[#E51E2B] selection:text-white">
                {submissionResult.requestNumber}
              </span>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Save this reference. You can track quotation updates and approve digital artwork proofs anytime.
              </span>
            </div>

            {/* Next Steps Accordion */}
            <div className="text-left bg-neutral-900 text-white p-5 rounded-sm my-6 space-y-3 text-xs">
              <h3 className="font-bold text-[#E51E2B] uppercase text-sm tracking-wider">
                What happens next?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px]">
                <div className="border-l-2 border-[#E51E2B] pl-3">
                  <span className="font-bold text-neutral-200 block">1. Studio Review</span>
                  <span className="text-neutral-400">We inspect artwork resolution, stitch boundaries, and fabric feasibility.</span>
                </div>
                <div className="border-l-2 border-[#E51E2B] pl-3">
                  <span className="font-bold text-neutral-200 block">2. Itemised Quote</span>
                  <span className="text-neutral-400">Receive transparent pricing for garments, printing, and pan-India shipping.</span>
                </div>
                <div className="border-l-2 border-[#E51E2B] pl-3">
                  <span className="font-bold text-neutral-200 block">3. Digital Proof</span>
                  <span className="text-neutral-400">Approve final digital mockup before production begins at our Tirupati studio.</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate(`/customise/track/${submissionResult.trackingToken}`)}
                className="w-full sm:w-auto bg-[#E51E2B] hover:bg-black text-white font-bold text-xs uppercase px-7 py-3 tracking-wider transition-colors shadow-xs"
              >
                Track Request & Quotation Live
              </button>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase px-6 py-3 tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Notify Studio on WhatsApp</span>
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs text-neutral-500 hover:text-black uppercase font-bold tracking-wider"
              >
                ← Return to TH3EE Homepage
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // WIZARD MAIN VIEW
  return (
    <div className="w-full bg-[#FAFAFA] min-h-[85vh] py-6 sm:py-12 font-mono">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 text-[11px] uppercase tracking-wider text-neutral-500 flex items-center space-x-2">
          <button type="button" onClick={() => navigate('/')} className="hover:text-[#E51E2B] transition-colors">Home</button>
          <span>/</span>
          <span className="text-neutral-900 font-bold">Customise Apparel Studio</span>
        </nav>

        {/* Studio Banner */}
        <div className="bg-white border border-neutral-200 rounded-sm p-5 sm:p-8 shadow-xs mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="bg-[#E51E2B] text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2.5 py-0.5">
              Tirupati Atelier Custom Lab
            </span>
            <span className="text-[11px] text-neutral-500 font-bold uppercase">
              HD Direct-to-Film (DTF) & Heavyweight Luxury Cotton
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase text-neutral-900 tracking-tight leading-tight">
            Customise Your Apparel <br className="hidden sm:inline" />
            <span className="text-[#E51E2B]">Engineered to Your Exact Vision</span>
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed">
            Create your bespoke T-shirt, hoodie, or franchise drop. Upload high-res artwork or describe a concept, compare fits with technical visual guides, receive an itemised quotation, apply promo vouchers, and pay securely on TH3EE.
          </p>

          {/* Quick Step Indicators */}
          <div className="mt-6 pt-5 border-t border-neutral-150 grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] font-bold uppercase">
            {[
              { num: 1, title: 'Design' },
              { num: 2, title: 'Garment' },
              { num: 3, title: 'Placement' },
              { num: 4, title: 'Quantity' },
              { num: 5, title: 'Patron Info' },
              { num: 6, title: 'Review' }
            ].map(s => {
              const isPassed = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    // Allow navigating back to completed steps
                    if (s.num < currentStep) setCurrentStep(s.num);
                  }}
                  className={`p-2 border rounded-xs text-left transition-colors flex items-center justify-between ${
                    isCurrent
                      ? 'border-[#E51E2B] bg-red-50 text-[#E51E2B] ring-1 ring-[#E51E2B]'
                      : isPassed
                      ? 'border-neutral-900 bg-neutral-900 text-white cursor-pointer'
                      : 'border-neutral-200 bg-white text-neutral-400'
                  }`}
                >
                  <span className="truncate">{s.num}. {s.title}</span>
                  {isPassed && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP CONTENT CONTAINER */}
        <div className="bg-white border-2 border-neutral-900 rounded-sm p-5 sm:p-8 shadow-sm mb-8">
          
          {/* ================================================================ */}
          {/* STEP 1: DESIGN DETAILS & ARTWORK */}
          {/* ================================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block mb-1">
                  STEP 01 / 06
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900">
                  Choose Starting Pathway
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Do you already possess finished graphic artwork, or do you have a creative concept for our studio to produce?
                </p>
              </div>

              {/* Two Starting Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: I Have a Design */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDesignSource('have_design')}
                  className={`border-2 p-5 rounded-sm cursor-pointer transition-all ${
                    designSource === 'have_design'
                      ? 'border-[#E51E2B] bg-red-50/20 shadow-xs ring-1 ring-[#E51E2B]'
                      : 'border-neutral-200 hover:border-neutral-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-[#E51E2B]">
                      <Upload className="w-5 h-5" />
                    </div>
                    {designSource === 'have_design' && (
                      <span className="bg-[#E51E2B] text-white p-1 rounded-full"><Check className="w-3.5 h-3.5" /></span>
                    )}
                  </div>
                  <h3 className="text-sm font-black uppercase text-neutral-900">
                    A. I Have a Design
                  </h3>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    Upload your print-ready PNG, JPEG, SVG, WebP, or vector PDF artwork. We preserve raw resolution without compression.
                  </p>
                </div>

                {/* Option B: I Have an Idea */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDesignSource('have_idea')}
                  className={`border-2 p-5 rounded-sm cursor-pointer transition-all ${
                    designSource === 'have_idea'
                      ? 'border-[#E51E2B] bg-red-50/20 shadow-xs ring-1 ring-[#E51E2B]'
                      : 'border-neutral-200 hover:border-neutral-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-[#E51E2B]">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    {designSource === 'have_idea' && (
                      <span className="bg-[#E51E2B] text-white p-1 rounded-full"><Check className="w-3.5 h-3.5" /></span>
                    )}
                  </div>
                  <h3 className="text-sm font-black uppercase text-neutral-900">
                    B. I Have an Idea
                  </h3>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    Describe your vision, typography, motifs, or movie universe aesthetics. Share reference images or moodboards.
                  </p>
                </div>
              </div>

              {/* Design Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center justify-between">
                  <span>
                    {designSource === 'have_design' ? 'Artwork Notes & Context (Optional)' : 'Describe Your Design Idea & Aesthetics *'}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">Max 1000 characters</span>
                </label>
                <textarea
                  rows={4}
                  value={designDescription}
                  onChange={(e) => setDesignDescription(e.target.value)}
                  placeholder={
                    designSource === 'have_design'
                      ? 'Tell us about the graphic: intended print effect, color priorities, or background transparency...'
                      : 'Describe the graphic you want: theme (e.g. Baahubali mythological typography, vintage anime, minimalist emblem), color scheme, mood, and references...'
                  }
                  className="w-full p-3 border border-neutral-300 rounded-sm text-xs bg-neutral-50/40 focus:bg-white"
                />
              </div>

              {/* Artwork / Reference File Upload Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    {designSource === 'have_design' ? 'Upload Artwork Files *' : 'Upload Reference Images & Moodboard (Optional)'}
                  </label>
                  <span className="text-[10px] text-neutral-400">PNG, JPG, WEBP, PDF (Max 25MB)</span>
                </div>

                <div className="border-2 border-dashed border-neutral-300 hover:border-black rounded-sm p-6 text-center bg-neutral-50/50 transition-colors">
                  <input
                    type="file"
                    id="artwork-file-input"
                    multiple
                    accept=".png,.jpg,.jpeg,.webp,.pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    disabled={isUploadingFile}
                  />
                  <label
                    htmlFor="artwork-file-input"
                    className="cursor-pointer inline-flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 mb-2 shadow-2xs">
                      {isUploadingFile ? <Loader2 className="w-5 h-5 animate-spin text-[#E51E2B]" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-bold uppercase text-neutral-900 tracking-wider">
                      {isUploadingFile ? 'Uploading Assets...' : 'Click to Browse Artwork / References'}
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-1">
                      Drag & drop files or tap to select from device
                    </span>
                  </label>
                </div>

                {/* Resolution Warning */}
                {fileResolutionWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xs text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{fileResolutionWarning}</span>
                  </div>
                )}

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold uppercase text-neutral-700 block">
                      Uploaded Assets ({uploadedFiles.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {uploadedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white border border-neutral-200 rounded-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {file.mimeType?.startsWith('image/') ? (
                              <img
                                src={file.fileUrl}
                                alt=""
                                className="w-9 h-9 object-cover rounded-xs border border-neutral-200 bg-neutral-100 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-neutral-100 flex items-center justify-center text-neutral-600 rounded-xs shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="truncate">
                              <span className="block text-xs font-bold uppercase text-neutral-900 truncate">
                                {file.fileName}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {file.fileSizeBytes ? `${(file.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB` : 'Ready'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neutral-400 hover:text-black p-1"
                              title="Preview"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="text-neutral-400 hover:text-red-600 p-1"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Printing Instructions */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block">
                  Additional Printing Instructions (Optional):
                </label>
                <input
                  type="text"
                  value={printingInstructions}
                  onChange={(e) => setPrintingInstructions(e.target.value)}
                  placeholder="e.g. Remove black background from artwork, keep text sharp, matte DTF finish..."
                  className="w-full p-2.5 border border-neutral-300 rounded-sm text-xs bg-neutral-50/40"
                />
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 2: GARMENT SPECIFICATIONS & VISUAL GUIDES */}
          {/* ================================================================ */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block mb-1">
                  STEP 02 / 06
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900">
                    Garment Cut, Fabric & Colour Specs
                  </h2>

                  {/* Size Guide Button */}
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-[#E51E2B] text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors shadow-2xs self-start sm:self-auto"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Open Interactive Size Guide</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-600 mt-1">
                  Compare streetwear silhouettes, view verified garment measurements, pick colorways, and select sleeve and neck styles.
                </p>
              </div>

              {/* Apparel Category Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Garment Category *
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {(['T-Shirt', 'Hoodie'] as GarmentCategoryType[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGarmentCategory(cat)}
                      className={`p-3 text-xs font-bold uppercase rounded-sm border-2 transition-all flex items-center justify-between ${
                        garmentCategory === cat
                          ? 'border-[#E51E2B] bg-red-50/20 text-[#E51E2B] ring-1 ring-[#E51E2B]'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <span>{cat}</span>
                      {garmentCategory === cat && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit Selection Cards Component */}
              <FitSelectionCards
                fitOptions={catalog.fits}
                selectedFit={fit}
                onSelectFit={(newFit) => setFit(newFit)}
                selectedColorHex={selectedColorHex}
              />

              {/* Sleeve & Neck Styles Visual Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Sleeve Types */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                    Sleeve Style *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['Half Sleeve', 'Full Sleeve'] as SleeveType[]).map((slv) => {
                      const isSlvActive = sleeve === slv;
                      return (
                        <button
                          key={slv}
                          type="button"
                          onClick={() => setSleeve(slv)}
                          className={`p-3 border-2 rounded-sm text-left transition-all ${
                            isSlvActive
                              ? 'border-[#E51E2B] bg-red-50/20 text-[#E51E2B] font-bold ring-1 ring-[#E51E2B]'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs uppercase mb-1">
                            <span>{slv}</span>
                            {isSlvActive && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-[10px] text-neutral-500 font-normal block">
                            {slv === 'Half Sleeve' ? 'Streetwear drop bicep drape' : 'Ribbed cuff extended length'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Neck Styles */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                    Neckline Collar Style *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['Round Neck', 'Polo Neck'] as NeckType[]).map((nck) => {
                      const isNckActive = neckType === nck;
                      return (
                        <button
                          key={nck}
                          type="button"
                          onClick={() => setNeckType(nck)}
                          className={`p-3 border-2 rounded-sm text-left transition-all ${
                            isNckActive
                              ? 'border-[#E51E2B] bg-red-50/20 text-[#E51E2B] font-bold ring-1 ring-[#E51E2B]'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs uppercase mb-1">
                            <span>{nck}</span>
                            {isNckActive && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-[10px] text-neutral-500 font-normal block">
                            {nck === 'Round Neck' ? 'Durable lycra-rib crew neck' : 'Classic collar with button placket'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Color Swatch Picker Component */}
              <ColorSwatchPicker
                colors={catalog.colors}
                selectedColorName={primaryColor}
                onSelectColor={handleSelectColor}
              />

              {/* Fabric & GSM Visual Guide Component */}
              <FabricGsmGuide
                fabrics={catalog.fabrics}
                selectedFabric={fabric}
                selectedGsm={gsm}
                onSelectFabric={handleSelectFabric}
                currentFit={fit}
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 3: PRINT PLACEMENT & ARTWORK MAPPING */}
          {/* ================================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block mb-1">
                  STEP 03 / 06
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900">
                  Print Placement & Scale Dimensions
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Click front or back hotspots on the garment illustration to allocate Direct-to-Film print locations.
                </p>
              </div>

              <PrintPlacementSelector
                placementsDef={catalog.placements}
                placements={placements}
                onChangePlacements={(newPlacements) => setPlacements(newPlacements)}
                fit={fit}
                sleeve={sleeve}
                neckType={neckType}
                colorHex={selectedColorHex}
                uploadedFiles={uploadedFiles}
                onUploadFileForPlacement={handleUploadFileForPlacement}
                isUploading={isUploadingFile}
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 4: QUANTITY & MULTI-VARIANT BREAKDOWN */}
          {/* ================================================================ */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block mb-1">
                  STEP 04 / 06
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900">
                  Quantities, Sizes & Timeline
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Support multiple size and colorway allocations in a single order without creating separate requests.
                </p>
              </div>

              <VariantQuantityMatrix
                variants={variants}
                onChangeVariants={(newVariants) => setVariants(newVariants)}
                colors={catalog.colors}
                intendedUse={intendedUse}
                onChangeIntendedUse={setIntendedUse}
                requiredDate={requiredDate}
                onChangeRequiredDate={setRequiredDate}
                additionalNotes={additionalNotes}
                onChangeAdditionalNotes={setAdditionalNotes}
              />
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 5: PATRON DETAILS & DELIVERY ADDRESS */}
          {/* ================================================================ */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block mb-1">
                  STEP 05 / 06
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900">
                  Patron Contact & Delivery Info
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Where should we send your itemised quotation, digital proofs, and order updates?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Charith Reddy"
                    className="w-full p-2.5 border border-neutral-300 rounded-sm text-xs bg-neutral-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. patron@example.com"
                    className="w-full p-2.5 border border-neutral-300 rounded-sm text-xs bg-neutral-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full p-2.5 border border-neutral-300 rounded-sm text-xs bg-neutral-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    Preferred Contact Channel:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                      { id: 'email', label: 'Email', icon: Mail },
                      { id: 'phone', label: 'Call', icon: Phone }
                    ].map(ch => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setPreferredContact(ch.id as any)}
                        className={`p-2 border rounded-xs text-center text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1 ${
                          preferredContact === ch.id
                            ? 'border-[#E51E2B] bg-[#E51E2B] text-white'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <ch.icon className="w-3 h-3" />
                        <span>{ch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Address Section */}
              <div className="pt-4 border-t border-neutral-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Delivery Destination Address:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Street address / Landmark / House or Apartment Number"
                      className="w-full p-2.5 border border-neutral-300 rounded-sm text-xs bg-neutral-50"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full p-2.5 border border-neutral-300 rounded-sm text-xs bg-neutral-50"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="w-full p-2.5 border border-neutral-300 rounded-sm text-xs bg-neutral-50"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Pincode (e.g. 517501)"
                      className="w-full p-2.5 border border-neutral-300 rounded-sm text-xs bg-neutral-50"
                    />
                  </div>
                </div>
              </div>

              {/* Artwork Proof Requirement Toggle */}
              <div className="bg-neutral-50 border border-neutral-200 p-3.5 rounded-sm flex items-start gap-3">
                <input
                  type="checkbox"
                  id="artwork-approval-check"
                  checked={artworkApprovalRequired}
                  onChange={(e) => setArtworkApprovalRequired(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#E51E2B] rounded-xs"
                />
                <label htmlFor="artwork-approval-check" className="text-xs text-neutral-700 cursor-pointer">
                  <span className="font-bold text-neutral-900 block uppercase">
                    Mandatory Digital Artwork Proof Approval
                  </span>
                  <span>
                    Our studio will upload a digital mock-up preview before production. You will have the opportunity to review and approve or request revisions.
                  </span>
                </label>
              </div>

              {/* Privacy and Consent */}
              <div className="flex items-start gap-2.5 text-[11px] text-neutral-600">
                <input
                  type="checkbox"
                  id="privacy-consent-check"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#E51E2B]"
                />
                <label htmlFor="privacy-consent-check" className="cursor-pointer">
                  I confirm that all uploaded artwork is either my intellectual property or I hold permission to reproduce it. I agree to TH3EE's secure file storage and privacy policy.
                </label>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 6: REQUEST REVIEW & SUBMISSION */}
          {/* ================================================================ */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block mb-1">
                  STEP 06 / 06
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900">
                  Review Custom Request Summary
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Verify all specifications before final registration with the Tirupati Atelier studio.
                </p>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* 1. Design & Pathway */}
                <div className="border border-neutral-200 p-4 rounded-sm bg-neutral-50/50 relative">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-200">
                    <span className="font-bold uppercase text-neutral-900">Design Specification</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-[10px] text-[#E51E2B] font-bold uppercase underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-neutral-600 text-[11px]">
                    <div>
                      <span className="text-neutral-400">Pathway:</span>{' '}
                      <strong className="text-neutral-800">{designSource === 'have_design' ? 'I Have a Design (Artwork Upload)' : 'I Have an Idea (Studio Creative)'}</strong>
                    </div>
                    {designDescription && (
                      <div>
                        <span className="text-neutral-400">Notes:</span> {designDescription}
                      </div>
                    )}
                    <div>
                      <span className="text-neutral-400">Files Uploaded:</span>{' '}
                      <strong className="text-neutral-800">{uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Garment Silhouette & Fabric */}
                <div className="border border-neutral-200 p-4 rounded-sm bg-neutral-50/50 relative">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-200">
                    <span className="font-bold uppercase text-neutral-900">Garment Specifications</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-[10px] text-[#E51E2B] font-bold uppercase underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-neutral-600 text-[11px]">
                    <div>
                      <span className="text-neutral-400">Silhouette:</span>{' '}
                      <strong className="text-[#E51E2B]">{fit}</strong> ({sleeve}, {neckType})
                    </div>
                    <div>
                      <span className="text-neutral-400">Blank Colour:</span>{' '}
                      <strong className="text-neutral-800">{primaryColor}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400">Fabric & Weight:</span>{' '}
                      <strong className="text-neutral-800">{gsm}</strong> ({fabric})
                    </div>
                  </div>
                </div>

                {/* 3. Print Placements */}
                <div className="border border-neutral-200 p-4 rounded-sm bg-neutral-50/50 relative">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-200">
                    <span className="font-bold uppercase text-neutral-900">Print Placements ({placements.length})</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-[10px] text-[#E51E2B] font-bold uppercase underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {placements.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-neutral-700">
                        <span className="font-bold uppercase text-neutral-900">
                          • {catalog.placements.find(def => def.id === p.placementLocation)?.label || p.placementLocation}
                        </span>
                        <span className="text-neutral-500 font-mono">
                          Scale: {p.printSize} {p.customDimensions ? `(${p.customDimensions})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Variants Breakdown */}
                <div className="border border-neutral-200 p-4 rounded-sm bg-neutral-50/50 relative">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-200">
                    <span className="font-bold uppercase text-neutral-900">Sizes & Total Run ({totalQuantity})</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-[10px] text-[#E51E2B] font-bold uppercase underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {variants.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between text-neutral-700">
                        <span>• {v.color} / Size {v.size}</span>
                        <strong className="text-neutral-900">x{v.quantity}</strong>
                      </div>
                    ))}
                    {requiredDate && (
                      <div className="pt-1 text-neutral-500 text-[10px]">
                        Target Date: <strong>{requiredDate}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Patron & Delivery */}
                <div className="border border-neutral-200 p-4 rounded-sm bg-neutral-50/50 sm:col-span-2 relative">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-200">
                    <span className="font-bold uppercase text-neutral-900">Patron & Destination</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="text-[10px] text-[#E51E2B] font-bold uppercase underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-600">
                    <div>
                      <span className="text-neutral-400">Patron:</span>{' '}
                      <strong className="text-neutral-900">{customerName}</strong> ({customerPhone})
                    </div>
                    <div>
                      <span className="text-neutral-400">Email:</span>{' '}
                      <strong className="text-neutral-900">{customerEmail}</strong>
                    </div>
                    {addressLine1 && (
                      <div className="sm:col-span-2">
                        <span className="text-neutral-400">Ship To:</span> {addressLine1}, {city}, {state} - {pincode}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Next Steps Clarification Box */}
              <div className="bg-neutral-900 text-white p-4 rounded-sm text-xs space-y-1">
                <span className="font-bold uppercase text-[#E51E2B] block tracking-wider">
                  Important Order Notice:
                </span>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  Submitting this request registers your requirements with the TH3EE Tirupati Atelier studio. 
                  <strong> No payment is collected at this stage.</strong> Our administration will prepare an itemised quotation with accurate pricing and shipping. You will be able to review, accept, apply promotional vouchers, and pay online securely through our website.
                </p>
              </div>

            </div>
          )}

          {/* WIZARD NAVIGATION CONTROLS */}
          <div className="mt-8 pt-5 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black transition-colors rounded-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Step</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto bg-neutral-900 hover:bg-[#E51E2B] text-white px-7 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Continue to Step 0{currentStep + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-[#E51E2B] hover:bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all rounded-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering Request...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit Customisation Request</span>
                    </>
                  )}
                </button>
              )}
            </div>
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

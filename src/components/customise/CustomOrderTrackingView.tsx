import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  CreditCard,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCw,
  ExternalLink,
  Tag,
  Loader2,
  FileCheck,
  AlertTriangle,
  PackageCheck,
  Lock,
  ChevronRight,
  Zap,
  ShoppingBag,
  Eye,
  CheckCircle2,
  Copy,
  CheckCheck
} from 'lucide-react';
import type { CustomRequest, CustomQuotation, CustomArtworkProof } from '../../types/customise';
import { customiseService } from '../../services/customise.service';
import { couponsService } from '../../services/coupons.service';
import { razorpayService, loadRazorpayScript, getRazorpayKeyId } from '../../services/razorpay.service';
import { GarmentSvg } from './GarmentIllustrations';

interface CustomOrderTrackingViewProps {
  token: string;
  navigate: (path: string) => void;
  showNotification: (data: { type: 'success' | 'error' | 'info'; message: string }) => void;
  currentUser?: any;
}

const COLOR_HEX_MAP: Record<string, string> = {
  'Jet Black': '#111111',
  'Optical White': '#FFFFFF',
  'Crimson Maroon': '#58111A',
  'Vintage Brown': '#3E2723',
  'Royal Navy': '#152238',
  'Sage Green': '#5A6B5C',
  'Sand Beige': '#D2C2B2',
  'Heather Grey': '#8C9298'
};

export const CustomOrderTrackingView: React.FC<CustomOrderTrackingViewProps> = ({
  token,
  navigate,
  showNotification,
  currentUser
}) => {
  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live SVG Garment Preview View ('front' | 'back')
  const [previewView, setPreviewView] = useState<'front' | 'back'>('front');
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Quotation Acceptance / Revision State
  const [isAcceptingQuote, setIsAcceptingQuote] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [changesNotes, setChangesNotes] = useState('');
  const [showChangesModal, setShowChangesModal] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    message: string;
  } | null>(null);

  // Payment Processing State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Artwork Proof Response State
  const [proofFeedback, setProofFeedback] = useState('');
  const [isRespondingProof, setIsRespondingProof] = useState(false);
  const [showProofRevisionModal, setShowProofRevisionModal] = useState(false);

  // Load Request Details
  const fetchRequestDetails = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const res = await customiseService.getRequestByToken(token);
      if (!res.success || !res.request) {
        throw new Error(res.error || 'Customisation request not found.');
      }
      setRequest(res.request);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to load custom request.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // Periodic heartbeat polling for real-time tracking updates (Every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRequestDetails(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchRequestDetails]);

  const handleCopyOrderId = () => {
    if (!request) return;
    navigator.clipboard.writeText(request.requestNumber);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
    showNotification({ type: 'info', message: 'Order reference ID copied to clipboard!' });
  };

  if (loading) {
    return (
      <div className="w-full bg-[#F8F9FA] min-h-[75vh] flex flex-col items-center justify-center p-6 font-sans">
        <div className="p-4 bg-white rounded-3xl shadow-sm border border-neutral-200/90 flex flex-col items-center">
          <Loader2 className="w-9 h-9 animate-spin text-[#FF2E2E] mb-3" />
          <span className="text-xs uppercase font-bold text-neutral-800 tracking-wider">
            Syncing In-App Order Ledger...
          </span>
          <span className="text-[11px] text-neutral-500 mt-1">Retrieving live studio quotation & proof status</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !request) {
    return (
      <div className="w-full bg-[#F8F9FA] min-h-[75vh] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-neutral-200/90 p-8 max-w-md w-full text-center shadow-xl rounded-3xl">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black uppercase text-neutral-900 mb-2">Request Not Located</h2>
          <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
            {errorMsg || 'We could not locate a custom apparel request with this tracking reference.'}
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/customise')}
              className="w-full bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] text-white py-3 text-xs font-bold uppercase tracking-wider rounded-full shadow-md active:scale-95 cursor-pointer"
            >
              Start New Customisation
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 text-xs font-bold uppercase tracking-wider rounded-full transition-colors active:scale-95 cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const quote = request.activeQuotation;
  const proofs = request.proofs || [];
  const latestProof = proofs.length > 0 ? proofs[0] : null;

  // Pricing calculations
  const quoteSubtotal = quote?.subtotal || 0;
  const quoteShipping = quote?.shippingCharges || 0;
  const quoteDiscount = appliedCoupon ? appliedCoupon.discountAmount : (quote?.quantityDiscount || 0);
  const rawFinalAmount = Math.max(0, quoteSubtotal + quoteShipping - (appliedCoupon?.discountAmount || 0));
  const finalPayableAmount = appliedCoupon ? rawFinalAmount : (quote?.finalTotal || 0);

  // Status mapping
  const statusLabels: Record<string, { label: string; color: string; badge: string; stepIndex: number }> = {
    pending_review: { label: 'Pending Studio Review', color: 'text-amber-700 bg-amber-50 border-amber-200', badge: 'Atelier Inspection', stepIndex: 2 },
    under_review: { label: 'Under Studio Review', color: 'text-blue-700 bg-blue-50 border-blue-200', badge: 'Crafting Specs', stepIndex: 2 },
    more_info_required: { label: 'More Details Needed', color: 'text-orange-700 bg-orange-50 border-orange-200', badge: 'Action Required', stepIndex: 2 },
    quotation_sent: { label: 'Quotation Ready for Review', color: 'text-purple-700 bg-purple-50 border-purple-200', badge: 'Quote Published', stepIndex: 3 },
    awaiting_customer_approval: { label: 'Awaiting Your Approval', color: 'text-purple-700 bg-purple-50 border-purple-200', badge: 'Review & Accept', stepIndex: 3 },
    awaiting_payment: { label: 'Awaiting Online Payment', color: 'text-[#FF2E2E] bg-red-50 border-red-200', badge: 'Payment Ready', stepIndex: 4 },
    paid: { label: 'Payment Verified & Approved', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', badge: 'In Production', stepIndex: 5 },
    artwork_approval_pending: { label: 'Artwork Proof Awaiting Approval', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', badge: 'Digital Proof', stepIndex: 3 },
    in_production: { label: 'In Production (Tirupati Atelier)', color: 'text-emerald-800 bg-emerald-100 border-emerald-300', badge: 'Printing & Curing', stepIndex: 5 },
    ready_for_dispatch: { label: 'Quality Passed & Packed', color: 'text-teal-800 bg-teal-50 border-teal-200', badge: 'Ready for Courier', stepIndex: 5 },
    shipped: { label: 'Shipped Pan-India', color: 'text-blue-800 bg-blue-100 border-blue-300', badge: 'In Transit', stepIndex: 5 },
    delivered: { label: 'Delivered', color: 'text-emerald-900 bg-emerald-100 border-emerald-300', badge: 'Completed', stepIndex: 5 },
    cancelled: { label: 'Order Cancelled', color: 'text-neutral-700 bg-neutral-100 border-neutral-300', badge: 'Cancelled', stepIndex: 1 },
    quote_expired: { label: 'Quotation Expired', color: 'text-red-700 bg-red-50 border-red-200', badge: 'Expired', stepIndex: 3 },
    rejected: { label: 'Not Serviceable', color: 'text-red-800 bg-red-100 border-red-300', badge: 'Declined', stepIndex: 1 }
  };

  const statusInfo = statusLabels[request.status] || {
    label: request.status.toUpperCase(),
    color: 'text-neutral-700 bg-neutral-100 border-neutral-200',
    badge: 'Status',
    stepIndex: 2
  };

  const selectedColorHex = request.primaryColor?.startsWith('#')
    ? request.primaryColor
    : (COLOR_HEX_MAP[request.primaryColor] || '#111111');

  // 1. Accept Quotation Handler
  const handleAcceptQuotation = async () => {
    if (!quote) return;
    setIsAcceptingQuote(true);
    try {
      const res = await customiseService.acceptQuotation(token, quote.id);
      if (!res.success) {
        throw new Error(res.error || 'Failed to accept quotation');
      }
      showNotification({
        type: 'success',
        message: 'Quotation accepted! You can now proceed to secure online payment.'
      });
      fetchRequestDetails(false);
    } catch (err: any) {
      showNotification({ type: 'error', message: err.message || 'Error accepting quote' });
    } finally {
      setIsAcceptingQuote(false);
    }
  };

  // 2. Request Quotation Changes Handler
  const handleRequestChangesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changesNotes.trim()) {
      showNotification({ type: 'error', message: 'Please specify the adjustments you require.' });
      return;
    }
    setIsRequestingChanges(true);
    try {
      const res = await customiseService.requestQuotationChanges(token, changesNotes);
      if (!res.success) throw new Error(res.error || 'Failed to submit request');
      showNotification({
        type: 'success',
        message: 'Your change request was sent to the studio team.'
      });
      setShowChangesModal(false);
      setChangesNotes('');
      fetchRequestDetails(false);
    } catch (err: any) {
      showNotification({ type: 'error', message: err.message });
    } finally {
      setIsRequestingChanges(false);
    }
  };

  // 3. Coupon Validation
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const val = await couponsService.validateCoupon(
        couponCode.trim(),
        quoteSubtotal,
        request.customerId,
        request.customerEmail
      );

      if (!val.valid) {
        showNotification({ type: 'error', message: val.message });
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountAmount: val.discount,
          message: val.message
        });
        showNotification({ type: 'success', message: val.message });
      }
    } catch (err: any) {
      showNotification({ type: 'error', message: err.message || 'Coupon verification failed' });
    } finally {
      setCouponLoading(false);
    }
  };

  // 4. Online Payment via Razorpay (Fully In-App)
  const handleProceedToPayment = async () => {
    if (!quote) return;
    setIsProcessingPayment(true);

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error('Could not load payment gateway. Please check your internet connection.');
      }

      const clientKey = getRazorpayKeyId();
      const amountPaise = Math.round(finalPayableAmount * 100);

      const rzpOptions: any = {
        key: clientKey || 'rzp_test_placeholder',
        amount: amountPaise,
        currency: 'INR',
        name: 'TH3EE Atelier',
        description: `Custom Apparel Order: ${request.requestNumber} (${request.totalQuantity}x ${request.fit} ${request.garmentCategory})`,
        prefill: {
          name: request.customerName,
          email: request.customerEmail,
          contact: request.customerPhone
        },
        theme: {
          color: '#FF2E2E'
        },
        notes: {
          custom_request_id: request.id,
          request_number: request.requestNumber
        },
        handler: async (response: any) => {
          try {
            // Confirm payment with backend RPC
            const confirmRes = await customiseService.confirmCustomPayment({
              requestId: request.id,
              token: request.trackingToken,
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              providerOrderId: response.razorpay_order_id || `order_${Date.now()}`,
              amount: finalPayableAmount,
              couponCode: appliedCoupon?.code,
              discount: appliedCoupon?.discountAmount || 0
            });

            if (!confirmRes.success) {
              throw new Error(confirmRes.error || 'Server payment confirmation rejected.');
            }

            showNotification({
              type: 'success',
              message: `Payment confirmed! Converted to official order: ${confirmRes.orderNumber}`
            });

            fetchRequestDetails(false);
          } catch (cErr: any) {
            showNotification({
              type: 'error',
              message: cErr.message || 'Payment verification error. Please contact studio.'
            });
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(rzpOptions);
      razorpayInstance.on('payment.failed', (resp: any) => {
        showNotification({
          type: 'error',
          message: resp?.error?.description || 'Payment failed or cancelled.'
        });
        setIsProcessingPayment(false);
      });
      razorpayInstance.open();
    } catch (payErr: any) {
      showNotification({
        type: 'error',
        message: payErr.message || 'Failed to initiate secure payment'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 5. Artwork Proof Feedback Handler
  const handleProofResponse = async (approved: boolean) => {
    if (!latestProof) return;
    setIsRespondingProof(true);
    try {
      const res = await customiseService.respondProof(
        token,
        latestProof.id,
        approved,
        approved ? 'Approved by patron' : proofFeedback
      );

      if (!res.success) throw new Error(res.error || 'Failed to update proof response');

      showNotification({
        type: 'success',
        message: approved
          ? 'Digital proof approved! Garment production is scheduled.'
          : 'Revision notes sent to studio team.'
      });

      setShowProofRevisionModal(false);
      setProofFeedback('');
      fetchRequestDetails(false);
    } catch (err: any) {
      showNotification({ type: 'error', message: err.message });
    } finally {
      setIsRespondingProof(false);
    }
  };

  // Support link helper (kept strictly secondary)
  const waSupportUrl = `https://wa.me/919121798653?text=${encodeURIComponent(
    `Hi TH3EE Atelier! I am inquiring about my in-app custom order ${request.requestNumber}.`
  )}`;

  return (
    <div className="w-full bg-[#F8F9FA] min-h-[90vh] py-4 sm:py-10 pb-24 font-sans text-neutral-900 selection:bg-red-500 selection:text-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-6">

        {/* Top Breadcrumb & Live Heartbeat Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-wider text-neutral-500 flex items-center space-x-1.5 font-mono">
            <button type="button" onClick={() => navigate('/')} className="hover:text-[#FF2E2E] transition-colors cursor-pointer">Home</button>
            <span>/</span>
            <button type="button" onClick={() => navigate('/customise')} className="hover:text-[#FF2E2E] transition-colors cursor-pointer">Customise</button>
            <span>/</span>
            <span className="text-neutral-900 font-bold">{request.requestNumber}</span>
          </nav>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-white border border-neutral-200 text-neutral-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live In-App Sync (5s)</span>
            </span>

            <button
              type="button"
              onClick={() => fetchRequestDetails(false)}
              className="p-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-full transition-colors active:scale-90 cursor-pointer shadow-2xs"
              title="Refresh Status"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ============================================================= */}
        {/* ORDER HEADER BANNER (Soft Rounded & Modern Streetwear) */}
        {/* ============================================================= */}
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-7 shadow-sm mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200/80">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-50 to-rose-50 text-[#FF2E2E] border border-red-200/80 px-3 py-0.5 text-[10px] font-bold uppercase rounded-full mb-2 shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#FF2E2E]" />
                <span>Atelier Custom Order Ledger</span>
              </div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-3xl font-black uppercase text-neutral-900 tracking-tight font-mono">
                  {request.requestNumber}
                </h1>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="p-1.5 text-neutral-500 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors active:scale-95 cursor-pointer"
                  title="Copy Reference"
                >
                  {copiedOrderId ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-xs text-neutral-500 mt-1 block">
                Submitted on {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Patron: <strong>{request.customerName}</strong>
              </span>
            </div>

            {/* Current Status Pill */}
            <div className={`px-4 py-2 border rounded-2xl self-start sm:self-auto text-left sm:text-right shadow-2xs ${statusInfo.color}`}>
              <span className="text-[10px] uppercase font-bold tracking-widest block opacity-75 font-mono">
                {statusInfo.badge}
              </span>
              <span className="text-sm font-black uppercase tracking-tight block mt-0.5">
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Quick Garment Spec Pills */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-neutral-50/80 p-3 border border-neutral-200/80 rounded-2xl">
              <span className="text-[9px] text-neutral-400 uppercase block font-bold">Cut & Silhouette</span>
              <strong className="text-neutral-900 uppercase block truncate mt-0.5">{request.fit} {request.garmentCategory}</strong>
            </div>
            <div className="bg-neutral-50/80 p-3 border border-neutral-200/80 rounded-2xl">
              <span className="text-[9px] text-neutral-400 uppercase block font-bold">Colorway & Fabric</span>
              <strong className="text-neutral-900 block truncate mt-0.5">{request.primaryColor} • {request.gsm}</strong>
            </div>
            <div className="bg-neutral-50/80 p-3 border border-neutral-200/80 rounded-2xl">
              <span className="text-[9px] text-neutral-400 uppercase block font-bold">Total Pieces</span>
              <strong className="text-[#FF2E2E] block truncate mt-0.5">{request.totalQuantity} {request.totalQuantity === 1 ? 'Piece' : 'Pieces'}</strong>
            </div>
            <div className="bg-neutral-50/80 p-3 border border-neutral-200/80 rounded-2xl">
              <span className="text-[9px] text-neutral-400 uppercase block font-bold">Collar & Sleeve</span>
              <strong className="text-neutral-900 block truncate mt-0.5">{request.neckType} • {request.sleeve}</strong>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* 5-STAGE IN-APP WORKFLOW STEPPER */}
        {/* ============================================================= */}
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-5 shadow-sm mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
              In-App Production Timeline
            </span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase">
              Step {statusInfo.stepIndex} of 5
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center text-[10px] font-bold uppercase">
            {[
              { idx: 1, label: 'Submitted', sub: 'Registered' },
              { idx: 2, label: 'Studio Review', sub: 'In Admin' },
              { idx: 3, label: 'Quotation', sub: 'In-App Bill' },
              { idx: 4, label: 'Pay Online', sub: 'Razorpay' },
              { idx: 5, label: 'Production', sub: 'Express Dispatch' }
            ].map(st => {
              const isPast = statusInfo.stepIndex > st.idx;
              const isCurrent = statusInfo.stepIndex === st.idx;
              return (
                <div
                  key={st.idx}
                  className={`p-2 sm:p-2.5 rounded-2xl border transition-all ${
                    isPast
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : isCurrent
                      ? 'bg-red-50 text-[#FF2E2E] border-[#FF2E2E] ring-2 ring-[#FF2E2E]/15'
                      : 'bg-neutral-50 text-neutral-400 border-neutral-200/80'
                  }`}
                >
                  <div className="flex items-center justify-center mb-0.5">
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[9px] font-mono opacity-80">0{st.idx}</span>
                    )}
                  </div>
                  <span className="block truncate text-[10px] sm:text-[11px] font-black">{st.label}</span>
                  <span className="hidden sm:block text-[9px] opacity-75 truncate">{st.sub}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================= */}
        {/* INTERACTIVE GARMENT STAGE FOR THIS ORDER */}
        {/* ============================================================= */}
        <div className="bg-gradient-to-b from-white via-neutral-50/60 to-white border border-neutral-200/90 rounded-3xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-2xs"
                style={{ backgroundColor: selectedColorHex }}
              />
              <span className="text-xs font-black uppercase text-neutral-900">
                Custom Garment Visual Mockup
              </span>
            </div>

            {/* Front / Back Toggle Pill */}
            <button
              type="button"
              onClick={() => setPreviewView(previewView === 'front' ? 'back' : 'front')}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-[#FF2E2E] text-white rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{previewView === 'front' ? 'View Back' : 'View Front'}</span>
            </button>
          </div>

          <div className="w-full max-w-[280px] sm:max-w-[340px] aspect-[500/520] mx-auto relative flex items-center justify-center py-2">
            <GarmentSvg
              view={previewView}
              fit={(request.fit as any) || 'Oversized'}
              category={(request.garmentCategory as any) || 'T-Shirt'}
              sleeve={(request.sleeve as any) || 'Half Sleeve'}
              neckType={(request.neckType as any) || 'Round Neck'}
              colorHex={selectedColorHex}
              selectedPlacements={(request.placements || []).map(p => p.placementLocation)}
              activePlacement={request.placements?.[0]?.placementLocation}
              artworkPreviewUrl={request.files?.find(f => f.fileType === 'artwork')?.fileUrl || null}
              showHotspots={true}
              className="w-full h-full drop-shadow-md transition-all duration-300"
            />

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-neutral-200/90 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-neutral-600 shadow-xs pointer-events-none whitespace-nowrap">
              {previewView === 'front' ? '— Front Angle —' : '— Back Angle —'}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* IN-APP QUOTATION & ONLINE PAYMENT SECTION */}
        {/* ============================================================= */}
        {!quote && (
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-8 shadow-sm mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                Studio Review & Sizing Evaluation In Progress
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black uppercase text-neutral-900 tracking-tight">
              Awaiting Quotation from Studio Admin
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 max-w-2xl leading-relaxed">
              Your custom garment specifications have been registered directly in the Atelier Admin Portal. Our studio team is currently inspecting your artwork in the admin portal to calculate exact print dimensions, ink density, and blank specifications.
            </p>

            <div className="mt-4 p-4 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#FF2E2E] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-neutral-900">
                    How you will complete your purchase:
                  </p>
                  <p className="text-neutral-600 text-[11px] leading-relaxed">
                    1. Our admin calculates print sizing and publishes the itemised quote directly into this page.
                    <br />
                    2. An instant <strong>Pay Online</strong> button will activate right here (with UPI, Google Pay, Cards, and NetBanking).
                    <br />
                    3. You do not need to leave this site—everything happens directly inside this app!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-150 flex items-center justify-between text-[11px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span>Checking for admin quotation every 5 seconds...</span>
              </span>
              <button
                type="button"
                onClick={() => fetchRequestDetails(false)}
                className="font-bold text-[#FF2E2E] hover:underline cursor-pointer uppercase text-[10px]"
              >
                Refresh Now
              </button>
            </div>
          </div>
        )}

        {quote && (
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-8 shadow-sm mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200 mb-5">
              <div>
                <span className="text-[10px] font-bold text-[#FF2E2E] uppercase tracking-widest block">
                  Studio Quotation v{quote.version} • Published
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight">
                  Itemised Price Specification
                </h2>
              </div>

              <div className="text-[11px] text-neutral-500">
                {quote.validUntil && (
                  <span>Valid until: <strong>{new Date(quote.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong></span>
                )}
              </div>
            </div>

            {/* Quotation Table */}
            <div className="border border-neutral-200/90 rounded-2xl overflow-hidden mb-5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Line Item Specification</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 font-sans">
                  <tr>
                    <td className="py-3 px-4">
                      Garment Base Blank: {request.fit} {request.garmentCategory} ({request.fabric}) x{request.totalQuantity}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono">
                      ₹{quote.garmentBasePrice.toFixed(2)}
                    </td>
                  </tr>

                  {quote.printingCharges > 0 && (
                    <tr>
                      <td className="py-3 px-4">
                        Ultra-HD Direct-to-Film (DTF) Print Transfer ({request.placements?.length || 1} Placements)
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono">
                        ₹{quote.printingCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {quote.placementCharges > 0 && (
                    <tr>
                      <td className="py-3 px-4">
                        Multi-Zone Print Positioning Fees
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono">
                        ₹{quote.placementCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {quote.artworkCharges > 0 && (
                    <tr>
                      <td className="py-3 px-4">
                        Vector Artwork Preparation & Studio Separation
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono">
                        ₹{quote.artworkCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {quote.shippingCharges > 0 && (
                    <tr>
                      <td className="py-3 px-4 text-neutral-600">
                        Inspected Express Pan-India Courier
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-600 font-mono">
                        ₹{quote.shippingCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Applied Discount */}
                  {quoteDiscount > 0 && (
                    <tr className="bg-red-50/60 text-[#FF2E2E]">
                      <td className="py-3 px-4 font-bold">
                        Discount Voucher Applied ({appliedCoupon ? appliedCoupon.code : 'Volume Savings'})
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono">
                        -₹{quoteDiscount.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Final Payable Total */}
                  <tr className="bg-neutral-50 text-neutral-900 font-black text-sm border-t-2 border-neutral-900">
                    <td className="py-3.5 px-4 uppercase">
                      Final Authorised Payable Total
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#FF2E2E] text-lg font-mono">
                      ₹{finalPayableAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Promotional Coupon Entry (When ready for payment) */}
            {(request.status === 'awaiting_payment' || request.status === 'quotation_sent') && (
              <div className="bg-neutral-50/80 p-4 border border-neutral-200/80 rounded-2xl mb-5">
                <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 relative">
                    <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="ENTER PROMO COUPON CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-bold uppercase border border-neutral-300 rounded-full bg-white shadow-2xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="bg-neutral-900 hover:bg-[#FF2E2E] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors shrink-0 disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    {couponLoading ? 'Checking...' : 'Apply Voucher'}
                  </button>
                </form>
                {appliedCoupon && (
                  <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{appliedCoupon.message}</span>
                  </div>
                )}
              </div>
            )}

            {/* QUOTATION ACTIONS */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-neutral-500">
                Estimated Tirupati Atelier Lead Time: <strong>{quote.estimatedProductionDays} Business Days</strong>
              </div>

              {/* State 1: Quotation Sent -> Customer Must Accept or Request Changes */}
              {request.status === 'quotation_sent' && (
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowChangesModal(true)}
                    className="w-full sm:w-auto px-5 py-3 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider transition-colors rounded-full active:scale-95 cursor-pointer"
                  >
                    Request Adjustments
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptQuotation}
                    disabled={isAcceptingQuote}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] text-white px-7 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-md rounded-full flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    {isAcceptingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Accept Quotation & Proceed to Pay</span>
                  </button>
                </div>
              )}

              {/* State 2: Awaiting Payment -> Pay Online with Razorpay */}
              {request.status === 'awaiting_payment' && (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isProcessingPayment}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] hover:from-[#E51E2B] hover:to-black text-white px-9 py-3.5 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/25 rounded-full flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Secure Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay Online ₹{finalPayableAmount.toFixed(2)} (Instant UPI / Cards)</span>
                    </>
                  )}
                </button>
              )}

              {/* State 3: Paid Confirmation */}
              {['paid', 'artwork_approval_pending', 'in_production', 'ready_for_dispatch', 'shipped', 'delivered'].includes(request.status) && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-5 py-2.5 border border-emerald-300 rounded-full text-xs font-bold uppercase shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Payment Authorised & Verified</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SECTION B: DIGITAL ARTWORK PROOF REVIEW & APPROVAL */}
        {/* ============================================================= */}
        {latestProof && (
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-8 shadow-sm mb-4 sm:mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
                  Digital Mockup Proof v{latestProof.version}
                </span>
                <h3 className="text-lg sm:text-xl font-black uppercase text-neutral-900 tracking-tight">
                  Artwork Production Proof
                </h3>
              </div>

              <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${
                latestProof.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : latestProof.status === 'revision_requested'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {latestProof.status === 'approved' ? 'Proof Approved' : latestProof.status === 'revision_requested' ? 'Revision Pending' : 'Awaiting Your Approval'}
              </span>
            </div>

            {/* Proof Mockup Image */}
            <div className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-4 text-center mb-4">
              <img
                src={latestProof.proofImageUrl}
                alt="Digital Proof Mockup"
                className="max-h-96 mx-auto object-contain rounded-xl border border-neutral-200 bg-white shadow-xs"
              />
              {latestProof.notes && (
                <p className="text-xs text-neutral-600 mt-3 font-mono">
                  Atelier Notes: "{latestProof.notes}"
                </p>
              )}
            </div>

            {/* Proof Actions */}
            {latestProof.status === 'pending' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-neutral-500">
                  Please inspect positioning, color borders, and spelling.
                </span>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowProofRevisionModal(true)}
                    className="w-full sm:w-auto px-5 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider rounded-full active:scale-95 cursor-pointer"
                  >
                    Request Modification
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProofResponse(true)}
                    disabled={isRespondingProof}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 rounded-full active:scale-95 cursor-pointer"
                  >
                    {isRespondingProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Approve Proof for Production</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* SECTION C: ORDER LIFECYCLE AUDIT & MILESTONES */}
        {/* ============================================================= */}
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-8 shadow-sm mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-black uppercase text-neutral-900 mb-4 pb-2 border-b border-neutral-200">
            Order Lifecycle Audit & Milestones
          </h3>

          <div className="space-y-3 font-sans">
            {(request.timeline || []).map((ev, i) => (
              <div key={ev.id || i} className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 pb-3 border-b border-neutral-150">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <h4 className="font-bold text-neutral-900 uppercase">{ev.title}</h4>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(ev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {ev.description && (
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      {ev.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Support Link (Subtle & Non-Intrusive) */}
          <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-neutral-500">
              Have questions regarding DTF care, fabric blends, or delivery?
            </span>
            <a
              href={waSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-600 hover:text-[#FF2E2E] flex items-center gap-1.5 underline font-bold uppercase transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Optional Studio WhatsApp Support</span>
            </a>
          </div>
        </div>

      </div>

      {/* Changes Request Modal (Soft Rounded UI) */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
          <div className="bg-white border border-neutral-200 p-6 sm:p-7 max-w-lg w-full shadow-2xl rounded-3xl">
            <h3 className="text-base font-black uppercase text-neutral-900 mb-2">
              Request Quotation Adjustments
            </h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Specify which specifications, garment cuts, or quantities you would like our atelier team to revise:
            </p>
            <form onSubmit={handleRequestChangesSubmit} className="space-y-4">
              <textarea
                rows={4}
                value={changesNotes}
                onChange={(e) => setChangesNotes(e.target.value)}
                placeholder="e.g. Please recalculate for 5 pieces instead of 2, or change to oversized black tee..."
                className="w-full p-3.5 border border-neutral-300 rounded-2xl text-xs font-sans focus:ring-2 focus:ring-[#FF2E2E]/20 focus:border-[#FF2E2E] outline-none"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangesModal(false)}
                  className="px-5 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase rounded-full transition-colors active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRequestingChanges}
                  className="bg-neutral-900 hover:bg-[#FF2E2E] text-white px-6 py-2.5 text-xs font-bold uppercase rounded-full transition-colors active:scale-95 cursor-pointer"
                >
                  {isRequestingChanges ? 'Submitting...' : 'Send Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Revision Modal (Soft Rounded UI) */}
      {showProofRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
          <div className="bg-white border border-neutral-200 p-6 sm:p-7 max-w-lg w-full shadow-2xl rounded-3xl">
            <h3 className="text-base font-black uppercase text-neutral-900 mb-2">
              Request Artwork Mockup Revision
            </h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Describe what changes are needed on graphic positioning, scale, or color alignment:
            </p>
            <textarea
              rows={4}
              value={proofFeedback}
              onChange={(e) => setProofFeedback(e.target.value)}
              placeholder="e.g. Please shift chest logo 2cm higher, or brighten colors..."
              className="w-full p-3.5 border border-neutral-300 rounded-2xl text-xs font-sans mb-4 focus:ring-2 focus:ring-[#FF2E2E]/20 focus:border-[#FF2E2E] outline-none"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProofRevisionModal(false)}
                className="px-5 py-2.5 border border-neutral-300 text-xs font-bold uppercase rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleProofResponse(false)}
                disabled={isRespondingProof || !proofFeedback.trim()}
                className="bg-[#FF2E2E] hover:bg-black text-white px-6 py-2.5 text-xs font-bold uppercase rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                {isRespondingProof ? 'Sending...' : 'Submit Revision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomOrderTrackingView;

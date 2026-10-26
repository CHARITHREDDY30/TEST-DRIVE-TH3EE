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
  PackageCheck
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

export const CustomOrderTrackingView: React.FC<CustomOrderTrackingViewProps> = ({
  token,
  navigate,
  showNotification,
  currentUser
}) => {
  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Periodic heartbeat polling for tracking updates
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRequestDetails(true);
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchRequestDetails]);

  if (loading) {
    return (
      <div className="w-full bg-[#FAFAFA] min-h-[70vh] flex flex-col items-center justify-center p-6 font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-[#E51E2B] mb-3" />
        <span className="text-xs uppercase font-bold text-neutral-600 tracking-wider">
          Retrieving Custom Atelier Request...
        </span>
      </div>
    );
  }

  if (errorMsg || !request) {
    return (
      <div className="w-full bg-[#FAFAFA] min-h-[70vh] flex items-center justify-center p-6 font-mono">
        <div className="bg-white border-2 border-neutral-900 p-8 max-w-md w-full text-center shadow-lg rounded-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-black uppercase text-neutral-900 mb-2">Request Not Found</h2>
          <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
            {errorMsg || 'We could not locate a custom apparel request with this tracking reference.'}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate('/customise')}
              className="w-full bg-[#E51E2B] text-white py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Start New Customisation
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full bg-neutral-100 text-neutral-700 py-2.5 text-xs font-bold uppercase tracking-wider"
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

  // Authoritative calculations
  const quoteSubtotal = quote?.subtotal || 0;
  const quoteShipping = quote?.shippingCharges || 0;
  const quoteDiscount = appliedCoupon ? appliedCoupon.discountAmount : (quote?.quantityDiscount || 0);
  const rawFinalAmount = Math.max(0, quoteSubtotal + quoteShipping - (appliedCoupon?.discountAmount || 0));
  const finalPayableAmount = appliedCoupon ? rawFinalAmount : (quote?.finalTotal || 0);

  // Status mapping
  const statusLabels: Record<string, { label: string; color: string; badge: string }> = {
    pending_review: { label: 'Pending Studio Review', color: 'text-amber-700 bg-amber-50 border-amber-300', badge: 'Atelier Inspection' },
    under_review: { label: 'Under Studio Review', color: 'text-blue-700 bg-blue-50 border-blue-300', badge: 'Crafting Specs' },
    more_info_required: { label: 'More Details Needed', color: 'text-orange-700 bg-orange-50 border-orange-300', badge: 'Action Required' },
    quotation_sent: { label: 'Quotation Ready', color: 'text-purple-700 bg-purple-50 border-purple-300', badge: 'Review & Accept' },
    awaiting_customer_approval: { label: 'Awaiting Your Approval', color: 'text-purple-700 bg-purple-50 border-purple-300', badge: 'Quote Sent' },
    awaiting_payment: { label: 'Awaiting Payment', color: 'text-[#E51E2B] bg-red-50 border-red-300', badge: 'Payment Ready' },
    paid: { label: 'Payment Verified', color: 'text-emerald-700 bg-emerald-50 border-emerald-300', badge: 'Confirmed Order' },
    artwork_approval_pending: { label: 'Artwork Proof Awaiting Approval', color: 'text-indigo-700 bg-indigo-50 border-indigo-300', badge: 'Digital Proof' },
    in_production: { label: 'In Production (Tirupati Atelier)', color: 'text-emerald-800 bg-emerald-100 border-emerald-400', badge: 'Printing & Curing' },
    ready_for_dispatch: { label: 'Quality Passed & Packed', color: 'text-teal-800 bg-teal-50 border-teal-300', badge: 'Ready for Courier' },
    shipped: { label: 'Shipped Pan-India', color: 'text-blue-800 bg-blue-100 border-blue-400', badge: 'In Transit' },
    delivered: { label: 'Delivered', color: 'text-emerald-900 bg-emerald-200 border-emerald-500', badge: 'Order Completed' },
    cancelled: { label: 'Order Cancelled', color: 'text-neutral-700 bg-neutral-100 border-neutral-300', badge: 'Cancelled' },
    quote_expired: { label: 'Quotation Expired', color: 'text-red-700 bg-red-50 border-red-300', badge: 'Expired' },
    rejected: { label: 'Not Serviceable', color: 'text-red-800 bg-red-100 border-red-400', badge: 'Declined' }
  };

  const statusInfo = statusLabels[request.status] || {
    label: request.status.toUpperCase(),
    color: 'text-neutral-700 bg-neutral-100 border-neutral-300',
    badge: 'Status'
  };

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

  // 4. Online Payment via Razorpay
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
          color: '#E51E2B'
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

      if (!res.success) throw new Error(res.error || 'Feedback submission failed');

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

  const waSupportUrl = `https://wa.me/919121798653?text=${encodeURIComponent(
    `Hi TH3EE Atelier! I am inquiring about my customisation request ${request.requestNumber}.`
  )}`;

  return (
    <div className="w-full bg-[#FAFAFA] min-h-[85vh] py-6 sm:py-12 font-mono">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 text-[11px] uppercase tracking-wider text-neutral-500 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button type="button" onClick={() => navigate('/')} className="hover:text-[#E51E2B] transition-colors">Home</button>
            <span>/</span>
            <button type="button" onClick={() => navigate('/customise')} className="hover:text-[#E51E2B] transition-colors">Customise</button>
            <span>/</span>
            <span className="text-neutral-900 font-bold">{request.requestNumber}</span>
          </div>

          <button
            type="button"
            onClick={() => fetchRequestDetails(false)}
            className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black uppercase font-bold"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </nav>

        {/* Tracking Header Banner */}
        <div className="bg-white border-2 border-neutral-900 rounded-sm p-5 sm:p-8 shadow-xs mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
            <div>
              <div className="inline-block bg-[#E51E2B] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 mb-1.5">
                Official Custom Request Ledger
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-neutral-900 tracking-tight">
                {request.requestNumber}
              </h1>
              <span className="text-xs text-neutral-500 mt-0.5 block">
                Submitted on {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Current Status Pill */}
            <div className={`px-4 py-2 border rounded-xs self-start sm:self-auto text-left sm:text-right ${statusInfo.color}`}>
              <span className="text-[10px] uppercase font-bold tracking-widest block opacity-75">
                {statusInfo.badge}
              </span>
              <span className="text-sm font-black uppercase tracking-tight block">
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Garment Quick Summary Chips */}
          <div className="mt-4 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-neutral-50 p-2.5 border border-neutral-200 rounded-xs">
              <span className="text-[10px] text-neutral-400 uppercase block font-bold">Garment Cut</span>
              <strong className="text-neutral-900 uppercase">{request.fit} {request.garmentCategory}</strong>
            </div>
            <div className="bg-neutral-50 p-2.5 border border-neutral-200 rounded-xs">
              <span className="text-[10px] text-neutral-400 uppercase block font-bold">Colour & Fabric</span>
              <strong className="text-neutral-900">{request.primaryColor} • {request.gsm}</strong>
            </div>
            <div className="bg-neutral-50 p-2.5 border border-neutral-200 rounded-xs">
              <span className="text-[10px] text-neutral-400 uppercase block font-bold">Total Garment Run</span>
              <strong className="text-[#E51E2B]">{request.totalQuantity} Pieces</strong>
            </div>
            <div className="bg-neutral-50 p-2.5 border border-neutral-200 rounded-xs">
              <span className="text-[10px] text-neutral-400 uppercase block font-bold">Patron Reference</span>
              <strong className="text-neutral-900 truncate block">{request.customerName}</strong>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION A: ITEMISED QUOTATION & CHECKOUT ACTIONS */}
        {/* ==================================================================== */}
        {!quote && (
          <div className="bg-white border-2 border-neutral-900 rounded-sm p-5 sm:p-8 shadow-sm mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                Print Size & Price Evaluation In Progress
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight">
              Studio Quotation & Print Size Review
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 max-w-2xl leading-relaxed">
              Our studio team is currently inspecting your artwork in the admin portal to calculate exact print dimensions, ink density, and blank specifications.
            </p>

            <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xs space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#E51E2B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-neutral-900">
                    What happens once print size evaluation is complete?
                  </p>
                  <p className="text-neutral-600 text-[11px] leading-relaxed">
                    1. Our team updates the itemised quote in the admin panel and transmits it directly to this live tracking page and your WhatsApp.
                    <br />
                    2. We will negotiate and finalize any adjustments to size, quantity, or placement with you.
                    <br />
                    3. Once agreed, an instant <strong>Pay Online</strong> button will activate right here so you can pay securely through the website.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-150 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-neutral-500">
                Need urgent assistance or have questions about print sizing?
              </span>
              <a
                href={waSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase px-5 py-2.5 tracking-wider transition-colors shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Discuss / Negotiate on WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {quote && (
          <div className="bg-white border-2 border-neutral-900 rounded-sm p-5 sm:p-8 shadow-sm mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200 mb-5">
              <div>
                <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block">
                  Studio Quotation v{quote.version}
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900">
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
            <div className="border border-neutral-200 rounded-sm overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Line Item Specification</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-mono">
                  <tr>
                    <td className="py-2.5 px-4">
                      Garment Base Blank: {request.fit} {request.garmentCategory} ({request.fabric}) x{request.totalQuantity}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold">
                      ₹{quote.garmentBasePrice.toFixed(2)}
                    </td>
                  </tr>

                  {quote.printingCharges > 0 && (
                    <tr>
                      <td className="py-2.5 px-4">
                        High-Definition Direct-to-Film (DTF) Print Fees ({request.placements?.length || 1} Placements)
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        ₹{quote.printingCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {quote.placementCharges > 0 && (
                    <tr>
                      <td className="py-2.5 px-4">
                        Additional Multi-Zone Placement Charges
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        ₹{quote.placementCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {quote.artworkCharges > 0 && (
                    <tr>
                      <td className="py-2.5 px-4">
                        Vector Artwork Preparation & Studio Separation
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        ₹{quote.artworkCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {quote.shippingCharges > 0 && (
                    <tr>
                      <td className="py-2.5 px-4 text-neutral-600">
                        Inspected Express Pan-India Courier
                      </td>
                      <td className="py-2.5 px-4 text-right text-neutral-600">
                        ₹{quote.shippingCharges.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Applied Coupon / Quantity Discount */}
                  {quoteDiscount > 0 && (
                    <tr className="bg-red-50/50 text-[#E51E2B]">
                      <td className="py-2.5 px-4 font-bold">
                        Discount Voucher Applied ({appliedCoupon ? appliedCoupon.code : 'Volume Savings'})
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        -₹{quoteDiscount.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Final Payable Total */}
                  <tr className="bg-neutral-50 text-neutral-900 font-black text-sm border-t-2 border-neutral-900">
                    <td className="py-3 px-4 uppercase">
                      Final Authorised Payable Amount
                    </td>
                    <td className="py-3 px-4 text-right text-[#E51E2B] text-base">
                      ₹{finalPayableAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Promotional Coupon Entry (When ready for payment) */}
            {(request.status === 'awaiting_payment' || request.status === 'quotation_sent') && (
              <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-sm mb-6">
                <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 relative">
                    <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="ENTER PROMO COUPON CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold uppercase border border-neutral-300 rounded-xs bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors shrink-0 disabled:opacity-50"
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
                    className="w-full sm:w-auto px-5 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Request Adjustments
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptQuotation}
                    disabled={isAcceptingQuote}
                    className="w-full sm:w-auto bg-[#E51E2B] hover:bg-black text-white px-7 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    {isAcceptingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Accept Quotation</span>
                  </button>
                </div>
              )}

              {/* State 2: Awaiting Payment -> Pay Online with Razorpay */}
              {request.status === 'awaiting_payment' && (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isProcessingPayment}
                  className="w-full sm:w-auto bg-[#E51E2B] hover:bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Secure Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay Online ₹{finalPayableAmount.toFixed(2)}</span>
                    </>
                  )}
                </button>
              )}

              {/* State 3: Paid Confirmation */}
              {['paid', 'artwork_approval_pending', 'in_production', 'ready_for_dispatch', 'shipped', 'delivered'].includes(request.status) && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 border border-emerald-300 rounded-xs text-xs font-bold uppercase">
                  <Check className="w-4 h-4" />
                  <span>Payment Authorised & Verified</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SECTION B: DIGITAL ARTWORK PROOF REVIEW & APPROVAL */}
        {/* ==================================================================== */}
        {latestProof && (
          <div className="bg-white border-2 border-neutral-900 rounded-sm p-5 sm:p-8 shadow-sm mb-6 sm:mb-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
                  Digital Mockup Proof v{latestProof.version}
                </span>
                <h3 className="text-lg sm:text-xl font-black uppercase text-neutral-900">
                  Artwork Production Proof
                </h3>
              </div>

              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-xs border ${
                latestProof.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : latestProof.status === 'revision_requested'
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-300'
              }`}>
                {latestProof.status === 'approved' ? 'Proof Approved' : latestProof.status === 'revision_requested' ? 'Revision Pending' : 'Awaiting Your Approval'}
              </span>
            </div>

            {/* Proof Mockup Image */}
            <div className="bg-neutral-100 border border-neutral-200 rounded-sm p-4 text-center mb-4">
              <img
                src={latestProof.proofImageUrl}
                alt="Digital Proof Mockup"
                className="max-h-96 mx-auto object-contain rounded-xs border border-neutral-300 bg-white shadow-xs"
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
                    className="w-full sm:w-auto px-4 py-2 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider"
                  >
                    Request Modification
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProofResponse(true)}
                    disabled={isRespondingProof}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    {isRespondingProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Approve Proof for Production</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* SECTION C: PRODUCTION & SHIPPING TRACKING TIMELINE */}
        {/* ==================================================================== */}
        <div className="bg-white border-2 border-neutral-900 rounded-sm p-5 sm:p-8 shadow-sm mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-black uppercase text-neutral-900 mb-4 pb-2 border-b border-neutral-200">
            Order Lifecycle Audit & Milestones
          </h3>

          <div className="space-y-4 font-mono">
            {(request.timeline || []).map((ev, i) => (
              <div key={ev.id || i} className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#E51E2B] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
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

          {/* WhatsApp Direct Connect */}
          <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-neutral-500">
              Have questions regarding thread counts, DTF cure times, or custom sizing?
            </span>
            <a
              href={waSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-xs transition-colors shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Connect on WhatsApp</span>
            </a>
          </div>
        </div>

      </div>

      {/* Changes Request Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono">
          <div className="bg-white border-2 border-neutral-900 p-6 max-w-lg w-full shadow-2xl rounded-sm">
            <h3 className="text-base font-black uppercase text-neutral-900 mb-2">
              Request Quotation Adjustments
            </h3>
            <p className="text-xs text-neutral-600 mb-4">
              Specify which specifications or quantities you would like our atelier team to revise:
            </p>
            <form onSubmit={handleRequestChangesSubmit} className="space-y-4">
              <textarea
                rows={4}
                value={changesNotes}
                onChange={(e) => setChangesNotes(e.target.value)}
                placeholder="e.g. Please recalculate for 5 pieces instead of 2, or remove back print..."
                className="w-full p-3 border border-neutral-300 text-xs font-mono"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangesModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRequestingChanges}
                  className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-5 py-2 text-xs font-bold uppercase"
                >
                  {isRequestingChanges ? 'Submitting...' : 'Send Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Revision Modal */}
      {showProofRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono">
          <div className="bg-white border-2 border-neutral-900 p-6 max-w-lg w-full shadow-2xl rounded-sm">
            <h3 className="text-base font-black uppercase text-neutral-900 mb-2">
              Request Artwork Mockup Revision
            </h3>
            <p className="text-xs text-neutral-600 mb-4">
              Describe what changes are needed on the graphic positioning or scale:
            </p>
            <textarea
              rows={4}
              value={proofFeedback}
              onChange={(e) => setProofFeedback(e.target.value)}
              placeholder="e.g. Please shift chest logo 2cm higher, or brighten yellow tones..."
              className="w-full p-3 border border-neutral-300 text-xs font-mono mb-4"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProofRevisionModal(false)}
                className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleProofResponse(false)}
                disabled={isRespondingProof || !proofFeedback.trim()}
                className="bg-[#E51E2B] hover:bg-black text-white px-5 py-2 text-xs font-bold uppercase"
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

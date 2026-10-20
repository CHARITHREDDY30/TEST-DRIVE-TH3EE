import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { ReceiptBarcode } from '../common/PassQRCodes';

export interface ConfirmedOrderReceiptData {
  orderNumber: string;
  amount: number;
  paymentId?: string;
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'verified' | 'pending' | 'failed';
  date?: string;
  createdAt?: string;
  items?: Array<{
    name: string;
    size?: string;
    color?: string;
    quantity: number;
    price: number;
    image?: string;
  }> | string;
  subtotal?: number;
  discountAmount?: number;
  shippingAmount?: number;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    houseNo?: string;
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    address?: string;
  };
  deliveryEstimate?: string;
}

interface PaymentConfirmationReceiptProps {
  order: ConfirmedOrderReceiptData;
  isVerifying?: boolean;
  isFailed?: boolean;
  errorMessage?: string;
  onRetryPayment?: () => void;
  onTrackOrder?: (orderNumber: string) => void;
  onViewOrders?: () => void;
  onContinueShopping?: () => void;
}

export const PaymentConfirmationReceipt: React.FC<PaymentConfirmationReceiptProps> = ({
  order,
  isVerifying = false,
  isFailed = false,
  errorMessage,
  onRetryPayment,
  onTrackOrder,
  onViewOrders,
  onContinueShopping
}) => {
  // Format Date & Time
  const formattedDateTime = React.useMemo(() => {
    try {
      const rawDate = order.createdAt || order.date || new Date().toISOString();
      const d = new Date(rawDate);
      const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
      const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `${day} | ${time}`;
    } catch {
      return 'TODAY | RECENT';
    }
  }, [order.createdAt, order.date]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // 1. PENDING VERIFICATION STATE (Zero false-success guarantee)
  if (isVerifying) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 font-mono text-center">
        <div className="bg-white border border-neutral-300 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="w-14 h-14 border-4 border-neutral-200 border-t-[#E51E2B] rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">
              SECURE VERIFICATION IN PROGRESS
            </span>
            <h2 className="text-xl font-black uppercase text-neutral-900 tracking-tight">
              VERIFYING YOUR PAYMENT
            </h2>
            <p className="text-xs text-neutral-500 font-sans leading-relaxed">
              Contacting gateway servers to confirm cryptographic payment signature. Please do not close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. FAILED PAYMENT STATE
  if (isFailed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 font-mono text-center">
        <div className="bg-white border border-neutral-300 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <X className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 block">
              TRANSACTION NOT COMPLETED
            </span>
            <h2 className="text-xl font-black uppercase text-neutral-900 tracking-tight">
              PAYMENT VERIFICATION FAILED
            </h2>
            <p className="text-xs text-neutral-600 font-sans leading-relaxed">
              {errorMessage || 'Your payment could not be verified by the banking gateway. Your bag items have been preserved.'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {onRetryPayment && (
              <button
                type="button"
                onClick={onRetryPayment}
                className="w-full py-3 bg-neutral-900 hover:bg-[#E51E2B] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xl cursor-pointer"
              >
                Try Payment Again
              </button>
            )}
            {onContinueShopping && (
              <button
                type="button"
                onClick={onContinueShopping}
                className="w-full py-3 bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors rounded-xl cursor-pointer"
              >
                Return to Store
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. SUCCESSFUL CONFIRMED RECEIPT TICKET (Inspired by Reference Image 1)
  const itemsList = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 font-mono">
      {/* Print stylesheet to isolate ticket when printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #th3ee-ticket-receipt, #th3ee-ticket-receipt * {
            visibility: visible;
          }
          #th3ee-ticket-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Ticket Card Silhouette */}
      <motion.div
        id="th3ee-ticket-receipt"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative bg-[#FAF9F5] border border-neutral-200/90 rounded-[28px] shadow-2xl overflow-hidden text-neutral-900"
      >
        {/* Top Celebration Emblem / Clean TH3EE Mark (Inspired by Image 1) */}
        <div className="pt-8 pb-4 text-center px-6">
          <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-base font-black tracking-tighter">3</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-neutral-900">
            Thank you
          </h1>
          <p className="text-xs text-neutral-600 font-sans mt-1">
            Your payment has been processed successfully.
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase rounded-md tracking-wider">
            PAYMENT SUCCESSFUL • ORDER CONFIRMED
          </span>
        </div>

        {/* Perforated Divider with Cutout Notches */}
        <div className="relative py-4">
          {/* Left Semi-circle Ticket Cutout */}
          <div
            className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-100 border-r border-neutral-200/80 pointer-events-none shadow-inner"
            aria-hidden="true"
          />
          {/* Dashed Perforation Line */}
          <div className="border-t-2 border-dashed border-neutral-300 mx-6" />
          {/* Right Semi-circle Ticket Cutout */}
          <div
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-100 border-l border-neutral-200/80 pointer-events-none shadow-inner"
            aria-hidden="true"
          />
        </div>

        {/* Key Order Info Section (TICKET ID, AMOUNT, DATE & TIME - Like Image 1) */}
        <div className="px-6 sm:px-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                ORDER REF / TICKET ID
              </span>
              <span className="text-sm sm:text-base font-black text-neutral-900 uppercase">
                {order.orderNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                AMOUNT PAID
              </span>
              <span className="text-base sm:text-lg font-black text-[#E51E2B]">
                ₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              DATE & TIME
            </span>
            <span className="text-xs font-bold text-neutral-800">
              {formattedDateTime}
            </span>
          </div>

          {/* Payment Method Inset Pill / Card (Matching Reference Image 1) */}
          <div className="p-3.5 rounded-2xl bg-[#F0F4FA] border border-blue-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {/* Payment Card / Gateway Icon */}
              <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-600 font-black shrink-0 shadow-xs">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-neutral-900 block font-sans">
                  {order.paymentMethod || 'Razorpay Gateway Verified'}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono block">
                  {order.paymentId ? `Ref: ${order.paymentId}` : 'Instant Settlement'}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold uppercase rounded-md shrink-0">
              Paid
            </span>
          </div>

          {/* Purchased Items Itemized List */}
          {itemsList.length > 0 && (
            <div className="pt-2 border-t border-neutral-200/80 space-y-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                PURCHASED PIECES ({itemsList.length})
              </span>
              <div className="divide-y divide-neutral-200/60 max-h-48 overflow-y-auto pr-1">
                {itemsList.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-neutral-900 font-sans leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        Qty: {item.quantity} {item.size && `• Size: ${item.size}`} {item.color && `• ${item.color}`}
                      </p>
                    </div>
                    <span className="font-bold text-neutral-800 shrink-0">
                      ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Summary Breakdown */}
          <div className="pt-3 border-t border-neutral-200/80 text-xs space-y-1.5 font-sans">
            {order.subtotal !== undefined && (
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Boolean(order.discountAmount && order.discountAmount > 0) && (
              <div className="flex justify-between text-[#E51E2B]">
                <span>Discount Applied</span>
                <span className="font-mono font-bold">-₹{Number(order.discountAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>Shipping Fee</span>
              <span className="font-mono font-medium">
                {order.shippingAmount && order.shippingAmount > 0 ? `₹${order.shippingAmount}` : 'FREE (Complimentary)'}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1 border-t border-neutral-200 font-mono">
              <span>Final Total Paid</span>
              <span className="text-[#E51E2B]">₹{Number(order.amount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Delivery Address Summary */}
          {order.shippingAddress && (
            <div className="p-3 rounded-xl bg-neutral-100/70 border border-neutral-200 text-xs space-y-1 font-sans">
              <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono block">
                DELIVERY DESTINATION
              </span>
              <p className="font-bold text-neutral-900">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                {order.shippingAddress.houseNo} {order.shippingAddress.street}
                {order.shippingAddress.area && `, ${order.shippingAddress.area}`}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
              {order.shippingAddress.phone && (
                <p className="text-[10px] text-neutral-500 font-mono">
                  Phone: {order.shippingAddress.phone}
                </p>
              )}
            </div>
          )}

          {/* Expected Delivery Estimate */}
          <div className="text-[11px] text-neutral-500 text-center font-sans">
            {order.deliveryEstimate || 'Estimated Dispatch: 24–48 Hours via BlueDart Air Express'}
          </div>
        </div>

        {/* Lower Perforation & Barcode Section (Matching Reference Image 1) */}
        <div className="mt-6 pt-4 pb-6 px-6 sm:px-8 border-t-2 border-dashed border-neutral-300 text-center space-y-3 bg-[#F5F4EE]">
          <ReceiptBarcode code={order.orderNumber} />
          <p className="text-[10px] text-neutral-400 font-sans">
            Need assistance? Reach out to <a href="mailto:support@th3ee.in" className="text-neutral-900 font-bold underline">support@th3ee.in</a>
          </p>
        </div>

        {/* Bottom Scalloped Perforation Border (Ticket Silhouette) */}
        <div className="relative h-3 bg-[#FAF9F5] flex justify-between overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full bg-neutral-100 -mb-2 shrink-0 border-t border-neutral-200"
              aria-hidden="true"
            />
          ))}
        </div>
      </motion.div>

      {/* Ticket Action Buttons (Preserved and Refined) */}
      <div className="mt-6 space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {onTrackOrder && (
            <button
              type="button"
              onClick={() => onTrackOrder(order.orderNumber)}
              className="w-full py-3 bg-neutral-900 hover:bg-[#E51E2B] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Track Your Order</span>
              <span>→</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-3 bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-900 text-xs font-bold uppercase tracking-wider transition-colors rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Receipt</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 px-1">
          {onViewOrders && (
            <button
              type="button"
              onClick={onViewOrders}
              className="text-neutral-600 hover:text-black font-bold uppercase underline cursor-pointer"
            >
              View In Order History
            </button>
          )}

          {onContinueShopping && (
            <button
              type="button"
              onClick={onContinueShopping}
              className="text-neutral-600 hover:text-[#E51E2B] font-bold uppercase underline cursor-pointer"
            >
              Continue Shopping →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationReceipt;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { couponsService, type Coupon } from '../../services/coupons.service';

interface CouponSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartSubtotal: number;
  appliedCoupon: any;
  onApplyCoupon: (code: string) => Promise<boolean>;
  onRemoveCoupon: () => void;
  customerId?: string | null;
  customerEmail?: string | null;
}

// Fallback baseline coupons ensuring customers always see known active promotions even if offline
const BASELINE_COUPONS: Coupon[] = [
  {
    id: 'c-bunny',
    code: 'BUNNY',
    description: 'Happy Bunny Special — 30% OFF on drops above ₹1,000',
    discountType: 'percentage',
    discountValue: 30,
    minimumOrderAmount: 1000,
    usageCount: 0,
    isActive: true,
    canStack: false
  },
  {
    id: 'c-chandu',
    code: 'CHANDU',
    description: 'Happy Chandu Special — 20% OFF on drops above ₹500',
    discountType: 'percentage',
    discountValue: 20,
    minimumOrderAmount: 500,
    usageCount: 0,
    isActive: true,
    canStack: false
  }
];

export const CouponSelectorModal: React.FC<CouponSelectorModalProps> = ({
  isOpen,
  onClose,
  cartSubtotal,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [coupons, setCoupons] = useState<Coupon[]>(BASELINE_COUPONS);
  const [manualCode, setManualCode] = useState('');
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch live coupons from backend
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    couponsService.getCoupons().then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        // Merge with baseline without duplicate codes
        const merged = [...list];
        for (const base of BASELINE_COUPONS) {
          if (!merged.some((c) => c.code.toUpperCase() === base.code.toUpperCase())) {
            merged.push(base);
          }
        }
        setCoupons(merged.filter((c) => c.isActive !== false));
      } else {
        setCoupons(BASELINE_COUPONS);
      }
    }).catch(() => {
      setCoupons(BASELINE_COUPONS);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = async (codeToApply: string) => {
    const clean = codeToApply.trim().toUpperCase();
    if (!clean) return;
    setLoadingCode(clean);
    setErrorMessage('');
    try {
      const success = await onApplyCoupon(clean);
      if (success) {
        onClose();
      } else {
        setErrorMessage(`Coupon "${clean}" could not be applied. Check order conditions.`);
      }
    } catch {
      setErrorMessage('Could not validate coupon. Please try again.');
    } finally {
      setLoadingCode(null);
    }
  };

  const calculateDiscount = (coupon: Coupon) => {
    if (cartSubtotal < (coupon.minimumOrderAmount || 0)) return 0;
    if (coupon.discountType === 'percentage') {
      const disc = Math.round((cartSubtotal * coupon.discountValue) / 100);
      return coupon.maximumDiscount ? Math.min(disc, coupon.maximumDiscount) : disc;
    }
    return Math.min(coupon.discountValue, cartSubtotal);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white max-w-md w-full border-2 border-neutral-900 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#E51E2B] text-white rounded-full flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase text-neutral-900 tracking-wider">
                Apply Coupon
              </h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-tight">
                Current Bag: ₹{cartSubtotal.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-[#E51E2B] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Manual Input Field (Myntra-style) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
              Have an Exclusive Code?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="ENTER COUPON CODE"
                className="flex-1 px-3 py-2.5 border border-neutral-300 text-xs font-mono tracking-wider uppercase focus:outline-none focus:border-neutral-900"
              />
              <button
                type="button"
                disabled={!manualCode.trim() || loadingCode === manualCode.trim().toUpperCase()}
                onClick={() => handleApply(manualCode)}
                className="px-4 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-[#E51E2B] transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                {loadingCode === manualCode.trim().toUpperCase() ? '...' : 'Apply'}
              </button>
            </div>
            {errorMessage && (
              <p className="text-[11px] text-[#E51E2B] font-bold mt-1">{errorMessage}</p>
            )}
          </div>

          {/* Currently Applied Coupon Bar */}
          {appliedCoupon && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <span className="font-extrabold text-emerald-900 uppercase tracking-wider">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-emerald-700 font-bold ml-2">Applied</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onRemoveCoupon();
                  setErrorMessage('');
                }}
                className="text-[11px] font-bold uppercase text-red-600 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Available Coupons List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                Available Offers ({coupons.length})
              </h4>
              <span className="text-[10px] text-neutral-400 uppercase">
                Tap to Apply
              </span>
            </div>

            <div className="space-y-3">
              {coupons.map((coupon) => {
                const isCurrent = appliedCoupon?.code?.toUpperCase() === coupon.code.toUpperCase();
                const minReq = coupon.minimumOrderAmount || 0;
                const isEligible = cartSubtotal >= minReq;
                const savings = calculateDiscount(coupon);
                const shortfall = minReq - cartSubtotal;

                return (
                  <div
                    key={coupon.id || coupon.code}
                    className={`relative p-3.5 border transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : isEligible
                        ? 'border-neutral-300 hover:border-neutral-900 bg-white'
                        : 'border-neutral-200 bg-neutral-50/70 opacity-80'
                    }`}
                  >
                    {/* Top Row: Coupon Code Badge & Apply Action */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-dashed border-neutral-400 text-neutral-900 text-xs font-black uppercase tracking-wider">
                          <span>{coupon.code}</span>
                          <span className="text-[10px] font-bold text-[#E51E2B]">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue} OFF`}
                          </span>
                        </div>

                        {/* Description */}
                        {coupon.description && (
                          <p className="text-[11px] text-neutral-700 font-bold mt-1.5 leading-snug">
                            {coupon.description}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0">
                        {isCurrent ? (
                          <button
                            type="button"
                            onClick={onRemoveCoupon}
                            className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            Remove
                          </button>
                        ) : isEligible ? (
                          <button
                            type="button"
                            disabled={loadingCode === coupon.code}
                            onClick={() => handleApply(coupon.code)}
                            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-[#E51E2B] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                          >
                            {loadingCode === coupon.code ? '...' : 'Apply'}
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 bg-neutral-200 text-neutral-500 text-[9px] font-bold uppercase tracking-wider inline-block">
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Savings or Condition Details (Myntra-style) */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-200/60 text-[10px]">
                      {isEligible ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Save ₹{savings.toLocaleString('en-IN')} on this order!</span>
                          {minReq > 0 && (
                            <span className="text-neutral-400 font-normal ml-auto">
                              (Min: ₹{minReq.toLocaleString('en-IN')})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-neutral-500">
                          <span className="text-amber-700 font-bold">
                            Add items worth ₹{shortfall.toLocaleString('en-IN')} more to unlock
                          </span>
                          <span className="font-mono text-neutral-400">
                            Min: ₹{minReq.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      {/* Terms notes */}
                      <div className="flex flex-wrap gap-2 text-neutral-400 text-[9px] mt-1.5">
                        <span>• 1 use per patron</span>
                        {coupon.maximumDiscount && (
                          <span>• Max discount ₹{coupon.maximumDiscount}</span>
                        )}
                        <span>• Valid for all catalog drops</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-200 bg-neutral-50 text-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-white border border-neutral-300 hover:border-black text-neutral-900 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

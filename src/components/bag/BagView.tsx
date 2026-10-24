import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CartItem } from '../../types/store';
import type { AuthUser } from '../../types/auth';
import { resolveProductImageUrl, handleImageLoadError } from '../../lib/r2';
import { couponsService } from '../../services/coupons.service';
import { CouponSelectorModal } from '../coupons/CouponSelectorModal';

interface BagViewProps {
  cart: CartItem[];
  currentUser?: AuthUser | null;
  cartSubtotal: number;
  deliveryCharge: number;
  hasFreeShipping: boolean;
  freeShippingLimit: number;
  onAdjustQty: (id: string, color: string, size: string, delta: number) => void;
  onRemoveItem: (id: string, color: string, size: string) => void;
  onClearBag: () => void;
  navigate: (path: string) => void;
  showNotification: (data: any) => void;
  onOpenAuthModal?: () => void;
  onShareItem?: (item: CartItem) => void;
}

export const BagView: React.FC<BagViewProps> = ({
  cart,
  currentUser,
  cartSubtotal,
  deliveryCharge,
  hasFreeShipping,
  freeShippingLimit,
  onAdjustQty,
  onRemoveItem,
  onClearBag,
  navigate,
  showNotification,
  onOpenAuthModal,
  onShareItem
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const totalItemsCount = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const finalTotal = Math.max(0, cartSubtotal - couponDiscount + (hasFreeShipping ? 0 : deliveryCharge));

  const applyCouponByCode = async (code: string): Promise<boolean> => {
    const clean = code.trim().toUpperCase();
    if (!clean) return false;
    setCouponLoading(true);
    setCouponMessage('');
    try {
      const result = await couponsService.validateCoupon(
        clean,
        cartSubtotal,
        currentUser?.id || null,
        currentUser?.email || null
      );
      if (result.valid) {
        setAppliedCoupon(result.coupon || { code: clean });
        setCouponDiscount(result.discount);
        setCouponCode(clean);
        setCouponMessage(result.message || `Code ${clean} applied!`);
        showNotification({ type: 'success', message: `Coupon ${clean} applied!` });
        return true;
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponMessage(result.message || 'Invalid coupon code.');
        showNotification({ type: 'error', message: result.message || 'Invalid coupon code.' });
        return false;
      }
    } catch {
      setCouponMessage('Error applying coupon. Please try again.');
      return false;
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyCouponByCode(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponMessage('');
    showNotification({ type: 'info', message: 'Coupon removed' });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 font-mono">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6 bg-white border-2 border-neutral-900 p-8 sm:p-12 shadow-2xl"
        >
          <div className="w-16 h-16 mx-auto bg-neutral-100 border border-neutral-300 flex items-center justify-center rounded-full text-neutral-900">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#E51E2B] uppercase">ATELIER ARCHIVE</span>
            <h1 className="text-2xl font-black uppercase text-neutral-900 tracking-tight mt-1">
              YOUR BAG IS EMPTY
            </h1>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              No heavyweight streetwear silhouettes currently reserved. Browse the latest seasonal drops and editorial drops.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="w-full py-3 bg-neutral-900 text-white hover:bg-[#E51E2B] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Explore Products</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-white border border-neutral-300 hover:border-neutral-900 text-xs font-bold uppercase tracking-wider text-neutral-800 transition-colors cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 font-mono">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              YOUR SHOPPING BAG
            </h1>
            <span className="bg-neutral-900 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {totalItemsCount} {totalItemsCount === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Review reserved silhouettes, select sizes, and proceed to secure online payment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-[#E51E2B] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Continue Shopping</span>
        </button>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="mt-6 bg-neutral-50 border border-neutral-200 p-3 sm:p-4">
        {hasFreeShipping ? (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>You have unlocked FREE Standard Shipping across India!</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-600">
                Add <span className="font-bold text-neutral-900">₹{(freeShippingLimit - cartSubtotal).toFixed(0)}</span> more for Free Shipping
              </span>
              <span className="font-bold text-neutral-900">
                ₹{cartSubtotal} / ₹{freeShippingLimit}
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-neutral-900 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (cartSubtotal / freeShippingLimit) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence>
            {cart.map((item) => {
              const itemTotal = (item.price || 0) * (item.quantity || 1);
              const originalTotal = (item.originalPrice || item.price) * (item.quantity || 1);
              const hasDiscount = item.originalPrice && item.originalPrice > item.price;
              const imgUrl = resolveProductImageUrl(
                item.thumbnail || (item.images && item.images[0]) || ''
              );

              return (
                <motion.div
                  key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border-2 border-neutral-200 hover:border-neutral-900 transition-colors p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 shadow-xs rounded-2xl"
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-32 sm:w-28 sm:h-36 bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden relative rounded-xl">
                    <img
                      src={imgUrl}
                      alt={item.name}
                      onError={handleImageLoadError}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                      {item.selectedSize}
                    </span>
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                            TH3EE SILHOUETTE
                          </span>
                          <h3 className="text-sm sm:text-base font-black uppercase text-neutral-900 tracking-tight">
                            {item.name}
                          </h3>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-black text-neutral-900">
                            ₹{itemTotal.toLocaleString('en-IN')}
                          </div>
                          {hasDiscount && (
                            <div className="text-[11px] text-neutral-400 line-through">
                              ₹{originalTotal.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Variant Attributes */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-400">Colour:</span>
                          <span className="font-bold text-neutral-900 uppercase">{item.selectedColor}</span>
                        </div>
                        <span className="text-neutral-300">•</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-400">Size:</span>
                          <span className="font-bold text-neutral-900 uppercase">{item.selectedSize}</span>
                        </div>
                        <span className="text-neutral-300">•</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 uppercase">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span>In Stock</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 uppercase">QTY:</span>
                        <div className="flex items-center border border-neutral-300 bg-white">
                          <button
                            type="button"
                            onClick={() => onAdjustQty(item.id, item.selectedColor, item.selectedSize, -1)}
                            disabled={item.quantity <= 1}
                            className="px-2.5 py-1 text-xs hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-bold min-w-8 text-center text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAdjustQty(item.id, item.selectedColor, item.selectedSize, 1)}
                            className="px-2.5 py-1 text-xs hover:bg-neutral-100 transition-colors font-bold cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {onShareItem && (
                          <button
                            type="button"
                            onClick={() => onShareItem(item)}
                            className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                            title="Share Drop"
                            aria-label="Share Drop"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="18" cy="5" r="3" />
                              <circle cx="6" cy="12" r="3" />
                              <circle cx="18" cy="19" r="3" />
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            <span>Share</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id, item.selectedColor, item.selectedSize)}
                          className="text-xs font-bold text-neutral-400 hover:text-[#E51E2B] transition-colors flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={onClearBag}
              className="text-xs text-neutral-400 hover:text-neutral-700 uppercase tracking-wider transition-colors cursor-pointer"
            >
              Clear Entire Bag
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Order Summary (4 cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white border-2 border-neutral-900 p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 pb-3 border-b border-neutral-200">
              ORDER SUMMARY
            </h2>

            {/* Coupon Application Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block">
                  PROMOTIONAL / ATELIER VOUCHER
                </label>
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(true)}
                  className="text-[10px] font-bold text-[#E51E2B] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  View Coupons →
                </button>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 text-xs">
                  <div>
                    <span className="font-bold text-emerald-800 uppercase tracking-wider">{appliedCoupon.code}</span>
                    <p className="text-[11px] text-emerald-600 mt-0.5">-₹{couponDiscount.toFixed(2)} applied</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(true)}
                      className="text-xs text-neutral-700 hover:text-black font-bold uppercase cursor-pointer"
                    >
                      Change
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-600 hover:underline font-bold uppercase cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsCouponModalOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-dashed border-neutral-400 text-xs text-neutral-900 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#E51E2B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      <span className="font-bold uppercase tracking-wider text-[11px]">Check Available Coupons</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#E51E2B] uppercase group-hover:underline">
                      Apply →
                    </span>
                  </button>

                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      className="flex-1 px-3 py-2 border border-neutral-300 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-[#E51E2B] transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                </div>
              )}
              {couponMessage && !appliedCoupon && (
                <p className="text-[11px] text-red-600 mt-1.5">{couponMessage}</p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs pt-2 border-t border-neutral-100">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span className="font-bold text-neutral-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Standard Delivery</span>
                {hasFreeShipping ? (
                  <span className="font-bold text-emerald-700 uppercase">FREE</span>
                ) : (
                  <span className="font-bold text-neutral-900">₹{deliveryCharge}</span>
                )}
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t-2 border-neutral-900 text-neutral-900">
                <span className="text-sm font-black uppercase">ESTIMATED TOTAL</span>
                <div className="text-right">
                  <span className="text-xl font-black text-neutral-900">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-neutral-400 font-normal">
                    Inclusive of all applicable GST
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  try {
                    sessionStorage.setItem('th3ee_auth_redirect', '/checkout');
                  } catch {}
                  showNotification({
                    type: 'info',
                    message: 'Please sign in or create an account to proceed to checkout.'
                  });
                  onOpenAuthModal?.();
                } else {
                  navigate('/checkout');
                }
              }}
              className="w-full py-3.5 bg-neutral-900 hover:bg-[#E51E2B] text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>PROCEED TO CHECKOUT</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            {/* Trust and Assurance Micro-Copy */}
            <div className="pt-2 border-t border-neutral-100 space-y-2 text-[10px] text-neutral-400">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-neutral-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Encrypted 256-bit Razorpay Payment Gateway</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-neutral-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                  <path d="M15 18H9M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="17" cy="18" r="2" />
                </svg>
                <span>Pan-India tracked delivery via leading air express couriers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Myntra-style Coupon Selector Modal */}
      <CouponSelectorModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        cartSubtotal={cartSubtotal}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={applyCouponByCode}
        onRemoveCoupon={handleRemoveCoupon}
        customerId={currentUser?.id}
        customerEmail={currentUser?.email}
      />
    </div>
  );
};

export default BagView;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CartItem, DeliveryInfo } from '../../types/store';
import type { AuthUser } from '../../types/auth';
import { resolveProductImageUrl, handleImageLoadError } from '../../lib/r2';
import { couponsService } from '../../services/coupons.service';
import { customerService } from '../../services/customer.service';
import { razorpayService } from '../../services/razorpay.service';
import { broadcastCatalogChange } from '../../services/catalogSync';
import { PaymentConfirmationReceipt, type ConfirmedOrderReceiptData } from './PaymentConfirmationReceipt';
import { CouponSelectorModal } from '../coupons/CouponSelectorModal';

interface CheckoutViewProps {
  cart: CartItem[];
  currentUser: AuthUser | null;
  cartSubtotal: number;
  deliveryCharge: number;
  hasFreeShipping: boolean;
  freeShippingLimit: number;
  onClearBag: () => void;
  navigate: (path: string) => void;
  showNotification: (data: any) => void;
  onOpenAuthModal?: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  currentUser,
  cartSubtotal,
  deliveryCharge,
  hasFreeShipping,
  freeShippingLimit,
  onClearBag,
  navigate,
  showNotification,
  onOpenAuthModal
}) => {
  // Saved addresses for authenticated patrons
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // Delivery form state
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>(() => {
    try {
      const saved = localStorage.getItem('th3ee_customer_address');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fullName: '',
      phone: '',
      houseNo: '',
      street: '',
      area: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      address: ''
    };
  });

  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Success Confirmation State
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrderReceiptData | null>(null);

  // Pre-fill delivery details from authenticated patron profile
  useEffect(() => {
    if (currentUser) {
      setContactEmail(currentUser.email || '');
      customerService.getSavedAddresses(currentUser).then((addrs) => {
        if (Array.isArray(addrs) && addrs.length > 0) {
          setSavedAddresses(addrs);
          const def = addrs.find((a: any) => a.isDefault) || addrs[0];
          if (def) {
            setSelectedAddressId(def.id);
            setDeliveryInfo({
              fullName: def.fullName || currentUser.name || '',
              phone: def.phone || currentUser.phone || '',
              houseNo: def.houseNo || '',
              street: def.street || '',
              area: def.area || '',
              landmark: def.landmark || '',
              city: def.city || '',
              state: def.state || '',
              pincode: def.pincode || '',
              address: `${def.houseNo ? def.houseNo + ', ' : ''}${def.street || ''}`
            });
            return;
          }
        }
      }).catch(() => {});

      setDeliveryInfo((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.name || '',
        phone: prev.phone || currentUser.phone || ''
      }));
    } else {
      setSavedAddresses([]);
      setSelectedAddressId('');
    }
  }, [currentUser]);

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setDeliveryInfo({
        fullName: currentUser?.name || '',
        phone: currentUser?.phone || '',
        houseNo: '',
        street: '',
        area: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        address: ''
      });
      return;
    }
    const found = savedAddresses.find((a: any) => a.id === addrId);
    if (found) {
      setDeliveryInfo({
        fullName: found.fullName || currentUser?.name || '',
        phone: found.phone || currentUser?.phone || '',
        houseNo: found.houseNo || '',
        street: found.street || '',
        area: found.area || '',
        landmark: found.landmark || '',
        city: found.city || '',
        state: found.state || '',
        pincode: found.pincode || '',
        address: `${found.houseNo ? found.houseNo + ', ' : ''}${found.street || ''}`
      });
      setAddressErrors({});
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const updated = { ...deliveryInfo, [field]: value };
    setDeliveryInfo(updated);
    if (addressErrors[field]) {
      const copy = { ...addressErrors };
      delete copy[field];
      setAddressErrors(copy);
    }
    try {
      localStorage.setItem('th3ee_customer_address', JSON.stringify(updated));
    } catch {}
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!deliveryInfo.fullName || !deliveryInfo.fullName.trim()) {
      errs.fullName = 'Full legal name is required.';
    }

    const cleanPhone = (deliveryInfo.phone || '').replace(/\D/g, '');
    const phoneToTest = cleanPhone.length > 10 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;
    if (!deliveryInfo.phone || !deliveryInfo.phone.trim()) {
      errs.phone = 'Mobile contact number is required.';
    } else if (!/^[6-9]\d{9}$/.test(phoneToTest)) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }

    if (!contactEmail || !contactEmail.trim() || !contactEmail.includes('@')) {
      errs.email = 'A valid email address is required for dispatch receipts.';
    }

    if (!deliveryInfo.houseNo || !deliveryInfo.houseNo.trim()) {
      errs.houseNo = 'House / Flat / Studio No. is required.';
    }
    if (!deliveryInfo.area || !deliveryInfo.area.trim()) {
      errs.area = 'Area / Locality / Sector is required.';
    }
    if (!deliveryInfo.city || !deliveryInfo.city.trim()) {
      errs.city = 'City / Town is required.';
    }
    if (!deliveryInfo.state || !deliveryInfo.state.trim()) {
      errs.state = 'State / Union Territory is required.';
    }

    const cleanPin = (deliveryInfo.pincode || '').replace(/\D/g, '');
    if (!deliveryInfo.pincode || !deliveryInfo.pincode.trim()) {
      errs.pincode = '6-digit Postal PIN code is required.';
    } else if (!/^\d{6}$/.test(cleanPin) || cleanPin.startsWith('0')) {
      errs.pincode = 'PIN code must be exactly 6 valid digits.';
    }

    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

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
        contactEmail || currentUser?.email || null
      );
      if (result.valid) {
        setAppliedCoupon(result.coupon || { code: clean });
        setCouponDiscount(result.discount);
        setCouponCode(clean);
        setCouponMessage(result.message || `Code ${clean} applied!`);
        showNotification({ type: 'success', message: `Coupon applied: -₹${result.discount}` });
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
  };

  const totalItemsCount = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const finalPayable = Math.max(0, cartSubtotal - couponDiscount + (hasFreeShipping ? 0 : deliveryCharge));

  const handlePayOnline = async () => {
    if (cart.length === 0 || isProcessingPayment) return;
    setPaymentError(null);

    if (!validateForm()) {
      showNotification({
        type: 'error',
        message: 'Please complete all required delivery details marked in red.'
      });
      return;
    }

    setIsProcessingPayment(true);

    // Resolve or ensure verified customer profile for authenticated patrons
    let resolvedCustomerId: string | null = null;
    if (currentUser) {
      try {
        resolvedCustomerId = await customerService.ensureCustomerRecord(currentUser, {
          name: deliveryInfo.fullName || currentUser.name,
          phone: deliveryInfo.phone || currentUser.phone
        });
      } catch (custErr: any) {
        console.warn('Customer verification note:', custErr);
        resolvedCustomerId = currentUser.id;
      }
    }

    try {
      // 1. Create server-side order and Razorpay order
      const paymentOrder = await razorpayService.createPaymentOrder({
        customerId: resolvedCustomerId || currentUser?.id,
        customerEmail: contactEmail || currentUser?.email,
        customerName: deliveryInfo.fullName || currentUser?.name || 'Customer',
        customerPhone: deliveryInfo.phone || currentUser?.phone || '',
        deliveryInfo: deliveryInfo,
        cart: cart,
        subtotal: cartSubtotal,
        discountAmount: couponDiscount,
        shippingAmount: hasFreeShipping ? 0 : deliveryCharge,
        totalAmount: finalPayable,
        couponCode: appliedCoupon?.code
      });

      if (!paymentOrder.success || !paymentOrder.orderId) {
        throw new Error(paymentOrder.error || 'Unable to initialize checkout order.');
      }

      // 2. Launch Razorpay Checkout Modal
      await razorpayService.launchCheckout(
        {
          orderId: paymentOrder.orderId,
          orderNumber: paymentOrder.orderNumber,
          razorpayOrderId: paymentOrder.razorpayOrderId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          keyId: paymentOrder.keyId,
          customerName: deliveryInfo.fullName || currentUser?.name || '',
          customerEmail: contactEmail || currentUser?.email || '',
          customerPhone: deliveryInfo.phone || currentUser?.phone || '',
          hasCredentials: paymentOrder.hasCredentials,
          isMock: paymentOrder.isMock
        },
        {
          onSuccess: async (paymentResult) => {
            try {
              // 3. Server-side payment signature verification
              const verifyRes = await razorpayService.verifyPayment({
                orderId: paymentOrder.orderId,
                orderNumber: paymentOrder.orderNumber,
                razorpayOrderId: paymentResult.razorpay_order_id,
                razorpayPaymentId: paymentResult.razorpay_payment_id,
                razorpaySignature: paymentResult.razorpay_signature,
                amount: finalPayable
              });

              if (verifyRes.verified) {
                const receiptItems = cart.map((item) => ({
                  name: item.name,
                  size: item.selectedSize,
                  color: item.selectedColor,
                  quantity: item.quantity || 1,
                  price: item.price,
                  image: (item as any).image
                }));

                const orderReceipt: ConfirmedOrderReceiptData = {
                  orderNumber: paymentOrder.orderNumber,
                  amount: finalPayable,
                  paymentId: paymentResult.razorpay_payment_id,
                  paymentMethod: 'Razorpay Verified Payment (UPI/Card/NetBanking)',
                  paymentStatus: 'paid',
                  createdAt: new Date().toISOString(),
                  items: receiptItems,
                  subtotal: cartSubtotal,
                  discountAmount: couponDiscount,
                  shippingAmount: hasFreeShipping ? 0 : deliveryCharge,
                  shippingAddress: deliveryInfo,
                  deliveryEstimate: 'Estimated Dispatch: 24–48 Hours via BlueDart Air Express'
                };

                onClearBag();
                setConfirmedOrder(orderReceipt);
                try {
                  broadcastCatalogChange({ type: 'ORDER_PLACED', orderId: paymentOrder.orderId });
                } catch {}
                showNotification({
                  type: 'success',
                  message: `Payment verified! Order #${paymentOrder.orderNumber} confirmed.`
                });
              } else {
                setPaymentError('Payment verification could not be confirmed by the server. Please contact support@th3ee.in.');
              }
            } catch (vErr: any) {
              setPaymentError(vErr?.message || 'Payment signature verification failed.');
            } finally {
              setIsProcessingPayment(false);
            }
          },
          onDismiss: () => {
            setIsProcessingPayment(false);
            showNotification({
              type: 'info',
              message: 'Payment cancelled. Your bag items remain preserved.'
            });
          },
          onError: (err) => {
            setIsProcessingPayment(false);
            const msg = err?.message || 'Payment processing encountered an error.';
            setPaymentError(msg);
            showNotification({ type: 'error', message: msg });
          }
        }
      );
    } catch (err: any) {
      setIsProcessingPayment(false);
      const msg = err?.message || 'Failed to initialize payment gateway.';
      setPaymentError(msg);
      showNotification({ type: 'error', message: msg });
    }
  };

  // If order was just confirmed, display the dedicated ticket confirmation receipt
  if (confirmedOrder) {
    return (
      <PaymentConfirmationReceipt
        order={confirmedOrder}
        onTrackOrder={(orderNum) => navigate(`/orders/${orderNum}/track`)}
        onViewOrders={() => navigate(currentUser ? '/account' : '/shop')}
        onContinueShopping={() => navigate('/shop')}
      />
    );
  }

  // If bag is empty and not confirmed, redirect notice
  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 font-mono text-center">
        <div className="max-w-md w-full bg-white border-2 border-neutral-900 p-8 shadow-xl space-y-4">
          <h2 className="text-lg font-black uppercase text-neutral-900">Your Bag Is Empty</h2>
          <p className="text-xs text-neutral-500">Add pieces to your bag before proceeding to checkout.</p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="w-full py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-[#E51E2B] transition-colors cursor-pointer"
          >
            Explore Catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 font-mono">
      {/* Checkout Breadcrumb Header */}
      <div className="pb-6 border-b border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider">
            <span onClick={() => navigate('/bag')} className="hover:text-neutral-900 cursor-pointer">
              Bag ({totalItemsCount})
            </span>
            <span>/</span>
            <span className="text-neutral-900 font-bold">Secure Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-neutral-900 tracking-tight mt-1">
            EXPRESS CHECKOUT
          </h1>
        </div>

        {!currentUser && onOpenAuthModal && (
          <div className="text-xs text-neutral-600 bg-neutral-50 border border-neutral-300 p-2.5 sm:px-4 flex items-center gap-2">
            <span>Already an atelier patron?</span>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="font-bold text-[#E51E2B] hover:underline uppercase cursor-pointer"
            >
              Sign In to auto-fill
            </button>
          </div>
        )}
      </div>

      {paymentError && (
        <div className="mt-6 p-4 bg-red-50 border-2 border-red-500 text-xs text-red-800 space-y-1">
          <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Payment Notification</span>
          </div>
          <p className="leading-relaxed">{paymentError}</p>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Steps (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* STEP 1: CONTACT INFORMATION */}
          <section className="bg-white border-2 border-neutral-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <span className="w-6 h-6 bg-neutral-900 text-white rounded-full text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                CONTACT INFORMATION
              </h2>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                  Email Address (For Invoicing & Dispatch Alerts) *
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    if (addressErrors.email) {
                      const c = { ...addressErrors };
                      delete c.email;
                      setAddressErrors(c);
                    }
                  }}
                  placeholder="patron@th3ee.in"
                  className={`w-full px-3 py-2.5 border text-xs font-mono focus:outline-none ${
                    addressErrors.email ? 'border-red-500 bg-red-50/50' : 'border-neutral-300 focus:border-neutral-900'
                  }`}
                />
                {addressErrors.email && (
                  <p className="text-[10px] text-red-600 mt-1 font-bold">{addressErrors.email}</p>
                )}
              </div>
            </div>
          </section>

          {/* STEP 2: DELIVERY ADDRESS */}
          <section className="bg-white border-2 border-neutral-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-neutral-900 text-white rounded-full text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                  SHIPPING ADDRESS
                </h2>
              </div>
            </div>

            {/* Saved Addresses Selector (Authenticated Customer) */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2 pb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block">
                  Select From Saved Addresses:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectSavedAddress(addr.id)}
                      className={`text-left p-3 border-2 transition-all cursor-pointer ${
                        selectedAddressId === addr.id
                          ? 'border-neutral-900 bg-neutral-50 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-neutral-900 uppercase">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="text-[9px] bg-neutral-200 text-neutral-800 font-bold px-1.5 py-0.5 uppercase">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-1 truncate">
                        {addr.houseNo ? `${addr.houseNo}, ` : ''}{addr.street || ''}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectSavedAddress('new')}
                    className={`text-left p-3 border-2 border-dashed transition-all cursor-pointer flex items-center justify-center text-xs font-bold uppercase tracking-wider ${
                      selectedAddressId === 'new'
                        ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
                        : 'border-neutral-300 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    + Use Different Address
                  </button>
                </div>
              </div>
            )}

            {/* Address Input Form */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="E.g. Charith Reddy"
                    className={`w-full px-3 py-2 border text-xs focus:outline-none ${
                      addressErrors.fullName ? 'border-red-500 bg-red-50/50' : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                  {addressErrors.fullName && (
                    <p className="text-[10px] text-red-600 mt-1 font-bold">{addressErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    Mobile Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={deliveryInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="10-digit Indian Mobile (e.g. 9876543210)"
                    className={`w-full px-3 py-2 border text-xs focus:outline-none ${
                      addressErrors.phone ? 'border-red-500 bg-red-50/50' : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                  {addressErrors.phone && (
                    <p className="text-[10px] text-red-600 mt-1 font-bold">{addressErrors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                  Flat, House No., Building, Apartment & Street *
                </label>
                <input
                  type="text"
                  value={deliveryInfo.houseNo}
                  onChange={(e) => handleInputChange('houseNo', e.target.value)}
                  placeholder="E.g. Atelier Loft 4B, 3rd Floor, Brigade Gateway"
                  className={`w-full px-3 py-2 border text-xs focus:outline-none ${
                    addressErrors.houseNo ? 'border-red-500 bg-red-50/50' : 'border-neutral-300 focus:border-neutral-900'
                  }`}
                />
                {addressErrors.houseNo && (
                  <p className="text-[10px] text-red-600 mt-1 font-bold">{addressErrors.houseNo}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    Area, Colony, Sector, Locality *
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="E.g. Indiranagar 100ft Road"
                    className={`w-full px-3 py-2 border text-xs focus:outline-none ${
                      addressErrors.area ? 'border-red-500 bg-red-50/50' : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                  {addressErrors.area && (
                    <p className="text-[10px] text-red-600 mt-1 font-bold">{addressErrors.area}</p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.landmark || ''}
                    onChange={(e) => handleInputChange('landmark', e.target.value)}
                    placeholder="E.g. Near Metro Pillar 124"
                    className="w-full px-3 py-2 border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="E.g. Bengaluru"
                    className={`w-full px-3 py-2 border text-xs focus:outline-none ${
                      addressErrors.city ? 'border-red-500 bg-red-50/50' : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                  {addressErrors.city && (
                    <p className="text-[10px] text-red-600 mt-1 font-bold">{addressErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="E.g. Karnataka"
                    className={`w-full px-3 py-2 border text-xs focus:outline-none ${
                      addressErrors.state ? 'border-red-500 bg-red-50/50' : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                  {addressErrors.state && (
                    <p className="text-[10px] text-red-600 mt-1 font-bold">{addressErrors.state}</p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={deliveryInfo.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, ''))}
                    placeholder="6 Digits (e.g. 560038)"
                    className={`w-full px-3 py-2 border text-xs focus:outline-none ${
                      addressErrors.pincode ? 'border-red-500 bg-red-50/50' : 'border-neutral-300 focus:border-neutral-900'
                    }`}
                  />
                  {addressErrors.pincode && (
                    <p className="text-[10px] text-red-600 mt-1 font-bold">{addressErrors.pincode}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Review & Final Payment (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white border-2 border-neutral-900 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                ORDER REVIEW
              </h2>
              <button
                type="button"
                onClick={() => navigate('/bag')}
                className="text-xs text-neutral-500 hover:text-neutral-900 font-bold uppercase underline cursor-pointer"
              >
                Edit Bag
              </button>
            </div>

            {/* Cart Items List */}
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1 divide-y divide-neutral-100">
              {cart.map((item) => {
                const itemTotal = (item.price || 0) * (item.quantity || 1);
                const imgUrl = resolveProductImageUrl(
                  item.thumbnail || (item.images && item.images[0]) || ''
                );

                return (
                  <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="pt-3 flex gap-3 items-center">
                    <img
                      src={imgUrl}
                      alt={item.name}
                      onError={handleImageLoadError}
                      className="w-12 h-16 object-cover bg-neutral-100 border border-neutral-200 shrink-0 rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold uppercase text-neutral-900 truncate">{item.name}</h4>
                      <p className="text-[10px] text-neutral-500">
                        {item.selectedColor} • Size {item.selectedSize} • Qty {item.quantity}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-neutral-900 shrink-0">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Voucher Code Box */}
            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  COUPON / ATELIER VOUCHER
                </span>
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
                    <span className="font-bold text-emerald-800 uppercase">{appliedCoupon.code}</span>
                    <p className="text-[10px] text-emerald-600">-₹{couponDiscount.toFixed(2)} applied</p>
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
                      className="text-xs text-red-600 font-bold uppercase cursor-pointer"
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
                      className="flex-1 px-3 py-1.5 border border-neutral-300 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-[#E51E2B] transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                </div>
              )}
              {couponMessage && !appliedCoupon && (
                <p className="text-[10px] text-red-600 mt-1">{couponMessage}</p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs pt-3 border-t border-neutral-200">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Voucher Discount</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Standard Express Shipping</span>
                {hasFreeShipping ? (
                  <span className="font-bold text-emerald-700 uppercase">FREE</span>
                ) : (
                  <span className="font-bold text-neutral-900">₹{deliveryCharge}</span>
                )}
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t-2 border-neutral-900 text-neutral-900">
                <span className="text-sm font-black uppercase">FINAL TOTAL</span>
                <span className="text-xl font-black text-neutral-900">
                  ₹{finalPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={handlePayOnline}
              disabled={isProcessingPayment}
              className="w-full py-4 bg-neutral-900 hover:bg-[#E51E2B] text-white text-xs font-black uppercase tracking-widest transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>CONNECTING GATEWAY...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>PAY ₹{finalPayable.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>

            {/* Direct Support & Trust Reassurance */}
            <div className="pt-2 text-center text-[10px] text-neutral-400 space-y-1">
              <p>Direct Atelier Support: <a href="mailto:support@th3ee.in" className="underline text-neutral-600 hover:text-black">support@th3ee.in</a></p>
              <p>Transactions are encrypted. Your cart remains preserved in case of cancellation.</p>
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
        customerEmail={contactEmail || currentUser?.email}
      />
    </div>
  );
};

export default CheckoutView;

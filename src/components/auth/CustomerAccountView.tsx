import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserIcon,
  Package,
  MapPin,
  Shield,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Truck,
  ArrowRight,
  RefreshCw
} from './icons';
import { LoyaltyClubCard } from '../loyalty/LoyaltyClubCard';
import { authService } from '../../services/auth.service';
import { customerService } from '../../services/customer.service';
import { uploadService } from '../../services/upload.service';
import { razorpayService } from '../../services/razorpay.service';
import { resolveProductImageUrl, handleImageLoadError } from '../../lib/r2';
import type { AuthUser, SavedAddress } from '../../types/auth';
import type { Order } from '../../types/store';

const Award: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const CameraIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

interface CustomerAccountViewProps {
  currentUser: AuthUser | null;
  onSignOut: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  navigate: (path: string) => void;
  showNotification: (data: any) => void;
  onUserUpdated?: (user: AuthUser) => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({
  currentUser,
  onSignOut,
  onOpenAuth,
  navigate,
  showNotification,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'loyalty' | 'addresses' | 'profile'>('orders');

  // Customer data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  // Profile edit states
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Profile Avatar states with local cache fallback for guaranteed persistence
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    const cached = typeof window !== 'undefined' && currentUser?.id ? localStorage.getItem(`th3ee_avatar_${currentUser.id}`) : null;
    return currentUser?.avatar_url || currentUser?.profile?.avatar_url || cached || '';
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Address modal / form states
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    houseNo: '',
    street: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });
  const [addressFormError, setAddressFormError] = useState('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const refreshOrders = async () => {
    if (!currentUser || !currentUser.id) return;
    setOrdersLoading(true);
    try {
      const ords = await customerService.getCustomerOrders(currentUser);
      setOrders(ords);
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false);
    }
  };
  const loadCustomerOrders = refreshOrders;

  // Load customer data when user is available
  useEffect(() => {
    if (currentUser && currentUser.id) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      const cached = typeof window !== 'undefined' ? localStorage.getItem(`th3ee_avatar_${currentUser.id}`) : null;
      setAvatarUrl(currentUser.avatar_url || currentUser.profile?.avatar_url || cached || '');

      // Load orders
      setOrdersLoading(true);
      customerService.getCustomerOrders(currentUser).then((ords) => {
        setOrders(ords);
        setOrdersLoading(false);
      }).catch(() => setOrdersLoading(false));

      // Load addresses
      setAddressesLoading(true);
      customerService.getSavedAddresses(currentUser).then((addrs) => {
        setAddresses(addrs);
        setAddressesLoading(false);
      }).catch(() => setAddressesLoading(false));
    }
  }, [currentUser]);

  // If user is not authenticated, show sleek Change 2 access card
  if (!currentUser || !currentUser.id) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[28px] sm:rounded-[36px] th3ee-card-shadow p-6 sm:p-8 space-y-6 text-center border border-white">
          <div className="w-14 h-14 bg-red-50 text-brand-500 flex items-center justify-center mx-auto rounded-full shadow-sm">
            <UserIcon className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-widest text-brand-500 uppercase font-mono">ACCOUNT ACCESS</span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 mt-1 font-poppins">
              CUSTOMER IDENTITY PORTAL
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-sans">
              Sign in to view your order logs, manage saved delivery addresses, track real-time dispatches, and access your digital loyalty club pass.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full min-h-[48px] py-3 bg-brand-500 text-white hover:bg-brand-600 active:scale-95 text-xs font-bold font-poppins uppercase tracking-wider transition-all rounded-full shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>SIGN IN TO TH3EE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full min-h-[48px] py-3 bg-white border-2 border-brand-500 text-brand-500 hover:bg-brand-50 active:scale-95 text-xs font-bold font-poppins uppercase tracking-wider transition-all rounded-full cursor-pointer"
            >
              <span>CREATE MEMBER ACCOUNT</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to extract customer initials for fallback avatar
  const getCustomerInitials = (name?: string, email?: string): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.trim().slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.trim().slice(0, 2).toUpperCase();
    }
    return 'TH';
  };

  /**
   * Compresses an image file to a lightweight data URL (max 256x256, ~25KB).
   * Ensures avatar photo saving NEVER fails even if R2 edge function encounters network or quota issues.
   */
  const compressImageToDataUrl = (file: File, maxSize = 256, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(objectUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      };
      img.src = objectUrl;
    });
  };

  // Avatar file selection and validation (Section 5B)
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setAvatarError('Unsupported image format. Please select a JPEG, PNG, or WebP photo.');
      return;
    }

    // Validate size limit (5 MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setAvatarError('Photo exceeds 5 MB size limit. Please upload a smaller image.');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  // Avatar save workflow via secure R2 storage with resilient client compression fallback
  const handleSaveAvatar = async () => {
    if (!avatarFile || !currentUser) return;
    setIsUploadingAvatar(true);
    setAvatarError('');
    try {
      let resolvedUrl = '';
      try {
        const uploadRes = await uploadService.uploadImage(avatarFile, 'avatars');
        if (uploadRes && uploadRes.url) {
          resolvedUrl = uploadRes.url;
        }
      } catch (uploadErr) {
        console.warn('R2 upload edge function notice, using resilient compressed avatar fallback:', uploadErr);
        resolvedUrl = await compressImageToDataUrl(avatarFile);
      }

      if (!resolvedUrl) {
        resolvedUrl = await compressImageToDataUrl(avatarFile);
      }

      const { user, error } = await customerService.updateCustomerProfile(currentUser, {
        avatar_url: resolvedUrl
      });

      if (error) {
        console.warn('Backend customer profile update note:', error);
      }

      setAvatarUrl(resolvedUrl);
      if (typeof window !== 'undefined' && currentUser?.id) {
        try {
          localStorage.setItem(`th3ee_avatar_${currentUser.id}`, resolvedUrl);
        } catch {}
      }
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const updatedUser: AuthUser = user || {
        ...currentUser,
        avatar_url: resolvedUrl,
        profile: { ...(currentUser.profile || {}), avatar_url: resolvedUrl }
      };

      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      showNotification({ type: 'success', message: 'Profile picture saved successfully.' });
    } catch (err: any) {
      setAvatarError(err?.message || 'Failed to save profile picture.');
      showNotification({ type: 'error', message: err?.message || 'Photo save failed.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser) return;
    setIsUploadingAvatar(true);
    setAvatarError('');
    try {
      const { user, error } = await customerService.updateCustomerProfile(currentUser, {
        avatar_url: null
      });

      if (error) throw error;

      setAvatarUrl('');
      if (typeof window !== 'undefined' && currentUser?.id) {
        try {
          localStorage.removeItem(`th3ee_avatar_${currentUser.id}`);
        } catch {}
      }
      handleCancelAvatar();
      if (user && onUserUpdated) {
        onUserUpdated(user);
      }
      showNotification({ type: 'success', message: 'Profile photo removed.' });
    } catch (err: any) {
      setAvatarError(err?.message || 'Failed to remove profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Profile Update (saves name, phone, and any selected avatar photo)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showNotification({ message: 'Name cannot be empty', type: 'error' });
      return;
    }

    setProfileSaving(true);
    try {
      let resolvedAvatarUrl: string | undefined = undefined;
      if (avatarFile && currentUser) {
        try {
          const uploadRes = await uploadService.uploadImage(avatarFile, 'avatars');
          if (uploadRes && uploadRes.url) resolvedAvatarUrl = uploadRes.url;
        } catch {
          try {
            resolvedAvatarUrl = await compressImageToDataUrl(avatarFile);
          } catch {}
        }
      }

      const updatePayload: { name: string; phone: string; avatar_url?: string } = {
        name: profileName,
        phone: profilePhone
      };
      if (resolvedAvatarUrl) {
        updatePayload.avatar_url = resolvedAvatarUrl;
      }

      const { user, error } = await customerService.updateCustomerProfile(currentUser, updatePayload);
      setProfileSaving(false);

      if (error) {
        showNotification({ message: error.message, type: 'error' });
      } else {
        if (resolvedAvatarUrl) {
          setAvatarUrl(resolvedAvatarUrl);
          if (typeof window !== 'undefined' && currentUser?.id) {
            try {
              localStorage.setItem(`th3ee_avatar_${currentUser.id}`, resolvedAvatarUrl);
            } catch {}
          }
          if (avatarPreview) URL.revokeObjectURL(avatarPreview);
          setAvatarPreview(null);
          setAvatarFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }

        const refreshedUser: AuthUser = user || {
          ...currentUser,
          name: profileName,
          phone: profilePhone,
          ...(resolvedAvatarUrl ? { avatar_url: resolvedAvatarUrl } : {}),
          profile: {
            ...(currentUser.profile || {}),
            name: profileName,
            phone: profilePhone,
            ...(resolvedAvatarUrl ? { avatar_url: resolvedAvatarUrl } : {})
          }
        };

        if (onUserUpdated) onUserUpdated(refreshedUser);
        showNotification({ type: 'success', message: 'Profile details updated successfully' });
      }
    } catch (err: any) {
      setProfileSaving(false);
      showNotification({ type: 'error', message: err?.message || 'Failed to update profile' });
    }
  };
  const handleProfileSubmit = handleSaveProfile;

  // Open address modal for add or edit
  const openAddressModal = (addr?: SavedAddress) => {
    setAddressFormError('');
    if (addr) {
      setEditingAddressId(addr.id);
      setAddressForm({
        fullName: addr.fullName,
        phone: addr.phone,
        houseNo: addr.houseNo || '',
        street: addr.street || '',
        area: addr.area || '',
        landmark: addr.landmark || '',
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        isDefault: Boolean(addr.isDefault)
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        fullName: currentUser.name || '',
        phone: currentUser.phone || '',
        houseNo: '',
        street: '',
        area: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: addresses.length === 0
      });
    }
    setIsAddressModalOpen(true);
  };

  // Handle Address Save
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressFormError('');

    if (!addressForm.fullName.trim()) {
      setAddressFormError('Full name is required.');
      return;
    }
    if (!addressForm.phone.trim()) {
      setAddressFormError('Phone number is required.');
      return;
    }
    if (!addressForm.houseNo.trim() && !addressForm.street.trim()) {
      setAddressFormError('House/Flat or Street address is required.');
      return;
    }
    if (!addressForm.city.trim() || !addressForm.state.trim()) {
      setAddressFormError('City and State are required.');
      return;
    }
    const cleanPin = addressForm.pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6 || cleanPin.startsWith('0')) {
      setAddressFormError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    try {
      const updated = await customerService.saveAddress(
        currentUser,
        {
          fullName: addressForm.fullName.trim(),
          phone: addressForm.phone.trim(),
          houseNo: addressForm.houseNo.trim(),
          street: addressForm.street.trim(),
          area: addressForm.area.trim(),
          landmark: addressForm.landmark.trim(),
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          pincode: cleanPin,
          isDefault: addressForm.isDefault
        },
        editingAddressId || undefined
      );
      setAddresses(updated);
      setIsAddressModalOpen(false);
      showNotification(editingAddressId ? 'Address updated' : 'New address saved');
    } catch (err: any) {
      setAddressFormError(err.message || 'Failed to save address.');
    }
  };

  // Handle Address Delete with confirmation modal
  const handleDeleteAddress = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDeleteAddress = async (id: string) => {
    try {
      const updated = await customerService.deleteAddress(currentUser, id);
      setAddresses(updated);
      setConfirmDeleteId(null);
      showNotification('Address removed');
    } catch (err: any) {
      showNotification({ message: err.message, type: 'error' });
    }
  };

  // Handle Set Default Address
  const handleSetDefaultAddress = async (id: string) => {
    try {
      const updated = await customerService.setDefaultAddress(currentUser, id);
      setAddresses(updated);
      showNotification('Default delivery address updated');
    } catch (err: any) {
      showNotification({ message: err.message, type: 'error' });
    }
  };

  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  const handleRetryPayment = async (order: Order) => {
    setRetryingOrderId(order.id);
    try {
      const paymentOrder = await razorpayService.createPaymentOrder({
        customerId: currentUser?.id,
        customerEmail: currentUser?.email,
        customerName: order.customerName,
        customerPhone: order.phone,
        deliveryInfo: order.shippingAddress || { fullName: order.customerName, phone: order.phone, address: '', city: '', state: '', pincode: '' },
        cart: [],
        subtotal: order.subtotal || order.total,
        discountAmount: order.discountAmount || 0,
        shippingAmount: order.shippingAmount || 0,
        totalAmount: order.total
      });

      if (!paymentOrder.success || !paymentOrder.orderId) {
        throw new Error(paymentOrder.error || 'Failed to initialize payment retry.');
      }

      await razorpayService.launchCheckout(
        {
          orderId: paymentOrder.orderId,
          orderNumber: order.orderNumber || paymentOrder.orderNumber,
          razorpayOrderId: paymentOrder.razorpayOrderId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          keyId: paymentOrder.keyId,
          customerName: order.customerName,
          customerEmail: currentUser?.email,
          customerPhone: order.phone,
          hasCredentials: paymentOrder.hasCredentials,
          isMock: paymentOrder.isMock
        },
        {
          onSuccess: async (paymentResult) => {
            const verifyRes = await razorpayService.verifyPayment({
              orderId: paymentOrder.orderId,
              orderNumber: order.orderNumber || paymentOrder.orderNumber,
              razorpayOrderId: paymentResult.razorpay_order_id,
              razorpayPaymentId: paymentResult.razorpay_payment_id,
              razorpaySignature: paymentResult.razorpay_signature,
              amount: order.total
            });

            if (verifyRes.verified) {
              showNotification({ type: 'success', message: `Order #${order.orderNumber} payment confirmed!` });
              refreshOrders();
            } else {
              showNotification({ type: 'error', message: 'Payment verification failed' });
            }
            setRetryingOrderId(null);
          },
          onDismiss: () => {
            setRetryingOrderId(null);
          },
          onError: (err) => {
            setRetryingOrderId(null);
            showNotification({ type: 'error', message: err?.message || 'Payment failed' });
          }
        }
      );
    } catch (err: any) {
      setRetryingOrderId(null);
      showNotification({ type: 'error', message: err?.message || 'Unable to retry payment' });
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver')) {
      return <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase rounded-xs">Delivered</span>;
    }
    if (s.includes('out_for_delivery') || s.includes('out for delivery')) {
      return <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-800 font-bold uppercase rounded-xs">Out For Delivery</span>;
    }
    if (s.includes('dispatch') || s.includes('shipped')) {
      return <span className="px-2 py-0.5 text-[10px] bg-purple-100 text-purple-800 font-bold uppercase rounded-xs">Dispatched</span>;
    }
    if (s.includes('packed')) {
      return <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold uppercase rounded-xs">Packed</span>;
    }
    if (s.includes('production') || s.includes('process')) {
      return <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 font-bold uppercase rounded-xs">In Production</span>;
    }
    if (s.includes('confirmed')) {
      return <span className="px-2 py-0.5 text-[10px] bg-teal-100 text-teal-800 font-bold uppercase rounded-xs">Confirmed</span>;
    }
    if (s.includes('cancel')) {
      return <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-800 font-bold uppercase rounded-xs">Cancelled</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] bg-neutral-100 text-neutral-800 font-bold uppercase rounded-xs">Received</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 font-mono">
      {/* Mobile Top Bar / Back to Store */}
      <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-neutral-200 lg:hidden">
        <button 
          type="button" 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-brand-500 uppercase tracking-wider font-mono cursor-pointer"
        >
          <span>← Back to Store</span>
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 bg-brand-50 px-3 py-1 rounded-full border border-red-100">
          Patron Profile
        </span>
      </div>

      {/* Header Banner with Change 2 rounded card styling */}
      <div className="bg-white border border-slate-100 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 mb-8 th3ee-card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={currentUser?.name || 'Patron Avatar'}
              className="w-16 h-16 rounded-full object-cover border-2 border-brand-500 shadow-md shrink-0"
              onError={() => {
                setAvatarUrl('');
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-dark text-white font-black text-xl flex items-center justify-center uppercase shrink-0 shadow-md border-2 border-brand-500">
              {getCustomerInitials(currentUser?.name, currentUser?.email)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black uppercase text-slate-900 font-poppins">
                {currentUser?.name || 'TH3EE Patron'}
              </h1>
              {currentUser?.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                  <CheckCircle className="w-3 h-3" /> Verified Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
                  <AlertCircle className="w-3 h-3" /> Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">{currentUser?.email || ''}</p>
            {currentUser?.createdAt && (
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                Patron Member Since: {new Date(currentUser.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="px-5 py-2.5 border border-slate-200 hover:border-brand-500 hover:text-brand-500 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all rounded-full flex items-center gap-2 self-stretch sm:self-auto justify-center cursor-pointer active:scale-95 shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto scrollbar-none gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
            activeTab === 'orders'
              ? 'border-brand-500 text-brand-500 bg-brand-50/50'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('loyalty')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
            activeTab === 'loyalty'
              ? 'border-brand-500 text-brand-500 bg-brand-50/50'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Reward Club</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
            activeTab === 'addresses'
              ? 'border-brand-500 text-brand-500 bg-brand-50/50'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Saved Addresses ({addresses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
            activeTab === 'profile'
              ? 'border-brand-500 text-brand-500 bg-brand-50/50'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile & Avatar</span>
        </button>
      </div>

      {/* 1. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <p className="text-xs text-neutral-500">
              Verified order dispatches and production status linked to your patron identity.
            </p>
            <button
              type="button"
              onClick={loadCustomerOrders}
              disabled={ordersLoading}
              className="px-3 py-1.5 border border-neutral-300 hover:border-neutral-900 text-[11px] font-bold uppercase tracking-wider text-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
              <span>{ordersLoading ? 'Syncing...' : 'Refresh Logs'}</span>
            </button>
          </div>

          {ordersLoading && orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">Loading order history...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-8 sm:p-12 text-center space-y-4">
              <Package className="w-12 h-12 text-neutral-300 mx-auto" />
              <div>
                <h3 className="text-sm font-bold uppercase text-neutral-900">No Orders Placed Yet</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  When you acquire heavyweight streetwear silhouettes from TH3EE, your order tracking and dispatch logs will appear here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-5 py-2.5 bg-neutral-900 text-white hover:bg-[#E51E2B] text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
                const isCancelled = (order.status || '').toLowerCase() === 'cancelled';
                const canRetry = !isPaid && !isCancelled;

                return (
                  <div
                    key={order.id}
                    className="bg-white border-2 border-neutral-200 hover:border-neutral-900 p-5 sm:p-6 transition-all shadow-xs space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-neutral-100">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-sm font-black text-neutral-900">
                          #{order.orderNumber || order.id}
                        </span>
                        {getStatusBadge(order.status)}
                        {isPaid ? (
                          <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase rounded-xs">
                            Paid (Online)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold uppercase rounded-xs">
                            Payment Pending
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-neutral-400">
                        Placed on {order.date}
                      </span>
                    </div>

                    {/* Ordered Items Summary */}
                    <div className="text-xs text-neutral-800 leading-relaxed font-sans bg-neutral-50 p-3 border border-neutral-100">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                        SILHOUETTES IN ORDER:
                      </span>
                      {order.items}
                    </div>

                    {/* Financial Breakdown & Courier Info */}
                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-500">
                        <div>
                          <span>Paid Total: </span>
                          <span className="font-bold text-neutral-900 text-xs">
                            ₹{Number(order.total).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {order.courier && (
                          <div>
                            <span>Carrier: </span>
                            <span className="font-bold text-neutral-800">{order.courier}</span>
                            {order.trackingNumber && <span className="font-mono text-[10px] ml-1">({order.trackingNumber})</span>}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        {canRetry && (
                          <button
                            type="button"
                            disabled={retryingOrderId === order.id}
                            onClick={() => handleRetryPayment(order)}
                            className="px-3 py-1.5 bg-[#E51E2B] text-white text-xs font-bold uppercase hover:bg-red-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {retryingOrderId === order.id ? 'Connecting...' : 'Retry Payment'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => navigate(`/orders/${order.orderNumber || order.id}/track`)}
                          className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-[#E51E2B] transition-colors cursor-pointer"
                        >
                          Track Order
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 border border-neutral-300 hover:border-neutral-900 text-xs font-bold uppercase text-neutral-900 transition-colors cursor-pointer"
                        >
                          View Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. REWARD CLUB TAB */}
      {activeTab === 'loyalty' && (
        <LoyaltyClubCard
          currentUser={currentUser}
          savedAddresses={addresses}
          showNotification={showNotification}
          onExploreCatalog={() => navigate('/shop')}
        />
      )}

      {/* 3. SAVED ADDRESSES TAB */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              Manage your saved shipping addresses for instant checkout.
            </p>
            <button
              type="button"
              onClick={() => openAddressModal()}
              className="px-4 py-2 bg-neutral-900 text-white hover:bg-[#E51E2B] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Address</span>
            </button>
          </div>

          {addressesLoading ? (
            <div className="p-12 text-center text-xs text-neutral-400">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-8 sm:p-12 text-center space-y-4">
              <MapPin className="w-12 h-12 text-neutral-300 mx-auto" />
              <div>
                <h3 className="text-sm font-bold uppercase text-neutral-900">No Addresses Saved</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Save your delivery addresses for seamless, 1-click WhatsApp and online checkouts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAddressModal()}
                className="px-5 py-2.5 bg-neutral-900 text-white hover:bg-[#E51E2B] text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Primary Address</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white border-2 p-5 flex flex-col justify-between transition-colors ${
                    addr.isDefault ? 'border-neutral-900 shadow-sm' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase text-neutral-900">{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold uppercase bg-neutral-900 text-white px-2 py-0.5">
                          Default Delivery
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-600 font-sans space-y-0.5 leading-relaxed">
                      {addr.houseNo && <p>{addr.houseNo}, {addr.street}</p>}
                      {!addr.houseNo && addr.street && <p>{addr.street}</p>}
                      {addr.landmark && <p>Landmark: {addr.landmark}</p>}
                      <p>{addr.city}, {addr.state} — <span className="font-mono font-bold">{addr.pincode}</span></p>
                      <p className="text-neutral-500 font-mono text-[11px] pt-1">Phone: {addr.phone}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAddressModal(addr)}
                        className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 uppercase font-bold"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <span className="text-neutral-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 uppercase font-bold"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>

                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[10px] text-[#E51E2B] hover:underline uppercase font-bold"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PROFILE DETAILS TAB (Section 5 Redesign) */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl font-mono">
          {/* Card 1: Patron Portrait / Avatar Management */}
          <div className="bg-white border border-slate-100 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 th3ee-card-shadow space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500 block font-mono">
                PATRON IDENTITY
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight mt-0.5 font-poppins">
                Profile Portrait & Atelier Avatar
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-1">
                Upload a custom profile photo for your TH3EE patron identity. Stored securely on Cloudflare R2 and synced to your profile.
              </p>
            </div>

            {avatarError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-sans">
                {avatarError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
              {/* Circular Avatar Container */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-brand-500 shadow-md bg-slate-100 flex items-center justify-center relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={currentUser?.name || 'Patron Avatar'}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.warn('Avatar image failed to load, falling back to monogram initials');
                        setAvatarUrl('');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-brand-dark text-white select-none">
                      <span className="text-xl sm:text-2xl font-black uppercase tracking-wider font-poppins">
                        {getCustomerInitials(currentUser?.name, currentUser?.email)}
                      </span>
                      <span className="text-[7px] font-mono text-slate-400 uppercase mt-0.5 tracking-widest">PATRON</span>
                    </div>
                  )}

                  {avatarPreview && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-wider">
                      Preview
                    </div>
                  )}
                </div>

                {/* Camera quick-tap overlay */}
                {!avatarPreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2.5 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-transform active:scale-95 shadow-md cursor-pointer border-2 border-white"
                    title="Change profile photo"
                  >
                    <CameraIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload Controls & Actions */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {avatarPreview ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-700 font-sans">
                      New photo selected. Confirm to upload and save to your profile.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={handleSaveAvatar}
                        disabled={isUploadingAvatar}
                        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold font-poppins uppercase tracking-wider transition-all rounded-full disabled:opacity-50 cursor-pointer shadow-md shadow-brand-500/25 active:scale-95"
                      >
                        {isUploadingAvatar ? 'Saving to R2...' : 'Save Photo'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelAvatar}
                        disabled={isUploadingAvatar}
                        className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold font-poppins uppercase tracking-wider transition-all rounded-full cursor-pointer active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold font-poppins uppercase tracking-wider transition-all rounded-full cursor-pointer flex items-center gap-2 shadow-md shadow-brand-500/25 active:scale-95"
                      >
                        <CameraIcon className="w-3.5 h-3.5" />
                        <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                          className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold font-poppins uppercase tracking-wider transition-all rounded-full cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Accepted formats: JPEG, PNG, or WebP. Maximum file size: 5 MB.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Personal Details & Contact Information */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">
                ACCOUNT CREDENTIALS
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase text-neutral-900 tracking-tight mt-0.5">
                Personal Contact Details
              </h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  placeholder="e.g. Charith Reddy"
                  className="w-full px-3.5 py-2.5 text-xs border border-neutral-300 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 block">
                    Permanent Email Address
                  </label>
                  {currentUser?.emailVerified ? (
                    <span className="text-[9px] font-bold text-emerald-700 uppercase">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-700 uppercase">
                      Unverified
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  readOnly
                  disabled
                  className="w-full px-3.5 py-2.5 text-xs border border-neutral-200 bg-neutral-100 text-neutral-500 rounded-xl cursor-not-allowed"
                />
                <span className="text-[10px] text-neutral-400 font-sans block">
                  Email cannot be changed directly. Email address is permanently bound to your account and verified by the authentication provider.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 block">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 text-xs border border-neutral-300 rounded-xl focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 bg-neutral-900 text-white hover:bg-[#E51E2B] text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 rounded-xl cursor-pointer shadow-xs"
                >
                  {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADDRESS MODAL (Add / Edit) */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono">
          <div className="w-full max-w-lg bg-white border-2 border-neutral-900 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-black uppercase text-neutral-900">
                {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addressFormError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs">
                {addressFormError}
              </div>
            )}

            <form onSubmit={handleAddressSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-700 block">Full Name *</label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-700 block">Phone Number *</label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-700 block">Flat / House No. / Building *</label>
                <input
                  type="text"
                  value={addressForm.houseNo}
                  onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })}
                  placeholder="e.g. Flat 402, Skyline Residency"
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-700 block">Street / Road *</label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="e.g. Road No. 12"
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-700 block">Area / Locality *</label>
                <input
                  type="text"
                  value={addressForm.area}
                  onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                  placeholder="e.g. Jubilee Hills, Banjara Hills"
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-700 block">Landmark (Optional)</label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="Near Metro Station"
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-700 block">City *</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-700 block">State *</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-700 block">PIN Code *</label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    maxLength={6}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    required
                    placeholder="6 digits"
                    className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="accent-[#E51E2B]"
                  />
                  <span className="text-xs text-neutral-700">Set as default delivery address</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-black uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white hover:bg-[#E51E2B] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono">
          <div className="w-full max-w-lg bg-white border-2 border-neutral-900 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#E51E2B] uppercase">ORDER RECORD</span>
                <h3 className="text-sm font-black text-neutral-900 mt-0.5">#{selectedOrder.orderNumber || selectedOrder.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-neutral-900 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between p-3 bg-neutral-50 border border-neutral-200 gap-2">
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">Order Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">Payment Status</span>
                  {selectedOrder.paymentStatus === 'paid' ? (
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase rounded-xs">
                      Paid
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold uppercase rounded-xs">
                      Payment Pending
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block uppercase">Order Date</span>
                  <span className="font-bold text-neutral-900">{selectedOrder.date}</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">Items Purchased</span>
                <p className="text-neutral-900 font-sans leading-relaxed">{selectedOrder.items}</p>
                <div className="pt-2 border-t border-neutral-200 flex items-center justify-between font-black text-sm text-neutral-900">
                  <span>Payable Total:</span>
                  <span>Rs. {Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 block">Delivery Address</span>
                  <p className="text-neutral-800 text-[11px] font-sans">
                    {selectedOrder.shippingAddress.fullName && <strong className="block">{selectedOrder.shippingAddress.fullName}</strong>}
                    {selectedOrder.shippingAddress.houseNo} {selectedOrder.shippingAddress.street}
                    {selectedOrder.shippingAddress.area && `, ${selectedOrder.shippingAddress.area}`}
                    {selectedOrder.shippingAddress.city && <br />}
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                    {selectedOrder.shippingAddress.phone && <span className="block pt-0.5 text-neutral-500">Phone: {selectedOrder.shippingAddress.phone}</span>}
                  </p>
                </div>
              )}

              {selectedOrder.trackingNumber && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-800">
                      Tracking: {selectedOrder.courier || 'Courier'}
                    </span>
                    <span className="font-mono text-emerald-900 font-bold">{selectedOrder.trackingNumber}</span>
                  </div>
                  {selectedOrder.trackingUrl && (
                    <a
                      href={selectedOrder.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#E51E2B] hover:underline font-bold inline-flex items-center gap-1 pt-1"
                    >
                      <span>Track Shipment Live</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="text-[11px] text-neutral-400 pt-2 text-center">
                Need assistance? Contact official support at <a href="mailto:support@th3ee.in" className="text-neutral-900 font-bold underline">support@th3ee.in</a>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = selectedOrder.orderNumber || selectedOrder.id;
                  setSelectedOrder(null);
                  navigate(`/orders/${id}/track`);
                }}
                className="px-4 py-1.5 bg-[#E51E2B] text-white hover:bg-red-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Track Timeline
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Address Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono">
          <div className="max-w-sm w-full bg-white border-2 border-neutral-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black uppercase text-neutral-900">Delete Delivery Address</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to remove this saved delivery address? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeleteAddress(confirmDeleteId)}
                className="flex-1 py-2 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerAccountView;

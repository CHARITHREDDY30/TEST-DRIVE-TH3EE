import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { loyaltyService, type CustomerLoyaltySummary, type LoyaltyStamp, type LoyaltyRewardClaim } from '../../services/loyalty.service';
import { productsService } from '../../services/products.service';
import { PassQRCode, downloadPassBadge } from '../common/PassQRCodes';
import { TH3EEBoardingPass } from './TH3EEBoardingPass';
import type { AuthUser, SavedAddress } from '../../types/auth';
import type { Product } from '../../types/store';

// Inline Icons to guarantee zero dependency issues
const DownloadIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const AwardIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const GiftIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Streetwear T-Shirt Silhouette Vector Illustration
 * Renders an authentic crewneck oversized t-shirt silhouette for TH3EE loyalty stamps.
 * No boxy outer border; free-standing design on luxury cream background.
 */
const TShirtSilhouette: React.FC<{
  type: 'collected' | 'pending' | 'expired' | 'reward-unlocked' | 'reward-pending';
  slotCode?: string;
}> = ({ type, slotCode }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      className="w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-200 group-hover:scale-105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Metallic Gold Gradient for Unlocked Reward Tee */}
        <linearGradient id="rewardGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        {/* TH3EE Signature Red Gradient for Stamped Tee */}
        <linearGradient id="stampRedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E51E2B" />
          <stop offset="100%" stopColor="#C91420" />
        </linearGradient>
        {/* Soft shadow for stamped t-shirt */}
        <filter id="teeShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.16" />
        </filter>
        <filter id="goldTeeShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#D97706" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* COLLECTED STAMP T-SHIRT */}
      {type === 'collected' && (
        <g filter="url(#teeShadow)">
          <path
            d="M 23 10 C 27 15 37 15 41 10 L 53 16 L 61 27 L 53 32 L 47 26 L 47 55 C 47 56.5 45.5 58 44 58 L 20 58 C 18.5 58 17 56.5 17 55 L 17 26 L 11 32 L 3 27 L 11 16 Z"
            fill="url(#stampRedGradient)"
            stroke="#B91C1C"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Collar seam */}
          <path d="M 23 10 C 27 15 37 15 41 10" stroke="rgba(255,255,255,0.45)" strokeWidth="1.25" fill="none" />
          {/* Sleeve seams */}
          <path d="M 11 16 L 17 26" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          <path d="M 53 16 L 47 26" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

          {/* Chest Artwork: Iconic TH3EE "3" */}
          <text
            x="32"
            y="39"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="16"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.5px"
          >
            3
          </text>
          {/* "VERIFIED" Banner */}
          <text
            x="32"
            y="47"
            textAnchor="middle"
            fill="rgba(255,255,255,0.9)"
            fontSize="5"
            fontWeight="800"
            fontFamily="monospace"
            letterSpacing="0.8px"
          >
            VERIFIED
          </text>
        </g>
      )}

      {/* UNCOLLECTED / PENDING T-SHIRT */}
      {type === 'pending' && (
        <g>
          <path
            d="M 23 10 C 27 15 37 15 41 10 L 53 16 L 61 27 L 53 32 L 47 26 L 47 55 C 47 56.5 45.5 58 44 58 L 20 58 C 18.5 58 17 56.5 17 55 L 17 26 L 11 32 L 3 27 L 11 16 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="1.75"
            strokeDasharray="3.5 2.5"
            strokeLinejoin="round"
          />
          <path d="M 23 10 C 27 15 37 15 41 10" stroke="#CBD5E1" strokeWidth="1.25" fill="none" />
          <path d="M 11 16 L 17 26" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 53 16 L 47 26" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
          <text
            x="32"
            y="40"
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="12"
            fontWeight="700"
            fontFamily="monospace"
          >
            {slotCode}
          </text>
        </g>
      )}

      {/* EXPIRED T-SHIRT */}
      {type === 'expired' && (
        <g opacity="0.6">
          <path
            d="M 23 10 C 27 15 37 15 41 10 L 53 16 L 61 27 L 53 32 L 47 26 L 47 55 C 47 56.5 45.5 58 44 58 L 20 58 C 18.5 58 17 56.5 17 55 L 17 26 L 11 32 L 3 27 L 11 16 Z"
            fill="#F1F5F9"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M 23 10 C 27 15 37 15 41 10" stroke="#94A3B8" strokeWidth="1" fill="none" />
          <line x1="24" y1="45" x2="40" y2="28" stroke="#94A3B8" strokeWidth="1.5" />
          <text
            x="32"
            y="43"
            textAnchor="middle"
            fill="#64748B"
            fontSize="7"
            fontWeight="700"
            fontFamily="monospace"
          >
            EXP
          </text>
        </g>
      )}

      {/* REWARD UNLOCKED T-SHIRT */}
      {type === 'reward-unlocked' && (
        <g filter="url(#goldTeeShadow)">
          <path
            d="M 23 10 C 27 15 37 15 41 10 L 53 16 L 61 27 L 53 32 L 47 26 L 47 55 C 47 56.5 45.5 58 44 58 L 20 58 C 18.5 58 17 56.5 17 55 L 17 26 L 11 32 L 3 27 L 11 16 Z"
            fill="url(#rewardGoldGradient)"
            stroke="#B45309"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path d="M 23 10 C 27 15 37 15 41 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
          {/* Star Icon on Chest */}
          <g transform="translate(24, 25)">
            <path
              d="M 8 1 L 9.8 5.2 L 14.4 5.6 L 10.9 8.7 L 12 13.2 L 8 10.8 L 4 13.2 L 5.1 8.7 L 1.6 5.6 L 6.2 5.2 Z"
              fill="#FFFFFF"
              stroke="#92400E"
              strokeWidth="0.75"
            />
          </g>
          <text
            x="32"
            y="48"
            textAnchor="middle"
            fill="#78350F"
            fontSize="5"
            fontWeight="900"
            fontFamily="monospace"
            letterSpacing="0.5px"
          >
            FREE TEE
          </text>
        </g>
      )}

      {/* REWARD PENDING T-SHIRT */}
      {type === 'reward-pending' && (
        <g>
          <path
            d="M 23 10 C 27 15 37 15 41 10 L 53 16 L 61 27 L 53 32 L 47 26 L 47 55 C 47 56.5 45.5 58 44 58 L 20 58 C 18.5 58 17 56.5 17 55 L 17 26 L 11 32 L 3 27 L 11 16 Z"
            fill="#FFFFFF"
            stroke="#F59E0B"
            strokeWidth="1.75"
            strokeDasharray="3.5 2.5"
            strokeLinejoin="round"
          />
          <path d="M 23 10 C 27 15 37 15 41 10" stroke="#F59E0B" strokeWidth="1.25" fill="none" />
          {/* Mini Lock Icon */}
          <g transform="translate(26, 27)">
            <rect x="1" y="5" width="10" height="7" rx="1.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
            <path d="M 3 5 V 3.5 A 3 3 0 0 1 9 3.5 V 5" fill="none" stroke="#D97706" strokeWidth="1.2" />
          </g>
          <text
            x="32"
            y="48"
            textAnchor="middle"
            fill="#B45309"
            fontSize="5"
            fontWeight="800"
            fontFamily="monospace"
            letterSpacing="0.5px"
          >
            FREE TEE
          </text>
        </g>
      )}
    </svg>
  );
};

interface LoyaltyClubCardProps {
  currentUser?: AuthUser | null;
  savedAddresses?: SavedAddress[];
  showNotification: (data: any) => void;
  onExploreCatalog?: () => void;
}

export const LoyaltyClubCard: React.FC<LoyaltyClubCardProps> = ({
  currentUser,
  savedAddresses = [],
  showNotification,
  onExploreCatalog
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Loyalty summary state
  const [summary, setSummary] = useState<CustomerLoyaltySummary>({
    configured: true,
    authenticated: true,
    activeStampsCount: 0,
    stampsNeededForReward: 7,
    canClaimReward: false,
    unlockedRewardsCount: 0,
    activeStamps: [],
    newStampCelebration: null,
    rewardClaims: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeLedgerTab, setActiveLedgerTab] = useState<'stamps' | 'rewards' | 'rules'>('stamps');

  // Stamp drop celebration state
  const [celebratingStampId, setCelebratingStampId] = useState<string | null>(null);
  const [celebrationBanner, setCelebrationBanner] = useState<{
    orderNumber: string;
    stampId: string;
  } | null>(null);

  // Claim modal state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimedSuccessCode, setClaimedSuccessCode] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customAddress, setCustomAddress] = useState({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [claimError, setClaimError] = useState<string>('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Fetch Authoritative Summary from InsForge
  const loadLoyaltySummary = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await loyaltyService.getCustomerLoyaltySummary(currentUser.id, currentUser.email || '');
      setSummary(data);

      // Check if there is an unacknowledged stamp celebration
      if (data.newStampCelebration) {
        setCelebratingStampId(data.newStampCelebration.stampId);
        setCelebrationBanner({
          orderNumber: data.newStampCelebration.orderNumber,
          stampId: data.newStampCelebration.stampId
        });

        // Trigger backend acknowledgement so it only celebrates once
        loyaltyService.acknowledgeStampCelebration(data.newStampCelebration.stampId);
      }
    } catch (err) {
      console.warn('Failed to load customer loyalty summary:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadLoyaltySummary();
  }, [loadLoyaltySummary]);

  // Load products for reward selection
  useEffect(() => {
    productsService.getProducts().then((prods) => {
      const tees = prods.filter(
        (p) =>
          (p.category || '').toLowerCase().includes('t-shirt') ||
          (p.category || '').toLowerCase().includes('shirt') ||
          (p.category || '').toLowerCase().includes('tee')
      );
      const selection = tees.length > 0 ? tees : prods;
      setAvailableProducts(selection);
      if (selection.length > 0 && !selectedProductId) {
        setSelectedProductId(selection[0].id);
      }
    }).catch(() => {});
  }, []);

  // Pre-select default address if available
  useEffect(() => {
    if (savedAddresses.length > 0) {
      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(def.id);
    }
  }, [savedAddresses]);

  // Handle Reward Claim Submit
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError('');

    let shippingPayload: any = null;
    if (selectedAddressId) {
      const found = savedAddresses.find((a) => a.id === selectedAddressId);
      if (found) {
        shippingPayload = {
          fullName: found.fullName,
          phone: found.phone,
          houseNo: found.houseNo,
          street: found.street,
          area: found.area,
          city: found.city,
          state: found.state,
          pincode: found.pincode
        };
      }
    }

    if (!shippingPayload) {
      if (
        !customAddress.fullName.trim() ||
        !customAddress.phone.trim() ||
        !customAddress.street.trim() ||
        !customAddress.city.trim() ||
        !customAddress.pincode.trim()
      ) {
        setClaimError('Please provide a complete delivery address for your reward drop.');
        return;
      }
      shippingPayload = customAddress;
    }

    const chosenProd = availableProducts.find((p) => p.id === selectedProductId);

    if (!currentUser?.id) {
      setClaimError('Authentication required to claim reward.');
      return;
    }

    setClaiming(true);
    const result = await loyaltyService.claimLoyaltyReward({
      customerId: currentUser.id,
      customerEmail: currentUser.email || '',
      productId: chosenProd?.id,
      size: selectedSize,
      color: chosenProd?.colors?.[0]?.name || 'Standard Cult Colorway',
      shippingAddress: shippingPayload
    });
    setClaiming(false);

    if (result.success && result.claimCode) {
      setClaimedSuccessCode(result.claimCode);
      showNotification({
        type: 'success',
        message: `Reward unlocked! Claim Code: ${result.claimCode}`
      });
      loadLoyaltySummary();
    } else {
      setClaimError(result.error || 'Failed to claim reward. Please verify you have 7 active stamps.');
    }
  };

  // 7 slots arrangement
  const TOTAL_STAMPS = 7;
  const activeCount = summary.activeStampsCount || 0;
  const isRewardUnlocked = activeCount >= TOTAL_STAMPS || summary.canClaimReward;
  const stampsRemaining = Math.max(0, TOTAL_STAMPS - activeCount);
  const memberCode = currentUser?.id ? currentUser.id.slice(0, 6).toUpperCase() : 'PATRON';

  // Explicit pass verification & issuance date
  const passDate = useMemo(() => {
    if (summary.activeStamps && summary.activeStamps.length > 0) {
      const latestStamp = summary.activeStamps[summary.activeStamps.length - 1];
      if (latestStamp?.earnedAt) {
        const d = new Date(latestStamp.earnedAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        }
      }
    }
    const now = new Date();
    return now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  }, [summary.activeStamps]);

  // Realtime pass verification URL encoded in QR Code
  const passVerificationUrl = useMemo(() => {
    if (typeof window === 'undefined') return `TH3EE-PASS:${currentUser?.id || 'ANON'}`;
    const nameParam = encodeURIComponent(currentUser?.name || 'TH3EE Patron');
    const emailParam = encodeURIComponent(currentUser?.email || '');
    const dateParam = encodeURIComponent(passDate);

    // Auto-detect base path (e.g. /TEST-DRIVE-TH3EE or "")
    const pathname = window.location.pathname || '/';
    const match = pathname.match(/^(\/[^\/]+)/);
    const repoBasePath = match && match[1].toLowerCase() === '/test-drive-th3ee' ? match[1] : '';
    const siteBase = `${window.location.origin}${repoBasePath}`;

    // Hash route #/verify-pass guarantees 100% universal loading on any static host or GitHub Pages without 404
    return `${siteBase}/#/verify-pass?id=${memberCode}&name=${nameParam}&email=${emailParam}&stamps=${activeCount}&remaining=${stampsRemaining}&date=${dateParam}`;
  }, [currentUser, memberCode, activeCount, stampsRemaining, passDate]);

  // High-Resolution Pass QR Download Handler
  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownloadPass = async () => {
    try {
      setIsDownloading(true);
      await downloadPassBadge({
        memberName: currentUser?.name || 'TH3EE Patron',
        memberEmail: currentUser?.email || '',
        memberCode,
        stampsCount: activeCount,
        totalStamps: TOTAL_STAMPS,
        dateStr: passDate,
        verificationUrl: passVerificationUrl,
      });
      if (showNotification) {
        showNotification({
          type: 'success',
          message: 'Official Cult Member Pass QR downloaded successfully!'
        });
      }
    } catch (err) {
      console.error('Failed to download pass badge:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Map 7 slots
  const slots = useMemo(() => {
    return Array.from({ length: TOTAL_STAMPS }, (_, idx) => {
      const stamp = summary.activeStamps[idx] || null;
      const isCollected = Boolean(stamp);
      const isCelebrating = stamp && stamp.id === celebratingStampId;
      // Check if stamp has expired
      const isExpired = stamp ? new Date(stamp.expiresAt) < new Date() : false;
      return {
        slotNumber: idx + 1,
        slotCode: `0${idx + 1}`,
        isCollected,
        isExpired,
        stamp,
        isCelebrating
      };
    });
  }, [summary.activeStamps, celebratingStampId]);

  return (
    <div className="space-y-8 font-mono">
      {/* Newly Earned Stamp Notification Banner */}
      <AnimatePresence>
        {celebrationBanner && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="p-4 bg-[#141415] border-l-4 border-[#E51E2B] text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E51E2B] text-white flex items-center justify-center font-black shrink-0 text-xs">
                3
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#E51E2B] block">
                  STAMP COLLECTED • DELIVERY CONFIRMED
                </span>
                <p className="text-xs font-medium text-neutral-200 mt-0.5">
                  Order #{celebrationBanner.orderNumber} delivered. 1 official streetwear stamp added to your wallet pass.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCelebrationBanner(null)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold uppercase tracking-wider text-white border border-neutral-700 transition-colors shrink-0 cursor-pointer rounded-xs"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          DIGITAL MEMBERSHIP CARD (Landscape Layout Architecture)
          Horizontal 2-Panel Structure: Left Stamps/Progress, Right Wallet QR Stub
          Streetwear Luxury Aesthetic: Dark Obsidian, Cream Inset, Restrained Red
         ========================================================================= */}
      <div className="max-w-4xl lg:max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#18181A] via-[#111113] to-[#0A0A0C] border border-neutral-800 shadow-2xl p-5 sm:p-7 lg:p-8 text-neutral-100 transition-all">
          {/* Subtle top card highlight border */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Card Top Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-800/80">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F5F4F0]">
                  TH3EE REWARD CLUB // CULT PASS
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans">
                Cardholder: <span className="text-white font-medium uppercase font-mono">{currentUser?.name || 'TH3EE Patron'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 sm:self-center">
              <span className="text-[10px] tracking-wider text-neutral-300 uppercase font-mono px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-md">
                PASS #{memberCode}
              </span>
              <button
                type="button"
                onClick={loadLoyaltySummary}
                disabled={loading}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 px-2 py-1 bg-neutral-900/60 border border-neutral-800 rounded-md"
                title="Sync balance"
              >
                <RefreshIcon className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>

          {/* LANDSCAPE TWO-COLUMN PANELS */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT PANEL (7 cols on lg): 8 T-SHIRT STAMPS ON CREAM CANVAS + PROGRESS */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              {/* Inset Stamp Surface (White / Cream Background with Free-Standing T-Shirt Silhouettes) */}
              <div className="bg-[#FAF9F5] border border-[#E7E4DC] rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="grid grid-cols-4 gap-y-4 gap-x-2 sm:gap-x-3">
                  {/* 7 STAMP SLOTS */}
                  {slots.map((slot) => {
                    if (slot.isCollected && slot.stamp) {
                      const isNewlyCelebrated = slot.isCelebrating && !shouldReduceMotion;
                      return (
                        <div
                          key={slot.slotNumber}
                          className="group relative flex flex-col items-center justify-start py-1 px-0.5 cursor-default"
                        >
                          <motion.div
                            initial={isNewlyCelebrated ? { scale: 1.4, y: -10, opacity: 0 } : false}
                            animate={isNewlyCelebrated ? { scale: 1, y: 0, opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
                            transition={
                              isNewlyCelebrated
                                ? { type: 'spring', stiffness: 420, damping: 20, mass: 1 }
                                : undefined
                            }
                          >
                            <TShirtSilhouette type="collected" slotCode={slot.slotCode} />
                          </motion.div>

                          <div className="mt-1.5 text-center">
                            <span className="text-[10px] font-bold text-neutral-800 block leading-tight">
                              DROP #{slot.slotCode}
                            </span>
                            <span className="text-[8px] text-neutral-500 font-mono block">
                              {new Date(slot.stamp.earnedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </span>
                          </div>

                          {/* Tooltip with order details on hover */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block z-30 w-44 p-2 bg-neutral-900 border border-neutral-700 text-[10px] text-neutral-300 rounded-md shadow-xl pointer-events-none font-sans">
                            <p className="font-bold text-white uppercase font-mono">Order #{slot.stamp.orderNumber}</p>
                            <p className="text-neutral-400 mt-0.5">Amount: ₹{Number(slot.stamp.orderAmount).toLocaleString('en-IN')}</p>
                            <p className="text-neutral-400">Valid until: {new Date(slot.stamp.expiresAt).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                      );
                    }

                    if (slot.isExpired) {
                      return (
                        <div
                          key={slot.slotNumber}
                          className="flex flex-col items-center justify-start py-1 px-0.5 opacity-60"
                        >
                          <TShirtSilhouette type="expired" slotCode={slot.slotCode} />
                          <div className="mt-1.5 text-center">
                            <span className="text-[10px] font-bold text-neutral-400 block leading-tight">
                              SLOT #{slot.slotCode}
                            </span>
                            <span className="text-[8px] text-neutral-400 uppercase font-mono block">
                              Outdated
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // UNCOLLECTED STAMP SLOT
                    return (
                      <div
                        key={slot.slotNumber}
                        className="group flex flex-col items-center justify-start py-1 px-0.5 transition-colors"
                      >
                        <TShirtSilhouette type="pending" slotCode={slot.slotCode} />
                        <div className="mt-1.5 text-center">
                          <span className="text-[10px] font-bold text-neutral-500 block leading-tight">
                            SLOT #{slot.slotCode}
                          </span>
                          <span className="text-[8px] text-neutral-400 uppercase font-mono block">
                            Pending
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* 8TH DISTINCTIVE REWARD EMBLEM POSITION */}
                  <div className="group flex flex-col items-center justify-start py-1 px-0.5">
                    <TShirtSilhouette type={isRewardUnlocked ? 'reward-unlocked' : 'reward-pending'} />
                    <div className="mt-1.5 text-center">
                      <span
                        className={`text-[10px] font-bold block leading-tight ${
                          isRewardUnlocked ? 'text-amber-700' : 'text-neutral-500'
                        }`}
                      >
                        REWARD
                      </span>
                      <span
                        className={`text-[8px] font-mono uppercase block ${
                          isRewardUnlocked ? 'text-amber-600 font-bold' : 'text-neutral-400'
                        }`}
                      >
                        {isRewardUnlocked ? 'READY' : `${stampsRemaining} left`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inset Footer Stats (Matching Reference Image 2: "Remaining: X" and "Stamps: Y / 07") */}
                <div className="mt-4 pt-3 border-t border-[#E7E4DC] flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-600 font-medium">
                    Remaining: <strong className="text-neutral-900 font-bold">{stampsRemaining}</strong>
                  </span>
                  <span className="text-neutral-600 font-medium">
                    Stamps: <strong className="text-[#E51E2B] font-bold">{activeCount.toString().padStart(2, '0')} / 07</strong>
                  </span>
                </div>
              </div>

              {/* Progress Indicator Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-neutral-300 uppercase">
                    {activeCount} OF {TOTAL_STAMPS} STAMPS COLLECTED
                  </span>
                  <span className="text-neutral-400 text-[10px]">
                    {Math.round((activeCount / TOTAL_STAMPS) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-neutral-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E51E2B] transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, (activeCount / TOTAL_STAMPS) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 font-sans">
                  {isRewardUnlocked
                    ? 'Your complimentary heavyweight streetwear drop is ready to claim.'
                    : `Earn ${stampsRemaining} more stamp${stampsRemaining === 1 ? '' : 's'} from delivered orders to unlock your reward.`}
                </p>
              </div>

              {/* REWARD UNLOCKED ACTION CARD */}
              {isRewardUnlocked && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/40 border border-amber-400/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <AwardIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        YOU UNLOCKED YOUR TH3EE REWARD
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-tight">
                      FREE HEAVYWEIGHT STREETWEAR T-SHIRT
                    </h3>
                    <p className="text-[11px] text-neutral-300 font-sans">
                      Select your silhouette size and shipping address to initiate atelier dispatch.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setClaimedSuccessCode(null);
                      setClaimError('');
                      setIsClaimModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#E51E2B] hover:bg-red-700 text-white font-mono text-xs font-black uppercase tracking-wider transition-all rounded-lg shrink-0 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  >
                    <GiftIcon className="w-3.5 h-3.5" />
                    <span>CLAIM YOUR REWARD</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* RIGHT PANEL (5 cols on lg): DIGITAL WALLET PASS STUB WITH SCAN DETAILS */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="h-full bg-[#FAF9F5] text-neutral-900 rounded-2xl p-5 sm:p-6 border border-[#E7E4DC] shadow-sm flex flex-col justify-between items-center text-center relative">
                {/* QR Code Container */}
                <div className="space-y-2 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-xl border border-neutral-300 shadow-xs">
                    <PassQRCode value={passVerificationUrl} size={144} />
                  </div>
                  <div>
                    <span className="text-[11px] font-black tracking-widest uppercase text-neutral-900 block">
                      TH3EE MEMBER PASS
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider block mt-0.5">
                      PASS ID: TH3EE-{memberCode} | ATELIER VERIFIED
                    </span>
                    {/* Explicit Date Mention */}
                    <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded-md">
                      <span className="text-[9px] text-neutral-500 font-mono font-bold">DATE:</span>
                      <span className="text-[9px] text-neutral-900 font-mono font-black">{passDate}</span>
                    </div>
                  </div>
                </div>

                {/* Member Details & Realtime Stamps Count */}
                <div className="my-3 py-2.5 border-y border-[#E7E4DC] w-full space-y-1.5 text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#E51E2B]">
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {activeCount} / 07 STAMPS COLLECTED
                    </span>
                  </div>
                  <p className="text-xs font-bold uppercase text-neutral-900 pt-0.5">
                    {currentUser?.name || 'TH3EE Patron'}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">
                    {currentUser?.email || ''}
                  </p>
                </div>

                {/* Scan Action & Download */}
                <div className="w-full space-y-2">
                  <p className="text-[9px] text-neutral-500 font-sans leading-tight">
                    Scan with any phone camera to display member details and live stamp balance.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPass}
                      disabled={isDownloading}
                      className="w-full py-2 px-2.5 bg-[#E51E2B] hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      <span>{isDownloading ? 'Saving...' : 'Download Pass QR'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVerifyModalOpen(true)}
                      className="w-full py-2 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Pass Details</span>
                    </button>
                  </div>
                  <span className="text-[8px] text-neutral-400 font-sans block">
                    Each stamp expires 12 calendar months from delivery date | Non-transferable
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* Stamp Expiry Note */}
          <div className="mt-6 pt-3 border-t border-neutral-800 text-[10px] text-neutral-500 text-center font-sans">
            Authoritative loyalty balance secured by InsForge backend • 1 stamp per qualifying delivered order
          </div>
        </div>
      </div>

      {/* Interactive Boarding Pass Modal */}
      <AnimatePresence>
        {isVerifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-[390px] my-auto"
            >
              <TH3EEBoardingPass
                memberCode={memberCode}
                memberName={currentUser?.name || 'TH3EE Patron'}
                memberEmail={currentUser?.email || ''}
                activeStampsCount={activeCount}
                totalStamps={TOTAL_STAMPS}
                dateStr={passDate}
                verificationUrl={passVerificationUrl}
                onDownload={handleDownloadPass}
                onClose={() => setIsVerifyModalOpen(false)}
                showTopBar={true}
                showDownloadButton={true}
                isDownloading={isDownloading}
                notchBgColor="bg-black/85"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Patron Audit Ledger & Rules Tabs (Preserved customer history) */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex border-b border-neutral-200 pb-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveLedgerTab('stamps')}
            className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
              activeLedgerTab === 'stamps'
                ? 'border-[#E51E2B] text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            Active Stamp Log ({summary.activeStamps.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveLedgerTab('rewards')}
            className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
              activeLedgerTab === 'rewards'
                ? 'border-[#E51E2B] text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            Claimed Rewards ({summary.rewardClaims.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveLedgerTab('rules')}
            className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors border-b-2 cursor-pointer ${
              activeLedgerTab === 'rules'
                ? 'border-[#E51E2B] text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            Club Guidelines
          </button>
        </div>

        {/* 1. ACTIVE STAMP LOG */}
        {activeLedgerTab === 'stamps' && (
          <div className="space-y-3">
            {summary.activeStamps.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center font-sans">
                No active stamps on ledger yet. Stamps are automatically awarded upon confirmed package delivery.
              </p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {summary.activeStamps.map((stamp, idx) => (
                  <div key={stamp.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#E51E2B] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-neutral-900 uppercase">
                          Order #{stamp.orderNumber}
                        </span>
                        <span className="text-[10px] text-neutral-400 ml-2">
                          (₹{Number(stamp.orderAmount).toLocaleString('en-IN')})
                        </span>
                        <p className="text-[10px] text-neutral-500 font-sans">
                          Earned on {new Date(stamp.earnedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase rounded-xs">
                        Active Stamp
                      </span>
                      <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                        Expires {new Date(stamp.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. CLAIMED REWARDS */}
        {activeLedgerTab === 'rewards' && (
          <div className="space-y-3">
            {summary.rewardClaims.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center font-sans">
                No rewards claimed yet. Accumulate 7 delivered orders to redeem your free cult T-shirt.
              </p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {summary.rewardClaims.map((claim) => (
                  <div key={claim.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-[#E51E2B]">{claim.claimCode}</span>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-xs bg-neutral-900 text-white">
                          {claim.status}
                        </span>
                      </div>
                      <p className="font-sans text-neutral-800 mt-1">
                        <strong>{claim.rewardTitle}</strong> {claim.selectedSize && `• Size: ${claim.selectedSize}`} {claim.selectedProductName && `• (${claim.selectedProductName})`}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-sans">
                        Claimed on {new Date(claim.claimedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-neutral-500 font-sans">
                        {claim.status === 'fulfilled' ? 'Dispatched by Atelier' : 'Being prepared for shipment'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. CLUB GUIDELINES */}
        {activeLedgerTab === 'rules' && (
          <div className="text-xs text-neutral-600 space-y-2 leading-relaxed font-sans">
            <p><strong>1 Stamp Per Delivered Order:</strong> Stamps are minted only when an order status reaches <code className="font-mono text-neutral-900 font-bold">Delivered</code>. Placed, processing, and dispatched orders do not earn stamps until safe arrival.</p>
            <p><strong>12-Month Validity:</strong> Each stamp carries an independent 12 calendar month validity from its delivery confirmation timestamp.</p>
            <p><strong>7 Stamps Unlock 1 Cult Tee:</strong> Reaching 7 active stamps unlocks a complimentary heavyweight streetwear silhouette of your preferred size.</p>
            <p><strong>Explicit Claim Required:</strong> Rewards must be explicitly claimed by the customer with shipping destination details.</p>
          </div>
        )}
      </div>

      {/* CLAIM REWARD MODAL */}
      <AnimatePresence>
        {isClaimModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white border border-neutral-300 rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#E51E2B] uppercase">REWARD UNLOCKED</span>
                  <h3 className="text-base font-black uppercase text-neutral-900">
                    CLAIM FREE CULT T-SHIRT
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-900 p-1 cursor-pointer"
                  aria-label="Close"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              {claimedSuccessCode ? (
                <div className="p-6 bg-neutral-900 text-white text-center space-y-4 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                    <CheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      CLAIM RECORD CREATED
                    </span>
                    <h4 className="text-lg font-black uppercase tracking-tight text-white mt-1">
                      {claimedSuccessCode}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-2 font-sans max-w-sm mx-auto">
                      Our atelier team will prepare your cult T-shirt and dispatch it to your specified delivery address.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsClaimModalOpen(false);
                      setClaimedSuccessCode(null);
                    }}
                    className="px-6 py-2 bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-lg"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
                  {claimError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {claimError}
                    </div>
                  )}

                  {/* Silhouette Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 block">
                      Select Cult Silhouette Drop *
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full p-2.5 border border-neutral-300 font-bold bg-neutral-50 rounded-lg focus:border-neutral-900 focus:outline-none"
                    >
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category || 'T-Shirt'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Size Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 block">
                      Select Preferred Size *
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`py-2 text-center text-xs font-black uppercase border rounded-lg transition-colors cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address Selection */}
                  <div className="space-y-2 pt-2 border-t border-neutral-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 block">
                      Dispatch Address *
                    </label>

                    {savedAddresses.length > 0 && (
                      <div className="space-y-2">
                        {savedAddresses.map((addr) => (
                          <label
                            key={addr.id}
                            className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                              selectedAddressId === addr.id
                                ? 'border-neutral-900 bg-neutral-50'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="claim_address"
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-0.5 accent-[#E51E2B]"
                            />
                            <div className="text-[11px] font-sans">
                              <span className="font-bold text-neutral-900">{addr.fullName}</span> ({addr.phone})
                              <p className="text-neutral-500">
                                {addr.houseNo} {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          </label>
                        ))}

                        <label
                          className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                            selectedAddressId === ''
                              ? 'border-neutral-900 bg-neutral-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="claim_address"
                            checked={selectedAddressId === ''}
                            onChange={() => setSelectedAddressId('')}
                            className="accent-[#E51E2B]"
                          />
                          <span className="text-[11px] font-bold text-neutral-700">Ship to a different address</span>
                        </label>
                      </div>
                    )}

                    {(!selectedAddressId || savedAddresses.length === 0) && (
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Full Name *"
                            value={customAddress.fullName}
                            onChange={(e) => setCustomAddress({ ...customAddress, fullName: e.target.value })}
                            className="p-2 border border-neutral-300 rounded-lg text-xs"
                            required
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number *"
                            value={customAddress.phone}
                            onChange={(e) => setCustomAddress({ ...customAddress, phone: e.target.value })}
                            className="p-2 border border-neutral-300 rounded-lg text-xs"
                            required
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Flat / Building / House No. *"
                          value={customAddress.houseNo}
                          onChange={(e) => setCustomAddress({ ...customAddress, houseNo: e.target.value })}
                          className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Street Address *"
                          value={customAddress.street}
                          onChange={(e) => setCustomAddress({ ...customAddress, street: e.target.value })}
                          className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                          required
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="City *"
                            value={customAddress.city}
                            onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                            className="p-2 border border-neutral-300 rounded-lg text-xs"
                            required
                          />
                          <input
                            type="text"
                            placeholder="State *"
                            value={customAddress.state}
                            onChange={(e) => setCustomAddress({ ...customAddress, state: e.target.value })}
                            className="p-2 border border-neutral-300 rounded-lg text-xs"
                            required
                          />
                          <input
                            type="text"
                            placeholder="PIN Code *"
                            maxLength={6}
                            value={customAddress.pincode}
                            onChange={(e) => setCustomAddress({ ...customAddress, pincode: e.target.value })}
                            className="p-2 border border-neutral-300 rounded-lg text-xs"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsClaimModalOpen(false)}
                      className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-lg text-xs font-bold uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={claiming}
                      className="px-6 py-2 bg-[#E51E2B] hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {claiming ? 'Submitting Claim...' : 'Confirm Reward Claim'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoyaltyClubCard;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Product, StoreBrandConfig } from '../../types/store';
import { 
  getCanonicalProductUrl, 
  formatProductShareMessage, 
  generatePlatformShareUrls, 
  copyToClipboardSafe, 
  getProductShareImage,
  OFFICIAL_SITE_DOMAIN,
  type ShareTargetItem
} from '../../lib/share';
import { shareAnalytics, type ShareChannel } from '../../services/shareAnalytics.service';

export interface ShareProductModalProps {
  product: Product | null;
  customItem?: ShareTargetItem | null;
  isOpen: boolean;
  onClose: () => void;
  storeBrand?: StoreBrandConfig;
  showNotification?: (msg: any) => void;
}

// Inline luxury brand SVG icons
const WhatsAppGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.02 2.58.13.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.18-.48-.3" />
  </svg>
);

const InstagramGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TelegramGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

const XGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const CheckGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ShareGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const CloseGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const ShareProductModal: React.FC<ShareProductModalProps> = ({
  product,
  customItem,
  isOpen,
  onClose,
  storeBrand,
  showNotification,
}) => {
  const [copied, setCopied] = useState(false);
  const activeDomain = storeBrand?.domain || OFFICIAL_SITE_DOMAIN;

  // Resolve target item details (either product or custom collection/wishlist)
  const item = useMemo(() => {
    if (customItem) return customItem;
    if (product) {
      const canonicalUrl = getCanonicalProductUrl(product, activeDomain);
      const sellingPrice = Number(product.price);
      return {
        type: 'product' as const,
        id: product.id,
        slug: product.slug,
        title: product.name,
        subtitle: `${product.category}${product.subcategory ? ` • ${product.subcategory}` : ''}`,
        description: product.description,
        price: sellingPrice,
        image: getProductShareImage(product),
        category: product.category,
        url: canonicalUrl
      };
    }
    return null;
  }, [product, customItem, activeDomain]);

  const shareTitle = item ? item.title : 'TH3EE Streetwear';
  const shareUrl = item ? item.url || `https://${activeDomain}` : `https://${activeDomain}`;
  const shareMessage = useMemo(() => {
    if (!item) return '';
    if (item.type === 'product' && product) {
      return formatProductShareMessage(product, activeDomain);
    }
    if (item.type === 'collection') {
      return `Explore the ${item.title} collection on TH3EE Streetwear! Check out drops here: ${shareUrl}`;
    }
    if (item.type === 'wishlist') {
      return `Check out my curated wishlist drops on TH3EE Streetwear: ${shareUrl}`;
    }
    return `${item.title} | TH3EE Streetwear: ${shareUrl}`;
  }, [item, product, activeDomain, shareUrl]);

  const platformUrls = useMemo(() => {
    return generatePlatformShareUrls({
      title: shareTitle,
      text: shareMessage,
      url: shareUrl
    });
  }, [shareTitle, shareMessage, shareUrl]);

  if (!isOpen || !item) return null;

  // Track click & record analytics
  const recordShareAttempt = (channel: ShareChannel) => {
    shareAnalytics.track('product_share_clicked', {
      itemId: item.id || item.slug,
      itemType: item.type,
      channel
    });
  };

  const recordShareComplete = (channel: ShareChannel) => {
    shareAnalytics.track('product_share_completed', {
      itemId: item.id || item.slug,
      itemType: item.type,
      channel
    });
  };

  // 1. Copy Link Action
  const handleCopyLink = async () => {
    recordShareAttempt('copy_link');
    const success = await copyToClipboardSafe(shareUrl);
    if (success) {
      setCopied(true);
      shareAnalytics.track('product_link_copied', {
        itemId: item.id || item.slug,
        itemType: item.type,
        channel: 'copy_link'
      });
      if (showNotification) {
        showNotification({
          type: 'success',
          message: item.type === 'product' ? 'Product link copied!' : 'Link copied to clipboard!'
        });
      }
      setTimeout(() => setCopied(false), 2600);
    } else {
      if (showNotification) {
        showNotification({
          type: 'error',
          message: 'Unable to auto-copy. Please copy from the input box below.'
        });
      }
    }
  };

  // 2. WhatsApp Action
  const handleWhatsAppShare = () => {
    recordShareAttempt('whatsapp');
    window.open(platformUrls.whatsapp, '_blank', 'noopener,noreferrer');
    recordShareComplete('whatsapp');
  };

  // 3. Instagram Action
  const handleInstagramShare = async () => {
    recordShareAttempt('instagram');
    // Copy link first so user can paste into story stickers or direct message
    await copyToClipboardSafe(shareUrl);
    if (showNotification) {
      showNotification({
        type: 'success',
        message: 'Link copied! Opening Instagram...'
      });
    }

    // Attempt Native Share API if supported on mobile (Instagram Stories / Direct integration)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out "${item.title}" on TH3EE!`,
          url: shareUrl
        });
        recordShareComplete('instagram');
        return;
      } catch (err) {
        // Dismissed or fallback
      }
    }

    // Direct fallback to Instagram
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    recordShareComplete('instagram');
  };

  // 4. Telegram Action
  const handleTelegramShare = () => {
    recordShareAttempt('telegram');
    window.open(platformUrls.telegram, '_blank', 'noopener,noreferrer');
    recordShareComplete('telegram');
  };

  // 5. Facebook Action
  const handleFacebookShare = () => {
    recordShareAttempt('facebook');
    window.open(platformUrls.facebook, '_blank', 'noopener,noreferrer');
    recordShareComplete('facebook');
  };

  // 6. X (Twitter) Action
  const handleXShare = () => {
    recordShareAttempt('x');
    window.open(platformUrls.x, '_blank', 'noopener,noreferrer');
    recordShareComplete('x');
  };

  // 7. Device Native Share Sheet Action
  const handleNativeShare = async () => {
    recordShareAttempt('native');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareMessage,
          url: shareUrl
        });
        recordShareComplete('native');
      } catch (err) {
        // User cancelled share sheet
      }
    } else {
      handleCopyLink();
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 36, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-md p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-50 text-[#E51E2B] flex items-center justify-center">
                <ShareGlyph className="w-4 h-4" />
              </div>
              <div>
                <h3 id="share-modal-title" className="text-base sm:text-lg font-black uppercase text-neutral-900 leading-none">
                  Share {item.type === 'product' ? 'Drop' : item.type === 'collection' ? 'Collection' : 'Drops'}
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase mt-1 block">
                  Send to friends & socials
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close share dialog"
            >
              <CloseGlyph className="w-4 h-4" />
            </button>
          </div>

          {/* Item Mini Preview Card */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-14 h-16 sm:w-16 sm:h-18 object-cover rounded-xl bg-neutral-200 shrink-0 border border-neutral-200"
              />
            ) : (
              <div className="w-14 h-16 sm:w-16 sm:h-18 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                TH3EE
              </div>
            )}
            <div className="flex-1 min-w-0 font-mono">
              {item.subtitle && (
                <span className="text-[9px] font-bold text-[#E51E2B] uppercase tracking-wider block truncate">
                  {item.subtitle}
                </span>
              )}
              <h4 className="text-xs sm:text-sm font-black text-neutral-900 uppercase truncate mt-0.5">
                {item.title}
              </h4>
              {item.price !== undefined && item.price > 0 && (
                <span className="text-xs font-black text-neutral-900 mt-1 block">
                  ₹{Math.round(item.price).toFixed(0)}
                </span>
              )}
            </div>
          </div>

          {/* Primary Quick Channels (WhatsApp & Instagram) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-neutral-900 transition-all cursor-pointer group"
              title="Share on WhatsApp"
            >
              <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <WhatsAppGlyph className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-black uppercase text-neutral-900 block leading-tight truncate">
                  WhatsApp
                </span>
                <span className="text-[9px] text-neutral-500 font-mono block">
                  Chat / Status
                </span>
              </div>
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={handleInstagramShare}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-pink-50 to-amber-50 hover:from-pink-100 hover:to-amber-100 border border-pink-200 text-neutral-900 transition-all cursor-pointer group"
              title="Share on Instagram"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <InstagramGlyph className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs font-black uppercase text-neutral-900 block leading-tight truncate">
                  Instagram
                </span>
                <span className="text-[9px] text-neutral-500 font-mono block">
                  Stories / DM
                </span>
              </div>
            </button>
          </div>

          {/* Secondary Social Channels: Telegram, Facebook, X */}
          <div className="grid grid-cols-3 gap-2">
            {/* Telegram */}
            <button
              type="button"
              onClick={handleTelegramShare}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-50 hover:bg-[#229ED9]/10 border border-neutral-200 hover:border-[#229ED9]/40 transition-all cursor-pointer group"
              title="Share on Telegram"
            >
              <div className="w-7 h-7 rounded-lg bg-[#229ED9] text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <TelegramGlyph className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-800">Telegram</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={handleFacebookShare}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-50 hover:bg-[#1877F2]/10 border border-neutral-200 hover:border-[#1877F2]/40 transition-all cursor-pointer group"
              title="Share on Facebook"
            >
              <div className="w-7 h-7 rounded-lg bg-[#1877F2] text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <FacebookGlyph className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-800">Facebook</span>
            </button>

            {/* X (Twitter) */}
            <button
              type="button"
              onClick={handleXShare}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-50 hover:bg-black/10 border border-neutral-200 hover:border-black/40 transition-all cursor-pointer group"
              title="Share on X"
            >
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <XGlyph className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-800">X (Twitter)</span>
            </button>
          </div>

          {/* Copy Link Container with Accessible Feedback */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase block">
              Permanent Public URL
            </span>
            <div className="flex items-center gap-2 p-1.5 pl-3 bg-neutral-100 border border-neutral-200 rounded-2xl">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <LinkGlyph className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  aria-label="Product share URL"
                  className="text-[11px] font-mono text-neutral-700 bg-transparent w-full border-none focus:outline-none select-all truncate"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label="Copy public link to clipboard"
                className={`py-2 px-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-900 hover:bg-[#E51E2B] text-white'
                }`}
              >
                {copied ? (
                  <>
                    <CheckGlyph className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkGlyph className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {/* Screen reader live region for accessibility */}
            <div className="sr-only" role="status" aria-live="polite">
              {copied ? 'Product link copied to clipboard successfully' : ''}
            </div>
          </div>

          {/* Native System Share Sheet (Mobile devices & supported browsers) */}
          {hasNativeShare && (
            <div className="pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-[11px] font-mono font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <ShareGlyph className="w-3.5 h-3.5 text-neutral-600" />
                <span>Open Device Share Sheet</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareProductModal;

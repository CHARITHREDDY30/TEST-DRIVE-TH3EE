import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Product, StoreBrandConfig } from '../../types/store';
import { resolveProductImageUrl } from '../../lib/r2';

export interface ShareProductModalProps {
  product: Product | null;
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
  isOpen,
  onClose,
  storeBrand,
  showNotification,
}) => {
  const [copied, setCopied] = useState(false);

  // Construct standard universal share URL with hash routing
  const shareUrl = useMemo(() => {
    if (!product) return '';
    if (typeof window === 'undefined') return '';
    const pathname = window.location.pathname || '/';
    const match = pathname.match(/^(\/[^\/]+)/);
    const repoBasePath = match && match[1].toLowerCase() === '/test-drive-th3ee' ? match[1] : '';
    const origin = window.location.origin;
    return `${origin}${repoBasePath}/#/products/${product.slug}`;
  }, [product]);

  if (!isOpen || !product) return null;

  const sellingPrice = Number(product.price);
  const shareTitle = product.name;
  const shareMessage = `🔥 Check out "${product.name}" on TH3EE Streetwear!\nHeavyweight Archive Drop · Rs. ${sellingPrice.toFixed(2)}\n\n👉 View Drop: ${shareUrl}`;

  // Copy Link Handler
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      if (showNotification) {
        showNotification({
          type: 'success',
          message: 'Product link copied to clipboard!'
        });
      }
      setTimeout(() => setCopied(false), 2600);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Instagram Share Handler
  const handleInstagramShare = async () => {
    // Copy the link & caption to clipboard first for easy pasting into Stories or DMs
    await handleCopyLink();
    if (showNotification) {
      showNotification({
        type: 'success',
        message: 'Link copied! Opening Instagram...'
      });
    }

    // Attempt Native Share API if on mobile device (natively offers Instagram Direct / Stories)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out "${product.name}" on TH3EE!`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share dismissed, proceed to open Instagram web/app
      }
    }

    // Direct fallback to Instagram
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  // Native System Share Handler
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareMessage,
          url: shareUrl,
        });
      } catch (err) {
        // Dismissed
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
      >
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 36, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-md p-5 sm:p-6 space-y-5 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-50 text-[#E51E2B] flex items-center justify-center">
                <ShareGlyph className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase text-neutral-900 leading-none">
                  Share Product
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
              aria-label="Close"
            >
              <CloseGlyph className="w-4 h-4" />
            </button>
          </div>

          {/* Product Mini Preview Card */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80">
            <img
              src={resolveProductImageUrl((product.colors && product.colors[0] && product.colors[0].images && product.colors[0].images[0]) || (product.images && product.images[0]) || '')}
              alt={product.name}
              className="w-14 h-16 sm:w-16 sm:h-18 object-cover rounded-xl bg-neutral-200 shrink-0 border border-neutral-200"
            />
            <div className="flex-1 min-w-0 font-mono">
              <span className="text-[9px] font-bold text-[#E51E2B] uppercase tracking-wider block truncate">
                {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-neutral-900 uppercase truncate mt-0.5">
                {product.name}
              </h4>
              <span className="text-xs font-black text-neutral-900 mt-1 block">
                Rs. {sellingPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Three Main Share Actions: WhatsApp, Instagram, Copy Link */}
          <div className="space-y-2.5">
            {/* 1. WhatsApp Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-neutral-900 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <WhatsAppGlyph className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-xs sm:text-sm font-black uppercase text-neutral-900 block leading-tight">
                    Share via WhatsApp
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
                    Send drop details directly to chat or status
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#1ea952] group-hover:translate-x-0.5 transition-transform">
                Open →
              </span>
            </button>

            {/* 2. Instagram Button */}
            <button
              type="button"
              onClick={handleInstagramShare}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 hover:from-pink-100 hover:to-amber-100 border border-pink-200 text-neutral-900 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <InstagramGlyph className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-xs sm:text-sm font-black uppercase text-neutral-900 block leading-tight">
                    Share on Instagram
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
                    Copy link & open Stories or Direct Message
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-pink-600 group-hover:translate-x-0.5 transition-transform">
                Share →
              </span>
            </button>

            {/* 3. Copy Link Action */}
            <div className="flex items-center gap-2 p-1.5 pl-3.5 bg-neutral-100 border border-neutral-200 rounded-2xl">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <LinkGlyph className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="text-[11px] font-mono text-neutral-600 truncate">
                  {shareUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
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
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Native System Share (Optional on supported mobile devices) */}
          {hasNativeShare && (
            <div className="pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-[11px] font-mono font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShareGlyph className="w-3.5 h-3.5 text-neutral-600" />
                <span>More Share Options</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareProductModal;

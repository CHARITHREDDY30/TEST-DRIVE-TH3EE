import React from 'react';
import { PassQRCode } from '../common/PassQRCodes';

export interface TH3EEBoardingPassProps {
  memberCode: string;
  memberName: string;
  memberEmail?: string;
  activeStampsCount: number;
  totalStamps?: number;
  dateStr: string;
  verificationUrl: string;
  onDownload?: () => void;
  onClose?: () => void;
  showTopBar?: boolean;
  showDownloadButton?: boolean;
  className?: string;
  notchBgColor?: string;
  isDownloading?: boolean;
}

export const TH3EEBoardingPass: React.FC<TH3EEBoardingPassProps> = ({
  memberCode,
  memberName,
  memberEmail = '',
  activeStampsCount,
  totalStamps = 7,
  dateStr,
  verificationUrl,
  onDownload,
  onClose,
  showTopBar = false,
  showDownloadButton = true,
  className = '',
  notchBgColor = 'bg-[#0D0D10]',
  isDownloading = false,
}) => {
  const stampsRemaining = Math.max(0, totalStamps - activeStampsCount);
  const isRewardReady = activeStampsCount >= totalStamps;
  const cleanMemberCode = memberCode.replace(/^TH3EE-/i, '').toUpperCase();
  const displayName = memberName.toUpperCase();

  return (
    <div className={`w-full max-w-[380px] mx-auto flex flex-col items-center ${className}`}>
      {/* Optional Top Bar (Close and Download circular buttons) */}
      {showTopBar && (
        <div className="w-full flex items-center justify-between pb-3 px-1 text-white">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <div className="w-9" />
          )}

          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            Member Pass
          </h2>

          {onDownload ? (
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Download"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      )}

      {/* The White Boarding Pass Card */}
      <div className="w-full bg-[#FFFFFF] text-neutral-900 rounded-[28px] p-6 shadow-2xl border border-neutral-200/80 relative overflow-hidden flex flex-col font-sans">
        {/* Card Header: Brand Logo & Pass ID */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-1 font-black tracking-tighter text-lg leading-none">
            <span className="text-neutral-900">TH</span>
            <span className="text-[#E51E2B] px-0.5">3</span>
            <span className="text-neutral-900">EE</span>
            <span className="text-[9px] font-mono tracking-widest text-[#E51E2B] font-bold uppercase ml-1.5 px-1.5 py-0.5 bg-red-50 rounded">
              ATELIER
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
            ID TH3EE-{cleanMemberCode}
          </span>
        </div>

        {/* Hero Route / Status Block (PATRON -> CULT) */}
        <div className="py-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-neutral-900 block leading-tight">
              PATRON
            </span>
            <span className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase block">
              Atelier Member
            </span>
          </div>

          {/* Central Connecting Badge */}
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#E51E2B] text-white shadow-xs shrink-0 mx-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black tracking-tight text-[#E51E2B] block leading-tight">
              CULT
            </span>
            <span className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase block">
              VIP Tier Pass
            </span>
          </div>
        </div>

        {/* Boarding Details: 3 Columns Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-neutral-100 text-left">
          <div>
            <span className="text-[9px] text-neutral-400 uppercase font-medium tracking-wider block">
              Stamps
            </span>
            <span className="text-xs font-black font-mono text-neutral-900 mt-0.5 block">
              {activeStampsCount.toString().padStart(2, '0')} / {totalStamps.toString().padStart(2, '0')}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-neutral-400 uppercase font-medium tracking-wider block">
              Reward
            </span>
            <span className="text-xs font-black font-mono text-[#E51E2B] mt-0.5 block">
              {isRewardReady ? 'READY' : `${stampsRemaining} Left`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-neutral-400 uppercase font-medium tracking-wider block">
              Status
            </span>
            <span className="text-xs font-black font-mono text-emerald-600 mt-0.5 block">
              VERIFIED
            </span>
          </div>
        </div>

        {/* Passenger & Date: 2 Columns Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-neutral-100 text-left">
          <div>
            <span className="text-[9px] text-neutral-400 uppercase font-medium tracking-wider block">
              Passenger / Cardholder
            </span>
            <span className="text-xs font-black uppercase text-neutral-900 mt-0.5 block truncate">
              {displayName}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-neutral-400 uppercase font-medium tracking-wider block">
              Date
            </span>
            <span className="text-xs font-black font-mono text-neutral-900 mt-0.5 block">
              {dateStr}
            </span>
          </div>
        </div>

        {/* Ticket Perforation Notch Line */}
        <div className="relative my-3">
          {/* Left Cutout Notch */}
          <div className={`absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 ${notchBgColor} rounded-full`} />
          {/* Right Cutout Notch */}
          <div className={`absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 ${notchBgColor} rounded-full`} />
          {/* Dashed Cut Line */}
          <div className="border-t-2 border-dashed border-neutral-200 w-full" />
        </div>

        {/* Centered Scannable QR Code */}
        <div className="flex flex-col items-center justify-center pt-2 pb-4">
          <div className="bg-white p-2.5 rounded-2xl border border-neutral-200 shadow-xs">
            <PassQRCode value={verificationUrl} size={156} />
          </div>
          <span className="text-[9px] text-neutral-400 font-mono uppercase tracking-wider mt-2.5">
            Scan with any phone camera
          </span>
        </div>

        {/* Bottom Ticket Details Strip (Signature TH3EE Crimson Red Bar) */}
        <div className="w-full bg-[#E51E2B] text-white rounded-xl py-2.5 px-3 grid grid-cols-3 text-center gap-1">
          <div>
            <span className="text-[8px] uppercase tracking-wider text-red-200 block font-medium">
              Tier
            </span>
            <span className="text-[10px] font-black uppercase tracking-wide block mt-0.5">
              CULT VIP
            </span>
          </div>
          <div className="border-x border-white/20">
            <span className="text-[8px] uppercase tracking-wider text-red-200 block font-medium">
              Perk
            </span>
            <span className="text-[10px] font-black uppercase tracking-wide block mt-0.5">
              FREE TEE
            </span>
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-wider text-red-200 block font-medium">
              Cycle
            </span>
            <span className="text-[10px] font-black uppercase tracking-wide block mt-0.5">
              {isRewardReady ? 'UNLOCKED' : `${stampsRemaining} LEFT`}
            </span>
          </div>
        </div>
      </div>

      {/* Full-width "Save and Download" Pill Button underneath the card */}
      {showDownloadButton && onDownload && (
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="w-full mt-4 py-3.5 px-6 bg-[#171717] hover:bg-neutral-900 active:scale-[0.99] text-white text-xs font-black uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{isDownloading ? 'Saving...' : 'Save and Download'}</span>
        </button>
      )}
    </div>
  );
};

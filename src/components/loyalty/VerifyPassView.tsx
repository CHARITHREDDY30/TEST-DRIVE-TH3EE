import React, { useState } from 'react';
import { downloadPassBadge } from '../common/PassQRCodes';
import { TH3EEBoardingPass } from './TH3EEBoardingPass';

interface VerifyPassViewProps {
  navigate?: (path: string) => void;
  onExploreCatalog?: () => void;
}

export const VerifyPassView: React.FC<VerifyPassViewProps> = ({ navigate, onExploreCatalog }) => {
  // Extract query parameters from URL (supporting standard search and hash-routing query)
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(
        window.location.search ||
        (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '')
      )
    : new URLSearchParams();

  const memberId = searchParams.get('id') || 'PATRON';
  const memberName = searchParams.get('name') || 'TH3EE Cult Patron';
  const memberEmail = searchParams.get('email') || '';
  const stampsCollected = Math.min(7, Math.max(0, parseInt(searchParams.get('stamps') || '0', 10)));
  const passDate = searchParams.get('date') || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadPassBadge({
        memberName,
        memberEmail,
        memberCode: memberId,
        stampsCount: stampsCollected,
        totalStamps: 7,
        dateStr: passDate,
        verificationUrl: currentUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      });
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-[88vh] bg-[#0A0A0C] text-neutral-100 py-10 px-4 sm:px-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-[420px] mx-auto space-y-5">
        {/* Verification Status Header Banner (Clean luxury styling, no blinking dots) */}
        <div className="flex items-center justify-between p-3.5 bg-[#141416] border border-neutral-800 rounded-2xl">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
            OFFICIAL ATELIER PASS VERIFIED
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {passDate}
          </span>
        </div>

        {/* The Authentic Boarding Pass Card */}
        <TH3EEBoardingPass
          memberCode={memberId}
          memberName={memberName}
          memberEmail={memberEmail}
          activeStampsCount={stampsCollected}
          totalStamps={7}
          dateStr={passDate}
          verificationUrl={currentUrl}
          onDownload={handleDownload}
          showTopBar={false}
          showDownloadButton={true}
          isDownloading={isDownloading}
          notchBgColor="bg-[#0A0A0C]"
        />

        {/* Navigation Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (navigate) navigate('/');
              else if (onExploreCatalog) onExploreCatalog();
              else window.location.href = '/';
            }}
            className="flex-1 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer text-center"
          >
            ← Storefront
          </button>
          <button
            type="button"
            onClick={() => {
              if (navigate) navigate('/account');
              else window.location.href = '/account';
            }}
            className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer text-center"
          >
            My Account →
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyPassView;

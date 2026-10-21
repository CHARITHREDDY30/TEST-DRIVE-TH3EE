import React from 'react';
import { motion } from 'motion/react';
import { PassQRCode, downloadPassBadge } from '../common/PassQRCodes';

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
  const stampsRemaining = Math.max(0, 7 - stampsCollected);
  const isRewardReady = stampsCollected >= 7;
  const passDate = searchParams.get('date') || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';


  return (
    <div className="min-h-[85vh] bg-[#0A0A0C] text-neutral-100 py-10 px-4 sm:px-6 font-mono flex flex-col items-center justify-center">
      {/* Background radial accent */}
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Verification Status Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex items-center justify-between p-3.5 bg-[#141416] border border-neutral-800 rounded-xl"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              OFFICIAL ATELIER PASS VERIFIED
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </motion.div>

        {/* Digital Membership Pass Card (Landscape Card on Medium+ screens) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#18181A] via-[#111113] to-[#0A0A0C] border border-neutral-800 shadow-2xl p-6 sm:p-8"
        >
          {/* Top highlight line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Pass Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#E51E2B]" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#F5F4F0]">
                  TH3EE REWARD CLUB • CULT PASS
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight mt-1">
                {memberName}
              </h1>
              {memberEmail && (
                <p className="text-xs text-neutral-400 font-sans mt-0.5">
                  {memberEmail}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="text-[10px] tracking-wider text-neutral-300 uppercase font-mono px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded-md">
                PASS ID: TH3EE-{memberId}
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-mono">
                <span className="text-[9px] text-emerald-400 font-bold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
                  VERIFIED
                </span>
                <span className="text-[9px] text-neutral-400">
                  • {passDate}
                </span>
              </div>
            </div>
          </div>


          {/* TWO COLUMN / LANDSCAPE DISPLAY (Stamps on Left, Pass QR on Right) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* LEFT: Live Punchcard Stamp Count */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              {/* Cream Container with Free-Standing T-Shirts */}
              <div className="bg-[#FAF9F5] text-neutral-900 border border-[#E7E4DC] rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DC]">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                    LOYALTY STAMPS COLLECTED
                  </span>
                  <span className="text-xs font-black font-mono text-[#E51E2B] px-2 py-0.5 bg-red-50 border border-red-200 rounded-md">
                    {stampsCollected.toString().padStart(2, '0')} / 07 STAMPS
                  </span>
                </div>

                {/* 8 T-Shirt Silhouette Visual Representation */}
                <div className="grid grid-cols-4 gap-2.5 pt-3">
                  {Array.from({ length: 7 }, (_, i) => {
                    const isStamped = i < stampsCollected;
                    return (
                      <div key={i} className="flex flex-col items-center text-center">
                        <svg viewBox="0 0 64 64" className="w-11 h-11" fill="none">
                          <defs>
                            <linearGradient id={`verifTeeRed_${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#E51E2B" />
                              <stop offset="100%" stopColor="#C91420" />
                            </linearGradient>
                          </defs>
                          {isStamped ? (
                            <g>
                              <path
                                d="M 23 10 C 27 15 37 15 41 10 L 53 16 L 61 27 L 53 32 L 47 26 L 47 55 C 47 56.5 45.5 58 44 58 L 20 58 C 18.5 58 17 56.5 17 55 L 17 26 L 11 32 L 3 27 L 11 16 Z"
                                fill={`url(#verifTeeRed_${i})`}
                                stroke="#B91C1C"
                                strokeWidth="1"
                                strokeLinejoin="round"
                              />
                              <path d="M 23 10 C 27 15 37 15 41 10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.25" fill="none" />
                              <text x="32" y="39" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="900" fontFamily="system-ui, sans-serif">
                                3
                              </text>
                            </g>
                          ) : (
                            <g>
                              <path
                                d="M 23 10 C 27 15 37 15 41 10 L 53 16 L 61 27 L 53 32 L 47 26 L 47 55 C 47 56.5 45.5 58 44 58 L 20 58 C 18.5 58 17 56.5 17 55 L 17 26 L 11 32 L 3 27 L 11 16 Z"
                                fill="#FFFFFF"
                                stroke="#CBD5E1"
                                strokeWidth="1.75"
                                strokeDasharray="3 2"
                                strokeLinejoin="round"
                              />
                              <text x="32" y="40" textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="700" fontFamily="monospace">
                                {`0${i + 1}`}
                              </text>
                            </g>
                          )}
                        </svg>
                        <span className={`text-[9px] mt-1 font-bold ${isStamped ? 'text-[#E51E2B]' : 'text-neutral-400'}`}>
                          {isStamped ? 'STAMPED' : `SLOT 0${i + 1}`}
                        </span>
                      </div>
                    );
                  })}

                  {/* 8th Reward Slot */}
                  <div className="flex flex-col items-center text-center">
                    <svg viewBox="0 0 64 64" className="w-11 h-11" fill="none">
                      <defs>
                        <linearGradient id="verifTeeGold" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 23 10 C 27 15 37 15 41 10 L 53 16 L 61 27 L 53 32 L 47 26 L 47 55 C 47 56.5 45.5 58 44 58 L 20 58 C 18.5 58 17 56.5 17 55 L 17 26 L 11 32 L 3 27 L 11 16 Z"
                        fill={isRewardReady ? 'url(#verifTeeGold)' : '#FFFFFF'}
                        stroke={isRewardReady ? '#B45309' : '#F59E0B'}
                        strokeWidth="1.75"
                        strokeDasharray={isRewardReady ? 'none' : '3 2'}
                        strokeLinejoin="round"
                      />
                      <text x="32" y="44" textAnchor="middle" fill={isRewardReady ? '#78350F' : '#B45309'} fontSize="6" fontWeight="900" fontFamily="monospace">
                        FREE TEE
                      </text>
                    </svg>
                    <span className={`text-[9px] mt-1 font-bold ${isRewardReady ? 'text-amber-700' : 'text-neutral-500'}`}>
                      {isRewardReady ? 'UNLOCKED' : `${stampsRemaining} left`}
                    </span>
                  </div>
                </div>

                {/* Footer Progress Statement */}
                <div className="mt-3.5 pt-2.5 border-t border-[#E7E4DC] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-neutral-600">
                    Remaining for Reward: <strong className="text-neutral-900 font-bold">{stampsRemaining}</strong>
                  </span>
                  <span className="text-neutral-600">
                    Reward Tier: <strong className="text-neutral-900 font-bold">1 Free Tee</strong>
                  </span>
                </div>
              </div>

              {/* Reward Status Banner */}
              <div className={`p-3.5 rounded-xl border text-xs ${
                isRewardReady
                  ? 'bg-amber-950/30 border-amber-400 text-amber-200'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
              }`}>
                {isRewardReady ? (
                  <p className="font-bold text-amber-300 tracking-wide">
                    REWARD UNLOCKED: Customer has collected all 7 stamps and is entitled to a complimentary heavyweight streetwear t-shirt drop.
                  </p>
                ) : (
                  <p className="tracking-wide">
                    IN PROGRESS: {stampsRemaining} more qualifying delivered order{stampsRemaining === 1 ? '' : 's'} required to complete the loyalty cycle.
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: High-Res Pass QR Code Stub */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#FAF9F5] text-neutral-900 border border-[#E7E4DC] rounded-2xl p-5 shadow-sm text-center">
              <div className="bg-white p-2.5 rounded-xl border border-neutral-300 shadow-xs">
                <PassQRCode value={currentUrl} size={144} />
              </div>

              <div className="mt-3 space-y-1.5 w-full flex flex-col items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-neutral-900 block">
                  DIGITAL CULT PASS
                </span>
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
                  PASS #{memberId} • ATELIER VERIFIED
                </span>
                {/* Prominent Date Mention */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded-md">
                  <span className="text-[9px] text-neutral-500 font-mono font-bold">DATE:</span>
                  <span className="text-[9px] text-neutral-900 font-mono font-black">{passDate}</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadPassBadge({
                    memberName,
                    memberEmail,
                    memberCode: memberId,
                    stampsCount: stampsCollected,
                    totalStamps: 7,
                    dateStr: passDate,
                    verificationUrl: currentUrl || (typeof window !== 'undefined' ? window.location.href : ''),
                  })}
                  className="w-full mt-2 py-2 px-3 bg-[#E51E2B] hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download Pass QR</span>
                </button>
                <span className="text-[8px] text-neutral-400 font-sans block pt-1">
                  12-month stamp validity • Non-transferable
                </span>
              </div>
            </div>
          </div>


          {/* Action Navigation Footer */}
          <div className="mt-6 pt-5 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (navigate) navigate('/');
                else if (onExploreCatalog) onExploreCatalog();
                else window.location.href = '/';
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              ← Back to Storefront
            </button>

            <button
              type="button"
              onClick={() => {
                if (navigate) navigate('/account');
                else window.location.href = '/account';
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#E51E2B] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Access Member Account →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyPassView;

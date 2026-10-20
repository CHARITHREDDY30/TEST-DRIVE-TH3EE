import React, { useState, useEffect, useCallback } from 'react';
import {
  loyaltyService,
  type LoyaltySettings,
  DEFAULT_LOYALTY_SETTINGS
} from '../../services/loyalty.service';
import type { AuthUser } from '../../types/auth';

interface AdminLoyaltyManagerProps {
  currentUser: AuthUser | null;
  showNotification: (data: any) => void;
}

// Inline SVG icons
const Award = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const Check = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RefreshCw = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const Plus = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const Sliders = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const Shield = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const Package = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export const AdminLoyaltyManager: React.FC<AdminLoyaltyManagerProps> = ({
  currentUser,
  showNotification
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'claims' | 'ledger' | 'adjust' | 'audit' | 'settings'>('claims');
  const [loading, setLoading] = useState(false);

  // Data states
  const [stamps, setStamps] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; email: string; full_name: string }>>([]);

  // Settings state
  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_LOYALTY_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  // Manual adjustment form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [manualDelta, setManualDelta] = useState<number>(1);
  const [manualReason, setManualReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState<boolean>(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load all loyalty data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ledger, sets, custs] = await Promise.all([
        loyaltyService.adminGetFullLoyaltyLedger(),
        loyaltyService.getLoyaltySettings(),
        loyaltyService.adminGetAllCustomers()
      ]);
      setStamps(ledger.stamps);
      setClaims(ledger.claims);
      setAuditLogs(ledger.auditLogs);
      setSettings(sets);
      setCustomers(custs);
      if (custs.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custs[0].id);
      }
    } catch (err) {
      console.warn('Failed to load loyalty admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await loyaltyService.updateLoyaltySettings(settings);
      setSettings(updated);
      showNotification('Loyalty settings saved and published');
    } catch {
      showNotification({ type: 'error', message: 'Failed to update settings' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Manual Stamp Adjustment
  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showNotification({ type: 'error', message: 'Please select a customer.' });
      return;
    }
    if (!manualReason.trim()) {
      showNotification({ type: 'error', message: 'Mandatory reason is required for loyalty audit logging.' });
      return;
    }

    setAdjusting(true);
    const adminEmail = currentUser?.email || 'admin@th3ee.in';
    const result = await loyaltyService.adminAdjustStamps(
      selectedCustomerId,
      manualDelta,
      manualReason.trim(),
      adminEmail
    );
    setAdjusting(false);

    if (result.success) {
      showNotification(`Successfully adjusted ${manualDelta > 0 ? `+${manualDelta}` : manualDelta} stamps.`);
      setManualReason('');
      loadData();
    } else {
      showNotification({ type: 'error', message: result.error || 'Adjustment failed.' });
    }
  };

  // Handle Claim Status Update
  const handleUpdateClaimStatus = async (
    claimId: string,
    newStatus: 'claimed' | 'processing' | 'fulfilled' | 'cancelled'
  ) => {
    const res = await loyaltyService.adminUpdateClaimStatus(claimId, newStatus);
    if (res.success) {
      showNotification(`Reward claim updated to ${newStatus.toUpperCase()}`);
      loadData();
    } else {
      showNotification({ type: 'error', message: res.error || 'Update failed' });
    }
  };

  // Filtered stamps and claims
  const filteredStamps = stamps.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.customer_email || '').toLowerCase().includes(term) ||
      (s.order_number || '').toLowerCase().includes(term) ||
      (s.customers?.full_name || '').toLowerCase().includes(term)
    );
  });

  const filteredClaims = claims.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.claim_code || '').toLowerCase().includes(term) ||
      (c.customer_email || '').toLowerCase().includes(term) ||
      (c.selected_product_name || '').toLowerCase().includes(term) ||
      (c.customers?.full_name || '').toLowerCase().includes(term)
    );
  });

  const activeStampsCount = stamps.filter(s => s.status === 'active').length;
  const pendingClaimsCount = claims.filter(c => c.status === 'claimed' || c.status === 'processing').length;

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner & KPI Summary */}
      <div className="bg-neutral-900 text-white p-5 sm:p-6 border-2 border-neutral-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#E51E2B] rounded-xs" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#E51E2B]">
              ATELIER REWARD MANAGEMENT
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white mt-1">
            TH3EE REWARD CLUB COMMAND
          </h2>
          <p className="text-neutral-400 text-xs font-sans mt-0.5">
            Oversee collectible punchcards, fulfill unlocked free silhouettes, and maintain tamper-proof audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider border border-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-neutral-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-neutral-400 block">Programme Status</span>
          <span className={`text-base font-black uppercase mt-1 inline-block ${settings.enabled ? 'text-emerald-700' : 'text-red-700'}`}>
            {settings.enabled ? 'Active / Online' : 'Suspended'}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">7 stamps = 1 Cult Tee</span>
        </div>

        <div className="bg-white border border-neutral-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-neutral-400 block">Active Stamps</span>
          <span className="text-base font-black text-neutral-900 mt-1 inline-block">
            {activeStampsCount}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">Total across patrons</span>
        </div>

        <div className="bg-white border border-neutral-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-neutral-400 block">Reward Claims</span>
          <span className="text-base font-black text-neutral-900 mt-1 inline-block">
            {claims.length}
          </span>
          <span className="text-[10px] text-amber-600 block mt-0.5">{pendingClaimsCount} awaiting dispatch</span>
        </div>

        <div className="bg-white border border-neutral-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-neutral-400 block">Audit Log Entries</span>
          <span className="text-base font-black text-neutral-900 mt-1 inline-block">
            {auditLogs.length}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">Manual adjustments</span>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-neutral-200 overflow-x-auto gap-2 pb-0.5">
        {[
          { id: 'claims', label: `Reward Claims (${claims.length})`, icon: Package },
          { id: 'ledger', label: `Stamp Ledger (${stamps.length})`, icon: Award },
          { id: 'adjust', label: 'Manual Adjustment Tool', icon: Plus },
          { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: Shield },
          { id: 'settings', label: 'Club Settings', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-bold uppercase whitespace-nowrap flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
                isActive
                  ? 'border-[#E51E2B] text-[#E51E2B] bg-red-50/50'
                  : 'border-transparent text-neutral-600 hover:text-black hover:border-neutral-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. REWARD CLAIMS SUB-TAB */}
      {activeSubTab === 'claims' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-neutral-50 p-3 border border-neutral-200">
            <div>
              <h3 className="font-bold uppercase text-neutral-900">Patron Reward Claims Queue</h3>
              <p className="text-[11px] text-neutral-500 font-sans">
                Review unlocked customer free silhouettes and update dispatch fulfillment status.
              </p>
            </div>
            <input
              type="text"
              placeholder="Search by claim code or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-1.5 border border-neutral-300 bg-white font-mono text-xs w-full sm:w-64"
            />
          </div>

          {filteredClaims.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 bg-white border border-neutral-200">
              No reward claims found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim) => {
                const addr = claim.shipping_address || {};
                return (
                  <div key={claim.id} className="bg-white border-2 border-neutral-200 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[#E51E2B] font-mono">{claim.claim_code}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs ${
                          claim.status === 'fulfilled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : claim.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : claim.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        Claimed on {new Date(claim.claimed_at).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-neutral-400 block font-mono">Patron</span>
                        <p className="font-bold text-neutral-900 mt-0.5">{claim.customers?.full_name || 'Customer'}</p>
                        <p className="text-neutral-500 font-mono text-[11px]">{claim.customer_email}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-neutral-400 block font-mono">Reward Silhouette</span>
                        <p className="font-bold text-neutral-900 mt-0.5">{claim.selected_product_name || claim.reward_title}</p>
                        <p className="text-neutral-600">Size: <strong className="font-mono text-neutral-900">{claim.selected_size || 'L'}</strong> • Color: {claim.selected_color || 'Cult Colorway'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-neutral-400 block font-mono">Delivery Destination</span>
                        <p className="text-neutral-700 mt-0.5 text-[11px] leading-relaxed">
                          {addr.fullName ? <strong>{addr.fullName} • {addr.phone}<br /></strong> : null}
                          {addr.street || addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-neutral-500">
                        {claim.fulfilled_at && (
                          <span>Fulfilled on: <strong className="font-mono">{new Date(claim.fulfilled_at).toLocaleDateString('en-IN')}</strong></span>
                        )}
                        {claim.admin_notes && (
                          <span className="ml-2 font-italic">({claim.admin_notes})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {claim.status !== 'fulfilled' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateClaimStatus(claim.id, 'fulfilled')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Mark Fulfilled / Dispatched
                          </button>
                        )}
                        {claim.status === 'claimed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateClaimStatus(claim.id, 'processing')}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Mark In Processing
                          </button>
                        )}
                        {claim.status !== 'cancelled' && claim.status !== 'fulfilled' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateClaimStatus(claim.id, 'cancelled')}
                            className="px-2.5 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 font-bold uppercase transition-colors cursor-pointer"
                          >
                            Cancel Claim
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. STAMP LEDGER SUB-TAB */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-neutral-50 p-3 border border-neutral-200">
            <div>
              <h3 className="font-bold uppercase text-neutral-900">Authoritative Stamp Ledger</h3>
              <p className="text-[11px] text-neutral-500 font-sans">
                Each stamp is awarded exclusively upon confirmed order delivery and expires after 12 months.
              </p>
            </div>
            <input
              type="text"
              placeholder="Search by order # or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-1.5 border border-neutral-300 bg-white font-mono text-xs w-full sm:w-64"
            />
          </div>

          <div className="bg-white border border-neutral-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left divide-y divide-neutral-200">
              <thead className="bg-neutral-50 text-[10px] font-bold uppercase text-neutral-600">
                <tr>
                  <th className="px-4 py-3">Patron Email</th>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Order Total</th>
                  <th className="px-4 py-3">Earned At</th>
                  <th className="px-4 py-3">Expires At</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans text-xs">
                {filteredStamps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                      No stamps match search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStamps.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/60">
                      <td className="px-4 py-3 font-mono text-neutral-900 font-bold">{s.customer_email}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#E51E2B]">#{s.order_number}</td>
                      <td className="px-4 py-3">₹{Number(s.order_amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
                        {new Date(s.earned_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
                        {new Date(s.expires_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-xs ${
                          s.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'consumed'
                            ? 'bg-neutral-100 text-neutral-700'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MANUAL ADJUSTMENT TOOL SUB-TAB */}
      {activeSubTab === 'adjust' && (
        <div className="bg-white border-2 border-neutral-900 p-5 sm:p-6 max-w-xl space-y-4">
          <div>
            <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block">ADMIN ACTION</span>
            <h3 className="text-sm font-black uppercase text-neutral-900 mt-0.5">
              Manual Customer Stamp Adjustment
            </h3>
            <p className="text-xs text-neutral-500 font-sans mt-1">
              Issue courtesy stamps or deduct reversed delivery stamps. Every change is permanently recorded in the loyalty audit ledger.
            </p>
          </div>

          <form onSubmit={handleExecuteAdjustment} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-700 block">Select Target Patron *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50 focus:border-neutral-900 focus:outline-none font-mono"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || 'Customer'} — {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-700 block">Stamp Adjustment Delta *</label>
              <div className="flex gap-2">
                {[1, 2, 3, -1, -2].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setManualDelta(d)}
                    className={`flex-1 py-2 text-xs font-bold font-mono uppercase border transition-colors cursor-pointer ${
                      manualDelta === d
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-700 block">
                Mandatory Audit Reason *
              </label>
              <textarea
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="e.g. VIP patron courtesy compensation for courier delivery delay"
                required
                rows={3}
                className="w-full p-2 border border-neutral-300 font-sans text-xs focus:border-neutral-900 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-400 block font-sans">
                Audit compliance requires documenting reason and acting administrator identity.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={adjusting}
                className="w-full py-2.5 bg-[#E51E2B] hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {adjusting ? 'Committing Ledger Adjustment...' : `Commit Stamp Adjustment (${manualDelta > 0 ? `+${manualDelta}` : manualDelta})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. AUDIT LOGS HISTORY SUB-TAB */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-neutral-50 p-3 border border-neutral-200">
            <h3 className="font-bold uppercase text-neutral-900">Tamper-Proof Loyalty Audit Log</h3>
            <p className="text-[11px] text-neutral-500 font-sans">
              Permanent historical trail of administrative adjustments and rewards minted.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left divide-y divide-neutral-200">
              <thead className="bg-neutral-50 text-[10px] font-bold uppercase text-neutral-600">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Patron</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans text-xs">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                      No administrative adjustments recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/60">
                      <td className="px-4 py-3 font-mono text-neutral-500 text-[11px]">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                        {log.customers?.email || log.customer_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold font-mono text-[#E51E2B]">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 max-w-xs">{log.reason}</td>
                      <td className="px-4 py-3 font-mono text-neutral-600 text-[11px]">{log.performed_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CLUB CONFIGURATION SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white border-2 border-neutral-900 p-5 sm:p-6 max-w-xl space-y-4">
          <div>
            <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block">CONFIGURATION</span>
            <h3 className="text-sm font-black uppercase text-neutral-900 mt-0.5">
              TH3EE Reward Club Parameters
            </h3>
            <p className="text-xs text-neutral-500 font-sans mt-1">
              Global programme toggle and parameters saved to store settings.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#E51E2B]"
                />
                <div>
                  <span className="font-bold uppercase text-neutral-900 block">Enable TH3EE Reward Club</span>
                  <span className="text-[11px] text-neutral-500 font-sans block">
                    When active, patrons collect stamps on delivered orders and can redeem completed punchcards.
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-700 block">Stamps Per Reward *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.stampsPerReward}
                  onChange={(e) => setSettings({ ...settings, stampsPerReward: Number(e.target.value) })}
                  required
                  className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-neutral-700 block">Stamp Validity (Months) *</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={settings.validityMonths}
                  onChange={(e) => setSettings({ ...settings, validityMonths: Number(e.target.value) })}
                  required
                  className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-700 block">Reward Title *</label>
              <input
                type="text"
                value={settings.rewardTitle}
                onChange={(e) => setSettings({ ...settings, rewardTitle: e.target.value })}
                required
                className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 bg-[#E51E2B] hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{savingSettings ? 'Saving Settings...' : 'Save Loyalty Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminLoyaltyManager;

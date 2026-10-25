import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Check,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Upload,
  MessageCircle,
  Truck,
  DollarSign,
  Tag,
  RotateCw,
  Sliders,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';
import type {
  CustomRequest,
  CustomisationCatalogConfig,
  GarmentFitType
} from '../../types/customise';
import { customiseService } from '../../services/customise.service';

interface AdminCustomOrdersManagerProps {
  currentUser?: any;
  navigate: (path: string) => void;
  showNotification: (data: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export const AdminCustomOrdersManager: React.FC<AdminCustomOrdersManagerProps> = ({
  currentUser,
  navigate,
  showNotification
}) => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'catalog'>('requests');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail Modal / Drawer State
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Quotation Form State (Inside Detail Modal)
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteGarmentBase, setQuoteGarmentBase] = useState<number>(599);
  const [quotePrinting, setQuotePrinting] = useState<number>(150);
  const [quotePlacement, setQuotePlacement] = useState<number>(0);
  const [quoteArtwork, setQuoteArtwork] = useState<number>(0);
  const [quoteDiscount, setQuoteDiscount] = useState<number>(0);
  const [quoteShipping, setQuoteShipping] = useState<number>(49);
  const [quoteTax, setQuoteTax] = useState<number>(0);
  const [quoteLeadDays, setQuoteLeadDays] = useState<number>(5);
  const [quoteTerms, setQuoteTerms] = useState<string>('Standard 100% combed cotton high-definition DTF print.');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  // Digital Proof Upload State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [proofUploading, setProofUploading] = useState(false);

  // Status & Tracking Update State
  const [updateStatus, setUpdateStatus] = useState<string>('in_production');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Catalog Settings State
  const [catalog, setCatalog] = useState<CustomisationCatalogConfig | null>(null);
  const [catalogSaving, setCatalogSaving] = useState(false);

  // Load Requests
  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const records = await customiseService.getAllAdminRequests();
      setRequests(records);
    } catch (err: any) {
      if (!silent) showNotification({ type: 'error', message: err.message || 'Failed to load requests' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchRequests(false);
  }, [fetchRequests]);

  // Load Catalog Config
  useEffect(() => {
    async function loadCat() {
      try {
        const cat = await customiseService.getCatalog();
        setCatalog(cat);
      } catch (err) {
        console.warn('Catalog load warning:', err);
      }
    }
    loadCat();
  }, []);

  // Fetch full request details when row clicked
  const handleOpenDetail = async (req: CustomRequest) => {
    setDetailLoading(true);
    try {
      const full = await customiseService.getRequestByToken(req.trackingToken);
      if (full.success && full.request) {
        setSelectedRequest(full.request);
        setUpdateStatus(full.request.status);
        setAdminNotes(full.request.internalNotes || '');

        // Prepopulate quotation if existing or calculate baseline
        if (full.request.activeQuotation) {
          const q = full.request.activeQuotation;
          setQuoteGarmentBase(q.garmentBasePrice);
          setQuotePrinting(q.printingCharges);
          setQuotePlacement(q.placementCharges);
          setQuoteArtwork(q.artworkCharges);
          setQuoteDiscount(q.quantityDiscount);
          setQuoteShipping(q.shippingCharges);
          setQuoteTax(q.taxCharges);
          setQuoteLeadDays(q.estimatedProductionDays);
          setQuoteTerms(q.terms || '');
        } else {
          // Defaults based on quantity
          const basePerPiece = full.request.garmentCategory === 'Hoodie' ? 1299 : 599;
          const totalBase = basePerPiece * full.request.totalQuantity;
          const printPerPlacement = (full.request.placements?.length || 1) * 150 * full.request.totalQuantity;
          setQuoteGarmentBase(totalBase);
          setQuotePrinting(printPerPlacement);
          setQuotePlacement(0);
          setQuoteArtwork(0);
          setQuoteDiscount(0);
          setQuoteShipping(49);
          setQuoteTax(0);
        }
      } else {
        setSelectedRequest(req);
      }
    } catch (err) {
      setSelectedRequest(req);
    } finally {
      setDetailLoading(false);
    }
  };

  // Submit Quotation
  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setQuoteSubmitting(true);

    const subtotal = Number(quoteGarmentBase) + Number(quotePrinting) + Number(quotePlacement) + Number(quoteArtwork);
    const finalTotal = Math.max(0, subtotal - Number(quoteDiscount) + Number(quoteShipping) + Number(quoteTax));

    try {
      const res = await customiseService.createQuotation(selectedRequest.id, {
        garment_base_price: Number(quoteGarmentBase),
        printing_charges: Number(quotePrinting),
        placement_charges: Number(quotePlacement),
        artwork_charges: Number(quoteArtwork),
        quantity_discount: Number(quoteDiscount),
        other_fees: 0,
        shipping_charges: Number(quoteShipping),
        tax_charges: Number(quoteTax),
        subtotal,
        final_total: finalTotal,
        estimated_production_days: quoteLeadDays,
        terms: quoteTerms,
        created_by: currentUser?.email || 'admin@th3ee.in'
      });

      if (!res.success) throw new Error(res.error || 'Failed to record quote');

      showNotification({
        type: 'success',
        message: `Quotation v${res.version} sent to patron for ₹${finalTotal}!`
      });

      setIsQuoting(false);
      handleOpenDetail(selectedRequest);
      fetchRequests(true);
    } catch (err: any) {
      showNotification({ type: 'error', message: err.message || 'Quotation creation error' });
    } finally {
      setQuoteSubmitting(false);
    }
  };

  // Upload Digital Artwork Proof
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !proofFile) {
      showNotification({ type: 'error', message: 'Please select a digital proof mockup image.' });
      return;
    }

    setProofUploading(true);
    try {
      const uploadRes = await customiseService.uploadFile(proofFile, 'custom-proofs');
      const res = await customiseService.uploadProof(
        selectedRequest.id,
        uploadRes.url,
        uploadRes.key,
        proofNotes
      );

      if (!res.success) throw new Error(res.error || 'Proof record failed');

      showNotification({
        type: 'success',
        message: 'Digital artwork proof uploaded! Patron requested for approval.'
      });

      setProofFile(null);
      setProofNotes('');
      handleOpenDetail(selectedRequest);
      fetchRequests(true);
    } catch (err: any) {
      showNotification({ type: 'error', message: err.message || 'Proof upload error' });
    } finally {
      setProofUploading(false);
    }
  };

  // Update Status & Tracking
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setStatusUpdating(true);
    try {
      const res = await customiseService.updateAdminStatus(
        selectedRequest.id,
        updateStatus,
        adminNotes,
        trackingNumber,
        trackingUrl
      );

      if (!res.success) throw new Error(res.error || 'Status update failed');

      showNotification({
        type: 'success',
        message: `Order status moved to ${updateStatus.toUpperCase()}!`
      });

      handleOpenDetail(selectedRequest);
      fetchRequests(true);
    } catch (err: any) {
      showNotification({ type: 'error', message: err.message });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Filter Logic
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.primaryColor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Sub Tabs: Requests Ledger vs Customisation Matrix Settings */}
      <div className="flex items-center justify-between bg-neutral-50 p-2.5 border border-neutral-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('requests')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xs transition-colors ${
              activeSubTab === 'requests' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
            }`}
          >
            Custom Orders Ledger ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('catalog')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xs transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'catalog' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Fits, Specs & Measurements Matrix</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => fetchRequests(false)}
          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-200 rounded-xs transition-colors"
          title="Refresh Ledger"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SUB-TAB 1: REQUESTS LEDGER */}
      {/* ==================================================================== */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Request #, Patron Name, Email, or Blank Colour..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xs bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 text-xs border border-neutral-300 rounded-xs font-bold uppercase bg-white"
              >
                <option value="all">All Pipeline Stages</option>
                <option value="pending_review">Pending Review</option>
                <option value="under_review">Under Review</option>
                <option value="quotation_sent">Quotation Sent</option>
                <option value="awaiting_payment">Awaiting Payment</option>
                <option value="paid">Paid</option>
                <option value="artwork_approval_pending">Proof Awaiting Approval</option>
                <option value="in_production">In Production</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Requests Table */}
          <div className="border border-neutral-200 rounded-sm overflow-x-auto bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 border-r border-neutral-800">Request #</th>
                  <th className="py-2.5 px-3 border-r border-neutral-800">Patron Info</th>
                  <th className="py-2.5 px-3 border-r border-neutral-800">Silhouette Specs</th>
                  <th className="py-2.5 px-3 border-r border-neutral-800 text-center">Run Qty</th>
                  <th className="py-2.5 px-3 border-r border-neutral-800">Pipeline Status</th>
                  <th className="py-2.5 px-3 border-r border-neutral-800 text-right">Quote Total</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => handleOpenDetail(r)}
                      className="hover:bg-red-50/30 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-[#E51E2B] border-r border-neutral-200">
                        {r.requestNumber}
                      </td>
                      <td className="py-2.5 px-3 border-r border-neutral-200">
                        <strong className="block text-neutral-900 uppercase truncate max-w-[150px]">{r.customerName}</strong>
                        <span className="text-[10px] text-neutral-500 font-mono block">{r.customerPhone}</span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-neutral-200">
                        <span className="block font-bold text-neutral-900 uppercase">
                          {r.fit} {r.garmentCategory}
                        </span>
                        <span className="text-[10px] text-neutral-500 block truncate max-w-[180px]">
                          {r.primaryColor} • {r.gsm} • {r.sleeve}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-neutral-200 text-center font-bold">
                        {r.totalQuantity} pcs
                      </td>
                      <td className="py-2.5 px-3 border-r border-neutral-200">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-xs bg-neutral-100 text-neutral-800 border border-neutral-300">
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-neutral-200 text-right font-mono font-bold">
                        {r.activeQuotation ? `₹${r.activeQuotation.finalTotal}` : <span className="text-neutral-400 italic">Not Quoted</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-2.5 py-1 text-[10px] font-bold uppercase rounded-xs transition-colors"
                        >
                          Desk
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400 italic">
                      No customisation requests match your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: CATALOG MATRIX & MEASUREMENTS MANAGER */}
      {/* ==================================================================== */}
      {activeSubTab === 'catalog' && catalog && (
        <div className="bg-white border-2 border-neutral-900 p-5 rounded-sm space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase text-neutral-900">
                Custom Apparel Catalogue & Size Measurements Matrix
              </h3>
              <p className="text-[11px] text-neutral-500">
                Update fits, verified measurements by size, and base prices without code redeployment.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                setCatalogSaving(true);
                try {
                  const ok = await customiseService.saveCatalog(catalog);
                  if (ok) showNotification({ type: 'success', message: 'Catalogue settings saved successfully!' });
                  else throw new Error('Save failed');
                } catch (err: any) {
                  showNotification({ type: 'error', message: err.message });
                } finally {
                  setCatalogSaving(false);
                }
              }}
              disabled={catalogSaving}
              className="bg-[#E51E2B] hover:bg-black text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors shadow-xs"
            >
              {catalogSaving ? 'Saving...' : 'Save Catalogue Settings'}
            </button>
          </div>

          {/* Base Prices Config */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase text-neutral-800 block">
              Default Pricing Guidelines:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Base T-Shirt (₹)</label>
                <input
                  type="number"
                  value={catalog.basePrices.baseTshirt}
                  onChange={(e) => setCatalog({
                    ...catalog,
                    basePrices: { ...catalog.basePrices, baseTshirt: Number(e.target.value) }
                  })}
                  className="w-full p-2 border border-neutral-300 rounded-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Base Hoodie (₹)</label>
                <input
                  type="number"
                  value={catalog.basePrices.baseHoodie}
                  onChange={(e) => setCatalog({
                    ...catalog,
                    basePrices: { ...catalog.basePrices, baseHoodie: Number(e.target.value) }
                  })}
                  className="w-full p-2 border border-neutral-300 rounded-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Front Print Charge (₹)</label>
                <input
                  type="number"
                  value={catalog.basePrices.frontPrint}
                  onChange={(e) => setCatalog({
                    ...catalog,
                    basePrices: { ...catalog.basePrices, frontPrint: Number(e.target.value) }
                  })}
                  className="w-full p-2 border border-neutral-300 rounded-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Full Back Print (₹)</label>
                <input
                  type="number"
                  value={catalog.basePrices.fullPrint}
                  onChange={(e) => setCatalog({
                    ...catalog,
                    basePrices: { ...catalog.basePrices, fullPrint: Number(e.target.value) }
                  })}
                  className="w-full p-2 border border-neutral-300 rounded-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Fits & Measurements Matrix */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase text-neutral-800 block">
              Garment Fits ({catalog.fits.length}):
            </span>
            <div className="space-y-3">
              {catalog.fits.map((f, fIdx) => (
                <div key={f.id} className="p-3 border border-neutral-200 rounded-xs bg-neutral-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs uppercase text-neutral-900">{f.name}</strong>
                    <span className="text-[10px] text-[#E51E2B] font-bold">{f.tagline}</span>
                  </div>
                  <p className="text-[11px] text-neutral-600">{f.silhouette}</p>
                  <div className="text-[10px] text-neutral-500">
                    Chest: {f.measurements.map(m => `${m.size}:${m.chestIn}"`).join(' | ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DETAIL MODAL / DRAWER */}
      {/* ==================================================================== */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs font-mono">
          <div className="bg-white border-2 border-neutral-900 w-full max-w-4xl max-h-[94vh] overflow-y-auto p-5 sm:p-8 rounded-sm shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-200 mb-5">
              <div>
                <div className="inline-block bg-[#E51E2B] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 mb-1">
                  Custom Order Inspection
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight">
                  {selectedRequest.requestNumber}
                </h2>
                <span className="text-xs text-neutral-500">
                  Patron: <strong>{selectedRequest.customerName}</strong> ({selectedRequest.customerPhone}) • {selectedRequest.customerEmail}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Prefilled WhatsApp Contact Button */}
                <a
                  href={`https://wa.me/${selectedRequest.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hi ${selectedRequest.customerName}! This is TH3EE Tirupati Atelier regarding your custom apparel request ${selectedRequest.requestNumber}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Patron</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="p-1.5 text-neutral-500 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Garment Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6 bg-neutral-50 p-3.5 border border-neutral-200 rounded-sm">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Silhouette:</span>
                <strong className="text-neutral-900 uppercase">{selectedRequest.fit} {selectedRequest.garmentCategory}</strong>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Blank Color & GSM:</span>
                <strong className="text-neutral-900">{selectedRequest.primaryColor} • {selectedRequest.gsm}</strong>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Total Run Qty:</span>
                <strong className="text-[#E51E2B] font-black">{selectedRequest.totalQuantity} Pieces</strong>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Current Stage:</span>
                <strong className="text-neutral-900 uppercase">{selectedRequest.status.replace(/_/g, ' ')}</strong>
              </div>
            </div>

            {/* Uploaded Artwork Assets */}
            <div className="mb-6">
              <span className="text-xs font-bold uppercase text-neutral-900 block mb-2">
                Uploaded Patron Artwork & Reference Files ({(selectedRequest.files || []).length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {(selectedRequest.files || []).map((f, i) => (
                  <div key={i} className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs flex items-center justify-between">
                    <div className="truncate">
                      <span className="block font-bold text-neutral-900 truncate">{f.fileName}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">Placement: {f.targetPlacement || 'General'}</span>
                    </div>
                    <a
                      href={f.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E51E2B] hover:text-black p-1 shrink-0"
                      title="Download or Preview File"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* QUOTATION GENERATOR / EDITOR */}
            <div className="border-2 border-neutral-900 p-4 sm:p-5 rounded-sm mb-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#E51E2B]" />
                  <h3 className="text-xs font-black uppercase text-neutral-900">
                    Itemised Quotation Management
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuoting(!isQuoting)}
                  className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-3 py-1 text-[11px] font-bold uppercase transition-colors"
                >
                  {isQuoting ? 'Hide Quote Editor' : selectedRequest.activeQuotation ? 'Revise Quotation' : 'Create Quotation'}
                </button>
              </div>

              {isQuoting && (
                <form onSubmit={handleCreateQuotation} className="space-y-3 pt-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-0.5">Garment Blank Base (₹) *</label>
                      <input
                        type="number"
                        value={quoteGarmentBase}
                        onChange={(e) => setQuoteGarmentBase(Number(e.target.value))}
                        className="w-full p-2 border border-neutral-300 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-0.5">DTF Print Fees (₹) *</label>
                      <input
                        type="number"
                        value={quotePrinting}
                        onChange={(e) => setQuotePrinting(Number(e.target.value))}
                        className="w-full p-2 border border-neutral-300 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-0.5">Placement Charges (₹)</label>
                      <input
                        type="number"
                        value={quotePlacement}
                        onChange={(e) => setQuotePlacement(Number(e.target.value))}
                        className="w-full p-2 border border-neutral-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-0.5">Artwork Prep (₹)</label>
                      <input
                        type="number"
                        value={quoteArtwork}
                        onChange={(e) => setQuoteArtwork(Number(e.target.value))}
                        className="w-full p-2 border border-neutral-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-0.5">Volume Discount (₹)</label>
                      <input
                        type="number"
                        value={quoteDiscount}
                        onChange={(e) => setQuoteDiscount(Number(e.target.value))}
                        className="w-full p-2 border border-neutral-300 font-bold text-red-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-0.5">Shipping Charges (₹)</label>
                      <input
                        type="number"
                        value={quoteShipping}
                        onChange={(e) => setQuoteShipping(Number(e.target.value))}
                        className="w-full p-2 border border-neutral-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block mb-0.5">Production Days</label>
                      <input
                        type="number"
                        value={quoteLeadDays}
                        onChange={(e) => setQuoteLeadDays(Number(e.target.value))}
                        className="w-full p-2 border border-neutral-300 font-bold"
                      />
                    </div>
                    <div className="bg-red-50 p-2 border border-red-200 text-center flex flex-col justify-center">
                      <span className="text-[9px] font-bold uppercase text-[#E51E2B]">Payable Total</span>
                      <strong className="text-sm font-black text-neutral-900">
                        ₹{(quoteGarmentBase + quotePrinting + quotePlacement + quoteArtwork - quoteDiscount + quoteShipping).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={quoteSubmitting}
                      className="bg-[#E51E2B] hover:bg-black text-white px-6 py-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                    >
                      {quoteSubmitting ? 'Sending Quotation...' : 'Submit & Send Quotation to Patron'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* DIGITAL ARTWORK PROOF UPLOADER */}
            <div className="border border-neutral-200 p-4 rounded-sm mb-6 bg-neutral-50/50 space-y-3">
              <span className="text-xs font-bold uppercase text-neutral-900 block">
                Digital Production Proof (Mockup):
              </span>
              <form onSubmit={handleUploadProof} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="p-1 border border-neutral-300 rounded-xs bg-white text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Optional proof notes for customer..."
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  className="flex-1 p-2 border border-neutral-300 rounded-xs bg-white text-xs"
                />
                <button
                  type="submit"
                  disabled={proofUploading || !proofFile}
                  className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-4 py-2 text-xs font-bold uppercase rounded-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  {proofUploading ? 'Uploading...' : 'Send Proof'}
                </button>
              </form>
            </div>

            {/* STATUS & SHIPPING UPDATER */}
            <div className="border border-neutral-200 p-4 rounded-sm bg-white space-y-3">
              <span className="text-xs font-bold uppercase text-neutral-900 block">
                Update Production & Courier Stage:
              </span>
              <form onSubmit={handleUpdateStatusSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-neutral-500 font-bold uppercase block mb-0.5">Pipeline Status *</label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full p-2 border border-neutral-300 font-bold uppercase text-xs bg-white"
                    >
                      <option value="pending_review">Pending Review</option>
                      <option value="under_review">Under Review</option>
                      <option value="more_info_required">More Info Required</option>
                      <option value="quotation_sent">Quotation Sent</option>
                      <option value="awaiting_payment">Awaiting Payment</option>
                      <option value="paid">Paid</option>
                      <option value="artwork_approval_pending">Artwork Approval Pending</option>
                      <option value="in_production">In Production</option>
                      <option value="ready_for_dispatch">Ready for Dispatch</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 font-bold uppercase block mb-0.5">Courier Tracking #</label>
                    <input
                      type="text"
                      placeholder="e.g. DTDC19283748"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full p-2 border border-neutral-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 font-bold uppercase block mb-0.5">Tracking URL</label>
                    <input
                      type="text"
                      placeholder="https://track.dtdc.com/..."
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full p-2 border border-neutral-300 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={statusUpdating}
                    className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors"
                  >
                    {statusUpdating ? 'Updating...' : 'Update Status & Log Timeline'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomOrdersManager;

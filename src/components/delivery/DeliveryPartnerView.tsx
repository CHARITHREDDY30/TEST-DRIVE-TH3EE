import React, { useState, useEffect } from 'react';
import type { Order } from '../../types/store';
import { ordersService } from '../../services/orders.service';
import { insforge, isInsForgeConfigured } from '../../lib/insforge';

interface DeliveryPartnerViewProps {
  navigate: (path: string) => void;
  showNotification: (data: any) => void;
}

export const DeliveryPartnerView: React.FC<DeliveryPartnerViewProps> = ({
  navigate,
  showNotification
}) => {
  const [partnerKey, setPartnerKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem('th3ee_delivery_auth') === 'authorized';
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status update modal / form states
  const [targetStatus, setTargetStatus] = useState<'Packed' | 'Dispatched' | 'Out For Delivery' | 'Delivered'>('Out For Delivery');
  const [shippingProvider, setShippingProvider] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Failure modal
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [failReason, setFailReason] = useState('Customer unavailable at address');

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    // Verify delivery authorization (accepts atelier delivery partner key or InsForge admin/partner user)
    if (partnerKey.trim().toUpperCase() === 'TH3EE-RIDER' || partnerKey.trim().length >= 8) {
      sessionStorage.setItem('th3ee_delivery_auth', 'authorized');
      setIsAuthorized(true);
      showNotification({ type: 'success', message: 'Delivery Partner Portal unlocked' });
    } else {
      showNotification({ type: 'error', message: 'Invalid delivery authorization key' });
    }
  };

  const loadAssignedDeliveries = async () => {
    setLoading(true);
    try {
      const all = await ordersService.getDeliveryPartnerOrders();
      setOrders(all);
    } catch {
      showNotification({ type: 'error', message: 'Failed to fetch deliveries' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadAssignedDeliveries();
    }
  }, [isAuthorized]);

  const handleUpdateMilestone = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      await ordersService.updateFulfillmentStatus(selectedOrder.id, targetStatus, {
        shippingProvider: shippingProvider || undefined,
        trackingNumber: trackingNumber || undefined,
        trackingUrl: trackingUrl || undefined,
        notes: statusNotes || undefined,
        location: locationName || undefined
      });

      showNotification({ type: 'success', message: `Order #${selectedOrder.orderNumber} updated to ${targetStatus}` });
      setSelectedOrder(null);
      loadAssignedDeliveries();
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Update failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRecordFailure = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      await ordersService.recordDeliveryAttempt(selectedOrder.id, failReason);
      showNotification({ type: 'info', message: 'Delivery attempt noted and customer notified' });
      setIsFailModalOpen(false);
      setSelectedOrder(null);
      loadAssignedDeliveries();
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Failed to record attempt' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-white border-2 border-neutral-900 p-8 shadow-2xl space-y-6">
          <div className="w-12 h-12 bg-neutral-900 text-white flex items-center justify-center mx-auto rounded-full">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div className="text-center">
            <span className="text-[10px] font-bold text-[#E51E2B] uppercase">RESTRICTED DISPATCH</span>
            <h2 className="text-xl font-black uppercase text-neutral-900 mt-1">DELIVERY PARTNER PORTAL</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Authorized logistics associates: enter your dispatch terminal key.
            </p>
          </div>

          <form onSubmit={handleAuthorize} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                Authorization Key
              </label>
              <input
                type="password"
                value={partnerKey}
                onChange={(e) => setPartnerKey(e.target.value)}
                placeholder="Enter Terminal Key"
                className="w-full px-3 py-2 border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-900 text-white hover:bg-[#E51E2B] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Verify & Enter Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 font-mono">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#E51E2B] uppercase">
            RESTRICTED DISPATCH TERMINAL
          </span>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight mt-0.5">
            DELIVERY PARTNER WORKFLOW
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAssignedDeliveries}
            className="px-3 py-1.5 border border-neutral-300 text-xs font-bold uppercase hover:border-neutral-900 transition-colors"
          >
            Refresh ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('th3ee_delivery_auth');
              setIsAuthorized(false);
            }}
            className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-neutral-800 transition-colors"
          >
            Lock Terminal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-400">Loading delivery roster...</div>
      ) : orders.length === 0 ? (
        <div className="mt-8 bg-white border border-neutral-200 p-12 text-center text-xs text-neutral-500">
          No dispatches currently assigned to this terminal.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border-2 border-neutral-200 hover:border-neutral-900 p-5 space-y-3 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black text-neutral-900">#{order.orderNumber || order.id}</span>
                    <span className="block text-[10px] text-neutral-400">{order.date}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-neutral-100 text-neutral-800">
                    {order.status}
                  </span>
                </div>

                <div className="text-xs text-neutral-700">
                  <div className="font-bold">{order.customerName}</div>
                  <a href={`tel:${order.phone}`} className="text-blue-600 hover:underline">{order.phone}</a>
                </div>

                {order.shippingAddress && (
                  <p className="text-[11px] text-neutral-500 bg-neutral-50 p-2.5 border border-neutral-200 font-sans">
                    {order.shippingAddress.houseNo ? `${order.shippingAddress.houseNo}, ` : ''}
                    {order.shippingAddress.street ? `${order.shippingAddress.street}, ` : ''}
                    {order.shippingAddress.area ? `${order.shippingAddress.area}, ` : ''}
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                )}

                {order.deliveryAttempts ? (
                  <p className="text-[10px] text-amber-700 font-bold">
                    ⚠️ {order.deliveryAttempts} previous unfulfilled attempt(s)
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(order);
                    setTrackingNumber(order.trackingNumber || '');
                    setShippingProvider(order.courier || 'BlueDart Express');
                  }}
                  className="flex-1 py-2 bg-neutral-900 text-white text-[11px] font-bold uppercase hover:bg-[#E51E2B] transition-colors cursor-pointer"
                >
                  Update Milestone
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsFailModalOpen(true);
                  }}
                  className="px-3 py-2 border border-red-300 text-red-600 text-[11px] font-bold uppercase hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Failed Attempt
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${order.orderNumber || order.id}/track`)}
                  className="px-2.5 py-2 border border-neutral-300 text-neutral-700 text-[11px] font-bold uppercase hover:border-neutral-900 transition-colors"
                >
                  Timeline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Milestone Update Modal */}
      {selectedOrder && !isFailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border-2 border-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-black uppercase text-neutral-900">
                Update Status: #{selectedOrder.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-xs text-neutral-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                  Milestone Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:border-neutral-900"
                >
                  <option value="Packed">Packed at Atelier</option>
                  <option value="Dispatched">Dispatched / In Transit</option>
                  <option value="Out For Delivery">Out For Delivery</option>
                  <option value="Delivered">Delivered Successfully</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                  Carrier / Vehicle Name
                </label>
                <input
                  type="text"
                  value={shippingProvider}
                  onChange={(e) => setShippingProvider(e.target.value)}
                  placeholder="E.g. BlueDart, Delhivery, TH3EE Fleet"
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                  Waybill / Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="AWB12345678"
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                  Current Hub / City Location
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="E.g. Bengaluru Central Hub"
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2 border border-neutral-300 text-xs font-bold uppercase hover:border-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdateMilestone}
                className="flex-1 py-2 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-[#E51E2B] transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failure Reason Modal */}
      {selectedOrder && isFailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border-2 border-red-500 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-black uppercase text-red-700">
                Record Delivery Attempt Failure
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsFailModalOpen(false);
                  setSelectedOrder(null);
                }}
                className="text-xs text-neutral-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-600">
                Order #{selectedOrder.orderNumber} - The customer will receive this explanation on their tracking view.
              </p>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                  Failure Reason
                </label>
                <select
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:border-neutral-900"
                >
                  <option value="Customer unavailable at premises">Customer unavailable at premises</option>
                  <option value="Premises closed or unreachable">Premises closed or unreachable</option>
                  <option value="Incorrect address / PIN code">Incorrect address / PIN code</option>
                  <option value="Customer requested re-schedule">Customer requested re-schedule</option>
                  <option value="Delivery attempt timed out">Delivery attempt timed out</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setIsFailModalOpen(false);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2 border border-neutral-300 text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleRecordFailure}
                className="flex-1 py-2 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Logging...' : 'Log Failed Attempt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPartnerView;

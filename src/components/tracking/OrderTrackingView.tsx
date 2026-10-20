import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { Order, OrderTrackingEvent } from '../../types/store';
import { ordersService } from '../../services/orders.service';

interface OrderTrackingViewProps {
  orderIdentifier: string;
  navigate: (path: string) => void;
  showNotification: (data: any) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orderIdentifier,
  navigate,
  showNotification
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderTrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(orderIdentifier || '');

  const loadOrderAndTimeline = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const ord = await ordersService.getOrderByIdOrNumber(id);
      setOrder(ord);

      if (ord) {
        const timeline = await ordersService.getOrderTrackingTimeline(ord.id);
        setEvents(timeline);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Failed to load tracking data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderIdentifier) {
      setSearchInput(orderIdentifier);
      loadOrderAndTimeline(orderIdentifier);
    }
  }, [orderIdentifier]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/orders/${searchInput.trim()}/track`);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver')) {
      return <span className="px-2.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase">Delivered</span>;
    }
    if (s.includes('out_for_delivery') || s.includes('out for delivery')) {
      return <span className="px-2.5 py-0.5 text-[10px] bg-indigo-100 text-indigo-800 font-bold uppercase">Out For Delivery</span>;
    }
    if (s.includes('dispatch') || s.includes('shipped')) {
      return <span className="px-2.5 py-0.5 text-[10px] bg-purple-100 text-purple-800 font-bold uppercase">Dispatched</span>;
    }
    if (s.includes('packed')) {
      return <span className="px-2.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold uppercase">Packed</span>;
    }
    if (s.includes('process') || s.includes('production')) {
      return <span className="px-2.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 font-bold uppercase">In Production</span>;
    }
    if (s.includes('cancel')) {
      return <span className="px-2.5 py-0.5 text-[10px] bg-red-100 text-red-800 font-bold uppercase">Cancelled</span>;
    }
    return <span className="px-2.5 py-0.5 text-[10px] bg-neutral-100 text-neutral-800 font-bold uppercase">Received</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 font-mono">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#E51E2B] uppercase">
            ATELIER LOGISTICS
          </span>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight mt-0.5">
            ORDER & DISPATCH TRACKING
          </h1>
        </div>

        <button
          type="button"
          onClick={() => navigate('/account')}
          className="text-xs font-bold uppercase text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>← Back to Account</span>
        </button>
      </div>

      {/* Search Bar for Lookups */}
      <form onSubmit={handleSearchSubmit} className="mt-6 flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Enter Order Number or ID (e.g. TH3EE-12345)"
          className="flex-1 px-4 py-2.5 border-2 border-neutral-300 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-neutral-900"
        />
        <button
          type="submit"
          className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-[#E51E2B] transition-colors cursor-pointer"
        >
          Track
        </button>
      </form>

      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-400 space-y-2">
          <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Retrieving verified logistics logs...</p>
        </div>
      ) : !order ? (
        <div className="mt-8 bg-white border-2 border-neutral-900 p-8 text-center space-y-3">
          <h3 className="text-sm font-bold uppercase text-neutral-900">Order Record Not Found</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            We could not find an order matching identifier "{searchInput}". Please verify the order number on your confirmation receipt.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Order Overview Card */}
          <div className="bg-white border-2 border-neutral-900 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-neutral-200">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase">IDENTIFIER</span>
                <div className="text-base font-black text-neutral-900">#{order.orderNumber || order.id}</div>
                <div className="text-xs text-neutral-500 mt-0.5">Placed on {order.date}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(order.status)}
                {order.paymentStatus === 'paid' ? (
                  <span className="px-2.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase">
                    Paid
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold uppercase">
                    Payment Pending
                  </span>
                )}
              </div>
            </div>

            {/* Courier & External Tracking Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">COURIER PARTNER</span>
                <span className="font-bold text-neutral-900">{order.courier || 'TH3EE Atelier Dispatch'}</span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">TRACKING NUMBER / WAYBILL</span>
                {order.trackingNumber ? (
                  <span className="font-mono font-bold text-neutral-900">{order.trackingNumber}</span>
                ) : (
                  <span className="text-neutral-500">Assigning upon courier pickup</span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">DIRECT TRACKING LINK</span>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#E51E2B] hover:underline flex items-center gap-1"
                  >
                    <span>Carrier Portal</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                ) : (
                  <span className="text-neutral-400">Direct courier link unavailable</span>
                )}
              </div>
            </div>

            {/* Delivery Destination */}
            {order.shippingAddress && (
              <div className="pt-3 border-t border-neutral-100 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase block mb-1">DELIVERY DESTINATION</span>
                <p className="text-neutral-700">
                  <span className="font-bold">{order.customerName}</span> ({order.phone})
                  <br />
                  {order.shippingAddress.houseNo ? `${order.shippingAddress.houseNo}, ` : ''}
                  {order.shippingAddress.street ? `${order.shippingAddress.street}, ` : ''}
                  {order.shippingAddress.area ? `${order.shippingAddress.area}, ` : ''}
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                </p>
              </div>
            )}
          </div>

          {/* Chronological Milestone Timeline */}
          <div className="bg-white border-2 border-neutral-900 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 pb-3 border-b border-neutral-200">
              LOGISTICS TIMELINE ({events.length} EVENTS RECORDED)
            </h2>

            {events.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Awaiting logistics scan events from dispatch desk.
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                {events.map((ev, idx) => {
                  const isLatest = idx === events.length - 1;
                  const isNegative = ev.status.includes('fail') || ev.status.includes('cancel');

                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative space-y-1"
                    >
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -left-6 sm:-left-8 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${
                          isNegative
                            ? 'bg-red-500'
                            : isLatest
                            ? 'bg-[#E51E2B] animate-pulse'
                            : 'bg-neutral-900'
                        }`}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-xs font-bold uppercase text-neutral-900 tracking-wider">
                          {ev.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(ev.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {ev.message && (
                        <p className="text-xs text-neutral-600 leading-relaxed font-sans">{ev.message}</p>
                      )}

                      {ev.location && (
                        <p className="text-[10px] text-neutral-400 uppercase">Location: {ev.location}</p>
                      )}

                      {ev.trackingNumber && (
                        <p className="text-[10px] text-neutral-500 font-mono">
                          Waybill: {ev.trackingNumber} {ev.carrierName ? `via ${ev.carrierName}` : ''}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingView;

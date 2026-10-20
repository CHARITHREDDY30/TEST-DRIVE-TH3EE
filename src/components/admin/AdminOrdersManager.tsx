import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Order, OrderTrackingEvent } from '../../types/store';
import { ordersService } from '../../services/orders.service';
import { onCatalogSync } from '../../services/catalogSync';
import { resolveProductImageUrl, handleImageLoadError } from '../../lib/r2';

interface AdminOrdersManagerProps {
  ordersList?: Order[];
  setOrdersList?: React.Dispatch<React.SetStateAction<Order[]>>;
  currentUser?: any;
  navigate: (path: string) => void;
  showNotification: (data: any) => void;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  ordersList: propOrdersList,
  setOrdersList: propSetOrdersList,
  currentUser,
  navigate,
  showNotification
}) => {
  const [internalOrders, setInternalOrders] = useState<Order[]>(propOrdersList || []);
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all'); // 'all' | 'today' | 'yesterday' | '7days' | '30days'

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderTimeline, setOrderTimeline] = useState<OrderTrackingEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states inside order detail modal
  const [modalStatus, setModalStatus] = useState<string>('Confirmed');
  const [modalCourier, setModalCourier] = useState<string>('');
  const [modalTrackingNumber, setModalTrackingNumber] = useState<string>('');
  const [modalTrackingUrl, setModalTrackingUrl] = useState<string>('');
  const [modalAdminNotes, setModalAdminNotes] = useState<string>('');

  // Cancellation modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');

  const orders = propOrdersList && propOrdersList.length > 0 ? propOrdersList : internalOrders;

  // Fetch orders from InsForge database
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const records = await ordersService.getOrders();
      if (Array.isArray(records)) {
        setInternalOrders(records);
        if (propSetOrdersList) {
          propSetOrdersList(records);
        }
      }
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      if (!silent) {
        showNotification({ type: 'error', message: err?.message || 'Failed to fetch orders.' });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [propSetOrdersList, showNotification]);

  // Initial load
  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  // Periodic heartbeat polling (every 6 seconds while admin desk is active)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchOrders(true);
    }, 6000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  // Listen to cross-tab & real-time catalog/order events
  useEffect(() => {
    const unsubscribe = onCatalogSync((event) => {
      if (event.type === 'ORDER_PLACED' || event.type === 'ORDER_UPDATED' || event.type === 'CATALOG_UPDATED') {
        fetchOrders(true);
      }
    });
    return unsubscribe;
  }, [fetchOrders]);

  // Load timeline when modal opens for selected order
  const handleOpenDetail = async (order: Order) => {
    setSelectedOrder(order);
    setModalStatus(order.status || 'Confirmed');
    setModalCourier(order.courier || '');
    setModalTrackingNumber(order.trackingNumber || '');
    setModalTrackingUrl(order.trackingUrl || '');
    setModalAdminNotes(order.deliveryNotes || order.adminNotes || '');

    setTimelineLoading(true);
    try {
      const timeline = await ordersService.getOrderTrackingTimeline(order.id);
      setOrderTimeline(timeline);
    } catch {
      setOrderTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return orders.filter((ord) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (ord.orderNumber && ord.orderNumber.toLowerCase().includes(q)) ||
        (ord.id && ord.id.toLowerCase().includes(q)) ||
        (ord.customerName && ord.customerName.toLowerCase().includes(q)) ||
        (ord.customerEmail && ord.customerEmail.toLowerCase().includes(q)) ||
        (ord.phone && ord.phone.includes(q)) ||
        (ord.items && ord.items.toLowerCase().includes(q)) ||
        (ord.paymentId && ord.paymentId.toLowerCase().includes(q)) ||
        (ord.razorpayOrderId && ord.razorpayOrderId.toLowerCase().includes(q));

      // 2. Payment Status Filter
      const p = filterPayment.toLowerCase();
      const matchesPayment =
        p === 'all' ||
        (p === 'paid' && (ord.paymentStatus || '').toLowerCase() === 'paid') ||
        (p === 'unpaid' && (ord.paymentStatus || '').toLowerCase() !== 'paid') ||
        (p === 'failed' && (ord.paymentStatus || '').toLowerCase() === 'failed');

      // 3. Fulfilment & Delivery Status Filter
      const s = filterStatus.toLowerCase();
      const ordStatus = (ord.status || 'received').toLowerCase();
      const ordDeliv = (ord.deliveryStatus || ordStatus).toLowerCase();
      const matchesStatus =
        s === 'all' ||
        ordStatus === s ||
        ordDeliv === s ||
        (s === 'confirmed' && (ordStatus === 'confirmed' || ordDeliv.includes('confirm'))) ||
        (s === 'processing' && (ordStatus === 'processing' || ordStatus === 'in production' || ordDeliv.includes('production') || ordDeliv.includes('process'))) ||
        (s === 'packed' && (ordStatus === 'packed' || ordDeliv.includes('pack'))) ||
        (s === 'shipped' && (ordStatus === 'shipped' || ordStatus === 'dispatched' || ordDeliv.includes('ship') || ordDeliv.includes('dispatch'))) ||
        (s === 'out_for_delivery' && (ordStatus === 'out for delivery' || ordDeliv.includes('out'))) ||
        (s === 'delivered' && (ordStatus === 'delivered' || ordDeliv.includes('deliver'))) ||
        (s === 'cancelled' && (ordStatus === 'cancelled' || ordDeliv.includes('cancel')));

      // 4. Date Filter
      let matchesDate = true;
      if (filterDate !== 'all' && ord.createdAt) {
        const ordDate = new Date(ord.createdAt);
        const ordDateStr = ordDate.toISOString().slice(0, 10);

        if (filterDate === 'today') {
          matchesDate = ordDateStr === todayStr;
        } else if (filterDate === 'yesterday') {
          matchesDate = ordDateStr === yesterday;
        } else if (filterDate === '7days') {
          matchesDate = ordDate >= sevenDaysAgo;
        } else if (filterDate === '30days') {
          matchesDate = ordDate >= thirtyDaysAgo;
        }
      }

      return matchesSearch && matchesPayment && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, filterPayment, filterStatus, filterDate]);

  // Save updated fulfillment & delivery details
  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const adminEmail = currentUser?.email || 'admin@th3ee.in';

      await ordersService.updateFulfillmentStatus(selectedOrder.id, modalStatus, {
        shippingProvider: modalCourier.trim() || undefined,
        trackingNumber: modalTrackingNumber.trim() || undefined,
        trackingUrl: modalTrackingUrl.trim() || undefined,
        notes: modalAdminNotes.trim() || undefined,
        deliveryStatus: modalStatus,
        updatedBy: adminEmail
      });

      // Update in local state
      const updatedList = orders.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: modalStatus,
              deliveryStatus: modalStatus,
              courier: modalCourier.trim() || undefined,
              trackingNumber: modalTrackingNumber.trim() || undefined,
              trackingUrl: modalTrackingUrl.trim() || undefined,
              deliveryNotes: modalAdminNotes.trim() || undefined
            }
          : o
      );

      setInternalOrders(updatedList);
      if (propSetOrdersList) propSetOrdersList(updatedList);

      showNotification({
        type: 'success',
        message: `Order #${selectedOrder.orderNumber || selectedOrder.id} updated to ${modalStatus}`
      });

      // Refresh order list and timeline
      await fetchOrders(true);
      setSelectedOrder(null);
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Failed to update order status.' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancel order execution
  const handleExecuteCancel = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const adminEmail = currentUser?.email || 'admin@th3ee.in';
      await ordersService.updateFulfillmentStatus(selectedOrder.id, 'Cancelled', {
        notes: cancelReason.trim(),
        deliveryStatus: 'Cancelled',
        updatedBy: adminEmail
      });

      const updatedList = orders.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, status: 'Cancelled', deliveryStatus: 'Cancelled', deliveryNotes: cancelReason.trim() }
          : o
      );

      setInternalOrders(updatedList);
      if (propSetOrdersList) propSetOrdersList(updatedList);

      showNotification({
        type: 'info',
        message: `Order #${selectedOrder.orderNumber || selectedOrder.id} marked as cancelled.`
      });

      setIsCancelModalOpen(false);
      setSelectedOrder(null);
      await fetchOrders(true);
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Cancellation failed.' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Export full CSV report
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showNotification({ type: 'error', message: 'No orders available to export.' });
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Email',
      'Phone',
      'Items Ordered',
      'Subtotal',
      'Discount',
      'Shipping',
      'Order Total',
      'Payment Status',
      'Razorpay Payment ID',
      'Fulfilment Status',
      'Delivery Status',
      'Courier Partner',
      'Tracking AWB',
      'Tracking URL',
      'Delivery Notes'
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || o.id}"`,
      `"${o.date || o.createdAt}"`,
      `"${o.customerName}"`,
      `"${o.customerEmail || ''}"`,
      `"${o.phone}"`,
      `"${(o.items || '').replace(/"/g, '""')}"`,
      o.subtotal || o.total,
      o.discountAmount || 0,
      o.shippingAmount || 0,
      o.total,
      `"${o.paymentStatus || 'unpaid'}"`,
      `"${o.paymentId || o.razorpayPaymentId || ''}"`,
      `"${o.status}"`,
      `"${o.deliveryStatus || o.status}"`,
      `"${o.courier || ''}"`,
      `"${o.trackingNumber || ''}"`,
      `"${o.trackingUrl || ''}"`,
      `"${(o.deliveryNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `th3ee_atelier_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification({ type: 'success', message: 'Orders CSV report exported successfully.' });
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Overview Banner */}
      <div className="bg-neutral-50 p-4 border border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
              ATELIER ORDER DISPATCH & FULFILLMENT DESK
            </h2>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Real-time verified online orders, automated Razorpay payment status, courier tracking waybills, and patron audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => fetchOrders(false)}
            disabled={loading}
            className="px-3 py-1.5 border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reload all orders from InsForge"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-[#E51E2B] transition-colors cursor-pointer"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Real-time Order Counts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-neutral-200">
          <span className="text-[10px] font-bold uppercase text-neutral-400 block">Total Orders</span>
          <p className="text-lg font-black text-neutral-900 mt-0.5">{orders.length}</p>
        </div>
        <div className="p-3 bg-emerald-50/60 border border-emerald-200">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Paid Orders</span>
          <p className="text-lg font-black text-emerald-800 mt-0.5">
            {orders.filter((o) => (o.paymentStatus || '').toLowerCase() === 'paid').length}
          </p>
        </div>
        <div className="p-3 bg-blue-50/60 border border-blue-200">
          <span className="text-[10px] font-bold uppercase text-blue-700 block">In Production / Transit</span>
          <p className="text-lg font-black text-blue-800 mt-0.5">
            {
              orders.filter((o) => {
                const s = (o.status || '').toLowerCase();
                return s === 'confirmed' || s === 'processing' || s === 'packed' || s === 'shipped' || s === 'out_for_delivery';
              }).length
            }
          </p>
        </div>
        <div className="p-3 bg-purple-50/60 border border-purple-200">
          <span className="text-[10px] font-bold uppercase text-purple-700 block">Delivered</span>
          <p className="text-lg font-black text-purple-800 mt-0.5">
            {orders.filter((o) => (o.status || '').toLowerCase() === 'delivered').length}
          </p>
        </div>
      </div>

      {/* Search & Multi-Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 border border-neutral-200 shadow-2xs">
        {/* Search */}
        <div>
          <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
            Search Identifier / Customer
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Order #, Name, Mobile, AWB..."
            className="w-full px-3 py-1.5 border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900"
          />
        </div>

        {/* Date Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
            Order Date
          </label>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-neutral-300 bg-white text-xs focus:outline-none focus:border-neutral-900"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
            Payment Status
          </label>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full px-3 py-1.5 border border-neutral-300 bg-white text-xs focus:outline-none focus:border-neutral-900"
          >
            <option value="all">All Payment States</option>
            <option value="paid">Paid (Verified)</option>
            <option value="unpaid">Unpaid / Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Delivery / Fulfilment Status Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
            Fulfilment / Delivery Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-1.5 border border-neutral-300 bg-white text-xs focus:outline-none focus:border-neutral-900"
          >
            <option value="all">All Delivery States</option>
            <option value="confirmed">Order Confirmed</option>
            <option value="processing">Processing (In Production)</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped (Dispatched)</option>
            <option value="out_for_delivery">Out For Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="bg-white border border-neutral-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-wider">
              <th className="p-3 border-b border-neutral-800">Order Number</th>
              <th className="p-3 border-b border-neutral-800">Order Date</th>
              <th className="p-3 border-b border-neutral-800">Customer Name</th>
              <th className="p-3 border-b border-neutral-800">Mobile Number</th>
              <th className="p-3 border-b border-neutral-800">Ordered Products</th>
              <th className="p-3 border-b border-neutral-800">Order Total</th>
              <th className="p-3 border-b border-neutral-800">Payment Status</th>
              <th className="p-3 border-b border-neutral-800">Fulfilment Status</th>
              <th className="p-3 border-b border-neutral-800">Delivery Status</th>
              <th className="p-3 border-b border-neutral-800 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-xs text-neutral-400">
                  {loading ? 'Loading orders from InsForge...' : 'No orders match the selected filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
                const isFailed = (order.paymentStatus || '').toLowerCase() === 'failed';
                const rawItems = order.orderItems || [];
                const firstItemImg =
                  rawItems[0]?.image_url ||
                  rawItems[0]?.thumbnail ||
                  (rawItems[0]?.images && rawItems[0]?.images[0]) ||
                  '';

                const displayDelivery = order.deliveryStatus || order.status || 'Order confirmed';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-neutral-50/80 transition-colors text-xs"
                  >
                    {/* 1. Order Number */}
                    <td className="p-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(order)}
                        className="text-[#E51E2B] hover:underline cursor-pointer font-black"
                      >
                        #{order.orderNumber || order.id}
                      </button>
                    </td>

                    {/* 2. Order Date */}
                    <td className="p-3 text-neutral-600 whitespace-nowrap">
                      <div>{order.date}</div>
                      {order.createdAt && (
                        <span className="text-[10px] text-neutral-400 block">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </td>

                    {/* 3. Customer Name */}
                    <td className="p-3">
                      <div className="font-bold text-neutral-900 truncate max-w-[140px]">
                        {order.customerName}
                      </div>
                      {order.customerEmail && (
                        <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">
                          {order.customerEmail}
                        </div>
                      )}
                    </td>

                    {/* 4. Mobile Number */}
                    <td className="p-3 font-mono text-neutral-700 whitespace-nowrap">
                      {order.phone || '—'}
                    </td>

                    {/* 5. Ordered Products */}
                    <td className="p-3 max-w-[240px]">
                      <div className="flex items-center gap-2">
                        {firstItemImg ? (
                          <img
                            src={resolveProductImageUrl(firstItemImg)}
                            onError={handleImageLoadError}
                            alt=""
                            className="w-8 h-10 object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-10 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[9px] text-neutral-400 shrink-0">
                            TH3EE
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-bold text-neutral-900 text-[11px]">
                            {order.items}
                          </p>
                          {rawItems.length > 1 && (
                            <span className="text-[10px] text-neutral-400">
                              +{rawItems.length - 1} more item{rawItems.length > 2 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 6. Order Total */}
                    <td className="p-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                      ₹{Number(order.total).toLocaleString('en-IN')}
                    </td>

                    {/* 7. Payment Status (Separate Column) */}
                    <td className="p-3 whitespace-nowrap">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 uppercase bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>PAID</span>
                        </span>
                      ) : isFailed ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 uppercase bg-red-50 text-red-700 border border-red-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          <span>FAILED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 uppercase bg-amber-50 text-amber-800 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>UNPAID</span>
                        </span>
                      )}
                      {order.paymentId && (
                        <span className="text-[9px] font-mono text-neutral-400 block mt-0.5 truncate max-w-[100px]">
                          {order.paymentId}
                        </span>
                      )}
                    </td>

                    {/* 8. Fulfilment Status */}
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 uppercase block w-fit ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'Out For Delivery' || order.status === 'Dispatched' || order.status === 'Shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status === 'Packed'
                            ? 'bg-amber-100 text-amber-800'
                            : order.status === 'In Production' || order.status === 'Processing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {order.status || 'Received'}
                      </span>
                    </td>

                    {/* 9. Delivery Status (Separate Column) */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-neutral-800 block">
                          {displayDelivery}
                        </span>
                        {order.courier && (
                          <span className="text-[9px] text-neutral-500 block">
                            {order.courier} {order.trackingNumber ? `(${order.trackingNumber})` : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 10. Actions */}
                    <td className="p-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(order)}
                          className="px-2.5 py-1.5 bg-neutral-900 text-white hover:bg-[#E51E2B] text-[10px] font-bold uppercase transition-colors cursor-pointer"
                        >
                          Manage & Fulfill
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/orders/${order.orderNumber || order.id}/track`)}
                          className="px-2 py-1.5 border border-neutral-300 hover:border-neutral-900 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                          title="View public tracking timeline"
                        >
                          Track
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Status Line */}
      <div className="flex justify-between items-center text-[10px] text-neutral-400 px-1">
        <span>Showing {filteredOrders.length} of {orders.length} orders</span>
        <span>Auto-synced with InsForge • Last refreshed: {lastRefreshedAt.toLocaleTimeString('en-IN')}</span>
      </div>

      {/* DETAILED ORDER MANAGEMENT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full bg-white border-2 border-neutral-900 p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-neutral-200">
              <div>
                <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block">
                  ORDER FULFILLMENT & AUDIT MANAGEMENT
                </span>
                <h3 className="text-lg font-black uppercase text-neutral-900 mt-0.5">
                  #{selectedOrder.orderNumber || selectedOrder.id}
                </h3>
                <span className="text-[10px] text-neutral-400">
                  Registered: {selectedOrder.date} {selectedOrder.createdAt ? `(${selectedOrder.createdAt})` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-xs text-neutral-400 hover:text-black font-bold uppercase px-2 py-1 border border-neutral-200"
              >
                Close
              </button>
            </div>

            {/* Patron & Financial Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">PATRON PROFILE</span>
                <p className="font-bold text-neutral-900 text-xs">{selectedOrder.customerName}</p>
                <p className="text-neutral-700">Phone: {selectedOrder.phone || '—'}</p>
                {selectedOrder.customerEmail && (
                  <p className="text-neutral-500 text-[11px]">Email: {selectedOrder.customerEmail}</p>
                )}
                {selectedOrder.customerId && (
                  <p className="text-[9px] font-mono text-neutral-400 truncate">UUID: {selectedOrder.customerId}</p>
                )}
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">FINANCIAL OVERVIEW</span>
                <p className="font-black text-neutral-900 text-sm">
                  Total: ₹{Number(selectedOrder.total).toLocaleString('en-IN')}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-neutral-500 text-[11px]">Payment Status:</span>
                  <span
                    className={`font-bold uppercase text-[10px] px-2 py-0.2 ${
                      (selectedOrder.paymentStatus || '').toLowerCase() === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedOrder.paymentStatus || 'unpaid'}
                  </span>
                </div>
                {selectedOrder.paymentId && (
                  <p className="text-[10px] font-mono text-neutral-500">
                    Payment Ref: <span className="text-neutral-900 font-bold">{selectedOrder.paymentId}</span>
                  </p>
                )}
                {selectedOrder.razorpayOrderId && (
                  <p className="text-[10px] font-mono text-neutral-500">
                    Gateway Order: <span className="text-neutral-900">{selectedOrder.razorpayOrderId}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            {selectedOrder.shippingAddress && (
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">DELIVERY ADDRESS</span>
                <p className="text-neutral-800 font-sans leading-relaxed">
                  {selectedOrder.shippingAddress.fullName ? `${selectedOrder.shippingAddress.fullName}, ` : ''}
                  {selectedOrder.shippingAddress.houseNo ? `${selectedOrder.shippingAddress.houseNo}, ` : ''}
                  {selectedOrder.shippingAddress.street ? `${selectedOrder.shippingAddress.street}, ` : ''}
                  {selectedOrder.shippingAddress.area ? `${selectedOrder.shippingAddress.area}, ` : ''}
                  {selectedOrder.shippingAddress.landmark ? `(Near ${selectedOrder.shippingAddress.landmark}), ` : ''}
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{' '}
                  <span className="font-bold">{selectedOrder.shippingAddress.pincode}</span>
                </p>
                {selectedOrder.shippingAddress.phone && (
                  <p className="text-[11px] text-neutral-500">Contact: {selectedOrder.shippingAddress.phone}</p>
                )}
              </div>
            )}

            {/* Purchased Items List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                ORDERED SILHOUETTES & COLORWAYS
              </span>
              <div className="border border-neutral-200 divide-y divide-neutral-200 max-h-48 overflow-y-auto">
                {(selectedOrder.orderItems || []).length > 0 ? (
                  selectedOrder.orderItems!.map((it, idx) => {
                    const imgUrl = it.image_url || it.thumbnail || '';
                    return (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-3 bg-white">
                        <div className="flex items-center gap-3 min-w-0">
                          {imgUrl ? (
                            <img
                              src={resolveProductImageUrl(imgUrl)}
                              onError={handleImageLoadError}
                              alt=""
                              className="w-10 h-12 object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-12 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[9px] text-neutral-400 shrink-0">
                              TH3EE
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-neutral-900 truncate">{it.product_name}</h4>
                            <p className="text-[10px] text-neutral-500">
                              {it.color_name || 'Standard'} • Size: {it.size || it.variant_title || 'M'} • Qty: {it.quantity}
                            </p>
                            {it.sku && <p className="text-[9px] font-mono text-neutral-400">SKU: {it.sku}</p>}
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold text-neutral-900 shrink-0">
                          ₹{Number(it.line_total || it.unit_price * it.quantity).toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-neutral-600 bg-white">
                    {selectedOrder.items}
                  </div>
                )}
              </div>
            </div>

            {/* Status & Courier Update Form */}
            <div className="space-y-4 pt-3 border-t border-neutral-200">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase text-neutral-900">
                  ADVANCE FULFILLMENT & COURIER DISPATCH
                </span>
                <span className="text-[9px] text-neutral-400 uppercase">
                  Current: {selectedOrder.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                    Fulfilment & Delivery Status Stage *
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 bg-white font-mono text-xs focus:outline-none focus:border-neutral-900"
                  >
                    <option value="Confirmed">1. Order Confirmed</option>
                    <option value="Processing">2. Processing (In Production)</option>
                    <option value="Packed">3. Packed & Inspected</option>
                    <option value="Shipped">4. Shipped / Dispatched</option>
                    <option value="Out For Delivery">5. Out For Delivery</option>
                    <option value="Delivered">6. Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                    Courier / Delivery Partner Name
                  </label>
                  <input
                    type="text"
                    value={modalCourier}
                    onChange={(e) => setModalCourier(e.target.value)}
                    placeholder="e.g. BlueDart, Delhivery, DTDC, Shadowfax"
                    className="w-full px-3 py-2 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                    Tracking AWB Number
                  </label>
                  <input
                    type="text"
                    value={modalTrackingNumber}
                    onChange={(e) => setModalTrackingNumber(e.target.value)}
                    placeholder="e.g. AWB78912345"
                    className="w-full px-3 py-2 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                    External Courier Tracking URL
                  </label>
                  <input
                    type="url"
                    value={modalTrackingUrl}
                    onChange={(e) => setModalTrackingUrl(e.target.value)}
                    placeholder="https://track.bluedart.com/..."
                    className="w-full px-3 py-2 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                  Internal Atelier Notes / Dispatch Reason
                </label>
                <textarea
                  value={modalAdminNotes}
                  onChange={(e) => setModalAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes for logistics associates and customer tracking timeline..."
                  className="w-full px-3 py-2 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            {/* Chronological Tracking Timeline */}
            <div className="space-y-2 pt-3 border-t border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                CHRONOLOGICAL AUDIT TRAIL ({orderTimeline.length} EVENTS)
              </span>
              {timelineLoading ? (
                <div className="p-4 text-center text-neutral-400">Loading audit events...</div>
              ) : orderTimeline.length === 0 ? (
                <p className="text-[11px] text-neutral-400 italic">No milestone events logged yet.</p>
              ) : (
                <div className="space-y-2 border-l-2 border-neutral-300 pl-3 py-1">
                  {orderTimeline.map((ev) => (
                    <div key={ev.id} className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E51E2B] -ml-[19px] ring-2 ring-white" />
                        <span className="font-bold text-neutral-900">{ev.title}</span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(ev.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {ev.message && <p className="text-neutral-600 text-[11px]">{ev.message}</p>}
                      {ev.carrierName && (
                        <p className="text-[10px] text-neutral-500">
                          Carrier: {ev.carrierName} {ev.trackingNumber ? `(${ev.trackingNumber})` : ''}
                        </p>
                      )}
                      {ev.createdBy && (
                        <p className="text-[9px] text-neutral-400">Recorded by: {ev.createdBy}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs text-red-600 hover:underline font-bold uppercase"
              >
                Cancel Order
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 sm:flex-initial px-4 py-2 border border-neutral-300 text-xs font-bold uppercase hover:bg-neutral-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSaveStatus}
                  className="flex-1 sm:flex-initial px-5 py-2 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-[#E51E2B] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Save & Broadcast'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {selectedOrder && isCancelModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border-2 border-red-500 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black uppercase text-red-700">
              Confirm Order Cancellation
            </h3>
            <p className="text-xs text-neutral-600">
              Are you sure you want to cancel order #{selectedOrder.orderNumber}? This will immediately update the customer's Order History and tracking timeline.
            </p>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">
                Reason for cancellation *
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 text-xs font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-2 border border-neutral-300 text-xs font-bold uppercase cursor-pointer hover:bg-neutral-50"
              >
                Abort
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleExecuteCancel}
                className="flex-1 py-2 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersManager;

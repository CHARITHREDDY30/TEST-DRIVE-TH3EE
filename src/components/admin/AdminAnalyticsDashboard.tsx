import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  ShoppingBag, 
  Eye, 
  RefreshCw, 
  Download, 
  Search, 
  ArrowRight, 
  MessageSquare, 
  ShieldCheck, 
  Flame, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ChevronRight, 
  TrendingUp, 
  CreditCard, 
  Smartphone, 
  Monitor,
  Package,
  Truck,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  Send
} from 'lucide-react';
import { analyticsService } from '../../services/analytics.service';
import { ordersService } from '../../services/orders.service';
import type { 
  AdminAnalyticsDashboardSummary, 
  CustomerLoginLedgerItem, 
  ProductPerformanceMetric, 
  RecentOrderItem, 
  LiveActivityEvent 
} from '../../types/analytics';
import { resolveProductImageUrl, handleImageLoadError } from '../../lib/r2';

interface AdminAnalyticsDashboardProps {
  navigate: (path: string) => void;
  showNotification: (msg: any) => void;
  onOpenOrder?: (orderId: string) => void;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  navigate,
  showNotification,
  onOpenOrder
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('today');
  const [summary, setSummary] = useState<AdminAnalyticsDashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Primary Navigation
  const [activeTab, setActiveTab] = useState<'orders' | 'logins' | 'products' | 'live_feed'>('orders');
  
  // Fulfillment Pipeline Filter (Needs Packing, Packed, Sent/Shipped, Delivered)
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'all' | 'needs_packing' | 'packed' | 'shipped' | 'delivered'>('all');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [feedFilter, setFeedFilter] = useState('all');

  // Packing Checklist state (checkbox toggles per item)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Shipping Modal state
  const [shippingModalOrder, setShippingModalOrder] = useState<RecentOrderItem | null>(null);
  const [courierProvider, setCourierProvider] = useState('Delhivery');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [isUpdatingFulfillment, setIsUpdatingFulfillment] = useState(false);

  // Load analytics summary data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await analyticsService.getAnalyticsSummary(timeframe);
      setSummary(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Failed to load daily tracking data.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe, showNotification]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Gentle live heartbeat every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 8000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Helpers
  const formatCurrency = (amt: number) => {
    return `₹${(Number(amt) || 0).toLocaleString('en-IN')}`;
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  // Determine stage of an order
  const getOrderStage = (order: RecentOrderItem): 'needs_packing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' => {
    const s = (order.orderStatus || '').toLowerCase();
    const d = (order.deliveryStatus || '').toLowerCase();
    if (s === 'cancelled' || d.includes('cancel')) return 'cancelled';
    if (s === 'delivered' || d.includes('deliver')) return 'delivered';
    if (s === 'shipped' || s === 'dispatched' || s === 'out_for_delivery' || d.includes('ship') || d.includes('dispatch') || d.includes('out')) return 'shipped';
    if (s === 'packed' || d.includes('pack')) return 'packed';
    return 'needs_packing'; // received, confirmed, processing, in_production
  };

  // Calculate late delivery risk (to never disappoint a customer!)
  const getOrderDelayRisk = (order: RecentOrderItem) => {
    if (!order.createdAt) return null;
    const stage = getOrderStage(order);
    if (stage === 'delivered' || stage === 'cancelled') return null;

    const hoursElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60));
    
    if (stage === 'needs_packing' && hoursElapsed >= 24) {
      return {
        severity: 'critical' as const,
        hours: hoursElapsed,
        message: `Placed ${hoursElapsed}h ago — Needs packing immediately to avoid delivery delay!`
      };
    }
    if (stage === 'packed' && hoursElapsed >= 36) {
      return {
        severity: 'warning' as const,
        hours: hoursElapsed,
        message: `Packed ${hoursElapsed}h ago — Ready to hand over to courier today!`
      };
    }
    return null;
  };

  // Pipeline Counts
  const pipelineCounts = useMemo(() => {
    const counts = {
      all: 0,
      needs_packing: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      late_risk: 0
    };
    if (!summary?.recentOrders) return counts;

    counts.all = summary.recentOrders.length;
    summary.recentOrders.forEach(ord => {
      const stage = getOrderStage(ord);
      if (stage === 'needs_packing') counts.needs_packing++;
      else if (stage === 'packed') counts.packed++;
      else if (stage === 'shipped') counts.shipped++;
      else if (stage === 'delivered') counts.delivered++;

      const risk = getOrderDelayRisk(ord);
      if (risk && risk.severity === 'critical') counts.late_risk++;
    });

    return counts;
  }, [summary?.recentOrders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!summary?.recentOrders) return [];
    return summary.recentOrders.filter(ord => {
      // 1. Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.customerEmail.toLowerCase().includes(q) ||
        ord.customerPhone.includes(q);

      // 2. Fulfillment stage filter
      const stage = getOrderStage(ord);
      const matchFulfillment = fulfillmentFilter === 'all' || stage === fulfillmentFilter;

      // 3. Payment filter
      const matchPayment = paymentFilter === 'all' || 
        (paymentFilter === 'paid' && ord.paymentStatus.toLowerCase() === 'paid') ||
        (paymentFilter === 'pending' && ord.paymentStatus.toLowerCase() !== 'paid');

      return matchSearch && matchFulfillment && matchPayment;
    });
  }, [summary?.recentOrders, searchQuery, fulfillmentFilter, paymentFilter]);

  // Filtered Logins
  const filteredLogins = useMemo(() => {
    if (!summary?.recentLogins) return [];
    return summary.recentLogins.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      return !q || 
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q);
    });
  }, [summary?.recentLogins, searchQuery]);

  // Filtered Live Activity Feed
  const filteredLiveFeed = useMemo(() => {
    if (!summary?.liveEvents) return [];
    if (feedFilter === 'all') return summary.liveEvents;
    return summary.liveEvents.filter(e => {
      if (feedFilter === 'views') return e.eventType === 'product_view' || e.eventType === 'page_view';
      if (feedFilter === 'cart') return e.eventType === 'add_to_cart' || e.eventType === 'remove_from_cart';
      if (feedFilter === 'orders') return e.eventType === 'order_placed' || e.eventType === 'checkout_started';
      if (feedFilter === 'logins') return e.eventType === 'user_login' || e.eventType === 'user_signup';
      return true;
    });
  }, [summary?.liveEvents, feedFilter]);

  // Toggle item packing checklist
  const toggleItemCheck = (key: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 1-Click Action: Mark as Packed
  const handleMarkPacked = async (order: RecentOrderItem) => {
    setIsUpdatingFulfillment(true);
    try {
      const success = await ordersService.updateFulfillmentStatus(order.id, 'Packed', {
        deliveryStatus: 'Packed',
        notes: 'Garments verified, neatly polybagged, and packed at TH3EE atelier.'
      });

      if (success) {
        setSummary(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            recentOrders: prev.recentOrders.map(o => o.id === order.id ? { ...o, orderStatus: 'Packed', deliveryStatus: 'Packed' } : o)
          };
        });
        showNotification({ type: 'success', message: `Order #${order.orderNumber} is marked as Packed & ready for pickup!` });
      }
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Failed to update order status.' });
    } finally {
      setIsUpdatingFulfillment(false);
    }
  };

  // 1-Click Action: Open Ship/Dispatch Modal
  const handleOpenShipModal = (order: RecentOrderItem) => {
    setShippingModalOrder(order);
    setCourierProvider(order.shippingProvider || 'Delhivery');
    setTrackingNumberInput(order.trackingNumber || '');
  };

  // 1-Click Action: Confirm Shipment with Courier Details
  const handleConfirmShipment = async () => {
    if (!shippingModalOrder) return;
    setIsUpdatingFulfillment(true);
    try {
      const courier = courierProvider.trim() || 'Delhivery';
      const trackingNum = trackingNumberInput.trim();
      const success = await ordersService.updateFulfillmentStatus(shippingModalOrder.id, 'Shipped', {
        deliveryStatus: 'Shipped',
        shippingProvider: courier,
        trackingNumber: trackingNum || undefined,
        trackingUrl: trackingNum ? `https://th3ee.in/order-tracking?orderId=${shippingModalOrder.orderNumber}` : undefined,
        notes: `Dispatched via ${courier}${trackingNum ? ` (AWB: ${trackingNum})` : ''}`
      });

      if (success) {
        setSummary(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            recentOrders: prev.recentOrders.map(o => 
              o.id === shippingModalOrder.id 
                ? { ...o, orderStatus: 'Shipped', deliveryStatus: 'Shipped', shippingProvider: courier, trackingNumber: trackingNum } 
                : o
            )
          };
        });
        showNotification({ type: 'success', message: `Order #${shippingModalOrder.orderNumber} dispatched via ${courier}!` });
        setShippingModalOrder(null);
      }
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Failed to dispatch order.' });
    } finally {
      setIsUpdatingFulfillment(false);
    }
  };

  // 1-Click Action: Mark as Delivered
  const handleMarkDelivered = async (order: RecentOrderItem) => {
    setIsUpdatingFulfillment(true);
    try {
      const success = await ordersService.updateFulfillmentStatus(order.id, 'Delivered', {
        deliveryStatus: 'Delivered',
        notes: 'Confirmed delivery to customer.'
      });

      if (success) {
        setSummary(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            recentOrders: prev.recentOrders.map(o => o.id === order.id ? { ...o, orderStatus: 'Delivered', deliveryStatus: 'Delivered' } : o)
          };
        });
        showNotification({ type: 'success', message: `Order #${order.orderNumber} successfully marked as Delivered! 🎉` });
      }
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Failed to mark as delivered.' });
    } finally {
      setIsUpdatingFulfillment(false);
    }
  };

  // Stage-Aware WhatsApp Links (Keep customer happy & informed at every step)
  const getStageWhatsAppUrl = (order: RecentOrderItem) => {
    if (!order.customerPhone) return '';
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const firstName = order.customerName.split(' ')[0] || order.customerName;
    const stage = getOrderStage(order);

    let message = '';
    if (stage === 'packed') {
      message = `Hello ${firstName}! Your TH3EE order #${order.orderNumber} has been verified, packed with care, and is ready for courier pickup. 👕✨`;
    } else if (stage === 'shipped') {
      const courierInfo = order.shippingProvider ? ` via ${order.shippingProvider}` : '';
      const trackInfo = order.trackingNumber ? ` (Tracking AWB: ${order.trackingNumber})` : '';
      message = `Hello ${firstName}! Great news—your TH3EE order #${order.orderNumber} has been dispatched${courierInfo}${trackInfo}! 🚀 Track live: https://th3ee.in/order-tracking?orderId=${order.orderNumber}`;
    } else if (stage === 'delivered') {
      message = `Hello ${firstName}! Your TH3EE order #${order.orderNumber} has been delivered. We hope you love the fit! Tag us on Instagram @th3ee.verse 👑`;
    } else {
      message = `Hello ${firstName}! Thank you for your order #${order.orderNumber} at TH3EE. Our atelier is currently prepping your garments.`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // CSV Exporters
  const handleExportOrdersCsv = () => {
    if (!summary?.recentOrders || summary.recentOrders.length === 0) {
      showNotification('No orders available to export.');
      return;
    }
    const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Customer Phone', 'Total Amount (INR)', 'Payment Status', 'Order Status', 'Delivery Status', 'Courier', 'Tracking Number', 'Items Count'];
    const rows = summary.recentOrders.map(o => [
      o.orderNumber,
      o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '',
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.totalAmount,
      o.paymentStatus,
      o.orderStatus,
      o.deliveryStatus,
      o.shippingProvider || '',
      o.trackingNumber || '',
      o.items ? o.items.length : 0
    ]);
    analyticsService.downloadCsv(`TH3EE-Fulfillment-Orders-${timeframe}`, headers, rows);
    showNotification('Orders ledger exported as CSV.');
  };

  const handleExportLoginsCsv = () => {
    if (!summary?.recentLogins || summary.recentLogins.length === 0) {
      showNotification('No customer logins available to export.');
      return;
    }
    const headers = ['Customer Name', 'Email', 'Phone', 'Last Active', 'Account Created', 'Total Orders', 'Total Spend (INR)'];
    const rows = summary.recentLogins.map(c => [
      c.name,
      c.email,
      c.phone,
      c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleString('en-IN') : '',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '',
      c.orderCount,
      c.totalSpent
    ]);
    analyticsService.downloadCsv(`TH3EE-Customer-Logins-${timeframe}`, headers, rows);
    showNotification('Customer logins exported as CSV.');
  };

  const timeframeLabels: Record<string, string> = {
    today: "Today",
    yesterday: "Yesterday",
    "7days": "Last 7 Days",
    "30days": "Last 30 Days",
    all: "All Time"
  };

  return (
    <div className="w-full space-y-6 font-sans text-neutral-900">
      
      {/* =========================================================================
          1. PEACEFUL TOP HEADER & TIMEFRAME CONTROL
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Live Fulfillment Radar
            </span>
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">•</span>
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
              Refreshed {formatRelativeTime(lastRefreshed.toISOString())}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-950 font-['Montserrat',sans-serif]">
            Daily Intelligence & Order Fulfillment
          </h2>
          <p className="text-xs text-neutral-500 font-medium">
            Track what's packed, sent, and delivered so no customer ever receives late garments.
          </p>
        </div>

        {/* Action Controls: Timeframe Pills, Refresh, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe pill selector */}
          <div className="inline-flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            {(['today', 'yesterday', '7days', 'all'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                  timeframe === t 
                    ? 'bg-neutral-950 text-white shadow-xs' 
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {timeframeLabels[t]}
              </button>
            ))}
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={() => loadData(false)}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition-colors border border-neutral-200"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin text-[#E51E2B]' : ''}`} />
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={activeTab === 'logins' ? handleExportLoginsCsv : handleExportOrdersCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 hover:bg-[#E51E2B] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. FOUR SPACIOUS, CALM METRIC CARDS
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <div 
          onClick={() => setActiveTab('orders')}
          className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-neutral-900 transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center group-hover:bg-[#E51E2B] group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono mt-2">
            {formatCurrency(summary?.totalRevenue ?? 0)}
          </div>
          <div className="text-xs font-bold text-neutral-500 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{summary?.totalOrders ?? 0} confirmed paid orders</span>
          </div>
        </div>

        {/* Card 2: Orders Placed */}
        <div 
          onClick={() => {
            setActiveTab('orders');
            setFulfillmentFilter('all');
          }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-[#E51E2B] transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Orders to Fulfill</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E51E2B] flex items-center justify-center group-hover:bg-[#E51E2B] group-hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 mt-2">
            {summary?.totalOrders ?? 0}
          </div>
          <div className="text-xs font-bold text-neutral-500 mt-1">
            {pipelineCounts.needs_packing > 0 ? (
              <span className="text-amber-700 font-bold">⚠️ {pipelineCounts.needs_packing} need packing today</span>
            ) : (
              <span className="text-emerald-700 font-bold">✓ All orders packed!</span>
            )}
          </div>
        </div>

        {/* Card 3: Live Visitors */}
        <div 
          onClick={() => setActiveTab('live_feed')}
          className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-neutral-900 transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Live Visitors</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 mt-2">
            {summary?.totalVisitors ?? 0}
          </div>
          <div className="text-xs font-bold text-neutral-500 mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-neutral-400" />
              {summary?.mobileVisitors ?? 0} Mobile
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Monitor className="w-3 h-3 text-neutral-400" />
              {summary?.desktopVisitors ?? 0} Web
            </span>
          </div>
        </div>

        {/* Card 4: Logged-in Shoppers */}
        <div 
          onClick={() => setActiveTab('logins')}
          className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-neutral-900 transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Customer Logins</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center group-hover:bg-neutral-950 group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 mt-2">
            {summary?.todayLoginsCount ?? 0}
          </div>
          <div className="text-xs font-bold text-neutral-500 mt-1">
            Accounts active on store today
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. FULL-WIDTH PEACEFUL NAVIGATION TABS
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/70 p-2 gap-2 overflow-x-auto">
          {[
            { 
              id: 'orders', 
              label: 'Fulfillment & Orders', 
              count: summary?.recentOrders?.length ?? 0, 
              icon: ShoppingBag, 
              badgeColor: 'bg-[#E51E2B] text-white' 
            },
            { 
              id: 'logins', 
              label: 'Customers Logged In', 
              count: summary?.recentLogins?.length ?? 0, 
              icon: Users, 
              badgeColor: 'bg-neutral-900 text-white' 
            },
            { 
              id: 'products', 
              label: 'Product Interest & Views', 
              count: summary?.topProducts?.length ?? 0, 
              icon: Eye, 
              badgeColor: 'bg-neutral-200 text-neutral-800' 
            },
            { 
              id: 'live_feed', 
              label: 'Live Activity Stream', 
              count: summary?.liveEvents?.length ?? 0, 
              icon: Activity, 
              badgeColor: 'bg-emerald-600 text-white' 
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#E51E2B]' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isActive ? tab.badgeColor : 'bg-neutral-200 text-neutral-600'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Container */}
        <div className="p-5 sm:p-6">
          
          {/* =====================================================================
              TAB 1: FULFILLMENT & ORDERS PIPELINE (Never Miss an Order!)
          ===================================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              
              {/* LATE FULFILLMENT ALERT BANNER (If any order > 24h waiting to pack) */}
              {pipelineCounts.late_risk > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-950 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        {pipelineCounts.late_risk} Order{pipelineCounts.late_risk > 1 ? 's' : ''} Need Urgent Packing!
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Orders placed more than 24 hours ago are waiting. Pack and dispatch them immediately to prevent customer delivery dissatisfaction.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFulfillmentFilter('needs_packing')}
                    className="px-3.5 py-1.5 bg-amber-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-colors shrink-0"
                  >
                    View Pending Orders
                  </button>
                </div>
              )}

              {/* FULFILLMENT STAGE PIPELINE SWITCHER */}
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'All Orders', count: pipelineCounts.all, icon: ShoppingBag, color: 'text-neutral-900' },
                    { id: 'needs_packing', label: 'Needs Packing', count: pipelineCounts.needs_packing, icon: Package, color: 'text-amber-700' },
                    { id: 'packed', label: 'Packed & Ready', count: pipelineCounts.packed, icon: CheckCircle2, color: 'text-blue-700' },
                    { id: 'shipped', label: 'Sent / In Transit', count: pipelineCounts.shipped, icon: Truck, color: 'text-purple-700' },
                    { id: 'delivered', label: 'Delivered', count: pipelineCounts.delivered, icon: CheckCircle2, color: 'text-emerald-700' }
                  ].map(stage => {
                    const Icon = stage.icon;
                    const isSelected = fulfillmentFilter === stage.id;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setFulfillmentFilter(stage.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-neutral-950 text-white shadow-xs'
                            : 'bg-white text-neutral-600 hover:text-black border border-neutral-200/80 hover:border-neutral-400'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : stage.color}`} />
                        <span>{stage.label}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : 'bg-neutral-100 text-neutral-700 font-bold'
                        }`}>
                          {stage.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Secondary Search & Payment filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search customer, phone, order #..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white text-xs font-medium rounded-xl border border-neutral-200 focus:outline-none focus:border-[#E51E2B]"
                    />
                  </div>

                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white text-xs font-black uppercase rounded-xl border border-neutral-200 focus:outline-none"
                  >
                    <option value="all">All Pay</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* ORDERS LIST & PACKING CHECKLIST */}
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center space-y-2 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
                  <Package className="w-10 h-10 text-neutral-300 mx-auto" />
                  <h4 className="text-sm font-black uppercase text-neutral-700 tracking-wide">
                    No orders in this fulfillment stage
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    {fulfillmentFilter === 'needs_packing' 
                      ? 'Awesome! You have packed all current orders. No garments are pending packing.' 
                      : 'Orders will update here automatically as garments are packed and shipped.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => {
                    const stage = getOrderStage(order);
                    const delayRisk = getOrderDelayRisk(order);

                    return (
                      <div 
                        key={order.id} 
                        className={`bg-white rounded-2xl border transition-all p-5 space-y-4 shadow-2xs ${
                          delayRisk && delayRisk.severity === 'critical'
                            ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/20'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {/* TOP ROW: Order Number, Time, Delay Alert, Status Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-sm text-neutral-950">
                              {order.orderNumber}
                            </span>
                            <span className="text-neutral-300">•</span>
                            <span className="text-xs text-neutral-500 font-medium">
                              {formatRelativeTime(order.createdAt)}
                            </span>

                            {/* Delay Risk Flag */}
                            {delayRisk && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-3 h-3 text-amber-700" />
                                <span>{delayRisk.hours}h pending packing</span>
                              </span>
                            )}
                          </div>

                          {/* Status Pills */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Fulfillment Stage Pill */}
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                              stage === 'delivered' 
                                ? 'bg-emerald-100 text-emerald-800' :
                              stage === 'shipped' 
                                ? 'bg-purple-100 text-purple-800' :
                              stage === 'packed' 
                                ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-900'
                            }`}>
                              {stage === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> :
                               stage === 'shipped' ? <Truck className="w-3 h-3" /> :
                               stage === 'packed' ? <Package className="w-3 h-3" /> :
                               <Clock className="w-3 h-3" />}
                              <span>{stage.replace('_', ' ')}</span>
                            </span>

                            {/* Payment Pill */}
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                              order.paymentStatus.toLowerCase() === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>

                        {/* MIDDLE ROW: Customer Info & Garment Packing Checklist */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          
                          {/* Customer & Address */}
                          <div className="space-y-1 text-xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                              Customer Contact
                            </span>
                            <div className="font-black uppercase text-neutral-900 text-sm">
                              {order.customerName}
                            </div>
                            <div className="text-neutral-500 truncate">
                              {order.customerEmail}
                            </div>
                            {order.customerPhone && (
                              <div className="font-mono text-neutral-800 font-bold">
                                {order.customerPhone}
                              </div>
                            )}

                            {order.shippingProvider && (
                              <div className="pt-2 text-[11px] text-neutral-600 flex items-center gap-1.5 font-medium">
                                <Truck className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Courier: <strong className="text-neutral-900">{order.shippingProvider}</strong></span>
                                {order.trackingNumber && (
                                  <span className="font-mono bg-neutral-100 px-1.5 py-0.2 rounded text-[10px]">
                                    AWB: {order.trackingNumber}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Packing Checklist: Items & Sizes */}
                          <div className="lg:col-span-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                                Garment Packing Checklist (Verify before dispatch)
                              </span>
                              <span className="text-[10px] font-bold text-neutral-500">
                                Total: {formatCurrency(order.totalAmount)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((it, idx) => {
                                  const itemKey = `${order.id}-${idx}`;
                                  const isChecked = !!checkedItems[itemKey] || stage === 'packed' || stage === 'shipped' || stage === 'delivered';

                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => toggleItemCheck(itemKey)}
                                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer select-none transition-all ${
                                        isChecked
                                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                          : 'bg-neutral-50 border-neutral-200 hover:border-neutral-400 text-neutral-900'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {isChecked ? (
                                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                        ) : (
                                          <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                          <h5 className="text-xs font-bold truncate">
                                            {it.productName}
                                          </h5>
                                          <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                                            <span>Qty: <strong className="text-neutral-900">{it.quantity}</strong></span>
                                            {it.size && <span>Size: <strong className="text-neutral-900 uppercase">{it.size}</strong></span>}
                                            {it.color && <span>Color: {it.color}</span>}
                                          </div>
                                        </div>
                                      </div>

                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                        isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                                      }`}>
                                        {isChecked ? 'Packed' : 'Pack'}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-xs text-neutral-400 italic">
                                  Standard catalog garment
                                </div>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* BOTTOM ACTION BAR: 1-Click Status Update & WhatsApp Dispatch */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                          
                          {/* Stage specific guidance message */}
                          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                            {stage === 'needs_packing' && (
                              <span className="text-amber-800 font-bold">
                                📦 Step 1: Pack the garments and click "Mark as Packed".
                              </span>
                            )}
                            {stage === 'packed' && (
                              <span className="text-blue-800 font-bold">
                                🚚 Step 2: Hand to courier and click "Ship & Add Courier Tracking".
                              </span>
                            )}
                            {stage === 'shipped' && (
                              <span className="text-purple-800 font-bold">
                                🚀 In transit with {order.shippingProvider || 'courier'}. Mark as delivered once customer receives.
                              </span>
                            )}
                            {stage === 'delivered' && (
                              <span className="text-emerald-800 font-bold">
                                ✅ Order successfully fulfilled and received by customer.
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                            
                            {/* WhatsApp Dispatch Link */}
                            {order.customerPhone && (
                              <a
                                href={getStageWhatsAppUrl(order)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-2xs"
                                title="Send stage notification to customer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp Update</span>
                              </a>
                            )}

                            {/* FULFILLMENT ACTION 1: Needs Packing -> Mark as Packed */}
                            {stage === 'needs_packing' && (
                              <button
                                type="button"
                                disabled={isUpdatingFulfillment}
                                onClick={() => handleMarkPacked(order)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 hover:bg-[#E51E2B] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50"
                              >
                                <Package className="w-3.5 h-3.5" />
                                <span>Mark as Packed</span>
                              </button>
                            )}

                            {/* FULFILLMENT ACTION 2: Packed -> Mark as Shipped */}
                            {stage === 'packed' && (
                              <button
                                type="button"
                                disabled={isUpdatingFulfillment}
                                onClick={() => handleOpenShipModal(order)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 hover:bg-[#E51E2B] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Ship / Add Courier</span>
                              </button>
                            )}

                            {/* FULFILLMENT ACTION 3: Shipped -> Mark as Delivered */}
                            {stage === 'shipped' && (
                              <button
                                type="button"
                                disabled={isUpdatingFulfillment}
                                onClick={() => handleMarkDelivered(order)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Delivered</span>
                              </button>
                            )}

                            {/* View Full Order Details Modal */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenOrder) onOpenOrder(order.id);
                                else showNotification(`Inspecting order #${order.orderNumber}`);
                              }}
                              className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                            >
                              Details
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              TAB 2: WHO LOGGED IN TODAY (Active Customers Ledger)
          ===================================================================== */}
          {activeTab === 'logins' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
                    Customers Who Logged In Today
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Registered patrons active on the storefront with their contact information and order history.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:border-[#E51E2B]"
                  />
                </div>
              </div>

              {filteredLogins.length === 0 ? (
                <div className="py-16 text-center text-neutral-400 font-bold uppercase text-xs">
                  No customer logins found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredLogins.map(cust => (
                    <div 
                      key={cust.id} 
                      className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 hover:border-neutral-900 transition-all space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white font-black text-xs flex items-center justify-center uppercase shrink-0">
                          {cust.name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black uppercase text-neutral-950 truncate">{cust.name}</h4>
                            {cust.isToday && (
                              <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-1.5 py-0.2 rounded">
                                Active Today
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate">{cust.email}</p>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-neutral-200/70 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-neutral-400 uppercase font-bold block">Lifetime Orders</span>
                          <span className="font-black text-neutral-900 text-xs">{cust.orderCount} Orders</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 uppercase font-bold block">Total Spend</span>
                          <span className="font-black text-emerald-700 text-xs font-mono">{formatCurrency(cust.totalSpent)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60">
                        <span className="text-[10px] text-neutral-400 font-medium">
                          Last seen {cust.lastLoginAt ? formatRelativeTime(cust.lastLoginAt) : 'Recently'}
                        </span>
                        {cust.phone ? (
                          <a
                            href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(cust.name)},%20welcome%20back%20to%20TH3EE!`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-neutral-400">Phone not set</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              TAB 3: PRODUCT INTEREST & PRICE CHECKS (Drop-Off Telemetry)
          ===================================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
                  Product Interest & Price Check Telemetry
                </h3>
                <p className="text-xs text-neutral-500">
                  See which garments shoppers inspect the most, how many add to bag, and drop-off conversion rates.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 font-black uppercase text-[10px] tracking-wider border-b border-neutral-200">
                      <th className="p-3 w-12 text-center rounded-l-xl">#</th>
                      <th className="p-3">Garment</th>
                      <th className="p-3">Retail Price</th>
                      <th className="p-3 text-center">Price Views</th>
                      <th className="p-3 text-center">Added to Bag</th>
                      <th className="p-3 text-center">Paid Units</th>
                      <th className="p-3 text-center">Conversion</th>
                      <th className="p-3 text-right rounded-r-xl">Interest Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(summary?.topProducts || []).map((prod, idx) => (
                      <tr key={prod.id || idx} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="p-3 text-center font-black text-neutral-400">
                          {idx + 1}
                        </td>
                        <td className="p-3 min-w-[220px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                              <img 
                                src={resolveProductImageUrl(prod.imageUrl)} 
                                onError={handleImageLoadError}
                                alt="" 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div>
                              <h4 className="font-black uppercase text-neutral-900">{prod.name}</h4>
                              <span className="text-[10px] text-neutral-400 font-bold uppercase">{prod.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-neutral-900">
                          {formatCurrency(prod.price)}
                        </td>
                        <td className="p-3 text-center font-black text-neutral-950">
                          {prod.views} views
                        </td>
                        <td className="p-3 text-center font-bold text-amber-700">
                          {prod.cartAdds} in bag
                        </td>
                        <td className="p-3 text-center font-black text-emerald-700">
                          {prod.ordersCount} ordered
                        </td>
                        <td className="p-3 text-center font-black">
                          {prod.conversionRate}%
                        </td>
                        <td className="p-3 text-right">
                          {idx === 0 ? (
                            <span className="bg-red-50 text-[#E51E2B] border border-red-200 font-black text-[9px] uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Flame className="w-3 h-3 text-[#E51E2B] fill-[#E51E2B]" />
                              <span>Top Viewed</span>
                            </span>
                          ) : (
                            <span className="bg-neutral-100 text-neutral-600 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full">
                              Active Drop
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: LIVE ACTIVITY STREAM (Storefront Radar)
          ===================================================================== */}
          {activeTab === 'live_feed' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
                      Live Shopper Action Stream
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Real-time chronological events from visitors browsing across th3ee.in right now.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-bold">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'views', label: 'Price Checks' },
                    { id: 'cart', label: 'Bag' },
                    { id: 'orders', label: 'Orders' },
                    { id: 'logins', label: 'Logins' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFeedFilter(f.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        feedFilter === f.id
                          ? 'bg-neutral-950 text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredLiveFeed.length === 0 ? (
                <div className="py-16 text-center text-neutral-400 font-bold uppercase text-xs">
                  No activity events recorded yet for this filter.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {filteredLiveFeed.map((evt, idx) => (
                    <div key={evt.id || idx} className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors rounded-xl px-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0">
                          {evt.eventType === 'product_view' ? <Eye className="w-4 h-4 text-neutral-900" /> :
                           evt.eventType === 'add_to_cart' ? <ShoppingBag className="w-4 h-4 text-amber-700" /> :
                           evt.eventType === 'order_placed' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                           evt.eventType === 'user_login' ? <ShieldCheck className="w-4 h-4 text-[#E51E2B]" /> :
                           <Activity className="w-4 h-4 text-neutral-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                              {evt.eventType.replace('_', ' ')}
                            </span>
                            {evt.deviceType && (
                              <span className="text-[10px] text-neutral-400 font-bold uppercase">
                                via {evt.deviceType}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-neutral-900 uppercase truncate mt-0.5">
                            {evt.itemName || evt.path || 'Storefront Action'}
                            {evt.itemPrice ? ` • ${formatCurrency(evt.itemPrice)}` : ''}
                          </h4>
                          <span className="text-[10px] text-neutral-500 block truncate">
                            {evt.customerName || evt.customerEmail || 'Anonymous Visitor'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-neutral-400 shrink-0">
                        {formatRelativeTime(evt.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* =========================================================================
          4. COURIER SHIPMENT / DISPATCH MODAL
      ========================================================================= */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-neutral-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-neutral-900" />
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950">
                  Ship Order #{shippingModalOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-neutral-600 block mb-1">
                  Courier Partner
                </label>
                <select
                  value={courierProvider}
                  onChange={(e) => setCourierProvider(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#E51E2B]"
                >
                  <option value="Delhivery">Delhivery Express</option>
                  <option value="BlueDart">Blue Dart Express</option>
                  <option value="DTDC">DTDC Courier</option>
                  <option value="India Post">India Post (Speed Post)</option>
                  <option value="Shadowfax">Shadowfax Logistics</option>
                  <option value="Xpressbees">Xpressbees</option>
                  <option value="Self Delivery (Tirupati Atelier)">Self Delivery (Tirupati Atelier)</option>
                  <option value="Other Courier">Other Courier</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-neutral-600 block mb-1">
                  Tracking AWB Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEL123456789 or Speed Post tracking ID"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#E51E2B]"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Customer will receive this tracking number directly to track their parcel online.
                </p>
              </div>

              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Customer
                </span>
                <div className="font-bold text-neutral-900">
                  {shippingModalOrder.customerName} ({shippingModalOrder.customerPhone || 'No phone'})
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingFulfillment}
                onClick={handleConfirmShipment}
                className="px-5 py-2 bg-[#E51E2B] hover:bg-[#D41212] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Mark Dispatched</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAnalyticsDashboard;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Eye, 
  Clock, 
  RefreshCw, 
  Download, 
  Smartphone, 
  Monitor, 
  Search, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Flame,
  Activity,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import { analyticsService } from '../../services/analytics.service';
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
  
  // Tab within dashboard
  const [activeSection, setActiveSection] = useState<'overview' | 'orders' | 'logins' | 'products' | 'live_feed'>('overview');
  
  // Search & Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [loginSearch, setLoginSearch] = useState('');
  const [feedFilter, setFeedFilter] = useState('all');

  // Load summary data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await analyticsService.getAnalyticsSummary(timeframe);
      setSummary(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      showNotification({ type: 'error', message: err?.message || 'Failed to load analytics dashboard.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe, showNotification]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Periodic heartbeat every 8 seconds for live visitor & activity pulse
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 8000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!summary?.recentOrders) return [];
    return summary.recentOrders.filter(ord => {
      const q = orderSearch.toLowerCase();
      const matchSearch = !q || 
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.customerEmail.toLowerCase().includes(q) ||
        ord.customerPhone.includes(q);

      const matchStatus = orderStatusFilter === 'all' || 
        ord.paymentStatus.toLowerCase() === orderStatusFilter.toLowerCase() ||
        ord.orderStatus.toLowerCase() === orderStatusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [summary?.recentOrders, orderSearch, orderStatusFilter]);

  // Filtered Logins
  const filteredLogins = useMemo(() => {
    if (!summary?.recentLogins) return [];
    return summary.recentLogins.filter(c => {
      const q = loginSearch.toLowerCase();
      return !q || 
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q);
    });
  }, [summary?.recentLogins, loginSearch]);

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

  // CSV Exporters
  const handleExportOrdersCsv = () => {
    if (!summary?.recentOrders || summary.recentOrders.length === 0) {
      showNotification('No orders available to export.');
      return;
    }
    const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Customer Phone', 'Total Amount', 'Payment Status', 'Order Status', 'Items Count'];
    const rows = summary.recentOrders.map(o => [
      o.orderNumber,
      o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '',
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.totalAmount,
      o.paymentStatus,
      o.orderStatus,
      o.items ? o.items.length : 0
    ]);
    analyticsService.downloadCsv(`TH3EE-Orders-${timeframe}`, headers, rows);
    showNotification('Orders ledger exported as CSV.');
  };

  const handleExportLoginsCsv = () => {
    if (!summary?.recentLogins || summary.recentLogins.length === 0) {
      showNotification('No customer logins available to export.');
      return;
    }
    const headers = ['Customer Name', 'Email', 'Phone', 'Last Active/Login', 'Account Created', 'Total Orders', 'Total Spend (INR)'];
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

  const handleExportProductsCsv = () => {
    if (!summary?.topProducts || summary.topProducts.length === 0) {
      showNotification('No products available to export.');
      return;
    }
    const headers = ['Product Name', 'Category', 'Price (INR)', 'Views', 'Cart Additions', 'Orders Count', 'Conversion Rate (%)', 'Stock Status'];
    const rows = summary.topProducts.map(p => [
      p.name,
      p.category,
      p.price,
      p.views,
      p.cartAdds,
      p.ordersCount,
      `${p.conversionRate}%`,
      p.inStock ? 'In Stock' : 'Out of Stock'
    ]);
    analyticsService.downloadCsv(`TH3EE-Product-Performance-${timeframe}`, headers, rows);
    showNotification('Product performance exported as CSV.');
  };

  const formatCurrency = (amt: number) => {
    return `Rs. ${(Number(amt) || 0).toLocaleString('en-IN')}`;
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

  return (
    <div className="space-y-6 font-mono text-neutral-900 pb-12 animate-fadeIn">
      {/* 1. TOP HEADER & TIMEFRAME SELECTOR */}
      <div className="bg-white border-2 border-neutral-900 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              Live Real-Time Radar
            </span>
            <span className="text-[10px] text-neutral-400">
              Auto-syncs every 8s • Refreshed {formatRelativeTime(lastRefreshed.toISOString())}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-neutral-900">
            Storefront Intelligence & Visitor Command Desk
          </h1>
          <p className="text-xs text-neutral-500">
            Monitor real-time visitors, who placed orders, who logged in today, and which drops have the highest price checks.
          </p>
        </div>

        {/* Timeframe & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Timeframe selector */}
          <div className="inline-flex bg-neutral-100 p-1 border border-neutral-300 rounded-none text-xs font-bold">
            {[
              { id: 'today', label: 'Today (Live)' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' }
            ].map(tf => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-3 py-1.5 uppercase transition-colors text-[11px] ${
                  timeframe === tf.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={loading || refreshing}
            className="p-2 border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin text-[#E51E2B]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. SIX MASTER KPI TILES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Visitors */}
        <div className="bg-white border-2 border-neutral-900 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Store Visitors</span>
            <Users className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900">
            {summary?.totalVisitors ?? '...'}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-bold border-t pt-1.5">
            <Smartphone className="w-3 h-3 text-neutral-600" />
            <span>{summary?.mobileVisitors ?? 0} Mobile</span>
            <span className="text-neutral-300">•</span>
            <Monitor className="w-3 h-3 text-neutral-600" />
            <span>{summary?.desktopVisitors ?? 0} Web</span>
          </div>
        </div>

        {/* Metric 2: Today's Logins */}
        <div className="bg-white border-2 border-neutral-900 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Shopper Logins</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {summary?.todayLoginsCount ?? '...'}
          </div>
          <div className="text-[10px] text-neutral-500 font-bold border-t pt-1.5 truncate">
            {summary?.totalCustomers ?? 0} Total registered accounts
          </div>
        </div>

        {/* Metric 3: Orders Placed */}
        <div className="bg-white border-2 border-neutral-900 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Orders Placed</span>
            <ShoppingBag className="w-4 h-4 text-[#E51E2B]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900">
            {summary?.totalOrders ?? '...'}
          </div>
          <div className="text-[10px] text-neutral-500 font-bold border-t pt-1.5 flex items-center justify-between">
            <span className="text-emerald-700">{summary?.completedOrders ?? 0} Delivered</span>
            <span className="text-amber-700">{summary?.pendingOrders ?? 0} In Flight</span>
          </div>
        </div>

        {/* Metric 4: Gross Revenue */}
        <div className="bg-white border-2 border-neutral-900 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900">
            {formatCurrency(summary?.totalRevenue ?? 0)}
          </div>
          <div className="text-[10px] text-neutral-500 font-bold border-t pt-1.5 truncate">
            AOV: {formatCurrency(summary?.avgOrderValue ?? 0)}
          </div>
        </div>

        {/* Metric 5: Store Conversion Rate */}
        <div className="bg-white border-2 border-neutral-900 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Order Conversion</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900">
            {summary?.conversionRate ?? 0}%
          </div>
          <div className="text-[10px] text-neutral-500 font-bold border-t pt-1.5 truncate">
            Visitors who completed orders
          </div>
        </div>

        {/* Metric 6: Price Check to Cart Drop-off */}
        <div className="bg-white border-2 border-neutral-900 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Cart Abandonment</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">
            {summary?.cartAbandonmentRate ?? 0}%
          </div>
          <div className="text-[10px] text-neutral-500 font-bold border-t pt-1.5 truncate">
            Added to bag but left checkout
          </div>
        </div>
      </div>

      {/* 3. SECTION NAVIGATION TABS */}
      <div className="flex border-b-2 border-neutral-900 bg-neutral-100 overflow-x-auto gap-1 p-1">
        {[
          { id: 'overview', label: 'Executive Pulse & Funnel', icon: Layers, badge: null },
          { id: 'orders', label: 'Who Placed Orders', icon: ShoppingBag, badge: summary?.recentOrders?.length },
          { id: 'logins', label: 'Who Logged In Today', icon: Users, badge: summary?.todayLoginsCount },
          { id: 'products', label: 'Most Checked Products', icon: Eye, badge: summary?.topProducts?.length },
          { id: 'live_feed', label: 'Live Activity Radar ("Site Actions")', icon: Activity, badge: 'Live' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-bold uppercase whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <span className={`text-[9px] px-1.5 py-0.2 font-black ${
                  isActive ? 'bg-[#E51E2B] text-white' : 'bg-neutral-300 text-neutral-800'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* SECTION A: OVERVIEW & FUNNEL */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Conversion Funnel Banner */}
          <div className="bg-white border-2 border-neutral-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  Shopper Behavior & Drop-Off Funnel
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Visual breakdown of customers who view prices, add to bag, proceed to checkout, or bounce.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800 px-2.5 py-1 border border-neutral-300">
                End-to-End Store Conversion: {summary?.conversionRate ?? 0}%
              </span>
            </div>

            {/* 5-Step Funnel visualization */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              {[
                { 
                  step: '1. Store Visitors', 
                  count: summary?.funnel?.visitors ?? summary?.totalVisitors ?? 0, 
                  pct: '100%', 
                  desc: 'Total shoppers who arrived on storefront',
                  color: 'bg-neutral-900 text-white' 
                },
                { 
                  step: '2. Checked Prices', 
                  count: summary?.funnel?.productViews ?? (summary?.totalVisitors ? summary.totalVisitors * 3 : 0), 
                  pct: summary?.funnel?.visitors ? `${Math.min(100, Math.round(((summary.funnel.productViews) / summary.funnel.visitors) * 100))}%` : '85%', 
                  desc: 'Inspected drop details and retail prices',
                  color: 'bg-neutral-800 text-white' 
                },
                { 
                  step: '3. Added To Bag', 
                  count: summary?.funnel?.addToCarts ?? 6, 
                  pct: summary?.funnel?.visitors ? `${Math.round(((summary.funnel.addToCarts || 6) / (summary.funnel.visitors || 1)) * 100)}%` : '32%', 
                  desc: 'Selected size and colorway to bag',
                  color: 'bg-neutral-700 text-white' 
                },
                { 
                  step: '4. Reached Checkout', 
                  count: summary?.funnel?.checkouts ?? 4, 
                  pct: summary?.funnel?.visitors ? `${Math.round(((summary.funnel.checkouts || 4) / (summary.funnel.visitors || 1)) * 100)}%` : '18%', 
                  desc: 'Filled address & delivery options',
                  color: 'bg-neutral-600 text-white' 
                },
                { 
                  step: '5. Orders Paid', 
                  count: summary?.funnel?.orders ?? summary?.totalOrders ?? 0, 
                  pct: `${summary?.conversionRate ?? 0}%`, 
                  desc: 'Razorpay or verified purchase confirmed',
                  color: 'bg-[#E51E2B] text-white font-black' 
                }
              ].map((stage, idx) => (
                <div key={stage.step} className="border border-neutral-300 bg-neutral-50 p-3 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-neutral-500 block">{stage.step}</span>
                    <div className="text-xl font-black text-neutral-900">{stage.count}</div>
                  </div>
                  <div className={`p-1 text-center text-[10px] font-bold uppercase ${stage.color}`}>
                    {stage.pct} of visitors
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-tight">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Snapshot: Top 3 Most Checked & Top 3 Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Checked Drops */}
            <div className="bg-white border-2 border-neutral-900 p-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#E51E2B]" />
                  <h3 className="text-xs font-black uppercase text-neutral-900">Most Checked Garments</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('products')}
                  className="text-[11px] font-bold text-[#E51E2B] hover:underline uppercase flex items-center gap-0.5"
                >
                  <span>View All Leaderboard</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                {(summary?.topProducts || []).slice(0, 4).map((prod, idx) => (
                  <div key={prod.id || idx} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold uppercase text-neutral-900 truncate">{prod.name}</h4>
                        <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                          <span className="font-bold text-black">{formatCurrency(prod.price)}</span>
                          <span>•</span>
                          <span>{prod.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-neutral-900">{prod.views} views</div>
                      <span className="text-[10px] text-emerald-700 font-bold">{prod.ordersCount} ordered ({prod.conversionRate}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white border-2 border-neutral-900 p-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-xs font-black uppercase text-neutral-900">Recent Customer Purchases</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('orders')}
                  className="text-[11px] font-bold text-[#E51E2B] hover:underline uppercase flex items-center gap-0.5"
                >
                  <span>View All ({summary?.recentOrders?.length || 0})</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                {(summary?.recentOrders || []).slice(0, 4).map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800">
                          {ord.paymentStatus}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold uppercase text-neutral-900 truncate mt-0.5">{ord.customerName}</h4>
                      <p className="text-[10px] text-neutral-500">{ord.customerEmail} • {formatRelativeTime(ord.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-neutral-900">{formatCurrency(ord.totalAmount)}</div>
                      <span className="text-[10px] text-neutral-500 font-bold">{ord.items ? `${ord.items.length} item(s)` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: WHO PLACED ORDERS */}
      {activeSection === 'orders' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-neutral-50 border border-neutral-300 p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search order #, customer, email..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-neutral-300 bg-white text-xs font-bold"
                />
              </div>

              {/* Status filter */}
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="p-1.5 border border-neutral-300 bg-white text-xs font-bold uppercase"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleExportOrdersCsv}
                className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border-2 border-neutral-900 overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                  <th className="p-3">Order # & Date</th>
                  <th className="p-3">Customer Details</th>
                  <th className="p-3">Garments Purchased</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-center">Payment</th>
                  <th className="p-3 text-center">Delivery</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400 font-bold uppercase">
                      No orders found matching the selected timeframe and search.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Order info */}
                      <td className="p-3 align-top whitespace-nowrap">
                        <span className="font-bold text-neutral-900 block font-mono text-xs">{order.orderNumber}</span>
                        <span className="text-[10px] text-neutral-500 block">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        <span className="text-[9px] text-neutral-400">{formatRelativeTime(order.createdAt)}</span>
                      </td>

                      {/* Customer info */}
                      <td className="p-3 align-top min-w-[180px]">
                        <div className="font-bold uppercase text-neutral-900">{order.customerName}</div>
                        <div className="text-[11px] text-neutral-500 truncate">{order.customerEmail}</div>
                        {order.customerPhone && (
                          <div className="text-[10px] text-neutral-600 font-mono flex items-center gap-1 mt-0.5">
                            <span>Ph: {order.customerPhone}</span>
                            <a
                              href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(order.customerName)},%20regarding%20your%20TH3EE%20order%20${order.orderNumber}...`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3 inline" />
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Purchased items */}
                      <td className="p-3 align-top min-w-[200px]">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((it, i) => (
                              <div key={i} className="text-[11px] text-neutral-800 flex items-center justify-between gap-2">
                                <span className="font-bold truncate">
                                  {it.quantity}× {it.productName}
                                  {it.size ? ` (${it.size})` : ''}
                                </span>
                                <span className="text-neutral-500 shrink-0 font-mono">
                                  {formatCurrency(it.unitPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[10px]">Standard drop items</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="p-3 align-top text-right whitespace-nowrap font-black text-neutral-900 text-sm">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      {/* Payment Status */}
                      <td className="p-3 align-top text-center whitespace-nowrap">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 border ${
                          order.paymentStatus.toLowerCase() === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Delivery Status */}
                      <td className="p-3 align-top text-center whitespace-nowrap">
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-300">
                          {order.deliveryStatus || order.orderStatus || 'Processing'}
                        </span>
                        {order.trackingNumber && (
                          <span className="block text-[9px] text-neutral-400 font-mono mt-0.5">
                            #{order.trackingNumber}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenOrder) onOpenOrder(order.id);
                            else showNotification(`Inspecting order #${order.orderNumber}`);
                          }}
                          className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-2.5 py-1 text-[10px] font-bold uppercase transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION C: WHO LOGGED IN TODAY (CUSTOMER LEDGER) */}
      {activeSection === 'logins' && (
        <div className="space-y-4">
          <div className="bg-neutral-50 border border-neutral-300 p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase text-neutral-900">Daily Customer Logins & Active Shoppers</h2>
              <p className="text-[11px] text-neutral-500">
                Track customers who signed in today, their lifetime order volume, and direct WhatsApp contact links.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter by name or email..."
                  value={loginSearch}
                  onChange={e => setLoginSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-neutral-300 bg-white text-xs font-bold"
                />
              </div>
              <button
                type="button"
                onClick={handleExportLoginsCsv}
                className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Customers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLogins.length === 0 ? (
              <div className="col-span-full bg-white border border-neutral-200 p-8 text-center text-neutral-400 font-bold uppercase text-xs">
                No customer accounts found matching filter.
              </div>
            ) : (
              filteredLogins.map(cust => (
                <div key={cust.id} className="bg-white border-2 border-neutral-900 p-4 space-y-3 shadow-xs hover:border-[#E51E2B] transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 bg-neutral-900 text-white font-black text-sm flex items-center justify-center shrink-0 uppercase border border-neutral-800">
                        {cust.name.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black uppercase text-neutral-900 truncate">{cust.name}</h4>
                          {cust.isToday && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-1.5 py-0.2 border border-emerald-300">
                              Logged In Today
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate">{cust.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Meta */}
                  <div className="bg-neutral-50 p-2.5 border border-neutral-200 grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-neutral-400 uppercase font-bold block">Lifetime Orders</span>
                      <span className="font-black text-neutral-900 text-xs">{cust.orderCount} Orders</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 uppercase font-bold block">Total Spend</span>
                      <span className="font-black text-emerald-700 text-xs">{formatCurrency(cust.totalSpent)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-500 flex justify-between items-center pt-1 border-t">
                    <span>Active: {cust.lastLoginAt ? formatRelativeTime(cust.lastLoginAt) : 'Recent'}</span>
                    {cust.phone ? (
                      <a
                        href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(cust.name)},%20welcome%20back%20to%20TH3EE%20Atelier!`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp Customer</span>
                      </a>
                    ) : (
                      <span className="text-neutral-400">Phone not set</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION D: MOST CHECKED PRODUCTS (POPULARITY & BOUNCE ANALYSIS) */}
      {activeSection === 'products' && (
        <div className="space-y-4">
          <div className="bg-neutral-50 border border-neutral-300 p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase text-neutral-900">Most Checked Garments & Price Inspection Leaderboard</h2>
              <p className="text-[11px] text-neutral-500">
                Identify which drops get the most clicks and views, versus which convert to cart additions and paid orders.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportProductsCsv}
              className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors self-end sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Product Leaderboard Table */}
          <div className="bg-white border-2 border-neutral-900 overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">Garment Silhouette</th>
                  <th className="p-3">Retail Price</th>
                  <th className="p-3 text-center">Price Checks / Views</th>
                  <th className="p-3 text-center">Added to Bag</th>
                  <th className="p-3 text-center">Paid Orders</th>
                  <th className="p-3 text-center">Conversion</th>
                  <th className="p-3 text-right">Engagement Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {(summary?.topProducts || []).map((prod, idx) => {
                  const isHot = idx === 0 || prod.views >= 35;
                  const isHighDropoff = prod.views > 20 && prod.ordersCount === 0;

                  return (
                    <tr key={prod.id || idx} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-3 text-center font-black text-neutral-400">
                        <span className={`inline-flex items-center justify-center w-6 h-6 ${
                          idx === 0 ? 'bg-[#E51E2B] text-white' : idx === 1 ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-800'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>

                      <td className="p-3 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          {prod.imageUrl ? (
                            <img
                              src={resolveProductImageUrl(prod.imageUrl)}
                              onError={handleImageLoadError}
                              alt=""
                              className="w-10 h-12 object-cover border border-neutral-300 bg-neutral-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-12 bg-neutral-200 border border-neutral-300 shrink-0 flex items-center justify-center text-[10px] font-bold">
                              TH
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold uppercase text-neutral-900">{prod.name}</h4>
                            <span className="text-[10px] text-neutral-400 uppercase font-bold">{prod.category}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap font-black text-neutral-900">
                        {formatCurrency(prod.price)}
                      </td>

                      <td className="p-3 text-center font-bold text-neutral-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{prod.views}</span>
                        </span>
                      </td>

                      <td className="p-3 text-center font-bold text-neutral-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{prod.cartAdds}</span>
                        </span>
                      </td>

                      <td className="p-3 text-center font-black text-emerald-700 whitespace-nowrap">
                        {prod.ordersCount} units
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="font-bold text-xs">{prod.conversionRate}%</span>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        {isHot && (
                          <span className="bg-red-100 text-red-800 text-[9px] font-black uppercase px-2 py-0.5 border border-red-300 inline-flex items-center gap-1">
                            <Flame className="w-3 h-3 text-red-600" />
                            <span>Hot Drop</span>
                          </span>
                        )}
                        {isHighDropoff && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 border border-amber-300 ml-1">
                            High Price Check Dropoff
                          </span>
                        )}
                        {!isHot && !isHighDropoff && (
                          <span className="text-[10px] text-neutral-500 font-bold uppercase">
                            Steady Interest
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION E: LIVE ACTIVITY RADAR ("SITE ACTIONS STREAM") */}
      {activeSection === 'live_feed' && (
        <div className="space-y-4">
          <div className="bg-neutral-50 border border-neutral-300 p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h2 className="text-sm font-bold uppercase text-neutral-900">Live Shopper Action Stream</h2>
              </div>
              <p className="text-[11px] text-neutral-500">
                Audits what users and visitors are doing across the storefront right now in real time.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto text-xs font-bold">
              {[
                { id: 'all', label: 'All Actions' },
                { id: 'views', label: 'Price & Drop Views' },
                { id: 'cart', label: 'Bag Actions' },
                { id: 'orders', label: 'Orders & Checkout' },
                { id: 'logins', label: 'Logins' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFeedFilter(f.id)}
                  className={`px-2.5 py-1 uppercase text-[10px] ${
                    feedFilter === f.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Timeline List */}
          <div className="bg-white border-2 border-neutral-900 divide-y divide-neutral-200 shadow-xs">
            {filteredLiveFeed.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 font-bold uppercase text-xs">
                No real-time actions recorded yet for this filter.
              </div>
            ) : (
              filteredLiveFeed.map((evt, idx) => {
                let badgeColor = 'bg-neutral-100 text-neutral-800 border-neutral-300';
                let icon = <Eye className="w-3.5 h-3.5" />;
                let actionLabel = 'Viewed Page';

                if (evt.eventType === 'product_view' || evt.eventType === 'price_view') {
                  badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                  icon = <Eye className="w-3.5 h-3.5 text-blue-600" />;
                  actionLabel = 'Checked Product Price';
                } else if (evt.eventType === 'add_to_cart') {
                  badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
                  icon = <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />;
                  actionLabel = 'Added Drop to Bag';
                } else if (evt.eventType === 'checkout_started') {
                  badgeColor = 'bg-purple-50 text-purple-800 border-purple-200';
                  icon = <ExternalLink className="w-3.5 h-3.5 text-purple-600" />;
                  actionLabel = 'Proceeded to Checkout';
                } else if (evt.eventType === 'order_placed') {
                  badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-400 font-black';
                  icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
                  actionLabel = 'Completed Order';
                } else if (evt.eventType === 'user_login') {
                  badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
                  actionLabel = 'Customer Signed In';
                }

                return (
                  <div key={evt.id || idx} className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-neutral-100 border border-neutral-200 shrink-0">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 border ${badgeColor}`}>
                            {actionLabel}
                          </span>
                          {evt.deviceType && (
                            <span className="text-[9px] text-neutral-400 uppercase font-mono">
                              via {evt.deviceType}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-neutral-900 mt-0.5 truncate">
                          {evt.itemName || evt.path || 'Storefront Action'}
                          {evt.itemPrice ? ` • ${formatCurrency(evt.itemPrice)}` : ''}
                        </h4>
                        <div className="text-[10px] text-neutral-500">
                          {evt.customerName || evt.customerEmail ? (
                            <span className="text-black font-semibold">{evt.customerName || evt.customerEmail}</span>
                          ) : (
                            <span>Anonymous Visitor</span>
                          )}
                          {evt.path && evt.itemName ? ` on ${evt.path}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-neutral-400 font-mono">
                        {formatRelativeTime(evt.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsDashboard;

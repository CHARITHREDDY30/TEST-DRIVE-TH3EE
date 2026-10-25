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
  Monitor
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
  
  // Primary Peaceful View: Orders first!
  const [activeTab, setActiveTab] = useState<'orders' | 'logins' | 'products' | 'live_feed'>('orders');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'paid' | 'pending' | 'delivered'>('all');
  const [feedFilter, setFeedFilter] = useState('all');

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

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!summary?.recentOrders) return [];
    return summary.recentOrders.filter(ord => {
      const q = searchQuery.toLowerCase().trim();
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
  }, [summary?.recentOrders, searchQuery, orderStatusFilter]);

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

  // CSV Exporters
  const handleExportOrdersCsv = () => {
    if (!summary?.recentOrders || summary.recentOrders.length === 0) {
      showNotification('No orders available to export.');
      return;
    }
    const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Customer Phone', 'Total Amount (INR)', 'Payment Status', 'Order Status', 'Items Count'];
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
          1. PEACEFUL TOP HEADER & TIME CONTROL
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Live Store Monitor
            </span>
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">•</span>
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
              Refreshed {formatRelativeTime(lastRefreshed.toISOString())}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-950 font-['Montserrat',sans-serif]">
            Daily Intelligence & Orders
          </h2>
          <p className="text-xs text-neutral-500 font-medium">
            Peaceful real-time tracking of shoppers, orders, logins, and product interest across th3ee.in
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
          onClick={() => setActiveTab('orders')}
          className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-[#E51E2B] transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Orders Placed</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E51E2B] flex items-center justify-center group-hover:bg-[#E51E2B] group-hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 mt-2">
            {summary?.totalOrders ?? 0}
          </div>
          <div className="text-xs font-bold text-neutral-500 mt-1">
            {timeframeLabels[timeframe]} storefront orders
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
              label: 'Daily Orders', 
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
              TAB 1: DAILY ORDERS (The User's Core Need - Peaceful & Effortless)
          ===================================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              
              {/* Search & Status Filters */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pb-3 border-b border-neutral-100">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by customer name, phone, email, or order #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-xs font-medium rounded-xl border border-neutral-200 focus:border-[#E51E2B] focus:ring-1 focus:ring-[#E51E2B] focus:outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 hidden md:inline">
                    Payment Status:
                  </span>
                  {(['all', 'paid', 'pending'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                        orderStatusFilter === status
                          ? 'bg-neutral-950 text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {status === 'all' ? 'All Orders' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                  <h4 className="text-sm font-black uppercase text-neutral-700 tracking-wide">
                    No orders found for this timeframe
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    When customers purchase garments on th3ee.in, their orders and instant WhatsApp contact links will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="bg-neutral-50/70 hover:bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 transition-all hover:shadow-sm hover:border-neutral-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left: Order Info & Customer Details */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-sm text-neutral-950">
                            {order.orderNumber}
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-xs text-neutral-500 font-medium">
                            {formatRelativeTime(order.createdAt)}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            order.paymentStatus.toLowerCase() === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                          <span className="text-[10px] font-black uppercase bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">
                            {order.orderStatus}
                          </span>
                        </div>

                        {/* Customer row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="font-black uppercase text-neutral-900">
                            {order.customerName}
                          </span>
                          <span className="text-neutral-500">
                            {order.customerEmail}
                          </span>
                          {order.customerPhone && (
                            <span className="font-mono text-neutral-600 font-bold">
                              {order.customerPhone}
                            </span>
                          )}
                        </div>

                        {/* Garments bought */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((it, idx) => (
                              <div key={idx} className="bg-white border border-neutral-200 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-800 flex items-center gap-1.5 shadow-2xs">
                                <span className="font-black text-neutral-900">{it.quantity}×</span>
                                <span className="truncate max-w-[180px]">{it.productName}</span>
                                {it.size && (
                                  <span className="bg-neutral-100 font-black text-[10px] px-1.5 py-0.2 rounded text-neutral-600">
                                    {it.size}
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-neutral-400">Standard drop garments</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Total Amount & 1-Click WhatsApp Trigger */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-200">
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                            Order Total
                          </span>
                          <span className="text-lg font-black text-neutral-950 font-mono">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.customerPhone && (
                            <a
                              href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(order.customerName)},%20regarding%20your%20TH3EE%20order%20${order.orderNumber}...`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenOrder) onOpenOrder(order.id);
                              else showNotification(`Opening order details for #${order.orderNumber}`);
                            }}
                            className="px-3.5 py-2 bg-neutral-950 hover:bg-[#E51E2B] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs"
                          >
                            Details
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
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

    </div>
  );
};

export default AdminAnalyticsDashboard;

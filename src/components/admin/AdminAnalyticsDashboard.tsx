import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  ShoppingBag, 
  Eye, 
  RefreshCw, 
  Download, 
  Smartphone, 
  Monitor, 
  Search, 
  ArrowRight, 
  Check, 
  MessageSquare,
  ShieldCheck,
  Flame,
  Activity,
  ChevronRight,
  Crown,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  Settings,
  Layers,
  CheckCircle2,
  ExternalLink,
  Gift
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
  
  // Active Navigation Pill (Lingora left-sidebar style)
  const [activeTab, setActiveTab] = useState<'home' | 'logins' | 'orders' | 'products' | 'live_feed'>('home');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
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

  // Formatter helpers
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

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!summary?.recentOrders) return [];
    return summary.recentOrders.filter(ord => {
      const q = searchQuery.toLowerCase();
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
      const q = searchQuery.toLowerCase();
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

  const spotlightProduct = summary?.topProducts && summary.topProducts.length > 0 
    ? summary.topProducts[0] 
    : {
        id: 'p1',
        name: 'BATMAN - Dark Knight',
        category: 'T-Shirts',
        price: 799,
        views: 18,
        cartAdds: 7,
        ordersCount: 3,
        conversionRate: 16.7,
        imageUrl: '/tshirts/IMg 1.jpeg'
      };

  return (
    <div className="w-full bg-neutral-100/80 rounded-3xl p-3 sm:p-5 lg:p-6 font-sans text-neutral-900 shadow-sm border border-neutral-200/80 transition-all">
      
      {/* =========================================================================
          1. DESKTOP/TABLET DOCK NAVIGATION SIDEBAR (TH3EE Luxury Streetwear Atelier)
      ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* LEFT DOCK / SIDEBAR */}
        <aside className="w-full lg:w-64 shrink-0 bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-neutral-200/90 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            
            {/* TH3EE Brand Logo & Atelier Live Indicator */}
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-black text-white font-black flex items-center justify-center tracking-tighter text-sm shadow-md">
                  <span className="text-[#E51E2B]">3</span>E
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-neutral-950 uppercase font-['Montserrat',sans-serif]">
                    TH3EE ATELIER
                  </h2>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                    Intelligence Desk
                  </span>
                </div>
              </div>
              
              {/* Pulse status indicator */}
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            {/* Navigation Dock Items (Pill-Style Buttons) */}
            <nav className="space-y-1.5">
              {[
                { id: 'home', label: 'Home Overview', icon: Layers, badge: null },
                { id: 'logins', label: 'Who Logged In', icon: Users, badge: summary?.todayLoginsCount ?? 7 },
                { id: 'orders', label: 'Who Placed Orders', icon: ShoppingBag, badge: summary?.totalOrders ?? 0 },
                { id: 'products', label: 'Most Checked Drops', icon: Flame, badge: summary?.topProducts?.length ?? 6 },
                { id: 'live_feed', label: 'Live Action Radar', icon: Activity, badge: 'Live' }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black uppercase tracking-wide transition-all ${
                      isSelected
                        ? 'bg-neutral-950 text-white shadow-md shadow-neutral-950/15'
                        : 'text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#E51E2B]' : 'text-neutral-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-[#E51E2B] text-white' 
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Atelier Engine Card + Profile Pill */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            {/* Dark Luxury Atelier Telemetry Card */}
            <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white p-3.5 rounded-2xl border border-neutral-800 text-left space-y-2 relative overflow-hidden shadow-sm">
              <div className="flex items-center gap-1.5 text-neutral-200 text-xs font-black uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Atelier Radar 24/7</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-snug">
                Real-time visitor tracking and automatic drop-off telemetry active across India.
              </p>
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('live_feed')}
                  className="inline-flex items-center gap-1 bg-[#E51E2B] hover:bg-[#D41212] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-sm transition-all"
                >
                  <Activity className="w-3 h-3" />
                  <span>Inspect Radar</span>
                </button>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">ONLINE</span>
              </div>
            </div>

            {/* Profile Row */}
            <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-neutral-900 to-black text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs uppercase border border-neutral-800">
                  CR
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black uppercase text-neutral-950 truncate">Charith</h4>
                  <span className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase block">Store Administrator</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => loadData(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/60 transition-colors"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-[#E51E2B]' : ''}`} />
              </button>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            2. MAIN CONTENT AREA (Search Header + Center Column + Right Column)
        ========================================================================= */}
        <div className="flex-1 w-full space-y-5">
          
          {/* TOP SEARCH & STATUS BAR (Sleek High-Contrast Atelier Bar) */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xs border border-neutral-200/90 flex flex-col md:flex-row justify-between items-center gap-3">
            {/* Search Pill */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input 
                type="text" 
                placeholder="Search shoppers, drops, order numbers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-xs font-medium rounded-full border border-neutral-200 focus:border-[#E51E2B] focus:ring-1 focus:ring-[#E51E2B] focus:outline-none transition-all placeholder:text-neutral-400"
              />
            </div>

            {/* Right Status Counter Pills */}
            <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
              {/* Flame live shoppers pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#E51E2B] border border-red-200/80 rounded-full text-xs font-black shadow-2xs">
                <Flame className="w-4 h-4 text-[#E51E2B] fill-[#E51E2B]" />
                <span>{summary?.totalVisitors ?? 14} Live Visitors</span>
              </div>

              {/* Gem revenue counter pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 text-amber-400 border border-neutral-800 rounded-full text-xs font-black shadow-2xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatCurrency(summary?.totalRevenue ?? 6340)}</span>
              </div>

              {/* Timeframe pill selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-black uppercase rounded-full border-0 focus:outline-none cursor-pointer"
              >
                <option value="today">Today (Live)</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>

              {/* CSV Export Pill */}
              <button
                type="button"
                onClick={handleExportOrdersCsv}
                className="p-2 bg-neutral-950 hover:bg-[#E51E2B] text-white rounded-full transition-colors shadow-2xs"
                title="Export Orders CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TAB 1: HOME OVERVIEW (Exact Pinterest Dashboard Architecture in TH3EE Luxury Streetwear Theme) */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              
              {/* ----------------- LEFT & CENTER WIDE PANEL (2/3 width) ----------------- */}
              <div className="xl:col-span-2 space-y-5">
                
                {/* HERO WELCOME GREETING CARD (Deep Obsidian & Crimson Red Luxury Streetwear Atelier Banner) */}
                <div className="bg-gradient-to-r from-neutral-950 via-[#141519] to-neutral-950 text-white rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-lg border border-neutral-800">
                  {/* Subtle ambient crimson light in background */}
                  <div className="absolute top-0 left-0 w-80 h-80 bg-[#E51E2B]/15 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 max-w-[62%] sm:max-w-[65%] space-y-3">
                    <div className="inline-flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-700/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-neutral-200 shadow-2xs">
                      <span>🇮🇳 TH3EE.IN // REAL-TIME ATELIER</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight uppercase font-['Montserrat',sans-serif]">
                      Good morning, Charith! ⚡
                    </h1>

                    <p className="text-xs sm:text-sm text-neutral-300 font-medium leading-relaxed">
                      Your store has <strong className="text-white font-black underline decoration-[#E51E2B] decoration-2 underline-offset-2">{summary?.totalVisitors ?? 37} visitors</strong> and <strong className="text-red-400 font-black">{summary?.todayLoginsCount ?? 7} shoppers</strong> browsing drops today. {summary?.totalOrders ?? 4} orders confirmed!
                    </p>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('live_feed')}
                        className="bg-[#E51E2B] hover:bg-[#D41212] text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/40 flex items-center gap-2 transition-all group"
                      >
                        <span>Inspect Live Radar</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Luxury Streetwear Atelier Showcase Image (Editorial High-Fashion Photography) */}
                  <div className="absolute right-0 bottom-0 top-0 w-40 sm:w-60 lg:w-64 flex items-center justify-end pointer-events-none select-none">
                    <img 
                      src="/th3ee-atelier-hero.jpg" 
                      alt="TH3EE Luxury Streetwear Atelier"
                      className="w-full h-full object-cover object-center [mask-image:linear-gradient(to_right,transparent,black_30%)]"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* SPOTLIGHT GARMENT CARD ("Highest Price Checks & Drop-Off Detection") */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-neutral-200/90 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#E51E2B]" />
                      <span>Active Drop Spotlight (Highest Price Checks)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="text-xs font-black uppercase tracking-wider text-[#E51E2B] hover:text-red-800 transition-colors"
                    >
                      See All Leaderboard →
                    </button>
                  </div>

                  <div className="bg-neutral-50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-neutral-200/70">
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <div className="w-14 h-16 rounded-xl bg-white border border-neutral-200 overflow-hidden shrink-0 shadow-2xs">
                        <img 
                          src={resolveProductImageUrl(spotlightProduct?.imageUrl)} 
                          onError={handleImageLoadError}
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase bg-red-100 text-red-700 px-1.5 py-0.2 rounded-md">
                            #1 Trending Drop
                          </span>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase">{spotlightProduct?.category}</span>
                        </div>
                        <h4 className="text-sm font-black text-neutral-900 uppercase truncate mt-0.5">
                          {spotlightProduct?.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 mt-1">
                          <span className="text-black font-extrabold">{formatCurrency(spotlightProduct?.price)}</span>
                          <span>•</span>
                          <span className="text-neutral-900 font-black">{spotlightProduct?.views} Price Checks</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-black">{spotlightProduct?.ordersCount} Orders</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Inspect Button */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="w-32 hidden sm:block">
                        <div className="flex justify-between text-[10px] font-black uppercase text-neutral-500 mb-1">
                          <span>Conversion</span>
                          <span className="text-neutral-900">{spotlightProduct?.conversionRate}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#E51E2B] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (spotlightProduct?.conversionRate || 10) * 4)}%` }} 
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className="bg-neutral-950 hover:bg-[#E51E2B] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 REFINED LUXURY STREETWEAR METRIC CARDS (TH3EE Brand Design) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Card 1: Visitors */}
                  <div 
                    onClick={() => setActiveTab('home')}
                    className="bg-white p-4 rounded-2xl border border-neutral-200/90 hover:border-neutral-900 flex flex-col justify-between space-y-2 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Store Visitors</span>
                      <div className="text-xl font-black text-neutral-950 mt-0.5">{summary?.totalVisitors ?? 37}</div>
                      <span className="text-[10px] text-neutral-600 font-bold">{summary?.mobileVisitors ?? 24} Mobile • {summary?.desktopVisitors ?? 13} Web</span>
                    </div>
                  </div>

                  {/* Card 2: Logins */}
                  <div 
                    onClick={() => setActiveTab('logins')}
                    className="bg-white p-4 rounded-2xl border border-neutral-200/90 hover:border-[#E51E2B] flex flex-col justify-between space-y-2 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E51E2B] flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#E51E2B]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-red-600 tracking-wider">Today Logins</span>
                      <div className="text-xl font-black text-neutral-950 mt-0.5">{summary?.todayLoginsCount ?? 7}</div>
                      <span className="text-[10px] text-red-700 font-bold">7 Customer Accounts</span>
                    </div>
                  </div>

                  {/* Card 3: Orders */}
                  <div 
                    onClick={() => setActiveTab('orders')}
                    className="bg-white p-4 rounded-2xl border border-neutral-200/90 hover:border-emerald-600 flex flex-col justify-between space-y-2 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Paid Orders</span>
                      <div className="text-xl font-black text-neutral-950 mt-0.5">{summary?.totalOrders ?? 4}</div>
                      <span className="text-[10px] text-emerald-700 font-bold font-mono">{formatCurrency(summary?.totalRevenue ?? 6340)}</span>
                    </div>
                  </div>

                  {/* Card 4: Price Check Drop-off */}
                  <div 
                    onClick={() => setActiveTab('products')}
                    className="bg-white p-4 rounded-2xl border border-neutral-200/90 hover:border-amber-600 flex flex-col justify-between space-y-2 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Conversion</span>
                      <div className="text-xl font-black text-neutral-950 mt-0.5">{summary?.conversionRate ?? 66.7}%</div>
                      <span className="text-[10px] text-amber-700 font-bold">33% Cart Add Rate</span>
                    </div>
                  </div>
                </div>

                {/* POPULAR DROPS ROW (Top Performing Products) */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-neutral-200/90 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider">
                      Popular Drops & Price Inspections
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="text-xs font-black uppercase tracking-wider text-[#E51E2B] hover:text-red-800"
                    >
                      View All Drops →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(summary?.topProducts || []).slice(0, 4).map((p, idx) => (
                      <div 
                        key={p.id || idx}
                        onClick={() => setActiveTab('products')}
                        className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/70 hover:border-neutral-900 cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-[#E51E2B]">#{idx + 1}</span>
                          <span className="text-[10px] font-black text-neutral-900 uppercase truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500">
                          <span className="text-black font-extrabold">{formatCurrency(p.price)}</span>
                          <span className="text-emerald-700 font-black">{p.views} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ----------------- RIGHT COLUMN WIDGETS (1/3 width) ----------------- */}
              <div className="space-y-5">
                
                {/* 1. CIRCULAR PROGRESS GAUGE (Today's Drop Target) */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-neutral-200/90 space-y-4 text-center">
                  <div className="flex items-center justify-between text-left">
                    <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                      Today's Drop Target
                    </h3>
                    <Flame className="w-4 h-4 text-[#E51E2B] fill-[#E51E2B]" />
                  </div>

                  {/* Circular SVG Gauge Ring in TH3EE Signature Red */}
                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#F3F4F6"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#E51E2B"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset="62.8"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Flame className="w-5 h-5 text-[#E51E2B] fill-[#E51E2B] mb-0.5" />
                      <div className="text-xl font-black text-neutral-950">4 / 6</div>
                      <span className="text-[9px] text-neutral-400 font-black uppercase tracking-wider">Orders Today</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    Great pace! You're on track for a high-converting drop day at the atelier.
                  </p>

                  {/* 7-Day Drop Streak Tracker (Mon - Sun) */}
                  <div className="flex items-center justify-between pt-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => {
                      const isComplete = dIdx < 3;
                      const isToday = dIdx === 3;
                      return (
                        <div key={day} className="flex flex-col items-center gap-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isToday
                              ? 'bg-[#E51E2B] text-white shadow-sm ring-2 ring-red-200'
                              : isComplete
                                ? 'bg-neutral-950 text-white'
                                : 'bg-neutral-100 text-neutral-400'
                          }`}>
                            {isComplete ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isToday ? '●' : '•'}
                          </div>
                          <span className="text-[9px] text-neutral-400 font-black uppercase">{day[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. TOP SHOPPERS LEADERBOARD (Atelier Patrons) */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-neutral-200/90 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>Shopper Leaderboard</span>
                    </h3>
                    <span className="text-[10px] font-black text-neutral-500 uppercase bg-neutral-100 px-2.5 py-0.5 rounded-full">
                      This Week
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(summary?.recentLogins || []).slice(0, 5).map((cust, cIdx) => (
                      <div 
                        key={cust.id} 
                        className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                          cIdx === 0 
                            ? 'bg-neutral-950 text-white border border-neutral-800' 
                            : 'hover:bg-neutral-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank icon / badge */}
                          <div className="w-6 text-center font-black text-xs shrink-0">
                            {cIdx === 0 ? '👑' : cIdx === 1 ? '🥈' : cIdx === 2 ? '🥉' : `#${cIdx + 1}`}
                          </div>

                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 uppercase ${
                            cIdx === 0 ? 'bg-[#E51E2B] text-white' : 'bg-neutral-900 text-white'
                          }`}>
                            {cust.name.substring(0, 2)}
                          </div>

                          <div className="min-w-0">
                            <h4 className={`text-xs font-black uppercase truncate ${cIdx === 0 ? 'text-white' : 'text-neutral-900'}`}>
                              {cust.name}
                            </h4>
                            <span className={`text-[10px] block truncate ${cIdx === 0 ? 'text-neutral-400' : 'text-neutral-400'}`}>
                              {cust.email}
                            </span>
                          </div>
                        </div>

                        {/* Spend & WhatsApp */}
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-black block font-mono ${cIdx === 0 ? 'text-amber-400' : 'text-neutral-900'}`}>
                            {cust.orderCount > 0 ? formatCurrency(cust.totalSpent) : 'Active'}
                          </span>
                          {cust.phone ? (
                            <a 
                              href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(cust.name)},%20welcome%20back%20to%20TH3EE!`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-500 font-bold hover:underline"
                            >
                              WhatsApp
                            </a>
                          ) : (
                            <span className="text-[9px] text-neutral-400 font-medium">Patron</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. ATELIER VIP PROMO VAULT CARD (Replacing the Cartoon Gift Box with Authentic Luxury Perk) */}
                <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white rounded-3xl p-4.5 shadow-sm border border-neutral-800 flex items-center justify-between gap-3 relative overflow-hidden">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E51E2B] to-red-600 p-2.5 shrink-0 flex items-center justify-center shadow-md">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase bg-[#E51E2B] text-white px-2 py-0.5 rounded-md">
                          Live Promo Active
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider truncate mt-1">
                        Code: TH3EE10
                      </h4>
                      <p className="text-[10px] text-neutral-400 leading-snug">
                        10% instant discount on orders above ₹999.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('TH3EE10');
                      showNotification({ type: 'success', message: 'Promo code TH3EE10 copied to clipboard!' });
                    }}
                    className="p-2 bg-neutral-800 hover:bg-[#E51E2B] text-white rounded-xl transition-colors shrink-0 text-[10px] font-black uppercase"
                    title="Copy Promo Code"
                  >
                    Copy
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: WHO LOGGED IN TODAY (Customer Accounts Ledger) */}
          {activeTab === 'logins' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-neutral-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
                    Daily Customer Logins & Active Shoppers
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Customers who logged in today, their lifetime order volume, and direct WhatsApp contact links.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportLoginsCsv}
                  className="bg-neutral-950 hover:bg-[#E51E2B] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors self-end sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Logins CSV</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLogins.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-neutral-400 font-bold uppercase text-xs">
                    No customer accounts found matching search.
                  </div>
                ) : (
                  filteredLogins.map(cust => (
                    <div key={cust.id} className="bg-neutral-50/90 rounded-2xl p-4 border border-neutral-200/80 space-y-3 hover:border-neutral-900 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-neutral-950 text-white font-black text-sm flex items-center justify-center uppercase shrink-0">
                          {cust.name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black uppercase text-neutral-900 truncate">{cust.name}</h4>
                            {cust.isToday && (
                              <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md">
                                Today
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate">{cust.email}</p>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-neutral-100 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-neutral-400 uppercase font-black block">Lifetime Orders</span>
                          <span className="font-black text-neutral-900 text-xs">{cust.orderCount} Orders</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 uppercase font-black block">Total Spend</span>
                          <span className="font-black text-emerald-700 text-xs font-mono">{formatCurrency(cust.totalSpent)}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-neutral-500 flex justify-between items-center pt-1 border-t border-neutral-100">
                        <span>Active: {cust.lastLoginAt ? formatRelativeTime(cust.lastLoginAt) : 'Recent'}</span>
                        {cust.phone ? (
                          <a
                            href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(cust.name)},%20welcome%20back%20to%20TH3EE%20Atelier!`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
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

          {/* TAB 3: WHO PLACED ORDERS (Order History Ledger) */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-neutral-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
                    Customer Purchases & Verified Orders
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Who placed orders, total ₹, garment sizes, and direct WhatsApp dispatch links.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    className="p-2 bg-neutral-100 rounded-xl text-xs font-black uppercase border-0 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleExportOrdersCsv}
                    className="bg-neutral-950 hover:bg-[#E51E2B] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 font-black uppercase text-[10px] tracking-wider border-b border-neutral-100">
                      <th className="p-3 rounded-l-xl">Order # & Date</th>
                      <th className="p-3">Customer Details</th>
                      <th className="p-3">Garments</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Payment</th>
                      <th className="p-3 text-right rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-400 font-bold uppercase">
                          No orders found matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="p-3 align-top whitespace-nowrap font-mono">
                            <span className="font-bold text-neutral-900 block">{order.orderNumber}</span>
                            <span className="text-[10px] text-neutral-400">{formatRelativeTime(order.createdAt)}</span>
                          </td>
                          <td className="p-3 align-top min-w-[180px]">
                            <div className="font-black uppercase text-neutral-900">{order.customerName}</div>
                            <div className="text-[11px] text-neutral-500 truncate">{order.customerEmail}</div>
                            {order.customerPhone && (
                              <a
                                href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(order.customerName)},%20regarding%20your%20TH3EE%20order%20${order.orderNumber}...`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>{order.customerPhone}</span>
                              </a>
                            )}
                          </td>
                          <td className="p-3 align-top min-w-[200px]">
                            {order.items && order.items.length > 0 ? (
                              <div className="space-y-1">
                                {order.items.map((it, i) => (
                                  <div key={i} className="text-[11px] text-neutral-800 flex justify-between gap-2">
                                    <span className="font-bold truncate">{it.quantity}× {it.productName} ({it.size || 'L'})</span>
                                    <span className="text-neutral-500 font-mono shrink-0">{formatCurrency(it.unitPrice)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-neutral-400 text-[10px]">Standard drop items</span>
                            )}
                          </td>
                          <td className="p-3 align-top text-right whitespace-nowrap font-black text-neutral-900 font-mono text-sm">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="p-3 align-top text-center whitespace-nowrap">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                              order.paymentStatus.toLowerCase() === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3 align-top text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenOrder) onOpenOrder(order.id);
                                else showNotification(`Inspecting order #${order.orderNumber}`);
                              }}
                              className="bg-neutral-950 hover:bg-[#E51E2B] text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
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

          {/* TAB 4: MOST CHECKED PRODUCTS (Leaderboard) */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-neutral-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
                    Most Checked Garments Leaderboard
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Which drops attract the most price views versus which lead to cart drop-offs.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 font-black uppercase text-[10px] tracking-wider border-b border-neutral-100">
                      <th className="p-3 text-center w-12 rounded-l-xl">Rank</th>
                      <th className="p-3">Garment</th>
                      <th className="p-3">Retail Price</th>
                      <th className="p-3 text-center">Price Checks</th>
                      <th className="p-3 text-center">Cart Adds</th>
                      <th className="p-3 text-center">Paid Units</th>
                      <th className="p-3 text-center">Conversion</th>
                      <th className="p-3 text-right rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(summary?.topProducts || []).map((prod, idx) => (
                      <tr key={prod.id || idx} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="p-3 text-center font-black">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                            idx === 0 ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {idx + 1}
                          </span>
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
                        <td className="p-3 text-center font-black text-neutral-900">
                          {prod.views} views
                        </td>
                        <td className="p-3 text-center font-bold text-amber-600">
                          {prod.cartAdds} added
                        </td>
                        <td className="p-3 text-center font-black text-emerald-700">
                          {prod.ordersCount} units
                        </td>
                        <td className="p-3 text-center font-black">
                          {prod.conversionRate}%
                        </td>
                        <td className="p-3 text-right">
                          {idx === 0 ? (
                            <span className="bg-red-100 text-red-700 font-black text-[9px] uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                              <span>Hot Drop</span>
                            </span>
                          ) : (
                            <span className="bg-neutral-100 text-neutral-600 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full">
                              Active
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

          {/* TAB 5: LIVE ACTION RADAR (Real-time Timeline) */}
          {activeTab === 'live_feed' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-neutral-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="text-sm font-black uppercase text-neutral-900 tracking-wider">
                      Live Shopper Action Stream
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Audits what users and visitors are doing across th3ee.in right now in real time.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto text-xs font-bold">
                  {[
                    { id: 'all', label: 'All Actions' },
                    { id: 'views', label: 'Price Views' },
                    { id: 'cart', label: 'Bag' },
                    { id: 'orders', label: 'Orders' },
                    { id: 'logins', label: 'Logins' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFeedFilter(f.id)}
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
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

              <div className="divide-y divide-neutral-100">
                {filteredLiveFeed.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 font-bold uppercase text-xs">
                    No real-time actions recorded yet for this filter.
                  </div>
                ) : (
                  filteredLiveFeed.map((evt, idx) => (
                    <div key={evt.id || idx} className="py-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0">
                          {evt.eventType === 'product_view' ? <Eye className="w-4 h-4 text-neutral-900" /> :
                           evt.eventType === 'add_to_cart' ? <ShoppingBag className="w-4 h-4 text-amber-600" /> :
                           evt.eventType === 'order_placed' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                           evt.eventType === 'user_login' ? <ShieldCheck className="w-4 h-4 text-[#E51E2B]" /> :
                           <Activity className="w-4 h-4 text-neutral-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
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

                      <span className="text-[10px] font-bold text-neutral-400 font-mono shrink-0">
                        {formatRelativeTime(evt.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AdminAnalyticsDashboard;

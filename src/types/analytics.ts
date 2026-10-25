export type AnalyticsEventType = 
  | 'page_view'
  | 'product_view'
  | 'price_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'order_placed'
  | 'user_login'
  | 'user_signup'
  | 'product_share'
  | 'custom_action';

export interface SiteAnalyticsEvent {
  id?: string;
  sessionId: string;
  visitorId: string;
  eventType: AnalyticsEventType;
  path?: string;
  itemId?: string;
  itemName?: string;
  itemCategory?: string;
  itemPrice?: number;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  referrer?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface ProductPerformanceMetric {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  imageUrl?: string;
  inStock?: boolean;
  views: number;
  cartAdds: number;
  ordersCount: number;
  conversionRate: number;
}

export interface CustomerLoginLedgerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastLoginAt: string;
  createdAt: string;
  isToday: boolean;
  orderCount: number;
  totalSpent: number;
  avatarUrl?: string;
}

export interface RecentOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
  shippingProvider?: string;
  trackingNumber?: string;
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    size?: string;
    color?: string;
    unitPrice: number;
  }>;
}

export interface LiveActivityEvent {
  id: string;
  eventType: string;
  path?: string;
  itemName?: string;
  itemPrice?: number;
  customerEmail?: string;
  customerName?: string;
  deviceType?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsConversionFunnel {
  visitors: number;
  productViews: number;
  addToCarts: number;
  checkouts: number;
  orders: number;
}

export interface AdminAnalyticsDashboardSummary {
  timeframe: 'today' | 'yesterday' | '7days' | '30days' | 'all';
  totalVisitors: number;
  totalSessions: number;
  totalPageviews: number;
  mobileVisitors: number;
  desktopVisitors: number;
  totalCustomers: number;
  todayLoginsCount: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  avgOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  topProducts: ProductPerformanceMetric[];
  recentLogins: CustomerLoginLedgerItem[];
  recentOrders: RecentOrderItem[];
  liveEvents: LiveActivityEvent[];
  funnel: AnalyticsConversionFunnel;
  generatedAt: string;
}

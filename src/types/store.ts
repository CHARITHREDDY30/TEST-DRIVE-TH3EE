export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
}

export interface ProductInventory {
  [colorName: string]: {
    [size: string]: number;
  };
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  universeId: string;
  price: number;
  originalPrice: number;
  gsm: string;
  fabric: string;
  fit: string;
  availableSizes: string[];
  colors: ProductColor[];
  inventory?: ProductInventory;
  badge?: string;
  rating?: number;
  reviewsCount?: number;
  inStock: boolean;
  description: string;
  specs: string[];
  care: string[];
  images: string[];
}

export interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  highlight: string;
  desc: string;
  cta: string;
  target: string;
  bgGradient: string;
  image: string;
  mobileImage?: string;
  badgeColor: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  items: string;
  total: number;
  subtotal?: number;
  discountAmount?: number;
  shippingAmount?: number;
  couponCode?: string;
  status: "Received" | "In Production" | "Dispatched" | "Delivered" | "Packed" | "Out For Delivery" | "Cancelled" | string;
  paymentStatus?: "paid" | "unpaid" | "pending" | "failed" | "refunded" | string;
  deliveryStatus?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress?: any;
  orderItems?: any[];
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryPartnerId?: string;
  deliveryNotes?: string;
  deliveryAttempts?: number;
  estimatedDeliveryDate?: string;
  adminNotes?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreBrandConfig {
  domain: string;
  whatsappPhone: string;
  whatsappDisplay: string;
  freeShippingLimit: number;
  announcementText: string;
}

export interface Subcategory {
  name: string;
  code: string;
  color: string;
  text: string;
}

export interface UniverseCategory {
  id: string;
  title: string;
  subtitle: string;
  bgGradient: string;
  image: string;
  bgColor?: string;
  focalPoint?: string;
  overlayOpacity?: number;
  subcategories: Subcategory[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  thumbnail?: string;
  images?: string[];
  colors?: ProductColor[];
  slug?: string;
}

export interface DeliveryInfo {
  fullName: string;
  phone: string;
  houseNo?: string;
  street?: string;
  area?: string;
  landmark?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderTrackingEvent {
  id: string;
  orderId: string;
  status: string;
  title: string;
  message?: string;
  location?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdBy?: string;
  createdAt: string;
}

export interface DeliveryPricingRule {
  id: string;
  name: string;
  minDistanceKm: number;
  maxDistanceKm: number;
  fee: number;
  isEnabled: boolean;
}

export interface DeliverySettings {
  defaultFee: number;
  distanceUnit: "km" | "miles";
  distancePricingEnabled: boolean;
  freeDeliveryThreshold: number;
  maxServiceableDistanceKm: number;
  allowManualOverrides: boolean;
  pricingRules: DeliveryPricingRule[];
  serviceableZones?: string[];
}

export interface RouteState {
  view: "home" | "shop" | "product" | "admin" | "account" | "login" | "register" | "verify-email" | "forgot-password" | "reset-password" | "bag" | "checkout" | "order-track" | "delivery-partner" | "verify-pass" | "custom-dtf" | "about" | "not-found";
  slug: string | null;
  query: Record<string, string>;
}

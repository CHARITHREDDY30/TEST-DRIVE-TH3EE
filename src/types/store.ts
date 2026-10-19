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
  badgeColor: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  items: string;
  total: number;
  status: "Received" | "In Production" | "Dispatched" | "Delivered" | string;
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
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
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface RouteState {
  view: "home" | "shop" | "product" | "admin";
  slug: string | null;
  query: Record<string, string>;
}

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type {
  Product,
  ProductColor,
  HeroSlide,
  Order,
  StoreBrandConfig,
  UniverseCategory,
  RouteState
} from './types/store';
import {
  INITIAL_OFFICIAL_DOMAIN,
  INITIAL_WHATSAPP_PHONE,
  INITIAL_WHATSAPP_DISPLAY,
  INITIAL_FREE_SHIPPING_LIMIT,
  AVAILABLE_GLOBAL_SIZES,
  INITIAL_STORE_BRAND,
  INITIAL_UNIVERSE_CATEGORIES,
  INITIAL_MASTER_PRODUCTS,
  INITIAL_HERO_SLIDES
} from './data/initialCatalog';
import {
  DEFAULT_R2_PUBLIC_BASE_URL,
  GLOBAL_DEFAULT_IMAGE,
  getR2PublicBaseUrl,
  resolveProductImageUrl,
  handleImageLoadError
} from './lib/r2';
import {
  productsService,
  ordersService,
  heroService,
  settingsService,
  authService,
  categoriesService,
  uploadService,
  couponsService,
  reportsService
} from './services';

// Self-contained zero-dependency inline SVG icons
function ShoppingBag({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function Search({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}

function Menu({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  );
}

function X({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}

function ChevronDown({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

function ChevronUp({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6"/>
    </svg>
  );
}

function ChevronLeft({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}

function ChevronRight({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

function Star({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function Truck({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
    </svg>
  );
}

function Check({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function ArrowRight({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}

function ArrowUpRight({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
    </svg>
  );
}

function MessageCircle({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}

function Eye({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function Sparkles({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
    </svg>
  );
}

function SlidersHorizontal({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>
    </svg>
  );
}

function Instagram({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function Lock({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function Plus({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}

function Trash2({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  );
}

function Edit3({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
    </svg>
  );
}

function RefreshCw({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
    </svg>
  );
}

function Image({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  );
}

function Package({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
    </svg>
  );
}

function Layers({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}

function Tag({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
      <path d="M7 7h.01"/>
    </svg>
  );
}

function BarChart3({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  );
}

function Download({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  );
}


function buildWhatsAppCartOrderUrl(cart, subtotal, discount, coupon, shipping, total, deliveryInfo, phoneNum, domain) {
  const targetPhone = phoneNum || INITIAL_WHATSAPP_PHONE;
  const siteDomain = domain || INITIAL_OFFICIAL_DOMAIN;
  const randomRef = Math.floor(1000 + Math.random() * 9000);
  const orderRef = "TH3EE-" + randomRef;

  const productEntries = cart.map(function(item, idx) {
    return (idx + 1) + ". " + item.name + " — Size: " + item.selectedSize + " — Colour: " + item.selectedColor + " — Qty: " + item.quantity + " — Rs. " + item.price + " each";
  }).join("\n");

  const addressBlock = deliveryInfo ? [
    "Delivery & Contact Details:",
    "• Name: " + (deliveryInfo.fullName || "N/A"),
    "• Phone: " + (deliveryInfo.phone || "N/A"),
    "• Address: " + (deliveryInfo.address || "N/A"),
    "• City & State: " + (deliveryInfo.city ? deliveryInfo.city + ", " : "") + (deliveryInfo.state || ""),
    "• Pincode: " + (deliveryInfo.pincode || "N/A")
  ].filter(Boolean).join("\n") : "";

  const message = [
    "Hello TH3EE! I would like to place an order from " + siteDomain,
    "",
    "Order Reference: " + orderRef,
    "",
    "Products:",
    productEntries,
    "",
    "Subtotal: Rs. " + subtotal,
    discount > 0 ? "Discount: -Rs. " + discount : null,
    "Shipping: " + (shipping === 0 ? "FREE" : "Rs. " + shipping),
    "Estimated Total: Rs. " + total,
    "",
    addressBlock,
    "",
    "Please confirm product availability and share the payment details."
  ].filter(Boolean).join("\n");

  return "https://wa.me/" + targetPhone + "?text=" + encodeURIComponent(message);
}

function Th3eeBrandLogo({ onClick, domain = INITIAL_OFFICIAL_DOMAIN }) {
  return (
    <div onClick={onClick} className="flex items-center space-x-1.5 sm:space-x-2 select-none cursor-pointer group shrink-0">
      <div className="bg-[#E51E2B] text-white font-black px-2 sm:px-2.5 py-0.5 text-lg sm:text-xl tracking-tighter flex items-center shadow-xs group-hover:bg-black transition-colors">
        <span>TH</span>
        <span className="text-[#E51E2B] bg-white px-0.5 mx-0.5 font-black text-sm sm:text-base">3</span>
        <span>EE</span>
      </div>
      <div className="flex flex-col border-l border-neutral-300 pl-1.5 sm:pl-2">
        <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-neutral-900 font-bold uppercase leading-none">
          {domain}
        </span>
        <span className="text-[7px] sm:text-[8px] font-mono tracking-wider text-neutral-400 uppercase leading-none mt-0.5">
          STREETWEAR
        </span>
      </div>
    </div>
  );
}

function parseCurrentRoute(): RouteState {
  if (typeof window === "undefined") return { view: "home", slug: null, query: {} };
  const path = window.location.pathname || "/";
  const searchStr = window.location.search || "";
  const query: Record<string, string> = {};
  if (searchStr.indexOf("?") === 0) {
    const params = new URLSearchParams(searchStr.substring(1));
    params.forEach(function(v, k) { query[k] = v; });
  }

  let view: RouteState["view"] = "home";
  let slug: string | null = null;

  if (path.indexOf("/products/") === 0) {
    view = "product";
    slug = decodeURIComponent(path.replace("/products/", ""));
  } else if (path.indexOf("/shop") === 0) {
    view = "shop";
  } else if (path.indexOf("/atelier-admin") === 0 || path.indexOf("/owner") === 0) {
    view = "admin";
  }

  return { view: view, slug: slug, query: query };
}

export default function App() {
  // Configurable Store Brand & Contact Information
  const [storeBrand, setStoreBrand] = useState<StoreBrandConfig>(INITIAL_STORE_BRAND);

  // Dynamic Product Catalog (Initialized from baseline, hydrated via InsForge service)
  const [productsList, setProductsList] = useState<Product[]>(INITIAL_MASTER_PRODUCTS);

  // Dynamic Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(INITIAL_HERO_SLIDES);

  // Dynamic Orders & Tracking (Real InsForge database records, no mock orders)
  const [ordersList, setOrdersList] = useState<Order[]>([]);

  const [universeCategoriesList, setUniverseCategoriesList] = useState<UniverseCategory[]>(INITIAL_UNIVERSE_CATEGORIES);

  // Asynchronously synchronize from InsForge service layer on mount
  useEffect(function() {
    let isMounted = true;
    productsService.getProducts().then(function(prods) {
      if (isMounted && prods && prods.length > 0) setProductsList(prods);
    }).catch(function(err) { console.warn('Products fetch notice:', err); });

    categoriesService.getCategories().then(function(cats) {
      if (isMounted && cats && cats.length > 0) setUniverseCategoriesList(cats);
    }).catch(function(err) { console.warn('Categories fetch notice:', err); });

    heroService.getHeroSlides().then(function(slides) {
      if (isMounted && slides && slides.length > 0) setHeroSlides(slides);
    }).catch(function(err) { console.warn('Hero slides fetch notice:', err); });

    settingsService.getStoreBrandConfig().then(function(cfg) {
      if (isMounted && cfg) setStoreBrand(cfg);
    }).catch(function(err) { console.warn('Settings fetch notice:', err); });

    ordersService.getOrders().then(function(ords) {
      if (isMounted && ords) setOrdersList(ords);
    }).catch(function(err) { console.warn('Orders fetch notice:', err); });

    return function() { isMounted = false; };
  }, []);

  const [routeState, setRouteState] = useState(function() { return parseCurrentRoute(); });

  useEffect(function() {
    function handlePopState() {
      setRouteState(parseCurrentRoute());
    }
    window.addEventListener("popstate", handlePopState);
    return function() { window.removeEventListener("popstate", handlePopState); };
  }, []);

  const navigate = function(path) {
    const parts = (path || "/").split("?");
    const pathPart = parts[0];
    const queryPart = parts[1];
    const query = {};
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      params.forEach(function(v, k) { query[k] = v; });
    }
    let view: RouteState["view"] = "home";
    let slug = null;
    if (pathPart.indexOf("/products/") === 0) {
      view = "product";
      slug = decodeURIComponent(pathPart.replace("/products/", ""));
    } else if (pathPart.indexOf("/shop") === 0) {
      view = "shop";
    } else if (pathPart.indexOf("/atelier-admin") === 0 || pathPart.indexOf("/owner") === 0) {
      view = "admin";
    }

    setRouteState({ view: view, slug: slug, query: query });
    try {
      if (typeof window !== "undefined" && window.location.href.indexOf("blob:") === -1) {
        window.history.pushState({}, "", path);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {}
  };

  const [toastNotification, setToastNotification] = useState(null);
  const showNotification = function(msg) {
    setToastNotification(msg);
    setTimeout(function() { setToastNotification(null); }, 4000);
  };

  // Keyboard shortcut listener to open hidden admin: Ctrl + Shift + A (or Cmd + Shift + A)
  useEffect(function() {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigate("/atelier-admin");
        showNotification("🔓 Stealth Atelier Command Center Engaged");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return function() { window.removeEventListener("keydown", handleKeyDown); };
  }, []);

  const [cart, setCart] = useState(function() {
    try {
      const cached = localStorage.getItem("th3ee_bag_cart");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  });
  const [isBagOpen, setIsBagOpen] = useState(false);

  useEffect(function() {
    try {
      localStorage.setItem("th3ee_bag_cart", JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const cartSubtotal = useMemo(function() {
    return cart.reduce(function(acc, item) {
      return acc + (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }, 0);
  }, [cart]);

  const hasFreeShipping = cartSubtotal >= (storeBrand.freeShippingLimit || INITIAL_FREE_SHIPPING_LIMIT);
  const deliveryCharge = hasFreeShipping || cart.length === 0 ? 0 : 149;
  const estimatedCartTotal = cartSubtotal + deliveryCharge;

  const addToBag = function(product, size, color) {
    if (!size) size = "L";
    const chosenColor = color || (product.colors && product.colors[0] && product.colors[0].name) || "Standard";
    setCart(function(prev) {
      const idx = prev.findIndex(function(item) {
        return item.id === product.id && item.selectedSize === size && item.selectedColor === chosenColor;
      });
      if (idx > -1) {
        const copy = [].concat(prev);
        copy[idx].quantity += 1;
        return copy;
      }
      return prev.concat([Object.assign({}, product, { selectedSize: size, selectedColor: chosenColor, quantity: 1 })]);
    });
    showNotification("Added " + product.name + " (" + size + ") to Bag");
    setIsBagOpen(true);
  };

  const adjustBagQuantity = function(productId, size, color, delta) {
    setCart(function(prev) {
      return prev.map(function(item) {
        if (item.id === productId && item.selectedSize === size && item.selectedColor === color) {
          const next = item.quantity + delta;
          return next > 0 ? Object.assign({}, item, { quantity: next }) : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const [selectedUniverseModal, setSelectedUniverseModal] = useState(null);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const categoriesDropdownRef = useRef(null);

  const [navSearchQuery, setNavSearchQuery] = useState("");
  const [isNavSearchFocused, setIsNavSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const liveSearchSuggestions = useMemo(function() {
    if (!navSearchQuery.trim()) return [];
    const q = navSearchQuery.toLowerCase().trim();
    return productsList.filter(function(p) {
      return p.name.toLowerCase().indexOf(q) !== -1 || 
        p.category.toLowerCase().indexOf(q) !== -1 || 
        (p.subcategory && p.subcategory.toLowerCase().indexOf(q) !== -1);
    }).slice(0, 5);
  }, [navSearchQuery, productsList]);

  const handleNavSearchSubmit = function(e) {
    e.preventDefault();
    if (!navSearchQuery.trim()) return;
    navigate("/shop?search=" + encodeURIComponent(navSearchQuery.trim()));
    setIsNavSearchFocused(false);
  };

  useEffect(function() {
    function handleClickOutside(e) {
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(e.target)) {
        setIsCategoriesDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsNavSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return function() { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  const currentProduct = useMemo(function() {
    if (!routeState.slug) return null;
    return productsList.find(function(p) {
      return p.slug === routeState.slug || 
             p.sku === routeState.slug || 
             String(p.id) === routeState.slug;
    }) || null;
  }, [routeState.slug, productsList]);

  // Triple-click on footer copyright triggers admin modal
  const footerClickRef = useRef({ count: 0, timer: null });
  const handleFooterSecretClick = function() {
    footerClickRef.current.count += 1;
    if (footerClickRef.current.timer) clearTimeout(footerClickRef.current.timer);
    if (footerClickRef.current.count >= 3) {
      footerClickRef.current.count = 0;
      navigate("/atelier-admin");
      showNotification("🔓 Secret Studio Unlocked via Triple-Click");
    } else {
      footerClickRef.current.timer = setTimeout(function() {
        footerClickRef.current.count = 0;
      }, 700);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#121212] antialiased flex flex-col justify-between selection:bg-[#E51E2B] selection:text-white overflow-x-hidden w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap');
        *, html, body, button, input, textarea, select {
          font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        html, body {
          max-width: 100vw;
          overflow-x: hidden;
        }
        input, textarea, select {
          font-size: 16px;
        }
        @media (min-width: 640px) {
          input, textarea, select {
            font-size: inherit;
          }
        }
      `}</style>

      {toastNotification && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-[#121212] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-2xl flex items-center space-x-2 text-[11px] sm:text-xs font-mono tracking-wide border-l-4 border-[#E51E2B] max-w-[90vw]">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E51E2B] shrink-0" />
          <span className="truncate">{toastNotification}</span>
        </div>
      )}

      {/* Announcement Banner */}
      <div className="bg-[#111111] text-white text-[10px] sm:text-[11px] font-mono tracking-wider py-1.5 sm:py-2 px-3 sm:px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden md:inline-flex items-center gap-1.5 text-neutral-400">
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            Official WhatsApp Atelier: {storeBrand.whatsappDisplay} • {storeBrand.domain}
          </span>
          <p className="w-full md:w-auto text-center font-medium truncate">
            {storeBrand.announcementText}
          </p>
          <div className="hidden md:flex items-center space-x-4">
            <button 
              type="button"
              onClick={function() { window.open("https://wa.me/" + storeBrand.whatsappPhone + "?text=Hi%20TH3EE%2C%20I%20need%20help%20with%20an%20order", "_blank"); }}
              className="text-neutral-400 hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-[#E51E2B]" />
              <span>Order Support</span>
            </button>
            <a href="https://instagram.com/th3ee.verse" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
              <Instagram className="w-3.5 h-3.5 text-[#E51E2B]" />
              <span>@th3ee.verse</span>
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button 
              type="button"
              onClick={function() { setIsMobileNavOpen(true); }}
              className="lg:hidden p-1.5 sm:p-2 text-neutral-700 hover:text-black"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <Th3eeBrandLogo onClick={function() { navigate("/"); }} domain={storeBrand.domain} />
          </div>

          <nav className="hidden lg:flex items-center gap-7 font-mono text-xs uppercase tracking-wider font-bold">
            <button 
              type="button"
              onClick={function() { navigate("/"); }} 
              className={`py-6 relative transition-colors ${routeState.view === "home" ? "text-[#E51E2B]" : "text-neutral-700 hover:text-black"}`}
            >
              Home
              {routeState.view === "home" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E51E2B]" />
              )}
            </button>
            <button 
              type="button"
              onClick={function() { navigate("/shop"); }} 
              className={`py-6 relative transition-colors ${routeState.view === "shop" && !routeState.query.category && !routeState.query.universe ? "text-[#E51E2B]" : "text-neutral-700 hover:text-black"}`}
            >
              Shop All
              {routeState.view === "shop" && !routeState.query.category && !routeState.query.universe && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E51E2B]" />
              )}
            </button>
            <button 
              type="button"
              onClick={function() { navigate("/shop?category=T-Shirts"); }} 
              className={`py-6 relative transition-colors ${routeState.query.category === "T-Shirts" ? "text-[#E51E2B]" : "text-neutral-700 hover:text-black"}`}
            >
              T-Shirts
              {routeState.query.category === "T-Shirts" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E51E2B]" />
              )}
            </button>
            <button 
              type="button"
              onClick={function() { navigate("/shop?category=Hoodies & Sweats"); }} 
              className={`py-6 relative transition-colors ${routeState.query.category === "Hoodies & Sweats" ? "text-[#E51E2B]" : "text-neutral-700 hover:text-black"}`}
            >
              Hoodies & Sweats
              {routeState.query.category === "Hoodies & Sweats" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E51E2B]" />
              )}
            </button>

            <div className="relative py-6" ref={categoriesDropdownRef}>
              <button 
                type="button"
                onClick={function() { setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen); }}
                className={`flex items-center gap-1.5 transition-colors ${isCategoriesDropdownOpen ? "text-[#E51E2B]" : "text-neutral-800 hover:text-[#E51E2B]"}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E51E2B] inline-block" />
                <span>Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoriesDropdownOpen ? "rotate-180 text-[#E51E2B]" : ""}`} />
              </button>

              {isCategoriesDropdownOpen && (
                <div className="absolute top-full left-0 mt-0 w-72 bg-white border border-neutral-200 shadow-2xl p-3 z-50 divide-y divide-neutral-100">
                  <div className="pb-2 text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">
                    Franchise Universes ({universeCategoriesList.length})
                  </div>
                  <div className="pt-2 max-h-80 overflow-y-auto space-y-1">
                    {universeCategoriesList.map(function(cat) {
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={function() {
                            setIsCategoriesDropdownOpen(false);
                            navigate("/shop?universe=" + cat.id);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-50 flex items-center justify-between group transition-colors"
                        >
                          <span className="text-xs font-bold text-neutral-800 group-hover:text-[#E51E2B]">{cat.title}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">{cat.subtitle}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden md:block" ref={searchContainerRef}>
              <form onSubmit={handleNavSearchSubmit} className="relative flex items-center">
                <div className="relative flex items-center bg-white border border-neutral-300 rounded-full shadow-2xs hover:border-neutral-400 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                  <Search className="w-3.5 h-3.5 text-neutral-400 ml-3 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={navSearchQuery}
                    onChange={function(e) { setNavSearchQuery(e.target.value); }}
                    onFocus={function() { setIsNavSearchFocused(true); }}
                    className="w-32 lg:w-40 xl:w-48 pl-2 pr-7 py-1.5 text-xs font-sans text-neutral-900 placeholder:text-neutral-400 bg-transparent rounded-full focus:outline-none"
                  />
                  {navSearchQuery && (
                    <button 
                      type="button" 
                      onClick={function() { setNavSearchQuery(""); }}
                      className="absolute right-2 p-0.5 text-neutral-400 hover:text-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </form>

              {isNavSearchFocused && liveSearchSuggestions.length > 0 && (
                <div className="absolute top-full right-0 mt-2 min-w-[280px] bg-white border border-neutral-200 rounded-xl shadow-2xl p-2 z-50 font-mono">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase px-2 py-1">Quick Matches</div>
                  {liveSearchSuggestions.map(function(item) {
                    return (
                      <div 
                        key={item.id}
                        onClick={function() {
                          navigate("/products/" + item.slug);
                          setIsNavSearchFocused(false);
                        }}
                        className="flex items-center gap-2.5 p-2 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0"
                      >
                        <img 
                          src={resolveProductImageUrl((item.images && item.images[0]) || (item.colors && item.colors[0] && item.colors[0].images && item.colors[0].images[0]))} 
                          onError={handleImageLoadError}
                          alt="" 
                          className="w-9 h-11 object-cover object-center bg-neutral-100 shrink-0" 
                        />
                        <div className="flex-1 truncate">
                          <div className="text-xs font-bold uppercase truncate">{item.name}</div>
                          <div className="text-[10px] text-neutral-900 font-bold">
                            Rs. {Number(item.price).toFixed(2)}
                            {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
                              <span className="text-neutral-400 line-through font-normal ml-1.5">
                                Rs. {Number(item.originalPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="hidden lg:block h-5 w-px bg-neutral-200 shrink-0" aria-hidden="true" />

            <button 
              type="button"
              onClick={function() { window.open("https://wa.me/" + storeBrand.whatsappPhone + "?text=Hi%20TH3EE%2C%20I%20need%20help%20with%20an%20order", "_blank"); }}
              className="hidden lg:flex text-neutral-700 hover:text-[#E51E2B] text-xs font-mono uppercase tracking-wider font-semibold items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Truck className="w-3.5 h-3.5 text-[#E51E2B]" />
              <span>Order Support</span>
            </button>

            <button
              type="button"
              onClick={function() { setIsBagOpen(true); }}
              className="flex items-center space-x-1.5 sm:space-x-2 bg-neutral-900 text-white hover:bg-[#E51E2B] px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-mono uppercase tracking-wider transition-colors shadow-xs shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline font-bold">BAG</span>
              <span className="bg-white text-black font-extrabold text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full">
                {cart.reduce(function(count, item) { return count + item.quantity; }, 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div onClick={function() { setIsMobileNavOpen(false); }} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="fixed inset-y-0 left-0 max-w-[85vw] w-80 bg-white shadow-2xl p-5 sm:p-6 flex flex-col justify-between font-mono z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                <Th3eeBrandLogo onClick={function() { setIsMobileNavOpen(false); navigate("/"); }} domain={storeBrand.domain} />
                <button type="button" onClick={function() { setIsMobileNavOpen(false); }} className="p-1.5 text-neutral-600 hover:text-[#E51E2B]"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={function(e) { handleNavSearchSubmit(e); setIsMobileNavOpen(false); }} className="mt-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search drops..." 
                    value={navSearchQuery}
                    onChange={function(e) { setNavSearchQuery(e.target.value); }}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 text-xs rounded-full focus:outline-none focus:border-black"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </form>

              <div className="mt-6 space-y-3.5 text-xs uppercase font-bold tracking-wider">
                <button type="button" onClick={function() { setIsMobileNavOpen(false); navigate("/"); }} className="block w-full text-left py-1 hover:text-[#E51E2B] border-b border-neutral-100">Home</button>
                <button type="button" onClick={function() { setIsMobileNavOpen(false); navigate("/shop"); }} className="block w-full text-left py-1 hover:text-[#E51E2B] border-b border-neutral-100">Shop All Drops</button>
                <button type="button" onClick={function() { setIsMobileNavOpen(false); navigate("/shop?category=T-Shirts"); }} className="block w-full text-left py-1 hover:text-[#E51E2B] border-b border-neutral-100">T-Shirts</button>
                <button type="button" onClick={function() { setIsMobileNavOpen(false); navigate("/shop?category=Hoodies & Sweats"); }} className="block w-full text-left py-1 hover:text-[#E51E2B] border-b border-neutral-100">Hoodies & Sweats</button>
                <button type="button" onClick={function() { setIsMobileNavOpen(false); window.open("https://wa.me/" + storeBrand.whatsappPhone + "?text=Hi%20TH3EE", "_blank"); }} className="flex items-center gap-1.5 w-full text-left py-1 text-neutral-600 hover:text-black">
                  <Truck className="w-3.5 h-3.5 text-[#E51E2B]" />
                  <span>Order Support</span>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-2">13 Universes</span>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {universeCategoriesList.map(function(u) {
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={function() { setIsMobileNavOpen(false); navigate("/shop?universe=" + u.id); }}
                        className="p-1.5 bg-neutral-50 hover:bg-neutral-100 text-[10px] font-bold text-left truncate border border-neutral-200"
                      >
                        {u.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 text-[10px] text-neutral-500">
              © {new Date().getFullYear()} {storeBrand.domain} STREETWEAR
            </div>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 w-full overflow-x-hidden">
        {routeState.view === "home" && (
          <HomePageView 
            productsList={productsList}
            universeCategoriesList={universeCategoriesList}
            heroSlides={heroSlides}
            storeBrand={storeBrand}
            navigate={navigate}
            addToBag={addToBag}
            setQuickViewItem={setQuickViewItem}
            setSelectedUniverseModal={setSelectedUniverseModal}
          />
        )}

        {routeState.view === "shop" && (
          <ShopAllView 
            productsList={productsList}
            universeCategoriesList={universeCategoriesList}
            initialQuery={routeState.query}
            storeBrand={storeBrand}
            navigate={navigate}
            addToBag={addToBag}
            setQuickViewItem={setQuickViewItem}
          />
        )}

        {routeState.view === "product" && (
          <ProductDetailPageView 
            product={currentProduct}
            allProducts={productsList}
            storeBrand={storeBrand}
            initialColor={routeState.query.color}
            navigate={navigate}
            addToBag={addToBag}
          />
        )}

        {routeState.view === "admin" && (
          <SecretAtelierAdminView 
            productsList={productsList}
            setProductsList={setProductsList}
            heroSlides={heroSlides}
            setHeroSlides={setHeroSlides}
            ordersList={ordersList}
            setOrdersList={setOrdersList}
            storeBrand={storeBrand}
            setStoreBrand={setStoreBrand}
            universeCategoriesList={universeCategoriesList}
            navigate={navigate}
            showNotification={showNotification}
          />
        )}
      </main>

      {/* Universe Subcategories Modal */}
      {selectedUniverseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white max-w-lg w-full p-4 sm:p-6 relative shadow-2xl font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-neutral-200">
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-[#E51E2B] tracking-wider">{selectedUniverseModal.subtitle}</span>
                <h3 className="text-xl sm:text-2xl font-black uppercase text-neutral-900">{selectedUniverseModal.title}</h3>
                <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">Select a saga to explore dedicated catalog drops:</p>
              </div>
              <button type="button" onClick={function() { setSelectedUniverseModal(null); }} className="p-1.5 hover:text-[#E51E2B] text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
              {(selectedUniverseModal.subcategories || []).map(function(sub) {
                return (
                  <button
                    type="button"
                    key={sub.name}
                    onClick={function() {
                      setSelectedUniverseModal(null);
                      navigate("/shop?universe=" + selectedUniverseModal.id + "&subcategory=" + encodeURIComponent(sub.name));
                      showNotification("Filtered: " + sub.name);
                    }}
                    className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 p-2.5 sm:p-3 flex flex-col items-start justify-between text-left transition-all group"
                  >
                    <div className={"w-7 h-7 sm:w-8 sm:h-8 " + (sub.color || "bg-neutral-900") + " " + (sub.text || "text-white") + " font-bold text-[10px] sm:text-xs flex items-center justify-center mb-2"}>
                      {sub.code}
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold uppercase group-hover:text-[#E51E2B] transition-colors truncate w-full">{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick View Item Modal */}
      {quickViewItem && (
        <QuickViewModal 
          product={quickViewItem}
          onClose={function() { setQuickViewItem(null); }}
          onNavigate={function(url) { setQuickViewItem(null); navigate(url); }}
          onAddToBag={function(p, size, color) { addToBag(p, size, color); setQuickViewItem(null); }}
        />
      )}

      {/* Shopping Bag Drawer */}
      {isBagOpen && (
        <ShoppingBagDrawer 
          cart={cart}
          onClose={function() { setIsBagOpen(false); }}
          onAdjustQty={adjustBagQuantity}
          cartSubtotal={cartSubtotal}
          deliveryCharge={deliveryCharge}
          estimatedCartTotal={estimatedCartTotal}
          hasFreeShipping={hasFreeShipping}
          freeShippingLimit={storeBrand.freeShippingLimit}
          whatsappPhone={storeBrand.whatsappPhone}
          domain={storeBrand.domain}
        />
      )}

      {/* Unified Single Footer */}
      <footer className="bg-white border-t border-neutral-200 pt-8 sm:pt-10 pb-6 sm:pb-8 text-neutral-600 font-mono text-xs w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pb-6 sm:pb-8 border-b border-neutral-200">
            {/* Column 1: Brand & Identity */}
            <div className="space-y-3">
              <Th3eeBrandLogo onClick={function() { navigate("/"); }} domain={storeBrand.domain} />
              <p className="text-neutral-600 text-xs max-w-sm leading-relaxed">
                Independent Indian streetwear atelier crafting 180–350 GSM loopback cotton heavyweight silhouettes inspired by cult cinema, anime, and comic universes.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-[#E51E2B] font-semibold">
                <Instagram className="w-4 h-4" />
                <a href="https://instagram.com/th3ee.verse" target="_blank" rel="noreferrer" className="hover:underline">
                  @th3ee.verse
                </a>
              </div>
            </div>

            {/* Column 2: Collections & Archive Navigation */}
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-neutral-900 block mb-2 text-[11px]">Collections & Sagas</span>
              <div className="flex flex-col space-y-2 text-neutral-600 font-medium">
                <button type="button" onClick={function() { navigate("/shop?universe=tfi&subcategory=Baahubali"); }} className="text-left hover:text-[#E51E2B] transition-colors">Baahubali & TFI Cult Cinema</button>
                <button type="button" onClick={function() { navigate("/shop?universe=anime"); }} className="text-left hover:text-[#E51E2B] transition-colors">Anime Shonen Saga Drops</button>
                <button type="button" onClick={function() { navigate("/shop?category=T-Shirts"); }} className="text-left hover:text-[#E51E2B] transition-colors">Heavyweight T-Shirts (180–240 GSM)</button>
                <button type="button" onClick={function() { navigate("/shop?category=Hoodies & Sweats"); }} className="text-left hover:text-[#E51E2B] transition-colors">French Terry Hoodies (300–350 GSM)</button>
              </div>
            </div>

            {/* Column 3: Customer Desk & WhatsApp Hotline */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-neutral-900 block text-[11px]">Customer Desk</span>
              <p className="text-neutral-600 text-xs leading-relaxed">Need sizing guidance or order status assistance? Connect directly with our atelier on WhatsApp.</p>
              <div className="space-y-2 pt-1">
                <button 
                  type="button"
                  onClick={function() { window.open("https://wa.me/" + storeBrand.whatsappPhone + "?text=Hi%20TH3EE%20Support", "_blank"); }}
                  className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2.5 font-bold uppercase flex items-center justify-center gap-2 transition-colors text-xs tracking-wider"
                >
                  <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                  <span className="truncate">WhatsApp: {storeBrand.whatsappDisplay}</span>
                </button>
                <button
                  type="button"
                  onClick={function() { window.open("https://wa.me/" + storeBrand.whatsappPhone + "?text=Hi%20TH3EE%2C%20track%20my%20order", "_blank"); }}
                  className="text-neutral-700 hover:text-[#E51E2B] flex items-center gap-1.5 font-bold uppercase text-[11px] transition-colors pt-1"
                >
                  <Truck className="w-3.5 h-3.5 text-[#E51E2B]" />
                  <span>Open Order Support</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-5 sm:pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-[11px]">
            <div 
              onClick={handleFooterSecretClick}
              className="font-medium text-neutral-500 text-center sm:text-left select-none cursor-pointer hover:text-neutral-700 transition-colors"
              title="Stealth Trigger: Triple-click to open Atelier Master Studio"
            >
              © {new Date().getFullYear()} TH3EE ({storeBrand.domain}). ALL RIGHTS RESERVED.
            </div>
            <div className="flex flex-wrap items-center justify-center space-x-2 sm:space-x-4 font-semibold text-[9px] sm:text-[10px] tracking-wider uppercase text-neutral-400">
              <span className="hover:text-black cursor-pointer">TERMS OF SERVICE</span>
              <span>•</span>
              <span className="hover:text-black cursor-pointer">PRIVACY POLICY</span>
              <span>•</span>
              <span 
                onClick={function() { navigate("/atelier-admin"); }}
                className="hover:text-[#E51E2B] cursor-pointer text-neutral-300"
              >
                ATELIER DESK [⌘+⇧+A]
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomePageView({ 
  productsList, 
  universeCategoriesList, 
  heroSlides, 
  storeBrand,
  navigate, 
  addToBag, 
  setQuickViewItem, 
  setSelectedUniverseModal 
}) {
  const [mobileHeroSlide, setMobileHeroSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const touchStartXRef = useRef(0);

  useEffect(function() {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches || isCarouselPaused || !heroSlides.length) return;

    const timer = setInterval(function() {
      setMobileHeroSlide(function(prev) { return (prev + 1) % heroSlides.length; });
    }, 4500);

    return function() { clearInterval(timer); };
  }, [isCarouselPaused, heroSlides.length]);

  const handleMobileTouchStart = function(e) {
    setIsCarouselPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleMobileTouchEnd = function(e) {
    setIsCarouselPaused(false);
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 45 && heroSlides.length > 0) {
      setMobileHeroSlide(function(prev) { return (prev + 1) % heroSlides.length; });
    } else if (diff < -45 && heroSlides.length > 0) {
      setMobileHeroSlide(function(prev) { return (prev - 1 + heroSlides.length) % heroSlides.length; });
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      {/* MOBILE-ONLY HERO CAROUSEL */}
      <section 
        className="block md:hidden bg-neutral-950 text-white relative overflow-hidden select-none"
        onTouchStart={handleMobileTouchStart}
        onTouchEnd={handleMobileTouchEnd}
      >
        <div className="relative min-h-[460px] xs:min-h-[500px] flex items-end">
          {heroSlides.map(function(slide, idx) {
            const isActive = idx === mobileHeroSlide;
            return (
              <div
                key={slide.id || idx}
                className={"absolute inset-0 transition-opacity duration-700 ease-in-out " + (
                  isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                )}
              >
                <img 
                  src={resolveProductImageUrl(slide.image)} 
                  onError={handleImageLoadError}
                  alt={slide.title} 
                  className="w-full h-full object-cover object-[center_20%]" 
                />
                <div className={"absolute inset-0 bg-gradient-to-t " + (slide.bgGradient || "from-neutral-950 to-transparent") + " opacity-35 mix-blend-multiply"} />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

                <div className="absolute inset-0 p-5 xs:p-6 flex flex-col justify-end text-left space-y-2.5 z-20">
                  <span className={"inline-block self-start " + (slide.badgeColor || "bg-[#E51E2B]") + " text-white font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-xs"}>
                    {slide.tag}
                  </span>
                  
                  <h2 className="text-2xl xs:text-3xl font-black uppercase tracking-tight text-white leading-tight font-mono drop-shadow-md">
                    {slide.title} <br />
                    <span className="text-[#E51E2B]">{slide.highlight}</span>
                  </h2>

                  <p className="text-[11px] xs:text-xs text-neutral-200 font-sans leading-relaxed line-clamp-2 max-w-sm drop-shadow-xs">
                    {slide.desc}
                  </p>

                  <div className="pt-1.5 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={function() { navigate(slide.target || "/shop"); }}
                      className="bg-[#E51E2B] hover:bg-black text-white font-mono font-bold text-xs uppercase px-5 py-2.5 tracking-wider transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <span>{slide.cta || "EXPLORE"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={function() {
                        const el = document.getElementById("universes-section");
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-black/40 backdrop-blur-xs border border-white/30 text-white font-mono font-bold text-xs uppercase px-3.5 py-2.5 transition-colors"
                    >
                      CATEGORIES
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-3 right-5 z-30 flex items-center gap-1.5 pointer-events-auto">
            {heroSlides.map(function(_, dotIdx) {
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={function() { setMobileHeroSlide(dotIdx); }}
                  className={"h-1.5 rounded-full transition-all " + (
                    dotIdx === mobileHeroSlide ? "w-6 bg-[#E51E2B]" : "w-1.5 bg-white/40"
                  )}
                  aria-label={"Go to slide " + (dotIdx + 1)}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* DESKTOP & TABLET HERO */}
      <section className="hidden md:block bg-white pt-8 pb-10 sm:pt-14 sm:pb-16 overflow-hidden w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-neutral-900 leading-[1.12] sm:leading-[1.08]">
            DEFINE YOUR STYLE. <br />
            <span className="text-[#E51E2B]">WEAR YOUR WORLD.</span>
          </h1>
          <p className="mt-2.5 sm:mt-3 text-neutral-600 text-xs sm:text-sm font-sans max-w-xl mx-auto leading-relaxed px-2">
            Discover statement pieces, explore new drops, and find the designs that match your identity on {storeBrand.domain}. Engineered with 180 to 350 GSM loopback cottons.
          </p>
          <div className="mt-5 sm:mt-6 flex flex-wrap justify-center gap-2.5 sm:gap-3">
            <button 
              type="button"
              onClick={function() { navigate("/shop"); }} 
              className="bg-[#E51E2B] hover:bg-black text-white font-mono font-bold text-xs uppercase px-5 sm:px-7 py-3 sm:py-3.5 tracking-wider transition-colors shadow-xs flex items-center gap-2"
            >
              <span>SHOP NEW DROPS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={function() {
                const el = document.getElementById("universes-section");
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase px-5 sm:px-7 py-3 sm:py-3.5 tracking-wider transition-colors shadow-xs flex items-center gap-2"
            >
              <span>EXPLORE CATEGORIES</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4 items-end max-w-6xl mx-auto mt-8 sm:mt-10">
            <div className="bg-[#FF6F3C] rounded-2xl sm:rounded-3xl overflow-hidden aspect-[3/4.2] shadow-xs">
              <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=80" alt="Look 1" className="w-full h-full object-cover object-center mix-blend-multiply opacity-95 hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="bg-[#2EB872] rounded-2xl sm:rounded-3xl overflow-hidden aspect-[3/5] shadow-xs">
              <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&auto=format&fit=crop&q=80" alt="Look 2" className="w-full h-full object-cover object-center mix-blend-multiply opacity-95 hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="col-span-2 md:col-span-1 space-y-2.5 sm:space-y-3 flex flex-col items-center">
              <div className="w-full bg-[#E5B824] rounded-2xl sm:rounded-3xl overflow-hidden aspect-[3/4] shadow-xs">
                <img src={resolveProductImageUrl("tshirts/IMg 1.jpeg")} onError={handleImageLoadError} alt="Baahubali Cult Tee" className="w-full h-full object-cover object-center mix-blend-multiply opacity-90 hover:scale-105 transition-transform duration-500" />
              </div>
              <button 
                type="button"
                onClick={function() { navigate("/shop"); }} 
                className="w-full bg-neutral-950 hover:bg-[#E51E2B] text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>View Full Catalog</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="bg-[#4895EF] rounded-2xl sm:rounded-3xl overflow-hidden aspect-[3/5] hidden md:block shadow-xs">
              <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=700&auto=format&fit=crop&q=80" alt="Look 4" className="w-full h-full object-cover object-center mix-blend-multiply opacity-95 hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="bg-[#9BF6FF] rounded-2xl sm:rounded-3xl overflow-hidden aspect-[3/4.2] hidden md:block shadow-xs">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80" alt="Look 5" className="w-full h-full object-cover object-center mix-blend-multiply opacity-90 hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Universes */}
      <section id="universes-section" className="bg-[#F8F8F8] border-b border-neutral-200 py-10 sm:py-16 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-white border border-neutral-200 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-mono text-[#E51E2B] uppercase tracking-wider font-bold mb-2">
                <span className="w-2 h-2 bg-[#E51E2B] rounded-full animate-pulse" />
                <span>FRANCHISE & REALM FOLIOS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 font-mono">
                Explore by Universe
              </h2>
              <p className="text-xs sm:text-sm font-sans text-neutral-600 mt-1">
                Explore your interests. Tap any franchise card to open the subcategories directory modal.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button 
                type="button"
                onClick={function() { navigate("/shop"); }}
                className="bg-white hover:bg-neutral-100 border border-neutral-300 text-[11px] sm:text-xs font-mono font-bold px-3 sm:px-3.5 py-1.5 uppercase transition-colors"
              >
                Browse All
              </button>
              <span className="bg-neutral-900 text-white text-[10px] sm:text-xs font-mono font-bold px-2.5 sm:px-3.5 py-1.5 uppercase">
                {universeCategoriesList.length} UNIVERSES AVAILABLE
              </span>
            </div>
          </div>

          {/* MOBILE ONLY: 2x2 compact grid showing first 4 universes + More button */}
          <div className="block sm:hidden">
            <div className="grid grid-cols-2 gap-2.5">
              {universeCategoriesList.slice(0, 4).map(function(univ) {
                return (
                  <div
                    key={univ.id}
                    onClick={function() { setSelectedUniverseModal(univ); }}
                    className="group relative h-22 rounded-2xl overflow-hidden cursor-pointer shadow-xs border border-neutral-200/80 active:scale-[0.98] transition-all duration-200"
                  >
                    <img 
                      src={univ.image} 
                      onError={handleImageLoadError}
                      alt={univ.title} 
                      className="w-full h-full object-cover object-center" 
                    />
                    <div className={"absolute inset-0 bg-gradient-to-t " + univ.bgGradient + " opacity-85"} />
                    <div className="absolute inset-0 p-2.5 flex flex-col justify-end text-white">
                      <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-300 font-semibold leading-none truncate">{univ.subtitle}</span>
                      <h3 className="text-xs font-black uppercase tracking-tight text-white mt-0.5 leading-tight truncate">{univ.title}</h3>
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 mt-1 pt-1 border-t border-white/10">
                        <span>{univ.subcategories ? univ.subcategories.length : 0} Sagas</span>
                        <ChevronRight className="w-3 h-3 text-neutral-300 shrink-0" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={function() { navigate("/shop"); }}
              className="mt-3 w-full py-2.5 rounded-xl bg-white border border-neutral-300 hover:border-black active:bg-neutral-50 text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>More Universes ({universeCategoriesList.length})</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E51E2B]" />
            </button>
          </div>

          {/* TABLET & DESKTOP: Full grid showing all universes */}
          <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {universeCategoriesList.map(function(univ) {
              return (
                <div
                  key={univ.id}
                  onClick={function() { setSelectedUniverseModal(univ); }}
                  className="group relative h-26 sm:h-32 rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-md border border-neutral-200/80 hover:border-neutral-400 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <img 
                    src={univ.image} 
                    onError={handleImageLoadError}
                    alt={univ.title} 
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className={"absolute inset-0 bg-gradient-to-t " + univ.bgGradient + " opacity-85 group-hover:opacity-75 transition-opacity"} />
                  <div className="absolute inset-0 p-2.5 sm:p-3 flex flex-col justify-end text-white">
                    <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-neutral-300 font-semibold leading-none truncate">{univ.subtitle}</span>
                    <h3 className="text-xs sm:text-base font-black uppercase tracking-tight text-white mt-1 group-hover:text-[#E51E2B] transition-colors leading-tight truncate">{univ.title}</h3>
                    <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-neutral-400 mt-1 pt-1 border-t border-white/10">
                      <span>{univ.subcategories ? univ.subcategories.length : 0} Sagas</span>
                      <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Drops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#E51E2B] font-bold block mb-1">CURATED ATELIER SELECTION</span>
            <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 font-mono">Featured Heavyweight Drops</h2>
          </div>
          <button 
            type="button"
            onClick={function() { navigate("/shop"); }} 
            className="text-xs font-mono font-bold uppercase text-neutral-900 hover:text-[#E51E2B] flex items-center gap-1 transition-colors shrink-0"
          >
            <span>View All ({productsList.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3.5 sm:gap-8 items-stretch">
          {productsList.slice(0, 4).map(function(prod) {
            return (
              <ProductCard 
                key={prod.id} 
                product={prod} 
                navigate={navigate} 
                addToBag={addToBag} 
                onQuickView={setQuickViewItem}
              />
            );
          })}
        </div>
      </section>

      <EditorialTriFoldSection navigate={navigate} domain={storeBrand.domain} />
    </div>
  );
}

function ShopAllView({ 
  productsList, 
  universeCategoriesList, 
  initialQuery, 
  storeBrand,
  navigate, 
  addToBag, 
  setQuickViewItem 
}) {
  if (!initialQuery) initialQuery = {};
  const [selectedCategory, setSelectedCategory] = useState(initialQuery.category || "All");
  const [selectedUniverse, setSelectedUniverse] = useState(initialQuery.universe || "All");
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialQuery.subcategory || "All");
  const [sortBy, setSortBy] = useState("featured");
  const [expandedUniverseAccordion, setExpandedUniverseAccordion] = useState(initialQuery.universe || null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(function() {
    if (initialQuery.category) setSelectedCategory(initialQuery.category);
    if (initialQuery.universe) {
      setSelectedUniverse(initialQuery.universe);
      setExpandedUniverseAccordion(initialQuery.universe);
    }
    if (initialQuery.subcategory) setSelectedSubcategory(initialQuery.subcategory);
  }, [initialQuery]);

  const filteredProducts = useMemo(function() {
    return productsList.filter(function(item) {
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
      if (selectedUniverse !== "All" && item.universeId !== selectedUniverse) return false;
      if (selectedSubcategory !== "All" && item.subcategory !== selectedSubcategory) return false;
      if (inStockOnly && !item.inStock) return false;
      if (initialQuery.search) {
        const q = initialQuery.search.toLowerCase();
        const matches = item.name.toLowerCase().indexOf(q) !== -1 || 
                        item.category.toLowerCase().indexOf(q) !== -1 || 
                        (item.subcategory && item.subcategory.toLowerCase().indexOf(q) !== -1);
        if (!matches) return false;
      }
      return true;
    }).sort(function(a, b) {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [productsList, selectedCategory, selectedUniverse, selectedSubcategory, inStockOnly, sortBy, initialQuery.search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-mono space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-neutral-200 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
            ALL STREETWEAR DROPS ({filteredProducts.length})
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">Heavyweight 180 to 350 GSM loopback garments available on {storeBrand.domain}.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={function() { setIsMobileFilterOpen(true); }}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs uppercase font-bold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={inStockOnly} 
                onChange={function(e) { setInStockOnly(e.target.checked); }} 
                className="accent-[#E51E2B]" 
              />
              <span className="hidden xs:inline">In Stock Only</span>
              <span className="xs:hidden">In Stock</span>
            </label>

            <select 
              value={sortBy} 
              onChange={function(e) { setSortBy(e.target.value); }}
              className="p-1.5 border border-neutral-300 bg-white text-xs font-mono font-bold focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="hidden lg:block space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center pb-1 border-b border-neutral-200">
              <span className="text-xs font-black uppercase text-neutral-900">Franchise Universes</span>
              {(selectedUniverse !== "All" || selectedSubcategory !== "All") && (
                <button 
                  type="button"
                  onClick={function() { setSelectedUniverse("All"); setSelectedSubcategory("All"); }}
                  className="text-[10px] text-[#E51E2B] font-bold uppercase hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              <button
                type="button"
                onClick={function() { setSelectedUniverse("All"); setSelectedSubcategory("All"); }}
                className={"w-full text-left py-1.5 px-2 text-xs font-bold " + (
                  selectedUniverse === "All" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100 text-neutral-800"
                )}
              >
                All Universes
              </button>

              {universeCategoriesList.map(function(univ) {
                return (
                  <div key={univ.id} className="border border-neutral-200">
                    <div className="flex items-center justify-between p-2 bg-neutral-50">
                      <button
                        type="button"
                        onClick={function() {
                          setSelectedUniverse(univ.id);
                          setSelectedSubcategory("All");
                          setExpandedUniverseAccordion(expandedUniverseAccordion === univ.id ? null : univ.id);
                        }}
                        className={"text-xs font-bold uppercase truncate text-left flex-1 " + (
                          selectedUniverse === univ.id ? "text-[#E51E2B]" : "text-neutral-800"
                        )}
                      >
                        {univ.title}
                      </button>
                      <button
                        type="button"
                        onClick={function() { setExpandedUniverseAccordion(expandedUniverseAccordion === univ.id ? null : univ.id); }}
                        className="p-1 text-neutral-400 hover:text-black"
                      >
                        {expandedUniverseAccordion === univ.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {expandedUniverseAccordion === univ.id && (
                      <div className="p-2 space-y-1 bg-white border-t border-neutral-200">
                        {(univ.subcategories || []).map(function(sub) {
                          return (
                            <button
                              key={sub.name}
                              type="button"
                              onClick={function() {
                                setSelectedUniverse(univ.id);
                                setSelectedSubcategory(sub.name);
                              }}
                              className={"w-full text-left text-[11px] p-1 font-bold truncate flex items-center justify-between " + (
                                selectedSubcategory === sub.name ? "text-[#E51E2B] bg-red-50" : "text-neutral-600 hover:text-black"
                              )}
                            >
                              <span>{sub.name}</span>
                              <span className="text-[9px] text-neutral-400 font-mono">{sub.code}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-neutral-900 block pb-1 border-b border-neutral-200">
              Upper Garment Type
            </span>
            <div className="flex flex-col space-y-1 text-xs">
              {["All", "T-Shirts", "Hoodies & Sweats", "Jackets & Outerwear"].map(function(cat) {
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={function() { setSelectedCategory(cat); }}
                    className={"text-left py-1.5 px-2 font-bold transition-colors " + (
                      selectedCategory === cat ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                    )}
                  >
                    {cat === "All" ? "All Garments" : cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden font-mono">
            <div onClick={function() { setIsMobileFilterOpen(false); }} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
            <div className="fixed inset-y-0 right-0 max-w-[85vw] w-80 bg-white p-5 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                  <span className="text-xs font-bold uppercase">Filter Drops</span>
                  <button type="button" onClick={function() { setIsMobileFilterOpen(false); }} className="p-1"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-neutral-700 block">Garment Type</span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {["All", "T-Shirts", "Hoodies & Sweats", "Jackets & Outerwear"].map(function(cat) {
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={function() { setSelectedCategory(cat); }}
                          className={"p-2 border text-left text-[11px] font-bold " + (
                            selectedCategory === cat ? "bg-neutral-900 text-white border-neutral-900" : "bg-neutral-50 text-neutral-800"
                          )}
                        >
                          {cat === "All" ? "All Types" : cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-neutral-700 block">Universes</span>
                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={function() { setSelectedUniverse("All"); setSelectedSubcategory("All"); }}
                      className={"w-full text-left p-2 text-[11px] font-bold border " + (selectedUniverse === "All" ? "bg-neutral-900 text-white" : "bg-neutral-50")}
                    >
                      All Universes
                    </button>
                    {universeCategoriesList.map(function(univ) {
                      return (
                        <button
                          key={univ.id}
                          type="button"
                          onClick={function() { setSelectedUniverse(univ.id); setSelectedSubcategory("All"); }}
                          className={"w-full text-left p-2 text-[11px] font-bold border " + (selectedUniverse === univ.id ? "bg-[#E51E2B] text-white border-[#E51E2B]" : "bg-neutral-50 text-neutral-800")}
                        >
                          {univ.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={function() { setIsMobileFilterOpen(false); }}
                  className="w-full bg-neutral-900 text-white py-2.5 uppercase font-bold text-xs"
                >
                  Apply Filters ({filteredProducts.length})
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-8 sm:p-12 text-center space-y-3">
              <span className="text-xs sm:text-sm font-bold uppercase text-neutral-500">No drops match the selected filter.</span>
              <div>
                <button 
                  type="button"
                  onClick={function() { setSelectedCategory("All"); setSelectedUniverse("All"); setSelectedSubcategory("All"); }}
                  className="bg-neutral-900 text-white px-4 py-2 text-xs font-bold uppercase"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 xs:gap-3.5 sm:gap-6">
              {filteredProducts.map(function(prod) {
                return (
                  <ProductCard 
                    key={prod.id} 
                    product={prod} 
                    navigate={navigate} 
                    addToBag={addToBag} 
                    onQuickView={setQuickViewItem}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, navigate, addToBag, onQuickView = function() {} }: any) {
  const [selectedColor, setSelectedColor] = useState((product.colors && product.colors[0] && product.colors[0].name) || "Standard");
  const [selectedSize, setSelectedSize] = useState("L");
  const colorObj = (product.colors && product.colors.find(function(c) { return c.name === selectedColor; })) || (product.colors && product.colors[0]);
  const cardImage = (colorObj && colorObj.images && colorObj.images[0]) || (product.images && product.images[0]) || product.image;

  const sellingPrice = Number(product.price);
  const originalPrice = product.originalPrice != null && Number(product.originalPrice) > 0 ? Number(product.originalPrice) : null;
  const hasDiscount = originalPrice !== null && originalPrice > sellingPrice;

  return (
    <div className="group flex flex-col justify-between bg-white border border-neutral-200 hover:border-neutral-400 transition-all font-mono shadow-2xs h-full w-full overflow-hidden">
      <div>
        <div 
          onClick={function() { navigate("/products/" + product.slug + "?color=" + encodeURIComponent(selectedColor)); }}
          className="aspect-[3/4] overflow-hidden bg-neutral-100 cursor-pointer relative w-full"
        >
          <img 
            src={resolveProductImageUrl(cardImage)} 
            onError={handleImageLoadError}
            alt={product.name} 
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 block" 
          />
          {product.badge && (
            <span className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 bg-[#E51E2B] text-white text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 uppercase tracking-wider">
              {product.badge}
            </span>
          )}

          {onQuickView && (
            <button 
              type="button"
              onClick={function(e) { e.stopPropagation(); onQuickView(product); }}
              className="absolute bottom-2 sm:bottom-2.5 right-2 sm:right-2.5 bg-white/95 hover:bg-[#E51E2B] hover:text-white text-neutral-800 p-1.5 sm:p-2 shadow-xs transition-colors"
              title="Quick View"
              aria-label="Quick View"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        <div className="p-2.5 xs:p-3 sm:p-4 space-y-1.5">
          <div className="flex items-center space-x-1 text-[9px] xs:text-[10px] sm:text-[11px] font-mono text-neutral-500">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-bold text-neutral-700">{product.rating || 5.0}</span>
            <span>({product.reviewsCount || 0})</span>
          </div>

          <h3 
            onClick={function() { navigate("/products/" + product.slug + "?color=" + encodeURIComponent(selectedColor)); }} 
            className="text-[11px] xs:text-xs font-bold uppercase tracking-tight text-neutral-900 group-hover:text-[#E51E2B] transition-colors line-clamp-1 cursor-pointer"
          >
            {product.name}
          </h3>

          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pt-0.5 font-mono">
            <span className="text-xs sm:text-sm font-extrabold text-neutral-900 whitespace-nowrap">
              Rs. {sellingPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-neutral-400 line-through whitespace-nowrap">
                Rs. {originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
              <span className="text-[8px] sm:text-[9px] font-mono uppercase text-neutral-400 font-bold shrink-0">COLORS:</span>
              <div className="flex items-center gap-1.5">
                {product.colors.map(function(col) {
                  const isCurrent = selectedColor === col.name;
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={function() { setSelectedColor(col.name); }}
                      className={"w-3.5 h-3.5 rounded-full border transition-all shrink-0 " + (isCurrent ? "ring-2 ring-black scale-110 border-white" : "border-neutral-300 hover:scale-105")}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-2.5 xs:p-3 sm:p-4 pt-0 space-y-2">
        <div className="grid grid-cols-5 gap-0.5 xs:gap-1 pt-2 border-t border-neutral-100">
          {(product.availableSizes || ["S", "M", "L", "XL", "XXL"]).map(function(size) {
            const isSelected = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={function(e) {
                  e.stopPropagation();
                  setSelectedSize(size);
                }}
                className={"border py-1 text-[8px] xs:text-[9px] sm:text-[10px] font-mono font-bold transition-all uppercase text-center " + (
                  isSelected
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200"
                )}
                title={"Select size " + size}
              >
                {size}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={function(e) {
            e.stopPropagation();
            addToBag(product, selectedSize, selectedColor);
          }}
          className="w-full bg-neutral-900 hover:bg-[#E51E2B] text-white py-1.5 text-[9px] xs:text-[10px] font-mono font-bold uppercase tracking-wider transition-colors shadow-2xs flex items-center justify-center gap-1.5"
        >
          <ShoppingBag className="w-3 h-3" />
          <span>Add to Bag ({selectedSize})</span>
        </button>
      </div>
    </div>
  );
}

function ProductDetailPageView({ product, allProducts, storeBrand, initialColor, navigate, addToBag }) {
  if (!product) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 font-mono text-center space-y-3">
        <h2 className="text-lg font-bold uppercase">Drop Not Found</h2>
        <button 
          type="button" 
          onClick={function() { navigate("/shop"); }} 
          className="bg-neutral-900 text-white px-5 py-2 text-xs uppercase font-bold"
        >
          Back to Shop All
        </button>
      </div>
    );
  }

  return (
    <ProductDetailInner
      key={product.id}
      product={product}
      allProducts={allProducts}
      storeBrand={storeBrand}
      initialColor={initialColor}
      navigate={navigate}
      addToBag={addToBag}
    />
  );
}

function ProductDetailInner({ product, allProducts, storeBrand, initialColor, navigate, addToBag }) {
  const [chosenColor, setChosenColor] = useState(initialColor || (product.colors && product.colors[0] && product.colors[0].name) || "Standard");
  const [chosenSize, setChosenSize] = useState("L");
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  const activeColorObj = (product.colors && product.colors.find(function(c) { return c.name === chosenColor; })) || (product.colors && product.colors[0]);
  const activeImages = (activeColorObj && activeColorObj.images && activeColorObj.images.length) ? activeColorObj.images : (product.images || []);

  const sellingPrice = Number(product.price);
  const originalPrice = product.originalPrice != null && Number(product.originalPrice) > 0 ? Number(product.originalPrice) : null;
  const hasDiscount = originalPrice !== null && originalPrice > sellingPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

  const relatedProducts = useMemo(function() {
    return allProducts
      .filter(function(p) {
        return p.id !== product.id && (p.universeId === product.universeId || p.category === product.category);
      })
      .slice(0, 4);
  }, [allProducts, product]);

  const touchStartX = useRef(0);
  const handleTouchStart = function(e) { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = function(e) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && selectedImgIdx < activeImages.length - 1) setSelectedImgIdx(selectedImgIdx + 1);
    else if (diff < -50 && selectedImgIdx > 0) setSelectedImgIdx(selectedImgIdx - 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 font-mono space-y-10 sm:space-y-16 w-full overflow-x-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        <div className="space-y-3 sm:space-y-4 w-full">
          <div 
            className="aspect-[4/5] bg-neutral-50/90 border border-neutral-200 overflow-hidden relative group flex items-center justify-center p-2 select-none w-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={resolveProductImageUrl(activeImages[selectedImgIdx] || activeImages[0])} 
              onError={handleImageLoadError}
              alt={product.name} 
              className="max-w-full max-h-full w-auto h-auto object-contain object-center transition-all duration-300 block" 
            />

            {product.badge && (
              <span className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 bg-[#E51E2B] text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 uppercase tracking-wider">
                {product.badge}
              </span>
            )}
            <span className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 bg-black/85 text-white text-[9px] sm:text-[10px] px-2 py-0.5 uppercase font-bold">
              ANGLE {selectedImgIdx + 1} / {activeImages.length || 1}
            </span>

            {activeImages.length > 1 && (
              <div>
                <button 
                  type="button"
                  onClick={function() { setSelectedImgIdx(function(prev) { return prev > 0 ? prev - 1 : activeImages.length - 1; }); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 sm:p-2 hover:bg-white text-black shadow-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  type="button"
                  onClick={function() { setSelectedImgIdx(function(prev) { return prev < activeImages.length - 1 ? prev + 1 : 0; }); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 sm:p-2 hover:bg-white text-black shadow-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>

          {activeImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
              {activeImages.map(function(imgRef, i) {
                return (
                  <button 
                    key={i} 
                    type="button"
                    onClick={function() { setSelectedImgIdx(i); }}
                    className={"w-14 sm:w-16 h-18 sm:h-20 border-2 shrink-0 overflow-hidden bg-neutral-100 " + (selectedImgIdx === i ? "border-[#E51E2B]" : "border-neutral-200")}
                  >
                    <img 
                      src={resolveProductImageUrl(imgRef)} 
                      onError={handleImageLoadError}
                      alt="" 
                      className="w-full h-full object-cover object-center" 
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-5 sm:space-y-6 w-full">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#E51E2B]">
              <span>{product.category}</span>
              <span>•</span>
              <span>{product.subcategory || "Original Release"}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black uppercase text-neutral-900 tracking-tight leading-snug">{product.name}</h1>
            
            <div className="flex items-baseline space-x-2.5 sm:space-x-3 pt-2">
              <span className="text-xl sm:text-2xl font-bold text-neutral-900">
                Rs. {sellingPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm sm:text-base text-neutral-400 line-through">
                  Rs. {originalPrice.toFixed(2)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="bg-[#E51E2B]/10 text-[#E51E2B] text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-xs">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          </div>

          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-200">
              <span className="text-xs uppercase font-bold text-neutral-700 block">COLOUR: {chosenColor}</span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(function(col) {
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={function() { setChosenColor(col.name); setSelectedImgIdx(0); }}
                      className={"flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 border text-xs transition-all " + (
                        chosenColor === col.name ? "border-black bg-neutral-900 text-white font-bold" : "border-neutral-300 hover:border-black"
                      )}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" style={{ backgroundColor: col.hex }} />
                      <span className="truncate">{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-neutral-200">
            <span className="text-xs uppercase font-bold text-neutral-700 block">SELECT SIZE</span>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {AVAILABLE_GLOBAL_SIZES.map(function(s) {
                const isAvailable = (product.availableSizes || AVAILABLE_GLOBAL_SIZES).indexOf(s) !== -1;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!isAvailable}
                    onClick={function() { setChosenSize(s); }}
                    className={"py-2 sm:py-2.5 text-xs font-bold border transition-colors " + (
                      !isAvailable ? "opacity-30 line-through cursor-not-allowed border-neutral-200" :
                      chosenSize === s ? "bg-[#E51E2B] text-white border-[#E51E2B]" : "border-neutral-300 hover:border-black"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={function() { addToBag(product, chosenSize, chosenColor); }}
              className="w-full bg-neutral-900 hover:bg-[#E51E2B] text-white py-3.5 sm:py-4 text-xs uppercase font-bold tracking-wider transition-colors shadow-xs"
            >
              ADD TO BAG • RS. {sellingPrice.toFixed(2)}
            </button>
            <button
              type="button"
              onClick={function() {
                const singleCart = [Object.assign({}, product, { selectedSize: chosenSize, selectedColor: chosenColor, quantity: 1 })];
                ordersService.createOrder({
                  customerName: 'Direct WhatsApp Customer',
                  phone: 'Pending WhatsApp Confirmation',
                  shippingAddress: {},
                  itemsSummary: `${product.name} (${chosenColor}/${chosenSize}) x1`,
                  subtotal: product.price,
                  totalAmount: product.price,
                  items: [{
                    productId: product.id,
                    productName: product.name,
                    variantTitle: `${chosenColor} / ${chosenSize}`,
                    unitPrice: product.price,
                    quantity: 1
                  }]
                }).catch(function(e) { console.warn('Direct order persist note:', e); });
                const url = buildWhatsAppCartOrderUrl(singleCart, product.price, 0, "", 0, product.price, null, storeBrand.whatsappPhone, storeBrand.domain);
                window.open(url, "_blank");
              }}
              className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2.5 sm:py-3 text-[11px] sm:text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white shrink-0" />
              <span className="truncate">DIRECT ORDER ON WHATSAPP ({storeBrand.whatsappDisplay})</span>
            </button>
          </div>

          <div className="pt-4 border-t border-neutral-200 space-y-3 text-xs">
            <p className="text-neutral-600 leading-relaxed">{product.description}</p>
            {product.specs && product.specs.length > 0 && (
              <div className="bg-neutral-50 p-3 border border-neutral-200 space-y-1">
                <span className="font-bold uppercase text-neutral-800 block mb-1">Specifications:</span>
                {product.specs.map(function(sp, idx) {
                  return (
                    <div key={idx} className="text-neutral-600 flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-[#E51E2B] shrink-0" />
                      <span>{sp}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="pt-8 sm:pt-10 border-t border-neutral-200 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-black uppercase text-neutral-900">VERIFIED CUSTOMER REVIEWS</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Real feedback verified directly through WhatsApp order references on {storeBrand.domain}.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-amber-800 self-start sm:self-auto">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
            <span>{product.rating || 5.0} / 5.0 ({product.reviewsCount || 0} VERIFIED)</span>
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 p-6 sm:p-8 text-center space-y-2">
          <Star className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-300 mx-auto" />
          <h4 className="text-xs font-bold uppercase text-neutral-700">Genuine Customer Reviews</h4>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Reviews are submitted exclusively by verified buyers following parcel delivery.
          </p>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="pt-8 sm:pt-10 border-t border-neutral-200 space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-black uppercase text-neutral-900">YOU MAY ALSO LIKE</h3>
            <button type="button" onClick={function() { navigate("/shop"); }} className="text-xs font-bold uppercase text-[#E51E2B] hover:underline">
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 xs:gap-3.5 sm:gap-6">
            {relatedProducts.map(function(rp) {
              return (
                <ProductCard 
                  key={rp.id} 
                  product={rp} 
                  navigate={navigate} 
                  addToBag={addToBag} 
                  onQuickView={function() {}} 
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function QuickViewModal({ product, onClose, onNavigate, onAddToBag }) {
  const [size, setSize] = useState("L");
  const [color, setColor] = useState((product.colors && product.colors[0] && product.colors[0].name) || "Standard");

  const colorObj = (product.colors && product.colors.find(function(c) { return c.name === color; })) || (product.colors && product.colors[0]);
  const img = (colorObj && colorObj.images && colorObj.images[0]) || (product.images && product.images[0]) || product.image;

  const sellingPrice = Number(product.price);
  const originalPrice = product.originalPrice != null && Number(product.originalPrice) > 0 ? Number(product.originalPrice) : null;
  const hasDiscount = originalPrice !== null && originalPrice > sellingPrice;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white max-w-lg w-full p-4 sm:p-6 relative shadow-2xl font-mono space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start pb-2 border-b">
          <h3 className="text-xs sm:text-sm font-black uppercase text-neutral-900 truncate pr-3">{product.name}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:text-red-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-col sm:row gap-4">
          <div className="w-full sm:w-32 h-44 sm:h-40 bg-neutral-100 shrink-0 overflow-hidden">
            <img 
              src={resolveProductImageUrl(img)} 
              onError={handleImageLoadError}
              alt="" 
              className="w-full h-full object-cover object-center" 
            />
          </div>
          <div className="space-y-3 flex-1 text-xs">
            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-sm sm:text-base text-neutral-900">Rs. {sellingPrice.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-[11px] sm:text-xs text-neutral-400 line-through">Rs. {originalPrice.toFixed(2)}</span>
              )}
            </div>

            {product.colors && (
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Color</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {product.colors.map(function(c) {
                    return (
                      <button 
                        key={c.name} 
                        type="button"
                        onClick={function() { setColor(c.name); }}
                        className={"w-4 h-4 rounded-full border " + (color === c.name ? "ring-2 ring-black" : "")}
                        style={{ backgroundColor: c.hex }} 
                      />
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Size</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {AVAILABLE_GLOBAL_SIZES.map(function(s) {
                  return (
                    <button 
                      key={s} 
                      type="button"
                      onClick={function() { setSize(s); }}
                      className={"px-2 py-1 border text-[10px] font-bold " + (size === s ? "bg-[#E51E2B] text-white" : "")}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <button 
            type="button"
            onClick={function() { onNavigate("/products/" + product.slug); }} 
            className="flex-1 py-2 border font-bold text-xs uppercase"
          >
            Full Details
          </button>
          <button 
            type="button"
            onClick={function() { onAddToBag(product, size, color); }} 
            className="flex-1 py-2 bg-neutral-900 text-white font-bold text-xs uppercase hover:bg-[#E51E2B]"
          >
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
}

function ShoppingBagDrawer({ 
  cart, 
  onClose, 
  onAdjustQty, 
  cartSubtotal, 
  deliveryCharge, 
  estimatedCartTotal, 
  hasFreeShipping,
  freeShippingLimit,
  whatsappPhone,
  domain
}) {
  const [deliveryInfo, setDeliveryInfo] = useState(function() {
    try {
      const saved = localStorage.getItem("th3ee_customer_address");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { fullName: "", phone: "", address: "", city: "", state: "", pincode: "" };
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);

  const handleApplyCoupon = async function() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage("");
    const result = await couponsService.validateCoupon(couponCode, cartSubtotal);
    setCouponLoading(false);
    if (result.valid) {
      setAppliedCoupon(result.coupon || { code: couponCode.trim().toUpperCase() });
      setCouponDiscount(result.discount);
      setCouponMessage(result.message);
    } else {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage(result.message || "Invalid coupon code");
    }
  };

  const handleRemoveCoupon = function() {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponMessage("");
  };

  const handleAddressChange = function(field, val) {
    const updated = Object.assign({}, deliveryInfo);
    updated[field] = val;
    setDeliveryInfo(updated);
    try { localStorage.setItem("th3ee_customer_address", JSON.stringify(updated)); } catch (e) {}
  };

  const limit = freeShippingLimit || INITIAL_FREE_SHIPPING_LIMIT;
  const finalCartTotal = Math.max(0, cartSubtotal - couponDiscount + deliveryCharge);

  const handleProceedWhatsApp = async function() {
    if (cart.length === 0) return;
    const itemsSummary = cart.map(function(it) {
      return `${it.name} (${it.selectedColor}/${it.selectedSize}) x${it.quantity}`;
    }).join(', ');

    try {
      await ordersService.createOrder({
        customerName: deliveryInfo.fullName || 'WhatsApp Customer',
        phone: deliveryInfo.phone || 'Pending',
        shippingAddress: deliveryInfo,
        itemsSummary: itemsSummary,
        subtotal: cartSubtotal,
        discountAmount: couponDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        shippingAmount: deliveryCharge,
        totalAmount: finalCartTotal,
        items: cart.map(function(it) {
          return {
            productId: it.id,
            productName: it.name,
            variantTitle: `${it.selectedColor} / ${it.selectedSize}`,
            unitPrice: it.price,
            quantity: it.quantity
          };
        })
      });
    } catch (e) {
      console.warn('Cart order DB persist note:', e);
    }

    const url = buildWhatsAppCartOrderUrl(cart, cartSubtotal, couponDiscount, appliedCoupon ? appliedCoupon.code : "", deliveryCharge, finalCartTotal, deliveryInfo, whatsappPhone, domain);
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-mono">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-3 sm:pl-10">
        <div className="w-screen max-w-md bg-white flex flex-col justify-between shadow-2xl p-4 sm:p-6">
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-200">
              <h3 className="text-xs font-bold uppercase tracking-wider">TH3EE BAG ({cart.length})</h3>
              <button type="button" onClick={onClose} className="p-1 hover:text-red-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="py-2.5 sm:py-3 border-b border-neutral-100 text-xs">
              <span className="text-neutral-600 text-[10px] sm:text-[11px] block">
                {hasFreeShipping ? "FREE EXPRESS SHIPPING UNLOCKED" : "Add Rs. " + (limit - cartSubtotal) + " more for Free Shipping"}
              </span>
              <div className="w-full bg-neutral-200 h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-[#E51E2B] h-full transition-all duration-300"
                  style={{ width: Math.min(100, (cartSubtotal / limit) * 100) + "%" }} 
                />
              </div>
            </div>

            <div className="py-3 sm:py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs">Your bag is empty.</div>
              ) : (
                cart.map(function(item) {
                  return (
                    <div key={item.id + "-" + item.selectedSize + "-" + item.selectedColor} className="flex space-x-2.5 sm:space-x-3 items-center pb-2.5 border-b border-neutral-100">
                      <img 
                        src={resolveProductImageUrl((item.images && item.images[0]) || (item.colors && item.colors[0] && item.colors[0].images && item.colors[0].images[0]))} 
                        onError={handleImageLoadError}
                        alt={item.name} 
                        className="w-12 h-14 sm:w-14 sm:h-16 object-cover object-center bg-neutral-100 border border-neutral-200 shrink-0" 
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <h4 className="font-bold uppercase truncate">{item.name}</h4>
                        <div className="text-neutral-500 text-[10px] truncate">SIZE: {item.selectedSize} • {item.selectedColor}</div>
                        <div className="flex justify-between items-center mt-1.5">
                          <div className="flex border border-neutral-300">
                            <button type="button" onClick={function() { onAdjustQty(item.id, item.selectedSize, item.selectedColor, -1); }} className="px-2 py-0.5 text-xs">-</button>
                            <span className="px-2 py-0.5 font-bold text-xs">{item.quantity}</span>
                            <button type="button" onClick={function() { onAdjustQty(item.id, item.selectedSize, item.selectedColor, 1); }} className="px-2 py-0.5 text-xs">+</button>
                          </div>
                          <span className="font-bold text-xs">Rs. {Number(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-2 pb-4">
                <button
                  type="button"
                  onClick={function() { setShowAddressForm(!showAddressForm); }}
                  className="text-xs font-bold text-neutral-800 uppercase flex items-center justify-between w-full py-2 border-y border-neutral-200"
                >
                  <span className="truncate">{showAddressForm ? "▼ Hide Delivery Address" : "► Add Delivery Address (Optional)"}</span>
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0">Include in WhatsApp</span>
                </button>

                {showAddressForm && (
                  <div className="mt-3 space-y-2 text-xs">
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      value={deliveryInfo.fullName} 
                      onChange={function(e) { handleAddressChange("fullName", e.target.value); }} 
                      className="w-full p-2 border border-neutral-300 bg-neutral-50 text-xs"
                    />
                    <input 
                      type="tel" 
                      placeholder="10-Digit Phone" 
                      value={deliveryInfo.phone} 
                      onChange={function(e) { handleAddressChange("phone", e.target.value); }} 
                      className="w-full p-2 border border-neutral-300 bg-neutral-50 text-xs"
                    />
                    <input 
                      type="text" 
                      placeholder="Address Line" 
                      value={deliveryInfo.address} 
                      onChange={function(e) { handleAddressChange("address", e.target.value); }} 
                      className="w-full p-2 border border-neutral-300 bg-neutral-50 text-xs"
                    />
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      <input 
                        type="text" 
                        placeholder="City" 
                        value={deliveryInfo.city} 
                        onChange={function(e) { handleAddressChange("city", e.target.value); }} 
                        className="p-1.5 sm:p-2 border border-neutral-300 bg-neutral-50 text-xs"
                      />
                      <input 
                        type="text" 
                        placeholder="State" 
                        value={deliveryInfo.state} 
                        onChange={function(e) { handleAddressChange("state", e.target.value); }} 
                        className="p-1.5 sm:p-2 border border-neutral-300 bg-neutral-50 text-xs"
                      />
                      <input 
                        type="text" 
                        placeholder="Pincode" 
                        value={deliveryInfo.pincode} 
                        onChange={function(e) { handleAddressChange("pincode", e.target.value); }} 
                        className="p-1.5 sm:p-2 border border-neutral-300 bg-neutral-50 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {cart.length > 0 && (
              <div className="pt-2 pb-2">
                <button
                  type="button"
                  onClick={function() { setIsCouponOpen(!isCouponOpen); }}
                  className="text-xs font-bold text-neutral-800 uppercase flex items-center justify-between w-full py-2 border-b border-neutral-200"
                >
                  <span className="truncate flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#E51E2B]" />
                    {appliedCoupon ? "Coupon: " + appliedCoupon.code + " (-Rs. " + couponDiscount + ")" : (isCouponOpen ? "▼ Hide Promo Code" : "► Apply Coupon / Promo Code")}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                    {appliedCoupon ? "Applied" : "Add Code"}
                  </span>
                </button>

                {isCouponOpen && (
                  <div className="mt-2 space-y-1.5">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 text-xs">
                        <span className="font-bold text-emerald-800">
                          {appliedCoupon.code} (-Rs. {couponDiscount})
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[10px] font-bold text-red-600 uppercase hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="ENTER COUPON CODE"
                          value={couponCode}
                          onChange={function(e) { setCouponCode(e.target.value.toUpperCase()); setCouponMessage(""); }}
                          className="flex-1 p-2 border border-neutral-300 bg-neutral-50 text-xs font-bold uppercase tracking-wider"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-3 py-2 bg-neutral-900 hover:bg-[#E51E2B] disabled:bg-neutral-300 text-white text-xs font-bold uppercase transition-colors"
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </div>
                    )}
                    {couponMessage && (
                      <div className={"text-[10px] font-bold " + (appliedCoupon ? "text-emerald-700" : "text-red-600")}>
                        {couponMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 pt-3 sm:pt-4 space-y-2.5 sm:space-y-3">
            <div className="flex justify-between text-xs">
              <span>Subtotal</span>
              <span>Rs. {cartSubtotal.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-bold">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-Rs. {couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span>Shipping</span>
              <span>{deliveryCharge === 0 ? "FREE" : "Rs. " + deliveryCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#E51E2B]">
              <span>Total</span>
              <span>Rs. {finalCartTotal.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={handleProceedWhatsApp}
              disabled={cart.length === 0}
              className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white py-3 font-mono text-xs font-bold uppercase transition-colors"
            >
              Order via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorialTriFoldSection({ navigate, domain }) {
  const editorialCards = [
    {
      title: "MEN",
      desc: "Elevated everyday heavyweight essentials with structured boxy lines.",
      cta: "SHOP MEN",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: "WOMEN",
      desc: "Effortless oversized streetwear style cut for comfort and movement.",
      cta: "SHOP WOMEN",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
    },
    {
      title: "UNISEX",
      desc: "Comfort meets cool everyday unisex draping across 180-350 GSM loopback cottons.",
      cta: "SHOP ARCHIVE",
      image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80"
    }
  ];

  return (
    <section className="bg-[#0D0D0D] text-white py-10 sm:py-16 border-t border-neutral-800 relative z-10 font-mono w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-neutral-800/80 gap-2">
          <div>
            <span className="text-[9px] sm:text-[10px] text-[#E51E2B] uppercase tracking-widest font-bold block mb-1">
              TH3EE ATELIER CURATIONS
            </span>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
              ELEVATED EVERYDAY HEAVYWEIGHT SILHOUETTES
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-neutral-400 block">
              OFFICIAL DOMAIN
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-white tracking-wider">
              {domain || INITIAL_OFFICIAL_DOMAIN}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {editorialCards.map(function(card) {
            return (
              <div 
                key={card.title}
                className="flex bg-[#161616] border border-neutral-800 hover:border-neutral-700 transition-all duration-300 overflow-hidden group shadow-md"
              >
                <div className="w-28 xs:w-32 sm:w-36 md:w-40 shrink-0 aspect-[4/5] overflow-hidden bg-neutral-900 relative">
                  <img 
                    src={card.image} 
                    onError={handleImageLoadError}
                    alt={card.title} 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>

                <div className="p-3.5 sm:p-5 flex flex-col justify-between flex-1 space-y-2.5 sm:space-y-3">
                  <div className="space-y-1 sm:space-y-1.5">
                    <h4 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                      {card.title}
                    </h4>
                    <p className="text-xs text-neutral-400 font-sans leading-relaxed line-clamp-3 sm:line-clamp-none">
                      {card.desc}
                    </p>
                  </div>

                  <button 
                    type="button"
                    onClick={function() { navigate("/shop"); }}
                    className="text-xs font-mono uppercase font-bold text-[#E51E2B] hover:text-white flex items-center gap-1.5 pt-1 transition-colors self-start"
                  >
                    <span>{card.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   SECRET / HIDDEN ATELIER COMMAND CENTER (ADMIN PANEL)
   Accessible via:
   - Ctrl + Shift + A (Cmd + Shift + A)
   - Triple clicking the footer copyright line
   - Direct path: /atelier-admin or /owner
========================================================================= */

function SecretAtelierAdminView({
  productsList,
  setProductsList,
  heroSlides,
  setHeroSlides,
  ordersList,
  setOrdersList,
  storeBrand,
  setStoreBrand,
  universeCategoriesList,
  navigate,
  showNotification
}) {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminEmail, setAdminEmail] = useState("charithreddytatekalava@gmail.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState("products"); // "products" | "inventory" | "banners" | "orders" | "coupons" | "reports" | "settings"

  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minimumOrderAmount: 0,
    maximumDiscount: 500,
    usageLimit: 100,
    isActive: true,
    canStack: false
  });

  const [reportsSummary, setReportsSummary] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(function() {
    if (isUnlocked) {
      if (activeTab === "coupons") {
        setCouponsLoading(true);
        couponsService.getCoupons().then(function(coupons) {
          setCouponsList(coupons);
          setCouponsLoading(false);
        }).catch(function() {
          setCouponsLoading(false);
        });
      } else if (activeTab === "reports") {
        setReportsLoading(true);
        reportsService.getSalesSummary().then(function(summary) {
          setReportsSummary(summary);
          setReportsLoading(false);
        }).catch(function() {
          setReportsLoading(false);
        });
      }
    }
  }, [isUnlocked, activeTab]);

  useEffect(function() {
    let isMounted = true;
    authService.getCurrentUser().then(function(user) {
      if (isMounted && user && user.id) {
        setAdminUser(user);
        setIsUnlocked(true);
      } else if (isMounted) {
        setAdminUser(null);
        setIsUnlocked(false);
      }
    });
    return function() { isMounted = false; };
  }, []);

  const handleAuthSubmit = async function(e: React.FormEvent) {
    if (e) e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAuthError("Enter admin email and password");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    const { user, error } = await authService.signIn(adminEmail.trim(), adminPassword);
    setAuthLoading(false);
    if (error || !user || !user.id) {
      setAuthError(error ? error.message : "Authentication failed. Check your InsForge credentials.");
    } else {
      setAdminUser(user);
      setIsUnlocked(true);
      showNotification("Welcome back to Atelier Studio (" + (user.email || 'Admin') + ")");
    }
  };

  const handleLock = async function() {
    await authService.signOut();
    setAdminUser(null);
    setIsUnlocked(false);
    navigate("/");
    showNotification("Admin Console Locked");
  };

  // Product Studio State (Modal for Adding / Editing)
  const [editingProduct, setEditingProduct] = useState(null);

  // If locked, render the stealth security shield
  if (!isUnlocked) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 font-mono">
        <div className="max-w-md w-full bg-white border-2 border-neutral-900 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-12 h-12 bg-[#E51E2B] text-white flex items-center justify-center mx-auto rounded-full shadow-lg">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#E51E2B] uppercase">HIDDEN VAULT</span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900 mt-1">
              ATELIER COMMAND CENTER
            </h2>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Authentication required to modify storefront products, imagery, inventory, banners, and order logs.
            </p>
          </div>

          {!authService.isConfigured() && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-left space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">InsForge Backend Pending</span>
              <p className="text-[11px] text-amber-700 leading-normal">
                Set <code className="bg-amber-100 px-1 font-bold">VITE_INSFORGE_URL</code> and <code className="bg-amber-100 px-1 font-bold">VITE_INSFORGE_ANON_KEY</code> to enable live administrator authentication.
              </p>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <input 
              type="email"
              placeholder="Admin Email (e.g. admin@th3ee.in)"
              value={adminEmail}
              onChange={function(e) { setAdminEmail(e.target.value); setAuthError(""); }}
              className="w-full p-3 border border-neutral-300 text-xs text-center font-bold tracking-normal focus:outline-none focus:border-black bg-neutral-50"
              autoFocus
            />

            <input 
              type="password"
              placeholder="Enter Password"
              value={adminPassword}
              onChange={function(e) { setAdminPassword(e.target.value); setAuthError(""); }}
              className="w-full p-3 border border-neutral-300 text-xs text-center font-bold tracking-widest focus:outline-none focus:border-black bg-neutral-50"
            />

            {authError && (
              <div className="text-[11px] text-red-600 font-bold">{authError}</div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-neutral-950 hover:bg-[#E51E2B] disabled:bg-neutral-400 text-white py-3 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              {authLoading ? "Authenticating..." : "Unlock Studio"}
            </button>
          </form>

          <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={function() { navigate("/"); }}
              className="text-[10px] text-neutral-400 hover:text-neutral-700 uppercase"
            >
              ← Return to Public Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }


  // Handle Product Deletion
  const handleDeleteProduct = function(productId: string) {
    if (!adminUser || !adminUser.id) {
      showNotification("Authentication required: Please lock and sign in as administrator.");
      setIsUnlocked(false);
      return;
    }
    if (confirm("Are you sure you want to permanently delete this drop from the catalog?")) {
      productsService.deleteProduct(productId).then(function() {
        setProductsList(function(prev) { return prev.filter(function(p) { return p.id !== productId; }); });
        showNotification("Product drop deleted successfully");
      }).catch(function(err: any) {
        const msg = err?.message || 'Error';
        if (msg.includes('permission denied') || msg.includes('row-level security')) {
          showNotification("Session expired: Please lock and sign in again as administrator.");
          setIsUnlocked(false);
        } else {
          showNotification("Failed to delete product: " + msg);
        }
      });
    }
  };

  // Handle Inventory Variant Step
  const handleInventoryStep = function(productId: string, colorName: string, size: string, delta: number) {
    if (!adminUser || !adminUser.id) {
      showNotification("Authentication required: Please lock and sign in as administrator.");
      setIsUnlocked(false);
      return;
    }
    setProductsList(function(prev) {
      return prev.map(function(prod) {
        if (prod.id !== productId) return prod;
        const currentInv = Object.assign({}, prod.inventory || {});
        const colorInv = Object.assign({}, currentInv[colorName] || {});
        const currQty = Number(colorInv[size]) || 0;
        const nextQty = Math.max(0, currQty + delta);
        colorInv[size] = nextQty;
        currentInv[colorName] = colorInv;
        const updatedProd = Object.assign({}, prod, { inventory: currentInv });
        productsService.saveProduct(updatedProd).catch(function(err: any) {
          console.warn('Inventory step persist note:', err);
          const msg = err?.message || 'Error';
          if (msg.includes('permission denied') || msg.includes('row-level security')) {
            showNotification("Session expired: Please lock and sign in again as administrator.");
            setIsUnlocked(false);
          } else {
            showNotification("Failed to save stock: " + msg);
          }
        });
        return updatedProd;
      });
    });
  };

  // Toggle inStock
  const handleToggleStockStatus = function(productId: string) {
    if (!adminUser || !adminUser.id) {
      showNotification("Authentication required: Please lock and sign in as administrator.");
      setIsUnlocked(false);
      return;
    }
    setProductsList(function(prev) {
      return prev.map(function(p) {
        if (p.id === productId) {
          const next = !p.inStock;
          const updated = Object.assign({}, p, { inStock: next });
          productsService.saveProduct(updated).then(function() {
            showNotification(p.name + " marked as " + (next ? "IN STOCK" : "OUT OF STOCK"));
          }).catch(function(err: any) {
            console.warn('Stock status save note:', err);
            const msg = err?.message || 'Error';
            if (msg.includes('permission denied') || msg.includes('row-level security')) {
              showNotification("Session expired: Please lock and sign in again as administrator.");
              setIsUnlocked(false);
            } else {
              showNotification("Failed to save product: " + msg);
            }
          });
          return updated;
        }
        return p;
      });
    });
  };

  // Handle Order Status Advance
  const handleAdvanceOrderStatus = function(orderId: string) {
    const statuses = ["Received", "In Production", "Dispatched", "Delivered"];
    setOrdersList(function(prev) {
      const target = prev.find(function(ord) { return ord.id === orderId; });
      if (!target) return prev;
      const currIdx = statuses.indexOf(target.status);
      const nextStatus = statuses[(currIdx + 1) % statuses.length];
      ordersService.updateOrderStatus(orderId, nextStatus).then(function() {
        showNotification("Order " + target.id + " status updated to " + nextStatus);
      }).catch(function(err: any) {
        showNotification("Failed to update status: " + (err?.message || 'Error'));
      });
      return prev.map(function(ord) {
        if (ord.id !== orderId) return ord;
        return Object.assign({}, ord, { status: nextStatus });
      });
    });
  };

  // Coupon Management Handlers
  const handleToggleCouponStatus = async function(coupon: any) {
    try {
      const updated = await couponsService.saveCoupon({
        ...coupon,
        isActive: !coupon.isActive
      });
      setCouponsList(function(prev) {
        return prev.map(function(c) { return c.id === updated.id ? updated : c; });
      });
      showNotification("Coupon " + coupon.code + " " + (updated.isActive ? "ACTIVATED" : "DEACTIVATED"));
    } catch (err: any) {
      showNotification("Failed to update coupon: " + (err?.message || 'Error'));
    }
  };

  const handleDeleteCoupon = async function(couponId: string, code: string) {
    if (confirm("Delete coupon " + code + "?")) {
      try {
        await couponsService.deleteCoupon(couponId);
        setCouponsList(function(prev) { return prev.filter(function(c) { return c.id !== couponId; }); });
        showNotification("Coupon " + code + " deleted");
      } catch (err: any) {
        showNotification("Failed to delete coupon: " + (err?.message || 'Error'));
      }
    }
  };

  const handleCreateCouponSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    if (!newCoupon.code.trim()) {
      showNotification("Coupon code is required");
      return;
    }
    try {
      const created = await couponsService.saveCoupon(newCoupon);
      setCouponsList(function(prev) {
        const idx = prev.findIndex(function(c) { return c.code === created.code; });
        if (idx > -1) {
          const cp = [].concat(prev);
          cp[idx] = created;
          return cp;
        }
        return [created].concat(prev);
      });
      setIsCreatingCoupon(false);
      setNewCoupon({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        minimumOrderAmount: 0,
        maximumDiscount: 500,
        usageLimit: 100,
        isActive: true,
        canStack: false
      });
      showNotification("Coupon " + created.code + " created successfully");
    } catch (err: any) {
      showNotification("Failed to create coupon: " + (err?.message || 'Error'));
    }
  };

  // Performance Reports CSV Exports
  const handleExportOrdersCsv = function() {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Items', 'Total Amount', 'Status', 'Courier', 'Tracking Number'];
    const rows = ordersList.map(function(o) {
      return [
        o.id,
        o.date || o.createdAt || '',
        o.customerName,
        o.phone,
        o.items,
        o.total,
        o.status,
        o.courier || '',
        o.trackingNumber || ''
      ];
    });
    reportsService.downloadCsv('th3ee_orders_export.csv', headers, rows);
    showNotification("Exported orders CSV");
  };

  const handleExportInventoryCsv = function() {
    const headers = ['SKU', 'Product Name', 'Category', 'Colour', 'Size', 'Stock Quantity', 'Price', 'In Stock Status'];
    const rows: (string | number)[][] = [];
    productsList.forEach(function(p) {
      if (p.colors && p.colors.length > 0) {
        p.colors.forEach(function(c) {
          (p.availableSizes || ['S', 'M', 'L', 'XL', 'XXL']).forEach(function(s) {
            const qty = (p.inventory && p.inventory[c.name] && p.inventory[c.name][s]) || 0;
            rows.push([
              p.sku || p.id,
              p.name,
              p.category,
              c.name,
              s,
              qty,
              p.price,
              p.inStock ? 'ACTIVE' : 'OUT_OF_STOCK'
            ]);
          });
        });
      } else {
        rows.push([
          p.sku || p.id,
          p.name,
          p.category,
          'Default',
          'Standard',
          0,
          p.price,
          p.inStock ? 'ACTIVE' : 'OUT_OF_STOCK'
        ]);
      }
    });
    reportsService.downloadCsv('th3ee_inventory_export.csv', headers, rows);
    showNotification("Exported inventory CSV");
  };

  // Reset to initial factory presets
  const handleFactoryReset = function() {
    if (confirm("Reset all products, banner images, and configurations to original factory presets?")) {
      setProductsList(INITIAL_MASTER_PRODUCTS);
      setHeroSlides(INITIAL_HERO_SLIDES);
      setOrdersList([]);
      setStoreBrand(INITIAL_STORE_BRAND);
      showNotification("Factory presets restored across all sections.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-mono space-y-6 w-full">
      {/* Top Admin Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-neutral-900 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#E51E2B] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">
              LIVE ATELIER STUDIO
            </span>
            <span className="text-[10px] text-neutral-400">Ctrl+Shift+A Secret Panel</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900 mt-0.5">
            Storefront Command Center
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {adminUser && adminUser.email && (
            <span className="text-[10px] text-neutral-500 font-bold hidden md:inline-block">
              Admin: {adminUser.email}
            </span>
          )}
          <button
            type="button"
            onClick={function() { navigate("/"); }}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-bold uppercase transition-colors"
          >
            ← View Store
          </button>
          <button
            type="button"
            onClick={handleLock}
            className="px-3 py-1.5 bg-neutral-950 hover:bg-[#E51E2B] text-white text-xs font-bold uppercase transition-colors"
          >
            Lock Studio
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-neutral-200 overflow-x-auto gap-2 pb-0.5">
        {[
          { id: "products", label: "Products Catalog (" + productsList.length + ")", icon: Package },
          { id: "inventory", label: "Inventory Matrix", icon: Layers },
          { id: "banners", label: "Hero & Carousel Banners (" + heroSlides.length + ")", icon: Image },
          { id: "orders", label: "Orders & Tracking (" + ordersList.length + ")", icon: Truck },
          { id: "coupons", label: "Coupons (" + couponsList.length + ")", icon: Tag },
          { id: "reports", label: "Sales & Performance", icon: BarChart3 },
          { id: "settings", label: "Store Identity & WhatsApp", icon: SlidersHorizontal }
        ].map(function(tab) {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={function() { setActiveTab(tab.id); }}
              className={"px-3.5 py-2.5 text-xs font-bold uppercase whitespace-nowrap flex items-center gap-2 transition-all border-b-2 " + (
                isActive 
                  ? "border-[#E51E2B] text-[#E51E2B] bg-red-50/50" 
                  : "border-transparent text-neutral-600 hover:text-black hover:border-neutral-300"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRODUCTS CATALOG & STUDIO */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-neutral-50 p-3.5 border border-neutral-200">
            <div>
              <h2 className="text-sm font-bold uppercase text-neutral-900">Manage Garment Drops</h2>
              <p className="text-[11px] text-neutral-500">Edit titles, prices, R2 image galleries, and specs in real time.</p>
            </div>
            <button
              type="button"
              onClick={function() {
                setEditingProduct({
                  id: "th-" + Date.now().toString(36),
                  sku: "th-" + Math.floor(100 + Math.random() * 900),
                  slug: "new-custom-drop-" + Math.floor(100 + Math.random() * 900),
                  name: "NEW ATELIER STREETWEAR DROP",
                  category: "T-Shirts",
                  subcategory: "Baahubali",
                  universeId: "tfi",
                  price: 499,
                  originalPrice: 799,
                  gsm: "290 GSM",
                  fabric: "100% Combed Terry Cotton",
                  fit: "Relaxed Boxy Cut",
                  availableSizes: ["S", "M", "L", "XL", "XXL"],
                  colors: [
                    { name: "Washed Carbon Black", hex: "#1C1C1C", images: ["tshirts/IMg 1.jpeg"] }
                  ],
                  inventory: {
                    "Washed Carbon Black": { S: 10, M: 20, L: 30, XL: 15, XXL: 5 }
                  },
                  badge: "NEW DROP",
                  rating: 5.0,
                  reviewsCount: 1,
                  inStock: true,
                  description: "Custom drop created via the hidden Atelier command studio.",
                  specs: ["290 GSM Heavyweight Loopback Cotton", "Reinforced Collar Ribbing"],
                  care: ["Cold machine wash inside out"],
                  images: ["tshirts/IMg 1.jpeg"]
                });
              }}
              className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Drop</span>
            </button>
          </div>

          <div className="bg-white border border-neutral-200 divide-y divide-neutral-200 overflow-hidden shadow-xs">
            {productsList.map(function(prod) {
              const mainImg = (prod.images && prod.images[0]) || (prod.colors && prod.colors[0] && prod.colors[0].images && prod.colors[0].images[0]);
              return (
                <div key={prod.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={resolveProductImageUrl(mainImg)} 
                      onError={handleImageLoadError}
                      alt="" 
                      className="w-12 h-16 object-cover bg-neutral-100 border border-neutral-200 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold text-[#E51E2B]">{prod.category}</span>
                        {prod.badge && (
                          <span className="bg-black text-white text-[8px] font-bold px-1.5 py-0.2 uppercase">{prod.badge}</span>
                        )}
                        <span className={"text-[9px] font-bold px-1.5 py-0.2 uppercase " + (prod.inStock ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                          {prod.inStock ? "IN STOCK" : "OUT OF STOCK"}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold uppercase text-neutral-900 truncate mt-0.5">{prod.name}</h3>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-black">Rs. {Number(prod.price).toFixed(2)}</span>
                        {prod.originalPrice && (
                          <span className="line-through text-neutral-400">Rs. {Number(prod.originalPrice).toFixed(2)}</span>
                        )}
                        <span>•</span>
                        <span>{prod.colors ? prod.colors.length : 0} Colors</span>
                        <span>•</span>
                        <span>{prod.gsm}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={function() { handleToggleStockStatus(prod.id); }}
                      className="px-2.5 py-1.5 border border-neutral-300 text-[10px] font-bold uppercase hover:bg-neutral-100"
                    >
                      {prod.inStock ? "Mark Out of Stock" : "Mark In Stock"}
                    </button>
                    <button
                      type="button"
                      onClick={function() { setEditingProduct(Object.assign({}, prod)); }}
                      className="px-3 py-1.5 bg-neutral-900 text-white hover:bg-black text-xs font-bold uppercase flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={function() { handleDeleteProduct(prod.id); }}
                      className="p-1.5 text-neutral-400 hover:text-red-600 border border-neutral-200"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY MATRIX */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="bg-neutral-50 p-3.5 border border-neutral-200">
            <h2 className="text-sm font-bold uppercase text-neutral-900">Colorway × Size Inventory Matrix</h2>
            <p className="text-[11px] text-neutral-500">Adjust variant units directly. Zero stock automatically notifies shoppers.</p>
          </div>

          <div className="space-y-4">
            {productsList.map(function(prod) {
              const colors = prod.colors || [{ name: "Standard", hex: "#000000" }];
              return (
                <div key={prod.id} className="bg-white border border-neutral-200 p-4 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase text-neutral-900">{prod.name}</h3>
                      <span className="text-[10px] text-neutral-400">SKU: {prod.sku} • {prod.category}</span>
                    </div>
                    <span className={"text-[10px] font-bold px-2 py-0.5 " + (prod.inStock ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                      {prod.inStock ? "ACTIVE IN CATALOG" : "DISABLED"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colors.map(function(col) {
                      const colorInv = (prod.inventory && prod.inventory[col.name]) || {};
                      return (
                        <div key={col.name} className="p-3 bg-neutral-50 border border-neutral-200 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full border border-neutral-300" style={{ backgroundColor: col.hex }} />
                            <span className="text-xs font-bold text-neutral-800 uppercase">{col.name}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {(prod.availableSizes || AVAILABLE_GLOBAL_SIZES).map(function(size) {
                              const qty = Number(colorInv[size]) || 0;
                              return (
                                <div key={size} className="bg-white p-2 border border-neutral-200 text-center space-y-1">
                                  <span className="text-[10px] font-bold text-neutral-500 uppercase">{size}</span>
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={function() { handleInventoryStep(prod.id, col.name, size, -1); }}
                                      className="w-5 h-5 bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-xs font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold min-w-5">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={function() { handleInventoryStep(prod.id, col.name, size, 1); }}
                                      className="w-5 h-5 bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-xs font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BANNERS & HERO SLIDES */}
      {activeTab === "banners" && (
        <div className="space-y-4">
          <div className="bg-neutral-50 p-3.5 border border-neutral-200 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold uppercase text-neutral-900">Homepage Hero Slides</h2>
              <p className="text-[11px] text-neutral-500">Manage rotating mobile and desktop showcase banners.</p>
            </div>
            <button
              type="button"
              onClick={function() {
                const newSlide = {
                  id: "slide-" + (heroSlides.length + 1),
                  tag: "NEW DROP",
                  title: "NEW STREETWEAR DROP",
                  highlight: "EXCLUSIVE RELEASE",
                  desc: "180 to 350 GSM custom milled heavyweight cotton silhouette.",
                  cta: "EXPLORE DROP",
                  target: "/shop",
                  bgGradient: "from-neutral-950 via-neutral-900 to-neutral-950",
                  image: resolveProductImageUrl("tshirts/IMg 1.jpeg"),
                  badgeColor: "bg-[#E51E2B]"
                };
                setHeroSlides(function(prev) { return prev.concat([newSlide]); });
                showNotification("Added new slide");
              }}
              className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slide</span>
            </button>
          </div>

          <div className="space-y-3">
            {heroSlides.map(function(slide, idx) {
              return (
                <div key={slide.id || idx} className="bg-white border border-neutral-200 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-bold uppercase">Slide #{idx + 1}: {slide.title}</span>
                    <button
                      type="button"
                      onClick={function() {
                        if (heroSlides.length <= 1) {
                          showNotification("At least 1 slide must be preserved.");
                          return;
                        }
                        setHeroSlides(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
                        showNotification("Slide removed");
                      }}
                      className="text-neutral-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block">Tagline Badge</label>
                      <input
                        type="text"
                        value={slide.tag || ""}
                        onChange={function(e) {
                          const val = e.target.value;
                          setHeroSlides(function(prev) {
                            const c = [].concat(prev);
                            c[idx] = Object.assign({}, c[idx], { tag: val });
                            return c;
                          });
                        }}
                        className="w-full p-2 border border-neutral-300 bg-neutral-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block">Headline Title</label>
                      <input
                        type="text"
                        value={slide.title || ""}
                        onChange={function(e) {
                          const val = e.target.value;
                          setHeroSlides(function(prev) {
                            const c = [].concat(prev);
                            c[idx] = Object.assign({}, c[idx], { title: val });
                            return c;
                          });
                        }}
                        className="w-full p-2 border border-neutral-300 bg-neutral-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block">Highlight Text (Red)</label>
                      <input
                        type="text"
                        value={slide.highlight || ""}
                        onChange={function(e) {
                          const val = e.target.value;
                          setHeroSlides(function(prev) {
                            const c = [].concat(prev);
                            c[idx] = Object.assign({}, c[idx], { highlight: val });
                            return c;
                          });
                        }}
                        className="w-full p-2 border border-neutral-300 bg-neutral-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 uppercase block">Image Path or URL</label>
                      <input
                        type="text"
                        value={slide.image || ""}
                        onChange={function(e) {
                          const val = e.target.value;
                          setHeroSlides(function(prev) {
                            const c = [].concat(prev);
                            c[idx] = Object.assign({}, c[idx], { image: val });
                            return c;
                          });
                        }}
                        className="w-full p-2 border border-neutral-300 bg-neutral-50"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS & TRACKING */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="bg-neutral-50 p-3.5 border border-neutral-200">
            <h2 className="text-sm font-bold uppercase text-neutral-900">Orders & WhatsApp Tracking Desk</h2>
            <p className="text-[11px] text-neutral-500">Track and advance order fulfillment for WhatsApp orders.</p>
          </div>

          <div className="bg-white border border-neutral-200 divide-y divide-neutral-200">
            {ordersList.map(function(order) {
              return (
                <div key={order.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{order.id}</span>
                      <span className={"text-[9px] font-bold px-2 py-0.5 uppercase " + (
                        order.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                        order.status === "Dispatched" ? "bg-blue-100 text-blue-800" :
                        order.status === "In Production" ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-800"
                      )}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-800 font-bold">{order.customerName} • {order.phone}</div>
                    <div className="text-[11px] text-neutral-500">{order.items}</div>
                    <div className="text-[10px] text-neutral-400">Total: Rs. {order.total} • Tracking: {order.courier} ({order.trackingNumber})</div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={function() { handleAdvanceOrderStatus(order.id); }}
                      className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-bold uppercase hover:bg-[#E51E2B] transition-colors"
                    >
                      Advance Status
                    </button>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 border border-neutral-300 text-xs font-bold uppercase hover:bg-neutral-100 transition-colors"
                      >
                        Track
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: COUPONS */}
      {activeTab === "coupons" && (
        <div className="space-y-4">
          <div className="bg-neutral-50 p-3.5 border border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase text-neutral-900">Discount & Promo Codes</h2>
              <p className="text-[11px] text-neutral-500">Configure promotional vouchers, percentage cuts, and minimum cart tiers.</p>
            </div>
            <button
              type="button"
              onClick={function() { setIsCreatingCoupon(!isCreatingCoupon); }}
              className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingCoupon ? "Close Form" : "Create Coupon"}</span>
            </button>
          </div>

          {isCreatingCoupon && (
            <form onSubmit={handleCreateCouponSubmit} className="bg-white border-2 border-neutral-900 p-4 sm:p-5 space-y-4 text-xs">
              <span className="text-[10px] font-bold text-[#E51E2B] uppercase tracking-widest block">NEW PROMOTION</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 uppercase block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. TH3EE10"
                    value={newCoupon.code}
                    onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { code: e.target.value.toUpperCase() })); }}
                    className="w-full p-2 border border-neutral-300 font-bold uppercase bg-neutral-50"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 uppercase block mb-1">Discount Type</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { discountType: e.target.value as any })); }}
                    className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700 uppercase block mb-1">
                    {newCoupon.discountType === 'percentage' ? 'Percentage Off (%)' : 'Amount Off (Rs.)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newCoupon.discountType === 'percentage' ? 100 : 10000}
                    value={newCoupon.discountValue}
                    onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { discountValue: Number(e.target.value) })); }}
                    className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 uppercase block mb-1">Min Cart Value (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCoupon.minimumOrderAmount}
                    onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { minimumOrderAmount: Number(e.target.value) })); }}
                    className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 uppercase block mb-1">Max Discount Cap (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={newCoupon.maximumDiscount || ''}
                    onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { maximumDiscount: e.target.value ? Number(e.target.value) : undefined })); }}
                    className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 uppercase block mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={newCoupon.usageLimit || ''}
                    onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { usageLimit: e.target.value ? Number(e.target.value) : undefined })); }}
                    className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 uppercase block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 10% off on all streetwear drops"
                  value={newCoupon.description}
                  onChange={function(e) { setNewCoupon(Object.assign({}, newCoupon, { description: e.target.value })); }}
                  className="w-full p-2 border border-neutral-300 bg-neutral-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={function() { setIsCreatingCoupon(false); }}
                  className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 uppercase font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E51E2B] hover:bg-black text-white uppercase font-bold text-xs transition-colors"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-neutral-200 divide-y divide-neutral-200">
            {couponsLoading ? (
              <div className="p-8 text-center text-xs text-neutral-500">Loading coupons...</div>
            ) : couponsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No active promotional coupons found. Click "Create Coupon" above to add your first promo code.
              </div>
            ) : (
              couponsList.map(function(coupon) {
                return (
                  <div key={coupon.id || coupon.code} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-neutral-50/70 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs tracking-wider bg-neutral-900 text-white px-2 py-0.5">
                          {coupon.code}
                        </span>
                        <span className={"text-[9px] font-bold px-2 py-0.5 uppercase " + (
                          coupon.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-600"
                        )}>
                          {coupon.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                        <span className="text-xs font-bold text-[#E51E2B]">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `Rs. ${coupon.discountValue} OFF`}
                        </span>
                      </div>
                      {coupon.description && (
                        <div className="text-xs text-neutral-700">{coupon.description}</div>
                      )}
                      <div className="text-[10px] text-neutral-400 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>Min Cart: Rs. {coupon.minimumOrderAmount || 0}</span>
                        {coupon.maximumDiscount && <span>Max Cap: Rs. {coupon.maximumDiscount}</span>}
                        <span>Used: {coupon.usageCount || 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' (unlimited)'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={function() { handleToggleCouponStatus(coupon); }}
                        className={"px-3 py-1.5 text-xs font-bold uppercase transition-colors " + (
                          coupon.isActive ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                      >
                        {coupon.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={function() { handleDeleteCoupon(coupon.id, coupon.code); }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SALES & PERFORMANCE */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="bg-neutral-50 p-3.5 border border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase text-neutral-900">Sales & Performance Analytics</h2>
              <p className="text-[11px] text-neutral-500">Live order metrics, average order value, warehouse units, and CSV ledger downloads.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportOrdersCsv}
                className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Orders CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportInventoryCsv}
                className="bg-neutral-900 hover:bg-[#E51E2B] text-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Inventory CSV</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Gross Revenue</span>
              <div className="text-base sm:text-lg font-black text-neutral-900">
                Rs. {((reportsSummary?.totalRevenue ?? ordersList.reduce((acc: number, o: any) => acc + (Number(o.total) || 0), 0))).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white p-3.5 border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Total Orders</span>
              <div className="text-base sm:text-lg font-black text-neutral-900">
                {reportsSummary?.totalOrders ?? ordersList.length}
              </div>
            </div>

            <div className="bg-white p-3.5 border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Avg Order Value</span>
              <div className="text-base sm:text-lg font-black text-neutral-900">
                Rs. {((reportsSummary?.averageOrderValue ?? (ordersList.length > 0 ? Math.round(ordersList.reduce((acc: number, o: any) => acc + (Number(o.total) || 0), 0) / ordersList.length) : 0))).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white p-3.5 border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Delivered Orders</span>
              <div className="text-base sm:text-lg font-black text-emerald-700">
                {reportsSummary?.completedOrders ?? ordersList.filter((o: any) => o.status === 'Delivered').length}
              </div>
            </div>

            <div className="bg-white p-3.5 border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">In Flight / Pending</span>
              <div className="text-base sm:text-lg font-black text-amber-700">
                {reportsSummary?.pendingOrders ?? ordersList.filter((o: any) => o.status !== 'Delivered').length}
              </div>
            </div>

            <div className="bg-white p-3.5 border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Warehouse Units</span>
              <div className="text-base sm:text-lg font-black text-neutral-900">
                {reportsSummary?.totalStockUnits || productsList.reduce((acc: number, p: any) => {
                  let sub = 0;
                  if (p.inventory) {
                    Object.values(p.inventory).forEach((colInv: any) => {
                      Object.values(colInv || {}).forEach((q: any) => { sub += Number(q) || 0; });
                    });
                  }
                  return acc + sub;
                }, 0)}
              </div>
            </div>
          </div>

          {/* Catalog Performance Breakdown */}
          <div className="bg-white border border-neutral-200 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Catalog Inventory Breakdown</h3>
            <div className="divide-y divide-neutral-100">
              {productsList.map(function(prod) {
                let prodStock = 0;
                if (prod.inventory) {
                  Object.values(prod.inventory).forEach(function(colInv: any) {
                    Object.values(colInv || {}).forEach(function(q: any) { prodStock += Number(q) || 0; });
                  });
                }
                return (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-neutral-900 uppercase">{prod.name}</span>
                      <span className="text-neutral-400 text-[10px] ml-2">SKU: {prod.sku || prod.id} • Rs. {prod.price}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-neutral-700">{prodStock} units</span>
                      <span className={"text-[9px] font-bold px-1.5 py-0.5 uppercase " + (prod.inStock ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                        {prod.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-5">
          <div className="bg-neutral-50 p-3.5 border border-neutral-200">
            <h2 className="text-sm font-bold uppercase text-neutral-900">Store Identity & WhatsApp Dispatch</h2>
            <p className="text-[11px] text-neutral-500">Configure public domain, WhatsApp hotline, and banner notifications.</p>
          </div>

          <div className="bg-white border border-neutral-200 p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-neutral-700 uppercase block mb-1">Official Domain</label>
                <input
                  type="text"
                  value={storeBrand.domain}
                  onChange={function(e) {
                    const val = e.target.value;
                    setStoreBrand(function(prev) { return Object.assign({}, prev, { domain: val }); });
                  }}
                  className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 uppercase block mb-1">WhatsApp Phone (International Digits)</label>
                <input
                  type="text"
                  value={storeBrand.whatsappPhone}
                  onChange={function(e) {
                    const val = e.target.value;
                    setStoreBrand(function(prev) { return Object.assign({}, prev, { whatsappPhone: val }); });
                  }}
                  className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 uppercase block mb-1">WhatsApp Display Text</label>
                <input
                  type="text"
                  value={storeBrand.whatsappDisplay}
                  onChange={function(e) {
                    const val = e.target.value;
                    setStoreBrand(function(prev) { return Object.assign({}, prev, { whatsappDisplay: val }); });
                  }}
                  className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 uppercase block mb-1">Free Shipping Threshold (Rs.)</label>
                <input
                  type="number"
                  value={storeBrand.freeShippingLimit}
                  onChange={function(e) {
                    const val = Number(e.target.value);
                    setStoreBrand(function(prev) { return Object.assign({}, prev, { freeShippingLimit: val }); });
                  }}
                  className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-neutral-700 uppercase block mb-1">Top Announcement Banner</label>
              <input
                type="text"
                value={storeBrand.announcementText}
                onChange={function(e) {
                  const val = e.target.value;
                  setStoreBrand(function(prev) { return Object.assign({}, prev, { announcementText: val }); });
                }}
                className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
              />
            </div>

            <div className="bg-neutral-900 text-white p-4 space-y-2 mt-4">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                STEALTH TRIGGERS & SHORTCUTS
              </span>
              <p className="text-neutral-300 text-xs leading-relaxed">
                Press <kbd className="bg-neutral-800 px-2 py-0.5 border border-neutral-700 text-[#E51E2B] font-bold">Ctrl</kbd> + <kbd className="bg-neutral-800 px-2 py-0.5 border border-neutral-700 text-[#E51E2B] font-bold">Shift</kbd> + <kbd className="bg-neutral-800 px-2 py-0.5 border border-neutral-700 text-[#E51E2B] font-bold">A</kbd> (or <kbd className="bg-neutral-800 px-2 py-0.5 border border-neutral-700 text-[#E51E2B] font-bold">Cmd</kbd> on macOS) anywhere on the storefront to immediately open this Atelier Command Center. Or triple-click the footer copyright line.
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={handleFactoryReset}
                className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold uppercase transition-colors"
              >
                Restore Factory Defaults
              </button>

              <button
                type="button"
                onClick={function() {
                  settingsService.saveStoreBrandConfig(storeBrand).then(function() {
                    showNotification("Settings saved successfully to InsForge");
                  }).catch(function(err) {
                    showNotification("Failed to save settings: " + (err?.message || 'Error'));
                  });
                }}
                className="bg-[#E51E2B] hover:bg-black text-white px-5 py-2.5 text-xs font-bold uppercase transition-colors shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Studio Edit / Create Modal */}
      {editingProduct && (
        <ProductStudioModal 
          product={editingProduct}
          universeCategoriesList={universeCategoriesList}
          onClose={function() { setEditingProduct(null); }}
          onSave={function(updated) {
            if (!adminUser || !adminUser.id) {
              showNotification("Authentication required: Please lock and sign in as administrator.");
              setIsUnlocked(false);
              return;
            }
            productsService.saveProduct(updated).then(function(saved) {
              setProductsList(function(prev) {
                const idx = prev.findIndex(function(p) { return p.id === saved.id || p.slug === saved.slug; });
                if (idx > -1) {
                  const c = [].concat(prev);
                  c[idx] = saved;
                  return c;
                }
                return [saved].concat(prev);
              });
              showNotification("Product saved & published to storefront");
            }).catch(function(err: any) {
              const msg = err?.message || 'Error';
              if (msg.includes('permission denied') || msg.includes('row-level security')) {
                showNotification("Session expired: Please lock and sign in again as administrator.");
                setIsUnlocked(false);
              } else {
                showNotification("Failed to save product: " + msg);
              }
            });
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

function ProductStudioModal({ product, universeCategoriesList, onClose, onSave }) {
  const [form, setForm] = useState(Object.assign({}, product));

  const handleChange = function(key, val) {
    const updated = Object.assign({}, form);
    updated[key] = val;
    setForm(updated);
  };

  const handleAddColor = function() {
    const newCol = {
      name: "New Color " + (form.colors ? form.colors.length + 1 : 1),
      hex: "#111111",
      images: ["tshirts/IMg 1.jpeg"]
    };
    const nextCols = (form.colors || []).concat([newCol]);
    handleChange("colors", nextCols);
  };

  const handleRemoveColor = function(idx) {
    const nextCols = (form.colors || []).filter(function(_, i) { return i !== idx; });
    handleChange("colors", nextCols);
  };

  const handleColorChange = function(idx, key, val) {
    const nextCols = [].concat(form.colors || []);
    nextCols[idx] = Object.assign({}, nextCols[idx]);
    nextCols[idx][key] = val;
    handleChange("colors", nextCols);
  };

  const handleColorImageChange = function(colIdx, imgIdx, val) {
    const nextCols = [].concat(form.colors || []);
    nextCols[colIdx] = Object.assign({}, nextCols[colIdx]);
    const nextImgs = [].concat(nextCols[colIdx].images || []);
    nextImgs[imgIdx] = val;
    nextCols[colIdx].images = nextImgs;
    handleChange("colors", nextCols);
  };

  const handleAddColorImage = function(colIdx) {
    const nextCols = [].concat(form.colors || []);
    nextCols[colIdx] = Object.assign({}, nextCols[colIdx]);
    nextCols[colIdx].images = (nextCols[colIdx].images || []).concat(["tshirts/IMg 1.jpeg"]);
    handleChange("colors", nextCols);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 font-mono">
      <div className="bg-white max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-5">
        <div className="flex justify-between items-center pb-3 border-b">
          <div>
            <span className="text-[9px] font-bold text-[#E51E2B] uppercase">PRODUCT STUDIO</span>
            <h3 className="text-base sm:text-lg font-black uppercase text-neutral-900">
              {form.id ? "Edit Garment Drop" : "Create New Drop"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">Product Title</label>
            <input 
              type="text" 
              value={form.name || ""} 
              onChange={function(e) { handleChange("name", e.target.value); }} 
              className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">URL Slug</label>
            <input 
              type="text" 
              value={form.slug || ""} 
              onChange={function(e) { handleChange("slug", e.target.value); }} 
              className="w-full p-2 border border-neutral-300 bg-neutral-50"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">Selling Price (Rs.)</label>
            <input 
              type="number" 
              value={form.price || 0} 
              onChange={function(e) { handleChange("price", Number(e.target.value)); }} 
              className="w-full p-2 border border-neutral-300 font-bold bg-neutral-50"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">Compare-At Price (Rs.)</label>
            <input 
              type="number" 
              value={form.originalPrice || 0} 
              onChange={function(e) { handleChange("originalPrice", Number(e.target.value)); }} 
              className="w-full p-2 border border-neutral-300 bg-neutral-50"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">Garment Category</label>
            <select
              value={form.category || "T-Shirts"}
              onChange={function(e) { handleChange("category", e.target.value); }}
              className="w-full p-2 border border-neutral-300 bg-neutral-50 font-bold"
            >
              <option value="T-Shirts">T-Shirts</option>
              <option value="Hoodies & Sweats">Hoodies & Sweats</option>
              <option value="Jackets & Outerwear">Jackets & Outerwear</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">Franchise Universe</label>
            <select
              value={form.universeId || "tfi"}
              onChange={function(e) { handleChange("universeId", e.target.value); }}
              className="w-full p-2 border border-neutral-300 bg-neutral-50 font-bold"
            >
              {universeCategoriesList.map(function(u) {
                return <option key={u.id} value={u.id}>{u.title} ({u.subtitle})</option>;
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">Subcategory / Franchise Tag</label>
            <input 
              type="text" 
              value={form.subcategory || ""} 
              onChange={function(e) { handleChange("subcategory", e.target.value); }} 
              className="w-full p-2 border border-neutral-300 bg-neutral-50"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">Badge Label</label>
            <input 
              type="text" 
              value={form.badge || ""} 
              placeholder="e.g. LIMITED EDITION, NEW DROP"
              onChange={function(e) { handleChange("badge", e.target.value); }} 
              className="w-full p-2 border border-neutral-300 bg-neutral-50 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">Fabric Weight (GSM)</label>
            <input 
              type="text" 
              value={form.gsm || "240 GSM"} 
              onChange={function(e) { handleChange("gsm", e.target.value); }} 
              className="w-full p-2 border border-neutral-300 bg-neutral-50"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-700 uppercase">Silhoutte Fit</label>
            <input 
              type="text" 
              value={form.fit || "Relaxed Boxy Cut"} 
              onChange={function(e) { handleChange("fit", e.target.value); }} 
              className="w-full p-2 border border-neutral-300 bg-neutral-50"
            />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="font-bold text-neutral-700 uppercase">Garment Description</label>
          <textarea 
            rows={3}
            value={form.description || ""}
            onChange={function(e) { handleChange("description", e.target.value); }}
            className="w-full p-2 border border-neutral-300 bg-neutral-50 text-xs leading-relaxed"
          />
        </div>

        {/* Colorways & Image Galleries */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase text-neutral-900">Colorways & Image Galleries</label>
            <button
              type="button"
              onClick={handleAddColor}
              className="text-[11px] bg-neutral-900 text-white px-2.5 py-1 uppercase font-bold"
            >
              + Add Colorway
            </button>
          </div>

          <div className="space-y-3">
            {(form.colors || []).map(function(col, cIdx) {
              return (
                <div key={cIdx} className="p-3 bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={col.hex} 
                        onChange={function(e) { handleColorChange(cIdx, "hex", e.target.value); }}
                        className="w-7 h-7 p-0 border-0 cursor-pointer bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={col.name} 
                        onChange={function(e) { handleColorChange(cIdx, "name", e.target.value); }}
                        className="p-1 border border-neutral-300 text-xs font-bold bg-white"
                      />
                    </div>
                    {form.colors.length > 1 && (
                      <button
                        type="button"
                        onClick={function() { handleRemoveColor(cIdx); }}
                        className="text-neutral-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 pl-2">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">Photoshoot Angles (R2 / URL)</span>
                    {(col.images || []).map(function(imgRef, imgIdx) {
                      return (
                        <div key={imgIdx} className="flex items-center gap-2">
                          <img 
                            src={resolveProductImageUrl(imgRef)} 
                            onError={handleImageLoadError} 
                            alt="" 
                            className="w-7 h-9 object-cover bg-neutral-200 shrink-0" 
                          />
                          <input 
                            type="text" 
                            value={imgRef} 
                            onChange={function(e) { handleColorImageChange(cIdx, imgIdx, e.target.value); }}
                            className="w-full p-1 border border-neutral-300 text-[11px] bg-white"
                            placeholder="R2 image path or URL"
                          />
                          <label className="cursor-pointer bg-neutral-900 hover:bg-[#E51E2B] text-white px-2 py-1 text-[10px] font-bold uppercase shrink-0 transition-colors">
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async function(e) {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const res = await uploadService.uploadImage(file, 'products');
                                  if (res && res.url) {
                                    handleColorImageChange(cIdx, imgIdx, res.url);
                                  }
                                } catch (err: any) {
                                  alert('Upload failed: ' + (err?.message || err));
                                }
                              }}
                            />
                          </label>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={function() { handleAddColorImage(cIdx); }}
                      className="text-[10px] text-[#E51E2B] font-bold uppercase underline pt-1 block"
                    >
                      + Add Photo Angle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border font-bold uppercase text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={function() { onSave(form); }}
            className="px-5 py-2 bg-neutral-900 hover:bg-[#E51E2B] text-white font-bold uppercase text-xs transition-colors"
          >
            Save & Publish
          </button>
        </div>
      </div>
    </div>
  );
}
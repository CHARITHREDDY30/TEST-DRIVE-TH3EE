import type { Product, HeroSlide, StoreBrandConfig, UniverseCategory } from '../types/store';
import { resolveProductImageUrl } from '../lib/r2';

export const INITIAL_OFFICIAL_DOMAIN = "th3ee.in";
export const INITIAL_WHATSAPP_PHONE = "919121798653";
export const INITIAL_WHATSAPP_DISPLAY = "+91 9121798653";
export const INITIAL_FREE_SHIPPING_LIMIT = 999;
export const AVAILABLE_GLOBAL_SIZES: string[] = ["S", "M", "L", "XL", "XXL"];

export const INITIAL_STORE_BRAND: StoreBrandConfig = {
  domain: INITIAL_OFFICIAL_DOMAIN,
  whatsappPhone: INITIAL_WHATSAPP_PHONE,
  whatsappDisplay: INITIAL_WHATSAPP_DISPLAY,
  freeShippingLimit: INITIAL_FREE_SHIPPING_LIMIT,
  announcementText: "TH3EE HEAVYWEIGHT ARCHIVE • FREE EXPRESS SHIPPING OVER Rs.999"
};

export const INITIAL_UNIVERSE_CATEGORIES: UniverseCategory[] = [
  {
    id: "tfi",
    title: "TFI",
    subtitle: "TELUGU CINEMA",
    bgGradient: "from-amber-950/90 via-orange-950/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80",
    subcategories: [
      { name: "All TFI Cult", code: "TFI", color: "bg-amber-600", text: "text-white" },
      { name: "Baahubali", code: "BAH", color: "bg-red-700", text: "text-white" },
      { name: "Salaar", code: "SLR", color: "bg-neutral-900", text: "text-white" },
      { name: "Spirit", code: "SPT", color: "bg-rose-700", text: "text-white" },
      { name: "RRR Fire & Water", code: "RRR", color: "bg-orange-600", text: "text-white" },
      { name: "Kalki 2898 AD", code: "KLK", color: "bg-indigo-700", text: "text-white" },
      { name: "Pushpa Raw", code: "PSH", color: "bg-amber-800", text: "text-white" },
      { name: "Devara", code: "DVR", color: "bg-sky-800", text: "text-white" }
    ]
  },
  {
    id: "anime",
    title: "ANIME",
    subtitle: "SHONEN SAGA",
    bgGradient: "from-rose-950/90 via-red-900/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    subcategories: [
      { name: "All Anime", code: "ALL", color: "bg-sky-500", text: "text-white" },
      { name: "Demon Slayer", code: "KIM", color: "bg-red-600", text: "text-white" },
      { name: "Naruto", code: "UZU", color: "bg-orange-500", text: "text-white" },
      { name: "Attack On Titan", code: "SHI", color: "bg-amber-800", text: "text-white" },
      { name: "One Piece", code: "STR", color: "bg-sky-600", text: "text-white" },
      { name: "Jujutsu Kaisen", code: "SOR", color: "bg-purple-600", text: "text-white" }
    ]
  },
  {
    id: "marvel",
    title: "MARVEL",
    subtitle: "CINEMATIC COMICS",
    bgGradient: "from-red-950/90 via-rose-900/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
    subcategories: [
      { name: "All Marvel", code: "MCU", color: "bg-red-600", text: "text-white" },
      { name: "Spider-Man", code: "SPD", color: "bg-red-500", text: "text-white" },
      { name: "Iron Man", code: "ARC", color: "bg-amber-600", text: "text-white" }
    ]
  },
  {
    id: "dc",
    title: "DC",
    subtitle: "JUSTICE & GOTHAM",
    bgGradient: "from-blue-950/90 via-sky-950/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=600&auto=format&fit=crop&q=80",
    subcategories: [
      { name: "All DC", code: "DCU", color: "bg-blue-600", text: "text-white" },
      { name: "The Batman", code: "DKN", color: "bg-neutral-950", text: "text-white" }
    ]
  },
  {
    id: "harry-potter",
    title: "HARRY POTTER",
    subtitle: "WIZARDING WORLD",
    bgGradient: "from-amber-950/90 via-yellow-950/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1598153346810-860daa814c4b?w=600&auto=format&fit=crop&q=80",
    subcategories: [
      { name: "All Wizarding", code: "HP", color: "bg-amber-600", text: "text-white" }
    ]
  },
  {
    id: "nanis-paradise",
    title: "NANI'S PARADISE",
    subtitle: "NATURAL STAR",
    bgGradient: "from-stone-900/90 via-zinc-800/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
    subcategories: [
      { name: "All Nani Drops", code: "NPR", color: "bg-stone-700", text: "text-white" }
    ]
  },
  {
    id: "doomsday",
    title: "DOOMSDAY",
    subtitle: "AVENGERS SAGA",
    bgGradient: "from-emerald-950/90 via-teal-950/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    subcategories: [
      { name: "All Doomsday", code: "DMD", color: "bg-emerald-700", text: "text-white" }
    ]
  },
  {
    id: "memes",
    title: "MEMES",
    subtitle: "BRAINROT & IRONY",
    bgGradient: "from-purple-950/90 via-pink-950/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80",
    subcategories: [{ name: "All Memes", code: "MEM", color: "bg-purple-600", text: "text-white" }]
  },
  {
    id: "game",
    title: "GAME",
    subtitle: "CONSOLE & PC",
    bgGradient: "from-indigo-950/90 via-blue-950/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80",
    subcategories: [{ name: "All Gaming", code: "GAM", color: "bg-indigo-600", text: "text-white" }]
  },
  {
    id: "festival",
    title: "FESTIVAL",
    subtitle: "LIGHTS & KITES",
    bgGradient: "from-rose-950/90 via-amber-950/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    subcategories: [{ name: "All Festival", code: "FST", color: "bg-rose-600", text: "text-white" }]
  },
  {
    id: "customise",
    title: "CUSTOMISE",
    subtitle: "BESPOKE STUDIO",
    bgGradient: "from-neutral-900/90 via-stone-900/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
    subcategories: [{ name: "All Custom", code: "CST", color: "bg-neutral-700", text: "text-white" }]
  },
  {
    id: "college",
    title: "COLLEGE",
    subtitle: "CAMPUS NOSTALGIA",
    bgGradient: "from-blue-950/90 via-slate-900/80 to-neutral-950",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80",
    subcategories: [{ name: "All Campus", code: "CMP", color: "bg-blue-700", text: "text-white" }]
  }
];

export const INITIAL_MASTER_PRODUCTS: Product[] = [
  {
    id: "th-bahubali-01",
    sku: "th-bahubali-01",
    slug: "baahubali-the-beginning-cult-graphic-tee",
    name: "BAAHUBALI: THE BEGINNING CULT GRAPHIC TEE",
    category: "T-Shirts",
    subcategory: "Baahubali",
    universeId: "tfi",
    price: 499,
    originalPrice: 799,
    gsm: "290 GSM",
    fabric: "100% Combed Terry Cotton",
    fit: "Mahishmati Oversized Box Cut",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { 
        name: "Washed Carbon Black", 
        hex: "#1C1C1C", 
        images: [
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/products/1792122621359-IMg_1.jpeg",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/products/1792122624943-img_2.jpeg",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/products/img3.jpeg",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/products/1792122631732-img_6.jpeg",
        ] 
      },
      { 
        name: "Blood Ochre Red", 
        hex: "#8B1E1E", 
        images: [
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/file_00000000e5d482089eb173017419586a.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/file_00000000077c820887b61e1ee64c4d7f.png"
        ] 
      },
      { 
        name: "Antique Sand", 
        hex: "#D4C5B9", 
        images: [
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/file_0000000022c88208929371af34120bb7.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/file_00000000284c8208815effc4db5f38bc.png"
        ] 
      }
    ],
    inventory: {
      "Washed Carbon Black": { S: 14, M: 22, L: 35, XL: 18, XXL: 8 },
      "Blood Ochre Red": { S: 10, M: 16, L: 20, XL: 12, XXL: 5 },
      "Antique Sand": { S: 8, M: 12, L: 15, XL: 9, XXL: 4 }
    },
    badge: "LIMITED EDITION",
    rating: 5.0,
    reviewsCount: 84,
    inStock: true,
    description: "Official @th3ee.verse drop. Heavyweight 290 GSM loopback cotton tee featuring the Shivudu Mahishmati ascension artwork rendered with high-density gold and crimson metallic screenprints. Finished with minimal 'PRABHAS / BAAHUBALI' chest insignia and signature 'TH3EE — WEAR THE SOUL' rear graphic.",
    specs: [
      "290 GSM Custom Milled Heavyweight Loopback Cotton",
      "Metallic Gold & Crimson High-Density Foil Screenprint",
      "Signature 'TH3EE — WEAR THE SOUL' Back Print",
      "Pre-Washed Anti-Shrink Mahishmati Oversized Boxy Cut",
      "Reinforced 1.25-inch Heavy Collar Ribbing"
    ],
    care: [
      "Cold machine wash inside out",
      "Do not iron directly on metallic and foil prints",
      "Dry flat in shade"
    ],
    images: [
      "tshirts/IMg 1.jpeg",
      "tshirts/img 2.jpeg",
      "tshirts/img 4.jpeg",
      "tshirts/img 5.jpeg"
    ]
  },
  {
    id: "th-salaar-01",
    sku: "th-salaar-01",
    slug: "salaar-devaratha-cult-ringer-oversized-tee",
    name: "SALAAR: DEVARATHA CULT RINGER OVERSIZED TEE",
    category: "T-Shirts",
    subcategory: "All TFI Cult",
    universeId: "tfi",
    price: 499,
    originalPrice: 799,
    gsm: "240 GSM",
    fabric: "100% Combed Terry Cotton",
    fit: "Khansaar Oversized Box Cut",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { 
        name: "Vintage Chalk White & Crimson Rib", 
        hex: "#F4F4F0", 
        images: [
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/%40th3ee.veese_20261010_192852_0000.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/22.jpeg",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/21.jpeg"
        ] 
      },
      { 
        name: "Washed Carbon Black", 
        hex: "#1C1C1C", 
        images: [
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/22.jpeg",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/21.jpeg"
        ] 
      }
    ],
    inventory: {
      "Vintage Chalk White & Crimson Rib": { S: 12, M: 25, L: 40, XL: 22, XXL: 10 },
      "Washed Carbon Black": { S: 15, M: 20, L: 30, XL: 16, XXL: 6 }
    },
    badge: "NEW DROP",
    rating: 5.0,
    reviewsCount: 92,
    inStock: true,
    description: "Official @th3ee.verse drop. Heavyweight 290 GSM loopback cotton ringer tee inspired by the ruthless warlord Devaratha of Khansaar. Features a front tribal warrior totem emblem and a high-density back print with bold SALAAR typography, scarlet script 'devaratha', and signature 'MAKE CODE TH3EE' atelier insignia.",
    specs: [
      "240 GSM Custom Milled Heavyweight Loopback Cotton",
      "Signature Crimson Red Contrast Ribbed Collar & Cuffs",
      "Front Chest: Intricate Tribal Battle Crest Screenprint",
      "Back: High-Density Monolithic SALAAR Typography with Scarlet Devaratha Script",
      "Official 'MAKE CODE TH3EE' Authentic Insignia Stamp",
      "Pre-Washed Anti-Shrink Khansaar Oversized Box Silhouette"
    ],
    care: [
      "Cold machine wash inside out",
      "Do not iron directly on high-density graphics",
      "Dry flat in shade"
    ],
    images: [
      "tshirts/21.jpeg",
      "tshirts/22.jpeg",
      "tshirts/27.jpeg",
      "tshirts/24.jpeg"
    ]
  },
  {
    id: "th-spirit-02",
    sku: "th-spirit-02",
    slug: "spirit-born-to-stand-out-oversized-tee",
    name: "SPIRIT: BORN TO STAND OUT HEAVYWEIGHT TEE",
    category: "T-Shirts",
    subcategory: "All TFI Cult",
    universeId: "tfi",
    price: 499,
    originalPrice: 799,
    gsm: "240 GSM",
    fabric: "100% Ring-Spun Compact Cotton",
    fit: "Loose Architectural Drape",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { 
        name: "Chalk White", 
        hex: "#F9F9F7", 
        images: [
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/1_20261016_140131_0000.jpg",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/2_20261016_140131_0001.jpg",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/3_20261016_140131_0002.jpg",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/4_20261016_140131_0003.jpg",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/5_20261016_140131_0004.jpg"
        ] 
      }
    ],
    inventory: {
      "Chalk White": { S: 9, M: 18, L: 28, XL: 14, XXL: 7 }
    },
    badge: "TRENDING DROP",
    rating: 4.9,
    reviewsCount: 64,
    inStock: true,
    description: "Official @th3ee.verse drop. 'BORN TO STAND OUT' Spirit oversized graphic tee crafted from 280 GSM premium ring-spun compact cotton. Features front 'ONE BAD HABIT' crimson block lettering and an iconic rear vintage artwork print with star accents and stylized Spirit branding.",
    specs: [
      "240 GSM Pre-Shrunk Compact Cotton",
      "Front Chest: Crimson 'ONE BAD HABIT' Distressed Screenprint",
      "Rear Spine: Full-Color 'SPIRIT / BORN TO STAND OUT' Signature Poster Artwork",
      "Reinforced 1.25-inch Heavy Collar Ribbing",
      "Drop-Shoulder Streetwear Silhouette"
    ],
    care: [
      "Cold gentle cycle wash inside out",
      "Do not bleach or tumble dry",
      "Warm iron inside out"
    ],
    images: [
      "tshirts/29.jpeg"
    ]
  },
  {
    id: "th-01",
    sku: "th-01",
    slug: "batman-dark-knight-oversized-graphic-tee",
    name: "BATMAN DARK KNIGHT OVERSIZED GRAPHIC TEE",
    category: "T-Shirts",
    subcategory: "Batman",
    universeId: "dc",
    price: 899,
    originalPrice: 1299,
    gsm: "240 GSM",
    fabric: "100% Combed Terry Cotton",
    fit: "Relaxed Boxy Cut",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      {
        name: "Washed Black",
        hex: "#1F1F1F",
        images: [
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045042513.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045053896.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045058609.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045062219.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045065681.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045069445.png"
        ]
      }
    ],
    inventory: {
      "Washed Black": {
        S: 10,
        M: 15,
        L: 25,
        XL: 10,
        XXL: 4
      }
    },
    badge: "BESTSELLER",
    rating: 4.9,
    reviewsCount: 38,
    inStock: true,
    description: "Unleash the Dark Knight with this Batman-inspired oversized graphic T-shirt from TH3EE. Crafted from heavyweight 280 GSM loopback terry cotton, featuring a bold Batman graphic, premium print detailing, and a relaxed boxy silhouette for everyday streetwear.",
    specs: [
      "240 GSM Heavyweight Terry Cotton",
      "100% Combed Terry Cotton",
      "Anti-Shrink Pre-Washed Finish",
      "Signature Drop Shoulder Cut",
      "Batman Graphic Print"
    ],
    care: [
      "Machine wash cold inside out",
      "Wash with similar colours",
      "Do not iron directly on the print",
      "Tumble dry low"
    ],
    images: [
      "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png"
    ]
  },
  {
    id: "th-02",
    sku: "th-02",
    slug: "spider-man-oversized-graphic-tee",
    name: "SPIDER-MAN OVERSIZED GRAPHIC TEE",
    category: "T-Shirts",
    subcategory: "Spider-Man",
    universeId: "marvel",
    price: 499,
    originalPrice: 799,
    gsm: "240 GSM",
    fabric: "100% Combed Terry Cotton",
    fit: "Relaxed Boxy Cut",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { 
        name: "Blood Ochre Red", 
        hex: "#8B1E1E", 
        images: [
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045075644.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045082281.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045089479.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045097744.png",
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045110815.png"
        ] 
      },
      { 
        name: "Washed Black", 
        hex: "#1F1F1F", 
        images: [
          ""
        ] 
      }
    ],
    inventory: {
      "Washed Black": {
        S: 10,
        M: 15,
        L: 25,
        XL: 10,
        XXL: 4
      }
    },
    badge: "BESTSELLER",
    rating: 4.9,
    reviewsCount: 38,
    inStock: true,
    description: "Swing into streetwear with the TH3EE Spider-Man oversized graphic tee. Crafted from heavyweight 280 GSM loopback terry cotton, featuring a bold Spider-Man-inspired graphic, premium print detailing, and a relaxed boxy silhouette.",
    specs: [
      "240 GSM Heavyweight Terry Cotton",
      "100% Combed Terry Cotton",
      "Anti-Shrink Pre-Washed Finish",
      "Signature Drop Shoulder Cut",
      "Spider-Man Graphic Print"
    ],
    care: [
      "Machine wash cold inside out",
      "Wash with similar colours",
      "Do not iron directly on the print",
      "Tumble dry low"
    ],
    images: [
      "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045075644.png"
    ]
  },
  {
    id: "th-04",
    sku: "th-04",
    slug: "500-gsm-ultimate-french-terry-hoodie",
    name: "500 GSM ULTIMATE FRENCH TERRY HOODIE",
    category: "Hoodies & Sweats",
    subcategory: "All Campus",
    universeId: "college",
    price: 3499,
    originalPrice: 4799,
    gsm: "500 GSM",
    fabric: "Double-Loop French Terry",
    fit: "Oversized Heavy Drape",
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { 
        name: "Obsidian Black", 
        hex: "#111111", 
        images: [
          "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png"
        ] 
      }
    ],
    inventory: {
      "Obsidian Black": { S: 5, M: 8, L: 14, XL: 7, XXL: 3 }
    },
    badge: "GRAIL",
    rating: 5.0,
    reviewsCount: 51,
    inStock: true,
    description: "Our heaviest outerwear piece. Custom milled 500 GSM double-face French terry cotton with an articulated double-layered hood and zero drawstrings for a pure structural look.",
    specs: ["500 GSM Double-Faced Terry", "Seamless Double-Layered Hood", "Pre-Shrunk 100% Combed Cotton"],
    care: ["Dry clean recommended", "Cold gentle wash"],
    images: [
      "https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png"
    ]
  }
];

export const INITIAL_HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    tag: "LEGENDARY CULT DROP",
    title: "BAAHUBALI CULT TEE",
    highlight: "THE EPIC OF MAHISHMATI",
    desc: "Heavyweight 290 GSM loopback cotton tee with high-density gold and crimson metallic screenprints.",
    cta: "SHOP BAAHUBALI",
    target: "/products/baahubali-the-beginning-cult-graphic-tee",
    bgGradient: "from-amber-950 via-orange-950 to-neutral-950",
    image: resolveProductImageUrl("tshirts/IMg 1.jpeg"),
    badgeColor: "bg-[#E51E2B]"
  },
  {
    id: "slide-2",
    tag: "NEW DROP",
    title: "SALAAR DEVARATHA TEE",
    highlight: "KHANSAAR WARRIOR",
    desc: "Heavyweight 290 GSM loopback cotton ringer with contrast red ribbing and tribal battle crest.",
    cta: "EXPLORE TFI DROPS",
    target: "/shop?universe=tfi",
    bgGradient: "from-neutral-950 via-neutral-900 to-neutral-950",
    image: resolveProductImageUrl("tshirts/21.jpeg"),
    badgeColor: "bg-red-700"
  },
  {
    id: "slide-3",
    tag: "TRENDING POSTER DROP",
    title: "SPIRIT OVERSIZED TEE",
    highlight: "BORN TO STAND OUT",
    desc: "280 GSM compact cotton with 'ONE BAD HABIT' distressed lettering and iconic poster artwork.",
    cta: "SHOP SPIRIT",
    target: "/shop?universe=tfi",
    bgGradient: "from-stone-950 via-zinc-900 to-neutral-950",
    image: resolveProductImageUrl("tshirts/29.jpeg"),
    badgeColor: "bg-amber-600"
  }
];

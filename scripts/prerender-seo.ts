import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_MASTER_PRODUCTS, INITIAL_UNIVERSE_CATEGORIES, INITIAL_OFFICIAL_DOMAIN } from '../src/data/initialCatalog';
import { resolveProductImageUrl } from '../src/lib/r2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const publicDir = path.resolve(rootDir, 'public');

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateMetadataTags(params: {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  type?: 'product' | 'website';
  price?: number;
  product?: (typeof INITIAL_MASTER_PRODUCTS)[number];
}): string {
  const { title, description, imageUrl, canonicalUrl, type = 'product', price, product } = params;
  const escapedTitle = escapeHtml(title);
  const escapedDesc = escapeHtml(description);
  const escapedUrl = escapeHtml(canonicalUrl);
  const escapedImg = escapeHtml(imageUrl);

  let tags = `
    <!-- Base asset resolution configured via <base href="/" /> -->
    <!-- Dynamic Social Preview Metadata & SEO by TH3EE Engine -->
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDesc}" />
    <link rel="canonical" href="${escapedUrl}" />

    <!-- Open Graph (Facebook, WhatsApp, Telegram, LinkedIn) -->
    <meta property="og:site_name" content="TH3EE" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDesc}" />
    <meta property="og:url" content="${escapedUrl}" />
    <meta property="og:image" content="${escapedImg}" />
    <meta property="og:image:secure_url" content="${escapedImg}" />
    <meta property="og:image:alt" content="${escapedTitle}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_IN" />
`;

  if (price !== undefined) {
    tags += `    <meta property="product:price:amount" content="${Math.round(price)}" />
    <meta property="product:price:currency" content="INR" />
`;
  }

  tags += `
    <!-- Twitter / X Large Summary Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@th3ee_in" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDesc}" />
    <meta name="twitter:image" content="${escapedImg}" />
    <meta name="twitter:image:alt" content="${escapedTitle}" />
`;

  // Inject Schema.org JSON-LD Structured Data for Products & Breadcrumbs
  if (type === 'product' && product) {
    const rawPrice = Math.round(Number(price || 499));
    const schemaData = {
      "@context": "https://schema.org/",
      "@graph": [
        {
          "@type": "Product",
          "@id": `${escapedUrl}#product`,
          "name": product.name,
          "image": [escapedImg],
          "description": escapedDesc,
          "sku": product.sku || product.id,
          "brand": {
            "@type": "Brand",
            "name": "TH3EE"
          },
          "offers": {
            "@type": "Offer",
            "url": escapedUrl,
            "priceCurrency": "INR",
            "price": rawPrice,
            "priceValidUntil": "2027-12-31",
            "itemCondition": "https://schema.org/NewCondition",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "TH3EE"
            }
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${escapedUrl}#breadcrumbs`,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": `https://${INITIAL_OFFICIAL_DOMAIN}/`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Shop",
              "item": `https://${INITIAL_OFFICIAL_DOMAIN}/shop`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": product.name,
              "item": escapedUrl
            }
          ]
        }
      ]
    };

    tags += `
    <!-- Schema.org Product & Breadcrumb Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(schemaData, null, 2)}
    </script>
`;
  }

  return tags;
}

function injectMetadataIntoHtml(baseHtml: string, metadataTags: string): string {
  // Remove existing title, description, canonical, og:*, twitter:* tags to avoid crawler confusion
  let html = baseHtml
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*?>/gi, '')
    .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*?>/gi, '')
    .replace(/<meta\s+property="product:[^"]+"[^>]*?>/gi, '');

  // Inject right before </head>
  return html.replace('</head>', `${metadataTags}\n  </head>`);
}


function generateSitemapXml(): string {
  const today = new Date().toISOString().split('T')[0];
  const domain = `https://${INITIAL_OFFICIAL_DOMAIN}`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // Static core pages
  xml += `  <url>\n    <loc>${domain}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${domain}/shop</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${domain}/shop/t-shirts</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${domain}/shop/hoodies-sweats</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${domain}/shop/baahubali</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${domain}/custom-dtf</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${domain}/about</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;

  // All master products
  for (const product of INITIAL_MASTER_PRODUCTS) {
    const rawImage = (product.colors && product.colors[0] && product.colors[0].images && product.colors[0].images[0]) ||
      (product.images && product.images[0]) ||
      '';
    const imageUrl = resolveProductImageUrl(rawImage);
    const prodUrl = `${domain}/products/${product.slug}`;

    xml += `  <url>\n`;
    xml += `    <loc>${prodUrl}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    if (imageUrl) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeHtml(imageUrl)}</image:loc>\n`;
      xml += `      <image:title>${escapeHtml(product.name)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

async function prerenderAll() {
  console.log('--- Starting TH3EE Social Preview & Sitemap Prerender ---');

  // Find base template: prefer dist/index.html (compiled), fallback to index.html
  let baseTemplatePath = path.resolve(distDir, 'index.html');
  if (!fs.existsSync(baseTemplatePath)) {
    baseTemplatePath = path.resolve(rootDir, 'index.html');
  }

  const baseHtml = fs.readFileSync(baseTemplatePath, 'utf-8');
  const targetDirs = [distDir, publicDir];

  let productCount = 0;

  for (const product of INITIAL_MASTER_PRODUCTS) {
    const rawImage = (product.colors && product.colors[0] && product.colors[0].images && product.colors[0].images[0]) ||
      (product.images && product.images[0]) ||
      (product as any).image ||
      '';
    const imageUrl = resolveProductImageUrl(rawImage);
    const canonicalUrl = `https://${INITIAL_OFFICIAL_DOMAIN}/products/${product.slug}`;
    const price = Math.round(Number(product.price));
    const title = `${product.name} | TH3EE Oversized Streetwear`;
    const description = `Shop "${product.name}" at TH3EE. Heavyweight graphic oversized streetwear tee · ₹${price}. ${product.description || 'Designed for everyday self-expression.'}`;

    const metadataTags = generateMetadataTags({
      title,
      description,
      imageUrl,
      canonicalUrl,
      type: 'product',
      price,
      product
    });

    const renderedHtml = injectMetadataIntoHtml(baseHtml, metadataTags);

    for (const outDir of targetDirs) {
      if (!fs.existsSync(outDir)) continue;
      const productDir = path.resolve(outDir, 'products', product.slug);
      fs.mkdirSync(productDir, { recursive: true });
      fs.writeFileSync(path.resolve(productDir, 'index.html'), renderedHtml, 'utf-8');
    }

    productCount++;
  }

  console.log(`✔ Prerendered ${productCount} product pages with rich Open Graph, Twitter & Schema.org cards`);

  // Dedicated core pages: Shop, Custom DTF, About, Bag, Profile, Checkout, Orders, Tracking, Loyalty, Auth
  const dedicatedPages = [
    {
      dirName: 'shop',
      title: 'Shop Premium T-Shirts | TH3EE',
      description: "Explore TH3EE's luxury T-shirt collection. Elevated fits, soft-touch fabrics and understated design for those who dress with intent.",
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/shop`
    },
    {
      dirName: 'custom-dtf',
      title: 'Custom DTF Printed T-Shirts | TH3EE Tirupati',
      description: 'Design your own premium T-shirt with TH3EE. High-definition DTF printing, rich colour and a lasting finish on quality fabric, made in Tirupati.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/custom-dtf`
    },
    {
      dirName: 'about',
      title: 'About TH3EE | Luxury Clothing from Tirupati',
      description: "TH3EE is built on precision, restraint and craft. Discover the story behind Tirupati's luxury T-shirt label and the philosophy behind every piece.",
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/about`
    },
    {
      dirName: 'bag',
      title: 'Shopping Bag | TH3EE Oversized Streetwear',
      description: 'Review your selected TH3EE streetwear silhouettes, apply member coupons, and proceed with encrypted express checkout.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/bag`
    },
    {
      dirName: 'cart',
      title: 'Shopping Bag | TH3EE Oversized Streetwear',
      description: 'Review your selected TH3EE streetwear silhouettes, apply member coupons, and proceed with encrypted express checkout.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/cart`
    },
    {
      dirName: 'profile',
      title: 'Patron Profile & Orders | TH3EE',
      description: 'Access your TH3EE patron profile, live order tracking, delivery addresses, and Loyalty Club rewards.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/profile`
    },
    {
      dirName: 'account',
      title: 'Patron Account & Orders | TH3EE',
      description: 'Manage your TH3EE account, past drop purchases, and delivery details.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/account`
    },
    {
      dirName: 'checkout',
      title: 'Secure Checkout | TH3EE',
      description: 'Complete your TH3EE order with secure encrypted Razorpay checkout and tracked express delivery across India.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/checkout`
    },
    {
      dirName: 'login',
      title: 'Patron Sign In | TH3EE',
      description: 'Sign in to your TH3EE account to access your orders, saved addresses, and loyalty privileges.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/login`
    },
    {
      dirName: 'register',
      title: 'Join the TH3EE Collective | Create Account',
      description: 'Create your TH3EE patron account for drop early access, exclusive rewards, and swift checkout.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/register`
    },
    {
      dirName: 'signup',
      title: 'Join the TH3EE Collective | Create Account',
      description: 'Create your TH3EE patron account for drop early access, exclusive rewards, and swift checkout.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/signup`
    },
    {
      dirName: 'orders',
      title: 'Order History & Tracking | TH3EE',
      description: 'View and track your previous TH3EE orders and delivery status.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/orders`
    },
    {
      dirName: 'track',
      title: 'Track Your Drop | TH3EE Order Tracking',
      description: 'Real-time parcel tracking and dispatch status for your TH3EE streetwear order.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/track`
    },
    {
      dirName: 'order-tracking',
      title: 'Track Your Drop | TH3EE Order Tracking',
      description: 'Real-time parcel tracking and dispatch status for your TH3EE streetwear order.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/order-tracking`
    },
    {
      dirName: 'loyalty',
      title: 'TH3EE Loyalty Club | Exclusive Patron Privileges',
      description: 'Earn stamps on every drop, unlock tiered rewards, and access VIP releases with the TH3EE Loyalty Club.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/loyalty`
    },
    {
      dirName: 'delivery-partner',
      title: 'Delivery Partner Portal | TH3EE',
      description: 'TH3EE Atelier authorized delivery dispatch and logistics management portal.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/delivery-partner`
    },
    {
      dirName: 'verify-pass',
      title: 'Verify Pass | TH3EE',
      description: 'Verify TH3EE Authenticity Pass and verification tokens.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/verify-pass`
    },
    {
      dirName: 'verify-email',
      title: 'Verify Email | TH3EE',
      description: 'Confirm your TH3EE patron account email address.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/verify-email`
    },
    {
      dirName: 'forgot-password',
      title: 'Reset Password | TH3EE',
      description: 'Recover access to your TH3EE patron account.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/forgot-password`
    },
    {
      dirName: 'reset-password',
      title: 'Set New Password | TH3EE',
      description: 'Choose a new password for your TH3EE patron account.',
      canonicalUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/reset-password`
    }
  ];

  for (const page of dedicatedPages) {
    const tags = generateMetadataTags({
      title: page.title,
      description: page.description,
      imageUrl: `https://${INITIAL_OFFICIAL_DOMAIN}/og-image.png`,
      canonicalUrl: page.canonicalUrl,
      type: 'website'
    });

    const rendered = injectMetadataIntoHtml(baseHtml, tags);

    for (const outDir of targetDirs) {
      if (!fs.existsSync(outDir)) continue;
      const pageDir = path.resolve(outDir, page.dirName);
      fs.mkdirSync(pageDir, { recursive: true });
      fs.writeFileSync(path.resolve(pageDir, 'index.html'), rendered, 'utf-8');
    }
  }

  console.log(`✔ Prerendered ${dedicatedPages.length} dedicated SEO and application entry pages`);

  // Prerender categories & universes
  const collections = [
    { name: 'T-Shirts', slug: 't-shirts', type: 'category' as const },
    { name: 'Hoodies & Sweats', slug: 'hoodies-sweats', type: 'category' as const },
    { name: 'Baahubali Universe', slug: 'baahubali', type: 'universe' as const }
  ];

  for (const col of collections) {
    const canonicalUrl = `https://${INITIAL_OFFICIAL_DOMAIN}/shop/${col.slug}`;
    const title = `${col.name} | TH3EE Premium Archive`;
    const description = `Explore the ${col.name} collection on TH3EE. Refined fabrics, sharp fits, and luxury custom DTF prints made in Tirupati.`;
    const imageUrl = `https://${INITIAL_OFFICIAL_DOMAIN}/og-image.png`;

    const tags = generateMetadataTags({
      title,
      description,
      imageUrl,
      canonicalUrl,
      type: 'website'
    });

    const rendered = injectMetadataIntoHtml(baseHtml, tags);

    for (const outDir of targetDirs) {
      if (!fs.existsSync(outDir)) continue;
      const colDir = path.resolve(outDir, 'shop', col.slug);
      fs.mkdirSync(colDir, { recursive: true });
      fs.writeFileSync(path.resolve(colDir, 'index.html'), rendered, 'utf-8');
    }
  }

  console.log('✔ Prerendered collections and category SEO pages');

  // Generate and sync Sitemap XML to both public/ and dist/
  const sitemapXml = generateSitemapXml();
  fs.writeFileSync(path.resolve(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.resolve(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  }
  console.log('✔ Generated fresh sitemap.xml with all live products and category filters');

  // Ensure all icon and brand assets are synced to dist/
  const staticFilesToSync = [
    'robots.txt',
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'favicon-48x48.png',
    'favicon-96x96.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'logo.png',
    'logo-512.png',
    'og-image.png',
    'favicon.svg',
    'site.webmanifest',
    'manifest.json'
  ];
  for (const file of staticFilesToSync) {
    const srcPath = path.resolve(publicDir, file);
    if (fs.existsSync(srcPath) && fs.existsSync(distDir)) {
      fs.copyFileSync(srcPath, path.resolve(distDir, file));
    }
  }

  // Ensure .well-known exists in dist/
  const wellKnownPublic = path.resolve(publicDir, '.well-known');
  const wellKnownDist = path.resolve(distDir, '.well-known');
  if (fs.existsSync(wellKnownPublic) && fs.existsSync(distDir)) {
    fs.mkdirSync(wellKnownDist, { recursive: true });
    for (const f of fs.readdirSync(wellKnownPublic)) {
      fs.copyFileSync(path.resolve(wellKnownPublic, f), path.resolve(wellKnownDist, f));
    }
  }

  // Generate standalone, branded TH3EE 404.html for Vercel edge error handling
  const custom404Html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#FF3131" />
    <title>404 - Drop Not Found | TH3EE Oversized Streetwear</title>
    <meta name="description" content="This page couldn't be found. Explore the latest TH3EE drops." />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Poppins:wght@400;600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #FAFAFA;
        color: #171717;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .card {
        background: #FFFFFF;
        border: 2px solid #171717;
        max-width: 520px;
        width: 100%;
        padding: 48px 36px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      }
      .badge {
        display: inline-block;
        background: #E51E2B;
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        padding: 4px 12px;
        margin-bottom: 24px;
        font-family: monospace;
      }
      .code {
        font-size: 72px;
        font-weight: 900;
        line-height: 1;
        letter-spacing: -0.05em;
        font-family: 'Montserrat', sans-serif;
        color: #171717;
        margin-bottom: 8px;
      }
      .divider {
        width: 48px;
        height: 4px;
        background: #E51E2B;
        margin: 0 auto 24px auto;
      }
      h1 {
        font-size: 24px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        margin-bottom: 12px;
      }
      p {
        font-size: 14px;
        color: #525252;
        line-height: 1.6;
        margin-bottom: 32px;
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .btn-primary {
        background: #171717;
        color: #FFFFFF;
        padding: 14px 24px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        text-decoration: none;
        transition: background 0.2s;
        font-family: monospace;
        display: block;
      }
      .btn-primary:hover {
        background: #E51E2B;
      }
      .btn-secondary {
        background: #FFFFFF;
        color: #171717;
        border: 1px solid #D4D4D4;
        padding: 12px 24px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        text-decoration: none;
        transition: border-color 0.2s;
        font-family: monospace;
        display: block;
      }
      .btn-secondary:hover {
        border-color: #171717;
      }
      .btn-row {
        display: flex;
        gap: 12px;
      }
      .btn-row > * { flex: 1; }
      @media (max-width: 480px) {
        .card { padding: 32px 20px; }
        .code { font-size: 56px; }
        h1 { font-size: 20px; }
        .btn-row { flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">TH3EE Atelier // Error 404</div>
      <div class="code">404</div>
      <div class="divider"></div>
      <h1>This page couldn't be found.</h1>
      <p>Explore the latest TH3EE drops. The silhouette or page you requested may have moved or been updated.</p>
      <div class="actions">
        <a href="/shop" class="btn-primary">Explore Drops</a>
        <div class="btn-row">
          <a href="/" class="btn-secondary">Return Home</a>
          <a href="/bag" class="btn-secondary">View Bag</a>
        </div>
      </div>
    </div>
  </body>
</html>`;

  fs.writeFileSync(path.resolve(publicDir, '404.html'), custom404Html, 'utf-8');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.resolve(distDir, '404.html'), custom404Html, 'utf-8');
  }
  console.log('✔ Generated branded 404.html page for Vercel edge deployment');

  console.log('✔ Synced SEO, manifest, and security assets to dist');
  console.log('--- TH3EE Social Preview & Sitemap Prerender Complete ---');
}

prerenderAll().catch((err) => {
  console.error('Prerender error:', err);
  process.exit(1);
});

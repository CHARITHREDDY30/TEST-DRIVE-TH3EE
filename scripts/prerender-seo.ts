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
    <meta property="og:site_name" content="TH3EE Streetwear" />
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
  xml += `  <url>\n    <loc>${domain}/track-order</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;

  // Category and Universe filters
  const categories = ['T-Shirts', 'Hoodies & Sweats'];
  for (const cat of categories) {
    xml += `  <url>\n    <loc>${domain}/shop?category=${encodeURIComponent(cat)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  for (const univ of INITIAL_UNIVERSE_CATEGORIES) {
    xml += `  <url>\n    <loc>${domain}/shop?universe=${encodeURIComponent(univ.id)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

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
    const title = `${product.name} — TH3EE Streetwear`;
    const description = `Check out "${product.name}" at TH3EE! Heavyweight 240+ GSM graphic drop · ₹${price}. ${product.description || 'Limited edition archive streetwear.'}`;

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

  // Prerender categories & universes
  const collections = [
    { name: 'T-Shirts', slug: 't-shirts', type: 'category' as const },
    { name: 'Hoodies & Sweats', slug: 'hoodies-sweats', type: 'category' as const },
    { name: 'Baahubali Universe', slug: 'baahubali', type: 'universe' as const }
  ];

  for (const col of collections) {
    const canonicalUrl = `https://${INITIAL_OFFICIAL_DOMAIN}/shop?${col.type}=${encodeURIComponent(col.name)}`;
    const title = `${col.name} — TH3EE Heavyweight Archive`;
    const description = `Explore the ${col.name} collection on TH3EE Streetwear. Heavyweight drops and graphic oversized silhouettes.`;
    const imageUrl = resolveProductImageUrl(INITIAL_MASTER_PRODUCTS[0]?.images?.[0] || '');

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

  // Ensure security.txt and robots.txt are in dist/
  const staticFilesToSync = ['robots.txt', 'favicon.svg', 'site.webmanifest', 'manifest.json'];
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

  console.log('✔ Synced SEO, manifest, and security assets to dist');
  console.log('--- TH3EE Social Preview & Sitemap Prerender Complete ---');
}

prerenderAll().catch((err) => {
  console.error('Prerender error:', err);
  process.exit(1);
});

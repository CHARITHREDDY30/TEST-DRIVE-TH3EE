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
}): string {
  const { title, description, imageUrl, canonicalUrl, type = 'product', price } = params;
  const escapedTitle = escapeHtml(title);
  const escapedDesc = escapeHtml(description);
  const escapedUrl = escapeHtml(canonicalUrl);
  const escapedImg = escapeHtml(imageUrl);

  let tags = `
    <!-- Base URL for absolute asset resolution on subroutes -->
    <!-- <base href="/" /> -->
    <script type="text/javascript">
      (function(l) {
        var p = l.pathname || '/';
        var m = p.match(/^(\/[^\/]+)/);
        var isTest = m && m[1].toLowerCase() === '/test-drive-th3ee';
        var b = isTest ? m[1] + '/' : '/';
        document.write('<base href="' + b + '">');
      }(window.location));
    </script>

    <!-- Dynamic Social Preview Metadata by TH3EE Prerender Engine -->
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

  return tags;
}

function injectMetadataIntoHtml(baseHtml: string, metadataTags: string): string {
  // Remove existing title and description if present to avoid duplication
  let html = baseHtml
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?>/i, '');

  // Inject right before </head>
  return html.replace('</head>', `${metadataTags}\n  </head>`);
}

async function prerenderAll() {
  console.log('--- Starting TH3EE Social Preview Prerender ---');

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
      price
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

  console.log(`✔ Prerendered ${productCount} product pages with rich Open Graph & Twitter cards`);

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
  console.log('--- TH3EE Social Preview Prerender Complete ---');
}

prerenderAll().catch((err) => {
  console.error('Prerender error:', err);
  process.exit(1);
});

import { createClient } from 'npm:@insforge/sdk';

export default async function(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || url.searchParams.get('id');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!slug) {
    return new Response('Missing product slug parameter', { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });
  }

  try {
    const client = createClient({
      baseUrl: Deno.env.get('INSFORGE_BASE_URL') || 'https://28fmr484.ap-southeast.insforge.app',
      anonKey: Deno.env.get('INSFORGE_ANON_KEY') || ''
    });

    // Query product from database
    const { data: product } = await client.database
      .from('products')
      .select('id, name, slug, price, original_price, description, category, subcategory, badge, images')
      .or(`slug.eq.${slug},sku.eq.${slug}`)
      .maybeSingle();

    const productName = product?.name || 'TH3EE Streetwear';
    const productPrice = product?.price ? Math.round(Number(product.price)) : 499;
    const productDesc = product?.description || `Check out "${productName}" on TH3EE! Heavyweight 240+ GSM graphic streetwear drop · ₹${productPrice}.`;
    const productSlug = product?.slug || slug;
    const targetUrl = `https://th3ee.in/products/${encodeURIComponent(productSlug)}`;

    // Resolve public image
    let imageUrl = 'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/1_20261016_140131_0000.jpg';
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0];
      imageUrl = first.startsWith('http') ? first : `https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/${first.replace(/^\/+/, '')}`;
    }

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(productName)} — TH3EE Streetwear</title>
  <meta name="description" content="${escapeXml(productDesc)}" />
  <link rel="canonical" href="${targetUrl}" />

  <!-- Open Graph / WhatsApp / Facebook / Telegram -->
  <meta property="og:site_name" content="TH3EE Streetwear" />
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escapeXml(productName)} — TH3EE Streetwear" />
  <meta property="og:description" content="${escapeXml(productDesc)}" />
  <meta property="og:url" content="${targetUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:alt" content="${escapeXml(productName)}" />
  <meta property="product:price:amount" content="${productPrice}" />
  <meta property="product:price:currency" content="INR" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@th3ee_in" />
  <meta name="twitter:title" content="${escapeXml(productName)} — TH3EE Streetwear" />
  <meta name="twitter:description" content="${escapeXml(productDesc)}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <!-- Redirect non-bot browsers to live storefront product page -->
  <meta http-equiv="refresh" content="0;url=${targetUrl}" />
  <script type="text/javascript">
    window.location.replace("${targetUrl}");
  </script>
</head>
<body>
  <p>Redirecting to <a href="${targetUrl}">${escapeXml(productName)} on TH3EE Streetwear</a>...</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
      }
    });
  } catch (err: any) {
    return new Response(`Social preview generator error: ${err?.message || err}`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

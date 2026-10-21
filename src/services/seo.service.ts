import type { Product } from '../types/store';
import { getProductShareImage, getCanonicalProductUrl, OFFICIAL_SITE_DOMAIN } from '../lib/share';

function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let element = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalLink(href: string) {
  if (typeof document === 'undefined') return;
  let element = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function setJsonLd(id: string, data: object | null) {
  if (typeof document === 'undefined') return;
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!data) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}


export const seoService = {
  /**
   * Dynamically sets Open Graph and Twitter Card tags for a specific product.
   */
  setProductSEO(product: Product, brandDomain: string = OFFICIAL_SITE_DOMAIN) {
    if (typeof document === 'undefined' || !product) return;

    const title = `${product.name} — TH3EE Streetwear`;
    const price = Math.round(Number(product.price));
    const description = `Check out "${product.name}" on TH3EE! Heavyweight 240+ GSM graphic drop · ₹${price}. ${product.description || 'Limited edition archive streetwear.'}`;
    const canonicalUrl = getCanonicalProductUrl(product, brandDomain);
    const imageUrl = getProductShareImage(product);

    document.title = title;

    // Standard Open Graph tags
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:site_name', 'TH3EE Streetwear');
    setMetaTag('property', 'og:type', 'product');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', imageUrl);
    setMetaTag('property', 'og:image:secure_url', imageUrl);
    setMetaTag('property', 'og:image:alt', product.name);
    setMetaTag('property', 'product:price:amount', String(price));
    setMetaTag('property', 'product:price:currency', 'INR');

    // Twitter / X Large Image Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:site', '@th3ee_in');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', imageUrl);

    setCanonicalLink(canonicalUrl);

    // Dynamic Product & Breadcrumb Schema.org Structured Data
    setJsonLd('th3ee-client-product-jsonld', {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          "name": product.name,
          "image": [imageUrl],
          "description": description,
          "sku": product.sku || product.id,
          "brand": {
            "@type": "Brand",
            "name": "TH3EE"
          },
          "offers": {
            "@type": "Offer",
            "url": canonicalUrl,
            "priceCurrency": "INR",
            "price": price,
            "availability": product.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "TH3EE"
            }
          }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": `https://${brandDomain}/`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Shop",
              "item": `https://${brandDomain}/shop`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": product.name,
              "item": canonicalUrl
            }
          ]
        }
      ]
    });
  },


  /**
   * Dynamically sets Open Graph and Twitter Card tags for a collection or category page.
   */
  setCollectionSEO(collectionTitle: string, description?: string, brandDomain: string = OFFICIAL_SITE_DOMAIN) {
    if (typeof document === 'undefined') return;

    const title = `${collectionTitle} — TH3EE Streetwear Archive`;
    const desc = description || `Explore the ${collectionTitle} collection on TH3EE Streetwear. Premium heavyweight drops, graphic oversized tees, and limited pieces.`;
    const canonicalUrl = `https://${brandDomain}/shop?category=${encodeURIComponent(collectionTitle)}`;

    document.title = title;

    setMetaTag('name', 'description', desc);
    setMetaTag('property', 'og:site_name', 'TH3EE Streetwear');
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', desc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', desc);

    setCanonicalLink(canonicalUrl);
  },

  /**
   * Resets SEO back to default storefront metadata.
   */
  setDefaultSEO(brandDomain: string = OFFICIAL_SITE_DOMAIN) {
    if (typeof document === 'undefined') return;

    const title = 'TH3EE — Heavyweight Streetwear & Drops';
    const description = 'TH3EE — heavyweight 240+ GSM graphic oversized tees, Baahubali universe drops, and limited edition cult streetwear.';
    const canonicalUrl = `https://${brandDomain}/`;

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:site_name', 'TH3EE Streetwear');
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    setCanonicalLink(canonicalUrl);
    setJsonLd('th3ee-client-product-jsonld', null);
  }
};


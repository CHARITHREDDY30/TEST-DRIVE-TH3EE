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
  setCollectionSEO(collectionTitle?: string, description?: string, brandDomain: string = OFFICIAL_SITE_DOMAIN) {
    if (typeof document === 'undefined') return;

    const isGeneralShop = !collectionTitle || collectionTitle === 'All Streetwear Drops' || collectionTitle === 'Shop';
    const title = isGeneralShop ? 'Shop Premium T-Shirts | TH3EE' : `${collectionTitle} | TH3EE Premium Streetwear`;
    const desc = isGeneralShop 
      ? "Explore TH3EE's luxury T-shirt collection. Elevated fits, soft-touch fabrics and understated design for those who dress with intent."
      : (description || `Explore ${collectionTitle} on TH3EE. Premium luxury T-shirts and custom drops crafted in Tirupati.`);
    const canonicalUrl = isGeneralShop 
      ? `https://${brandDomain}/shop`
      : `https://${brandDomain}/shop?category=${encodeURIComponent(collectionTitle)}`;

    document.title = title;

    setMetaTag('name', 'description', desc);
    setMetaTag('property', 'og:site_name', 'TH3EE');
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', desc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', `https://${brandDomain}/og-image.png`);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', desc);
    setMetaTag('name', 'twitter:image', `https://${brandDomain}/og-image.png`);

    setCanonicalLink(canonicalUrl);
  },

  /**
   * Sets SEO for Custom DTF page.
   */
  setCustomDtfSEO(brandDomain: string = OFFICIAL_SITE_DOMAIN) {
    if (typeof document === 'undefined') return;

    const title = 'Custom DTF Printed T-Shirts | TH3EE Tirupati';
    const desc = 'Design your own premium T-shirt with TH3EE. High-definition DTF printing, rich colour and a lasting finish on quality fabric, made in Tirupati.';
    const canonicalUrl = `https://${brandDomain}/custom-dtf`;

    document.title = title;
    setMetaTag('name', 'description', desc);
    setMetaTag('property', 'og:site_name', 'TH3EE');
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', desc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', `https://${brandDomain}/og-image.png`);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', desc);
    setMetaTag('name', 'twitter:image', `https://${brandDomain}/og-image.png`);

    setCanonicalLink(canonicalUrl);
  },

  /**
   * Sets SEO for About page.
   */
  setAboutSEO(brandDomain: string = OFFICIAL_SITE_DOMAIN) {
    if (typeof document === 'undefined') return;

    const title = 'About TH3EE | Luxury Clothing from Tirupati';
    const desc = "TH3EE is built on precision, restraint and craft. Discover the story behind Tirupati's luxury T-shirt label and the philosophy behind every piece.";
    const canonicalUrl = `https://${brandDomain}/about`;

    document.title = title;
    setMetaTag('name', 'description', desc);
    setMetaTag('property', 'og:site_name', 'TH3EE');
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', desc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', `https://${brandDomain}/og-image.png`);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', desc);
    setMetaTag('name', 'twitter:image', `https://${brandDomain}/og-image.png`);

    setCanonicalLink(canonicalUrl);
  },

  /**
   * Resets SEO back to default storefront metadata (Homepage).
   */
  setDefaultSEO(brandDomain: string = OFFICIAL_SITE_DOMAIN) {
    if (typeof document === 'undefined') return;

    const title = 'TH3EE | Oversized T-Shirts & Streetwear';
    const description = 'Discover TH3EE streetwear — oversized graphic T-shirts and hoodies designed for everyday self-expression. Shop the latest drops at th3ee.in.';
    const canonicalUrl = `https://${brandDomain}/`;

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:site_name', 'TH3EE');
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', `https://${brandDomain}/og-image.png`);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', `https://${brandDomain}/og-image.png`);

    setCanonicalLink(canonicalUrl);
    setJsonLd('th3ee-client-product-jsonld', null);
  }
};


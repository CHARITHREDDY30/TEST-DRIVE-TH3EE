import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@insforge/sdk';
import {
  INITIAL_UNIVERSE_CATEGORIES,
  INITIAL_MASTER_PRODUCTS,
  INITIAL_HERO_SLIDES,
  INITIAL_STORE_BRAND
} from '../src/data/initialCatalog';
import { resolveProductImageUrl } from '../src/lib/r2';

const TH3EE_NAMESPACE = 'd79f01e2-5b9c-4e89-a567-3c81e8b94001';

export function uuidv5(name: string, namespace = TH3EE_NAMESPACE): string {
  const nsBuffer = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const nameBuffer = Buffer.from(name, 'utf8');
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBuffer, nameBuffer])).digest();

  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const hex = hash.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}

function getInsForgeAdminClient() {
  const projPath = path.resolve(process.cwd(), '.insforge', 'project.json');
  if (!fs.existsSync(projPath)) {
    throw new Error('Missing .insforge/project.json configuration file');
  }
  const proj = JSON.parse(fs.readFileSync(projPath, 'utf8'));
  return createClient({
    baseUrl: proj.oss_host,
    anonKey: proj.api_key
  });
}

export function prepareCatalogData() {
  const categories: any[] = [];
  const products: any[] = [];
  const variants: any[] = [];
  const heroSlides: any[] = [];
  const storeSettings: any[] = [];
  const categoryIdMap = new Map<string, string>();

  // 1. Categories
  for (let i = 0; i < INITIAL_UNIVERSE_CATEGORIES.length; i++) {
    const uCat = INITIAL_UNIVERSE_CATEGORIES[i];
    const catId = uuidv5(`category:${uCat.id}`);
    categoryIdMap.set(uCat.id, catId);

    categories.push({
      id: catId,
      name: uCat.title,
      slug: uCat.id,
      description: uCat.subtitle,
      image_url: uCat.image,
      parent_id: null,
      sort_order: i + 1,
      is_active: true
    });

    if (Array.isArray(uCat.subcategories)) {
      for (let sIdx = 0; sIdx < uCat.subcategories.length; sIdx++) {
        const sub = uCat.subcategories[sIdx];
        const subSlug = `${uCat.id}-${sub.code.toLowerCase()}`;
        const subId = uuidv5(`category:${subSlug}`);

        categories.push({
          id: subId,
          name: sub.name,
          slug: subSlug,
          description: `Subcategory of ${uCat.title}`,
          image_url: null,
          parent_id: catId,
          sort_order: sIdx + 1,
          is_active: true
        });
      }
    }
  }

  // 2. Products and Variants
  for (const prod of INITIAL_MASTER_PRODUCTS) {
    const prodId = uuidv5(`product:${prod.id}`);
    const catId = categoryIdMap.get(prod.universeId) || null;
    const gsmNum = parseInt(String(prod.gsm || '0').replace(/[^0-9]/g, ''), 10) || null;

    const resolvedImages = (prod.images || []).map(img => resolveProductImageUrl(img));
    const primaryImage = resolvedImages[0] || resolveProductImageUrl(null);

    const resolvedColors = (prod.colors || []).map(c => ({
      name: c.name,
      hex: c.hex,
      images: (c.images || []).map(img => resolveProductImageUrl(img))
    }));

    products.push({
      id: prodId,
      legacy_id: prod.id,
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      category_id: catId,
      category: prod.category,
      subcategory: prod.subcategory,
      universe_id: prod.universeId,
      selling_price: prod.price,
      original_price: prod.originalPrice || prod.price,
      gsm: gsmNum,
      fabric: prod.fabric,
      fit: prod.fit,
      image: primaryImage,
      image_url: primaryImage,
      image_urls: resolvedImages,
      sizes: prod.availableSizes,
      colors: resolvedColors,
      available_sizes: prod.availableSizes,
      specifications: prod.specs || [],
      specs: prod.specs || [],
      care: prod.care || [],
      badge: prod.badge || null,
      rating: prod.rating || 5.0,
      reviews_count: prod.reviewsCount || 0,
      in_stock: Boolean(prod.inStock),
      is_published: true
    });

    // Variants with strict inventory preservation (no invented numbers)
    const inventory = prod.inventory || {};
    for (const color of prod.colors || []) {
      const colorInv = inventory[color.name] || {};
      for (const size of prod.availableSizes || ['S', 'M', 'L', 'XL', 'XXL']) {
        const colorSlug = color.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const sku = `${prod.id}-${colorSlug}-${size.toLowerCase()}`;
        const variantId = uuidv5(`variant:${sku}`);

        let qty = 0;
        if (colorInv[size] !== undefined && colorInv[size] !== null) {
          const parsed = parseInt(String(colorInv[size]), 10);
          qty = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
        }

        variants.push({
          id: variantId,
          product_id: prodId,
          sku,
          size,
          color_name: color.name,
          color_code: color.hex,
          stock_quantity: qty,
          is_active: true
        });
      }
    }
  }

  // 3. Hero Slides
  for (let hIdx = 0; hIdx < INITIAL_HERO_SLIDES.length; hIdx++) {
    const slide = INITIAL_HERO_SLIDES[hIdx];
    const slideId = uuidv5(`hero_slide:${slide.id}`);
    const resolvedSlideImg = resolveProductImageUrl(slide.image);

    heroSlides.push({
      id: slideId,
      title: slide.title,
      subtitle: slide.highlight ? `${slide.highlight} • ${slide.desc}` : slide.desc,
      image_url: resolvedSlideImg,
      mobile_image_url: resolvedSlideImg,
      target_url: slide.target,
      sort_order: hIdx + 1,
      is_active: true
    });
  }

  // 4. Store Settings
  const brandSettingsId = uuidv5('setting:store_brand');
  storeSettings.push({
    id: brandSettingsId,
    setting_key: 'store_brand',
    setting_value: INITIAL_STORE_BRAND,
    is_public: true
  });

  const stackingSettingsId = uuidv5('setting:coupon_stacking');
  storeSettings.push({
    id: stackingSettingsId,
    setting_key: 'coupon_stacking',
    setting_value: { allow_stacking: false },
    is_public: false
  });

  return { categories, products, variants, heroSlides, storeSettings };
}

async function run() {
  const isApply = process.argv.includes('--apply');
  console.log('===========================================================');
  console.log(`TH3EE CATALOG MIGRATION - Mode: ${isApply ? 'APPLY (ACTIVE)' : 'DRY-RUN (VALIDATE ONLY)'}`);
  console.log('===========================================================');

  const insforge = getInsForgeAdminClient();
  const catalog = prepareCatalogData();

  console.log('\n--- 1. Prepared Catalog Overview ---');
  console.log(`Categories     : ${catalog.categories.length}`);
  console.log(`Products       : ${catalog.products.length}`);
  console.log(`Variants       : ${catalog.variants.length}`);
  console.log(`Hero Slides    : ${catalog.heroSlides.length}`);
  console.log(`Store Settings : ${catalog.storeSettings.length}`);

  // 2. Fetch existing records to ensure strict non-destructive insertion
  console.log('\n--- 2. Checking Existing Database Records ---');
  const { data: existingCats } = await insforge.database.from('categories').select('slug');
  const { data: existingProds } = await insforge.database.from('products').select('slug');
  const { data: existingVariants } = await insforge.database.from('product_variants').select('product_id, size, color_name');
  const { data: existingSlides } = await insforge.database.from('hero_slides').select('id');
  const { data: existingSettings } = await insforge.database.from('store_settings').select('setting_key');

  const existingCatSlugs = new Set((existingCats || []).map((c: any) => c.slug));
  const existingProdSlugs = new Set((existingProds || []).map((p: any) => p.slug));
  const existingVariantKeys = new Set((existingVariants || []).map((v: any) => `${v.product_id}:${v.size}:${v.color_name}`));
  const existingSlideIds = new Set((existingSlides || []).map((s: any) => s.id));
  const existingSettingKeys = new Set((existingSettings || []).map((s: any) => s.setting_key));

  console.log(`Existing Categories in DB     : ${existingCatSlugs.size}`);
  console.log(`Existing Products in DB       : ${existingProdSlugs.size}`);
  console.log(`Existing Variants in DB       : ${existingVariantKeys.size}`);
  console.log(`Existing Hero Slides in DB    : ${existingSlideIds.size}`);
  console.log(`Existing Store Settings in DB : ${existingSettingKeys.size}`);

  // Filter only records that do NOT exist yet
  const toInsertCats = catalog.categories.filter(c => !existingCatSlugs.has(c.slug));
  const toInsertProds = catalog.products.filter(p => !existingProdSlugs.has(p.slug));
  const toInsertVariants = catalog.variants.filter(v => !existingVariantKeys.has(`${v.product_id}:${v.size}:${v.color_name}`));
  const toInsertSlides = catalog.heroSlides.filter(s => !existingSlideIds.has(s.id));
  const toInsertSettings = catalog.storeSettings.filter(s => !existingSettingKeys.has(s.setting_key));

  console.log('\n--- 3. Planned New Records to Insert ---');
  console.log(`New Categories to Insert     : ${toInsertCats.length}`);
  console.log(`New Products to Insert       : ${toInsertProds.length}`);
  console.log(`New Variants to Insert       : ${toInsertVariants.length}`);
  console.log(`New Hero Slides to Insert    : ${toInsertSlides.length}`);
  console.log(`New Store Settings to Insert : ${toInsertSettings.length}`);

  if (!isApply) {
    console.log('\n>>> DRY-RUN COMPLETE: 0 database writes executed.');
    console.log('>>> All existing rows will be preserved untouched.');
    console.log('>>> Execute with --apply to perform insertion.');
    return;
  }

  console.log('\n--- 4. Applying Inserts via InsForge SDK ---');

  // Insert Categories
  if (toInsertCats.length > 0) {
    console.log(`Inserting ${toInsertCats.length} categories...`);
    const { error: catErr } = await insforge.database.from('categories').insert(toInsertCats);
    if (catErr) throw new Error(`Categories insert failed: ${catErr.message}`);
    console.log('✓ Categories inserted successfully.');
  }

  // Insert Products
  if (toInsertProds.length > 0) {
    console.log(`Inserting ${toInsertProds.length} products...`);
    const { error: prodErr } = await insforge.database.from('products').insert(toInsertProds);
    if (prodErr) throw new Error(`Products insert failed: ${prodErr.message}`);
    console.log('✓ Products inserted successfully.');
  }

  // Insert Variants in batches of 20
  if (toInsertVariants.length > 0) {
    console.log(`Inserting ${toInsertVariants.length} product variants...`);
    for (let i = 0; i < toInsertVariants.length; i += 20) {
      const batch = toInsertVariants.slice(i, i + 20);
      const { error: varErr } = await insforge.database.from('product_variants').insert(batch);
      if (varErr) throw new Error(`Variants insert failed: ${varErr.message}`);
    }
    console.log('✓ Product variants inserted successfully.');
  }

  // Insert Hero Slides
  if (toInsertSlides.length > 0) {
    console.log(`Inserting ${toInsertSlides.length} hero slides...`);
    const { error: slideErr } = await insforge.database.from('hero_slides').insert(toInsertSlides);
    if (slideErr) throw new Error(`Hero slides insert failed: ${slideErr.message}`);
    console.log('✓ Hero slides inserted successfully.');
  }

  // Insert Store Settings
  if (toInsertSettings.length > 0) {
    console.log(`Inserting ${toInsertSettings.length} store settings...`);
    const { error: setErr } = await insforge.database.from('store_settings').insert(toInsertSettings);
    if (setErr) throw new Error(`Store settings insert failed: ${setErr.message}`);
    console.log('✓ Store settings inserted successfully.');
  }

  console.log('\n--- 5. Final Database Verification ---');
  const { count: finalCatCount } = await insforge.database.from('categories').select('*', { count: 'exact', head: true });
  const { count: finalProdCount } = await insforge.database.from('products').select('*', { count: 'exact', head: true });
  const { count: finalVarCount } = await insforge.database.from('product_variants').select('*', { count: 'exact', head: true });
  const { count: finalSlideCount } = await insforge.database.from('hero_slides').select('*', { count: 'exact', head: true });
  const { count: finalSetCount } = await insforge.database.from('store_settings').select('*', { count: 'exact', head: true });

  console.log(`Final Categories Count     : ${finalCatCount}`);
  console.log(`Final Products Count       : ${finalProdCount}`);
  console.log(`Final Variants Count       : ${finalVarCount}`);
  console.log(`Final Hero Slides Count    : ${finalSlideCount}`);
  console.log(`Final Store Settings Count : ${finalSetCount}`);

  // Fetch sample product
  const { data: sampleProduct } = await insforge.database
    .from('products')
    .select('id, legacy_id, name, slug, selling_price, original_price, universe_id')
    .limit(1)
    .single();
  console.log('\nSample Product in DB:');
  console.log(JSON.stringify(sampleProduct, null, 2));

  console.log('\n✓ TH3EE CATALOG MIGRATION COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('\nFATAL ERROR during catalog migration:', err?.message || err);
  process.exit(1);
});

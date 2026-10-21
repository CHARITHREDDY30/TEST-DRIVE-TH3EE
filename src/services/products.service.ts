import type { Product } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { INITIAL_MASTER_PRODUCTS } from '../data/initialCatalog';
import { mapDbProductToFrontend, mapFrontendProductToDb } from './mappers';

export const productsService = {
  async getProducts(): Promise<Product[]> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('products')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(mapDbProductToFrontend);
        }
        if (error) {
          console.warn('InsForge products fetch failed; using baseline catalog:', error);
        }
      } catch (err) {
        console.warn('InsForge products fetch failed; using baseline catalog:', err);
      }
    }
    return INITIAL_MASTER_PRODUCTS;
  },

  async getProductBySlug(rawSlug: string): Promise<Product | null> {
    if (!rawSlug) return null;
    const cleanSlug = rawSlug.trim().toLowerCase().replace(/[\s_]+/g, '-');

    if (isInsForgeConfigured()) {
      try {
        // Query by exact match on slug, sanitized slug, legacy_id, or UUID id
        const { data, error } = await insforge.database
          .from('products')
          .select('*')
          .or(`slug.eq.${cleanSlug},slug.eq.${rawSlug},legacy_id.eq.${rawSlug},id.eq.${rawSlug}`)
          .maybeSingle();

        if (!error && data) {
          return mapDbProductToFrontend(data);
        }

        // Secondary fallback: case-insensitive name match if slug didn't match directly
        const cleanNameQuery = rawSlug.replace(/[-_]/g, ' ').trim();
        if (cleanNameQuery) {
          const { data: byName } = await insforge.database
            .from('products')
            .select('*')
            .ilike('name', `%${cleanNameQuery}%`)
            .limit(1);

          if (byName && byName.length > 0) {
            return mapDbProductToFrontend(byName[0]);
          }
        }
      } catch (err) {
        console.warn('InsForge single product query failed:', err);
      }
    }

    const normTarget = cleanSlug;
    const found = INITIAL_MASTER_PRODUCTS.find(p => 
      p.slug.toLowerCase().replace(/[\s_]+/g, '-') === normTarget ||
      p.slug === rawSlug ||
      p.sku === rawSlug ||
      String(p.id) === rawSlug ||
      (p.name && p.name.toLowerCase().replace(/[\s_]+/g, '-') === normTarget)
    );
    return found || null;
  },

  async saveProduct(product: Product): Promise<Product> {
    if (isInsForgeConfigured()) {
      try {
        // Check if product already exists to preserve primary UUID
        const { data: existing } = await insforge.database
          .from('products')
          .select('id')
          .or(`slug.eq.${product.slug},legacy_id.eq.${product.id}`)
          .maybeSingle();

        const dbPayload = mapFrontendProductToDb(product, existing?.id);

        const { data, error } = await insforge.database
          .from('products')
          .upsert([dbPayload], { onConflict: 'slug' })
          .select()
          .single();

        if (!error && data) {
          return mapDbProductToFrontend(data);
        }
        if (error) {
          throw new Error(error.message || 'Failed to save product in InsForge');
        }
      } catch (err) {
        console.error('Failed to persist product to InsForge:', err);
        throw err;
      }
    }
    return product;
  },

  async deleteProduct(productId: string): Promise<boolean> {
    if (isInsForgeConfigured()) {
      try {
        // Match either by UUID id or legacy_id
        const { error } = await insforge.database
          .from('products')
          .delete()
          .or(`id.eq.${productId},legacy_id.eq.${productId}`);

        if (error) {
          throw new Error(error.message || 'Failed to delete product in InsForge');
        }
        return true;
      } catch (err) {
        console.error('Failed to delete product in InsForge:', err);
        throw err;
      }
    }
    return true;
  }
};

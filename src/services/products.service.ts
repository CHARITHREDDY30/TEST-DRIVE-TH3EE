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

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('products')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!error && data) {
          return mapDbProductToFrontend(data);
        }
      } catch (err) {
        console.warn('InsForge single product query failed:', err);
      }
    }
    const found = INITIAL_MASTER_PRODUCTS.find(p => p.slug === slug);
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

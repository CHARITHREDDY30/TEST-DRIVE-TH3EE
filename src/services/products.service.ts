import type { Product } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { INITIAL_MASTER_PRODUCTS } from '../data/initialCatalog';

export const productsService = {
  async getProducts(): Promise<Product[]> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('products')
          .select('*');

        if (!error && Array.isArray(data) && data.length > 0) {
          return data as Product[];
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
          return data as Product;
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
        const { data, error } = await insforge.database
          .from('products')
          .upsert(product)
          .select()
          .single();

        if (!error && data) {
          return data as Product;
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
        const { error } = await insforge.database
          .from('products')
          .delete()
          .eq('id', productId);

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

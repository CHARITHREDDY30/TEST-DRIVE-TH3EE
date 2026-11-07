import type { ProductSizeChart, GarmentMeasurementEntry } from '../types/sizing';
import type { Product } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import {
  DEFAULT_SIZE_CHART_TEMPLATES,
  getBaselineSizeChartForProduct
} from '../data/defaultSizeCharts';

const LOCAL_STORAGE_SIZE_CHARTS_KEY = 'th3ee_custom_size_charts_v1';
const STORE_SETTINGS_KEY = 'product_size_charts';

function getLocalSizeCharts(): Record<string, ProductSizeChart> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SIZE_CHARTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('Failed reading local size charts:', err);
  }
  return {};
}

function setLocalSizeCharts(charts: Record<string, ProductSizeChart>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SIZE_CHARTS_KEY, JSON.stringify(charts));
  } catch (err) {
    console.warn('Failed writing local size charts:', err);
  }
}

export const sizingService = {
  /**
   * Loads all product size charts from InsForge database (or cached localStorage).
   */
  async getAllSizeCharts(): Promise<Record<string, ProductSizeChart>> {
    const local = getLocalSizeCharts();

    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', STORE_SETTINGS_KEY)
          .maybeSingle();

        if (!error && data && data.setting_value) {
          const remoteCharts: Record<string, ProductSizeChart> = data.setting_value;
          const merged = { ...local, ...remoteCharts };
          setLocalSizeCharts(merged);
          return merged;
        }
      } catch (err) {
        console.warn('InsForge size charts fetch notice:', err);
      }
    }

    return local;
  },

  /**
   * Resolves the authoritative size chart for a specific product.
   * Priority:
   * 1. Product-specific custom chart stored in backend by productId or slug
   * 2. Category / Silhouette baseline chart
   */
  async getSizeChartForProduct(product: Partial<Product>): Promise<ProductSizeChart> {
    const allCharts = await this.getAllSizeCharts();

    if (product.id && allCharts[product.id]) {
      return allCharts[product.id];
    }

    if (product.slug && allCharts[product.slug]) {
      return allCharts[product.slug];
    }

    return getBaselineSizeChartForProduct(product);
  },

  /**
   * Synchronous helper for instant initial rendering while network syncs.
   */
  getSizeChartForProductSync(product: Partial<Product>): ProductSizeChart {
    const local = getLocalSizeCharts();

    if (product.id && local[product.id]) {
      return local[product.id];
    }

    if (product.slug && local[product.slug]) {
      return local[product.slug];
    }

    return getBaselineSizeChartForProduct(product);
  },

  /**
   * Admin method: saves or updates a product-specific size chart to InsForge backend.
   */
  async saveProductSizeChart(chart: ProductSizeChart): Promise<ProductSizeChart> {
    const chartToSave: ProductSizeChart = {
      ...chart,
      updatedAt: new Date().toISOString()
    };

    const currentLocal = getLocalSizeCharts();
    const updatedCharts = {
      ...currentLocal,
      [chart.productId]: chartToSave
    };

    setLocalSizeCharts(updatedCharts);

    if (isInsForgeConfigured()) {
      try {
        const payload = [{
          setting_key: STORE_SETTINGS_KEY,
          setting_value: updatedCharts,
          is_public: true,
          updated_at: new Date().toISOString()
        }];

        const { error } = await insforge.database
          .from('store_settings')
          .upsert(payload, { onConflict: 'setting_key' });

        if (error) {
          console.warn('InsForge store_settings size charts upsert warning:', error.message);
        }
      } catch (err) {
        console.error('Failed saving size chart to InsForge:', err);
        throw err;
      }
    }

    return chartToSave;
  },

  /**
   * Admin method: deletes a custom product size chart, reverting it back to baseline factory specs.
   */
  async deleteProductSizeChart(productId: string): Promise<boolean> {
    const currentLocal = getLocalSizeCharts();
    delete currentLocal[productId];
    setLocalSizeCharts(currentLocal);

    if (isInsForgeConfigured()) {
      try {
        const payload = [{
          setting_key: STORE_SETTINGS_KEY,
          setting_value: currentLocal,
          is_public: true,
          updated_at: new Date().toISOString()
        }];

        await insforge.database
          .from('store_settings')
          .upsert(payload, { onConflict: 'setting_key' });
      } catch (err) {
        console.warn('Failed syncing delete to InsForge:', err);
      }
    }

    return true;
  },

  /**
   * Returns list of built-in factory templates (Oversized Tee, Regular Tee, Boxy Tee, Hoodie).
   */
  getDefaultTemplates(): Record<string, ProductSizeChart> {
    return DEFAULT_SIZE_CHART_TEMPLATES;
  }
};


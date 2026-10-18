import type { StoreBrandConfig } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { INITIAL_STORE_BRAND } from '../data/initialCatalog';

export const settingsService = {
  async getStoreBrandConfig(): Promise<StoreBrandConfig> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('store_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return {
            domain: data.domain || INITIAL_STORE_BRAND.domain,
            whatsappPhone: data.whatsapp_phone || data.whatsappPhone || INITIAL_STORE_BRAND.whatsappPhone,
            whatsappDisplay: data.whatsapp_display || data.whatsappDisplay || INITIAL_STORE_BRAND.whatsappDisplay,
            freeShippingLimit: Number(data.free_shipping_limit || data.freeShippingLimit) || INITIAL_STORE_BRAND.freeShippingLimit,
            announcementText: data.announcement_text || data.announcementText || INITIAL_STORE_BRAND.announcementText
          };
        }
      } catch (err) {
        console.warn('InsForge store_settings query error:', err);
      }
    }
    return INITIAL_STORE_BRAND;
  },

  async saveStoreBrandConfig(config: StoreBrandConfig): Promise<StoreBrandConfig> {
    if (isInsForgeConfigured()) {
      try {
        const payload = {
          id: 'primary',
          domain: config.domain,
          whatsapp_phone: config.whatsappPhone,
          whatsapp_display: config.whatsappDisplay,
          free_shipping_limit: config.freeShippingLimit,
          announcement_text: config.announcementText,
          updated_at: new Date().toISOString()
        };

        const { error } = await insforge.database
          .from('store_settings')
          .upsert(payload);

        if (error) {
          throw new Error(error.message || 'Failed to save store brand settings');
        }
      } catch (err) {
        console.error('Failed to save store settings in InsForge:', err);
        throw err;
      }
    }
    return config;
  }
};

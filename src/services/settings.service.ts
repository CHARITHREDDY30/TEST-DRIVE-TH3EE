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
          .eq('setting_key', 'store_brand')
          .maybeSingle();

        if (!error && data && data.setting_value) {
          const val = data.setting_value;
          return {
            domain: val.domain || INITIAL_STORE_BRAND.domain,
            whatsappPhone: val.whatsappPhone || val.whatsapp_phone || INITIAL_STORE_BRAND.whatsappPhone,
            whatsappDisplay: val.whatsappDisplay || val.whatsapp_display || INITIAL_STORE_BRAND.whatsappDisplay,
            freeShippingLimit: Number(val.freeShippingLimit || val.free_shipping_limit) || INITIAL_STORE_BRAND.freeShippingLimit,
            announcementText: val.announcementText || val.announcement_text || INITIAL_STORE_BRAND.announcementText
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
        const payload = [{
          setting_key: 'store_brand',
          setting_value: {
            domain: config.domain,
            whatsappPhone: config.whatsappPhone,
            whatsappDisplay: config.whatsappDisplay,
            freeShippingLimit: config.freeShippingLimit,
            announcementText: config.announcementText
          },
          is_public: true,
          updated_at: new Date().toISOString()
        }];

        const { error } = await insforge.database
          .from('store_settings')
          .upsert(payload, { onConflict: 'setting_key' });

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

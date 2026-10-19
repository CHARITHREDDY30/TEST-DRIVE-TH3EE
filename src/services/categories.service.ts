import type { UniverseCategory } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { INITIAL_UNIVERSE_CATEGORIES } from '../data/initialCatalog';

const LOCAL_STORAGE_UNIVERSE_KEY = 'th3ee_persisted_universes';

function getLocalUniverses(): UniverseCategory[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_UNIVERSE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed reading local universes cache:', e);
  }
  return null;
}

function setLocalUniverses(universes: UniverseCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_UNIVERSE_KEY, JSON.stringify(universes));
  } catch (e) {
    console.warn('Failed saving local universes cache:', e);
  }
}

export const categoriesService = {
  async getCategories(): Promise<UniverseCategory[]> {
    let customSettings: Record<string, Partial<UniverseCategory>> = {};

    // 1. Try reading customizations from store_settings
    if (isInsForgeConfigured()) {
      try {
        const { data: settingsData } = await insforge.database
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'universe_customizations')
          .maybeSingle();

        if (settingsData && settingsData.setting_value) {
          if (Array.isArray(settingsData.setting_value)) {
            setLocalUniverses(settingsData.setting_value);
            return settingsData.setting_value;
          } else if (typeof settingsData.setting_value === 'object') {
            customSettings = settingsData.setting_value;
          }
        }
      } catch (err) {
        console.warn('InsForge universe customizations fetch notice:', err);
      }
    }

    // 2. Fetch base categories from categories table or defaults
    let baseList = INITIAL_UNIVERSE_CATEGORIES;

    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('categories')
          .select('*')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          const { data: subData } = await insforge.database
            .from('categories')
            .select('*')
            .not('parent_id', 'is', null)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

          const subMap = new Map<string, any[]>();
          (subData || []).forEach((sub: any) => {
            const list = subMap.get(sub.parent_id) || [];
            list.push({
              name: sub.name,
              code: sub.slug.split('-')[1]?.toUpperCase() || sub.name.slice(0, 3).toUpperCase(),
              color: 'bg-neutral-800',
              text: 'text-white'
            });
            subMap.set(sub.parent_id, list);
          });

          baseList = data.map((cat: any) => {
            const base = INITIAL_UNIVERSE_CATEGORIES.find(c => c.id === cat.slug);
            const subs = subMap.get(cat.id);
            return {
              id: cat.slug,
              title: cat.name,
              subtitle: cat.description || base?.subtitle || '',
              bgGradient: base?.bgGradient || 'from-neutral-950 via-neutral-900 to-neutral-950',
              image: cat.image_url || base?.image || '',
              subcategories: (subs && subs.length > 0) ? subs : (base?.subcategories || [])
            };
          });
        }
      } catch (err) {
        console.warn('InsForge categories fetch error:', err);
      }
    }

    // Check local storage cache if available
    const local = getLocalUniverses();
    if (local && local.length > 0) {
      return local;
    }

    // Merge any custom overlay/image settings
    if (Object.keys(customSettings).length > 0) {
      const merged = baseList.map(cat => {
        const custom = customSettings[cat.id];
        return custom ? { ...cat, ...custom } : cat;
      });
      setLocalUniverses(merged);
      return merged;
    }

    return baseList;
  },

  async saveUniverseCategories(universes: UniverseCategory[]): Promise<UniverseCategory[]> {
    if (!universes || universes.length === 0) {
      throw new Error('Cannot save empty universe list');
    }

    // Always immediately persist locally to guarantee survival of reloads
    setLocalUniverses(universes);

    // Save to InsForge backend
    if (isInsForgeConfigured()) {
      try {
        const { error: settingsError } = await insforge.database
          .from('store_settings')
          .upsert([{
            setting_key: 'universe_customizations',
            setting_value: universes,
            is_public: true,
            updated_at: new Date().toISOString()
          }], { onConflict: 'setting_key' });

        if (settingsError) {
          console.warn('Could not persist universe customizations to store_settings:', settingsError.message);
        }
      } catch (err) {
        console.error('Failed to save universe settings in InsForge:', err);
      }
    }

    return universes;
  }
};

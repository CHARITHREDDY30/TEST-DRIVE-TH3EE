import type { HeroSlide } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { INITIAL_HERO_SLIDES } from '../data/initialCatalog';
import { mapDbHeroSlideToFrontend, mapFrontendHeroSlideToDb } from './mappers';

const LOCAL_STORAGE_HERO_KEY = 'th3ee_persisted_hero_slides';

function getLocalHeroSlides(): HeroSlide[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HERO_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed reading local hero slides cache:', e);
  }
  return null;
}

function setLocalHeroSlides(slides: HeroSlide[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_HERO_KEY, JSON.stringify(slides));
  } catch (e) {
    console.warn('Failed saving local hero slides cache:', e);
  }
}

export const heroService = {
  async getHeroSlides(): Promise<HeroSlide[]> {
    // 1. Try reading from backend
    if (isInsForgeConfigured()) {
      try {
        // Priority 1: Check store_settings key 'hero_slides' (supports custom JSON with mobileImage)
        const { data: settingsData } = await insforge.database
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'hero_slides')
          .maybeSingle();

        if (settingsData && settingsData.setting_value && Array.isArray(settingsData.setting_value) && settingsData.setting_value.length > 0) {
          const list: HeroSlide[] = settingsData.setting_value;
          setLocalHeroSlides(list);
          return list;
        }

        // Priority 2: Check hero_slides table
        const { data, error } = await insforge.database
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((row, idx) => mapDbHeroSlideToFrontend(row, idx));
          setLocalHeroSlides(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('InsForge hero_slides fetch fallback to local cache:', err);
      }
    }

    // 2. Try reading from persisted local storage
    const cached = getLocalHeroSlides();
    if (cached && cached.length > 0) {
      return cached;
    }

    // 3. Fall back to initial catalog defaults
    return INITIAL_HERO_SLIDES;
  },

  async saveHeroSlides(slides: HeroSlide[]): Promise<HeroSlide[]> {
    if (!slides || slides.length === 0) {
      throw new Error('Cannot save empty hero slides');
    }

    // Always immediately persist locally to guarantee survival of reloads
    setLocalHeroSlides(slides);

    // Save to InsForge backend
    if (isInsForgeConfigured()) {
      try {
        // 1. Save full JSON structure to store_settings
        const { error: settingsError } = await insforge.database
          .from('store_settings')
          .upsert([{
            setting_key: 'hero_slides',
            setting_value: slides,
            is_public: true,
            updated_at: new Date().toISOString()
          }], { onConflict: 'setting_key' });

        if (settingsError) {
          console.warn('Could not persist hero slides to store_settings:', settingsError.message);
        }

        // 2. Also attempt upsert to hero_slides table if present
        try {
          const payload = slides.map((s, idx) => mapFrontendHeroSlideToDb(s, idx + 1));
          await insforge.database
            .from('hero_slides')
            .upsert(payload, { onConflict: 'id' });
        } catch (tableErr) {
          // Table may not have unique constraint or might be restricted; store_settings is source of truth
          console.info('hero_slides table sync note:', tableErr);
        }
      } catch (err) {
        console.error('Failed to save hero slides in InsForge:', err);
        // Do not throw if local cache succeeded, but log error
      }
    }

    return slides;
  }
};

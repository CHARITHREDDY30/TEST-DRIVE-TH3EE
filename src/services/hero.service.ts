import type { HeroSlide } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { INITIAL_HERO_SLIDES } from '../data/initialCatalog';
import { mapDbHeroSlideToFrontend, mapFrontendHeroSlideToDb } from './mappers';

export const heroService = {
  async getHeroSlides(): Promise<HeroSlide[]> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((row, idx) => mapDbHeroSlideToFrontend(row, idx));
        }
        if (error) {
          console.warn('InsForge hero_slides query error:', error);
        }
      } catch (err) {
        console.warn('InsForge hero_slides query error:', err);
      }
    }
    return INITIAL_HERO_SLIDES;
  },

  async saveHeroSlides(slides: HeroSlide[]): Promise<HeroSlide[]> {
    if (isInsForgeConfigured()) {
      try {
        const payload = slides.map((s, idx) => mapFrontendHeroSlideToDb(s, idx + 1));
        const { data, error } = await insforge.database
          .from('hero_slides')
          .upsert(payload, { onConflict: 'id' })
          .select();

        if (!error && Array.isArray(data)) {
          return data.map((row, idx) => mapDbHeroSlideToFrontend(row, idx));
        }
        if (error) {
          throw new Error(error.message || 'Failed to save hero slides');
        }
      } catch (err) {
        console.error('Failed to save hero slides in InsForge:', err);
        throw err;
      }
    }
    return slides;
  }
};

import type { HeroSlide } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { INITIAL_HERO_SLIDES } from '../data/initialCatalog';

export const heroService = {
  async getHeroSlides(): Promise<HeroSlide[]> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('hero_slides')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data as HeroSlide[];
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
        const { data, error } = await insforge.database
          .from('hero_slides')
          .upsert(slides)
          .select();

        if (!error && data) {
          return data as HeroSlide[];
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

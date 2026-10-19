import type { UniverseCategory } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { INITIAL_UNIVERSE_CATEGORIES } from '../data/initialCatalog';

export const categoriesService = {
  async getCategories(): Promise<UniverseCategory[]> {
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

          return data.map((cat: any) => {
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
    return INITIAL_UNIVERSE_CATEGORIES;
  }
};

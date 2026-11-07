import fs from 'node:fs';
import { createClient } from '@insforge/sdk';
import { INITIAL_MASTER_PRODUCTS } from '../src/data/initialCatalog';
import {
  DEFAULT_SIZE_CHART_TEMPLATES,
  getBaselineSizeChartForProduct
} from '../src/data/defaultSizeCharts';
import type { ProductSizeChart } from '../src/types/sizing';

async function seedSizeCharts() {
  console.log('--- SEEDING TH3EE SMART SIZE CHARTS TO INSFORGE ---');

  const proj = JSON.parse(fs.readFileSync('.insforge/project.json', 'utf8'));
  const client = createClient({ baseUrl: proj.oss_host, anonKey: proj.api_key });

  const chartRegistry: Record<string, ProductSizeChart> = {};

  // 1. Add Default Silhouettes Templates
  Object.entries(DEFAULT_SIZE_CHART_TEMPLATES).forEach(([key, template]) => {
    chartRegistry[key] = {
      ...template,
      updatedAt: new Date().toISOString()
    };
  });

  // 2. Add each Master Product in TH3EE Catalog
  INITIAL_MASTER_PRODUCTS.forEach(product => {
    const chart = getBaselineSizeChartForProduct(product);
    chartRegistry[product.id] = {
      ...chart,
      productId: product.id,
      productName: product.name,
      updatedAt: new Date().toISOString()
    };
    if (product.slug) {
      chartRegistry[product.slug] = {
        ...chart,
        productId: product.slug,
        productName: product.name,
        updatedAt: new Date().toISOString()
      };
    }
  });

  console.log(`Prepared ${Object.keys(chartRegistry).length} size chart entries.`);

  const payload = [{
    setting_key: 'product_size_charts',
    setting_value: chartRegistry,
    is_public: true,
    updated_at: new Date().toISOString()
  }];

  const { data, error } = await client.database
    .from('store_settings')
    .upsert(payload, { onConflict: 'setting_key' })
    .select();

  if (error) {
    console.error('Failed to seed product_size_charts:', error);
    process.exit(1);
  }

  console.log('✓ Successfully seeded product_size_charts in InsForge store_settings!');
  console.log(`Total seeded entries: ${Object.keys(chartRegistry).length}`);
  process.exit(0);
}

seedSizeCharts().catch(err => {
  console.error('Seed exception:', err);
  process.exit(1);
});


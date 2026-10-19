import { createClient } from '@insforge/sdk';

const insforgeUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSFORGE_URL
  ? import.meta.env.VITE_INSFORGE_URL
  : 'https://28fmr484.ap-southeast.insforge.app';

const insforgeAnonKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSFORGE_ANON_KEY
  ? import.meta.env.VITE_INSFORGE_ANON_KEY
  : 'anon_13406ee2ccf9332fea03da867d5c5432b938dec5a6e017b21235fe0340a78575';

export function isInsForgeConfigured(): boolean {
  return Boolean(
    insforgeUrl &&
    insforgeAnonKey &&
    insforgeUrl.trim() !== '' &&
    insforgeAnonKey.trim() !== '' &&
    !insforgeUrl.includes('your-project')
  );
}

// Client-side InsForge instance initialized with public anonymous key ONLY.
// Full-access or service-role keys must NEVER be exposed here.
export const insforge = createClient({
  baseUrl: insforgeUrl || 'https://placeholder.insforge.app',
  anonKey: insforgeAnonKey || 'placeholder-anon-key'
});

export default insforge;

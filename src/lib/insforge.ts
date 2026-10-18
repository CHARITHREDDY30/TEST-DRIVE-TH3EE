import { createClient } from '@insforge/sdk';

const insforgeUrl = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_INSFORGE_URL || '') : '';
const insforgeAnonKey = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_INSFORGE_ANON_KEY || '') : '';

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

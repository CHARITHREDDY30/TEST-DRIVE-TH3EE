import { insforge, isInsForgeConfigured } from '../lib/insforge';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

export const authService = {
  isConfigured(): boolean {
    return isInsForgeConfigured();
  },

  async signIn(email: string, password: string):Promise<{ user: AuthUser | null; error: Error | null }> {
    if (!isInsForgeConfigured()) {
      return {
        user: null,
        error: new Error('InsForge backend is not configured. Please set VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY in your environment.')
      };
    }

    try {
      const response = await insforge.auth.signInWithPassword({ email, password });
      if (response && (response as any).error) {
        return { user: null, error: new Error((response as any).error.message || 'Authentication failed') };
      }
      const rawUser = (response as any)?.data?.user || (response as any)?.user;
      const user = (rawUser && rawUser.id) ? (rawUser as AuthUser) : null;
      if (!user) {
        return { user: null, error: new Error('Invalid email or password. Please try again.') };
      }
      return { user, error: null };
    } catch (err: any) {
      return {
        user: null,
        error: new Error(err?.message || 'Authentication error')
      };
    }
  },

  async signOut(): Promise<void> {
    if (isInsForgeConfigured()) {
      try {
        await insforge.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isInsForgeConfigured()) return null;
    try {
      const response = await insforge.auth.getCurrentUser();
      if (!response || (response as any).error) return null;
      const user = (response as any)?.data?.user || (response as any)?.user;
      if (user && user.id) {
        return user as AuthUser;
      }
      return null;
    } catch {
      return null;
    }
  }
};

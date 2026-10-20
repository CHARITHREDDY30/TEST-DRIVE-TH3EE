import { insforge, isInsForgeConfigured } from '../lib/insforge';
import type { AuthUser, AuthResponse, SavedAddress } from '../types/auth';
import { validateEmail, evaluatePasswordStrength } from '../lib/auth-validators';

export type { AuthUser, SavedAddress };

export const authService = {
  isConfigured(): boolean {
    return isInsForgeConfigured();
  },

  /**
   * Subscribe to authentication state changes across the application.
   */
  onAuthStateChange(callback: (event: string, user: AuthUser | null) => void): () => void {
    if (!isInsForgeConfigured()) {
      return () => {};
    }
    try {
      return insforge.auth.onAuthStateChange(async (event: any) => {
        try {
          const user = await this.getCurrentUser();
          callback(event, user);
        } catch {
          callback(event, null);
        }
      });
    } catch (err) {
      console.warn('onAuthStateChange subscription warning:', err);
      return () => {};
    }
  },

  /**
   * Helper to normalize an InsForge user into our domain AuthUser type.
   */
  mapUser(rawUser: any): AuthUser {
    if (!rawUser) {
      return { id: '' };
    }
    const profile = rawUser.profile || {};
    const avatar = profile.avatar_url || (rawUser as any).avatar_url || null;
    return {
      id: rawUser.id,
      email: rawUser.email,
      name: profile.name || rawUser.name || (rawUser.email ? rawUser.email.split('@')[0] : 'Customer'),
      phone: profile.phone || '',
      role: rawUser.role || 'customer',
      emailVerified: Boolean(rawUser.emailVerified ?? rawUser.email_verified),
      createdAt: rawUser.createdAt || rawUser.created_at,
      avatar_url: avatar,
      profile: {
        name: profile.name,
        phone: profile.phone,
        avatar_url: avatar,
        addresses: Array.isArray(profile.addresses) ? profile.addresses : []
      },
      metadata: rawUser.metadata || null
    };
  },

  /**
   * Retrieve the current authenticated customer or admin session.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isInsForgeConfigured()) return null;
    try {
      const response = await insforge.auth.getCurrentUser();
      if (!response || response.error) return null;
      const rawUser = (response as any)?.data?.user || (response as any)?.user;
      if (rawUser && rawUser.id) {
        const mapped = this.mapUser(rawUser);
        try {
          const { data: customerRow } = await insforge.database
            .from('customers')
            .select('avatar_url, full_name, phone')
            .eq('auth_user_id', rawUser.id)
            .maybeSingle();

          if (customerRow) {
            if (customerRow.avatar_url) {
              mapped.avatar_url = customerRow.avatar_url;
              if (mapped.profile) mapped.profile.avatar_url = customerRow.avatar_url;
            }
            if (customerRow.full_name && !mapped.name) mapped.name = customerRow.full_name;
            if (customerRow.phone && !mapped.phone) mapped.phone = customerRow.phone;
          }
        } catch {
          // ignore database query failure, fallback to mapped
        }
        return mapped;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Customer Registration with password strength validation and safe error handling.
   */
  async register(params: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<AuthResponse> {
    if (!isInsForgeConfigured()) {
      return {
        user: null,
        error: new Error('InsForge backend is not configured. Please check your environment settings.')
      };
    }

    const cleanEmail = (params.email || '').trim().toLowerCase();
    const cleanName = (params.name || '').trim();
    const cleanPhone = (params.phone || '').trim();

    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return {
        user: null,
        error: new Error('Please provide a valid email address.')
      };
    }

    if (!cleanName) {
      return {
        user: null,
        error: new Error('Please enter your full name.')
      };
    }

    const strength = evaluatePasswordStrength(params.password);
    if (!strength.isValid) {
      return {
        user: null,
        error: new Error(strength.feedback[0] || 'Password does not meet security requirements.')
      };
    }

    try {
      const { data, error } = await insforge.auth.signUp({
        email: cleanEmail,
        password: params.password,
        name: cleanName
      });

      if (error) {
        // Safe error message transformation to prevent leakage
        const msg = error.message || '';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already exists')) {
          return {
            user: null,
            error: new Error('An account with this email already exists. Please sign in instead.')
          };
        }
        return {
          user: null,
          error: new Error(msg || 'Registration failed. Please check your details and try again.')
        };
      }

      const rawUser = (data as any)?.user || (data as any)?.data?.user;
      const requiresVerification = Boolean(
        (data as any)?.requireEmailVerification ||
        !(data as any)?.accessToken ||
        (rawUser && !rawUser.emailVerified && !rawUser.email_verified)
      );

      let user: AuthUser;
      if (rawUser && rawUser.id) {
        user = this.mapUser(rawUser);
      } else {
        user = {
          id: (data as any)?.id || (data as any)?.userId || '',
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          role: 'customer',
          emailVerified: false,
          profile: {
            name: cleanName,
            phone: cleanPhone,
            addresses: []
          }
        };
      }

      // Persist additional metadata (e.g. phone) in profile if session is immediately available
      if (user.id && (data as any)?.accessToken) {
        if (cleanPhone) {
          try {
            await insforge.auth.setProfile({
              name: cleanName,
              phone: cleanPhone
            });
            user.phone = cleanPhone;
            if (user.profile) user.profile.phone = cleanPhone;
          } catch (profErr) {
            console.warn('Profile phone sync note:', profErr);
          }
        }

        // Sync customer record in public.customers if permitted
        try {
          await insforge.database.from('customers').upsert([{
            id: user.id,
            auth_user_id: user.id,
            full_name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            updated_at: new Date().toISOString()
          }], { onConflict: 'auth_user_id' });
        } catch (custErr) {
          console.warn('Customer table sync note:', custErr);
        }
      }

      return {
        user,
        requiresVerification,
        message: requiresVerification
          ? "We've sent a verification code to your email address."
          : 'Welcome to TH3EE! Your account has been created.',
        error: null
      };
    } catch (err: any) {
      return {
        user: null,
        error: new Error(err?.message || 'Unexpected error during registration')
      };
    }
  },

  /**
   * Secure Sign In for both Customer and Admin.
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!isInsForgeConfigured()) {
      return {
        user: null,
        error: new Error('InsForge backend is not configured. Please set VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY in your environment.')
      };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return {
        user: null,
        error: new Error('Please enter a valid email address.')
      };
    }

    if (!password) {
      return {
        user: null,
        error: new Error('Please enter your password.')
      };
    }

    try {
      const response = await insforge.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (response && (response as any).error) {
        const rawErr = (response as any).error;
        const msg = (rawErr?.message || '').toLowerCase();
        const nextActions = ((rawErr as any)?.nextActions || '').toLowerCase();
        const errCode = (rawErr as any)?.error || '';
        const statusCode = (rawErr as any)?.statusCode;

        // Check specifically for unverified account requirement
        const isUnverified =
          statusCode === 403 &&
          (msg.includes('verification') ||
            msg.includes('verify') ||
            nextActions.includes('verify') ||
            errCode === 'AUTH_NEED_VERIFICATION' ||
            errCode === 'FORBIDDEN');

        if (isUnverified) {
          const unverifiedErr = new Error(
            'Your email address has not been verified yet. Please enter the verification code sent to your email.'
          );
          (unverifiedErr as any).isUnverified = true;
          return {
            user: null,
            requiresVerification: true,
            isUnverified: true,
            message: 'Your email address has not been verified yet.',
            error: unverifiedErr
          };
        }

        if (statusCode >= 500 || msg.includes('network') || msg.includes('fetch')) {
          return {
            user: null,
            error: new Error('Unable to connect to authentication server. Please check your connection and try again.')
          };
        }

        if (statusCode === 429) {
          return {
            user: null,
            error: new Error('Too many sign-in attempts. Please wait a few moments and try again.')
          };
        }

        return {
          user: null,
          error: new Error('Invalid email or password. Please try again.')
        };
      }

      const rawUser = (response as any)?.data?.user || (response as any)?.user;
      if (!rawUser || !rawUser.id) {
        return {
          user: null,
          error: new Error('Invalid email or password. Please try again.')
        };
      }

      const user = this.mapUser(rawUser);
      return { user, error: null };
    } catch (err: any) {
      return {
        user: null,
        error: new Error(err?.message || 'Authentication error. Please try again.')
      };
    }
  },

  /**
   * OAuth Social Sign In (e.g. Google)
   */
  async signInWithOAuth(provider: 'google' = 'google'): Promise<{ url?: string; error?: Error | null }> {
    if (!isInsForgeConfigured()) {
      return { error: new Error('InsForge backend is not configured.') };
    }
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined;
      const res = await insforge.auth.signInWithOAuth(provider, {
        redirectTo: redirectUrl
      });
      if (res?.error) {
        return { error: new Error(res.error.message || 'OAuth sign in failed') };
      }
      return { url: res?.data?.url, error: null };
    } catch (err: any) {
      return { error: new Error(err?.message || 'Failed to initiate Google sign-in') };
    }
  },

  /**
   * Verify email address using the 6-digit OTP code sent by InsForge.
   */
  async verifyEmail(email: string, otp: string): Promise<AuthResponse> {
    if (!isInsForgeConfigured()) {
      return {
        user: null,
        error: new Error('InsForge backend is not configured.')
      };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return {
        user: null,
        error: new Error('Please provide a valid email address.')
      };
    }

    if (!cleanOtp) {
      return {
        user: null,
        error: new Error('Please enter the 6-digit verification code.')
      };
    }

    try {
      const response = await insforge.auth.verifyEmail({
        email: cleanEmail,
        otp: cleanOtp
      });

      if (response && (response as any).error) {
        const rawErr = (response as any).error;
        const msg = rawErr?.message || '';
        let userMessage = 'Invalid or expired verification code. Please check your code or request a new one.';
        if (msg.toLowerCase().includes('expired')) {
          userMessage = 'This verification code has expired. Please request a new code.';
        } else if (msg.toLowerCase().includes('already')) {
          userMessage = 'This email is already verified. You can now sign in.';
        }
        return {
          user: null,
          error: new Error(userMessage)
        };
      }

      const rawUser = (response as any)?.data?.user || (response as any)?.user;
      let user: AuthUser | null = null;
      if (rawUser && rawUser.id) {
        user = this.mapUser(rawUser);
      } else {
        user = await this.getCurrentUser();
      }

      if (user && user.id) {
        try {
          await insforge.database.from('customers').upsert([{
            id: user.id,
            auth_user_id: user.id,
            full_name: user.name || 'Customer',
            email: user.email || cleanEmail,
            phone: user.phone || null,
            updated_at: new Date().toISOString()
          }], { onConflict: 'auth_user_id' });
        } catch (cSyncErr) {
          console.warn('Customer record sync on verify note:', cSyncErr);
        }
      }

      return {
        user,
        requiresVerification: false,
        message: 'Email verified successfully! Welcome to TH3EE.',
        error: null
      };
    } catch (err: any) {
      return {
        user: null,
        error: new Error(err?.message || 'Verification failed. Please try again.')
      };
    }
  },

  /**
   * Secure Sign Out. Terminates session on provider and revokes credentials.
   */
  async signOut(): Promise<void> {
    if (isInsForgeConfigured()) {
      try {
        await insforge.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
  },

  /**
   * Password Reset Request: Safe flow that avoids account enumeration.
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string; error: Error | null }> {
    if (!isInsForgeConfigured()) {
      return {
        success: false,
        message: '',
        error: new Error('Backend not configured.')
      };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return {
        success: false,
        message: '',
        error: new Error('Please enter a valid email address.')
      };
    }

    try {
      const response = await insforge.auth.sendResetPasswordEmail({ email: cleanEmail });
      if (response && response.error) {
        console.warn('Password reset request error:', response.error);
      }
      // Security standard: Always return positive generic message to prevent account enumeration
      return {
        success: true,
        message: 'If an account exists for this email address, password reset instructions have been sent.',
        error: null
      };
    } catch (err) {
      return {
        success: true,
        message: 'If an account exists for this email address, password reset instructions have been sent.',
        error: null
      };
    }
  },

  /**
   * Complete password reset using OTP/code received via email.
   */
  async resetPassword(newPassword: string, otp: string): Promise<{ success: boolean; error: Error | null }> {
    if (!isInsForgeConfigured()) {
      return { success: false, error: new Error('Backend not configured.') };
    }

    const strength = evaluatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return {
        success: false,
        error: new Error(strength.feedback[0] || 'Password does not meet security requirements.')
      };
    }

    if (!otp || !otp.trim()) {
      return { success: false, error: new Error('Verification code is required.') };
    }

    try {
      const response = await insforge.auth.resetPassword({
        newPassword,
        otp: otp.trim()
      });

      if (response && response.error) {
        return {
          success: false,
          error: new Error(response.error.message || 'Failed to reset password. The code may be expired or invalid.')
        };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return {
        success: false,
        error: new Error(err?.message || 'Failed to reset password.')
      };
    }
  },

  /**
   * Resend account verification email.
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string; error: Error | null }> {
    if (!isInsForgeConfigured()) {
      return { success: false, message: '', error: new Error('Backend not configured.') };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return {
        success: false,
        message: '',
        error: new Error('Please provide a valid email address.')
      };
    }

    try {
      const response = await insforge.auth.resendVerificationEmail({ email: cleanEmail });
      if (response && response.error) {
        return {
          success: false,
          message: '',
          error: new Error(response.error.message || 'Unable to resend verification email.')
        };
      }
      return {
        success: true,
        message: 'Verification email has been sent. Please check your inbox.',
        error: null
      };
    } catch (err: any) {
      return {
        success: false,
        message: '',
        error: new Error(err?.message || 'Unable to resend verification email.')
      };
    }
  },

  /**
   * CRITICAL SECURITY CHECK:
   * Verifies whether the authenticated user has explicit administrator privileges.
   * NEVER trusts client role properties or browser state.
   * Strictly queries the public.admin_users table where RLS ensures only genuine admins succeed.
   */
  async verifyAdminStatus(user: AuthUser | null): Promise<boolean> {
    if (!user || !user.id || !isInsForgeConfigured()) {
      return false;
    }

    try {
      // Query admin_users table directly.
      // RLS policy "admin_users_read_self" restricts query to (user_id = auth.uid()).
      // Normal customers or unauthenticated users receive 0 rows.
      const { data, error } = await insforge.database
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      return Boolean(data.role === 'admin' && data.is_active === true);
    } catch (err) {
      console.warn('Admin status verification failed:', err);
      return false;
    }
  },

  /**
   * Update customer profile in InsForge auth and customers table.
   */
  async updateProfile(updates: {
    name?: string;
    phone?: string;
    avatar_url?: string | null;
    addresses?: SavedAddress[];
  }): Promise<{ user: AuthUser | null; error: Error | null }> {
    if (!isInsForgeConfigured()) {
      return { user: null, error: new Error('Backend not configured.') };
    }

    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        return { user: null, error: new Error('Authentication required.') };
      }

      const existingProfile = currentUser.profile || {};
      const newProfile: Record<string, unknown> = {
        ...existingProfile,
        ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone.trim() } : {}),
        ...(updates.avatar_url !== undefined ? { avatar_url: updates.avatar_url } : {}),
        ...(updates.addresses !== undefined ? { addresses: updates.addresses } : {})
      };

      const { data, error } = await insforge.auth.setProfile(newProfile);
      if (error) {
        return { user: null, error: new Error(error.message || 'Failed to update profile.') };
      }

      // Also sync to customers table if accessible
      try {
        await insforge.database.from('customers').upsert([{
          id: currentUser.id,
          auth_user_id: currentUser.id,
          full_name: (newProfile.name as string) || currentUser.name || 'Customer',
          phone: (newProfile.phone as string) || currentUser.phone || null,
          avatar_url: (newProfile.avatar_url as string) || null,
          email: currentUser.email || null,
          updated_at: new Date().toISOString()
        }], { onConflict: 'auth_user_id' });
      } catch (cErr) {
        console.warn('Customers table sync note:', cErr);
      }

      const refreshed = await this.getCurrentUser();
      if (refreshed) {
        if (newProfile.avatar_url !== undefined) {
          refreshed.avatar_url = (newProfile.avatar_url as string) || undefined;
          if (refreshed.profile) refreshed.profile.avatar_url = (newProfile.avatar_url as string) || undefined;
        }
      }
      return { user: refreshed, error: null };
    } catch (err: any) {
      return { user: null, error: new Error(err?.message || 'Profile update failed.') };
    }
  }
};

export default authService;

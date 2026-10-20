export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  houseNo?: string;
  street?: string;
  area?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface AuthUserProfile {
  name?: string;
  phone?: string;
  avatar_url?: string;
  addresses?: SavedAddress[];
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  emailVerified?: boolean;
  createdAt?: string;
  profile?: AuthUserProfile | null;
  metadata?: Record<string, unknown> | null;
}

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0 to 4
  level: 'Weak' | 'Fair' | 'Good' | 'Strong';
  feedback: string[];
  meetsRequirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export interface AuthResponse<T = AuthUser> {
  user: T | null;
  error: Error | null;
  requiresVerification?: boolean;
  isUnverified?: boolean;
  message?: string;
}


import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  UserIcon, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Edit2, 
  GoogleIcon, 
  AppleIcon, 
  FacebookIcon, 
  ShieldCheck, 
  Check,
  Eye,
  EyeOff
} from './icons';
import { authService } from '../../services/auth.service';
import type { AuthUser } from '../../types/auth';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { evaluatePasswordStrength, validateEmail } from '../../lib/auth-validators';

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email';

export interface CustomerAuthPortalProps {
  initialMode?: AuthMode;
  onSuccess?: (user: AuthUser) => void;
  showNotification?: (data: any) => void;
  navigate?: (path: string) => void;
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSuccess?: (user: AuthUser) => void;
  showNotification?: (data: any) => void;
  navigate?: (path: string) => void;
}

/**
 * TH3EE Official Account Portal & Authentication System
 * Exact visual theme and layout matching Change 2 reference specification.
 */
export const CustomerAuthPortal: React.FC<CustomerAuthPortalProps> = ({
  initialMode = 'login',
  onSuccess,
  showNotification,
  navigate,
  isModal = false,
  isOpen = true,
  onClose
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // 6-digit OTP verification inputs
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Status & loading feedback
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUnverifiedPrompt, setIsUnverifiedPrompt] = useState(false);

  // Email correction in verification view
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState('');

  // Real-time email validation flag for Change 2 check icon
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Sync mode whenever initialMode changes
  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccessMessage('');
    setIsUnverifiedPrompt(false);
    setIsEditingEmail(false);
    if (initialMode === 'verify-email') {
      setResendCooldown(60);
    }
  }, [initialMode]);

  // Handle escape key in modal mode
  useEffect(() => {
    if (!isModal || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, onClose]);

  // Cooldown timer ticker for resending code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (isModal && !isOpen) return null;

  const resetForm = () => {
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
    setOtpDigits(['', '', '', '', '', '']);
    setIsUnverifiedPrompt(false);
    setIsEditingEmail(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
    if (newMode === 'verify-email' && resendCooldown === 0) {
      setResendCooldown(30);
    }
    // Update URL if we are on a dedicated route
    if (!isModal && navigate) {
      if (newMode === 'login') navigate('/login');
      else if (newMode === 'register') navigate('/register');
      else if (newMode === 'forgot-password') navigate('/forgot-password');
      else if (newMode === 'verify-email') navigate('/verify-email');
      else if (newMode === 'reset-password') navigate('/reset-password');
    }
  };

  const fullOtpString = otpDigits.join('');

  const getRedirectTarget = () => {
    try {
      const intended = sessionStorage.getItem('th3ee_auth_redirect');
      if (intended) {
        sessionStorage.removeItem('th3ee_auth_redirect');
        if (!intended.startsWith('/atelier-admin') && !intended.startsWith('/admin') && !intended.startsWith('/owner')) {
          return intended;
        }
      }
    } catch {}
    return '/';
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsUnverifiedPrompt(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    const { user, error: err, isUnverified } = await authService.signIn(cleanEmail, password);
    setLoading(false);

    if (err || !user) {
      if (isUnverified) {
        setIsUnverifiedPrompt(true);
        setError('Your email address has not been verified yet. Please enter the verification code sent to your inbox.');
      } else {
        setError(err?.message || 'Invalid email or password. Please try again.');
      }
    } else {
      showNotification?.(`Welcome back, ${user.name || user.email}!`);
      onSuccess?.(user);
      if (onClose) onClose();
      const redirectTarget = getRedirectTarget();
      if (navigate) {
        navigate(redirectTarget);
      }
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsUnverifiedPrompt(false);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    const strength = evaluatePasswordStrength(password);
    if (!strength.isValid) {
      setError(strength.feedback[0] || 'Password does not meet security requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await authService.register({
      email: cleanEmail,
      password,
      name: cleanName,
      phone: phone.trim()
    });
    setLoading(false);

    if (result.error) {
      setError(result.error.message || 'Registration failed. Please try again.');
    } else {
      if (result.requiresVerification) {
        resetForm();
        setMode('verify-email');
        setEmail(cleanEmail);
        setSuccessMessage("We've sent a 6-digit verification code to your email address.");
        setResendCooldown(60);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      } else if (result.user) {
        showNotification?.(`Welcome to TH3EE, ${result.user.name || result.user.email}!`);
        onSuccess?.(result.user);
        if (onClose) onClose();
        const redirectTarget = getRedirectTarget();
        if (navigate) {
          navigate(redirectTarget);
        }
      }
    }
  };

  // Handle Verify Email with OTP
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (fullOtpString.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    const result = await authService.verifyEmail(cleanEmail, fullOtpString);
    setLoading(false);

    if (result.error || !result.user) {
      setError(result.error?.message || 'Invalid or expired verification code. Please check your code or request a new one.');
    } else {
      setSuccessMessage('Email verified successfully! Welcome to TH3EE.');
      showNotification?.(`Welcome to TH3EE, ${result.user.name || result.user.email}!`);
      onSuccess?.(result.user);
      setTimeout(() => {
        if (onClose) onClose();
        const redirectTarget = getRedirectTarget();
        if (navigate) {
          navigate(redirectTarget);
        }
      }, 1000);
    }
  };

  // Handle Resend Verification OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    setResendLoading(true);
    const result = await authService.resendVerificationEmail(cleanEmail);
    setResendLoading(false);

    if (result.error) {
      setError(result.error.message || 'Unable to resend verification code. Please try again in a moment.');
    } else {
      setSuccessMessage(result.message || 'A new verification code has been sent to your email.');
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
  };

  // Handle Email Correction
  const handleUpdateEmailAndResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const clean = (editEmailValue || '').trim().toLowerCase();
    if (!clean || !validateEmail(clean)) {
      setError('Please enter a valid corrected email address.');
      return;
    }

    setEmail(clean);
    setIsEditingEmail(false);
    setResendLoading(true);
    const result = await authService.resendVerificationEmail(clean);
    setResendLoading(false);

    if (result.error) {
      setError(result.error.message || 'Unable to send code to updated email. Please try again.');
    } else {
      setSuccessMessage(`Email updated to ${clean}. A new verification code has been sent.`);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
  };

  // OTP inputs handling
  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/[^0-9]/g, '');
    if (!cleanDigit) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const digit = cleanDigit.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);

    const focusIdx = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  // Handle Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    const result = await authService.sendPasswordResetEmail(cleanEmail);
    setLoading(false);

    setSuccessMessage(result.message || 'If an account exists with this email address, password reset instructions have been dispatched.');
  };

  // Handle Reset Password with OTP
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!fullOtpString) {
      setError('Please enter the verification code sent to your email.');
      return;
    }

    const strength = evaluatePasswordStrength(password);
    if (!strength.isValid) {
      setError(strength.feedback[0] || 'New password does not meet security requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await authService.resetPassword(password, fullOtpString);
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setTimeout(() => {
        switchMode('login');
      }, 2000);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { url, error: err } = await authService.signInWithOAuth('google');
      if (err) throw err;
      if (url && typeof window !== 'undefined') {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in could not be initiated.');
      setLoading(false);
    }
  };

  const handleSocialNotification = (provider: string) => {
    showNotification?.({
      type: 'info',
      message: `${provider} authentication is coming soon. Please sign in with Google or Email.`
    });
  };

  // Card Content
  const portalCard = (
    <div className="w-full md:max-w-4xl transition-all duration-300 relative flex flex-col justify-center my-auto">
      {/* Main Card: Full-screen seamless page on mobile (no curved popup edges), elevated rounded card on desktop */}
      <div className="bg-white rounded-none md:rounded-[36px] shadow-none md:th3ee-card-shadow overflow-hidden grid grid-cols-1 md:grid-cols-12 border-none md:border md:border-white relative w-full md:min-h-[540px]">
        
        {/* Modal Close Button if in modal mode on desktop */}
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-black shadow-md hidden md:flex items-center justify-center transition-all cursor-pointer border border-slate-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ========================================================= */}
        {/* LEFT / TOP COLUMN: VECTOR ARTWORK IN TH3EE RED (CHANGE 2) */}
        {/* ========================================================= */}
        <div className="md:col-span-6 relative bg-gradient-to-br from-[#fff2f2] via-[#ffe8e8] to-[#fff7f7] flex flex-col items-center justify-center py-4 px-6 sm:p-8 overflow-hidden min-h-[160px] sm:min-h-[220px] md:min-h-full border-b md:border-b-0 md:border-r border-red-100/60 select-none">
          
          {/* Organic Soft Curved Wave inside the backdrop */}
          <svg className="absolute -top-10 -left-10 w-72 h-72 sm:w-96 sm:h-96 opacity-40 text-red-200 pointer-events-none" viewBox="0 0 200 200" fill="currentColor">
            <path d="M44.7,-67.2C56.9,-60.7,65.3,-47.9,71.2,-34.1C77.1,-20.3,80.5,-5.5,77.5,8C74.5,21.5,65.1,33.7,54.6,44.2C44.1,54.7,32.5,63.5,19.2,68.2C5.9,72.9,-9.1,73.5,-23.4,69.5C-37.7,65.5,-51.3,56.9,-61.7,44.7C-72.1,32.5,-79.3,16.7,-79.8,-0.3C-80.3,-17.3,-74.1,-35.5,-62.8,-47.4C-51.5,-59.3,-35.1,-64.9,-19.9,-67.9C-4.7,-70.9,9.3,-71.3,44.7,-67.2Z" transform="translate(100 100)" />
          </svg>

          {/* Floating Clouds */}
          <div className="absolute top-4 sm:top-8 left-5 sm:left-8 animate-float-slow opacity-85 pointer-events-none z-10">
            <svg className="w-14 sm:w-16 h-8 sm:h-9 drop-shadow-sm" viewBox="0 0 68 38" fill="none">
              <path d="M12 28C8 28 4 25 4 20C4 16 7 13 11 12.5C12.5 6 18 2 24.5 2C32 2 37.5 7 38.5 13C41 12.5 44 14 45.5 16.5C48 16 52 18 53 21C55 22.5 56 25 55.5 28H12Z" fill="#FFFFFF" />
            </svg>
          </div>

          <div className="absolute top-7 sm:top-12 right-6 sm:right-10 animate-float-delay opacity-80 pointer-events-none z-10">
            <svg className="w-16 sm:w-20 h-9 sm:h-11 drop-shadow-sm" viewBox="0 0 84 42" fill="none">
              <path d="M15 32C10 32 5 28 5 22C5 17 9 14 14 13C16 6 23 2 31 2C40 2 47 7.5 48.5 14.5C51.5 14 55 15.5 57 18.5C60 18 65 20.5 66 24C68.5 25.5 70 28.5 69.5 32H15Z" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Floating TH3EE Red Shield with Keyhole */}
          <div className="absolute top-10 sm:top-16 left-6 sm:left-12 animate-float-shield z-10">
            <svg className="w-9 h-11 sm:w-11 sm:h-13 drop-shadow-md" viewBox="0 0 44 54" fill="none">
              <path d="M22 2L4 9V24C4 36.5 11.5 48 22 52C32.5 48 40 36.5 40 24V9L22 2Z" fill="#FF2E2E" stroke="#ffffff" strokeWidth="2"/>
              <circle cx="22" cy="22" r="4.5" fill="#ffffff"/>
              <polygon points="20,22 24,22 25,32 19,32" fill="#ffffff"/>
            </svg>
          </div>

          {/* PRIMARY VECTOR ARTWORK RECOLORED IN TH3EE RED & WHITE */}
          <div className="relative w-full max-w-[220px] sm:max-w-[320px] md:max-w-[370px] h-36 sm:h-56 md:h-76 flex items-center justify-center my-auto">
            <svg viewBox="0 0 400 340" className="w-full h-full drop-shadow-sm select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Baseline Ground in Brand Red */}
              <path d="M40 310H360" stroke="#FF2E2E" strokeWidth="4.5" strokeLinecap="round" opacity="0.85"/>
              
              {/* SMARTPHONE FRAME */}
              <g className="transition-transform duration-300">
                <ellipse cx="140" cy="308" rx="68" ry="7" fill="#660a0a" opacity="0.12"/>
                <rect x="74" y="44" width="132" height="262" rx="26" fill="#FFFFFF" stroke="#FF2E2E" strokeWidth="5.5"/>
                <rect x="122" y="54" width="36" height="4" rx="2" fill="#cbd5e1"/>
                <circle cx="140" cy="98" r="22" fill="#ffe1e1"/>
                <circle cx="140" cy="98" r="18" fill="#FF2E2E"/>
                <circle cx="140" cy="95" r="7.5" fill="#ffffff"/>
                <path d="M133 93C133 88 136 86 140 86C144 86 147 88 147 93C144 91 136 91 133 93Z" fill="#1e293b"/>
                <path d="M129 110C129 104 134 102 140 102C146 102 151 104 151 110V112H129V110Z" fill="#ffffff"/>
                
                {/* Simulated Input Field 1 */}
                <rect x="94" y="132" width="92" height="11" rx="5.5" fill="#f1f5f9"/>
                <circle cx="102" cy="137.5" r="2.5" fill="#94a3b8"/>
                <line x1="110" y1="137.5" x2="160" y2="137.5" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
                
                {/* Simulated Input Field 2 */}
                <rect x="94" y="149" width="92" height="11" rx="5.5" fill="#f1f5f9"/>
                <circle cx="102" cy="154.5" r="2.5" fill="#94a3b8"/>
                <line x1="110" y1="154.5" x2="148" y2="154.5" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="3 3" strokeLinecap="round"/>
                
                {/* Keyhole on Phone Display */}
                <g className="animate-pulse">
                  <circle cx="140" cy="180" r="6" fill="#1c1c20"/>
                  <polygon points="137,180 143,180 145,192 135,192" fill="#1c1c20"/>
                </g>
              </g>

              {/* POTTED PLANT */}
              <g className="animate-sway origin-bottom">
                <polygon points="80,285 106,285 101,310 85,310" fill="#111113"/>
                <path d="M93 285C85 270 70 270 65 258C60 245 74 240 82 250C85 235 98 238 98 250C103 230 115 235 112 255C122 252 125 265 116 272C122 280 110 285 93 285Z" fill="#1e293b"/>
                <path d="M93 285C88 274 78 272 74 262C71 253 82 248 88 256C91 243 100 246 100 256C104 240 112 244 110 260C118 258 119 268 112 274C116 280 106 284 93 285Z" fill="#334155"/>
                <path d="M93 285C89 276 83 275 80 268C78 261 86 257 91 263C93 252 100 254 100 263C104 250 110 253 108 266C114 264 115 272 110 277C113 281 104 284 93 285Z" fill="#FF2E2E" opacity="0.6"/>
              </g>

              {/* STYLIZED STREETWEAR CHARACTER */}
              <g id="character-group">
                <circle cx="236" cy="160" r="10" fill="#fca5a5"/>
                <path d="M228 158C228 151 233 147 239 148C245 149 248 155 246 161C242 158 232 157 228 158Z" fill="#111113"/>
                {/* TH3EE Streetwear Red Hoodie */}
                <path d="M224 175C224 171 230 170 236 170C242 170 248 171 248 175L250 205C246 208 238 209 230 207L224 175Z" fill="#FF2E2E"/>
                <path d="M233 170V179" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round"/>

                {/* Right Leg */}
                <path d="M241 206L260 255L270 298L278 300L278 306L260 306L252 260L236 210" fill="#1c1c20"/>
                <path d="M260 304H280C282 304 283 306 283 308C283 310 281 310 279 310H258L260 304Z" fill="#ffffff" stroke="#FF2E2E" strokeWidth="1.5"/>

                {/* Left Leg */}
                <path d="M228 206L214 246L210 288L200 302L188 304L188 308L212 308L224 286L232 245L236 206" fill="#111113"/>
                <path d="M188 304H212C214 304 216 306 216 308C216 310 214 310 211 310H186L188 304Z" fill="#ffffff" stroke="#FF2E2E" strokeWidth="1.5"/>

                {/* Arms Holding Golden Key */}
                <path d="M244 178L262 215L274 225" stroke="#fca5a5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M226 178L198 200L168 185" stroke="#fca5a5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
              </g>

              {/* GIANT GOLDEN / AMBER KEY */}
              <g id="golden-key" className="animate-key-bob origin-center">
                <line x1="164" y1="184" x2="284" y2="242" stroke="url(#goldGrad)" strokeWidth="9" strokeLinecap="round"/>
                <line x1="164" y1="184" x2="284" y2="242" stroke="#ffffff" strokeWidth="2" strokeDasharray="10 8" strokeLinecap="round" opacity="0.7"/>
                <path d="M167 186L160 178M175 190L169 181M183 194L180 187" stroke="#f59e0b" strokeWidth="7" strokeLinecap="round"/>
                <circle cx="288" cy="244" r="18" fill="none" stroke="url(#goldGrad)" strokeWidth="8"/>
                <circle cx="288" cy="244" r="13" fill="#ffebee"/>
                <circle cx="288" cy="244" r="9" fill="url(#goldGrad)"/>
                <circle cx="288" cy="244" r="5" fill="#ffebee"/>
              </g>

              <defs>
                <linearGradient id="goldGrad" x1="160" y1="180" x2="300" y2="250" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Bottom Micro Tagline */}
          <div className="mt-1 md:mt-2 text-center z-10 hidden sm:block">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-sm text-[11px] font-semibold text-brand-600 shadow-sm border border-red-100">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
              TH3EE Secure Verification
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT / BOTTOM COLUMN: AUTHENTICATION FORM (CHANGE 2)     */}
        {/* ========================================================= */}
        <div className="md:col-span-6 px-5 py-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center bg-white relative z-10">
          
          {/* Headings */}
          <div className="text-center md:text-left mb-4 sm:mb-6">
            <h1 className="font-poppins font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              {mode === 'login' && 'Welcome!'}
              {mode === 'register' && 'Join TH3EE'}
              {mode === 'forgot-password' && 'Password Recovery'}
              {mode === 'reset-password' && 'Set New Password'}
              {mode === 'verify-email' && 'Verify Email'}
            </h1>
            <p className="text-brand-500 font-sans text-sm sm:text-base mt-1 font-medium">
              {mode === 'login' && 'Sign in to TH3EE Archive'}
              {mode === 'register' && 'Create your Member Account'}
              {mode === 'forgot-password' && 'Enter your email for security link'}
              {mode === 'reset-password' && 'Enter code & create strong password'}
              {mode === 'verify-email' && 'Enter 6-digit confirmation code'}
            </p>
          </div>

          {/* Feedback & Error Alerts */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs font-sans"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-brand-500" />
              <div className="flex-1">
                <span>{error}</span>
                {isUnverifiedPrompt && mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('verify-email')}
                    className="block mt-1 font-bold underline hover:text-red-900"
                  >
                    Click here to enter verification code →
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-sans"
            >
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* ================= MODE: LOGIN OR REGISTER ================= */}
          {(mode === 'login' || mode === 'register') && (
            <form 
              onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} 
              className="space-y-3.5 sm:space-y-4"
            >
              {/* Dynamic Sign-Up Full Name Field */}
              {mode === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <div className="reference-input rounded-full px-4 sm:px-5 py-2.5 sm:py-3 flex items-center bg-white">
                    <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name" 
                      required={mode === 'register'}
                      className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none pl-3 font-sans"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email Address Input with '@' icon inside pill */}
              <div>
                <div className="reference-input rounded-full px-4 sm:px-5 py-2.5 sm:py-3 flex items-center bg-white">
                  <span className="text-slate-400 font-medium text-base sm:text-lg select-none leading-none pl-0.5">@</span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Email Address" 
                    autoComplete="email"
                    className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none pl-3 font-sans"
                  />
                  <span className={`transition-opacity ${isEmailValid ? 'opacity-100' : 'opacity-0'}`}>
                    <Check className="w-4 h-4 text-brand-500" />
                  </span>
                </div>
              </div>

              {/* Dynamic Sign-Up Mobile Phone Field */}
              {mode === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <div className="reference-input rounded-full px-4 sm:px-5 py-2.5 sm:py-3 flex items-center bg-white">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Mobile Phone (10 digits)" 
                      className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none pl-3 font-sans"
                    />
                  </div>
                </motion.div>
              )}

              {/* Password Input with padlock and eye show/hide toggle */}
              <div>
                <div className="reference-input rounded-full px-4 sm:px-5 py-2.5 sm:py-3 flex items-center bg-white">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password" 
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none pl-3 font-sans"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="text-slate-400 hover:text-brand-500 focus:outline-none p-1 -mr-1 transition-colors cursor-pointer" 
                    title="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter in registration mode */}
                {mode === 'register' && password && (
                  <div className="px-2 pt-2">
                    <PasswordStrengthMeter password={password} />
                  </div>
                )}
              </div>

              {/* Dynamic Sign-Up Confirm Password Field */}
              {mode === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <div className="reference-input rounded-full px-4 sm:px-5 py-2.5 sm:py-3 flex items-center bg-white">
                    <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password" 
                      required={mode === 'register'}
                      className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none pl-3 font-sans"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                      className="text-slate-400 hover:text-brand-500 focus:outline-none p-1 -mr-1 transition-colors cursor-pointer" 
                      title="Toggle password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Forgot Password Right-Aligned Link (Login mode only) */}
              {mode === 'login' && (
                <div className="flex justify-end pt-0.5">
                  <button 
                    type="button" 
                    onClick={() => switchMode('forgot-password')} 
                    className="text-xs sm:text-[13px] text-brand-500 hover:text-brand-700 font-semibold transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Action Buttons: Solid TH3EE RED & Outlined RED */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full min-h-[48px] py-3 px-4 rounded-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-60 text-white font-poppins font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-md shadow-brand-500/30 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <span>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
                  )}
                </button>

                <button 
                  type="button" 
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className={`w-full min-h-[48px] py-3 px-4 rounded-full border-2 border-brand-500 hover:bg-brand-50 text-brand-500 font-poppins font-bold text-xs tracking-wider uppercase transition-all duration-200 active:scale-95 cursor-pointer ${mode === 'register' ? 'bg-brand-50' : ''}`}
                >
                  {mode === 'login' ? 'SIGN UP' : 'BACK TO LOGIN'}
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE: FORGOT PASSWORD ================= */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Enter your registered email address to receive an instant TH3EE security reset code and instructions.
              </p>

              <div className="reference-input rounded-full px-4 sm:px-5 py-2.5 sm:py-3 flex items-center bg-white">
                <span className="text-slate-400 font-medium text-base select-none pl-0.5">@</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@domain.com"
                  className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none pl-3 font-sans"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full min-h-[48px] py-3.5 px-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-poppins font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-brand-500/25 active:scale-95 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'SENDING INSTRUCTIONS...' : 'SEND RESET INSTRUCTIONS'}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button 
                    type="button"
                    onClick={() => switchMode('reset-password')}
                    className="text-xs text-slate-500 hover:text-brand-500 font-semibold"
                  >
                    Already have code? Reset password →
                  </button>
                  <button 
                    type="button" 
                    onClick={() => switchMode('login')}
                    className="text-xs text-brand-500 hover:text-brand-700 font-bold"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ================= MODE: RESET PASSWORD WITH OTP ================= */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Enter the 6-digit code dispatched to your inbox and establish your new secure password.
              </p>

              {/* 6-Digit Code Inputs */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block mb-2">
                  Verification Code (6 Digits)
                </label>
                <div className="flex gap-2 justify-between">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 sm:w-12 h-12 text-center text-lg font-mono font-bold border-2 border-slate-200 rounded-2xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-slate-50 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div className="reference-input rounded-full px-4 sm:px-5 py-2.5 sm:py-3 flex items-center bg-white">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="New Password" 
                  className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none pl-3 font-sans"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="text-slate-400 hover:text-brand-500 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && (
                <div className="px-2">
                  <PasswordStrengthMeter password={password} />
                </div>
              )}

              {/* Confirm New Password */}
              <div className="reference-input rounded-full px-4 sm:px-5 py-2.5 sm:py-3 flex items-center bg-white">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm New Password" 
                  className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none pl-3 font-sans"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  className="text-slate-400 hover:text-brand-500 p-1 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-2 space-y-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full min-h-[48px] py-3.5 px-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-poppins font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-brand-500/25 active:scale-95 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD & SIGN IN'}
                </button>

                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => switchMode('login')}
                    className="text-xs text-brand-500 hover:text-brand-700 font-bold"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ================= MODE: VERIFY EMAIL ================= */}
          {mode === 'verify-email' && (
            <div className="space-y-4">
              <div className="bg-red-50/60 border border-red-100 rounded-2xl p-3.5 text-xs text-slate-600 font-sans space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Verification Target:</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditingEmail(!isEditingEmail);
                      setEditEmailValue(email);
                    }}
                    className="text-brand-500 hover:underline flex items-center gap-1 font-bold text-[11px]"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{isEditingEmail ? 'Cancel' : 'Edit Email'}</span>
                  </button>
                </div>
                <div className="font-mono text-slate-900 font-semibold">{email}</div>
              </div>

              {isEditingEmail && (
                <form onSubmit={handleUpdateEmailAndResend} className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-500 block">Correct Email Address</label>
                  <input 
                    type="email"
                    value={editEmailValue}
                    onChange={(e) => setEditEmailValue(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-full focus:border-brand-500 focus:outline-none"
                    placeholder="correct@domain.com"
                  />
                  <button 
                    type="submit" 
                    disabled={resendLoading}
                    className="w-full py-2 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-brand-500 transition-colors"
                  >
                    {resendLoading ? 'Resending...' : 'Update & Resend Code'}
                  </button>
                </form>
              )}

              {/* 6 Digits OTP */}
              <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block mb-2">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="flex gap-2 justify-between">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-10 sm:w-12 h-12 text-center text-lg font-mono font-bold border-2 border-slate-200 rounded-2xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-slate-50 transition-all"
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || fullOtpString.length < 6}
                  className="w-full min-h-[48px] py-3.5 px-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-poppins font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-brand-500/25 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'VERIFYING CODE...' : 'Verify Email'}
                </button>
              </form>

              {/* Resend Code Ticker */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resendLoading}
                  className={`font-semibold transition-colors ${
                    resendCooldown > 0 
                      ? 'text-slate-400 cursor-not-allowed' 
                      : 'text-brand-500 hover:text-brand-700 underline cursor-pointer'
                  }`}
                >
                  {resendLoading ? 'Dispatching...' : resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-slate-500 hover:text-black font-semibold"
                >
                  Sign In with Password
                </button>
              </div>
            </div>
          )}

          {/* ================= OR LOGIN WITH SOCIAL ================= */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <div className="relative my-4 sm:my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-[11px] font-sans font-semibold text-slate-400 tracking-wider uppercase">
                  OR LOGIN WITH
                </span>
              </div>

              {/* Social Authentications (Google, Apple, Facebook) */}
              <div className="flex items-center justify-center space-x-5 sm:space-x-6">
                {/* Google Button */}
                <button 
                  type="button" 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-12 h-12 rounded-full border border-slate-200 hover:border-brand-500 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 bg-white active:scale-95 touch-manipulation group cursor-pointer"
                  title="Sign in with Google"
                >
                  <div className="group-hover:scale-110 transition-transform">
                    <GoogleIcon className="w-5 h-5" />
                  </div>
                </button>

                {/* Apple ID Button */}
                <button 
                  type="button" 
                  onClick={() => handleSocialNotification('Apple ID')}
                  className="w-12 h-12 rounded-full border border-slate-200 hover:border-black flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 bg-white active:scale-95 touch-manipulation group cursor-pointer"
                  title="Sign in with Apple ID"
                >
                  <div className="text-slate-900 group-hover:scale-110 transition-transform">
                    <AppleIcon className="w-5 h-5" />
                  </div>
                </button>

                {/* Facebook Button */}
                <button 
                  type="button" 
                  onClick={() => handleSocialNotification('Facebook')}
                  className="w-12 h-12 rounded-full border border-slate-200 hover:border-[#1877F2] flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 bg-white active:scale-95 touch-manipulation group cursor-pointer"
                  title="Sign in with Facebook"
                >
                  <div className="group-hover:scale-110 transition-transform">
                    <FacebookIcon className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Bottom Card Brand Microcopy */}
          <div className="mt-4 sm:mt-6 text-center text-xs text-slate-400 font-sans">
            TH3EE Clothing Identity Protection
          </div>

        </div>

      </div>
    </div>
  );

  // If in desktop modal mode, wrap inside floating backdrop
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <div onClick={onClose} className="fixed inset-0 hidden md:block" />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative z-10 w-full md:max-w-4xl my-auto min-h-screen md:min-h-0 bg-white md:bg-transparent"
        >
          {portalCard}
        </motion.div>
      </div>
    );
  }

  // Dedicated Full-Page Mode (for mobile & desktop routes /login, /register, etc.)
  return (
    <div className="bg-white md:bg-[#faf5f5] font-sans min-h-screen min-h-[100dvh] relative flex flex-col text-slate-800 antialiased select-none overflow-x-hidden p-0 md:p-6 lg:p-8 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-6">
      {/* Ambient TH3EE Red Corner Organic Blobs */}
      <div className="blob-top-left hidden md:block" />
      <div className="blob-bottom-right hidden md:block" />

      {/* Mobile Notch / Safe Area Spacer */}
      <div className="h-[env(safe-area-inset-top,0px)] w-full" />

      {/* Header with Authentic TH3EE Brand Logo */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between border-b border-neutral-100 md:border-b-0 bg-white md:bg-transparent">
        <button 
          type="button" 
          onClick={() => navigate?.('/')} 
          className="flex items-center space-x-3 group cursor-pointer"
        >
          <div className="px-3.5 py-1.5 rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/25 flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="th3ee-logo-text text-base sm:text-lg">
              <span className="text-white">TH</span>
              <span className="text-brand-500 bg-white px-[2px] rounded-sm mx-[1px]">3</span>
              <span className="text-white">EE</span>
            </span>
          </div>
          <div className="hidden xs:block">
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-slate-400 block leading-none">CLOTHING CO.</span>
          </div>
        </button>

        {/* Security Status Badge & Back button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 backdrop-blur-md border border-red-100 shadow-sm text-[11px] sm:text-xs font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span>Official Portal</span>
          </div>
          <button
            type="button"
            onClick={() => navigate?.('/')}
            className="text-xs font-bold text-slate-600 hover:text-brand-500 px-3 py-1 rounded-full bg-white/90 border border-slate-200 shadow-2xs hover:border-brand-500 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Storefront</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Viewport Responsive Container */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center w-full p-0 md:px-4 py-2 sm:py-4 md:py-6">
        {portalCard}
      </main>
    </div>
  );
};

/**
 * Backward-compatible Modal wrapper for desktop usage
 */
export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  showNotification,
  navigate
}) => {
  if (!isOpen) return null;

  // On mobile screens, never open a popup or modal with curved edges!
  // Immediately navigate to dedicated full page
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    if (navigate) {
      navigate(initialMode === 'register' ? '/register' : '/login');
      return null;
    }
  }

  return (
    <CustomerAuthPortal
      isModal={typeof window !== 'undefined' && window.innerWidth >= 768}
      isOpen={isOpen}
      onClose={onClose}
      initialMode={initialMode}
      onSuccess={onSuccess}
      showNotification={showNotification}
      navigate={navigate}
    />
  );
};

export default CustomerAuthModal;

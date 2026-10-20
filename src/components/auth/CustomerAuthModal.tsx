import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, UserIcon, Phone, CheckCircle, AlertCircle, ArrowRight, Edit2, GoogleIcon } from './icons';
import { authService } from '../../services/auth.service';
import type { AuthUser } from '../../types/auth';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { evaluatePasswordStrength, validateEmail } from '../../lib/auth-validators';

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSuccess?: (user: AuthUser) => void;
  showNotification?: (data: any) => void;
  navigate?: (path: string) => void;
}

/**
 * Stylized Eye Toggle with lash aesthetic inspired by the reference design
 */
const LashEyeToggle: React.FC<{ show: boolean; onClick: () => void }> = ({ show, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-[#8C8276] hover:text-[#2A231C] transition-colors p-1 cursor-pointer focus:outline-none"
    tabIndex={-1}
    aria-label={show ? 'Hide password' : 'Show password'}
  >
    {show ? (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-6.5 10-6.5 10 6.5 10 6.5-3.5 6.5-10 6.5-10-6.5-10-6.5z" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="5.5" y1="4.5" x2="7" y2="6" />
        <line x1="18.5" y1="4.5" x2="17" y2="6" />
      </svg>
    ) : (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10c2.5 4.5 6.5 7 9 7s6.5-2.5 9-7" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="7" y1="15.5" x2="5.5" y2="19" />
        <line x1="17" y1="15.5" x2="18.5" y2="19" />
      </svg>
    )}
  </button>
);

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  showNotification,
  navigate
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // 6-digit OTP states
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Status & Feedback states
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUnverifiedPrompt, setIsUnverifiedPrompt] = useState(false);

  // Email correction states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState('');

  // Sync mode whenever initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setSuccessMessage('');
      setIsUnverifiedPrompt(false);
      setIsEditingEmail(false);
      if (initialMode === 'verify-email') {
        setResendCooldown(60);
      }
    }
  }, [initialMode, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cooldown timer ticker for resending verification code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

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
      onClose();
      const redirectTarget = getRedirectTarget();
      if (navigate && redirectTarget && redirectTarget !== '/') {
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
        onClose();
        const redirectTarget = getRedirectTarget();
        if (navigate && redirectTarget && redirectTarget !== '/') {
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
        onClose();
        const redirectTarget = getRedirectTarget();
        if (navigate && redirectTarget && redirectTarget !== '/') {
          navigate(redirectTarget);
        }
      }, 1000);
    }
  };

  // Handle Resend Verification Email OTP
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

  // Handle Email Correction within Verification view
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

  // OTP Input event handlers (auto-advance, backspace, paste)
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

    setSuccessMessage(result.message || 'If an account exists with this email address, instructions will be sent.');
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-md p-3 sm:p-6 lg:p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-5xl min-h-[580px] lg:min-h-[640px] rounded-[32px] sm:rounded-[38px] overflow-hidden shadow-2xl bg-[#D8C7B5] border border-white/20 grid grid-cols-1 lg:grid-cols-12 items-stretch"
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-neutral-600 hover:text-black shadow-md flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* =========================================================================
            LEFT SECTION: WARM CLOTHING ATELIER LIFESTYLE ATMOSPHERE
            (Uses Requested 3D Modern Retail Floor Atelier Visual)
           ========================================================================= */}
        <div className="relative lg:col-span-7 flex flex-col justify-between p-7 sm:p-10 lg:p-12 overflow-hidden min-h-[340px] lg:min-h-full">
          {/* Background Image Layer */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out hover:scale-105"
            style={{ 
              backgroundImage: `url('${typeof window !== 'undefined' && window.location.pathname.startsWith('/test-drive-th3ee') ? '/test-drive-th3ee' : ''}/images/login-bg.jpg')` 
            }}
          />

          {/* Warm Artistic Film Overlay for Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 lg:bg-gradient-to-r lg:from-black/75 lg:via-black/45 lg:to-black/30" />

          {/* Top Brand Tag */}
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F8D26] animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-sm font-sans">
                TH3EE
              </h1>
            </div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/80 pl-4.5">
              ATELIER IDENTITY • EST. 2024
            </p>
          </div>

          {/* Middle/Bottom Headline & Subtitle */}
          <div className="relative z-10 my-auto pt-8 pb-4 space-y-3 max-w-md">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
              Every big thing starts small
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed drop-shadow-sm">
              Log in and continue growing. Access your reserved drops, loyalty pass stamps, and bespoke order tracker.
            </p>
          </div>

          {/* Bottom Atelier Micro-Credit */}
          <div className="relative z-10 pt-2 text-[11px] text-white/70 font-medium flex items-center gap-2">
            <span>Heavyweight 280 GSM Cotton</span>
            <span>•</span>
            <span>Hand-numbered Silhouettes</span>
          </div>
        </div>

        {/* =========================================================================
            RIGHT SECTION: FLOATING WARM CREAM ROUNDED CARD
            (Faithful representation of the reference screenshot's floating card)
           ========================================================================= */}
        <div className="relative lg:col-span-5 bg-[#FAF7F2] p-6 sm:p-9 lg:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#EBE3D7] text-[#2A231C]">
          {/* Card Title */}
          <div className="mb-6">
            <h3 className="text-2xl sm:text-[26px] font-bold text-[#2A231C] tracking-tight">
              {mode === 'login' && 'Log in to your account'}
              {mode === 'register' && 'Create your account'}
              {mode === 'verify-email' && 'Verify your email'}
              {mode === 'forgot-password' && 'Reset your password'}
              {mode === 'reset-password' && 'Set new password'}
            </h3>
            <p className="text-xs text-[#7A7065] mt-1">
              {mode === 'login' && 'Enter your credentials to access your TH3EE patron portal.'}
              {mode === 'register' && 'Join the TH3EE cult club for private drops and punchcard rewards.'}
              {mode === 'verify-email' && 'Enter the 6-digit verification code sent to your inbox.'}
              {mode === 'forgot-password' && 'Enter your email to receive recovery instructions.'}
              {mode === 'reset-password' && 'Enter the verification code and set a new password.'}
            </p>
          </div>

          {/* Status Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex flex-col gap-1.5"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E51E2B]" />
                  <span className="leading-snug">{error}</span>
                </div>
                {isUnverifiedPrompt && mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('verify-email')}
                    className="w-full mt-1 py-1.5 bg-[#4F8D26] text-white hover:bg-[#437A1F] text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Enter Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-2"
              >
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#4F8D26]" />
                <span className="leading-snug">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =====================================================================
              1. LOGIN VIEW (Matches Reference Screenshot Pixel-for-Pixel)
             ===================================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1.5">
                  Email address
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Mail className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1.5">
                  Password
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Lock className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                  <LashEyeToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="text-xs font-medium text-[#7A7065] hover:text-[#4F8D26] transition-colors cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

              {/* Log In Button (Green Pill matching Reference) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#4F8D26] hover:bg-[#437A1F] active:scale-[0.99] text-white text-sm font-bold tracking-wide rounded-2xl shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>Logging in...</span>
                ) : (
                  <span>Log in</span>
                )}
              </button>

              {/* "or" Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-[#E3DCD3]" />
                <span className="absolute bg-[#FAF7F2] px-3 text-xs text-[#8C8276] font-medium">
                  or
                </span>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-neutral-50/90 border border-[#E3DCD3] rounded-2xl font-semibold text-sm text-[#3E362E] transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span>Continue with Google</span>
              </button>

              {/* Bottom Switch Link */}
              <div className="text-center pt-2 text-xs text-[#7A7065]">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-[#4F8D26] font-bold hover:underline cursor-pointer ml-1"
                >
                  Sign up
                </button>
              </div>
            </form>
          )}

          {/* =====================================================================
              2. REGISTER VIEW (Consistent Warm Aesthetic)
             ===================================================================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1">
                  Full Name *
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <UserIcon className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1">
                  Email address *
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Mail className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Phone className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1">
                  Password *
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Lock className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    required
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                  <LashEyeToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />
                </div>
                <div className="mt-1">
                  <PasswordStrengthMeter password={password} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1">
                  Confirm Password *
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Lock className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                  <LashEyeToggle show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#4F8D26] hover:bg-[#437A1F] active:scale-[0.99] text-white text-sm font-bold tracking-wide rounded-2xl shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <span>Creating Account...</span> : <span>Create Account</span>}
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="w-full border-t border-[#E3DCD3]" />
                <span className="absolute bg-[#FAF7F2] px-3 text-xs text-[#8C8276] font-medium">
                  or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 bg-white hover:bg-neutral-50/90 border border-[#E3DCD3] rounded-2xl font-semibold text-xs text-[#3E362E] transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>Sign up with Google</span>
              </button>

              <div className="text-center pt-2 text-xs text-[#7A7065]">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#4F8D26] font-bold hover:underline cursor-pointer ml-1"
                >
                  Log in
                </button>
              </div>
            </form>
          )}

          {/* =====================================================================
              3. VERIFY EMAIL VIEW (6-Digit OTP Punchcard)
             ===================================================================== */}
          {mode === 'verify-email' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E3DCD3] p-3.5 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7A7065]">Code sent to:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEmail(!isEditingEmail);
                      setEditEmailValue(email);
                    }}
                    className="text-[#4F8D26] font-bold hover:underline flex items-center gap-1 cursor-pointer text-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{isEditingEmail ? 'Cancel' : 'Change'}</span>
                  </button>
                </div>

                {!isEditingEmail ? (
                  <div className="font-bold text-[#2A231C] text-xs break-all">
                    {email || 'your email'}
                  </div>
                ) : (
                  <form onSubmit={handleUpdateEmailAndResend} className="space-y-2 pt-1">
                    <input
                      type="email"
                      value={editEmailValue}
                      onChange={(e) => setEditEmailValue(e.target.value)}
                      placeholder="Corrected email"
                      required
                      className="w-full px-3 py-1.5 text-xs border border-[#E3DCD3] rounded-xl bg-[#FAF7F2] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={resendLoading || !editEmailValue.trim()}
                      className="w-full py-1.5 bg-[#4F8D26] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {resendLoading ? 'Updating...' : 'Update & Resend'}
                    </button>
                  </form>
                )}
              </div>

              <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A5046] block text-center mb-2">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-center gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpInputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-10 h-12 text-center text-lg font-bold bg-white rounded-xl border border-[#E3DCD3] focus:border-[#4F8D26] focus:ring-2 focus:ring-[#4F8D26]/20 focus:outline-none transition-all shadow-xs"
                        aria-label={`Digit ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || fullOtpString.length < 6}
                  className="w-full py-3.5 bg-[#4F8D26] hover:bg-[#437A1F] text-white text-sm font-bold tracking-wide rounded-2xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#7A7065]">Didn't get code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resendLoading}
                    className="font-bold text-[#4F8D26] hover:underline disabled:text-neutral-400 disabled:no-underline cursor-pointer"
                  >
                    {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>

                <div className="text-center pt-2 border-t border-[#E3DCD3]">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs text-[#7A7065] hover:text-[#2A231C] font-semibold cursor-pointer"
                  >
                    ← Back to Log in
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =====================================================================
              4. FORGOT PASSWORD VIEW
             ===================================================================== */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1.5">
                  Email address
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Mail className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    autoComplete="email"
                    required
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#4F8D26] hover:bg-[#437A1F] active:scale-[0.99] text-white text-sm font-bold tracking-wide rounded-2xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Sending Instructions...' : 'Send Reset Code'}
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-[#E3DCD3] text-xs">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#7A7065] hover:text-[#2A231C] font-semibold cursor-pointer"
                >
                  ← Back to Log in
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('reset-password')}
                  className="text-[#4F8D26] font-bold hover:underline cursor-pointer"
                >
                  Have code? Reset
                </button>
              </div>
            </form>
          )}

          {/* =====================================================================
              5. RESET PASSWORD VIEW
             ===================================================================== */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#5A5046] block text-center mb-1.5">
                  Verification Code (OTP) *
                </label>
                <div className="flex justify-center gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-9 h-11 text-center text-lg font-bold bg-white rounded-xl border border-[#E3DCD3] focus:border-[#4F8D26] focus:outline-none transition-all shadow-xs"
                      aria-label={`Digit ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1">
                  New Password *
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Lock className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    required
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                  <LashEyeToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />
                </div>
                <div className="mt-1">
                  <PasswordStrengthMeter password={password} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A5046] block mb-1">
                  Confirm New Password *
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-2xl border border-[#E3DCD3] focus-within:border-[#4F8D26] focus-within:ring-2 focus-within:ring-[#4F8D26]/20 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <Lock className="w-4 h-4 text-[#8C8276] shrink-0" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                    className="w-full bg-transparent text-sm text-[#2A231C] placeholder:text-[#AAA094] focus:outline-none"
                  />
                  <LashEyeToggle show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#4F8D26] hover:bg-[#437A1F] active:scale-[0.99] text-white text-sm font-bold tracking-wide rounded-2xl shadow-sm transition-all disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>

              <div className="text-center pt-2 border-t border-[#E3DCD3]">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs text-[#7A7065] hover:text-[#2A231C] font-semibold cursor-pointer"
                >
                  ← Back to Log in
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerAuthModal;

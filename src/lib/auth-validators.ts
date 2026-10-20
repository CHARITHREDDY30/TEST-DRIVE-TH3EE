import type { PasswordStrengthResult } from '../types/auth';

/**
 * Validates email format with standard email pattern.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  // Safe, well-tested regex for email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Analyzes password strength and tests against security criteria:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number or symbol
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const p = password || '';
  const feedback: string[] = [];

  const minLength = p.length >= 8;
  const hasUppercase = /[A-Z]/.test(p);
  const hasLowercase = /[a-z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecial = /[^A-Za-z0-9]/.test(p);
  const hasNumberOrSpecial = hasNumber || hasSpecial;

  if (!minLength) {
    feedback.push('Must be at least 8 characters');
  }
  if (!hasUppercase) {
    feedback.push('Must include at least one uppercase letter (A-Z)');
  }
  if (!hasLowercase) {
    feedback.push('Must include at least one lowercase letter (a-z)');
  }
  if (!hasNumberOrSpecial) {
    feedback.push('Must include at least one number (0-9) or symbol');
  }

  // Calculate score (0-4)
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber && hasSpecial) score++;
  else if (hasNumberOrSpecial) score = Math.max(score, 1);

  // Normalize score to 0..4
  score = Math.min(4, Math.max(0, score));
  if (!minLength) score = Math.min(score, 1);

  let level: PasswordStrengthResult['level'] = 'Weak';
  if (score >= 4) level = 'Strong';
  else if (score === 3) level = 'Good';
  else if (score === 2) level = 'Fair';
  else level = 'Weak';

  // Valid if minimum 8 chars, uppercase, lowercase, and number/symbol
  const isValid = minLength && hasUppercase && hasLowercase && hasNumberOrSpecial;

  return {
    isValid,
    score,
    level,
    feedback,
    meetsRequirements: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial
    }
  };
}

/**
 * Sanitizes and normalizes phone number (supports Indian 10-digit mobile)
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; normalized: string; error?: string } {
  if (!phone || !phone.trim()) {
    return { isValid: false, normalized: '', error: 'Phone number is required' };
  }
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  // Match +91 or 0 prefix or plain 10-digit
  const match = clean.match(/^(?:\+91|0)?([6-9]\d{9})$/);
  if (!match) {
    return {
      isValid: false,
      normalized: clean,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)'
    };
  }
  return { isValid: true, normalized: match[1] };
}

/**
 * Sanitizes input to protect against injection/XSS in display labels
 */
export function sanitizeString(val: string): string {
  if (!val) return '';
  return val.trim().replace(/[<>]/g, '');
}

/**
 * Centralized, Customer-Facing Safe Error Handler
 *
 * Requirements:
 * - Customers must never see raw technical errors, internal infrastructure details,
 *   stack traces, SQL statements, database error codes, tokens, or deployment IDs.
 * - Map technical failures to consistent, reassuring TH3EE customer messages.
 */

export type CustomerErrorCategory = '404' | '500' | '503' | 'network' | 'auth' | 'unknown';

export interface CustomerFriendlyError {
  category: CustomerErrorCategory;
  headline: string;
  message: string;
}

/**
 * Classifies an unknown error into a customer-friendly category without exposing technical details.
 */
export function classifyError(error: unknown): CustomerErrorCategory {
  if (!error) return 'unknown';

  const errStr = typeof error === 'string'
    ? error
    : (error as any)?.message || (error as any)?.error_description || (error as any)?.error || '';
  const errLower = errStr.toLowerCase();
  const status = Number((error as any)?.status || (error as any)?.statusCode || 0);

  if (status === 404 || errLower.includes('not found') || errLower.includes('not_found') || errLower.includes('no rows')) {
    return '404';
  }

  if (status === 503 || status === 502 || status === 504 || errLower.includes('service unavailable') || errLower.includes('bad gateway') || errLower.includes('gateway timeout')) {
    return '503';
  }

  if (
    errLower.includes('network') ||
    errLower.includes('failed to fetch') ||
    errLower.includes('fetch failed') ||
    errLower.includes('offline') ||
    errLower.includes('timeout') ||
    errLower.includes('abort') ||
    errLower.includes('connection refused')
  ) {
    return 'network';
  }

  if (
    status === 401 ||
    status === 403 ||
    errLower.includes('jwt') ||
    errLower.includes('token expired') ||
    errLower.includes('session expired') ||
    errLower.includes('unauthorized') ||
    errLower.includes('invalid credentials')
  ) {
    return 'auth';
  }

  if (status >= 500) {
    return '500';
  }

  return 'unknown';
}

/**
 * Generates a customer-facing safe headline and message for an error.
 */
export function getCustomerFriendlyError(error: unknown, fallbackMessage?: string): CustomerFriendlyError {
  const category = classifyError(error);

  switch (category) {
    case '404':
      return {
        category,
        headline: 'Drop Not Found',
        message: "This page couldn't be found. Explore the latest TH3EE drops."
      };
    case '503':
      return {
        category,
        headline: 'Temporary Service Notice',
        message: "We're experiencing a temporary issue. Please try again shortly."
      };
    case 'network':
      return {
        category,
        headline: 'Connection Issue',
        message: 'Network connection issue. Please check your internet connection and try again.'
      };
    case 'auth':
      return {
        category,
        headline: 'Session Notice',
        message: 'Your session has expired or requires authentication. Please sign in again.'
      };
    case '500':
    case 'unknown':
    default:
      return {
        category,
        headline: 'Something Went Wrong',
        message: fallbackMessage || 'Something went wrong. Please try again.'
      };
  }
}

/**
 * Sanitizes any error message intended for user notification toasts or banners.
 * Strips technical jargon, database errors, SQL traces, headers, and secrets.
 */
export function sanitizeCustomerErrorMessage(error: unknown, fallbackMessage?: string): string {
  if (!error) return fallbackMessage || 'Something went wrong. Please try again.';

  const raw = typeof error === 'string'
    ? error
    : (error as any)?.message || (error as any)?.error_description || (error as any)?.error || '';

  if (!raw || typeof raw !== 'string') {
    return fallbackMessage || 'Something went wrong. Please try again.';
  }

  const rawLower = raw.toLowerCase();

  // Strip database / SQL / Supabase / InsForge technical errors
  const isTechnicalLeak =
    rawLower.includes('pgrst') ||
    rawLower.includes('relation "') ||
    rawLower.includes('column "') ||
    rawLower.includes('syntax error') ||
    rawLower.includes('violates') ||
    rawLower.includes('foreign key') ||
    rawLower.includes('select ') ||
    rawLower.includes('insert ') ||
    rawLower.includes('update ') ||
    rawLower.includes('null value in column') ||
    rawLower.includes('insforge') ||
    rawLower.includes('supabase') ||
    rawLower.includes('vercel') ||
    rawLower.includes('bearer ') ||
    rawLower.includes('stack trace');

  if (isTechnicalLeak) {
    return fallbackMessage || "We're experiencing a temporary issue. Please try again shortly.";
  }

  // Map known categories
  const friendly = getCustomerFriendlyError(error, fallbackMessage);
  return friendly.message;
}

/**
 * Sets up global listeners for uncaught errors and unhandled promise rejections.
 * Prevents screen blanking and avoids displaying raw exception alerts to customers.
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    // Avoid logging sensitive tokens or passwords
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Sanitized global application notice:', event.message);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    // Prevent unhandled promise rejections from crashing the view
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Handled async rejection notice');
    }
    // Prevent default browser popup if supported
    event.preventDefault?.();
  });
}

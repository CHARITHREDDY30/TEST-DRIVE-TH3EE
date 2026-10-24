import React, { Component, type ReactNode } from 'react';
import { getCustomerFriendlyError, type CustomerFriendlyError } from '../../lib/errorHandler';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: CustomerFriendlyError | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const customerError = getCustomerFriendlyError(error);
    return {
      hasError: true,
      errorInfo: customerError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Sanitized private logging (no credentials or tokens logged)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('App Error Boundary caught render exception:', error?.message);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleNavigateHome = () => {
    this.setState({ hasError: false, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleNavigateShop = () => {
    this.setState({ hasError: false, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/shop';
    }
  };

  handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      this.handleNavigateHome();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { headline, message } = this.state.errorInfo || {
        headline: 'Something Went Wrong',
        message: 'Something went wrong. Please try again.'
      };

      return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-16 font-mono text-neutral-900 selection:bg-[#FF3131] selection:text-white">
          <div className="max-w-md w-full bg-white border-2 border-neutral-900 p-8 sm:p-12 shadow-2xl text-center space-y-6">
            {/* Brand Red Header Pill */}
            <div className="inline-block bg-[#E51E2B] text-white text-[10px] sm:text-xs font-mono font-bold px-3 py-1 uppercase tracking-widest">
              TH3EE Atelier // Notice
            </div>

            {/* Error Graphic / Icon */}
            <div className="w-16 h-16 mx-auto bg-neutral-100 border border-neutral-300 rounded-full flex items-center justify-center text-neutral-900">
              <svg className="w-8 h-8 text-[#E51E2B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Customer Message */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight font-poppins">
                {headline}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
                {message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3.5 bg-neutral-900 hover:bg-[#E51E2B] text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-md cursor-pointer"
              >
                Try Again
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={this.handleNavigateShop}
                  className="py-2.5 bg-white border border-neutral-300 hover:border-black text-neutral-900 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Explore Drops
                </button>
                <button
                  type="button"
                  onClick={this.handleGoBack}
                  className="py-2.5 bg-white border border-neutral-300 hover:border-black text-neutral-900 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Go Back
                </button>
              </div>

              <button
                type="button"
                onClick={this.handleNavigateHome}
                className="w-full py-2 text-[11px] text-neutral-500 hover:text-black uppercase tracking-wider font-mono cursor-pointer transition-colors"
              >
                ← Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

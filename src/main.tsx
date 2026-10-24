import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { setupGlobalErrorHandling } from './lib/errorHandler';
import './index.css';

// Set up global error safety listeners
setupGlobalErrorHandling();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root was not found.');

createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  </React.StrictMode>,
);


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  classifyError,
  getCustomerFriendlyError,
  sanitizeCustomerErrorMessage
} from '../src/lib/errorHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('TH3EE — ROUTING, REFRESH & SECURITY HARDENING TEST SUITE');
  console.log('======================================================\n');

  // -------------------------------------------------------------------
  // SECTION 1: VERCEL.JSON CONFIGURATION AUDIT
  // -------------------------------------------------------------------
  console.log('--- 1. Vercel Configuration & Routing Rewrite Audit ---');
  const vercelJsonPath = path.resolve(rootDir, 'vercel.json');
  assert(fs.existsSync(vercelJsonPath), 'vercel.json exists in root directory');

  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  assert(vercelConfig.cleanUrls !== true, 'cleanUrls is NOT true (prevents 404 rewrite collision on Vercel)');
  assert(Array.isArray(vercelConfig.rewrites) && vercelConfig.rewrites.length > 0, 'rewrites array configured');

  const catchAllRewrite = vercelConfig.rewrites.find(
    (r: any) => r.source === '/(.*)' && r.destination === '/index.html'
  );
  assert(Boolean(catchAllRewrite), 'Catch-all SPA rewrite /(.*) -> /index.html is configured');

  const allHeaders = vercelConfig.headers || [];
  const rootHeader = allHeaders.find((h: any) => h.source === '/(.*)');
  assert(Boolean(rootHeader), 'Security headers applied to all routes /(.*)');

  const headerKeys = (rootHeader?.headers || []).map((h: any) => h.key);
  assert(headerKeys.includes('X-Content-Type-Options'), 'nosniff header configured');
  assert(headerKeys.includes('X-Frame-Options'), 'X-Frame-Options configured');
  assert(headerKeys.includes('Strict-Transport-Security'), 'HSTS configured');
  assert(headerKeys.includes('Content-Security-Policy'), 'CSP configured');

  // -------------------------------------------------------------------
  // SECTION 2: PHYSICAL ROUTE PRE-RENDERING & REFRESH IMMUNITY
  // -------------------------------------------------------------------
  console.log('\n--- 2. Direct Navigation & Route Refresh Pre-render Verification ---');
  const requiredPhysicalRoutes = [
    'bag',
    'cart',
    'profile',
    'account',
    'checkout',
    'orders',
    'track',
    'order-tracking',
    'loyalty',
    'login',
    'register',
    'signup',
    'shop',
    'custom-dtf',
    'about',
    'delivery-partner',
    'verify-pass',
    'verify-email',
    'forgot-password',
    'reset-password'
  ];

  for (const route of requiredPhysicalRoutes) {
    const routeIndexPath = path.resolve(distDir, route, 'index.html');
    assert(
      fs.existsSync(routeIndexPath),
      `dist/${route}/index.html exists for direct refresh immunity`
    );
    const content = fs.readFileSync(routeIndexPath, 'utf-8');
    assert(content.includes('<div id="root"></div>'), `dist/${route}/index.html contains root container`);
  }

  // Check 404.html
  const dist404Path = path.resolve(distDir, '404.html');
  assert(fs.existsSync(dist404Path), 'dist/404.html exists for custom Vercel edge error handling');
  const html404 = fs.readFileSync(dist404Path, 'utf-8');
  assert(html404.includes("This page couldn't be found"), 'dist/404.html contains customer-friendly copy');
  assert(!html404.includes('NOT_FOUND\n\nbom1'), 'dist/404.html contains no raw deployment debug IDs');
  assert(html404.includes('/shop'), 'dist/404.html provides link to explore drops');

  // -------------------------------------------------------------------
  // SECTION 3: CENTRALIZED CUSTOMER ERROR HANDLING AUDIT
  // -------------------------------------------------------------------
  console.log('\n--- 3. Centralized Customer Error Sanitization & Hiding Technical Details ---');

  // Test 404 error
  const err404 = { status: 404, message: 'Resource not found' };
  assert(classifyError(err404) === '404', 'classifyError correctly identifies 404');
  assert(
    sanitizeCustomerErrorMessage(err404) === "This page couldn't be found. Explore the latest TH3EE drops.",
    '404 maps to friendly drop message'
  );

  // Test 503 error
  const err503 = { status: 503, message: 'Service Unavailable' };
  assert(classifyError(err503) === '503', 'classifyError correctly identifies 503');
  assert(
    sanitizeCustomerErrorMessage(err503) === "We're experiencing a temporary issue. Please try again shortly.",
    '503 maps to temporary service notice'
  );

  // Test network error
  const errNetwork = new Error('Failed to fetch from backend');
  assert(classifyError(errNetwork) === 'network', 'classifyError correctly identifies network failure');
  assert(
    sanitizeCustomerErrorMessage(errNetwork) === 'Network connection issue. Please check your internet connection and try again.',
    'Network error maps to connection issue notice'
  );

  // Test auth / expired session error
  const errAuth = { status: 401, message: 'JWT expired' };
  assert(classifyError(errAuth) === 'auth', 'classifyError correctly identifies auth expiration');
  assert(
    sanitizeCustomerErrorMessage(errAuth) === 'Your session has expired or requires authentication. Please sign in again.',
    'Auth expiration maps to session notice'
  );

  // Test SQL injection / database error leakage scrub
  const rawDbError = 'PGRST116: relation "public.orders" violates foreign key constraint on table "customers"';
  const scrubbedMsg = sanitizeCustomerErrorMessage(rawDbError);
  assert(!scrubbedMsg.includes('PGRST'), 'PGRST code scrubbed from user message');
  assert(!scrubbedMsg.includes('foreign key'), 'foreign key terminology scrubbed');
  assert(!scrubbedMsg.includes('public.orders'), 'internal table name scrubbed');
  assert(scrubbedMsg === "We're experiencing a temporary issue. Please try again shortly.", 'DB error scrubbed to safe message');

  // -------------------------------------------------------------------
  // SECTION 4: PRODUCTION BUILD & SECURITY CONFIGURATION AUDIT
  // -------------------------------------------------------------------
  console.log('\n--- 4. Production Build & Secret Leak Audit ---');

  const viteConfigPath = path.resolve(rootDir, 'vite.config.ts');
  const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');
  assert(viteConfigContent.includes('sourcemap: false'), 'Vite production sourcemap disabled to prevent source leak');

  const razorpayServicePath = path.resolve(rootDir, 'src/services/razorpay.service.ts');
  const rzpContent = fs.readFileSync(razorpayServicePath, 'utf-8');
  assert(
    rzpContent.includes('data.verified === false'),
    'razorpayService strictly rejects payments if server-side signature verification fails'
  );
  assert(
    !rzpContent.includes('key_secret = "rzp_'),
    'razorpayService does not contain hardcoded key secrets'
  );

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: 0`);
  console.log('======================================================\n');
  console.log('ALL ROUTING, REFRESH, ERROR HANDLING & SECURITY FIXES VERIFIED!\n');
}

runTests().catch((err) => {
  console.error('\n✖ Test suite encountered an error:', err);
  process.exit(1);
});

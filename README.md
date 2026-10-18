# TH3EE Storefront — Backend Rebuild (Phase 1)

This project contains the production storefront for **TH3EE** (https://th3ee.in), built with React, Vite, TypeScript, and Tailwind CSS.

In **Phase 1**, all legacy fake persistence, mock orders, and hardcoded admin authentication were removed and replaced with a clean backend integration foundation prepared for a new InsForge project, Cloudflare R2 image storage, and Razorpay payments.

## Deployment Target
- **Hosting:** GitHub + Vercel
- **Backend:** InsForge Project
- **CDN / Storage:** Cloudflare R2
- **Payments:** Razorpay
- **Development Branch:** `backend-rebuild`
- **Production Baseline:** `main` (kept untouched)

## Architecture & Service Layer
The storefront communicates through modular services located in `src/services/`:
- `products.service.ts`: Queries InsForge `products` table with graceful fallback to `src/data/initialCatalog.ts`.
- `orders.service.ts`: Integrates with InsForge `orders` table; mock/demo orders removed.
- `hero.service.ts`: Manages dynamic hero banner slides via InsForge `hero_slides` table.
- `settings.service.ts`: Manages live store configuration and WhatsApp numbers via InsForge `store_settings`.
- `auth.service.ts`: Authenticates administrators using InsForge Auth without hardcoded credentials or backdoor bypasses.
- `src/lib/r2.ts`: Resolves Cloudflare R2 image assets with configurable public base URL.

## Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your project variables:
```env
VITE_INSFORGE_URL=https://your-project.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=eyJhbGciOi...
VITE_R2_PUBLIC_BASE_URL=https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

> **Security Note:** Only anonymous public keys belong in `VITE_*` frontend environment variables. Never expose InsForge service/API keys, database passwords, or Razorpay secret keys (`key_secret`) in frontend bundles.

## Scripts
```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run TypeScript typecheck
npm run typecheck

# Production build
npm run build

# Preview build locally
npm run preview
```
